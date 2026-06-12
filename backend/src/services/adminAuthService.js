import crypto from 'crypto';
import { ErrorCodes, makeError } from '../helpers/errors.js';

const sessions = new Map();

function getAdminSecret() {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    throw makeError(
      ErrorCodes.VALIDATION_ERROR,
      'ADMIN_SECRET is required for admin login',
    );
  }
  return secret;
}

function secretsMatch(input, expected) {
  const inputBuffer = Buffer.from(String(input || ''));
  const expectedBuffer = Buffer.from(expected);
  return (
    inputBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(inputBuffer, expectedBuffer)
  );
}

export function loginAdmin(secret) {
  const expected = getAdminSecret();
  if (!secretsMatch(secret, expected)) {
    throw makeError(ErrorCodes.ADMIN_UNAUTHORIZED, 'Invalid admin secret');
  }

  const ttlHours = Number(process.env.ADMIN_SESSION_TTL_HOURS || 12);
  const expiresAt = Date.now() + ttlHours * 60 * 60 * 1000;
  const token = `adm_${crypto.randomBytes(32).toString('hex')}`;
  sessions.set(token, expiresAt);
  return { token, expiresAt: new Date(expiresAt).toISOString() };
}

export function verifyAdminToken(token) {
  const expiresAt = sessions.get(token);
  if (!expiresAt || expiresAt < Date.now()) {
    if (expiresAt) sessions.delete(token);
    throw makeError(ErrorCodes.ADMIN_UNAUTHORIZED, 'Admin session expired');
  }
  return true;
}

export function logoutAdmin(token) {
  if (token) sessions.delete(token);
}
