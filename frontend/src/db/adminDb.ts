import Dexie, { type Table } from 'dexie';

export type TransportType = 'Metro' | 'Bus' | 'Microbus' | 'Walking' | 'Ride-hailing';
export type RouteStatus = 'Active' | 'Inactive';

export interface Route {
  id?: number;
  name: string;
  from: string;
  to: string;
  transportType: TransportType;
  fare: number;
  duration: number;
  transfers: number;
  status: RouteStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Stop {
  id?: number;
  name: string;
  address: string;
  lat: number;
  lng: number;
  transportTypes: TransportType[];
  status: 'Active' | 'Inactive';
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminTicket {
  id?: number;
  ticketId: string;
  userId: string;
  userName: string;
  routeName: string;
  fare: number;
  status: 'Active' | 'Used' | 'Expired' | 'Cancelled';
  createdAt: Date;
  expiresAt: Date;
}

export interface AppUser {
  id?: number;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  status: 'Active' | 'Blocked';
  ticketsCount: number;
  totalSpent: number;
  joinedAt: Date;
}

class AdminDatabase extends Dexie {
  routes!: Table<Route, number>;
  stops!: Table<Stop, number>;
  adminTickets!: Table<AdminTicket, number>;
  users!: Table<AppUser, number>;

  constructor() {
    super('mwasalaty-admin');

    this.version(1).stores({
      routes: '++id, name, transportType, status, createdAt',
      stops: '++id, name, status, createdAt',
      adminTickets: '++id, ticketId, userId, status, createdAt',
      users: '++id, userId, email, status, joinedAt',
    });
  }
}

export const adminDb = new AdminDatabase();

// Seed data
const SEED_ROUTES: Omit<Route, 'id'>[] = [
  {
    name: 'Line 1 — Helwan to New El-Marg',
    from: 'Helwan',
    to: 'New El-Marg',
    transportType: 'Metro',
    fare: 7,
    duration: 65,
    transfers: 0,
    status: 'Active',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    name: 'CTA 800 — Tahrir to Nasr City',
    from: 'Tahrir Square',
    to: 'Nasr City',
    transportType: 'Bus',
    fare: 4,
    duration: 35,
    transfers: 0,
    status: 'Active',
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-02-01'),
  },
  {
    name: 'Microbus — Tahrir to Mohandiseen',
    from: 'Tahrir Square',
    to: 'Mohandiseen',
    transportType: 'Microbus',
    fare: 3,
    duration: 20,
    transfers: 0,
    status: 'Active',
    createdAt: new Date('2024-01-17'),
    updatedAt: new Date('2024-01-17'),
  },
  {
    name: 'Line 2 — Shubra to Cairo Airport',
    from: 'Shubra El-Kheima',
    to: 'Cairo International Airport',
    transportType: 'Metro',
    fare: 10,
    duration: 45,
    transfers: 0,
    status: 'Active',
    createdAt: new Date('2024-01-18'),
    updatedAt: new Date('2024-01-18'),
  },
  {
    name: 'Walking — Downtown Cairo Loop',
    from: 'Tahrir Square',
    to: 'Egyptian Museum',
    transportType: 'Walking',
    fare: 0,
    duration: 15,
    transfers: 0,
    status: 'Active',
    createdAt: new Date('2024-01-19'),
    updatedAt: new Date('2024-01-19'),
  },
];

export async function seedRoutes() {
  const count = await adminDb.routes.count();
  if (count === 0) {
    await adminDb.routes.bulkAdd(SEED_ROUTES);
  }
}

const SEED_STOPS: Omit<Stop, 'id'>[] = [
  {
    name: 'Tahrir Square Metro Station',
    address: 'Tahrir Square, Downtown Cairo',
    lat: 30.0444,
    lng: 31.2357,
    transportTypes: ['Metro', 'Bus'],
    status: 'Active',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    name: 'Ramses Station',
    address: 'Ramses Square, Cairo',
    lat: 30.0626,
    lng: 31.2497,
    transportTypes: ['Metro', 'Bus', 'Microbus'],
    status: 'Active',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    name: 'Sadat Metro Station',
    address: 'Tahrir Square, Cairo',
    lat: 30.0444,
    lng: 31.2357,
    transportTypes: ['Metro'],
    status: 'Active',
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-16'),
  },
];

export async function seedStops() {
  const count = await adminDb.stops.count();
  if (count === 0) {
    await adminDb.stops.bulkAdd(SEED_STOPS);
  }
}
