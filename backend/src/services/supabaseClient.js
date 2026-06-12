import { createClient } from '@supabase/supabase-js';
import { ErrorCodes, makeError } from '../helpers/errors.js';

let client;

export function getSupabaseAdminClient() {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw makeError(
      ErrorCodes.VALIDATION_ERROR,
      'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for admin users',
    );
  }

  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
