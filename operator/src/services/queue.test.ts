import type { TicketQrPayload } from "@/services/api";
import {
  enqueue,
  list,
  markSynced,
  resetQueueStorage,
  setQueueStorageForTests,
  type QueuedScan,
  type QueueStorage
} from "@/services/queue";

function clone(scans: QueuedScan[]) {
  return JSON.parse(JSON.stringify(scans)) as QueuedScan[];
}

function memoryStorage(seed: QueuedScan[] = []): QueueStorage {
  let scans = clone(seed);
  return {
    async get() {
      return clone(scans);
    },
    async set(next) {
      scans = clone(next);
    }
  };
}

const payload: TicketQrPayload = {
  ticketId: "ticket_123",
  type: "MWASALATY_MVP_TICKET",
  signature: "sig"
};

describe("offline queue", () => {
  afterEach(() => {
    resetQueueStorage();
  });

  it("enqueues a pending scan with a client scan timestamp", async () => {
    setQueueStorageForTests(memoryStorage());

    const scan = await enqueue(payload, "scanner_bus_001");

    expect(scan.syncState).toBe("pending");
    expect(scan.scannerProfileId).toBe("scanner_bus_001");
    expect(new Date(scan.scannedAt).toString()).not.toBe("Invalid Date");
    expect(await list()).toHaveLength(1);
  });

  it("marks reconciled valid scans without discrepancy", async () => {
    setQueueStorageForTests(memoryStorage());
    const scan = await enqueue(payload, "scanner_bus_001");

    const updated = await markSynced(scan.id, "valid");

    expect(updated?.syncState).toBe("synced");
    expect(updated?.reconciledOutcome).toBe("valid");
    expect(updated?.discrepancy).toBe(false);
  });

  it.each(["already_used", "invalid"] as const)(
    "flags %s reconciliation as a discrepancy",
    async (outcome) => {
      setQueueStorageForTests(memoryStorage());
      const scan = await enqueue(payload, "scanner_bus_001");

      const updated = await markSynced(scan.id, outcome);

      expect(updated?.discrepancy).toBe(true);
    }
  );

  it("survives a simulated reload by reading from durable storage", async () => {
    const durable = memoryStorage();
    setQueueStorageForTests(durable);
    await enqueue(payload, "scanner_bus_001");

    setQueueStorageForTests(durable);

    expect(await list()).toHaveLength(1);
  });
});
