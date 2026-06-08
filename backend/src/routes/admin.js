import { Router } from 'express';
import { requireAdmin } from '../middleware/requireAdmin.js';
import {
  loginHandler, logoutHandler, listPlacesHandler, createPlaceHandler, getPlaceHandler,
  updatePlaceHandler, deletePlaceHandler, getRoutesHandler, getDashboardHandler,
  listUsersHandler, updateUserHandler, blockUserHandler, unblockUserHandler,
} from '../controllers/adminController.js';

const router = Router();
router.post('/admin/login', loginHandler);
router.use('/admin', requireAdmin);
router.post('/admin/logout', logoutHandler);
router.get('/admin/places', listPlacesHandler);
router.post('/admin/places', createPlaceHandler);
router.get('/admin/places/:id', getPlaceHandler);
router.put('/admin/places/:id', updatePlaceHandler);
router.delete('/admin/places/:id', deletePlaceHandler);
router.get('/admin/routes', getRoutesHandler);
router.get('/admin/dashboard', getDashboardHandler);
router.get('/admin/users', listUsersHandler);
router.patch('/admin/users/:id', updateUserHandler);
router.post('/admin/users/:id/block', blockUserHandler);
router.post('/admin/users/:id/unblock', unblockUserHandler);
export default router;
