// Curated bilingual overlay layered on top of the GTFS-derived place list
// (places.generated.json). The GTFS feed has no Arabic names and no landmarks,
// so those two things can only come from here.
//
// - ARABIC_LABELS: English stop name -> Arabic label. Keys are matched after the
//   geocoding normalizer runs (lowercase, hyphens -> spaces), so they can be
//   written naturally. This is the canonical copy; the frontend's PLACE_AR map
//   mirrors it for offline display.
// - LANDMARKS: places that are NOT GTFS stops (malls, museums, districts) plus
//   common search aliases, each with coordinates verified to sit within graph
//   coverage so they still route.

export const ARABIC_LABELS = {
  // metro / transit stops present in the GTFS
  'al-shohadaa': 'الشهداء',
  'al-sayeda zeinab': 'السيدة زينب',
  attaba: 'العتبة',
  nasser: 'ناصر',
  'mohamed naguib': 'محمد نجيب',
  opera: 'الأوبرا',
  sadat: 'السادات',
  dokki: 'الدقي',
  bohooth: 'البحوث',
  'el-giza': 'الجيزة',
  'el-mounib': 'المنيب',
  maadi: 'المعادي',
  helwan: 'حلوان',
  abbassiya: 'العباسية',
  faisal: 'فيصل',
  'cairo university': 'جامعة القاهرة',
  stadium: 'استاد القاهرة',
  'koleyet el-banat': 'كلية البنات',
  'saad zaghloul': 'سعد زغلول',
  ghamra: 'غمرة',
  'el-demerdash': 'الدمرداش',
  'ain shams': 'عين شمس',
  'el-marg': 'المرج',
  'shubra el-kheima': 'شبرا الخيمة',
  heliopolis: 'مصر الجديدة',
};

// Popular Egyptian colloquial / short-form call-outs -> a canonical label that
// already exists in ALL_PLACES. Matched after normalizePlaceName runs, so keys
// can be written naturally in Arabic or English. These are folded into the exact
// resolver index, so they take precedence over the fuzzy matcher.
//
// NOTE: colloquial "عباس" means Abbas El Akkad St. in Nasr City, NOT Abbassiya
// (العباسية) — the explicit alias here is what overrides the fuzzy substring match.
export const ALIASES = {
  'عباس': 'Abbas Al Akkad - Mostafa Al Nahas',
  'عباس العقاد': 'Abbas Al Akkad - Mostafa Al Nahas',
  abbas: 'Abbas Al Akkad - Mostafa Al Nahas',
  'عاشر': '10th District (Al Hay Al Asher) - Nasr City',
  'الحي العاشر': '10th District (Al Hay Al Asher) - Nasr City',
  'سابع': '7th District Stop (Hay Al Sabea) - Nasr City',
  'الحي السابع': '7th District Stop (Hay Al Sabea) - Nasr City',
  // Popular areas missing from / weakly represented in the GTFS -> nearest covered point
  'مهندسين': 'Dokki',
  'المهندسين': 'Dokki',
  mohandessin: 'Dokki',
  // Landmark shortcuts
  'مكرم': 'Makram Ebeid',
  'سيتي ستارز': 'City Stars Mall',
  'استاد': 'Cairo Stadium',
  'الاستاد': 'Cairo Stadium',
  'جامعه': 'Cairo University',
};

export const LANDMARKS = [
  // --- Non-GTFS landmarks ---
  { label: 'Makram Ebeid', arLabel: 'مكرم عبيد', lat: 30.0596, lng: 31.3444 },
  { label: 'City Stars Mall', arLabel: 'سيتي ستارز', lat: 30.0726, lng: 31.3457 },
  { label: 'Nasr City', arLabel: 'مدينة نصر', lat: 30.0511, lng: 31.3656 },
  { label: 'Downtown Cairo', arLabel: 'وسط البلد', lat: 30.05, lng: 31.24 },
  { label: 'Zamalek', arLabel: 'الزمالك', lat: 30.0618, lng: 31.2194 },
  { label: 'Cairo Tower', arLabel: 'برج القاهرة', lat: 30.0459, lng: 31.2243 },
  { label: 'Egyptian Museum', arLabel: 'المتحف المصري', lat: 30.0478, lng: 31.2336 },
  { label: 'Khan El-Khalili', arLabel: 'خان الخليلي', lat: 30.0477, lng: 31.2622 },
  { label: 'Cairo Stadium', arLabel: 'استاد القاهرة', lat: 30.07284, lng: 31.31724 },
  { label: 'Giza Pyramids', arLabel: 'أهرامات الجيزة', lat: 29.9773, lng: 31.1325 },
  { label: 'Grand Egyptian Museum', arLabel: 'المتحف المصري الكبير', lat: 29.9939, lng: 31.119 },
  { label: 'New Cairo', arLabel: 'القاهرة الجديدة', lat: 30.03, lng: 31.47 },
  { label: 'Adly Mansour', arLabel: 'عدلي منصور', lat: 30.1418, lng: 31.4148 },

  // --- Common search aliases mapped onto a covered point ---
  { label: 'Tahrir Square', arLabel: 'ميدان التحرير', lat: 30.04403, lng: 31.23567 },
  { label: 'Ramses', arLabel: 'رمسيس', lat: 30.06163, lng: 31.24627 },
  { label: 'Giza', arLabel: 'الجيزة', lat: 30.01059, lng: 31.2072 },
];
