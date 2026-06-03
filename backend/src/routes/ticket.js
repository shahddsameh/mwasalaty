import { Router } from 'express';
import { createTicketHandler, getTicketHandler, validateLegHandler, getScannerProfilesHandler, scanValidateHandler, refundTicketHandler } from '../controllers/ticketController.js';

const router = Router();
router.get('/scanner-profiles', getScannerProfilesHandler);
router.post('/tickets', createTicketHandler);
router.post('/tickets/scan/validate', scanValidateHandler);
router.get('/tickets/:id', getTicketHandler);
router.post('/tickets/:id/refund', refundTicketHandler);
router.post('/tickets/:id/legs/:legId/validate', validateLegHandler);
export default router;
