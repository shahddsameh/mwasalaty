import { liveQuery } from "dexie";
import { from, useObservable } from "@vueuse/rxjs";
import { db, type OfflineTicket } from "@/db/appDb";

export function useTickets(ticketId?: string) {
  const tickets = useObservable(
    from(
      liveQuery(() =>
        ticketId
          ? db.tickets.where("ticketId").equals(ticketId).toArray()
          : db.tickets.orderBy("savedAt").reverse().toArray(),
      ),
    ),
    { initialValue: [] as OfflineTicket[] },
  );

  return {
    tickets,
    saveTicketOffline: (ticket: OfflineTicket) => db.tickets.put(ticket),
    removeTicket: (id: string) => db.tickets.delete(id),
    clearTickets: () => db.tickets.clear(),
  };
}
