import test from 'node:test';
import assert from 'node:assert/strict';
import { publishTicketUpdate, subscribeToTicket } from '../src/services/ticketEvents.js';

test('ticket subscribers receive updates only for their ticket', () => {
  const received = [];
  const unsubscribe = subscribeToTicket('ticket_1', ticket => received.push(ticket));

  publishTicketUpdate({ ticketId: 'ticket_2', status: 'used' });
  publishTicketUpdate({ ticketId: 'ticket_1', status: 'used' });
  unsubscribe();
  publishTicketUpdate({ ticketId: 'ticket_1', status: 'refunded' });

  assert.deepEqual(received, [{ ticketId: 'ticket_1', status: 'used' }]);
});
