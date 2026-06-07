import crypto from 'node:crypto';
import { ErrorCodes } from '../helpers/errors.js';

const sessions = new Map();
const unauthorized = () => ({ code: ErrorCodes.ADMIN_UNAUTHORIZED, message: 'Invalid admin credentials', details: {} });

export function login(secret) {
  const configured = process.env.ADMIN_SECRET;
  if (!configured) throw unauthorized();
  const actual = Buffer.from(String(secret ?? ''));
  const expected = Buffer.from(configured);
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) throw unauthorized();
  const issuedAt = Date.now();
  const hours = Number(process.env.ADMIN_SESSION_TTL_HOURS ?? 12);
  const expiresAt = issuedAt + (Number.isFinite(hours) ? hours : 12) * 3_600_000;
  const token = `admtok_${crypto.randomBytes(16).toString('hex')}`;
  sessions.set(token, { issuedAt, expiresAt });
  return { token, expiresAt: new Date(expiresAt).toISOString() };
}

export function verifyToken(token) {
  const session = sessions.get(token);
  if (!session) return false;
  if (session.expiresAt <= Date.now()) {
    sessions.delete(token);
    return false;
  }
  return true;
}

export function logout(token) {
  sessions.delete(token);
}
