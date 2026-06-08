// In-memory store for support tickets
const tickets = new Map();

// Demo support tickets
const demoTickets = [
  {
    id: "ticket_001",
    name: "Ahmed Hassan",
    email: "ahmed@example.com",
    phone: "+20 123 456 7890",
    subject: "Cannot scan ticket QR code",
    message:
      "I'm having trouble scanning my ticket QR code with the app. The camera seems to not recognize the QR code properly.",
    status: "new",
    priority: "high",
    adminNote: "",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "ticket_002",
    name: "Fatima Al-Zahra",
    email: "fatima@example.com",
    phone: "+20 098 765 4321",
    subject: "Refund request",
    message:
      "I would like to request a refund for my unused ticket. I purchased it but had to cancel my trip.",
    status: "in_progress",
    priority: "normal",
    adminNote:
      "Processed refund on 2025-06-07. Customer will receive refund within 3-5 business days.",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "ticket_003",
    name: "Mohammed Ibrahim",
    email: "mohammed@example.com",
    subject: "Feature suggestion - Dark mode",
    message:
      "It would be great to have a dark mode option in the app for better visibility at night.",
    status: "resolved",
    priority: "low",
    adminNote: "Feature request noted. Will be considered in next release.",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// Initialize with demo tickets
demoTickets.forEach((ticket) => {
  tickets.set(ticket.id, ticket);
});

export function saveTicket(ticket) {
  tickets.set(ticket.id, { ...ticket });
  return tickets.get(ticket.id);
}

export function getTicket(id) {
  return tickets.get(id);
}

export function getAllTickets() {
  return Array.from(tickets.values());
}

export function updateTicket(id, updates) {
  const ticket = tickets.get(id);
  if (!ticket) return null;
  const updated = {
    ...ticket,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  tickets.set(id, updated);
  return updated;
}

export function deleteTicket(id) {
  return tickets.delete(id);
}
