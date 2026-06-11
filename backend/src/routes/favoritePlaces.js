import { Router } from 'express';
import { requireSupabaseUser } from '../middleware/supabaseAuth.js';
import {
  deleteFavoritePlaceHandler,
  listFavoritePlacesHandler,
  patchFavoritePlaceHandler,
  upsertFavoritePlaceHandler,
} from '../controllers/favoritePlacesController.js';

const router = Router();
router.use('/favorite-places', requireSupabaseUser);
router.get('/favorite-places', listFavoritePlacesHandler);
router.put('/favorite-places/:id', upsertFavoritePlaceHandler);
router.patch('/favorite-places/:id', patchFavoritePlaceHandler);
router.delete('/favorite-places/:id', deleteFavoritePlaceHandler);
export default router;
