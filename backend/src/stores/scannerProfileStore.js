const profiles = [
  { scannerProfileId: 'scanner_bus_14',      label: 'Bus 14',      operatorId: 'operator_bus_001',   deviceId: 'scanner_web_demo_001', mode: 'BUS',   routeShortName: '14' },
  { scannerProfileId: 'scanner_bus_108',     label: 'Bus 108',     operatorId: 'operator_bus_001',   deviceId: 'scanner_web_demo_002', mode: 'BUS',   routeShortName: '108' },
  { scannerProfileId: 'scanner_metro_line_2', label: 'Metro Line 2', operatorId: 'operator_metro_001', deviceId: 'scanner_web_demo_003', mode: 'METRO', routeShortName: 'Line 2' },
];

export function getAllProfiles() {
  return profiles;
}

export function getProfileById(id) {
  return profiles.find(p => p.scannerProfileId === id) ?? null;
}
