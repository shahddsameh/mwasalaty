import test from 'node:test';
import assert from 'node:assert/strict';
import { createTicket, scanValidate, validateLeg } from '../src/services/ticketService.js';

function createBusTicket() {
  return createTicket({
    planId: 'plan_labels',
    itineraryId: `itinerary_${Date.now()}_${Math.random()}`,
    passenger: { userId: 'user_labels' },
    payment: { method: 'TEST', amount: 10, currency: 'EGP' },
    itinerary: {
      itineraryId: 'itinerary_labels',
      legs: [{
        legId: 'leg_bus',
        mode: 'BUS',
        route: { shortName: '14' },
        from: { name: 'From' },
        to: { name: 'To' },
        fareAmount: 10,
      }],
    },
  });
}

test('automatic scan validation includes English and Arabic scanner labels', () => {
  const ticket = createBusTicket();
  const result = scanValidate(ticket.qrPayload, 'scanner_bus_001');

  assert.equal(result.validatedBy.label, 'Bus Scanner');
  assert.equal(result.validatedBy.labelAr, 'ماسح الحافلات');
  assert.throws(
    () => scanValidate(ticket.qrPayload, 'scanner_bus_001'),
    error => error.details.validatedBy.labelAr === 'ماسح الحافلات'
  );
});

test('manual leg validation resolves English and Arabic scanner labels', () => {
  const ticket = createBusTicket();
  const result = validateLeg(ticket.ticketId, ticket.legs[0].ticketLegId, {
    operatorId: 'operator_bus_001',
    deviceId: 'scanner_web_demo_bus',
  });

  assert.equal(result.validatedBy.label, 'Bus Scanner');
  assert.equal(result.validatedBy.labelAr, 'ماسح الحافلات');
});
