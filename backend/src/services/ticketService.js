import { randomUUID } from 'crypto';
import { saveTicket, getTicket, updateTicket } from '../stores/ticketStore.js';
import { ErrorCodes } from '../helpers/errors.js';

const TRANSIT_MODES = new Set(['BUS', 'METRO', 'SUBWAY', 'TRAM', 'RAIL', 'MICROBUS']);

const METRO_TIERS = [
  { tier: 1, min: 1,  max: 9,        label: '1-9 stations' },
  { tier: 2, min: 10, max: 16,       label: '10-16 stations' },
  { tier: 3, min: 17, max: Infinity, label: '17+ stations' },
];

function shortUUID() {
  return randomUUID().replace(/-/g, '').slice(0, 12);
}

function getSubwayTier(stationCount) {
  const count = typeof stationCount === 'number' && stationCount >= 1 ? stationCount : 1;
  return METRO_TIERS.find(t => count >= t.min && count <= t.max) ?? METRO_TIERS[0];
}

function validateCreateBody(body) {
  const errors = [];
  if (!body?.planId) errors.push('planId is required');
  if (!body?.itineraryId) errors.push('itineraryId is required');
  if (!body?.passenger?.userId) errors.push('passenger.userId is required');
  if (!body?.payment?.method) errors.push('payment.method is required');
  if (typeof body?.payment?.amount !== 'number') errors.push('payment.amount is required and must be a number');
  if (!body?.payment?.currency) errors.push('payment.currency is required');
  if (!body?.itinerary?.itineraryId) errors.push('itinerary.itineraryId is required');
  if (!Array.isArray(body?.itinerary?.legs)) errors.push('itinerary.legs is required and must be an array');
  return errors;
}

export function createTicket(body) {
  const validationErrors = validateCreateBody(body);
  if (validationErrors.length > 0) {
    throw { code: ErrorCodes.VALIDATION_ERROR, message: 'Request validation failed', details: { fields: validationErrors } };
  }

  const { planId, itineraryId, passenger, payment, itinerary } = body;

  const transitLegs = itinerary.legs.filter(leg => TRANSIT_MODES.has(leg.mode));
  if (transitLegs.length === 0) {
    throw { code: ErrorCodes.NO_TICKETABLE_LEGS, message: 'The itinerary has no transit legs that can be ticketed (only WALK legs found)', details: {} };
  }

  const ticketId = `ticket_${shortUUID()}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const legs = transitLegs.map((leg, i) => {
    const ticketLegId = `ticket_leg_${String(i + 1).padStart(3, '0')}`;
    const subway = leg.mode === 'SUBWAY'
      ? (() => {
          const t = getSubwayTier(leg.stationCount);
          return {
            stationCount: typeof leg.stationCount === 'number' ? leg.stationCount : 1,
            tier: t.tier,
            tierLabel: t.label,
            maxStations: t.max,
          };
        })()
      : null;

    return {
      ticketLegId,
      plannedLegId: leg.legId,
      mode: leg.mode,
      route: leg.route ?? null,
      from: leg.from,
      to: leg.to,
      subway,
      status: 'unused',
      validatedAt: null,
      validatedBy: null,
      qrPayload: {
        ticketId,
        ticketLegId,
        type: 'MWASALATY_MVP_TICKET_LEG',
        signature: `demo_signature_leg_${ticketLegId.slice(-3)}`,
      },
    };
  });

  const ticket = {
    ticketId,
    status: 'active',
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    sourcePlanId: planId,
    sourceItineraryId: itineraryId,
    passenger: {
      userId: passenger.userId,
      name: passenger.name ?? null,
    },
    payment: {
      paymentId: `pay_sim_${shortUUID()}`,
      method: 'SIMULATED',
      status: 'paid',
      amount: payment.amount,
      currency: payment.currency,
    },
    qrPayload: {
      ticketId,
      type: 'MWASALATY_MVP_TICKET',
      signature: `demo_signature_${ticketId.slice(7)}`,
    },
    legs,
  };

  saveTicket(ticket);
  return ticket;
}

export function getTicketById(ticketId) {
  const ticket = getTicket(ticketId);
  if (!ticket) {
    throw { code: ErrorCodes.TICKET_NOT_FOUND, message: `Ticket '${ticketId}' not found`, details: { ticketId } };
  }
  return ticket;
}

export function validateLeg(ticketId, ticketLegId, { operatorId, deviceId, validatedAt, stationsTraversed }) {
  const ticket = getTicket(ticketId);
  if (!ticket) {
    throw { code: ErrorCodes.TICKET_NOT_FOUND, message: `Ticket '${ticketId}' not found`, details: { ticketId } };
  }

  if (new Date() > new Date(ticket.expiresAt)) {
    throw { code: ErrorCodes.TICKET_EXPIRED, message: 'This ticket has expired', details: { ticketId, expiresAt: ticket.expiresAt } };
  }

  const leg = ticket.legs.find(l => l.ticketLegId === ticketLegId);
  if (!leg) {
    throw { code: ErrorCodes.LEG_NOT_FOUND, message: `Leg '${ticketLegId}' not found on ticket '${ticketId}'`, details: { ticketId, ticketLegId } };
  }

  if (leg.status === 'used') {
    throw { code: ErrorCodes.LEG_ALREADY_USED, message: 'This ticket leg has already been used', details: { ticketId, ticketLegId, validatedAt: leg.validatedAt } };
  }

  if (leg.mode === 'SUBWAY' && typeof stationsTraversed === 'number') {
    if (stationsTraversed > leg.subway.maxStations) {
      throw {
        code: ErrorCodes.STATION_LIMIT_EXCEEDED,
        message: `Passenger traveled ${stationsTraversed} stations but the ticket only covers up to ${leg.subway.maxStations} stations (Tier ${leg.subway.tier})`,
        details: { ticketLegId, tier: leg.subway.tier, maxStations: leg.subway.maxStations, stationsTraversed },
      };
    }
  }

  const resolvedAt = validatedAt || new Date().toISOString();
  leg.status = 'used';
  leg.validatedAt = resolvedAt;
  leg.validatedBy = { operatorId, deviceId };

  updateTicket(ticket);

  return {
    ticketId,
    ticketLegId,
    status: 'used',
    validatedAt: resolvedAt,
    validatedBy: { operatorId, deviceId },
    message: 'Leg validated successfully',
  };
}
