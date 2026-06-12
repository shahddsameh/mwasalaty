import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolvePlace,
  findBestLocalMatch,
} from '../src/services/geocodingService.js';

test('exact local place resolves with source "local"', async () => {
  const result = await resolvePlace('Nasr City');
  assert.equal(result.source, 'local');
  assert.equal(typeof result.lat, 'number');
  assert.equal(typeof result.lng, 'number');
});

test('inexact label with an extra word snaps to the nearest in-coverage place', async () => {
  const result = await resolvePlace('nasr city stop');
  assert.equal(result.source, 'local-fuzzy');
  assert.equal(result.label, 'Nasr City');
});

test('colloquial Arabic "عباس" resolves to Abbas El Akkad, not Abbassiya', async () => {
  const result = await resolvePlace('عباس');
  assert.equal(result.source, 'local-alias');
  assert.equal(result.label, 'Abbas Al Akkad - Mostafa Al Nahas');
});

test('colloquial Arabic "عاشر" resolves to the 10th District Nasr City stop', async () => {
  const result = await resolvePlace('عاشر');
  assert.equal(result.source, 'local-alias');
  assert.equal(result.label, '10th District (Al Hay Al Asher) - Nasr City');
});

test('"مهندسين" (absent from the GTFS) resolves to the nearest covered point', async () => {
  const result = await resolvePlace('مهندسين');
  assert.equal(result.source, 'local-alias');
  assert.equal(result.label, 'Dokki');
});

test('Arabic short form "دقي" fuzzy-matches "الدقي"', () => {
  const match = findBestLocalMatch('دقي');
  assert.ok(match, 'expected a fuzzy match for دقي');
  assert.equal(match.label, 'Dokki');
});

test('findBestLocalMatch returns null for gibberish', () => {
  assert.equal(findBestLocalMatch('xqzwv nowhere place'), null);
});
