// Scanner profiles are single-mode (one mode per scanner). Only the transport
// modes that actually exist in the OSM+GTFS graph are represented: BUS and SUBWAY.
// (METRO is treated as SUBWAY — the GTFS term. MICROBUS/TRAM/RAIL are not in the data.)
const profiles = [
  // Generic per-mode scanners — validate any route of their mode.
  { scannerProfileId: 'scanner_bus_001',    label: 'Bus Scanner',    operatorId: 'operator_bus_001',    deviceId: 'scanner_web_demo_bus',    mode: 'BUS' },
  { scannerProfileId: 'scanner_subway_001', label: 'Subway Scanner', operatorId: 'operator_subway_001', deviceId: 'scanner_web_demo_subway', mode: 'SUBWAY' },
  // Route-specific demo scanners (kept for backward compatibility).
  { scannerProfileId: 'scanner_bus_14',    label: 'Bus 14',    operatorId: 'operator_bus_001',    deviceId: 'scanner_web_demo_001', mode: 'BUS',    routeShortName: '14' },
  { scannerProfileId: 'scanner_bus_108',   label: 'Bus 108',   operatorId: 'operator_bus_001',    deviceId: 'scanner_web_demo_002', mode: 'BUS',    routeShortName: '108' },
  { scannerProfileId: 'scanner_subway_m2', label: 'Subway M2', operatorId: 'operator_subway_001', deviceId: 'scanner_web_demo_003', mode: 'SUBWAY', routeShortName: 'M2' },
];

export function getAllProfiles() {
  return profiles;
}

export function getProfileById(id) {
  return profiles.find(p => p.scannerProfileId === id) ?? null;
}
