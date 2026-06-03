import { Router } from 'express';
import { createTicketHandler, getTicketHandler, validateLegHandler } from '../controllers/ticketController.js';

const router = Router();
router.post('/tickets', createTicketHandler);
router.get('/tickets/:id', getTicketHandler);
router.post('/tickets/:id/legs/:legId/validate', validateLegHandler);
export default router;
