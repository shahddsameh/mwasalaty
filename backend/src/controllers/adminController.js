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
import { getSupabaseAdminClient } from "../services/supabaseClient.js";
import { getAllTickets } from "../stores/ticketStore.js";

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

function normalizeMode(mode) {
  const value = String(mode || "Unknown").toLowerCase();
  if (value === "bus") return "Bus";
  if (["metro", "subway", "rail"].includes(value)) return "Metro";
  return mode || "Unknown";
}

function dayKey(value) {
  if (!value) return "Unknown";
  return new Date(value).toISOString().slice(0, 10);
}

async function countTable(supabase, table) {
  const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });
  if (error) throw error;
  return count || 0;
}

export async function adminDashboardStatsHandler(req, res) {
  try {
    const supabase = getSupabaseAdminClient();
    const [users, supportTickets, tickets, transitRoutes, routeSearchesResult, transitRoutesCount, transitStopsCount, routeSearchesCount] =
      await Promise.all([
        listAdminUsers(),
        getSupportTickets(),
        Promise.resolve(getAllTickets()),
        listTransitRoutes(),
        supabase.from("route_searches").select("*").order("created_at", { ascending: false }).limit(1000),
        countTable(supabase, "transit_routes"),
        countTable(supabase, "transit_stops"),
        countTable(supabase, "route_searches"),
      ]);

    if (routeSearchesResult.error) throw routeSearchesResult.error;
    const routeSearches = routeSearchesResult.data || [];

    const byDay = new Map();
    const topRoutes = new Map();
    for (const search of routeSearches) {
      const day = dayKey(search.created_at);
      byDay.set(day, (byDay.get(day) || 0) + 1);

      const key = `${search.from_label || "-"} -> ${search.to_label || "-"}`;
      const current = topRoutes.get(key) || {
        from_label: search.from_label,
        to_label: search.to_label,
        search_count: 0,
      };
      current.search_count += 1;
      topRoutes.set(key, current);
    }

    const byMode = new Map();
    for (const route of transitRoutes) {
      const mode = normalizeMode(route.mode);
      byMode.set(mode, (byMode.get(mode) || 0) + 1);
    }

    const byStatus = new Map();
    for (const ticket of tickets) {
      const status = ticket.payment?.status || ticket.status || "pending";
      byStatus.set(status, (byStatus.get(status) || 0) + 1);
    }
    for (const ticket of supportTickets) {
      const status = ticket.status === "resolved" || ticket.status === "closed" ? "closed" : "open";
      byStatus.set(status, (byStatus.get(status) || 0) + 1);
    }

    res.json({
      totals: {
        users: users.length,
        transitRoutes: transitRoutesCount,
        transitStops: transitStopsCount,
        routeSearches: routeSearchesCount,
        tickets: tickets.length,
        supportTickets: supportTickets.length,
      },
      routeSearchesByDay: Array.from(byDay.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => String(a.date).localeCompare(String(b.date))),
      transitRoutesByMode: Array.from(byMode.entries()).map(([mode, count]) => ({ mode, count })),
      ticketsByStatus: Array.from(byStatus.entries()).map(([status, count]) => ({ status, count })),
      topSearchedRoutes: Array.from(topRoutes.values())
        .sort((a, b) => b.search_count - a.search_count)
        .slice(0, 5),
      recentRouteSearches: routeSearches.slice(0, 8).map((search) => ({
        from_label: search.from_label,
        to_label: search.to_label,
        created_at: search.created_at,
        total_routes: search.total_routes,
      })),
    });
  } catch (err) {
    sendError(res, err);
  }
}
