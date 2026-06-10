const listenersByTicketId = new Map();

export function publishTicketUpdate(ticket) {
  const listeners = listenersByTicketId.get(ticket.ticketId);
  if (!listeners) return;
  for (const listener of listeners) listener(ticket);
}

export function subscribeToTicket(ticketId, listener) {
  const listeners = listenersByTicketId.get(ticketId) ?? new Set();
  listeners.add(listener);
  listenersByTicketId.set(ticketId, listeners);

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) listenersByTicketId.delete(ticketId);
  };
}
