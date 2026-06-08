import { ErrorCodes, makeError } from '../helpers/errors.js';
import { loginAdmin, logoutAdmin } from '../services/adminAuthService.js';
import {
  blockAdminUser,
  listAdminUsers,
  unblockAdminUser,
  updateAdminUser,
} from '../services/adminUsersService.js';

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
  const payload = err?.error || makeError(ErrorCodes.INTERNAL_SERVER_ERROR, 'Unexpected admin error').error;
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
