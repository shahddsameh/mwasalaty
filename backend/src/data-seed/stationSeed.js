import { normalizePlaceName } from './localPlaces.js';

// This deliberate mapping is the source of truth for seeded station line assignments.
const LINE_1 = [
  'helwan', 'ain helwan', 'helwan university', 'wadi hof', 'hadayek helwan',
  'el-maasara', 'tora el-asmant', 'kozzika', 'tora el-balad', 'sakanat el-maadi',
  'maadi', 'hadayek el-maadi', 'dar el-salam', 'el-zahraa', 'mar girgis',
  'el-malek el-saleh', 'al-sayeda zeinab', 'saad zaghloul', 'sadat', 'nasser',
  'orabi', 'al-shohadaa', 'ghamra', 'el-demerdash', 'manshiet el-sadr',
  'kobri el-qobba', 'hammamat el-qobba', 'saray el-qobba', 'hadayeq el-zaitoun',
  'helmeyet el-zaitoun', 'el-matareyya', 'ain shams', 'ezbet el-nakhl',
  'el-marg', 'new el-marg',
];

const LINE_2 = [
  'shubra el-kheima', 'kolleyyet el-zeraa', 'mezallat', 'khalafawy', 'st. teresa',
  'rod el farag', 'masarra', 'al-shohadaa', 'attaba', 'mohamed naguib', 'sadat',
  'opera', 'dokki', 'bohooth', 'cairo university', 'faisal', 'el-giza',
  'omm el-misryeen', 'sakiat mekki', 'el-mounib',
];

const LINE_3 = [
  'al-ahram', 'koleyet el-banat', 'stadium', 'fair zone', 'abbassiya',
  'abdou pasha', 'el-geish', 'bab el-shaaria', 'attaba',
];

function buildSeed() {
  const seed = {};
  const add = (names, line, routeId) => {
    for (const name of names) {
      const key = normalizePlaceName(name);
      const existing = seed[key];
      if (existing) {
        existing.extraRouteIds = [...(existing.extraRouteIds ?? []), routeId];
      } else {
        seed[key] = { line, routeId };
      }
    }
  };
  add(LINE_1, 'Line 1', 'route_metro_l1');
  add(LINE_2, 'Line 2', 'route_metro_l2');
  add(LINE_3, 'Line 3', 'route_metro_l3');
  seed[normalizePlaceName('nasser')].extraRouteIds = ['route_metro_l3'];
  return seed;
}

export const STATION_SEED = buildSeed();
