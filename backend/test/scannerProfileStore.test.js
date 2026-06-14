import test from 'node:test';
import assert from 'node:assert/strict';
import { getAllProfiles, getProfileById } from '../src/stores/scannerProfileStore.js';

test('scanner profiles expose English and concise Arabic labels', () => {
  assert.equal(getProfileById('scanner_bus_001').labelAr, 'ماسح الحافلات');
  assert.equal(getProfileById('scanner_subway_001').labelAr, 'ماسح المترو');

  for (const profile of getAllProfiles()) {
    assert.equal(typeof profile.label, 'string');
    assert.equal(typeof profile.labelAr, 'string');
    if (profile.routeShortName) {
      const prefix = profile.mode === 'SUBWAY' ? 'مترو' : 'حافلة';
      assert.equal(profile.labelAr, `${prefix} ${profile.routeShortName}`);
    }
  }
});

test('scanner profiles include every GTFS route plus generic scanners', () => {
  const profiles = getAllProfiles();
  const routeProfiles = profiles.filter(profile => profile.routeShortName);

  assert.equal(profiles.length, 219);
  assert.equal(routeProfiles.length, 217);
  assert.equal(routeProfiles.filter(profile => profile.mode === 'BUS').length, 214);
  assert.equal(routeProfiles.filter(profile => profile.mode === 'SUBWAY').length, 3);
  assert.equal(new Set(profiles.map(profile => profile.scannerProfileId)).size, profiles.length);
  assert.equal(new Set(profiles.map(profile => profile.deviceId)).size, profiles.length);
});
