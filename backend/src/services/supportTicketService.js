import { sendSupportReply } from './emailService.js';
import { getSupabaseAdminClient } from './supabaseClient.js';

const VALID_STATUSES = new Set(['new', 'in_progress', 'resolved', 'closed']);
const VALID_PRIORITIES = new Set(['low', 'normal', 'high', 'urgent']);

function validationError(message) {
  const err = new Error(message);
  err.code = 'VALIDATION_ERROR';
  return err;
}

function notFoundError() {
  const err = new Error('Support ticket not found');
  err.code = 'NOT_FOUND';
  return err;
}

function uuidOrNull(value) {
  const text = String(value || '');
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(text)
    ? text
    : null;
}

function mapReply(row) {
  return {
    id: row.id,
    supportTicketId: row.support_ticket_id,
    to: row.sent_to_email || '',
    subject: 'Mwasalaty support reply',
    message: row.admin_message || '',
    sentAt: row.created_at,
    emailSent: row.email_sent === true,
    adminEmail: row.admin_email || undefined,
    adminId: row.admin_id || undefined,
  };
}

function mapTicket(row, replies = []) {
  const raw = row.raw || {};
  const mappedReplies = replies.map(mapReply);
  const status = row.status === 'open' ? 'new' : (row.status || 'new');
  return {
    id: row.id,
    userId: row.user_id || raw.userId || undefined,
    name: raw.name || row.user_email || 'Customer',
    email: row.user_email || raw.email || '',
    phone: raw.phone || undefined,
    subject: row.subject || raw.subject || undefined,
    message: row.message || raw.message || '',
    status,
    priority: raw.priority || 'normal',
    adminNote: raw.adminNote || '',
    adminReply: row.admin_reply || mappedReplies.at(-1)?.message || undefined,
    repliedAt: row.replied_at || mappedReplies.at(-1)?.sentAt || undefined,
    replies: mappedReplies,
    createdAt: row.created_at,
    updatedAt: row.updated_at || row.created_at,
  };
}

async function loadReplies(ticketIds) {
  if (!ticketIds.length) return new Map();
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('support_ticket_replies')
    .select('*')
    .in('support_ticket_id', ticketIds)
    .order('created_at', { ascending: true });
  if (error) throw error;

  const grouped = new Map();
  for (const reply of data || []) {
    const list = grouped.get(reply.support_ticket_id) || [];
    list.push(reply);
    grouped.set(reply.support_ticket_id, list);
  }
  return grouped;
}

async function getTicketRow(id) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getSupportTickets() {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('support_tickets')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1000);
  if (error) throw error;

  const rows = data || [];
  const repliesByTicket = await loadReplies(rows.map((ticket) => ticket.id));
  return rows.map((ticket) => mapTicket(ticket, repliesByTicket.get(ticket.id) || []));
}

export async function getAdminNotifications() {
  const tickets = await getSupportTickets();
  const isOpen = (ticket) => ['new', 'in_progress', 'open'].includes(String(ticket.status || '').toLowerCase());
  const recentTickets = tickets.slice(0, 10);

  return {
    unreadCount: tickets.filter(isOpen).length,
    notifications: recentTickets.map((ticket) => ({
      id: ticket.id,
      type: 'support_ticket',
      title: ticket.subject || 'New support ticket',
      message: ticket.message || '',
      user_email: ticket.email || '',
      status: isOpen(ticket) ? 'open' : 'done',
      created_at: ticket.createdAt,
      targetUrl: '/admin/support',
    })),
  };
}

export async function getSupportTicketById(id) {
  const row = await getTicketRow(id);
  if (!row) throw notFoundError();
  const repliesByTicket = await loadReplies([row.id]);
  return mapTicket(row, repliesByTicket.get(row.id) || []);
}

export async function updateSupportTicketData(id, updates) {
  const existing = await getTicketRow(id);
  if (!existing) throw notFoundError();

  if (updates.status && !VALID_STATUSES.has(updates.status)) {
    throw validationError(`Invalid status: ${updates.status}`);
  }
  if (updates.priority && !VALID_PRIORITIES.has(updates.priority)) {
    throw validationError(`Invalid priority: ${updates.priority}`);
  }

  const raw = {
    ...(existing.raw || {}),
  };
  if (updates.adminNote !== undefined) raw.adminNote = updates.adminNote;
  if (updates.priority !== undefined) raw.priority = updates.priority;

  const payload = {
    updated_at: new Date().toISOString(),
    raw,
  };
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.adminReply !== undefined) payload.admin_reply = updates.adminReply;
  if (updates.repliedAt !== undefined) payload.replied_at = updates.repliedAt;

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('support_tickets')
    .update(payload)
    .eq('id', id)
    .select('*')
    .maybeSingle();
  if (error) throw error;
  if (!data) throw notFoundError();
  const repliesByTicket = await loadReplies([data.id]);
  return mapTicket(data, repliesByTicket.get(data.id) || []);
}

export async function createSupportTicket(data) {
  if (!data.name || !data.name.trim()) throw validationError('Name is required');
  if (!data.email || !data.email.trim()) throw validationError('Email is required');
  if (!data.message || !data.message.trim()) throw validationError('Message is required');

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email.trim())) throw validationError('Invalid email format');

  const now = new Date().toISOString();
  const row = {
    user_id: uuidOrNull(data.userId?.trim?.()),
    user_email: data.email.trim(),
    subject: data.subject?.trim() || null,
    message: data.message.trim(),
    status: 'new',
    admin_reply: null,
    replied_at: null,
    raw: {
      name: data.name.trim(),
      email: data.email.trim(),
      phone: data.phone?.trim() || undefined,
      subject: data.subject?.trim() || undefined,
      message: data.message.trim(),
      priority: 'normal',
      adminNote: '',
    },
    created_at: now,
    updated_at: now,
  };

  const supabase = getSupabaseAdminClient();
  const { data: created, error } = await supabase
    .from('support_tickets')
    .insert(row)
    .select('*')
    .single();
  if (error) throw error;
  return mapTicket(created, []);
}

export async function replyToSupportTicket(id, reply, admin = {}) {
  const ticket = await getSupportTicketById(id);
  if (!reply || !reply.trim()) throw validationError('Reply message is required');
  if (!ticket.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ticket.email)) {
    throw validationError('Ticket does not have a valid customer email address');
  }

  const trimmedReply = reply.trim();
  const supabase = getSupabaseAdminClient();
  const replyRow = {
    support_ticket_id: ticket.id,
    admin_message: trimmedReply,
    sent_to_email: ticket.email,
    email_sent: false,
  };

  const { data: insertedReply, error: replyError } = await supabase
    .from('support_ticket_replies')
    .insert(replyRow)
    .select('*')
    .single();
  if (replyError) throw replyError;

  const subject = `Re: ${ticket.subject || 'Mwasalaty support request'}`;
  try {
    await sendSupportReply({
      to: ticket.email,
      subject,
      message: trimmedReply,
      ticket,
    });
  } catch (err) {
    const wrapped = new Error(err.message);
    wrapped.code = err.code || 'EMAIL_SEND_FAILED';
    wrapped.ticket = await getSupportTicketById(id);
    wrapped.reply = mapReply(insertedReply);
    throw wrapped;
  }

  await supabase
    .from('support_ticket_replies')
    .update({ email_sent: true })
    .eq('id', insertedReply.id);

  const sentAt = new Date().toISOString();
  const { data: updated, error: updateError } = await supabase
    .from('support_tickets')
    .update({
      status: 'resolved',
      admin_reply: trimmedReply,
      replied_at: sentAt,
      updated_at: sentAt,
    })
    .eq('id', id)
    .select('*')
    .maybeSingle();
  if (updateError) throw updateError;
  if (!updated) throw notFoundError();

  const repliesByTicket = await loadReplies([updated.id]);
  return mapTicket(updated, repliesByTicket.get(updated.id) || []);
}
