import { createTicket, getTicketById } from './ticketService.js';
import { saveSession, getSession, updateSession } from '../stores/paymentSessionStore.js';
import { createIntention, buildCheckoutUrl, verifyHmac } from './paymobService.js';
import { ErrorCodes } from '../helpers/errors.js';

function splitName(name) {
  const parts = String(name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: 'Guest', last: 'User' };
  if (parts.length === 1) return { first: parts[0], last: parts[0] };
  return { first: parts[0], last: parts.slice(1).join(' ') };
}

export async function createCheckoutSession(body) {
  const errors = [];
  if (!body?.planId) errors.push('planId is required');
  if (!body?.itineraryId) errors.push('itineraryId is required');
  if (!body?.passenger?.userId) errors.push('passenger.userId is required');
  if (typeof body?.paymentBreakdown?.totalAmount !== 'number') errors.push('paymentBreakdown.totalAmount is required and must be a number');
  if (!body?.paymentBreakdown?.currency) errors.push('paymentBreakdown.currency is required');
  if (!body?.itinerary) errors.push('itinerary is required');

  if (errors.length > 0) {
    throw { code: ErrorCodes.PAYMENT_SESSION_FAILED, message: 'Checkout session validation failed', details: { fields: errors } };
  }

  const { planId, itineraryId, passenger, paymentBreakdown, itinerary } = body;
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';

  // We control the merchant reference; it doubles as our internal session id.
  const specialReference = `mwasalaty_${itineraryId}_${Date.now()}`;
  const { first, last } = splitName(passenger.name);

  const billingData = {
    first_name: first,
    last_name: last,
    email: passenger.email || 'NA',
    phone_number: passenger.phone || 'NA',
    apartment: 'NA',
    floor: 'NA',
    street: 'NA',
    building: 'NA',
    city: 'Cairo',
    state: 'Cairo',
    country: 'EG',
    postal_code: 'NA',
  };

  let intention;
  try {
    intention = await createIntention({
      amountEGP: paymentBreakdown.totalAmount,
      currency: paymentBreakdown.currency,
      items: [{
        name: 'Mwasalaty Transit Ticket',
        amount: Math.round(paymentBreakdown.totalAmount * 100),
        description: `Trip ${itineraryId}`,
        quantity: 1,
      }],
      billingData,
      customer: { first_name: first, last_name: last, email: passenger.email || 'NA' },
      specialReference,
      redirectionUrl: `${clientUrl}/payment/success`,
      notificationUrl: `${backendUrl}/api/payments/paymob-webhook`,
    });
  } catch (err) {
    throw { code: ErrorCodes.PAYMENT_SESSION_FAILED, message: 'Failed to create PayMob checkout session', details: { paymobError: err.message } };
  }

  saveSession({
    sessionId: specialReference,
    status: 'pending',
    ticketId: null,
    createdAt: new Date().toISOString(),
    paymobOrderId: intention.paymobOrderId,
    payload: { planId, itineraryId, passenger, paymentBreakdown, itinerary },
  });

  return { checkoutUrl: buildCheckoutUrl(intention.clientSecret), sessionId: specialReference };
}

export async function handleWebhookEvent(body, receivedHmac) {
  if (body?.type !== 'TRANSACTION') return null;

  const obj = body.obj;
  if (!verifyHmac(obj, receivedHmac)) {
    throw { code: ErrorCodes.PAYMENT_WEBHOOK_FAILED, message: 'PayMob HMAC verification failed', details: {} };
  }

  const merchantOrderId = obj?.order?.merchant_order_id;
  const pending = getSession(merchantOrderId);
  if (!pending) {
    throw { code: ErrorCodes.PAYMENT_WEBHOOK_FAILED, message: 'No pending session found for this transaction', details: { merchantOrderId } };
  }

  // Idempotency: a ticket was already issued for this session.
  if (pending.status === 'completed' && pending.ticketId) {
    return getTicketById(pending.ticketId);
  }

  if (obj.success !== true) {
    updateSession({ ...pending, status: 'failed' });
    return null;
  }

  const ticketBody = {
    planId: pending.payload.planId,
    itineraryId: pending.payload.itineraryId,
    passenger: pending.payload.passenger,
    itinerary: pending.payload.itinerary,
    payment: {
      method: 'PAYMOB_TEST',
      amount: pending.payload.paymentBreakdown.totalAmount,
      currency: pending.payload.paymentBreakdown.currency,
      paymobOrderId: obj.order?.id,
      paymobTransactionId: obj.id,
      paymentBreakdown: pending.payload.paymentBreakdown,
    },
  };

  let ticket;
  try {
    ticket = createTicket(ticketBody);
  } catch (err) {
    throw { code: ErrorCodes.PAYMENT_WEBHOOK_FAILED, message: 'Failed to create ticket after payment', details: { ticketError: err.message ?? err.code } };
  }

  updateSession({ ...pending, status: 'completed', ticketId: ticket.ticketId });

  return ticket;
}

export function getCheckoutResult(sessionId) {
  const session = getSession(sessionId);
  if (!session) {
    throw { code: ErrorCodes.PAYMENT_NOT_FOUND, message: `No checkout session found for '${sessionId}'`, details: { sessionId } };
  }

  if (session.status === 'failed') {
    throw { code: ErrorCodes.PAYMENT_FAILED, message: 'Payment failed or was cancelled', details: { status: session.status } };
  }

  if (session.status !== 'completed') {
    throw { code: ErrorCodes.PAYMENT_NOT_COMPLETED, message: 'Payment not yet completed', details: { status: session.status } };
  }

  return { ticket: getTicketById(session.ticketId) };
}
