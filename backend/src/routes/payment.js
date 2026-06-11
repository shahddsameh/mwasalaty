import { Router } from 'express';
import { createCheckoutSessionHandler, getCheckoutResultHandler, webhookHandler, confirmRedirectHandler } from '../controllers/paymentController.js';

const router = Router();
router.post('/payments/checkout-session', createCheckoutSessionHandler);
router.get('/payments/checkout-session/:sessionId/result', getCheckoutResultHandler);
router.post('/payments/confirm-redirect', confirmRedirectHandler);
router.post('/payments/paymob-webhook', webhookHandler);
export default router;
