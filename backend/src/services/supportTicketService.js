import {
  getAllTickets,
  getTicket,
  updateTicket,
  saveTicket,
} from "../stores/supportTicketStore.js";

/**
 * Get all support tickets
 */
export async function getSupportTickets() {
  return getAllTickets();
}

/**
 * Get a specific support ticket by ID
 */
export async function getSupportTicketById(id) {
  const ticket = getTicket(id);
  if (!ticket) {
    const err = new Error("Support ticket not found");
    err.code = "NOT_FOUND";
    throw err;
  }
  return ticket;
}

/**
 * Update a support ticket status or admin note
 */
export async function updateSupportTicketData(id, updates) {
  const ticket = getTicket(id);
  if (!ticket) {
    const err = new Error("Support ticket not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  // Validate status if provided
  if (updates.status) {
    const validStatuses = ["new", "in_progress", "resolved", "closed"];
    if (!validStatuses.includes(updates.status)) {
      const err = new Error(`Invalid status: ${updates.status}`);
      err.code = "VALIDATION_ERROR";
      throw err;
    }
  }

  // Validate priority if provided
  if (updates.priority) {
    const validPriorities = ["low", "normal", "high", "urgent"];
    if (!validPriorities.includes(updates.priority)) {
      const err = new Error(`Invalid priority: ${updates.priority}`);
      err.code = "VALIDATION_ERROR";
      throw err;
    }
  }

  return updateTicket(id, updates);
}

/**
 * Create a new support ticket from user submission
 */
export async function createSupportTicket(data) {
  // Validate required fields
  if (!data.name || !data.name.trim()) {
    const err = new Error("Name is required");
    err.code = "VALIDATION_ERROR";
    throw err;
  }
  if (!data.email || !data.email.trim()) {
    const err = new Error("Email is required");
    err.code = "VALIDATION_ERROR";
    throw err;
  }
  if (!data.message || !data.message.trim()) {
    const err = new Error("Message is required");
    err.code = "VALIDATION_ERROR";
    throw err;
  }

  // Validate email format (basic check)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email.trim())) {
    const err = new Error("Invalid email format");
    err.code = "VALIDATION_ERROR";
    throw err;
  }

  // Create new ticket
  const ticket = {
    id: `ticket_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: data.name.trim(),
    email: data.email.trim(),
    phone: data.phone?.trim() || undefined,
    subject: data.subject?.trim() || undefined,
    message: data.message.trim(),
    status: "new",
    priority: "normal",
    adminNote: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return saveTicket(ticket);
}
