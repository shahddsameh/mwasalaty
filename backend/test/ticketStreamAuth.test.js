import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { createTicket } from '../src/services/ticketService.js';
import { streamTicketHandler } from '../src/controllers/ticketController.js';

const TEST_SECRET = 'stream-test-secret';
process.env.SUPABASE_JWT_SECRET = TEST_SECRET;

function tokenFor(userId) {
  return jwt.sign({ sub: userId }, TEST_SECRET, { algorithm: 'HS256' });
}

function seedTicket(userId) {
  return createTicket({
    planId: 'plan_1',
    itineraryId: 'itin_1',
    passenger: { userId },
    payment: { method: 'SIMULATED', amount: 10, currency: 'EGP' },
    itinerary: {
      itineraryId: 'itin_1',
      legs: [{ mode: 'BUS', legId: 'leg_1', from: { name: 'A' }, to: { name: 'B' }, fareAmount: 10 }],
    },
  });
}

function makeRes() {
  return {
    statusCode: 200,
    body: null,
    writes: [],
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
    set() { return this; },
    flushHeaders() {},
    write(chunk) { this.writes.push(chunk); },
  };
}

test('SSE stream rejects a request with no token', () => {
  const ticket = seedTicket('streamer-1');
  const res = makeRes();
  streamTicketHandler({ params: { id: ticket.ticketId }, query: {}, get: () => null }, res);
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.error.code, 'AUTH_REQUIRED');
});

test('SSE stream hides another user\'s ticket behind a 404', () => {
  const ticket = seedTicket('streamer-2');
  const res = makeRes();
  streamTicketHandler(
    { params: { id: ticket.ticketId }, query: { access_token: tokenFor('attacker') }, get: () => null },
    res
  );
  assert.equal(res.statusCode, 404);
  assert.equal(res.body.error.code, 'TICKET_NOT_FOUND');
});

test('SSE stream serves the owner via an access_token query param', () => {
  const ticket = seedTicket('streamer-3');
  const res = makeRes();
  let closeHandler;
  streamTicketHandler(
    {
      params: { id: ticket.ticketId },
      query: { access_token: tokenFor('streamer-3') },
      get: () => null,
      on: (event, cb) => { if (event === 'close') closeHandler = cb; },
    },
    res
  );
  assert.equal(res.statusCode, 200);
  assert.ok(res.writes.some(w => w.includes(ticket.ticketId)));
  closeHandler?.(); // clear the heartbeat interval and unsubscribe
});
