import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';

process.env.CATALOG_FILE_PATH = path.join(os.tmpdir(), `mwasalaty-catalog-stop-${process.pid}.json`);
const catalog = await import('../src/services/catalogService.js');

test('stop CRUD does not require a line and requires a route', () => {
  const input = { type: 'stop', name: 'Test stop', aliases: [], location: { lat: 30, lng: 31.2 }, routeIds: ['route_bus_108'], status: 'active' };
  const created = catalog.createPlace(input).place;
  assert.match(created.id, /^stop_/);
  assert.equal('line' in created, false);
  assert.throws(() => catalog.createPlace({ ...input, routeIds: [] }), { code: 'VALIDATION_ERROR' });
  assert.equal(catalog.updatePlace(created.id, { ...created, name: 'Renamed stop' }).place.name, 'Renamed stop');
  assert.equal(catalog.deletePlace(created.id).deleted, true);
});
