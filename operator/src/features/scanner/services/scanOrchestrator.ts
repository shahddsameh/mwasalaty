import type { ScannerProfile } from "@/services/api";
import { ApiError, type TicketQrPayload, scanValidate } from "@/services/api";
import { enqueue } from "@/services/queue";
import { incrementTally } from "@/services/session";
import {
  createLocalInvalidOutcome,
  createUnverifiedOutcome,
  isTicketQrPayload,
  mapErrorToOutcome,
  mapResultToOutcome,
  type ScanOutcome
} from "@/services/outcome";
import { setLatestOutcome } from "@/features/results/resultStore";

function parsePayload(text: string): TicketQrPayload | null {
  try {
    const value = JSON.parse(text) as unknown;
    return isTicketQrPayload(value) ? value : null;
  } catch {
    return null;
  }
}

function storeOutcome(outcome: ScanOutcome): ScanOutcome {
  incrementTally(outcome.kind);
  setLatestOutcome(outcome);
  return outcome;
}

export async function handleDecodedText(
  text: string,
  profile: ScannerProfile,
  isOnline = navigator.onLine
): Promise<ScanOutcome> {
  const payload = parsePayload(text);
  if (!payload) {
    return storeOutcome(createLocalInvalidOutcome("Not a valid Mwasalaty ticket."));
  }

  if (!isOnline) {
    const queued = await enqueue(payload, profile.scannerProfileId);
    return storeOutcome(createUnverifiedOutcome(payload, { queueId: queued.id }));
  }

  try {
    const result = await scanValidate(payload, profile.scannerProfileId);
    return storeOutcome(mapResultToOutcome(result));
  } catch (error) {
    if (error instanceof ApiError && error.code === "NETWORK_ERROR") {
      const queued = await enqueue(payload, profile.scannerProfileId);
      return storeOutcome(createUnverifiedOutcome(payload, { queueId: queued.id }));
    }
    if (error instanceof ApiError) {
      return storeOutcome(mapErrorToOutcome(error));
    }
    throw error;
  }
}
