import { Router } from 'express';
import { createCheckoutSessionHandler, getCheckoutResultHandler } from '../controllers/paymentController.js';

const router = Router();
router.post('/payments/checkout-session', createCheckoutSessionHandler);
router.get('/payments/checkout-session/:sessionId/result', getCheckoutResultHandler);
export default router;
