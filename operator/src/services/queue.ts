import { get, set } from "idb-keyval";
import type { TicketQrPayload } from "@/services/api";
import type { Outcome } from "@/services/outcome";

const QUEUE_KEY = "mwasalaty-op:queue";

export type QueuedScan = {
  id: string;
  payload: TicketQrPayload;
  scannerProfileId: string;
  scannedAt: string;
  syncState: "pending" | "synced" | "failed";
  reconciledOutcome: Outcome | null;
  discrepancy: boolean;
};

export type QueueStorage = {
  get(): Promise<QueuedScan[]>;
  set(scans: QueuedScan[]): Promise<void>;
};

const idbStorage: QueueStorage = {
  async get() {
    return (await get<QueuedScan[]>(QUEUE_KEY)) ?? [];
  },
  async set(scans) {
    await set(QUEUE_KEY, scans);
  }
};

let storage: QueueStorage = idbStorage;

function createId() {
  return crypto.randomUUID?.() ?? `queue_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function isDiscrepancy(outcome: Outcome) {
  return outcome === "already_used" || outcome === "invalid";
}

export function setQueueStorageForTests(next: QueueStorage): void {
  storage = next;
}

export function resetQueueStorage(): void {
  storage = idbStorage;
}

export async function enqueue(
  payload: TicketQrPayload,
  scannerProfileId: string
): Promise<QueuedScan> {
  const scans = await storage.get();
  const scan: QueuedScan = {
    id: createId(),
    payload,
    scannerProfileId,
    scannedAt: new Date().toISOString(),
    syncState: "pending",
    reconciledOutcome: null,
    discrepancy: false
  };
  await storage.set([...scans, scan]);
  window.dispatchEvent(new CustomEvent("mwasalaty-op:queue-change"));
  return scan;
}

export async function list(): Promise<QueuedScan[]> {
  return storage.get();
}

export async function count(): Promise<number> {
  return (await list()).filter((scan) => scan.syncState !== "synced").length;
}

export async function markSynced(
  id: string,
  reconciledOutcome: Outcome,
  discrepancy = isDiscrepancy(reconciledOutcome)
): Promise<QueuedScan | null> {
  const scans = await storage.get();
  let updated: QueuedScan | null = null;
  const next = scans.map((scan) => {
    if (scan.id !== id) return scan;
    updated = {
      ...scan,
      syncState: "synced" as const,
      reconciledOutcome,
      discrepancy
    };
    return updated;
  });
  await storage.set(next);
  window.dispatchEvent(new CustomEvent("mwasalaty-op:queue-change"));
  return updated;
}

export async function markFailed(id: string): Promise<QueuedScan | null> {
  const scans = await storage.get();
  let updated: QueuedScan | null = null;
  const next = scans.map((scan) => {
    if (scan.id !== id) return scan;
    updated = { ...scan, syncState: "failed" as const };
    return updated;
  });
  await storage.set(next);
  window.dispatchEvent(new CustomEvent("mwasalaty-op:queue-change"));
  return updated;
}

export async function remove(id: string): Promise<void> {
  const scans = await storage.get();
  await storage.set(scans.filter((scan) => scan.id !== id));
  window.dispatchEvent(new CustomEvent("mwasalaty-op:queue-change"));
}
