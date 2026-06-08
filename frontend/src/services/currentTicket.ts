import type { Ticket } from "@/services/api";

const CURRENT_TICKET_KEY = "mwasalaty:current-ticket";

export function readCurrentTicket(): Ticket | null {
  try {
    const raw = sessionStorage.getItem(CURRENT_TICKET_KEY);
    return raw ? (JSON.parse(raw) as Ticket) : null;
  } catch {
    return null;
  }
}

export function storeCurrentTicket(ticket: Ticket): void {
  try {
    sessionStorage.setItem(CURRENT_TICKET_KEY, JSON.stringify(ticket));
  } catch {
    // Storage can be unavailable in private mode or if the quota is exceeded.
  }
}
