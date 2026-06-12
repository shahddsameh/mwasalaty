import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { generateKeyPairSync } from 'node:crypto';
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

async function withEnv(overrides, run) {
  const previous = {};
  for (const [name, value] of Object.entries(overrides)) {
    previous[name] = process.env[name];
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
  try {
    return await run();
  } finally {
    for (const [name, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
}

const withSecret = (secret, run) =>
  withEnv({ SUPABASE_JWT_SECRET: secret, SUPABASE_URL: undefined }, run);

test('Supabase auth rejects a missing bearer token', async () => {
  const res = makeResponse();
  await withSecret(TEST_SECRET, () =>
    requireSupabaseUser({ get: () => null }, res, () => assert.fail('next should not run'))
  );
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.error.code, 'AUTH_REQUIRED');
});

test('Supabase auth returns 503 when neither the JWT secret nor the URL is configured', async () => {
  const res = makeResponse();
  await withSecret(undefined, () =>
    requireSupabaseUser({ get: () => 'Bearer anything' }, res, () => assert.fail('next should not run'))
  );
  assert.equal(res.statusCode, 503);
  assert.equal(res.body.error.code, 'SUPABASE_SERVICE_ERROR');
});

test('Supabase auth rejects a token signed with the wrong secret', async () => {
  const token = jwt.sign({ sub: 'verified-user' }, 'attacker-secret', { algorithm: 'HS256' });
  const res = makeResponse();
  await withSecret(TEST_SECRET, () =>
    requireSupabaseUser({ get: () => `Bearer ${token}` }, res, () => assert.fail('next should not run'))
  );
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.error.code, 'AUTH_INVALID');
});

test('Supabase auth rejects an expired token', async () => {
  const token = jwt.sign({ sub: 'verified-user' }, TEST_SECRET, { algorithm: 'HS256', expiresIn: -10 });
  const res = makeResponse();
  await withSecret(TEST_SECRET, () =>
    requireSupabaseUser({ get: () => `Bearer ${token}` }, res, () => assert.fail('next should not run'))
  );
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.error.code, 'AUTH_INVALID');
});

test('Supabase auth accepts a valid token and derives the user id from sub', async () => {
  const token = jwt.sign(
    { sub: 'verified-user', email: 'rider@example.com', role: 'authenticated' },
    TEST_SECRET,
    { algorithm: 'HS256' }
  );
  const req = { get: () => `Bearer ${token}`, body: { user_id: 'attacker' } };
  const res = makeResponse();
  let called = false;
  await withSecret(TEST_SECRET, () => requireSupabaseUser(req, res, () => { called = true; }));
  assert.equal(called, true);
  assert.equal(req.auth.user.id, 'verified-user');
  assert.equal(req.auth.user.email, 'rider@example.com');
  assert.equal(req.auth.token, token);
});

// --- Asymmetric (JWKS) signing keys, used by newer Supabase projects ---

const KID = 'test-kid-1';
const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });

function jwksFor(key) {
  return { keys: [{ ...key.export({ format: 'jwk' }), kid: KID, use: 'sig', alg: 'ES256' }] };
}

async function withJwks(jwksBody, run) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: true, json: async () => jwksBody });
  try {
    return await withEnv(
      { SUPABASE_JWT_SECRET: undefined, SUPABASE_URL: `https://jwks-test-${Date.now()}.supabase.co` },
      run
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
}

test('Supabase auth accepts an ES256 token signed by a JWKS key', async () => {
  const token = jwt.sign(
    { sub: 'es256-user', email: 'rider@example.com', role: 'authenticated' },
    privateKey,
    { algorithm: 'ES256', keyid: KID }
  );
  const req = { get: () => `Bearer ${token}` };
  const res = makeResponse();
  let called = false;
  await withJwks(jwksFor(publicKey), () => requireSupabaseUser(req, res, () => { called = true; }));
  assert.equal(called, true);
  assert.equal(req.auth.user.id, 'es256-user');
});

test('Supabase auth rejects an ES256 token signed by a different key', async () => {
  const attacker = generateKeyPairSync('ec', { namedCurve: 'P-256' });
  const token = jwt.sign({ sub: 'es256-user' }, attacker.privateKey, {
    algorithm: 'ES256',
    keyid: KID,
  });
  const res = makeResponse();
  await withJwks(jwksFor(publicKey), () =>
    requireSupabaseUser({ get: () => `Bearer ${token}` }, res, () => assert.fail('next should not run'))
  );
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.error.code, 'AUTH_INVALID');
});
