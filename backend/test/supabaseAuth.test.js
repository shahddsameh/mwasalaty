import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { requireSupabaseUser } from '../src/middleware/supabaseAuth.js';

const TEST_SECRET = 'test-jwt-secret';

function makeResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

function withSecret(secret, run) {
  const previous = process.env.SUPABASE_JWT_SECRET;
  if (secret === undefined) delete process.env.SUPABASE_JWT_SECRET;
  else process.env.SUPABASE_JWT_SECRET = secret;
  try {
    return run();
  } finally {
    if (previous === undefined) delete process.env.SUPABASE_JWT_SECRET;
    else process.env.SUPABASE_JWT_SECRET = previous;
  }
}

test('Supabase auth rejects a missing bearer token', () => {
  const res = makeResponse();
  withSecret(TEST_SECRET, () =>
    requireSupabaseUser({ get: () => null }, res, () => assert.fail('next should not run'))
  );
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.error.code, 'AUTH_REQUIRED');
});

test('Supabase auth returns 503 when the JWT secret is not configured', () => {
  const res = makeResponse();
  withSecret(undefined, () =>
    requireSupabaseUser({ get: () => 'Bearer anything' }, res, () => assert.fail('next should not run'))
  );
  assert.equal(res.statusCode, 503);
  assert.equal(res.body.error.code, 'SUPABASE_SERVICE_ERROR');
});

test('Supabase auth rejects a token signed with the wrong secret', () => {
  const token = jwt.sign({ sub: 'verified-user' }, 'attacker-secret', { algorithm: 'HS256' });
  const res = makeResponse();
  withSecret(TEST_SECRET, () =>
    requireSupabaseUser({ get: () => `Bearer ${token}` }, res, () => assert.fail('next should not run'))
  );
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.error.code, 'AUTH_INVALID');
});

test('Supabase auth rejects an expired token', () => {
  const token = jwt.sign({ sub: 'verified-user' }, TEST_SECRET, { algorithm: 'HS256', expiresIn: -10 });
  const res = makeResponse();
  withSecret(TEST_SECRET, () =>
    requireSupabaseUser({ get: () => `Bearer ${token}` }, res, () => assert.fail('next should not run'))
  );
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.error.code, 'AUTH_INVALID');
});

test('Supabase auth accepts a valid token and derives the user id from sub', () => {
  const token = jwt.sign(
    { sub: 'verified-user', email: 'rider@example.com', role: 'authenticated' },
    TEST_SECRET,
    { algorithm: 'HS256' }
  );
  const req = { get: () => `Bearer ${token}`, body: { user_id: 'attacker' } };
  const res = makeResponse();
  let called = false;
  withSecret(TEST_SECRET, () => requireSupabaseUser(req, res, () => { called = true; }));
  assert.equal(called, true);
  assert.equal(req.auth.user.id, 'verified-user');
  assert.equal(req.auth.user.email, 'rider@example.com');
  assert.equal(req.auth.token, token);
});
