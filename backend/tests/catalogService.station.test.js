import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';

process.env.CATALOG_FILE_PATH = path.join(os.tmpdir(), `mwasalaty-catalog-station-${process.pid}.json`);
const catalog = await import('../src/services/catalogService.js');

test('station CRUD requires and updates line', () => {
  const input = { type: 'station', name: 'Test station', aliases: [], location: { lat: 30, lng: 31.2 }, routeIds: ['route_metro_l2'], status: 'active' };
  assert.throws(() => catalog.createPlace(input), (error) => error.code === 'VALIDATION_ERROR' && error.details.fields.some((field) => field.includes('line')));
  const created = catalog.createPlace({ ...input, line: 'Line 2' }).place;
  assert.match(created.id, /^stn_/);
  assert.throws(() => catalog.createPlace({ ...input, line: 'Line 2', routeIds: [] }), { code: 'VALIDATION_ERROR' });
  const updated = catalog.updatePlace(created.id, { ...created, line: 'Line 3' }).place;
  assert.equal(updated.line, 'Line 3');
  assert.ok(updated.updatedAt >= created.updatedAt);
});
