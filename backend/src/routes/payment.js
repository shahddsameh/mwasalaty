import { Router } from 'express';
import { createCheckoutSessionHandler, getCheckoutResultHandler, webhookHandler, confirmRedirectHandler } from '../controllers/paymentController.js';
import { requireSupabaseUser } from '../middleware/supabaseAuth.js';

const router = Router();
router.post('/payments/checkout-session', requireSupabaseUser, createCheckoutSessionHandler);
router.get('/payments/checkout-session/:sessionId/result', getCheckoutResultHandler);
router.post('/payments/confirm-redirect', confirmRedirectHandler);
router.post('/payments/paymob-webhook', webhookHandler);
export default router;
