import crypto from 'node:crypto';

const PAYMOB_BASE = 'https://accept.paymob.com';

/**
 * Create a PayMob payment intention (Unified Checkout / Intention API).
 * Returns the client_secret used to build the checkout URL, plus the PayMob order id.
 */
export async function createIntention({
  amountEGP,
  currency,
  items,
  billingData,
  customer,
  specialReference,
  redirectionUrl,
  notificationUrl,
}) {
  const res = await fetch(`${PAYMOB_BASE}/v1/intention/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Token ${process.env.PAYMOB_SECRET_KEY}`,
    },
    body: JSON.stringify({
      amount: Math.round(amountEGP * 100), // piasters
      currency,
      payment_methods: [Number(process.env.PAYMOB_INTEGRATION_ID)],
      items,
      billing_data: billingData,
      customer,
      special_reference: specialReference,
      redirection_url: redirectionUrl,
      notification_url: notificationUrl,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = data?.detail ?? data?.message ?? JSON.stringify(data);
    throw new Error(`PayMob intention failed (${res.status}): ${detail}`);
  }

  return {
    clientSecret: data.client_secret,
    paymobOrderId: data.intention_order_id ?? data.id ?? null,
    raw: data,
  };
}

/** Build the Unified Checkout redirect URL the customer is sent to. */
export function buildCheckoutUrl(clientSecret) {
  return `${PAYMOB_BASE}/unifiedcheckout/?publicKey=${process.env.PAYMOB_PUBLIC_KEY}&clientSecret=${clientSecret}`;
}

// Transaction-callback fields, in the exact order PayMob concatenates them for the HMAC.
const HMAC_FIELDS = [
  'amount_cents',
  'created_at',
  'currency',
  'error_occured',
  'has_parent_transaction',
  'id',
  'integration_id',
  'is_3d_secure',
  'is_auth',
  'is_capture',
  'is_refunded',
  'is_standalone_payment',
  'is_voided',
  'order.id',
  'owner',
  'pending',
  'source_data.pan',
  'source_data.sub_type',
  'source_data.type',
  'success',
];

function readPath(obj, path) {
  return path.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
}

/**
 * Verify a PayMob transaction callback against the `hmac` query param.
 * Concatenates the ordered transaction fields and compares an HMAC-SHA512.
 */
export function verifyHmac(obj, receivedHmac) {
  if (!receivedHmac || !process.env.PAYMOB_HMAC_SECRET) return false;

  const concatenated = HMAC_FIELDS
    .map((field) => {
      const value = readPath(obj, field);
      if (typeof value === 'boolean') return value ? 'true' : 'false';
      return value == null ? '' : String(value);
    })
    .join('');

  const computed = crypto
    .createHmac('sha512', process.env.PAYMOB_HMAC_SECRET)
    .update(concatenated)
    .digest('hex');

  const a = Buffer.from(computed, 'utf8');
  const b = Buffer.from(String(receivedHmac), 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * Refund a PayMob transaction. Uses the legacy auth-token + refund endpoint
 * (needs PAYMOB_API_KEY). Only invoked by the refund endpoint.
 */
export async function createRefund({ transactionId, amountEGP }) {
  const authRes = await fetch(`${PAYMOB_BASE}/api/auth/tokens`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: process.env.PAYMOB_API_KEY }),
  });
  const authData = await authRes.json().catch(() => ({}));
  if (!authRes.ok || !authData.token) {
    throw new Error(`PayMob auth failed (${authRes.status})`);
  }

  const refundRes = await fetch(`${PAYMOB_BASE}/api/acceptance/void_refund/refund`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      auth_token: authData.token,
      transaction_id: transactionId,
      amount_cents: Math.round(amountEGP * 100),
    }),
  });
  const refundData = await refundRes.json().catch(() => ({}));
  if (!refundRes.ok) {
    const detail = refundData?.message ?? JSON.stringify(refundData);
    throw new Error(`PayMob refund failed (${refundRes.status}): ${detail}`);
  }

  return refundData;
}
