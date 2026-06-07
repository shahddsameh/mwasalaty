import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';

process.env.CATALOG_FILE_PATH = path.join(os.tmpdir(), `mwasalaty-catalog-core-${process.pid}.json`);
const catalog = await import('../src/services/catalogService.js');

const validStop = (overrides = {}) => ({
  type: 'stop', name: `Core stop ${Date.now()}`, aliases: [], location: { lat: 30.04, lng: 31.24 },
  routeIds: ['route_bus_14'], status: 'active', ...overrides,
});

test('core catalog CRUD validates and returns warnings', () => {
  const created = catalog.createPlace(validStop());
  assert.match(created.place.id, /^stop_[0-9a-f]{12}$/);
  assert.throws(() => catalog.createPlace(validStop({ routeIds: [] })), (error) => error.code === 'VALIDATION_ERROR' && error.details.fields.length > 0);
  assert.throws(() => catalog.createPlace(validStop({ routeIds: ['missing'] })), { code: 'ROUTE_NOT_FOUND' });
  const duplicate = catalog.createPlace(validStop({ name: created.place.name, location: { ...created.place.location } }));
  assert.ok(duplicate.warnings.some((warning) => warning.code === 'POSSIBLE_DUPLICATE'));
  const outside = catalog.createPlace(validStop({ name: 'Far away', location: { lat: 10, lng: 10 } }));
  assert.ok(outside.warnings.some((warning) => warning.code === 'OUT_OF_COVERAGE'));
  const updated = catalog.updatePlace(created.place.id, { ...created.place, name: 'Updated core stop' });
  assert.equal(updated.place.id, created.place.id);
  assert.equal(updated.place.createdAt, created.place.createdAt);
  assert.ok(updated.place.updatedAt >= created.place.updatedAt);
  assert.deepEqual(catalog.deletePlace(created.place.id), { deleted: true, id: created.place.id });
});
