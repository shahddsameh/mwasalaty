export type RouteStep = { type: string; label: string };

export type RouteOption = {
  id: number;
  duration: string;
  cost: string;
  steps: RouteStep[];
  transfers: number;
  walkingDistance: string;
};

export const routeOptions: RouteOption[] = [
  {
    id: 1,
    duration: "38 min",
    cost: "25 EGP",

    transfers: 1,
    walkingDistance: "800 m",

    steps: [
      {
        type: "metro",
        label: "Metro Line 1",
      },
      {
        type: "bus",
        label: "Bus",
      },
      {
        type: "walking",
        label: "Walk 5 min",
      },
    ],
  },

  {
    id: 2,
    duration: "52 min",
    cost: "18 EGP",

    transfers: 2,
    walkingDistance: "1.2 km",

    steps: [
      {
        type: "metro",
        label: "Metro",
      },
      {
        type: "microbus",
        label: "Microbus",
      },
      {
        type: "walking",
        label: "Walk 3 min",
      },
    ],
  },

  {
    id: 3,
    duration: "45 min",
    cost: "120 EGP",

    transfers: 0,
    walkingDistance: "0 m",

    steps: [
      {
        type: "ride-hailing",
        label: "Car",
      },
    ],
  },

  {
    id: 4,
    duration: "58 min",
    cost: "22 EGP",

    transfers: 1,
    walkingDistance: "1.8 km",

    steps: [
      {
        type: "bus",
        label: "Bus",
      },
      {
        type: "walking",
        label: "Walk 15 min",
      },
    ],
  },
];

export const defaultSteps = [
  {
    type: "walking",
    instruction: "Walk to Sadat Metro Station",
    duration: "5 min",
    distance: "400m",
    color: "var(--transport-walking)",
    softColor: "var(--transport-walking-soft)",
  },
  {
    type: "metro",
    instruction: "Take Metro Line 1 (Helwan - New El Marg)",
    duration: "25 min",
    stops: 8,
    from: "Sadat",
    to: "Nasser",
    color: "var(--transport-metro)",
    softColor: "var(--transport-metro-soft)",
  },
  {
    type: "walking",
    instruction: "Walk to Airport Bus Stop",
    duration: "3 min",
    distance: "200m",
    color: "var(--transport-walking)",
    softColor: "var(--transport-walking-soft)",
  },
  {
    type: "bus",
    instruction: "Take Bus 356 to Cairo Airport",
    duration: "12 min",
    stops: 4,
    from: "Nasser Station",
    to: "Terminal 3",
    color: "var(--transport-bus)",
    softColor: "var(--transport-bus-soft)",
  },
];

export const ticketData = {
  id: "MWS-24122801-4K9L",
  route: {
    from: "Tahrir Square",
    to: "Cairo Airport",
    modes: ["metro", "bus"],
  },
  cost: "25 EGP",
  status: "valid",
  expiry: "Dec 28, 2024 11:45 PM",
  bookingTime: "Dec 28, 2024 11:45 AM",
  validUntil: "24 hours",
};

export const savedPlaces = [
  {
    name: "Home",
    address: "Nasr City, Cairo",
    type: "home",
    color: "var(--place-home)",
    softColor: "var(--place-home-soft)",
  },
  {
    name: "Work",
    address: "Downtown Cairo",
    type: "work",
    color: "var(--place-work)",
    softColor: "var(--place-work-soft)",
  },
  {
    name: "School",
    address: "Heliopolis, Cairo",
    type: "school",
    color: "var(--place-school)",
    softColor: "var(--place-school-soft)",
  },
  {
    name: "Gym",
    address: "Maadi, Cairo",
    type: "other",
    color: "var(--place-gym)",
    softColor: "var(--place-gym-soft)",
  },
];

export const aiDaySchedule = [
  {
    day: 1,
    title: "Ancient Cairo & Islamic Heritage",
    items: [
      {
        time: "9:00 AM",
        name: "Egyptian Museum",
        duration: "2.5 hours",
        cost: "200 EGP",
        transport: "Metro from Sadat (15 min)",
        icon: "Museum",
      },
      {
        time: "12:00 PM",
        name: "Felfela Restaurant",
        duration: "1 hour",
        cost: "150 EGP",
        transport: "Walk (5 min)",
        icon: "Food",
      },
      {
        time: "1:30 PM",
        name: "Khan el-Khalili Bazaar",
        duration: "2 hours",
        cost: "0 EGP",
        transport: "Metro + Walk (20 min)",
        icon: "Market",
      },
      {
        time: "4:00 PM",
        name: "El Fishawi Cafe",
        duration: "1 hour",
        cost: "80 EGP",
        transport: "Walk (2 min)",
        icon: "Cafe",
      },
      {
        time: "6:00 PM",
        name: "Cairo Tower",
        duration: "1.5 hours",
        cost: "150 EGP",
        transport: "Bus (25 min)",
        icon: "View",
      },
    ],
  },
  {
    day: 2,
    title: "Giza Wonders & Modern Cairo",
    items: [
      {
        time: "8:00 AM",
        name: "Giza Pyramids",
        duration: "3 hours",
        cost: "240 EGP",
        transport: "Bus from Tahrir (45 min)",
        icon: "Pyramids",
      },
      {
        time: "12:00 PM",
        name: "Andrea El Mariouteya",
        duration: "1 hour",
        cost: "200 EGP",
        transport: "Walk (10 min)",
        icon: "Dining",
      },
      {
        time: "2:00 PM",
        name: "Grand Egyptian Museum",
        duration: "2 hours",
        cost: "180 EGP",
        transport: "Taxi (15 min)",
        icon: "Museum",
      },
      {
        time: "5:00 PM",
        name: "City Stars Mall",
        duration: "2 hours",
        cost: "100 EGP",
        transport: "Metro (30 min)",
        icon: "Shopping",
      },
    ],
  },
];
