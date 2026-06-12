import net from "node:net";
import tls from "node:tls";

function requireSmtpConfig() {
  const config = {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    secure: String(process.env.SMTP_SECURE || "").toLowerCase() === "true",
  };

  const missing = [];
  if (!config.host) missing.push("SMTP_HOST");
  if (!config.user) missing.push("SMTP_USER");
  if (!config.pass) missing.push("SMTP_PASS");
  if (!config.from) missing.push("SMTP_FROM");
  if (!Number.isInteger(config.port) || config.port <= 0) missing.push("SMTP_PORT");

  if (missing.length) {
    const err = new Error(
      `Email service is not configured. Set ${missing.join(", ")} in the backend environment.`,
    );
    err.code = "EMAIL_NOT_CONFIGURED";
    throw err;
  }

  return config;
}

function encodeHeader(value) {
  return String(value || "")
    .replace(/[\r\n]+/g, " ")
    .trim();
}

function escapeAddress(address) {
  return `<${String(address).replace(/[<>\r\n]/g, "").trim()}>`;
}

function smtpEnvelopeAddress(address) {
  const value = String(address || "").trim();
  const angleMatch = value.match(/<([^<>]+)>/);
  return angleMatch?.[1]?.trim() || value;
}

function dotStuff(message) {
  return message.replace(/^\./gm, "..");
}

function createEmail({ from, to, subject, message, ticket }) {
  const submitted = ticket
    ? [
        `Ticket: ${ticket.id}`,
        `Customer: ${ticket.name || "-"}`,
        `Submitted message:`,
        ticket.message || "-",
      ].join("\n")
    : "";

  const body = [
    `Hello ${ticket?.name || ""}`.trim() + ",",
    "",
    message,
    "",
    "Regards,",
    "Mwaslaty Support",
    "",
    submitted ? "--- Original request ---" : "",
    submitted,
  ]
    .filter((line, index, lines) => line || lines[index - 1])
    .join("\n");

  return [
    `From: ${encodeHeader(from)}`,
    `To: ${encodeHeader(to)}`,
    `Subject: ${encodeHeader(subject)}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
    `Date: ${new Date().toUTCString()}`,
    "",
    body,
  ].join("\r\n");
}

function connectSocket(config) {
  return new Promise((resolve, reject) => {
    const options = {
      host: config.host,
      port: config.port,
      servername: config.host,
    };
    const socket = config.secure || config.port === 465
      ? tls.connect(options, () => resolve(socket))
      : net.connect(options, () => resolve(socket));

    socket.setTimeout(20000);
    socket.once("error", reject);
    socket.once("timeout", () => {
      socket.destroy();
      reject(new Error("SMTP connection timed out"));
    });
  });
}

class SmtpClient {
  constructor(socket) {
    this.socket = socket;
    this.buffer = "";
    this.pending = [];

    socket.on("data", (chunk) => {
      this.buffer += chunk.toString("utf8");
      this.flush();
    });
    socket.on("error", (err) => {
      while (this.pending.length) this.pending.shift().reject(err);
    });
  }

  flush() {
    const lines = this.buffer.split(/\r?\n/);
    this.buffer = lines.pop() || "";

    for (const line of lines) {
      const pending = this.pending[0];
      if (!pending) continue;
      pending.lines.push(line);
      if (/^\d{3} /.test(line)) {
        this.pending.shift();
        const code = Number(line.slice(0, 3));
        const text = pending.lines.join("\n");
        if (pending.accept.includes(code)) pending.resolve({ code, text });
        else pending.reject(new Error(`SMTP command failed: ${text}`));
      }
    }
  }

  read(accept = [250]) {
    return new Promise((resolve, reject) => {
      this.pending.push({ accept, resolve, reject, lines: [] });
      this.flush();
    });
  }

  command(command, accept = [250]) {
    this.socket.write(`${command}\r\n`);
    return this.read(accept);
  }

  close() {
    this.socket.end();
  }
}

async function upgradeToTls(client, config) {
  await client.command("STARTTLS", [220]);
  const oldSocket = client.socket;
  oldSocket.removeAllListeners("data");
  oldSocket.removeAllListeners("error");
  const secureSocket = tls.connect({
    socket: oldSocket,
    servername: config.host,
  });
  await new Promise((resolve, reject) => {
    secureSocket.once("secureConnect", resolve);
    secureSocket.once("error", reject);
  });
  return new SmtpClient(secureSocket);
}

function base64(value) {
  return Buffer.from(String(value), "utf8").toString("base64");
}

export async function sendSupportReply({ to, subject, message, ticket }) {
  const config = requireSmtpConfig();
  let client;

  try {
    const socket = await connectSocket(config);
    client = new SmtpClient(socket);
    await client.read([220]);
    await client.command(`EHLO ${process.env.SMTP_EHLO_DOMAIN || "mwaslaty.local"}`);

    if (!config.secure && config.port !== 465) {
      client = await upgradeToTls(client, config);
      await client.command(`EHLO ${process.env.SMTP_EHLO_DOMAIN || "mwaslaty.local"}`);
    }

    await client.command(`AUTH PLAIN ${base64(`\u0000${config.user}\u0000${config.pass}`)}`, [235]);
    await client.command(`MAIL FROM:${escapeAddress(smtpEnvelopeAddress(config.from))}`);
    await client.command(`RCPT TO:${escapeAddress(to)}`, [250, 251]);
    await client.command("DATA", [354]);
    client.socket.write(`${dotStuff(createEmail({ from: config.from, to, subject, message, ticket }))}\r\n.\r\n`);
    await client.read([250]);
    await client.command("QUIT", [221]).catch(() => null);
  } catch (err) {
    if (err?.code === "EMAIL_NOT_CONFIGURED") throw err;
    const wrapped = new Error(`Failed to send support reply email: ${err.message}`);
    wrapped.code = "EMAIL_SEND_FAILED";
    throw wrapped;
  } finally {
    client?.close();
  }
}
