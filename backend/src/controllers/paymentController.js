import { createCheckoutSession, handleWebhookEvent, getCheckoutResult } from '../services/paymentService.js';
import { makeError, ErrorCodes } from '../helpers/errors.js';

const STATUS_MAP = {
  [ErrorCodes.VALIDATION_ERROR]:       400,
  [ErrorCodes.PAYMENT_SESSION_FAILED]: 502,
  [ErrorCodes.PAYMENT_WEBHOOK_FAILED]: 400,
  [ErrorCodes.PAYMENT_NOT_FOUND]:      404,
  [ErrorCodes.PAYMENT_NOT_COMPLETED]:  202,
  [ErrorCodes.REFUND_FAILED]:          502,
  [ErrorCodes.STRIPE_REFUND_FAILED]:   502,
  [ErrorCodes.TICKET_NOT_FOUND]:       404,
};

function handleServiceError(res, err) {
  const status = STATUS_MAP[err.code];
  if (status) {
    return res.status(status).json(makeError(err.code, err.message, err.details ?? {}));
  }
  console.error('[paymentController]', err);
  return res.status(500).json(makeError(ErrorCodes.INTERNAL_SERVER_ERROR, 'An unexpected error occurred'));
}

export async function createCheckoutSessionHandler(req, res) {
  try {
    const result = await createCheckoutSession(req.body);
    return res.status(200).json(result);
  } catch (err) {
    return handleServiceError(res, err);
  }
}

export async function webhookHandler(req, res) {
  const signature = req.headers['stripe-signature'];
  try {
    await handleWebhookEvent(req.body, signature);
    return res.status(200).json({ received: true });
  } catch (err) {
    return handleServiceError(res, err);
  }
}

export async function getCheckoutResultHandler(req, res) {
  try {
    const result = getCheckoutResult(req.params.sessionId);
    return res.status(200).json(result);
  } catch (err) {
    if (err.code === ErrorCodes.PAYMENT_NOT_COMPLETED) {
      return res.status(202).json({ status: err.details?.status ?? 'pending' });
    }
    return handleServiceError(res, err);
  }
}
