import { ErrorCodes, makeError } from "../helpers/errors.js";
import { loginAdmin, logoutAdmin } from "../services/adminAuthService.js";
import {
  blockAdminUser,
  listAdminUsers,
  unblockAdminUser,
  updateAdminUser,
} from "../services/adminUsersService.js";
import {
  getSupportTickets,
  getSupportTicketById,
  updateSupportTicketData,
  createSupportTicket,
} from "../services/supportTicketService.js";
import { listRouteSearches, listTransitRoutes, listTransitStops } from "../services/otpImportService.js";

function statusFor(error) {
  switch (error?.code) {
    case ErrorCodes.ADMIN_UNAUTHORIZED:
      return 401;
    case ErrorCodes.VALIDATION_ERROR:
      return 400;
    default:
      return 500;
  }
}

function sendError(res, err) {
  const payload =
    err?.error ||
    makeError(ErrorCodes.INTERNAL_SERVER_ERROR, "Unexpected admin error").error;
  res.status(statusFor(payload)).json({ error: payload });
}

export function adminLoginHandler(req, res) {
  try {
    res.json(loginAdmin(req.body?.secret));
  } catch (err) {
    sendError(res, err);
  }
}

export function adminLogoutHandler(req, res) {
  logoutAdmin(req.adminToken);
  res.json({ ok: true });
}

export async function adminUsersHandler(req, res) {
  try {
    res.json({ users: await listAdminUsers() });
  } catch (err) {
    sendError(res, err);
  }
}

export async function adminUpdateUserHandler(req, res) {
  try {
    res.json({ user: await updateAdminUser(req.params.id, req.body || {}) });
  } catch (err) {
    sendError(res, err);
  }
}

export async function adminBlockUserHandler(req, res) {
  try {
    res.json({ user: await blockAdminUser(req.params.id) });
  } catch (err) {
    sendError(res, err);
  }
}

export async function adminUnblockUserHandler(req, res) {
  try {
    res.json({ user: await unblockAdminUser(req.params.id) });
  } catch (err) {
    sendError(res, err);
  }
}

// Support Tickets Handlers

export async function adminGetSupportTicketsHandler(req, res) {
  try {
    const tickets = await getSupportTickets();
    res.json({ tickets });
  } catch (err) {
    sendError(res, err);
  }
}

export async function adminTransitRoutesHandler(req, res) {
  try {
    res.json({ routes: await listTransitRoutes() });
  } catch (err) {
    sendError(res, err);
  }
}

export async function adminGetSupportTicketHandler(req, res) {
  try {
    const ticket = await getSupportTicketById(req.params.id);
    res.json({ ticket });
  } catch (err) {
    if (err.code === "NOT_FOUND") {
      res.status(404).json({
        error: makeError("NOT_FOUND", "Support ticket not found").error,
      });
    } else {
      sendError(res, err);
    }
  }
}

export async function adminUpdateSupportTicketHandler(req, res) {
  try {
    const ticket = await updateSupportTicketData(req.params.id, req.body || {});
    res.json({ ticket });
  } catch (err) {
    if (err.code === "NOT_FOUND") {
      res.status(404).json({
        error: makeError("NOT_FOUND", "Support ticket not found").error,
      });
    } else if (err.code === "VALIDATION_ERROR") {
      res
        .status(400)
        .json({ error: makeError("VALIDATION_ERROR", err.message).error });
    } else {
      sendError(res, err);
    }
  }
}

// Public endpoint for users to submit support tickets
export async function createSupportTicketHandler(req, res) {
  try {
    const ticket = await createSupportTicket(req.body || {});
    res.status(201).json({ ticket });
  } catch (err) {
    if (err.code === "VALIDATION_ERROR") {
      res
        .status(400)
        .json({ error: makeError("VALIDATION_ERROR", err.message).error });
    } else {
      console.error("[createSupportTicket] Error:", err);
      res
        .status(500)
        .json({
          error: makeError(
            ErrorCodes.INTERNAL_SERVER_ERROR,
            "Failed to submit support ticket",
          ).error,
        });
    }
  }
}

export async function adminTransitStopsHandler(req, res) {
  try {
    res.json({ stops: await listTransitStops() });
  } catch (err) {
    sendError(res, err);
  }
}

export async function adminRouteSearchesHandler(req, res) {
  try {
    res.json({ searches: await listRouteSearches() });
  } catch (err) {
    sendError(res, err);
  }
}
