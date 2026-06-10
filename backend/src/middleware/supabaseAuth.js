import { ErrorCodes, makeError } from '../helpers/errors.js';

function supabaseConfig() {
  return {
    url: String(process.env.SUPABASE_URL ?? '').replace(/\/+$/, ''),
    apiKey: String(process.env.SUPABASE_ANON_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''),
  };
}

export async function requireSupabaseUser(req, res, next) {
  const authorization = req.get('authorization') ?? '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';

  if (!token) {
    return res.status(401).json(makeError(ErrorCodes.AUTH_REQUIRED, 'Authentication is required'));
  }

  const { url, apiKey } = supabaseConfig();
  if (!url || !apiKey) {
    return res.status(503).json(
      makeError(ErrorCodes.SUPABASE_SERVICE_ERROR, 'Supabase authentication is not configured')
    );
  }

  try {
    const response = await fetch(`${url}/auth/v1/user`, {
      headers: {
        apikey: apiKey,
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      return res.status(401).json(makeError(ErrorCodes.AUTH_INVALID, 'Authentication token is invalid'));
    }

    const user = await response.json();
    if (!user?.id) {
      return res.status(401).json(makeError(ErrorCodes.AUTH_INVALID, 'Authentication token is invalid'));
    }

    req.auth = { token, user };
    return next();
  } catch (error) {
    console.error('[supabaseAuth]', error);
    return res.status(503).json(
      makeError(ErrorCodes.SUPABASE_SERVICE_ERROR, 'Supabase authentication is unavailable')
    );
  }
}
