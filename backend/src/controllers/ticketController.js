import { createTicket, getTicketById, validateLeg, scanValidate, refundTicket } from '../services/ticketService.js';
import { getAllProfiles } from '../stores/scannerProfileStore.js';
import { makeError, ErrorCodes } from '../helpers/errors.js';
import * as stripeService from '../services/stripeService.js';

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
  [ErrorCodes.STRIPE_REFUND_FAILED]:       502,
  [ErrorCodes.REFUND_FAILED]:              502,
  [ErrorCodes.PAYMENT_NOT_FOUND]:          404,
};

function handleServiceError(res, err) {
  const status = STATUS_MAP[err.code];
  if (status) {
    return res.status(status).json(makeError(err.code, err.message, err.details));
  }
  console.error('[ticketController]', err);
  return res.status(500).json(makeError(ErrorCodes.INTERNAL_SERVER_ERROR, 'An unexpected error occurred'));
}

export async function createTicketHandler(req, res) {
  try {
    const ticket = createTicket(req.body);
    return res.status(201).json(ticket);
  } catch (err) {
    return handleServiceError(res, err);
  }
}

export async function getTicketHandler(req, res) {
  try {
    const ticket = getTicketById(req.params.id);
    return res.status(200).json(ticket);
  } catch (err) {
    return handleServiceError(res, err);
  }
}

export async function getScannerProfilesHandler(_req, res) {
  return res.status(200).json({ profiles: getAllProfiles() });
}

export async function scanValidateHandler(req, res) {
  const { qrPayload, scannerProfileId } = req.body ?? {};
  const fieldErrors = [];
  if (!qrPayload) fieldErrors.push('qrPayload is required');
  if (!scannerProfileId) fieldErrors.push('scannerProfileId is required');
  if (fieldErrors.length > 0) {
    return res.status(400).json(makeError(ErrorCodes.VALIDATION_ERROR, 'Request validation failed', { fields: fieldErrors }));
  }
  try {
    const result = scanValidate(qrPayload, scannerProfileId);
    return res.status(200).json(result);
  } catch (err) {
    return handleServiceError(res, err);
  }
}

function resolveRefundableLegs(ticket, legIds) {
  if (Array.isArray(legIds) && legIds.length > 0) {
    return legIds.map(id => {
      const leg = ticket.legs.find(l => l.ticketLegId === id);
      if (!leg) throw { code: ErrorCodes.LEG_NOT_FOUND, message: `Leg '${id}' not found`, details: { ticketId: ticket.ticketId, ticketLegId: id } };
      if (leg.status === 'refunded') throw { code: ErrorCodes.LEG_ALREADY_REFUNDED, message: 'Leg already refunded', details: { ticketLegId: id } };
      if (leg.status === 'used') throw { code: ErrorCodes.LEG_ALREADY_USED, message: 'Used legs cannot be refunded', details: { ticketLegId: id } };
      return leg;
    });
  }
  const unused = ticket.legs.filter(l => l.status === 'unused');
  if (unused.length === 0) throw { code: ErrorCodes.NO_REFUNDABLE_LEGS, message: 'No unused legs to refund', details: { ticketId: ticket.ticketId } };
  return unused;
}

export async function refundTicketHandler(req, res) {
  try {
    const ticket = getTicketById(req.params.id);
    const legIds = req.body?.legIds ?? null;

    const legsToRefund = resolveRefundableLegs(ticket, legIds);
    const refundAmountEGP = legsToRefund.reduce((sum, l) => sum + l.fareAmount, 0);

    let refundMeta = {};
    if (ticket.payment.method === 'STRIPE_TEST') {
      try {
        const stripeRefund = await stripeService.createRefund({
          paymentIntentId: ticket.payment.stripePaymentIntentId,
          amountEGP: refundAmountEGP,
        });
        refundMeta = { stripeRefundId: stripeRefund.id };
      } catch (stripeErr) {
        return res.status(502).json(makeError(
          ErrorCodes.STRIPE_REFUND_FAILED,
          'Stripe refund failed',
          { stripeError: stripeErr.message }
        ));
      }
    }

    const result = refundTicket(req.params.id, legIds, refundMeta);
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
