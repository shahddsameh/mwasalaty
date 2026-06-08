import { ErrorCodes } from '../helpers/errors.js';
import { getSupabaseAdminClient } from './supabaseClient.js';

function validation(message) {
  return { code: ErrorCodes.VALIDATION_ERROR, message, details: {} };
}

function getClient() {
  try {
    return getSupabaseAdminClient();
  } catch {
    throw validation('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for admin users');
  }
}

function mapUser(user) {
  const metadata = user.user_metadata ?? {};
  return {
    id: user.id,
    email: user.email,
    name: metadata.full_name ?? metadata.name ?? '',
    phone: user.phone ?? metadata.phone ?? '',
    created_at: user.created_at,
    last_sign_in_at: user.last_sign_in_at,
    status: user.banned_until && new Date(user.banned_until) > new Date() ? 'blocked' : 'active',
  };
}

export async function listUsers() {
  const { data, error } = await getClient().auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw validation(error.message);
  return data.users.map(mapUser);
}

export async function updateUser(id, input) {
  const metadata = {};
  if (typeof input?.name === 'string') metadata.full_name = input.name;
  if (typeof input?.phone === 'string') metadata.phone = input.phone;
  const updates = {};
  if (typeof input?.email === 'string') updates.email = input.email;
  if (Object.keys(metadata).length) updates.user_metadata = metadata;
  const { data, error } = await getClient().auth.admin.updateUserById(id, updates);
  if (error) throw validation(error.message);
  return mapUser(data.user);
}

export async function blockUser(id) {
  const { data, error } = await getClient().auth.admin.updateUserById(id, { ban_duration: '876000h' });
  if (error) throw validation(error.message);
  return mapUser(data.user);
}

export async function unblockUser(id) {
  const { data, error } = await getClient().auth.admin.updateUserById(id, { ban_duration: 'none' });
  if (error) throw validation(error.message);
  return mapUser(data.user);
}
