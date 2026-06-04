// NOTE: Static/mock route results (routeOptions, defaultSteps) were removed.
// Route planning is fully dynamic via planRoute() -> POST /api/plan (see services/api.ts).
// The exports below are non-route demo data still used by some screens.

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
