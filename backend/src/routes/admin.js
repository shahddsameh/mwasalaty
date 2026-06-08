import { Router } from "express";
import {
  adminBlockUserHandler,
  adminLoginHandler,
  adminLogoutHandler,
  adminUnblockUserHandler,
  adminUpdateUserHandler,
  adminUsersHandler,
  adminGetSupportTicketsHandler,
  adminGetSupportTicketHandler,
  adminUpdateSupportTicketHandler,
  createSupportTicketHandler,
} from "../controllers/adminController.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = Router();

router.post("/admin/login", adminLoginHandler);

// Public endpoint for users to submit support tickets
router.post("/support/tickets", createSupportTicketHandler);

router.use("/admin", requireAdmin);
router.post("/admin/logout", adminLogoutHandler);
router.get("/admin/users", adminUsersHandler);
router.patch("/admin/users/:id", adminUpdateUserHandler);
router.post("/admin/users/:id/block", adminBlockUserHandler);
router.post("/admin/users/:id/unblock", adminUnblockUserHandler);

// Support Tickets (admin only)
router.get("/admin/support/tickets", adminGetSupportTicketsHandler);
router.get("/admin/support/tickets/:id", adminGetSupportTicketHandler);
router.patch("/admin/support/tickets/:id", adminUpdateSupportTicketHandler);

export default router;
