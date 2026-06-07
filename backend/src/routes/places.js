import { Router } from 'express';
import { getPublicPlacesHandler } from '../controllers/placesController.js';

const router = Router();
router.get('/places', getPublicPlacesHandler);
export default router;
