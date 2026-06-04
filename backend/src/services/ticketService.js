import { randomUUID } from 'crypto';
import { saveTicket, getTicket, updateTicket } from '../stores/ticketStore.js';
import { getProfileById } from '../stores/scannerProfileStore.js';
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

function resolveTicketStatus(ticket) {
  const legs = ticket.legs;
  if (legs.length === 0) return 'active';
  const allUsed     = legs.every(l => l.status === 'used');
  const allRefunded = legs.every(l => l.status === 'refunded');
  const hasRefunded = legs.some(l => l.status === 'refunded');
  if (allUsed)     return 'used';
  if (allRefunded) return 'refunded';
  if (hasRefunded) return 'partially_refunded';
  return 'active';
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
      fareAmount: typeof leg.fareAmount === 'number' ? leg.fareAmount : 0,
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
      paymentId: `pay_${shortUUID()}`,
      method: payment.method,
      status: 'paid',
      amount: payment.amount,
      currency: payment.currency,
      ...(payment.stripeCheckoutSessionId && { stripeCheckoutSessionId: payment.stripeCheckoutSessionId }),
      ...(payment.stripePaymentIntentId   && { stripePaymentIntentId:   payment.stripePaymentIntentId }),
      ...(payment.paymentBreakdown        && { paymentBreakdown:        payment.paymentBreakdown }),
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

  if (leg.status === 'refunded') {
    throw { code: ErrorCodes.LEG_ALREADY_REFUNDED, message: 'This ticket leg has been refunded', details: { ticketId, ticketLegId, refundedAt: leg.refundedAt } };
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

  ticket.status = resolveTicketStatus(ticket);
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

export function scanValidate(qrPayload, scannerProfileId) {
  if (qrPayload?.type !== 'MWASALATY_MVP_TICKET') {
    throw {
      code: ErrorCodes.INVALID_QR_PAYLOAD,
      message: 'Invalid QR payload type — expected MWASALATY_MVP_TICKET',
      details: { type: qrPayload?.type ?? null },
    };
  }

  const ticket = getTicket(qrPayload.ticketId);

  if (!ticket) {
    throw {
      code: ErrorCodes.TICKET_NOT_FOUND,
      message: `Ticket '${qrPayload.ticketId}' not found`,
      details: { ticketId: qrPayload.ticketId },
    };
  }

  if (qrPayload.signature !== ticket.qrPayload?.signature) {
    throw {
      code: ErrorCodes.INVALID_QR_PAYLOAD,
      message: 'Invalid QR payload signature',
      details: { ticketId: qrPayload.ticketId },
    };
  }

  const profile = getProfileById(scannerProfileId);

  if (!profile) {
    throw {
      code: ErrorCodes.SCANNER_PROFILE_NOT_FOUND,
      message: `Scanner profile '${scannerProfileId}' not found`,
      details: { scannerProfileId },
    };
  }

  if (new Date() > new Date(ticket.expiresAt)) {
    throw {
      code: ErrorCodes.TICKET_EXPIRED,
      message: 'This ticket has expired',
      details: {
        ticketId: ticket.ticketId,
        expiresAt: ticket.expiresAt,
      },
    };
  }

  const matchingLegs = ticket.legs.filter(leg => {
    const legRouteShortName =
      typeof leg.route === 'string'
        ? leg.route
        : leg.route?.shortName;

    if (leg.mode !== profile.mode) return false;
    if (profile.routeShortName && legRouteShortName !== profile.routeShortName) return false;

    return true;
  });

  if (matchingLegs.length === 0) {
    throw {
      code: ErrorCodes.NO_MATCHING_LEG,
      message: 'No legs on this ticket match the scanner profile',
      details: {
        scannerProfileId,
        mode: profile.mode,
        routeShortName: profile.routeShortName ?? null,
      },
    };
  }

  const unusedLegs = matchingLegs.filter(l => l.status === 'unused');

  if (unusedLegs.length === 0) {
    const refunded = matchingLegs.find(l => l.status === 'refunded');
    if (refunded) {
      throw {
        code: ErrorCodes.LEG_ALREADY_REFUNDED,
        message: 'All matching legs on this ticket have been refunded',
        details: { ticketId: ticket.ticketId, ticketLegId: refunded.ticketLegId, refundedAt: refunded.refundedAt },
      };
    }

    const used = matchingLegs[0];
    throw {
      code: ErrorCodes.LEG_ALREADY_USED,
      message: 'All matching legs on this ticket have already been used',
      details: {
        ticketId: ticket.ticketId,
        ticketLegId: used.ticketLegId,
        validatedAt: used.validatedAt,
      },
    };
  }

  if (unusedLegs.length > 1) {
    throw {
      code: ErrorCodes.AMBIGUOUS_LEG_MATCH,
      message: 'Multiple unused legs match this scanner profile',
      details: {
        scannerProfileId,
        matchingLegIds: unusedLegs.map(l => l.ticketLegId),
      },
    };
  }

  const leg = unusedLegs[0];
  const resolvedAt = new Date().toISOString();

  leg.status = 'used';
  leg.validatedAt = resolvedAt;
  leg.validatedBy = {
    scannerProfileId: profile.scannerProfileId,
    label: profile.label,
    operatorId: profile.operatorId,
    deviceId: profile.deviceId,
  };

  ticket.status = resolveTicketStatus(ticket);
  updateTicket(ticket);

  return {
    ticketId: ticket.ticketId,
    ticketLegId: leg.ticketLegId,
    status: 'used',
    validatedAt: resolvedAt,
    validatedBy: leg.validatedBy,
    message: 'Leg validated successfully',
    remainingLegs: ticket.legs.filter(l => l.status === 'unused').length,
    passenger: ticket.passenger,
  };
}

export function refundTicket(ticketId, legIds, refundMeta = {}) {
  const ticket = getTicket(ticketId);
  if (!ticket) {
    throw { code: ErrorCodes.TICKET_NOT_FOUND, message: `Ticket '${ticketId}' not found`, details: { ticketId } };
  }

  const now = new Date();
  const expiresAt = new Date(ticket.expiresAt);
  const graceExpiry = new Date(expiresAt.getTime() + 24 * 60 * 60 * 1000);

  if (now > expiresAt && now > graceExpiry) {
    throw {
      code: ErrorCodes.REFUND_WINDOW_EXPIRED,
      message: 'Refund window has closed — ticket expired more than 24 hours ago',
      details: { ticketId, expiresAt: ticket.expiresAt, graceExpiry: graceExpiry.toISOString() },
    };
  }

  let refundableLegs;
  if (Array.isArray(legIds) && legIds.length > 0) {
    const candidateLegs = legIds.map(id => {
      const leg = ticket.legs.find(l => l.ticketLegId === id);
      if (!leg) {
        throw { code: ErrorCodes.LEG_NOT_FOUND, message: `Leg '${id}' not found on ticket '${ticketId}'`, details: { ticketId, ticketLegId: id } };
      }
      return leg;
    });

    const refundedLegIds = candidateLegs.filter(l => l.status === 'refunded').map(l => l.ticketLegId);
    if (refundedLegIds.length > 0) {
      throw {
        code: ErrorCodes.LEG_ALREADY_REFUNDED,
        message: 'Selected legs have already been refunded',
        details: { ticketId, refundedLegIds },
      };
    }

    const usedLegIds = candidateLegs.filter(l => l.status === 'used').map(l => l.ticketLegId);
    if (usedLegIds.length > 0) {
      throw {
        code: ErrorCodes.LEG_ALREADY_USED,
        message: 'Used legs cannot be refunded',
        details: { ticketId, usedLegIds },
      };
    }

    refundableLegs = candidateLegs;
  } else {
    refundableLegs = ticket.legs.filter(l => l.status === 'unused');
    if (refundableLegs.length === 0) {
      throw {
        code: ErrorCodes.NO_REFUNDABLE_LEGS,
        message: 'No unused legs available to refund on this ticket',
        details: { ticketId },
      };
    }
  }

  const refundedAt = now.toISOString();
  const hasMeta = Object.keys(refundMeta).length > 0;
  refundableLegs.forEach(leg => {
    leg.status = 'refunded';
    leg.refundedAt = refundedAt;
    if (hasMeta) Object.assign(leg, refundMeta);
  });

  const refundAmount = Math.round(refundableLegs.reduce((sum, l) => sum + l.fareAmount, 0) * 100) / 100;

  ticket.payment.refundedAmount = Math.round(((ticket.payment.refundedAmount ?? 0) + refundAmount) * 100) / 100;
  ticket.payment.refundedAt = refundedAt;

  ticket.status = resolveTicketStatus(ticket);
  if (ticket.status === 'refunded' || ticket.status === 'partially_refunded') {
    ticket.payment.status = ticket.status;
  }

  updateTicket(ticket);

  return {
    ticketId,
    refundedLegs: refundableLegs.map(l => ({
      ticketLegId: l.ticketLegId,
      mode: l.mode,
      fareAmount: l.fareAmount,
      refundedAt: l.refundedAt,
      ...(l.stripeRefundId && { stripeRefundId: l.stripeRefundId }),
    })),
    refundAmount,
    currency: ticket.payment.currency,
    remainingLegs: ticket.legs.filter(l => l.status === 'unused').length,
    message: `${refundableLegs.length} leg(s) refunded successfully`,
  };
}
