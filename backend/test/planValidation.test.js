import test from 'node:test';
import assert from 'node:assert/strict';
import { validateBody } from '../src/controllers/planController.js';

const places = {
  from: { lat: 30.0444, lng: 31.2357 },
  to: { lat: 30.1219, lng: 31.4056 },
};
// Egypt observes UTC+3 in June, so this is 12:00 in Africa/Cairo.
const now = new Date('2026-06-11T09:00:00Z');

test('scheduled departure or arrival must be in the future', () => {
  for (const timeMode of ['depart', 'arrive']) {
    const errors = validateBody(
      { ...places, date: '2026-06-11', time: '11:59', timeMode },
      now
    );
    assert.ok(errors.includes('departure or arrival time must be in the future'));
  }
});

test('scheduled future time passes validation', () => {
  const errors = validateBody(
    { ...places, date: '2026-06-11', time: '12:01', timeMode: 'depart' },
    now
  );
  assert.deepEqual(errors, []);
});

test('leave now permits the current minute', () => {
  const errors = validateBody(
    { ...places, date: '2026-06-11', time: '12:00', timeMode: 'now' },
    now
  );
  assert.deepEqual(errors, []);
});

test('invalid calendar dates and times are rejected', () => {
  const errors = validateBody(
    { ...places, date: '2026-02-30', time: '25:00', timeMode: 'depart' },
    now
  );
  assert.ok(errors.includes('date and time must form a valid local date and time'));
});
