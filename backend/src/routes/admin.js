import { Router } from 'express';
import {
  adminBlockUserHandler,
  adminLoginHandler,
  adminLogoutHandler,
  adminUnblockUserHandler,
  adminUpdateUserHandler,
  adminUsersHandler,
} from '../controllers/adminController.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = Router();

router.post('/admin/login', adminLoginHandler);
router.use('/admin', requireAdmin);
router.post('/admin/logout', adminLogoutHandler);
router.get('/admin/users', adminUsersHandler);
router.patch('/admin/users/:id', adminUpdateUserHandler);
router.post('/admin/users/:id/block', adminBlockUserHandler);
router.post('/admin/users/:id/unblock', adminUnblockUserHandler);

export default router;
