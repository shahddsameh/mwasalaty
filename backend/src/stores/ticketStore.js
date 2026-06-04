const tickets = new Map();

export function saveTicket(ticket) {
  tickets.set(ticket.ticketId, ticket);
}

export function getTicket(ticketId) {
  return tickets.get(ticketId) ?? null;
}

export function updateTicket(ticket) {
  tickets.set(ticket.ticketId, ticket);
}
