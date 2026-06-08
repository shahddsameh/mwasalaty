import { ErrorCodes, makeError } from '../helpers/errors.js';
import { verifyAdminToken } from '../services/adminAuthService.js';

export function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';

  try {
    verifyAdminToken(token);
    req.adminToken = token;
    next();
  } catch (err) {
    const payload = err?.error || makeError(ErrorCodes.ADMIN_UNAUTHORIZED, 'Admin login required').error;
    res.status(401).json({ error: payload });
  }
}
