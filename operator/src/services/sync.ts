import { subscribeOnOnline } from "@/composables/useOnline";
import { scanValidate } from "@/services/api";
import { list, markFailed, markSynced } from "@/services/queue";
import { mapErrorToOutcome, mapResultToOutcome } from "@/services/outcome";
import { ApiError } from "@/services/api";

let installed = false;

export async function syncQueue(): Promise<void> {
  const scans = await list();
  const candidates = scans.filter((scan) => scan.syncState === "pending" || scan.syncState === "failed");

  for (const scan of candidates) {
    try {
      const result = await scanValidate(scan.payload, scan.scannerProfileId);
      const outcome = mapResultToOutcome(result);
      await markSynced(scan.id, outcome.kind);
    } catch (error) {
      if (error instanceof ApiError) {
        const outcome = mapErrorToOutcome(error);
        await markSynced(scan.id, outcome.kind);
        continue;
      }
      await markFailed(scan.id);
      break;
    }
  }
}

export function installSyncOnReconnect(): void {
  if (installed) return;
  installed = true;
  subscribeOnOnline(syncQueue);
}
