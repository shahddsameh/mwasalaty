import * as adminAuthService from '../services/adminAuthService.js';
import { ErrorCodes, makeError } from '../helpers/errors.js';

export function requireAdmin(req, res, next) {
  const match = req.get('Authorization')?.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1];
  if (!token || !adminAuthService.verifyToken(token)) {
    return res.status(401).json(makeError(ErrorCodes.ADMIN_UNAUTHORIZED, 'Admin authentication required'));
  }
  req.adminToken = token;
  return next();
}
