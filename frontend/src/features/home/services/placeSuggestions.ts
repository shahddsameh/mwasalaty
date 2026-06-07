import { reactive } from "vue";
import { getPlaces } from "@/services/api";

export type PlaceSuggestion = {
  label: string;
  area: string;
  category: string;
  labelAr?: string;
  areaAr?: string;
  categoryAr?: string;
};

const categoryAr: Record<string, string> = {
  Landmark: "معلم",
  "Metro station": "محطة مترو",
  "Bus stop": "موقف أتوبيس",
  "Quick pick": "اختيار سريع",
  District: "منطقة",
  Street: "شارع",
  Mall: "مول",
  Market: "سوق",
  Museum: "متحف",
  University: "جامعة",
  "Transit hub": "مركز مواصلات",
};

const areaAr: Record<string, string> = {
  Nearby: "بالقرب منك",
  "Downtown Cairo": "وسط البلد",
  "Central Cairo": "وسط القاهرة",
  "Islamic Cairo": "القاهرة الإسلامية",
  "Gezira Island": "جزيرة الزمالك",
  Zamalek: "الزمالك",
  Giza: "الجيزة",
  "Old Cairo": "مصر القديمة",
  "South Cairo": "جنوب القاهرة",
  "North Cairo": "شمال القاهرة",
  "Nasr City": "مدينة نصر",
  "East Cairo": "شرق القاهرة",
};

const labelAr: Record<string, string> = {
  "Current Location": "الموقع الحالي",
  "Tahrir Square": "ميدان التحرير",
  Sadat: "السادات",
  Nasser: "ناصر",
  "Mohamed Naguib": "محمد نجيب",
  Attaba: "العتبة",
  Ramses: "رمسيس",
  "Al-Sayeda Zeinab": "السيدة زينب",
  "Egyptian Museum": "المتحف المصري",
  "Downtown Cairo": "وسط البلد",
  "Khan el-Khalili": "خان الخليلي",
  Opera: "الأوبرا",
  Zamalek: "الزمالك",
  "Cairo Tower": "برج القاهرة",
  Dokki: "الدقي",
  Bohooth: "البحوث",
  "Cairo University": "جامعة القاهرة",
  Faisal: "فيصل",
  "El Giza": "الجيزة",
  "El Mounib": "المنيب",
  "Giza Pyramids": "أهرامات الجيزة",
  "Grand Egyptian Museum": "المتحف المصري الكبير",
  "Mar Girgis": "مار جرجس",
  Maadi: "المعادي",
  Helwan: "حلوان",
  "Shubra El Kheima": "شبرا الخيمة",
  "New El Marg": "المرج الجديدة",
  Abbassiya: "العباسية",
  "El Demerdash": "الدمرداش",
  Ghamra: "غمرة",
  "Cairo Stadium": "استاد القاهرة",
  "Nasr City": "مدينة نصر",
  "Makram Ebeid": "مكرم عبيد",
  "City Stars Mall": "سيتي ستارز مول",
  Heliopolis: "مصر الجديدة",
  "Adly Mansour": "عدلي منصور",
  "New Cairo": "القاهرة الجديدة",
};

function suggestion(label: string, area: string, category: string): PlaceSuggestion {
  return {
    label,
    area,
    category,
    labelAr: labelAr[label],
    areaAr: areaAr[area],
    categoryAr: categoryAr[category],
  };
}

// Only places inside the OSM+GTFS graph coverage are suggested, so every pick
// can actually be routed. Labels match the backend's local geocoding entries.
const fallbackPlaceSuggestions: PlaceSuggestion[] = [
  { label: "Current Location", area: "Nearby", category: "Quick pick" },

  // Downtown / central metro
  suggestion("Tahrir Square", "Downtown Cairo", "Landmark"),
  suggestion("Sadat", "Downtown Cairo", "Metro station"),
  suggestion("Nasser", "Downtown Cairo", "Metro station"),
  suggestion("Mohamed Naguib", "Downtown Cairo", "Metro station"),
  suggestion("Attaba", "Central Cairo", "Metro station"),
  suggestion("Ramses", "Central Cairo", "Transit hub"),
  suggestion("Al-Sayeda Zeinab", "Central Cairo", "Metro station"),
  suggestion("Egyptian Museum", "Downtown Cairo", "Landmark"),
  suggestion("Downtown Cairo", "Central Cairo", "District"),
  suggestion("Khan el-Khalili", "Islamic Cairo", "Market"),

  // Gezira / Giza
  suggestion("Opera", "Gezira Island", "Metro station"),
  suggestion("Zamalek", "Gezira Island", "District"),
  suggestion("Cairo Tower", "Zamalek", "Landmark"),
  suggestion("Dokki", "Giza", "Metro station"),
  suggestion("Bohooth", "Giza", "Metro station"),
  suggestion("Cairo University", "Giza", "University"),
  suggestion("Faisal", "Giza", "Metro station"),
  suggestion("El Giza", "Giza", "Metro station"),
  suggestion("El Mounib", "Giza", "Metro station"),
  suggestion("Giza Pyramids", "Giza", "Landmark"),
  suggestion("Grand Egyptian Museum", "Giza", "Museum"),

  // Old / South Cairo
  suggestion("Mar Girgis", "Old Cairo", "Metro station"),
  suggestion("Maadi", "South Cairo", "Metro station"),
  suggestion("Helwan", "South Cairo", "Metro station"),

  // North Cairo
  suggestion("Shubra El Kheima", "North Cairo", "Metro station"),
  suggestion("New El Marg", "North Cairo", "Metro station"),

  // East Cairo / Nasr City
  suggestion("Abbassiya", "Central Cairo", "Metro station"),
  suggestion("El Demerdash", "Central Cairo", "Metro station"),
  suggestion("Ghamra", "Central Cairo", "Metro station"),
  suggestion("Cairo Stadium", "Nasr City", "Landmark"),
  suggestion("Nasr City", "East Cairo", "District"),
  suggestion("Makram Ebeid", "Nasr City", "Street"),
  suggestion("City Stars Mall", "Nasr City", "Mall"),
  suggestion("Heliopolis", "East Cairo", "District"),
  suggestion("Adly Mansour", "East Cairo", "Transit hub"),
  suggestion("New Cairo", "East Cairo", "District"),
];

export const placeSuggestions = reactive<PlaceSuggestion[]>([...fallbackPlaceSuggestions]);

export async function refreshPlaceSuggestions(): Promise<void> {
  try {
    const places = await getPlaces();
    placeSuggestions.splice(0, placeSuggestions.length,
      fallbackPlaceSuggestions[0],
      ...places.map((place) => ({
        label: place.name,
        area: "",
        category: place.type === "station"
          ? `Metro station${place.line ? ` - ${place.line}` : ""}`
          : "Stop",
      })),
    );
  } catch {
    placeSuggestions.splice(0, placeSuggestions.length, ...fallbackPlaceSuggestions);
  }
}

void refreshPlaceSuggestions();
