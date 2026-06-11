import jwt from 'jsonwebtoken';
import { createPublicKey } from 'node:crypto';
import { ErrorCodes, makeError } from '../helpers/errors.js';

/** Asymmetric algorithms Supabase uses for its newer JWT signing keys. */
const JWKS_ALGORITHMS = ['ES256', 'RS256'];

/** Minimum time between JWKS refetches when an unknown `kid` shows up. */
const JWKS_REFETCH_COOLDOWN_MS = 60_000;

function jwtSecret() {
  return String(process.env.SUPABASE_JWT_SECRET ?? '');
}

function jwksUrl() {
  const base = String(process.env.SUPABASE_URL ?? '').replace(/\/+$/, '');
  return base ? `${base}/auth/v1/.well-known/jwks.json` : '';
}

/** kid → public KeyObject, cached per JWKS URL so a config change resets it. */
let jwksCache = { url: '', keys: new Map(), fetchedAt: 0 };

async function fetchJwks(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`JWKS request failed with status ${response.status}`);
  }
  const body = await response.json();
  const keys = new Map();
  for (const jwk of body?.keys ?? []) {
    if (!jwk.kid || jwk.use === 'enc') continue;
    try {
      keys.set(jwk.kid, createPublicKey({ key: jwk, format: 'jwk' }));
    } catch {
      // Skip keys Node's crypto can't import; others may still verify.
    }
  }
  jwksCache = { url, keys, fetchedAt: Date.now() };
}

async function getJwksKey(url, kid) {
  if (jwksCache.url !== url || jwksCache.keys.size === 0) {
    await fetchJwks(url);
  } else if (
    !jwksCache.keys.has(kid) &&
    Date.now() - jwksCache.fetchedAt > JWKS_REFETCH_COOLDOWN_MS
  ) {
    // Unknown kid usually means the project rotated its signing key.
    await fetchJwks(url);
  }
  return jwksCache.keys.get(kid) ?? null;
}

/** Extracts the `Bearer` token from the Authorization header, or '' if absent. */
export function bearerToken(req) {
  const authorization = req.get('authorization') ?? '';
  return authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
}

const authRequired = () => ({
  error: { status: 401, code: ErrorCodes.AUTH_REQUIRED, message: 'Authentication is required' },
});
const authInvalid = () => ({
  error: { status: 401, code: ErrorCodes.AUTH_INVALID, message: 'Authentication token is invalid' },
});
const notConfigured = () => ({
  error: { status: 503, code: ErrorCodes.SUPABASE_SERVICE_ERROR, message: 'Supabase authentication is not configured' },
});

/**
 * Verifies a Supabase user access token locally instead of round-tripping to
 * `/auth/v1/user`. Legacy projects sign user JWTs with a shared secret
 * (HS256, `SUPABASE_JWT_SECRET`); newer projects use asymmetric signing keys
 * (ES256/RS256) whose public halves are published at
 * `<SUPABASE_URL>/auth/v1/.well-known/jwks.json`. Both paths are supported,
 * chosen by the token's `alg` header.
 *
 * Returns `{ user }` on success or `{ error: { status, code, message } }` on
 * failure — no throwing — so both the middleware and the SSE stream handler
 * (which authenticates via a query param) can share one code path.
 */
export async function verifyAccessToken(token) {
  if (!token) return authRequired();

  const secret = jwtSecret();
  const url = jwksUrl();
  if (!secret && !url) return notConfigured();

  const decoded = jwt.decode(token, { complete: true });
  const alg = decoded?.header?.alg;

  let key;
  let algorithms;
  if (alg === 'HS256') {
    if (!secret) return notConfigured();
    key = secret;
    algorithms = ['HS256'];
  } else if (JWKS_ALGORITHMS.includes(alg)) {
    if (!url) return notConfigured();
    try {
      key = await getJwksKey(url, decoded.header.kid);
    } catch {
      return {
        error: {
          status: 503,
          code: ErrorCodes.SUPABASE_SERVICE_ERROR,
          message: 'Could not fetch Supabase signing keys',
        },
      };
    }
    if (!key) return authInvalid();
    algorithms = [alg];
  } else {
    return authInvalid();
  }

  let payload;
  try {
    payload = jwt.verify(token, key, { algorithms });
  } catch {
    return authInvalid();
  }

  if (!payload?.sub) return authInvalid();

  return { user: { id: payload.sub, email: payload.email, role: payload.role } };
}

/**
 * Express middleware that requires a verified Supabase user. The original token
 * is preserved on `req.auth.token` because downstream Supabase REST calls still
 * pass it through to enforce row-level security.
 */
export async function requireSupabaseUser(req, res, next) {
  const token = bearerToken(req);
  const result = await verifyAccessToken(token);
  if (result.error) {
    return res.status(result.error.status).json(makeError(result.error.code, result.error.message));
  }
  req.auth = { token, user: result.user };
  return next();
}
