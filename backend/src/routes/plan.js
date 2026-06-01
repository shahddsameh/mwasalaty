import { Router } from 'express';
import { planHandler } from '../controllers/planController.js';

const router = Router();
router.post('/plan', planHandler);
export default router;
