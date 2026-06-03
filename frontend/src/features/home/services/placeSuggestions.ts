export type PlaceSuggestion = {
  label: string;
  area: string;
  category: string;
};

export const placeSuggestions: PlaceSuggestion[] = [
  { label: "Current Location", area: "Nearby", category: "Quick pick" },
  { label: "Tahrir Square", area: "Downtown Cairo", category: "Landmark" },
  { label: "Sadat", area: "Downtown Cairo", category: "Metro station" },
  { label: "Egyptian Museum", area: "Downtown Cairo", category: "Landmark" },
  { label: "Ramses", area: "Central Cairo", category: "Transit hub" },
  { label: "Al Shohadaa", area: "Ramses", category: "Metro station" },
  { label: "Attaba", area: "Central Cairo", category: "Metro station" },
  { label: "Nasser", area: "Downtown Cairo", category: "Metro station" },
  { label: "Cairo Airport", area: "Heliopolis", category: "Airport" },
  { label: "Terminal 3", area: "Cairo Airport", category: "Airport" },
  { label: "Heliopolis", area: "East Cairo", category: "District" },
  { label: "Nasr City", area: "East Cairo", category: "District" },
  { label: "Makram Ebeid", area: "Nasr City", category: "Street" },
  { label: "City Stars Mall", area: "Nasr City", category: "Mall" },
  { label: "Cairo Stadium", area: "Nasr City", category: "Landmark" },
  { label: "Abbasiya", area: "Central Cairo", category: "District" },
  { label: "Adly Mansour", area: "New Cairo edge", category: "Transit hub" },
  { label: "New Cairo", area: "East Cairo", category: "District" },
  { label: "Maadi", area: "South Cairo", category: "District" },
  { label: "El Maadi", area: "South Cairo", category: "Metro station" },
  { label: "Zamalek", area: "Gezira Island", category: "District" },
  { label: "Cairo Tower", area: "Zamalek", category: "Landmark" },
  { label: "Giza", area: "Giza", category: "District" },
  { label: "Giza Station", area: "Giza", category: "Transit hub" },
  { label: "Giza Pyramids", area: "Giza", category: "Landmark" },
  { label: "Grand Egyptian Museum", area: "Giza", category: "Museum" },
  { label: "Cairo University", area: "Giza", category: "University" },
  { label: "Faisal", area: "Giza", category: "District" },
  { label: "El Mounib", area: "Giza", category: "Metro station" },
  { label: "Shubra El Kheima", area: "North Cairo", category: "District" },
  { label: "New El Marg", area: "North Cairo", category: "Metro station" },
  { label: "Helwan", area: "South Cairo", category: "Metro station" },
  { label: "Khan el-Khalili", area: "Islamic Cairo", category: "Market" },
  { label: "Downtown Cairo", area: "Central Cairo", category: "District" },
];
