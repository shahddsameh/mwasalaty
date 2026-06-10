import { Router } from 'express';
import { requireSupabaseUser } from '../middleware/supabaseAuth.js';
import { createTicketHandler, getTicketHandler, listTicketsHandler, validateLegHandler, getScannerProfilesHandler, scanValidateHandler, refundTicketHandler, streamTicketHandler } from '../controllers/ticketController.js';

const router = Router();
router.get('/scanner-profiles', getScannerProfilesHandler);
router.post('/tickets', createTicketHandler);
// Rider-owned routes: authenticated, and scoped to the signed-in user's tickets.
router.get('/tickets', requireSupabaseUser, listTicketsHandler);
router.post('/tickets/scan/validate', scanValidateHandler);
router.get('/tickets/:id/events', streamTicketHandler);
router.get('/tickets/:id', requireSupabaseUser, getTicketHandler);
router.post('/tickets/:id/refund', requireSupabaseUser, refundTicketHandler);
router.post('/tickets/:id/legs/:legId/validate', validateLegHandler);
export default router;
