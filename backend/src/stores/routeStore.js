const routes = [
  { routeId: 'route_metro_l1', mode: 'SUBWAY', shortName: 'Line 1', longName: 'Helwan - New El-Marg' },
  { routeId: 'route_metro_l2', mode: 'SUBWAY', shortName: 'Line 2', longName: 'Shubra El-Kheima - El-Mounib' },
  { routeId: 'route_metro_l3', mode: 'SUBWAY', shortName: 'Line 3', longName: 'Adly Mansour - Kit Kat/Rod El-Farag' },
  { routeId: 'route_bus_14', mode: 'BUS', shortName: '14', longName: 'Bus route 14' },
  { routeId: 'route_bus_108', mode: 'BUS', shortName: '108', longName: 'Bus route 108' },
  { routeId: 'route_bus_generic', mode: 'BUS', shortName: 'Bus', longName: 'Unassigned bus route - seed default' },
];

export function getAllRoutes() {
  return routes.map((route) => ({ ...route }));
}

export function getRouteById(id) {
  return routes.find((route) => route.routeId === id) ?? null;
}
