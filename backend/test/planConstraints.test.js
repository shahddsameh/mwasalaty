import test from 'node:test';
import assert from 'node:assert/strict';
import { filterItinerariesByConstraints } from '../src/controllers/planController.js';

const plan = {
  planId: 'plan_test',
  itineraries: [
    { itineraryId: 'short', durationMinutes: 45 },
    { itineraryId: 'long', durationMinutes: 75 },
  ],
};

test('duration constraint removes itineraries over the requested maximum', () => {
  const result = filterItinerariesByConstraints(plan, { maxDurationMinutes: 60 });
  assert.deepEqual(result.itineraries.map((item) => item.itineraryId), ['short']);
  assert.deepEqual(result.constraints, { maxDurationMinutes: 60 });
});

test('plan remains unchanged when no duration constraint is supplied', () => {
  assert.equal(filterItinerariesByConstraints(plan), plan);
});
