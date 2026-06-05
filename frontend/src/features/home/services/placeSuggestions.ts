export type PlaceSuggestion = {
  label: string;
  area: string;
  category: string;
};

// Only places inside the OSM+GTFS graph coverage are suggested, so every pick
// can actually be routed. Labels match the backend's local geocoding entries.
export const placeSuggestions: PlaceSuggestion[] = [
  { label: "Current Location", area: "Nearby", category: "Quick pick" },

  // Downtown / central metro
  { label: "Tahrir Square", area: "Downtown Cairo", category: "Landmark" },
  { label: "Sadat", area: "Downtown Cairo", category: "Metro station" },
  { label: "Nasser", area: "Downtown Cairo", category: "Metro station" },
  { label: "Mohamed Naguib", area: "Downtown Cairo", category: "Metro station" },
  { label: "Attaba", area: "Central Cairo", category: "Metro station" },
  { label: "Ramses", area: "Central Cairo", category: "Transit hub" },
  { label: "Al-Sayeda Zeinab", area: "Central Cairo", category: "Metro station" },
  { label: "Egyptian Museum", area: "Downtown Cairo", category: "Landmark" },
  { label: "Downtown Cairo", area: "Central Cairo", category: "District" },
  { label: "Khan el-Khalili", area: "Islamic Cairo", category: "Market" },

  // Gezira / Giza
  { label: "Opera", area: "Gezira Island", category: "Metro station" },
  { label: "Zamalek", area: "Gezira Island", category: "District" },
  { label: "Cairo Tower", area: "Zamalek", category: "Landmark" },
  { label: "Dokki", area: "Giza", category: "Metro station" },
  { label: "Bohooth", area: "Giza", category: "Metro station" },
  { label: "Cairo University", area: "Giza", category: "University" },
  { label: "Faisal", area: "Giza", category: "Metro station" },
  { label: "El Giza", area: "Giza", category: "Metro station" },
  { label: "El Mounib", area: "Giza", category: "Metro station" },
  { label: "Giza Pyramids", area: "Giza", category: "Landmark" },
  { label: "Grand Egyptian Museum", area: "Giza", category: "Museum" },

  // Old / South Cairo
  { label: "Mar Girgis", area: "Old Cairo", category: "Metro station" },
  { label: "Maadi", area: "South Cairo", category: "Metro station" },
  { label: "Helwan", area: "South Cairo", category: "Metro station" },

  // North Cairo
  { label: "Shubra El Kheima", area: "North Cairo", category: "Metro station" },
  { label: "New El Marg", area: "North Cairo", category: "Metro station" },

  // East Cairo / Nasr City
  { label: "Abbassiya", area: "Central Cairo", category: "Metro station" },
  { label: "El Demerdash", area: "Central Cairo", category: "Metro station" },
  { label: "Ghamra", area: "Central Cairo", category: "Metro station" },
  { label: "Cairo Stadium", area: "Nasr City", category: "Landmark" },
  { label: "Nasr City", area: "East Cairo", category: "District" },
  { label: "Makram Ebeid", area: "Nasr City", category: "Street" },
  { label: "City Stars Mall", area: "Nasr City", category: "Mall" },
  { label: "Heliopolis", area: "East Cairo", category: "District" },
  { label: "Adly Mansour", area: "East Cairo", category: "Transit hub" },
  { label: "New Cairo", area: "East Cairo", category: "District" },
];
