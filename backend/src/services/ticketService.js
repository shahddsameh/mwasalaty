import { randomUUID } from 'crypto';
import { saveTicket, getTicket, getAllTickets, updateTicket } from '../stores/ticketStore.js';
import { getProfileById, getProfileByOperatorDevice } from '../stores/scannerProfileStore.js';
import {
  getTicketPayloadFromSupabase,
  listTicketPayloadsFromSupabase,
  syncTicketToSupabase,
} from './adminTicketsService.js';
import { ErrorCodes } from '../helpers/errors.js';
import { publishTicketUpdate } from './ticketEvents.js';

const TRANSIT_MODES = new Set(['BUS', 'METRO', 'SUBWAY', 'TRAM', 'RAIL', 'MICROBUS']);

// Tiers mirror calculateFare() in mappers/tripMapper.js (10/12/15/20 EGP) so a
// ticket's station limit matches the fare the rider actually paid.
const METRO_TIERS = [
  { tier: 1, min: 1,  max: 9,        label: '1-9 stations' },
  { tier: 2, min: 10, max: 16,       label: '10-16 stations' },
  { tier: 3, min: 17, max: 23,       label: '17-23 stations' },
  { tier: 4, min: 24, max: Infinity, label: '24+ stations' },
];

function normalizeMode(mode) {
  return mode === 'METRO' ? 'SUBWAY' : mode;
}

function normalizeRouteShortName(routeShortName) {
  if (!routeShortName) return null;
  const value = String(routeShortName).trim().toUpperCase().replace(/\s+/g, ' ');
  const lineMatch = value.match(/^(?:METRO\s+)?LINE\s*(\d+)$/);
  if (lineMatch) return `M${lineMatch[1]}`;
  const spacedMetroMatch = value.match(/^M\s*(\d+)$/);
  if (spacedMetroMatch) return `M${spacedMetroMatch[1]}`;
  return value;
}

function shortUUID() {
  return randomUUID().replace(/-/g, '').slice(0, 12);
}

function getSubwayTier(stationCount) {
  const count = typeof stationCount === 'number' && stationCount >= 1 ? stationCount : 1;
  return METRO_TIERS.find(t => count >= t.min && count <= t.max) ?? METRO_TIERS[0];
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

// Payment states that mean the rider actually paid, so a refund is still possible.
// 'partially_refunded' is included because a prior partial refund leaves paid legs.
const PAID_PAYMENT_STATES = new Set(['paid', 'partially_refunded']);

function resolveTicketStatus(ticket) {
  const legs = ticket.legs;
  if (legs.length === 0) return 'active';
  const allRefunded = ticket.status === 'refunded' || legs.every(isLegRefunded);
  const hasRefunded = legs.some(isLegRefunded);
  if (allRefunded) return 'refunded';
  if (ticketHasUsedHistory(ticket)) return 'used';
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

async function getFreshTicket(ticketId) {
  try {
    const supabaseTicket = await getTicketPayloadFromSupabase(ticketId);
    if (supabaseTicket) {
      updateTicket(supabaseTicket);
      return supabaseTicket;
    }
  } catch (err) {
    console.warn(`[ticketService] Supabase ticket lookup failed for ${ticketId}: ${err.message}`);
  }
  return getTicket(ticketId);
}

function persistTicketUpdate(ticket) {
  void syncTicketToSupabase(ticket);
  publishTicketUpdate(ticket);
}

export function createTicket(body) {
  const validationErrors = validateCreateBody(body);
  if (validationErrors.length > 0) {
    throw { code: ErrorCodes.VALIDATION_ERROR, message: 'Request validation failed', details: { fields: validationErrors } };
  }

  const { planId, itineraryId, passenger, payment, itinerary, departureAt } = body;

  const transitLegs = itinerary.legs.filter(leg => TRANSIT_MODES.has(leg.mode));
  if (transitLegs.length === 0) {
    throw { code: ErrorCodes.NO_TICKETABLE_LEGS, message: 'The itinerary has no transit legs that can be ticketed (only WALK legs found)', details: {} };
  }

  const ticketId = `ticket_${shortUUID()}`;
  const now = new Date();
  const parsedDeparture = departureAt ? new Date(departureAt) : null;
  const activatedAt = now;
  const expiresAt = new Date(activatedAt.getTime() + 24 * 60 * 60 * 1000);

  const legs = transitLegs.map((leg, i) => {
    const ticketLegId = `ticket_leg_${String(i + 1).padStart(3, '0')}`;
    const normalizedMode = normalizeMode(leg.mode);
    const subway = normalizedMode === 'SUBWAY'
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
      mode: normalizedMode,
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
    activatedAt: activatedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    ...(parsedDeparture && !Number.isNaN(parsedDeparture.getTime()) && { departureAt: parsedDeparture.toISOString() }),
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
      ...(payment.paymobOrderId       && { paymobOrderId:       payment.paymobOrderId }),
      ...(payment.paymobTransactionId && { paymobTransactionId: payment.paymobTransactionId }),
      ...(payment.paymentBreakdown    && { paymentBreakdown:    payment.paymentBreakdown }),
    },
    qrPayload: {
      ticketId,
      type: 'MWASALATY_MVP_TICKET',
      signature: `demo_signature_${ticketId.slice(7)}`,
    },
    legs,
  };

  saveTicket(ticket);
  syncTicketToSupabase(ticket);
  return ticket;
}

export async function getTicketById(ticketId) {
  const ticket = await getFreshTicket(ticketId);
  if (!ticket) {
    throw { code: ErrorCodes.TICKET_NOT_FOUND, message: `Ticket '${ticketId}' not found`, details: { ticketId } };
  }
  return ticket;
}

export async function listTickets(userId) {
  const merged = new Map();

  try {
    const supabaseTickets = await listTicketPayloadsFromSupabase(userId);
    for (const ticket of supabaseTickets) {
      merged.set(ticket.ticketId, ticket);
      updateTicket(ticket);
    }
  } catch (err) {
    console.warn(`[ticketService] Supabase ticket list failed for ${userId}: ${err.message}`);
  }

  for (const ticket of getAllTickets().filter(ticket => ticket.passenger?.userId === userId)) {
    if (!merged.has(ticket.ticketId)) merged.set(ticket.ticketId, ticket);
  }

  return Array.from(merged.values())
    .filter(ticket => ticket.passenger?.userId === userId)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
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
    throw {
      code: ErrorCodes.LEG_ALREADY_USED,
      message: 'This ticket leg has already been used',
      details: { ticketId, ticketLegId, validatedAt: leg.validatedAt, validatedBy: leg.validatedBy },
    };
  }

  if (normalizeMode(leg.mode) === 'SUBWAY' && leg.subway && typeof stationsTraversed === 'number') {
    if (stationsTraversed > leg.subway.maxStations) {
      throw {
        code: ErrorCodes.STATION_LIMIT_EXCEEDED,
        message: `Passenger traveled ${stationsTraversed} stations but the ticket only covers up to ${leg.subway.maxStations} stations (Tier ${leg.subway.tier})`,
        details: { ticketLegId, tier: leg.subway.tier, maxStations: leg.subway.maxStations, stationsTraversed },
      };
    }
  }

  const resolvedAt = validatedAt || new Date().toISOString();
  const profile = getProfileByOperatorDevice(operatorId, deviceId);
  leg.status = 'used';
  leg.usedAt = resolvedAt;
  leg.validatedAt = resolvedAt;
  leg.validatedBy = {
    ...(profile && {
      scannerProfileId: profile.scannerProfileId,
      label: profile.label,
      labelAr: profile.labelAr,
    }),
    operatorId,
    deviceId,
  };

  ticket.status = resolveTicketStatus(ticket);
  updateTicket(ticket);
  persistTicketUpdate(ticket);

  return {
    ticketId,
    ticketLegId,
    status: 'used',
    validatedAt: resolvedAt,
    validatedBy: leg.validatedBy,
    message: 'Leg validated successfully',
  };
}

export function scanValidate(qrPayload, scannerProfileId, { stationsTraversed } = {}) {
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

    if (normalizeMode(leg.mode) !== normalizeMode(profile.mode)) return false;
    if (
      profile.routeShortName &&
      normalizeRouteShortName(legRouteShortName) !== normalizeRouteShortName(profile.routeShortName)
    ) return false;

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
        validatedBy: used.validatedBy,
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

  if (normalizeMode(leg.mode) === 'SUBWAY' && leg.subway && typeof stationsTraversed === 'number') {
    if (stationsTraversed > leg.subway.maxStations) {
      throw {
        code: ErrorCodes.STATION_LIMIT_EXCEEDED,
        message: `Passenger traveled ${stationsTraversed} stations but the ticket only covers up to ${leg.subway.maxStations} stations (Tier ${leg.subway.tier})`,
        details: { ticketId: ticket.ticketId, ticketLegId: leg.ticketLegId, tier: leg.subway.tier, maxStations: leg.subway.maxStations, stationsTraversed },
      };
    }
  }

  const resolvedAt = new Date().toISOString();

  leg.status = 'used';
  leg.usedAt = resolvedAt;
  leg.validatedAt = resolvedAt;
  leg.validatedBy = {
    scannerProfileId: profile.scannerProfileId,
    label: profile.label,
    labelAr: profile.labelAr,
    operatorId: profile.operatorId,
    deviceId: profile.deviceId,
  };

  ticket.status = resolveTicketStatus(ticket);
  updateTicket(ticket);
  persistTicketUpdate(ticket);

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

export async function refundTicket(ticketId, legIds, refundMeta = {}) {
  const ticket = await getFreshTicket(ticketId);
  if (!ticket) {
    throw { code: ErrorCodes.TICKET_NOT_FOUND, message: `Ticket '${ticketId}' not found`, details: { ticketId } };
  }

  const now = new Date();
  const expiresAt = ticket.expiresAt ? new Date(ticket.expiresAt) : null;
  const isNotExpired = !expiresAt || Number.isNaN(expiresAt.getTime()) || expiresAt > now;
  // A partial refund flips the payment status to 'partially_refunded'; the ticket
  // was still paid, so its remaining unused legs stay refundable.
  const isPaid = PAID_PAYMENT_STATES.has(ticket.payment?.status) || PAID_PAYMENT_STATES.has(ticket.paymentStatus);

  // A fully refunded ticket has nothing left to refund. A 'used' or
  // 'partially_refunded' ticket may still have unused legs worth refunding, so it
  // proceeds to the per-leg checks below.
  if (ticket.status === 'refunded') {
    throw {
      code: ErrorCodes.NO_REFUNDABLE_LEGS,
      message: 'Ticket has been fully refunded',
      details: { ticketId, status: ticket.status },
    };
  }

  if (!isPaid) {
    throw {
      code: ErrorCodes.NO_REFUNDABLE_LEGS,
      message: 'Ticket payment is not paid',
      details: { ticketId, paymentStatus: ticket.payment?.status || ticket.paymentStatus || null },
    };
  }

  if (!isNotExpired) {
    throw {
      code: ErrorCodes.REFUND_WINDOW_EXPIRED,
      message: 'Refund window has closed because the ticket has expired',
      details: { ticketId, expiresAt: ticket.expiresAt },
    };
  }

  // No blanket block on used history: an unused leg stays refundable even after a
  // sibling leg is used. The per-leg legIds branch rejects refunding a *used* leg,
  // and the total-refund branch rejects a total refund once any leg is used.
  let refundableLegs;
  if (Array.isArray(legIds) && legIds.length > 0) {
    const candidateLegs = legIds.map(id => {
      const leg = ticket.legs.find(l => l.ticketLegId === id);
      if (!leg) {
        throw { code: ErrorCodes.LEG_NOT_FOUND, message: `Leg '${id}' not found on ticket '${ticketId}'`, details: { ticketId, ticketLegId: id } };
      }
      return leg;
    });

    const refundedLegIds = candidateLegs.filter(isLegRefunded).map(l => l.ticketLegId);
    if (refundedLegIds.length > 0) {
      throw {
        code: ErrorCodes.LEG_ALREADY_REFUNDED,
        message: 'Selected legs have already been refunded',
        details: { ticketId, refundedLegIds },
      };
    }

    const usedLegIds = candidateLegs.filter(isLegUsed).map(l => l.ticketLegId);
    if (usedLegIds.length > 0) {
      throw {
        code: ErrorCodes.LEG_ALREADY_USED,
        message: 'Used legs cannot be refunded',
        details: { ticketId, usedLegIds },
      };
    }

    refundableLegs = candidateLegs;
  } else {
    const usedLegIds = ticket.legs.filter(isLegUsed).map(l => l.ticketLegId);
    if (usedLegIds.length > 0) {
      throw {
        code: ErrorCodes.LEG_ALREADY_USED,
        message: 'A total refund is not available after any leg has been used',
        details: { ticketId, usedLegIds },
      };
    }

    const refundedLegIds = ticket.legs.filter(isLegRefunded).map(l => l.ticketLegId);
    if (refundedLegIds.length > 0) {
      throw {
        code: ErrorCodes.LEG_ALREADY_REFUNDED,
        message: 'A total refund is not available after a partial refund',
        details: { ticketId, refundedLegIds },
      };
    }

    refundableLegs = ticket.legs.filter(l => {
      return !isLegUsed(l) && !isLegRefunded(l);
    });
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
  await syncTicketToSupabase(ticket);
  publishTicketUpdate(ticket);

  return {
    ticketId,
    refundedLegs: refundableLegs.map(l => ({
      ticketLegId: l.ticketLegId,
      mode: l.mode,
      fareAmount: l.fareAmount,
      refundedAt: l.refundedAt,
      ...(l.paymobRefundId && { paymobRefundId: l.paymobRefundId }),
    })),
    refundAmount,
    currency: ticket.payment.currency,
    remainingLegs: ticket.legs.filter(l => l.status === 'unused').length,
    message: `${refundableLegs.length} leg(s) refunded successfully`,
  };
}
