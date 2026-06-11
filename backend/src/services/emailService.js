export async function sendSupportReply({ to, subject, message }) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    const err = new Error('Email service is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS.');
    err.code = 'EMAIL_NOT_CONFIGURED';
    throw err;
  }

  console.warn('[emailService] SMTP send is not implemented yet.', { to, subject, messageLength: message?.length ?? 0 });
  const err = new Error('Email provider integration is not implemented yet.');
  err.code = 'EMAIL_NOT_CONFIGURED';
  throw err;
}
