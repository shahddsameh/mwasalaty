import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';

process.env.CATALOG_FILE_PATH = path.join(os.tmpdir(), `mwasalaty-catalog-dashboard-${process.pid}.json`);
const catalog = await import('../src/services/catalogService.js');

test('dashboard summary returns totals, lines, status split, and five recent entries', () => {
  const summary = catalog.getDashboardSummary();
  assert.equal(summary.totals.total, summary.totals.stops + summary.totals.stations);
  assert.ok(Object.values(summary.byLine).reduce((sum, count) => sum + count, 0) === summary.totals.stations);
  assert.equal(summary.activeInactive.active + summary.activeInactive.inactive, summary.totals.total);
  assert.ok(summary.recent.length <= 5);
  assert.deepEqual(summary.recent, [...summary.recent].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
});
