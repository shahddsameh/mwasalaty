import { createClient } from '@supabase/supabase-js';
import { ErrorCodes } from '../helpers/errors.js';

let client;

export function getSupabaseAdminClient() {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw {
      code: ErrorCodes.VALIDATION_ERROR,
      message: 'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required',
      details: {},
    };
  }
  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}
