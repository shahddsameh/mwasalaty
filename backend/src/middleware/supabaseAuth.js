import jwt from 'jsonwebtoken';
import { ErrorCodes, makeError } from '../helpers/errors.js';

function jwtSecret() {
  return String(process.env.SUPABASE_JWT_SECRET ?? '');
}

/**
 * Verifies a Supabase user access token locally instead of round-tripping to
 * `/auth/v1/user`. Supabase signs user JWTs with the project's JWT secret
 * (HS256), so we can verify the signature and expiry offline. The original
 * token is preserved on `req.auth.token` because downstream Supabase REST calls
 * still pass it through to enforce row-level security.
 */
export function requireSupabaseUser(req, res, next) {
  const authorization = req.get('authorization') ?? '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';

  if (!token) {
    return res.status(401).json(makeError(ErrorCodes.AUTH_REQUIRED, 'Authentication is required'));
  }

  const secret = jwtSecret();
  if (!secret) {
    return res.status(503).json(
      makeError(ErrorCodes.SUPABASE_SERVICE_ERROR, 'Supabase authentication is not configured')
    );
  }

  let payload;
  try {
    payload = jwt.verify(token, secret, { algorithms: ['HS256'] });
  } catch {
    return res.status(401).json(makeError(ErrorCodes.AUTH_INVALID, 'Authentication token is invalid'));
  }

  if (!payload?.sub) {
    return res.status(401).json(makeError(ErrorCodes.AUTH_INVALID, 'Authentication token is invalid'));
  }

  req.auth = {
    token,
    user: { id: payload.sub, email: payload.email, role: payload.role },
  };
  return next();
}
