import test from 'node:test';
import assert from 'node:assert/strict';
import * as auth from '../src/services/adminAuthService.js';

test('admin auth fails closed, validates secrets, expires, and logs out', async () => {
  const originalSecret = process.env.ADMIN_SECRET;
  const originalTtl = process.env.ADMIN_SESSION_TTL_HOURS;
  try {
    delete process.env.ADMIN_SECRET;
    assert.throws(() => auth.login('anything'), { code: 'ADMIN_UNAUTHORIZED' });
    process.env.ADMIN_SECRET = 'correct';
    assert.throws(() => auth.login('wrong'), { code: 'ADMIN_UNAUTHORIZED' });
    const session = auth.login('correct');
    assert.match(session.token, /^admtok_[0-9a-f]{32}$/);
    assert.ok(session.expiresAt);
    assert.equal(auth.verifyToken(session.token), true);
    assert.equal(auth.verifyToken('unknown'), false);
    auth.logout(session.token);
    assert.equal(auth.verifyToken(session.token), false);
    process.env.ADMIN_SESSION_TTL_HOURS = '0';
    const expired = auth.login('correct');
    await new Promise((resolve) => setTimeout(resolve, 2));
    assert.equal(auth.verifyToken(expired.token), false);
  } finally {
    if (originalSecret === undefined) delete process.env.ADMIN_SECRET; else process.env.ADMIN_SECRET = originalSecret;
    if (originalTtl === undefined) delete process.env.ADMIN_SESSION_TTL_HOURS; else process.env.ADMIN_SESSION_TTL_HOURS = originalTtl;
  }
});
