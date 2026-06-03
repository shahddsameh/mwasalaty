import { createTicket, getTicketById, validateLeg } from '../services/ticketService.js';
import { makeError, ErrorCodes } from '../helpers/errors.js';

const STATUS_MAP = {
  [ErrorCodes.VALIDATION_ERROR]:       400,
  [ErrorCodes.NO_TICKETABLE_LEGS]:     400,
  [ErrorCodes.TICKET_NOT_FOUND]:       404,
  [ErrorCodes.LEG_NOT_FOUND]:          404,
  [ErrorCodes.TICKET_EXPIRED]:         410,
  [ErrorCodes.LEG_ALREADY_USED]:       409,
  [ErrorCodes.STATION_LIMIT_EXCEEDED]: 409,
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
