import { createTicket, getTicketById, listTickets, validateLeg, scanValidate, refundTicket } from '../services/ticketService.js';
import { getAllProfiles } from '../stores/scannerProfileStore.js';
import { makeError, ErrorCodes } from '../helpers/errors.js';
import * as paymobService from '../services/paymobService.js';
import { subscribeToTicket } from '../services/ticketEvents.js';
import { bearerToken, verifyAccessToken } from '../middleware/supabaseAuth.js';

const STATUS_MAP = {
  [ErrorCodes.VALIDATION_ERROR]:           400,
  [ErrorCodes.NO_TICKETABLE_LEGS]:         400,
  [ErrorCodes.INVALID_QR_PAYLOAD]:         400,
  [ErrorCodes.TICKET_NOT_FOUND]:           404,
  [ErrorCodes.LEG_NOT_FOUND]:              404,
  [ErrorCodes.SCANNER_PROFILE_NOT_FOUND]:  404,
  [ErrorCodes.NO_MATCHING_LEG]:            404,
  [ErrorCodes.TICKET_EXPIRED]:             410,
  [ErrorCodes.LEG_ALREADY_USED]:           409,
  [ErrorCodes.STATION_LIMIT_EXCEEDED]:     409,
  [ErrorCodes.AMBIGUOUS_LEG_MATCH]:        409,
  [ErrorCodes.LEG_ALREADY_REFUNDED]:       409,
  [ErrorCodes.NO_REFUNDABLE_LEGS]:         422,
  [ErrorCodes.REFUND_WINDOW_EXPIRED]:      410,
  [ErrorCodes.PAYMOB_REFUND_FAILED]:       502,
  [ErrorCodes.REFUND_FAILED]:              502,
  [ErrorCodes.PAYMENT_NOT_FOUND]:          404,
};

// Ownership is enforced by returning the same 404 a missing ticket would, so we
// never reveal that someone else's ticket id exists.
function ownsTicket(ticket, req) {
  return ticket.passenger?.userId === req.auth?.user?.id;
}

function ticketNotFound(res, ticketId) {
  return res.status(404).json(makeError(ErrorCodes.TICKET_NOT_FOUND, `Ticket '${ticketId}' not found`, { ticketId }));
}

function handleServiceError(res, err) {
  const status = STATUS_MAP[err.code];
  if (status) {
    return res.status(status).json(makeError(err.code, err.message, err.details));
  }
  console.error('[ticketController]', err);
  return res.status(500).json(makeError(ErrorCodes.INTERNAL_SERVER_ERROR, 'An unexpected error occurred'));
}

function isLegUsed(leg) {
  return Boolean(leg.used || leg.usedAt || leg.validatedAt || leg.status === 'used');
}

function isLegRefunded(leg) {
  return Boolean(leg.refunded || leg.refundedAt || leg.status === 'refunded');
}

function ticketHasUsedHistory(ticket) {
  return Boolean(ticket.usedAt || ticket.legs?.some(isLegUsed));
}

export async function createTicketHandler(req, res) {
  try {
    if (req.body?.passenger?.userId !== req.auth?.user?.id) {
      return res.status(400).json(makeError(
        ErrorCodes.VALIDATION_ERROR,
        'Request validation failed',
        { fields: ['passenger.userId must match the authenticated user'] },
      ));
    }
    const ticket = createTicket(req.body);
    return res.status(201).json(ticket);
  } catch (err) {
    return handleServiceError(res, err);
  }
}

export async function getTicketHandler(req, res) {
  try {
    const ticket = await getTicketById(req.params.id);
    if (!ownsTicket(ticket, req)) return ticketNotFound(res, req.params.id);
    return res.status(200).json(ticket);
  } catch (err) {
    return handleServiceError(res, err);
  }
}

export async function streamTicketHandler(req, res) {
  // EventSource can't send headers, so the SSE stream also accepts the token as
  // an `?access_token=` query param. Same local JWT verification either way.
  const token = bearerToken(req) || String(req.query.access_token ?? '');
  const result = await verifyAccessToken(token);
  if (result.error) {
    return res.status(result.error.status).json(makeError(result.error.code, result.error.message));
  }

  try {
    const ticket = await getTicketById(req.params.id);
    if (ticket.passenger?.userId !== result.user.id) return ticketNotFound(res, req.params.id);
    res.set({
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'Content-Type': 'text/event-stream',
    });
    res.flushHeaders?.();

    const sendTicket = (nextTicket) => {
      res.write(`event: ticket\ndata: ${JSON.stringify(nextTicket)}\n\n`);
    };
    sendTicket(ticket);

    const unsubscribe = subscribeToTicket(ticket.ticketId, sendTicket);
    const heartbeat = setInterval(() => res.write(': keep-alive\n\n'), 25000);
    req.on('close', () => {
      clearInterval(heartbeat);
      unsubscribe();
    });
  } catch (err) {
    return handleServiceError(res, err);
  }
}

export async function listTicketsHandler(req, res) {
  // Scope strictly to the authenticated user; the client can no longer pass an
  // arbitrary ?userId and read another rider's tickets.
  return res.status(200).json({ tickets: await listTickets(req.auth.user.id) });
}

export async function getScannerProfilesHandler(_req, res) {
  return res.status(200).json({ profiles: getAllProfiles() });
}

export async function scanValidateHandler(req, res) {
  const { qrPayload, scannerProfileId, stationsTraversed } = req.body ?? {};
  const fieldErrors = [];
  if (!qrPayload) fieldErrors.push('qrPayload is required');
  if (!scannerProfileId) fieldErrors.push('scannerProfileId is required');
  if (fieldErrors.length > 0) {
    return res.status(400).json(makeError(ErrorCodes.VALIDATION_ERROR, 'Request validation failed', { fields: fieldErrors }));
  }
  try {
    const result = scanValidate(qrPayload, scannerProfileId, { stationsTraversed });
    return res.status(200).json(result);
  } catch (err) {
    return handleServiceError(res, err);
  }
}

function resolveRefundableLegs(ticket, legIds) {
  const now = new Date();
  const expiresAt = ticket.expiresAt ? new Date(ticket.expiresAt) : null;
  const isNotExpired = !expiresAt || Number.isNaN(expiresAt.getTime()) || expiresAt > now;
  const isPaid = ticket.payment?.status === 'paid' || ticket.paymentStatus === 'paid';

  if (ticket.status !== 'active') {
    throw {
      code: ErrorCodes.NO_REFUNDABLE_LEGS,
      message: 'Ticket is not active',
      details: { ticketId: ticket.ticketId, status: ticket.status },
    };
  }

  if (!isPaid) {
    throw {
      code: ErrorCodes.NO_REFUNDABLE_LEGS,
      message: 'Ticket payment is not paid',
      details: { ticketId: ticket.ticketId, paymentStatus: ticket.payment?.status || ticket.paymentStatus || null },
    };
  }

  if (!isNotExpired) {
    throw {
      code: ErrorCodes.REFUND_WINDOW_EXPIRED,
      message: 'Refund window has closed because the ticket has expired',
      details: { ticketId: ticket.ticketId, expiresAt: ticket.expiresAt },
    };
  }

  if (ticketHasUsedHistory(ticket)) {
    throw {
      code: ErrorCodes.LEG_ALREADY_USED,
      message: 'Used tickets cannot be refunded',
      details: {
        ticketId: ticket.ticketId,
        usedLegIds: ticket.legs.filter(isLegUsed).map(l => l.ticketLegId),
      },
    };
  }

  if (Array.isArray(legIds) && legIds.length > 0) {
    return legIds.map(id => {
      const leg = ticket.legs.find(l => l.ticketLegId === id);
      if (!leg) throw { code: ErrorCodes.LEG_NOT_FOUND, message: `Leg '${id}' not found`, details: { ticketId: ticket.ticketId, ticketLegId: id } };
      if (isLegRefunded(leg)) {
        throw { code: ErrorCodes.LEG_ALREADY_REFUNDED, message: 'Leg already refunded', details: { ticketLegId: id } };
      }
      if (isLegUsed(leg)) {
        throw { code: ErrorCodes.LEG_ALREADY_USED, message: 'Used legs cannot be refunded', details: { ticketLegId: id } };
      }
      return leg;
    });
  }
  const used = ticket.legs.filter(isLegUsed);
  if (used.length > 0) {
    throw {
      code: ErrorCodes.LEG_ALREADY_USED,
      message: 'A total refund is not available after any leg has been used',
      details: { ticketId: ticket.ticketId, usedLegIds: used.map(l => l.ticketLegId) },
    };
  }
  const refunded = ticket.legs.filter(isLegRefunded);
  if (refunded.length > 0) {
    throw {
      code: ErrorCodes.LEG_ALREADY_REFUNDED,
      message: 'A total refund is not available after a partial refund',
      details: { ticketId: ticket.ticketId, refundedLegIds: refunded.map(l => l.ticketLegId) },
    };
  }
  const unused = ticket.legs.filter(l => {
    return !isLegUsed(l) && !isLegRefunded(l);
  });
  if (unused.length === 0) throw { code: ErrorCodes.NO_REFUNDABLE_LEGS, message: 'No unused legs to refund', details: { ticketId: ticket.ticketId } };
  return unused;
}

export async function refundTicketHandler(req, res) {
  try {
    const ticket = await getTicketById(req.params.id);
    if (!ownsTicket(ticket, req)) return ticketNotFound(res, req.params.id);
    const legIds = req.body?.legIds ?? null;

    const legsToRefund = resolveRefundableLegs(ticket, legIds);
    const refundAmountEGP = legsToRefund.reduce((sum, l) => sum + l.fareAmount, 0);

    let refundMeta = {};
    if (ticket.payment.method === 'PAYMOB_TEST') {
      try {
        const paymobRefund = await paymobService.createRefund({
          transactionId: ticket.payment.paymobTransactionId,
          amountEGP: refundAmountEGP,
        });
        refundMeta = { paymobRefundId: paymobRefund.id };
      } catch (paymobErr) {
        return res.status(502).json(makeError(
          ErrorCodes.PAYMOB_REFUND_FAILED,
          'PayMob refund failed',
          { paymobError: paymobErr.message }
        ));
      }
    }

    const result = await refundTicket(req.params.id, legIds, refundMeta);
    return res.status(200).json(result);
  } catch (err) {
    return handleServiceError(res, err);
  }
}

export async function validateLegHandler(req, res) {
  const { operatorId, deviceId, validatedAt, stationsTraversed } = req.body ?? {};

  const fieldErrors = [];
  if (!operatorId) fieldErrors.push('operatorId is required');
  if (!deviceId) fieldErrors.push('deviceId is required');
  if (fieldErrors.length > 0) {
    return res.status(400).json(makeError(ErrorCodes.VALIDATION_ERROR, 'Request validation failed', { fields: fieldErrors }));
  }

  try {
    const result = validateLeg(req.params.id, req.params.legId, { operatorId, deviceId, validatedAt, stationsTraversed });
    return res.status(200).json(result);
  } catch (err) {
    return handleServiceError(res, err);
  }
}
