/**
 * Wayfound Smart Mock Engine
 * Strong fallback that mirrors AI quality — context-aware, geographically clustered,
 * budget-maximising, group-specific itineraries from verified Hyderabad places.
 */

interface Place {
  placeName: string;
  address: string;
  costPerPerson: number;
  category: "activity" | "food" | "dessert" | "drinks" | "shopping" | "adventure" | "cultural" | "nature" | "sports" | "entertainment" | "nightlife";
  coordinates: { lat: number; lng: number };
  zone: "west" | "central" | "oldcity" | "north" | "south" | "east";
  tags: string[];
  ageMin: number;
  ageMax: number;
  groupMin: number;
  groupMax: number;
  timePreference: "morning" | "afternoon" | "evening" | "night" | "any";
  closingHour?: number; // 24hr, e.g. 17 = closes 5 PM
}

interface MockItineraryStop {
  placeName: string;
  address: string;
  time: string;
  estimatedCost: number;
  travelTimeFromPrevious: string;
  reasoning: string;
}

interface UserContext {
  totalBudget: number;
  startTime: string;
  occasion: string;
  groupSize: number;
  ageGroup: number;
  wantsFood: boolean;
  wantsAdventure: boolean;
  wantsCultural: boolean;
  wantsNightlife: boolean;
  preferredZone: string;
  experienceType: string;
}

// ═══════════════════════════════════════════
// VERIFIED HYDERABAD PLACES DATABASE
// ═══════════════════════════════════════════
const HYDERABAD_PLACES: Place[] = [

  // ── GO-KARTING ──
  { placeName: "Wheelz Go-Karting", address: "Gachibowli", costPerPerson: 600, category: "adventure", coordinates: { lat: 17.4401, lng: 78.3628 }, zone: "west", tags: ["youth", "adventure", "racing", "competitive"], ageMin: 12, ageMax: 45, groupMin: 2, groupMax: 10, timePreference: "any" },
  { placeName: "Raceology Go-Karting", address: "Gachibowli", costPerPerson: 650, category: "adventure", coordinates: { lat: 17.4410, lng: 78.3620 }, zone: "west", tags: ["youth", "adventure", "racing"], ageMin: 12, ageMax: 45, groupMin: 2, groupMax: 8, timePreference: "any" },
  { placeName: "F9 Go-Karting", address: "Kompally", costPerPerson: 550, category: "adventure", coordinates: { lat: 17.5476, lng: 78.4914 }, zone: "north", tags: ["youth", "adventure", "racing"], ageMin: 12, ageMax: 45, groupMin: 2, groupMax: 10, timePreference: "any" },
  { placeName: "iKart Racing", address: "Shamshabad", costPerPerson: 700, category: "adventure", coordinates: { lat: 17.2403, lng: 78.4294 }, zone: "south", tags: ["premium", "racing", "adventure"], ageMin: 16, ageMax: 50, groupMin: 2, groupMax: 8, timePreference: "any" },

  // ── SPORTS TURFS ──
  { placeName: "PlayOn Turf", address: "Gachibowli", costPerPerson: 200, category: "sports", coordinates: { lat: 17.4435, lng: 78.3487 }, zone: "west", tags: ["sports", "football", "youth", "team"], ageMin: 15, ageMax: 40, groupMin: 6, groupMax: 14, timePreference: "evening" },
  { placeName: "Champions Turf", address: "Madhapur", costPerPerson: 220, category: "sports", coordinates: { lat: 17.4483, lng: 78.3915 }, zone: "west", tags: ["sports", "football", "cricket", "youth"], ageMin: 15, ageMax: 40, groupMin: 6, groupMax: 16, timePreference: "evening" },
  { placeName: "Premier Box Cricket", address: "Gachibowli", costPerPerson: 250, category: "sports", coordinates: { lat: 17.4347, lng: 78.3494 }, zone: "west", tags: ["sports", "cricket", "youth", "team"], ageMin: 15, ageMax: 45, groupMin: 6, groupMax: 12, timePreference: "any" },
  { placeName: "Playo Badminton", address: "Madhapur", costPerPerson: 150, category: "sports", coordinates: { lat: 17.4483, lng: 78.3915 }, zone: "west", tags: ["sports", "indoor", "badminton"], ageMin: 12, ageMax: 55, groupMin: 2, groupMax: 8, timePreference: "any" },

  // ── GAMING & ENTERTAINMENT ──
  { placeName: "Smaaash Entertainment", address: "Inorbit Mall, Madhapur", costPerPerson: 600, category: "entertainment", coordinates: { lat: 17.4398, lng: 78.3908 }, zone: "west", tags: ["gaming", "youth", "activities", "bowling"], ageMin: 10, ageMax: 40, groupMin: 2, groupMax: 10, timePreference: "any" },
  { placeName: "Rush Escape Room", address: "Madhapur", costPerPerson: 500, category: "entertainment", coordinates: { lat: 17.4483, lng: 78.3915 }, zone: "west", tags: ["puzzle", "team-building", "youth"], ageMin: 15, ageMax: 45, groupMin: 4, groupMax: 8, timePreference: "any" },
  { placeName: "Jumpzone Trampoline Park", address: "Gachibowli", costPerPerson: 400, category: "adventure", coordinates: { lat: 17.4401, lng: 78.3628 }, zone: "west", tags: ["fun", "active", "youth", "kids"], ageMin: 6, ageMax: 35, groupMin: 2, groupMax: 15, timePreference: "any" },
  { placeName: "Timezone", address: "Nexus Mall, Kukatpally", costPerPerson: 300, category: "entertainment", coordinates: { lat: 17.4926, lng: 78.3956 }, zone: "north", tags: ["arcade", "gaming", "family-friendly", "kids"], ageMin: 6, ageMax: 40, groupMin: 2, groupMax: 8, timePreference: "any" },
  { placeName: "Lazer Zone VR Gaming", address: "Banjara Hills", costPerPerson: 450, category: "entertainment", coordinates: { lat: 17.4239, lng: 78.4358 }, zone: "west", tags: ["vr", "gaming", "youth", "tech"], ageMin: 12, ageMax: 40, groupMin: 2, groupMax: 6, timePreference: "any" },
  { placeName: "Snow World", address: "Lower Tank Bund, Hyderabad", costPerPerson: 650, category: "entertainment", coordinates: { lat: 17.4125, lng: 78.4683 }, zone: "central", tags: ["unique", "fun", "family-friendly", "kids"], ageMin: 5, ageMax: 50, groupMin: 2, groupMax: 12, timePreference: "any" },

  // ── MALLS & SHOPPING ──
  { placeName: "Inorbit Mall", address: "Madhapur, Hitech City", costPerPerson: 400, category: "shopping", coordinates: { lat: 17.4398, lng: 78.3908 }, zone: "west", tags: ["shopping", "family-friendly", "food-court"], ageMin: 10, ageMax: 60, groupMin: 2, groupMax: 10, timePreference: "any" },
  { placeName: "GVK One Mall", address: "Banjara Hills", costPerPerson: 500, category: "shopping", coordinates: { lat: 17.4326, lng: 78.4071 }, zone: "west", tags: ["premium", "shopping", "family-friendly"], ageMin: 15, ageMax: 65, groupMin: 2, groupMax: 8, timePreference: "any" },
  { placeName: "Forum Sujana City", address: "Kukatpally", costPerPerson: 350, category: "shopping", coordinates: { lat: 17.4926, lng: 78.3956 }, zone: "north", tags: ["shopping", "family-friendly", "movies"], ageMin: 10, ageMax: 60, groupMin: 2, groupMax: 10, timePreference: "any" },
  { placeName: "Sarath City Capital Mall", address: "Kondapur", costPerPerson: 400, category: "shopping", coordinates: { lat: 17.4401, lng: 78.3489 }, zone: "west", tags: ["shopping", "youth", "movies"], ageMin: 10, ageMax: 60, groupMin: 2, groupMax: 8, timePreference: "any" },
  { placeName: "Lulu Mall", address: "Kukatpally", costPerPerson: 500, category: "shopping", coordinates: { lat: 17.4850, lng: 78.3950 }, zone: "north", tags: ["massive", "shopping", "family-friendly"], ageMin: 10, ageMax: 70, groupMin: 2, groupMax: 12, timePreference: "any" },

  // ── NATURE & LAKES ──
  { placeName: "Hussain Sagar Lake", address: "Tank Bund Road", costPerPerson: 0, category: "nature", coordinates: { lat: 17.4239, lng: 78.4738 }, zone: "central", tags: ["scenic", "romantic", "evening", "free"], ageMin: 5, ageMax: 70, groupMin: 1, groupMax: 20, timePreference: "evening" },
  { placeName: "Durgam Cheruvu", address: "Jubilee Hills", costPerPerson: 0, category: "nature", coordinates: { lat: 17.4395, lng: 78.3908 }, zone: "west", tags: ["hidden-gem", "romantic", "scenic", "peaceful"], ageMin: 15, ageMax: 60, groupMin: 2, groupMax: 8, timePreference: "evening" },
  { placeName: "KBR National Park", address: "Jubilee Hills", costPerPerson: 0, category: "nature", coordinates: { lat: 17.4239, lng: 78.4043 }, zone: "west", tags: ["nature", "morning-walk", "peaceful", "fitness"], ageMin: 5, ageMax: 70, groupMin: 1, groupMax: 10, timePreference: "morning", closingHour: 18 },
  { placeName: "Lumbini Park", address: "Secretariat Road", costPerPerson: 30, category: "nature", coordinates: { lat: 17.4125, lng: 78.4683 }, zone: "central", tags: ["family-friendly", "evening", "laser-show"], ageMin: 5, ageMax: 70, groupMin: 2, groupMax: 15, timePreference: "evening" },
  { placeName: "Osman Sagar (Gandipet)", address: "Gandipet, Hyderabad", costPerPerson: 0, category: "nature", coordinates: { lat: 17.3500, lng: 78.3200 }, zone: "west", tags: ["scenic", "peaceful", "picnic"], ageMin: 5, ageMax: 70, groupMin: 2, groupMax: 15, timePreference: "morning" },

  // ── CULTURAL & HISTORICAL ──
  { placeName: "Charminar", address: "Old City, Hyderabad", costPerPerson: 25, category: "cultural", coordinates: { lat: 17.3616, lng: 78.4747 }, zone: "oldcity", tags: ["iconic", "historical", "tourist", "photo-walk"], ageMin: 10, ageMax: 70, groupMin: 1, groupMax: 20, timePreference: "any" },
  { placeName: "Golconda Fort", address: "Ibrahim Bagh", costPerPerson: 25, category: "cultural", coordinates: { lat: 17.3833, lng: 78.4011 }, zone: "west", tags: ["historical", "heritage", "tourist", "morning-only"], ageMin: 10, ageMax: 65, groupMin: 2, groupMax: 20, timePreference: "morning", closingHour: 17 },
  { placeName: "Chowmahalla Palace", address: "Old City", costPerPerson: 80, category: "cultural", coordinates: { lat: 17.3616, lng: 78.4740 }, zone: "oldcity", tags: ["heritage", "royal", "architecture", "photography"], ageMin: 10, ageMax: 70, groupMin: 1, groupMax: 15, timePreference: "morning" },
  { placeName: "Salar Jung Museum", address: "Darulshifa, Old City", costPerPerson: 50, category: "cultural", coordinates: { lat: 17.3712, lng: 78.4803 }, zone: "oldcity", tags: ["museum", "art", "cultural", "educational"], ageMin: 10, ageMax: 70, groupMin: 1, groupMax: 10, timePreference: "morning", closingHour: 17 },
  { placeName: "Birla Mandir", address: "Naubat Pahad, Khairatabad", costPerPerson: 0, category: "cultural", coordinates: { lat: 17.4062, lng: 78.4691 }, zone: "central", tags: ["spiritual", "scenic-view", "peaceful"], ageMin: 5, ageMax: 75, groupMin: 1, groupMax: 15, timePreference: "any" },
  { placeName: "Shilparamam", address: "Madhapur", costPerPerson: 50, category: "cultural", coordinates: { lat: 17.4483, lng: 78.3915 }, zone: "west", tags: ["crafts", "cultural", "family-friendly", "open-air"], ageMin: 8, ageMax: 70, groupMin: 2, groupMax: 15, timePreference: "any" },

  // ── BIRYANI & ICONIC FOOD ──
  { placeName: "Paradise Restaurant", address: "Secunderabad", costPerPerson: 350, category: "food", coordinates: { lat: 17.4399, lng: 78.4983 }, zone: "north", tags: ["biryani", "iconic", "must-try", "all-groups"], ageMin: 5, ageMax: 75, groupMin: 2, groupMax: 12, timePreference: "any" },
  { placeName: "Bawarchi", address: "RTC X Roads, Himayatnagar", costPerPerson: 300, category: "food", coordinates: { lat: 17.4399, lng: 78.4983 }, zone: "central", tags: ["biryani", "local-favorite", "budget"], ageMin: 10, ageMax: 70, groupMin: 2, groupMax: 10, timePreference: "any" },
  { placeName: "Shah Ghouse", address: "Tolichowki", costPerPerson: 320, category: "food", coordinates: { lat: 17.4008, lng: 78.4131 }, zone: "west", tags: ["biryani", "late-night", "local", "authentic"], ageMin: 12, ageMax: 65, groupMin: 2, groupMax: 10, timePreference: "any" },
  { placeName: "Shadab Hotel", address: "Old City", costPerPerson: 250, category: "food", coordinates: { lat: 17.3616, lng: 78.4747 }, zone: "oldcity", tags: ["haleem", "biryani", "old-city", "authentic"], ageMin: 12, ageMax: 70, groupMin: 2, groupMax: 10, timePreference: "any" },
  { placeName: "Sarvi Hotel", address: "Banjara Hills", costPerPerson: 400, category: "food", coordinates: { lat: 17.4185, lng: 78.4408 }, zone: "west", tags: ["biryani", "kebabs", "popular", "evening"], ageMin: 15, ageMax: 65, groupMin: 2, groupMax: 10, timePreference: "any" },
  { placeName: "Cafe Bahar", address: "Basheer Bagh", costPerPerson: 250, category: "food", coordinates: { lat: 17.4036, lng: 78.4772 }, zone: "central", tags: ["irani-chai", "traditional", "local", "morning"], ageMin: 15, ageMax: 70, groupMin: 2, groupMax: 8, timePreference: "morning" },
  { placeName: "Nimrah Cafe", address: "Near Charminar, Old City", costPerPerson: 100, category: "food", coordinates: { lat: 17.3616, lng: 78.4747 }, zone: "oldcity", tags: ["irani-chai", "old-city", "cheap", "iconic"], ageMin: 10, ageMax: 70, groupMin: 2, groupMax: 8, timePreference: "any" },
  { placeName: "Pista House", address: "Pathergatti, Old City", costPerPerson: 200, category: "food", coordinates: { lat: 17.3616, lng: 78.4740 }, zone: "oldcity", tags: ["haleem", "old-city", "iconic", "sweets"], ageMin: 10, ageMax: 70, groupMin: 2, groupMax: 8, timePreference: "any" },

  // ── FINE DINING ──
  { placeName: "AB's Absolute Barbecues", address: "Gachibowli", costPerPerson: 900, category: "food", coordinates: { lat: 17.4401, lng: 78.3628 }, zone: "west", tags: ["bbq", "premium", "group-friendly", "unlimited"], ageMin: 18, ageMax: 65, groupMin: 2, groupMax: 12, timePreference: "evening" },
  { placeName: "Barbeque Nation", address: "Banjara Hills", costPerPerson: 800, category: "food", coordinates: { lat: 17.4239, lng: 78.4358 }, zone: "west", tags: ["bbq", "group-friendly", "buffet", "family-friendly"], ageMin: 10, ageMax: 65, groupMin: 2, groupMax: 15, timePreference: "evening" },
  { placeName: "Ohri's Gufaa", address: "Necklace Road", costPerPerson: 900, category: "food", coordinates: { lat: 17.4125, lng: 78.4683 }, zone: "central", tags: ["cave-theme", "unique-ambiance", "family-friendly"], ageMin: 10, ageMax: 65, groupMin: 2, groupMax: 10, timePreference: "any" },
  { placeName: "The Fisherman's Wharf", address: "Banjara Hills", costPerPerson: 800, category: "food", coordinates: { lat: 17.4290, lng: 78.4125 }, zone: "west", tags: ["seafood", "romantic", "premium"], ageMin: 20, ageMax: 60, groupMin: 2, groupMax: 8, timePreference: "any" },
  { placeName: "Farzi Cafe", address: "Banjara Hills", costPerPerson: 900, category: "food", coordinates: { lat: 17.4239, lng: 78.4358 }, zone: "west", tags: ["modern-indian", "trendy", "instagram", "youth"], ageMin: 18, ageMax: 45, groupMin: 2, groupMax: 8, timePreference: "any" },
  { placeName: "Olive Bistro", address: "Jubilee Hills", costPerPerson: 1200, category: "food", coordinates: { lat: 17.4312, lng: 78.4095 }, zone: "west", tags: ["romantic", "premium", "italian", "date-night"], ageMin: 25, ageMax: 60, groupMin: 2, groupMax: 6, timePreference: "evening" },

  // ── CAFES & CASUAL ──
  { placeName: "Social Jubilee Hills", address: "Road No 36, Jubilee Hills", costPerPerson: 600, category: "drinks", coordinates: { lat: 17.4312, lng: 78.4095 }, zone: "west", tags: ["youth", "trendy", "social", "drinks"], ageMin: 21, ageMax: 45, groupMin: 2, groupMax: 10, timePreference: "evening" },
  { placeName: "Roastery Coffee House", address: "Jubilee Hills", costPerPerson: 300, category: "drinks", coordinates: { lat: 17.4142, lng: 78.4093 }, zone: "west", tags: ["coffee", "work-friendly", "cozy", "instagram"], ageMin: 18, ageMax: 55, groupMin: 1, groupMax: 6, timePreference: "any" },
  { placeName: "Autumn Leaf Cafe", address: "Jubilee Hills", costPerPerson: 400, category: "drinks", coordinates: { lat: 17.4312, lng: 78.4095 }, zone: "west", tags: ["instagram", "youth", "coffee", "aesthetic"], ageMin: 16, ageMax: 40, groupMin: 2, groupMax: 6, timePreference: "any" },
  { placeName: "Lamakaan", address: "Banjara Hills", costPerPerson: 250, category: "drinks", coordinates: { lat: 17.4239, lng: 78.4358 }, zone: "west", tags: ["cultural", "art", "conversation", "eclectic"], ageMin: 18, ageMax: 50, groupMin: 2, groupMax: 10, timePreference: "any" },
  { placeName: "Tabula Rasa", address: "Jubilee Hills", costPerPerson: 300, category: "drinks", coordinates: { lat: 17.4312, lng: 78.4095 }, zone: "west", tags: ["books", "quiet", "intellectual", "coffee"], ageMin: 18, ageMax: 50, groupMin: 1, groupMax: 4, timePreference: "any" },
  { placeName: "Chutneys", address: "Banjara Hills", costPerPerson: 350, category: "food", coordinates: { lat: 17.4185, lng: 78.4408 }, zone: "west", tags: ["south-indian", "family-friendly", "breakfast", "lunch"], ageMin: 10, ageMax: 70, groupMin: 2, groupMax: 10, timePreference: "morning" },
  { placeName: "Eat Street", address: "Necklace Road", costPerPerson: 300, category: "food", coordinates: { lat: 17.4125, lng: 78.4683 }, zone: "central", tags: ["street-food", "variety", "evening", "casual"], ageMin: 10, ageMax: 65, groupMin: 2, groupMax: 12, timePreference: "evening" },

  // ── DESSERTS ──
  { placeName: "Cream Stone", address: "Banjara Hills", costPerPerson: 200, category: "dessert", coordinates: { lat: 17.4217, lng: 78.4431 }, zone: "west", tags: ["ice-cream", "trendy", "youth", "casual"], ageMin: 5, ageMax: 50, groupMin: 2, groupMax: 8, timePreference: "any" },
  { placeName: "Haagen-Dazs", address: "GVK One Mall, Banjara Hills", costPerPerson: 400, category: "dessert", coordinates: { lat: 17.4326, lng: 78.4071 }, zone: "west", tags: ["premium", "ice-cream", "romantic", "date"], ageMin: 15, ageMax: 60, groupMin: 2, groupMax: 6, timePreference: "any" },
  { placeName: "Rollacosta", address: "Gachibowli", costPerPerson: 250, category: "dessert", coordinates: { lat: 17.4401, lng: 78.3628 }, zone: "west", tags: ["rolled-ice-cream", "youth", "fun"], ageMin: 8, ageMax: 40, groupMin: 2, groupMax: 8, timePreference: "any" },
  { placeName: "Concu Chocolatier", address: "Jubilee Hills", costPerPerson: 350, category: "dessert", coordinates: { lat: 17.4312, lng: 78.4095 }, zone: "west", tags: ["artisan", "chocolate", "romantic", "premium"], ageMin: 12, ageMax: 60, groupMin: 2, groupMax: 6, timePreference: "any" },
  { placeName: "Karachi Bakery", address: "Mozamjahi Market, Abids", costPerPerson: 200, category: "dessert", coordinates: { lat: 17.3948, lng: 78.4772 }, zone: "central", tags: ["bakery", "iconic", "biscuits", "tourist"], ageMin: 5, ageMax: 75, groupMin: 1, groupMax: 10, timePreference: "any" },
  { placeName: "Almond House", address: "Banjara Hills", costPerPerson: 150, category: "dessert", coordinates: { lat: 17.4239, lng: 78.4358 }, zone: "west", tags: ["sweets", "traditional", "gifting", "all-ages"], ageMin: 5, ageMax: 75, groupMin: 1, groupMax: 10, timePreference: "any" },

  // ── NIGHTLIFE & BARS ──
  { placeName: "Prost Brew Pub", address: "Financial District, Gachibowli", costPerPerson: 900, category: "nightlife", coordinates: { lat: 17.4167, lng: 78.3450 }, zone: "west", tags: ["brewery", "craft-beer", "youth", "corporate"], ageMin: 21, ageMax: 50, groupMin: 2, groupMax: 12, timePreference: "evening" },
  { placeName: "Hard Rock Cafe", address: "Banjara Hills", costPerPerson: 1200, category: "nightlife", coordinates: { lat: 17.4239, lng: 78.4358 }, zone: "west", tags: ["international", "music", "premium", "youth"], ageMin: 21, ageMax: 50, groupMin: 2, groupMax: 10, timePreference: "night" },
  { placeName: "Prism Skybar", address: "Madhapur", costPerPerson: 1000, category: "nightlife", coordinates: { lat: 17.4483, lng: 78.3915 }, zone: "west", tags: ["rooftop", "skybar", "premium", "views"], ageMin: 21, ageMax: 45, groupMin: 2, groupMax: 10, timePreference: "night" },
  { placeName: "The Moonshine Project", address: "Jubilee Hills", costPerPerson: 1000, category: "nightlife", coordinates: { lat: 17.4312, lng: 78.4095 }, zone: "west", tags: ["cocktails", "trendy", "youth", "premium"], ageMin: 21, ageMax: 45, groupMin: 2, groupMax: 8, timePreference: "night" },
  { placeName: "Bootlegger", address: "Jubilee Hills", costPerPerson: 800, category: "nightlife", coordinates: { lat: 17.4312, lng: 78.4095 }, zone: "west", tags: ["bar", "youth", "casual", "music"], ageMin: 21, ageMax: 45, groupMin: 2, groupMax: 10, timePreference: "night" },

  // ── UNIQUE EXPERIENCES ──
  { placeName: "Ramoji Film City", address: "Anaspur Village, Hyderabad", costPerPerson: 1500, category: "entertainment", coordinates: { lat: 17.2543, lng: 78.6808 }, zone: "east", tags: ["theme-park", "full-day", "family-friendly", "tourist"], ageMin: 5, ageMax: 70, groupMin: 2, groupMax: 20, timePreference: "morning" },
  { placeName: "Falaknuma Palace", address: "Falaknuma, Old City", costPerPerson: 3000, category: "food", coordinates: { lat: 17.3287, lng: 78.4632 }, zone: "oldcity", tags: ["luxury", "royal", "heritage", "special-occasion"], ageMin: 25, ageMax: 70, groupMin: 2, groupMax: 8, timePreference: "evening" },
  { placeName: "Birla Planetarium", address: "Naubat Pahad", costPerPerson: 100, category: "cultural", coordinates: { lat: 17.4062, lng: 78.4691 }, zone: "central", tags: ["educational", "space", "kids", "family-friendly"], ageMin: 8, ageMax: 60, groupMin: 2, groupMax: 15, timePreference: "any" },
  { placeName: "Nehru Zoological Park", address: "Bahadurpura", costPerPerson: 100, category: "nature", coordinates: { lat: 17.3500, lng: 78.4513 }, zone: "oldcity", tags: ["zoo", "kids", "family-friendly", "educational"], ageMin: 3, ageMax: 65, groupMin: 2, groupMax: 12, timePreference: "morning", closingHour: 17 },
  { placeName: "Laad Bazaar", address: "Near Charminar, Old City", costPerPerson: 300, category: "shopping", coordinates: { lat: 17.3616, lng: 78.4740 }, zone: "oldcity", tags: ["bangles", "shopping", "tourist", "heritage", "photo-walk"], ageMin: 10, ageMax: 70, groupMin: 2, groupMax: 15, timePreference: "any" },
];

// ═══════════════════════════════════════════
// CONTEXT EXTRACTION
// ═══════════════════════════════════════════
function extractContext(intent: string): UserContext {
  const lower = intent.toLowerCase();

  // Group size
  const groupMatch = lower.match(/(\d+)\s*(?:people|ppl|persons|friends|guys|members|of\s+us)/);
  const groupSize = groupMatch ? parseInt(groupMatch[1]) : 2;

  // Age
  const ageMatch = lower.match(/age\s*(?:group|grp)?\s*(?:of|:)?\s*(\d+)/);
  const ageGroup = ageMatch ? parseInt(ageMatch[1]) : 25;

  // Budget — TOTAL for group
  const budgetMatch = intent.match(/(?:under|below|within|budget|rs\.?|₹)\s*(\d+)/i) || intent.match(/(\d{4,})/);
  const totalBudget = budgetMatch ? parseInt(budgetMatch[1]) : 2000;

  // Start time
  const timeMatch = intent.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
  const startTime = timeMatch
    ? `${timeMatch[1]}:${timeMatch[2] || "00"} ${timeMatch[3].toUpperCase()}`
    : "7:00 PM";

  // Occasion
  let occasion = "friends";
  if (lower.match(/\bdate\b|romantic|couple|gf|bf|girlfriend|boyfriend/)) occasion = "date";
  else if (lower.match(/family|kids|children|parents/)) occasion = "family";
  else if (lower.match(/\bsolo\b|alone|myself/)) occasion = "solo";
  else if (lower.match(/corporate|team|office|colleagues/)) occasion = "corporate";
  else if (lower.match(/tourist|visiting|tourism/)) occasion = "tourist";

  // Intent flags
  const wantsFood = lower.match(/food|eat|dinner|lunch|breakfast|biryani|restaurant|cafe|hungry/) !== null;
  const wantsAdventure = lower.match(/adventure|karting|turf|gaming|sport|cricket|football|escape|trampoline/) !== null;
  const wantsCultural = lower.match(/heritage|cultural|history|fort|palace|museum|charminar|old city/) !== null;
  const wantsNightlife = lower.match(/bar|pub|club|drinks|nightlife|night out|beer|party/) !== null;

  // Experience type
  let experienceType = "general";
  if (lower.includes("food trail")) experienceType = "food-trail";
  else if (lower.includes("cafe hopping")) experienceType = "cafe-hopping";
  else if (lower.includes("heritage") || lower.includes("history")) experienceType = "heritage-walk";
  else if (lower.includes("night out") || lower.includes("nightlife")) experienceType = "night-out";
  else if (lower.includes("birthday")) experienceType = "birthday";
  else if (lower.includes("tourist")) experienceType = "tourist";

  // Preferred zone from keywords
  let preferredZone = "any";
  if (lower.match(/gachibowli|madhapur|hitech|jubilee|banjara|kondapur/)) preferredZone = "west";
  else if (lower.match(/old city|charminar|falaknuma|secunderabad/)) preferredZone = "oldcity";
  else if (lower.match(/kukatpally|kompally|alwal|north/)) preferredZone = "north";

  return { totalBudget, startTime, occasion, groupSize, ageGroup, wantsFood, wantsAdventure, wantsCultural, wantsNightlife, preferredZone, experienceType };
}

// ═══════════════════════════════════════════
// SMART FILTERING
// ═══════════════════════════════════════════
function filterPlaces(places: Place[], ctx: UserContext): Place[] {
  const startHour = parseStartHour(ctx.startTime);

  return places.filter(p => {
    // Age check
    if (ctx.ageGroup < p.ageMin || ctx.ageGroup > p.ageMax) return false;

    // Group size check
    if (ctx.groupSize < p.groupMin || ctx.groupSize > p.groupMax) return false;

    // No nightlife for families or under 21
    if (p.category === "nightlife" && (ctx.occasion === "family" || ctx.ageGroup < 21)) return false;

    // Skip closed venues based on time
    if (p.closingHour && startHour >= p.closingHour - 1) return false;

    // Skip morning-only places for evening plans
    if (p.timePreference === "morning" && startHour >= 14) return false;

    // Prefer zone clustering
    if (ctx.preferredZone !== "any" && p.zone !== ctx.preferredZone) return false;

    return true;
  });
}

function parseStartHour(timeStr: string): number {
  const [time, period] = timeStr.split(" ");
  let [h] = time.split(":").map(Number);
  if (period === "PM" && h !== 12) h += 12;
  if (period === "AM" && h === 12) h = 0;
  return h;
}

// ═══════════════════════════════════════════
// ITINERARY BUILDER
// ═══════════════════════════════════════════
function pickStops(filtered: Place[], all: Place[], ctx: UserContext): Place[] {
  const picked: Place[] = [];
  let spent = 0;

  // Define stop sequence based on context
  let sequence: string[][] = [];

  if (ctx.ageGroup < 25 && ctx.occasion !== "date") {
    // Young group: adventure → food → dessert
    sequence = [
      ["adventure", "sports", "entertainment"],
      ["food"],
      ["dessert", "drinks"],
    ];
  } else if (ctx.occasion === "date") {
    // Date night: scenic/cultural → fine dining → dessert
    sequence = [
      ["nature", "cultural"],
      ["food", "drinks"],
      ["dessert"],
    ];
  } else if (ctx.occasion === "family") {
    // Family: park/entertainment → food → dessert
    sequence = [
      ["nature", "entertainment", "cultural"],
      ["food"],
      ["dessert"],
    ];
  } else if (ctx.wantsCultural) {
    // Heritage walk: cultural → food → cultural/shopping
    sequence = [
      ["cultural"],
      ["food"],
      ["cultural", "shopping"],
    ];
  } else if (ctx.wantsNightlife) {
    // Night out: food → drinks → nightlife
    sequence = [
      ["food"],
      ["drinks", "nightlife"],
      ["nightlife"],
    ];
  } else {
    // Default: activity → food → dessert
    sequence = [
      ["activity", "entertainment", "adventure", "shopping"],
      ["food"],
      ["dessert", "drinks"],
    ];
  }

  // Pick one place per slot
  const pool = filtered.length > 0 ? filtered : all.filter(p => ctx.ageGroup >= p.ageMin && ctx.ageGroup <= p.ageMax);

  for (const cats of sequence) {
    const candidate = pool.find(p =>
      cats.includes(p.category) &&
      !picked.includes(p) &&
      spent + p.costPerPerson * ctx.groupSize <= ctx.totalBudget * 1.1 // allow 10% over
    );
    if (candidate) {
      picked.push(candidate);
      spent += candidate.costPerPerson * ctx.groupSize;
    }
  }

  // If we still have budget headroom, try adding a 4th stop
  if (picked.length === 3) {
    const remaining = ctx.totalBudget - spent;
    const bonus = pool.find(p =>
      !picked.includes(p) &&
      p.costPerPerson * ctx.groupSize <= remaining &&
      p.category !== picked[picked.length - 1].category
    );
    if (bonus && remaining >= bonus.costPerPerson * ctx.groupSize) {
      picked.push(bonus);
    }
  }

  return picked;
}

// Travel time between coords
function travelTime(from: { lat: number; lng: number }, to: { lat: number; lng: number }): string {
  const R = 6371;
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(from.lat * Math.PI / 180) * Math.cos(to.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const mins = Math.round((dist / 25) * 60); // 25 km/h avg Hyd traffic
  return mins <= 1 ? "0 min" : `${mins} min`;
}

function addMins(timeStr: string, minutes: number): string {
  const [time, period] = timeStr.split(" ");
  const [h, m] = time.split(":").map(Number);
  let total = (period === "PM" && h !== 12 ? h + 12 : period === "AM" && h === 12 ? 0 : h) * 60 + m + minutes;
  total = ((total % 1440) + 1440) % 1440;
  let nh = Math.floor(total / 60), nm = total % 60;
  const np = nh >= 12 ? "PM" : "AM";
  if (nh === 0) nh = 12;
  else if (nh > 12) nh -= 12;
  return `${nh}:${nm.toString().padStart(2, "0")} ${np}`;
}

function visitDuration(p: Place): number {
  if (p.category === "adventure" || p.category === "sports") return 90;
  if (p.category === "entertainment") return 75;
  if (p.category === "food") return 60;
  if (p.category === "cultural") return 60;
  if (p.category === "nature") return 45;
  if (p.category === "drinks" || p.category === "nightlife") return 60;
  if (p.category === "dessert") return 25;
  return 45;
}

function buildReasoning(p: Place, ctx: UserContext, idx: number, total: number): string {
  const totalCost = p.costPerPerson * ctx.groupSize;
  const perPerson = p.costPerPerson;
  const groupDesc = ctx.groupSize > 1 ? `${ctx.groupSize} people` : "solo";

  if (p.category === "adventure" || p.category === "sports") {
    return `₹${perPerson}/person × ${ctx.groupSize} = ₹${totalCost} total — perfect adrenaline start for ${ctx.ageGroup}-year-old group`;
  }
  if (p.category === "food") {
    if (p.tags.includes("biryani")) return `₹${perPerson}/person × ${ctx.groupSize} = ₹${totalCost} total — iconic Hyderabad biryani, great for ${groupDesc}`;
    if (p.tags.includes("bbq")) return `₹${perPerson}/person × ${ctx.groupSize} = ₹${totalCost} total — unlimited BBQ, ideal for groups`;
    return `₹${perPerson}/person × ${ctx.groupSize} = ₹${totalCost} total — well-rated, fits the plan`;
  }
  if (p.category === "dessert") {
    return idx === total - 1
      ? `₹${perPerson}/person × ${ctx.groupSize} = ₹${totalCost} total — sweet finish to the night`
      : `₹${perPerson}/person × ${ctx.groupSize} = ₹${totalCost} total — quick dessert stop`;
  }
  if (p.category === "cultural") {
    return `₹${perPerson}/person × ${ctx.groupSize} = ₹${totalCost} total — ${p.tags.includes("iconic") ? "must-see Hyderabad landmark" : "rich heritage experience"}`;
  }
  if (p.category === "drinks") {
    return ctx.occasion === "date"
      ? `₹${perPerson}/person × ${ctx.groupSize} = ₹${totalCost} total — cozy, great for conversations`
      : `₹${perPerson}/person × ${ctx.groupSize} = ₹${totalCost} total — chill vibe, good for groups`;
  }
  if (p.category === "nightlife") {
    return `₹${perPerson}/person × ${ctx.groupSize} = ₹${totalCost} total — lively spot for the group`;
  }
  return `₹${perPerson}/person × ${ctx.groupSize} = ₹${totalCost} total — well-reviewed, fits the budget`;
}

// ═══════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════
export function generateMockItinerary(userIntent: string): MockItineraryStop[] {
  const ctx = extractContext(userIntent);
  let filtered = filterPlaces(HYDERABAD_PLACES, ctx);

  // Loosen zone filter if not enough places
  if (filtered.length < 3) {
    const relaxed = HYDERABAD_PLACES.filter(p =>
      ctx.ageGroup >= p.ageMin &&
      ctx.ageGroup <= p.ageMax &&
      ctx.groupSize >= p.groupMin &&
      ctx.groupSize <= p.groupMax &&
      p.category !== "nightlife" || ctx.ageGroup >= 21
    );
    filtered = relaxed;
  }

  const stops = pickStops(filtered, HYDERABAD_PLACES, ctx);

  // Fallback if still nothing
  if (stops.length === 0) {
    return [{
      placeName: "Paradise Restaurant",
      address: "Secunderabad",
      time: ctx.startTime,
      estimatedCost: 350 * ctx.groupSize,
      travelTimeFromPrevious: "0 min",
      reasoning: `₹350/person × ${ctx.groupSize} = ₹${350 * ctx.groupSize} — iconic Hyderabad biryani, suitable for all groups`,
    }];
  }

  let currentTime = ctx.startTime;
  return stops.map((place, idx) => {
    const travel = idx === 0 ? "0 min" : travelTime(stops[idx - 1].coordinates, place.coordinates);
    const travelMins = parseInt(travel) || 0;
    if (idx > 0) currentTime = addMins(currentTime, travelMins + visitDuration(stops[idx - 1]));

    return {
      placeName: place.placeName,
      address: place.address,
      time: currentTime,
      estimatedCost: place.costPerPerson * ctx.groupSize,
      travelTimeFromPrevious: travel,
      reasoning: buildReasoning(place, ctx, idx, stops.length),
    };
  });
}
