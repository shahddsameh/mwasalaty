import test from 'node:test';
import assert from 'node:assert/strict';
import { createTicket } from '../src/services/ticketService.js';
import {
  getTicketHandler,
  listTicketsHandler,
  refundTicketHandler,
} from '../src/controllers/ticketController.js';

function makeResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

function seedTicket(userId, legs = [{ mode: 'BUS', legId: 'leg_1', from: { name: 'A' }, to: { name: 'B' }, fareAmount: 10 }]) {
  return createTicket({
    planId: 'plan_1',
    itineraryId: 'itin_1',
    passenger: { userId },
    payment: {
      method: 'SIMULATED',
      amount: legs.reduce((sum, leg) => sum + leg.fareAmount, 0),
      currency: 'EGP',
    },
    itinerary: {
      itineraryId: 'itin_1',
      legs,
    },
  });
}

test('getTicketHandler returns the ticket to its owner', async () => {
  const ticket = seedTicket('owner-1');
  const res = makeResponse();
  await getTicketHandler({ params: { id: ticket.ticketId }, auth: { user: { id: 'owner-1' } } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.ticketId, ticket.ticketId);
});

test('getTicketHandler hides another user\'s ticket behind a 404', async () => {
  const ticket = seedTicket('owner-2');
  const res = makeResponse();
  await getTicketHandler({ params: { id: ticket.ticketId }, auth: { user: { id: 'attacker' } } }, res);
  assert.equal(res.statusCode, 404);
  assert.equal(res.body.error.code, 'TICKET_NOT_FOUND');
});

test('listTicketsHandler returns only the authenticated user\'s tickets', async () => {
  const mine = seedTicket('lister-self');
  seedTicket('lister-other');
  const res = makeResponse();
  await listTicketsHandler({ auth: { user: { id: 'lister-self' } } }, res);
  assert.equal(res.statusCode, 200);
  const ids = res.body.tickets.map(t => t.ticketId);
  assert.ok(ids.includes(mine.ticketId));
  assert.ok(res.body.tickets.every(t => t.passenger.userId === 'lister-self'));
});

test('refundTicketHandler refuses a non-owner with a 404 before refunding', async () => {
  const ticket = seedTicket('owner-3');
  const res = makeResponse();
  await refundTicketHandler(
    { params: { id: ticket.ticketId }, body: {}, auth: { user: { id: 'attacker' } } },
    res
  );
  assert.equal(res.statusCode, 404);
  assert.equal(res.body.error.code, 'TICKET_NOT_FOUND');
});

test('refundTicketHandler lets the owner refund their ticket', async () => {
  const ticket = seedTicket('owner-4');
  const res = makeResponse();
  await refundTicketHandler(
    { params: { id: ticket.ticketId }, body: {}, auth: { user: { id: 'owner-4' } } },
    res
  );
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.ticketId, ticket.ticketId);
  assert.equal(res.body.refundedLegs.length, 1);
});

test('refundTicketHandler refuses an expired active ticket', async () => {
  const ticket = seedTicket('owner-expired');
  ticket.expiresAt = new Date(Date.now() - 1000).toISOString();

  const res = makeResponse();
  await refundTicketHandler(
    { params: { id: ticket.ticketId }, body: {}, auth: { user: { id: 'owner-expired' } } },
    res
  );

  assert.equal(res.statusCode, 410);
  assert.equal(res.body.error.code, 'REFUND_WINDOW_EXPIRED');
});

test('refundTicketHandler refuses a reactivated ticket with used history', async () => {
  const ticket = seedTicket('owner-reactivated-used', [
    { mode: 'BUS', legId: 'leg_1', from: { name: 'A' }, to: { name: 'B' }, fareAmount: 10 },
    { mode: 'BUS', legId: 'leg_2', from: { name: 'B' }, to: { name: 'C' }, fareAmount: 10 },
  ]);
  ticket.legs[0].status = 'used';
  ticket.legs[0].usedAt = new Date(Date.now() - 60_000).toISOString();
  ticket.status = 'active';
  ticket.activatedAt = new Date().toISOString();
  ticket.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const res = makeResponse();
  await refundTicketHandler(
    {
      params: { id: ticket.ticketId },
      body: { legIds: [ticket.legs[1].ticketLegId] },
      auth: { user: { id: 'owner-reactivated-used' } },
    },
    res
  );

  assert.equal(res.statusCode, 409);
  assert.equal(res.body.error.code, 'LEG_ALREADY_USED');
});
