import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateFavoriteId,
  validateFavoritePlace,
} from '../src/services/favoritePlacesService.js';

test('favorite-place validation accepts the Home payload shape', () => {
  assert.deepEqual(validateFavoritePlace({
    name: 'Home',
    address: 'Nasr City, Cairo',
    type: 'home',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }), []);
  assert.equal(validateFavoriteId('home-nasr city, cairo'), true);
});

test('favorite-place validation rejects invalid values', () => {
  const errors = validateFavoritePlace({ name: '', address: '', type: 'airport', lat: '30' });
  assert.ok(errors.length >= 4);
  assert.equal(validateFavoriteId('../unsafe'), false);
});
