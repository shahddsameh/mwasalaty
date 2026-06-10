import test from 'node:test';
import assert from 'node:assert/strict';
import { requireSupabaseUser } from '../src/middleware/supabaseAuth.js';

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

test('Supabase auth rejects a missing bearer token', async () => {
  const res = makeResponse();
  await requireSupabaseUser({ get: () => null }, res, () => assert.fail('next should not run'));
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.error.code, 'AUTH_REQUIRED');
});

test('Supabase auth accepts a verified user and ignores request-provided user IDs', async () => {
  const previousUrl = process.env.SUPABASE_URL;
  const previousKey = process.env.SUPABASE_ANON_KEY;
  const previousFetch = global.fetch;
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_ANON_KEY = 'anon';
  global.fetch = async () => ({ ok: true, json: async () => ({ id: 'verified-user' }) });
  try {
    const req = { get: () => 'Bearer valid-token', body: { user_id: 'attacker' } };
    const res = makeResponse();
    let called = false;
    await requireSupabaseUser(req, res, () => { called = true; });
    assert.equal(called, true);
    assert.equal(req.auth.user.id, 'verified-user');
  } finally {
    global.fetch = previousFetch;
    if (previousUrl) process.env.SUPABASE_URL = previousUrl;
    else delete process.env.SUPABASE_URL;
    if (previousKey) process.env.SUPABASE_ANON_KEY = previousKey;
    else delete process.env.SUPABASE_ANON_KEY;
  }
});

test('Supabase auth accepts a backend-only service-role key as the API key', async () => {
  const previousUrl = process.env.SUPABASE_URL;
  const previousAnonKey = process.env.SUPABASE_ANON_KEY;
  const previousServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const previousFetch = global.fetch;
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  delete process.env.SUPABASE_ANON_KEY;
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role';
  let receivedApiKey = '';
  global.fetch = async (_url, options) => {
    receivedApiKey = options.headers.apikey;
    return { ok: true, json: async () => ({ id: 'verified-user' }) };
  };
  try {
    const req = { get: () => 'Bearer valid-token' };
    await requireSupabaseUser(req, makeResponse(), () => {});
    assert.equal(receivedApiKey, 'service-role');
  } finally {
    global.fetch = previousFetch;
    if (previousUrl) process.env.SUPABASE_URL = previousUrl;
    else delete process.env.SUPABASE_URL;
    if (previousAnonKey) process.env.SUPABASE_ANON_KEY = previousAnonKey;
    else delete process.env.SUPABASE_ANON_KEY;
    if (previousServiceKey) process.env.SUPABASE_SERVICE_ROLE_KEY = previousServiceKey;
    else delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  }
});
