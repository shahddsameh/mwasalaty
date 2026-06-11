import { Router } from 'express';
import { routeIntentHandler } from '../controllers/aiController.js';

const router = Router();
router.post('/ai/route-intent', routeIntentHandler);
export default router;
