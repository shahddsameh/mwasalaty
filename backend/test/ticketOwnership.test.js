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

test('refundTicketHandler lets the owner refund an unused leg on a partially-used ticket', async () => {
  const ticket = seedTicket('owner-partial-used', [
    { mode: 'BUS', legId: 'leg_1', from: { name: 'A' }, to: { name: 'B' }, fareAmount: 10 },
    { mode: 'BUS', legId: 'leg_2', from: { name: 'B' }, to: { name: 'C' }, fareAmount: 10 },
  ]);
  ticket.legs[0].status = 'used';
  ticket.legs[0].usedAt = new Date(Date.now() - 60_000).toISOString();
  ticket.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const res = makeResponse();
  await refundTicketHandler(
    {
      params: { id: ticket.ticketId },
      body: { legIds: [ticket.legs[1].ticketLegId] },
      auth: { user: { id: 'owner-partial-used' } },
    },
    res
  );

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.refundedLegs.length, 1);
  assert.equal(res.body.refundedLegs[0].ticketLegId, ticket.legs[1].ticketLegId);
  assert.equal(res.body.refundAmount, 10);
  // The used leg is untouched and the ticket keeps its used status.
  assert.equal(ticket.legs[0].status, 'used');
  assert.equal(ticket.legs[1].status, 'refunded');
});

test('refundTicketHandler lets the owner refund the remaining leg after a partial refund', async () => {
  const ticket = seedTicket('owner-partial-refund', [
    { mode: 'BUS', legId: 'leg_1', from: { name: 'A' }, to: { name: 'B' }, fareAmount: 10 },
    { mode: 'BUS', legId: 'leg_2', from: { name: 'B' }, to: { name: 'C' }, fareAmount: 13 },
  ]);
  ticket.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  // First refund: leg 2 only. This flips the ticket to 'partially_refunded' and
  // sets payment.status to 'partially_refunded'.
  const first = makeResponse();
  await refundTicketHandler(
    {
      params: { id: ticket.ticketId },
      body: { legIds: [ticket.legs[1].ticketLegId] },
      auth: { user: { id: 'owner-partial-refund' } },
    },
    first,
  );
  assert.equal(first.statusCode, 200);
  assert.equal(ticket.payment.status, 'partially_refunded');

  // Second refund: the still-unused leg 1 must remain refundable.
  const second = makeResponse();
  await refundTicketHandler(
    {
      params: { id: ticket.ticketId },
      body: { legIds: [ticket.legs[0].ticketLegId] },
      auth: { user: { id: 'owner-partial-refund' } },
    },
    second,
  );
  assert.equal(second.statusCode, 200);
  assert.equal(second.body.refundedLegs.length, 1);
  assert.equal(second.body.refundedLegs[0].ticketLegId, ticket.legs[0].ticketLegId);
  assert.equal(ticket.legs[0].status, 'refunded');
});

test('refundTicketHandler still refuses refunding a used leg on a partially-used ticket', async () => {
  const ticket = seedTicket('owner-used-leg', [
    { mode: 'BUS', legId: 'leg_1', from: { name: 'A' }, to: { name: 'B' }, fareAmount: 10 },
    { mode: 'BUS', legId: 'leg_2', from: { name: 'B' }, to: { name: 'C' }, fareAmount: 10 },
  ]);
  ticket.legs[0].status = 'used';
  ticket.legs[0].usedAt = new Date(Date.now() - 60_000).toISOString();
  ticket.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const res = makeResponse();
  await refundTicketHandler(
    {
      params: { id: ticket.ticketId },
      body: { legIds: [ticket.legs[0].ticketLegId] },
      auth: { user: { id: 'owner-used-leg' } },
    },
    res
  );

  assert.equal(res.statusCode, 409);
  assert.equal(res.body.error.code, 'LEG_ALREADY_USED');
});
