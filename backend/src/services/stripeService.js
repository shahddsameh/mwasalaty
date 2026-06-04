import Stripe from 'stripe';

let _stripe = null;
const getStripe = () => _stripe ?? (_stripe = new Stripe(process.env.STRIPE_SECRET_KEY));

export async function createCheckoutSession({ totalAmountEGP, currency, successUrl, cancelUrl }) {
  return getStripe().checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: currency.toLowerCase(),
        product_data: { name: 'Mwasalaty Transit Ticket' },
        unit_amount: Math.round(totalAmountEGP * 100),
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
  });
}

export function constructWebhookEvent(rawBody, signature, secret) {
  return Stripe.webhooks.constructEvent(rawBody, signature, secret);
}

export async function createRefund({ paymentIntentId, amountEGP }) {
  return getStripe().refunds.create({
    payment_intent: paymentIntentId,
    amount: Math.round(amountEGP * 100),
  });
}
