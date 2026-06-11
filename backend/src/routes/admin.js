import { Router } from "express";
import {
  adminBlockUserHandler,
  adminDashboardStatsHandler,
  adminActivateTicketHandler,
  adminMarkRefundedHandler,
  adminRefundFailedHandler,
  adminTicketHandler,
  adminTicketsHandler,
  adminTicketStatusHandler,
  adminLoginHandler,
  adminLogoutHandler,
  adminRouteSearchesHandler,
  adminTransitRouteDetailsHandler,
  adminTransitRoutesHandler,
  adminTransitStopDetailsHandler,
  adminTransitStopsHandler,
  adminUnblockUserHandler,
  adminUpdateUserHandler,
  adminUsersHandler,
  adminGetSupportTicketsHandler,
  adminGetSupportTicketHandler,
  adminUpdateSupportTicketHandler,
  adminReplySupportTicketHandler,
  createSupportTicketHandler,
  meStatusHandler,
} from "../controllers/adminController.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = Router();

router.post("/admin/login", adminLoginHandler);

// Public endpoint for users to submit support tickets
router.post("/support/tickets", createSupportTicketHandler);
router.get("/me/status", meStatusHandler);

router.use("/admin", requireAdmin);
router.post("/admin/logout", adminLogoutHandler);
router.get("/admin/users", adminUsersHandler);
router.patch("/admin/users/:id", adminUpdateUserHandler);
router.post("/admin/users/:id/block", adminBlockUserHandler);
router.post("/admin/users/:id/unblock", adminUnblockUserHandler);
router.get("/admin/dashboard/stats", adminDashboardStatsHandler);
router.get("/admin/tickets", adminTicketsHandler);
router.get("/admin/tickets/:id", adminTicketHandler);
router.patch("/admin/tickets/:id/status", adminTicketStatusHandler);
router.post("/admin/tickets/:id/activate", adminActivateTicketHandler);
router.post("/admin/tickets/:id/mark-refunded", adminMarkRefundedHandler);
router.post("/admin/tickets/:id/refund-failed", adminRefundFailedHandler);

// Support Tickets (admin only)
router.get("/admin/support/tickets", adminGetSupportTicketsHandler);
router.get("/admin/support/tickets/:id", adminGetSupportTicketHandler);
router.patch("/admin/support/tickets/:id", adminUpdateSupportTicketHandler);
router.post("/admin/support/tickets/:id/reply", adminReplySupportTicketHandler);
router.get("/admin/support-tickets", adminGetSupportTicketsHandler);
router.get("/admin/support-tickets/:id", adminGetSupportTicketHandler);
router.patch("/admin/support-tickets/:id/status", adminUpdateSupportTicketHandler);
router.post("/admin/support-tickets/:id/reply", adminReplySupportTicketHandler);
router.get("/admin/transit/routes/:id/details", adminTransitRouteDetailsHandler);
router.get("/admin/transit/routes", adminTransitRoutesHandler);
router.get("/admin/transit/stops/:id/details", adminTransitStopDetailsHandler);
router.get("/admin/transit/stops", adminTransitStopsHandler);
router.get("/admin/routes/searches", adminRouteSearchesHandler);

export default router;
