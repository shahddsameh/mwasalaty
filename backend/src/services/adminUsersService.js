import { ErrorCodes, makeError } from '../helpers/errors.js';
import { getSupabaseAdminClient } from './supabaseClient.js';

function isBlocked(user) {
  if (!user.banned_until) return false;
  return new Date(user.banned_until).getTime() > Date.now();
}

function mapUser(user) {
  const metadata = user.user_metadata || {};
  return {
    id: user.id,
    email: user.email,
    name: metadata.name || metadata.full_name || '',
    phone: user.phone || metadata.phone || '',
    created_at: user.created_at,
    last_sign_in_at: user.last_sign_in_at,
    status: isBlocked(user) ? 'blocked' : 'active',
  };
}

function assertSupabaseResult(error) {
  if (!error) return;
  throw makeError(ErrorCodes.INTERNAL_SERVER_ERROR, error.message);
}

export async function listAdminUsers() {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  assertSupabaseResult(error);
  return (data?.users || []).map(mapUser);
}

export async function updateAdminUser(id, input) {
  if (!id) throw makeError(ErrorCodes.VALIDATION_ERROR, 'User id is required');

  const supabase = getSupabaseAdminClient();
  const metadata = {};
  if (input.name !== undefined) {
    metadata.name = input.name;
    metadata.full_name = input.name;
  }
  if (input.phone !== undefined) metadata.phone = input.phone;

  const payload = {};
  if (input.email !== undefined) payload.email = input.email;
  if (Object.keys(metadata).length) payload.user_metadata = metadata;

  const { data, error } = await supabase.auth.admin.updateUserById(id, payload);
  assertSupabaseResult(error);
  return mapUser(data.user);
}

export async function blockAdminUser(id) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.auth.admin.updateUserById(id, {
    ban_duration: '876000h',
  });
  assertSupabaseResult(error);
  return mapUser(data.user);
}

export async function unblockAdminUser(id) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.auth.admin.updateUserById(id, {
    ban_duration: 'none',
  });
  assertSupabaseResult(error);
  return mapUser(data.user);
}
