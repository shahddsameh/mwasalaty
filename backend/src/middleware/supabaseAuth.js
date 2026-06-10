import jwt from 'jsonwebtoken';
import { ErrorCodes, makeError } from '../helpers/errors.js';

function jwtSecret() {
  return String(process.env.SUPABASE_JWT_SECRET ?? '');
}

/** Extracts the `Bearer` token from the Authorization header, or '' if absent. */
export function bearerToken(req) {
  const authorization = req.get('authorization') ?? '';
  return authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
}

/**
 * Verifies a Supabase user access token locally instead of round-tripping to
 * `/auth/v1/user`. Supabase signs user JWTs with the project's JWT secret
 * (HS256), so we can verify the signature and expiry offline.
 *
 * Returns `{ user }` on success or `{ error: { status, code, message } }` on
 * failure — no throwing — so both the middleware and the SSE stream handler
 * (which authenticates via a query param) can share one code path.
 */
export function verifyAccessToken(token) {
  if (!token) {
    return { error: { status: 401, code: ErrorCodes.AUTH_REQUIRED, message: 'Authentication is required' } };
  }

  const secret = jwtSecret();
  if (!secret) {
    return { error: { status: 503, code: ErrorCodes.SUPABASE_SERVICE_ERROR, message: 'Supabase authentication is not configured' } };
  }

  let payload;
  try {
    payload = jwt.verify(token, secret, { algorithms: ['HS256'] });
  } catch {
    return { error: { status: 401, code: ErrorCodes.AUTH_INVALID, message: 'Authentication token is invalid' } };
  }

  if (!payload?.sub) {
    return { error: { status: 401, code: ErrorCodes.AUTH_INVALID, message: 'Authentication token is invalid' } };
  }

  return { user: { id: payload.sub, email: payload.email, role: payload.role } };
}

/**
 * Express middleware that requires a verified Supabase user. The original token
 * is preserved on `req.auth.token` because downstream Supabase REST calls still
 * pass it through to enforce row-level security.
 */
export function requireSupabaseUser(req, res, next) {
  const token = bearerToken(req);
  const result = verifyAccessToken(token);
  if (result.error) {
    return res.status(result.error.status).json(makeError(result.error.code, result.error.message));
  }
  req.auth = { token, user: result.user };
  return next();
}
