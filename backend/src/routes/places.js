import { Router } from 'express';
import { placesSearchHandler } from '../controllers/placesController.js';

const router = Router();
router.get('/places/search', placesSearchHandler);
export default router;
