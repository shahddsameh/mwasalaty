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

function normalizeUrl(baseUrl, fallback) {
  const value = String(baseUrl ?? '').trim().replace(/\/+$/, '');
  return value || fallback;
}

function normalizeEmail(email, specialReference) {
  const value = String(email ?? '').trim();
  if (value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return value;
  return `${specialReference}@example.com`;
}

function normalizePhone(phone) {
  const digits = String(phone ?? '').replace(/\D/g, '');
  if (digits.length >= 8) return digits;
  return '01000000000';
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

  const { planId, itineraryId, passenger, paymentBreakdown, itinerary, departureAt } = body;
  const clientUrl = normalizeUrl(process.env.CLIENT_URL, 'http://localhost:5173');
  const backendUrl = normalizeUrl(process.env.BACKEND_URL, 'http://localhost:3000');

  // We control the merchant reference; it doubles as our internal session id.
  const specialReference = `mwasalaty_${itineraryId}_${Date.now()}`;
  const { first, last } = splitName(passenger.name);
  const email = normalizeEmail(passenger.email, specialReference);
  const phone = normalizePhone(passenger.phone);

  const billingData = {
    first_name: first,
    last_name: last,
    email,
    phone_number: phone,
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
      customer: { first_name: first, last_name: last, email },
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
    payload: { planId, itineraryId, passenger, paymentBreakdown, itinerary, departureAt },
  });

  return { checkoutUrl: buildCheckoutUrl(intention.clientSecret), sessionId: specialReference };
}

/**
 * Issue a ticket for a verified, successful PayMob transaction. Shared by the
 * webhook and the redirect-confirm paths; both are idempotent, so whichever
 * arrives first issues the ticket and the other returns the same one.
 *
 * @param obj   The transaction object (nested shape: `order.id`, `id`, `success`).
 * @param source Label for logs ('webhook' | 'redirect').
 */
function issueTicketForTransaction(obj, merchantOrderId, source) {
  const pending = getSession(merchantOrderId);
  if (!pending) {
    console.error(`[${source}] no pending session for`, merchantOrderId, '— backend likely restarted (in-memory store wiped)');
    throw { code: ErrorCodes.PAYMENT_WEBHOOK_FAILED, message: 'No pending session found for this transaction', details: { merchantOrderId } };
  }

  // Idempotency: a ticket was already issued for this session.
  if (pending.status === 'completed' && pending.ticketId) {
    return getTicketById(pending.ticketId);
  }

  // PayMob sends booleans as real booleans in the webhook JSON but as 'true'/'false'
  // strings in the redirect query params; accept both.
  const isSuccess = obj.success === true || obj.success === 'true';
  if (!isSuccess) {
    console.warn(`[${source}] transaction not successful for`, merchantOrderId, '— marking session failed');
    updateSession({ ...pending, status: 'failed' });
    return null;
  }

  const ticketBody = {
    planId: pending.payload.planId,
    itineraryId: pending.payload.itineraryId,
    passenger: pending.payload.passenger,
    itinerary: pending.payload.itinerary,
    departureAt: pending.payload.departureAt,
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
  console.log(`[${source}] ticket issued`, { merchantOrderId, ticketId: ticket.ticketId, userId: ticket.passenger?.userId });

  return ticket;
}

export async function handleWebhookEvent(body, receivedHmac) {
  if (body?.type !== 'TRANSACTION') {
    console.log('[webhook] ignored non-transaction event:', body?.type);
    return null;
  }

  const obj = body.obj;
  const merchantOrderId = obj?.order?.merchant_order_id;
  console.log('[webhook] transaction received', {
    merchantOrderId,
    success: obj?.success,
    transactionId: obj?.id,
    orderId: obj?.order?.id,
  });

  if (!verifyHmac(obj, receivedHmac)) {
    console.error('[webhook] HMAC verification FAILED for', merchantOrderId, '— check PAYMOB_HMAC_SECRET');
    throw { code: ErrorCodes.PAYMENT_WEBHOOK_FAILED, message: 'PayMob HMAC verification failed', details: {} };
  }

  return issueTicketForTransaction(obj, merchantOrderId, 'webhook');
}

/**
 * Confirm a payment directly from PayMob's browser redirect to the success page.
 * The redirect carries the same signed transaction fields as the webhook (just
 * flattened into query params), so we can issue the ticket without waiting on
 * the webhook — closing the gap where a late/missing webhook stranded the user.
 *
 * @param query The flattened redirect query params (incl. `hmac`, `merchant_order_id`).
 */
export function confirmFromRedirect(query) {
  // Rebuild the nested transaction shape verifyHmac expects from the flat params.
  // The HMAC is computed over the same field VALUES, so verification matches.
  const obj = {
    amount_cents: query.amount_cents,
    created_at: query.created_at,
    currency: query.currency,
    error_occured: query.error_occured,
    has_parent_transaction: query.has_parent_transaction,
    id: query.id,
    integration_id: query.integration_id,
    is_3d_secure: query.is_3d_secure,
    is_auth: query.is_auth,
    is_capture: query.is_capture,
    is_refunded: query.is_refunded,
    is_standalone_payment: query.is_standalone_payment,
    is_voided: query.is_voided,
    order: { id: query.order, merchant_order_id: query.merchant_order_id },
    owner: query.owner,
    pending: query.pending,
    source_data: {
      pan: query['source_data.pan'],
      sub_type: query['source_data.sub_type'],
      type: query['source_data.type'],
    },
    success: query.success,
  };

  const merchantOrderId = query.merchant_order_id;
  console.log('[redirect] confirmation received', { merchantOrderId, success: query.success, transactionId: query.id });

  if (!verifyHmac(obj, query.hmac)) {
    console.error('[redirect] HMAC verification FAILED for', merchantOrderId, '— webhook remains the fallback');
    throw { code: ErrorCodes.PAYMENT_WEBHOOK_FAILED, message: 'PayMob HMAC verification failed', details: {} };
  }

  const ticket = issueTicketForTransaction(obj, merchantOrderId, 'redirect');
  if (!ticket) {
    throw { code: ErrorCodes.PAYMENT_FAILED, message: 'Payment failed or was cancelled', details: {} };
  }
  return { ticket };
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
