import { createTicket, getTicketById } from './ticketService.js';
import { saveSession, getSession, updateSession } from '../stores/paymentSessionStore.js';
import { constructWebhookEvent, createCheckoutSession as stripeCreateCheckoutSession } from './stripeService.js';
import { ErrorCodes } from '../helpers/errors.js';

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

  let stripeSession;
  try {
    stripeSession = await stripeCreateCheckoutSession({
      totalAmountEGP: paymentBreakdown.totalAmount,
      currency: paymentBreakdown.currency,
      successUrl: `${clientUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${clientUrl}/payment/cancel`,
    });
  } catch (err) {
    throw { code: ErrorCodes.PAYMENT_SESSION_FAILED, message: 'Failed to create Stripe checkout session', details: { stripeError: err.message } };
  }

  saveSession({
    sessionId: stripeSession.id,
    status: 'pending',
    ticketId: null,
    createdAt: new Date().toISOString(),
    payload: { planId, itineraryId, passenger, paymentBreakdown, itinerary },
  });

  return { checkoutUrl: stripeSession.url, sessionId: stripeSession.id };
}

export async function handleWebhookEvent(rawBody, signature) {
  let event;
  try {
    event = constructWebhookEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    throw { code: ErrorCodes.PAYMENT_WEBHOOK_FAILED, message: 'Webhook signature verification failed', details: { stripeError: err.message } };
  }

  if (event.type !== 'checkout.session.completed') return null;

  const stripeSession = event.data.object;

  const pending = getSession(stripeSession.id);
  if (!pending) {
    throw { code: ErrorCodes.PAYMENT_WEBHOOK_FAILED, message: 'No pending session found for this Stripe session', details: { sessionId: stripeSession.id } };
  }

  const ticketBody = {
    planId: pending.payload.planId,
    itineraryId: pending.payload.itineraryId,
    passenger: pending.payload.passenger,
    itinerary: pending.payload.itinerary,
    payment: {
      method: 'STRIPE_TEST',
      amount: pending.payload.paymentBreakdown.totalAmount,
      currency: pending.payload.paymentBreakdown.currency,
      stripeCheckoutSessionId: stripeSession.id,
      stripePaymentIntentId: stripeSession.payment_intent,
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

  if (session.status !== 'completed') {
    throw { code: ErrorCodes.PAYMENT_NOT_COMPLETED, message: 'Payment not yet completed', details: { status: session.status } };
  }

  return { ticket: getTicketById(session.ticketId) };
}
