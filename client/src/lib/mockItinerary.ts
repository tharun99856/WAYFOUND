/**
 * Intelligent Mock Itinerary Generator
 * 
 * Fallback system when Gemini API fails.
 * Extracts budget, time, occasion, and group context from user intent.
 * Generates realistic itineraries from comprehensive Hyderabad places database.
 */

interface Place {
  placeName: string;
  address: string;
  baseCost: number;
  category: "activity" | "food" | "dessert" | "drinks" | "shopping" | "adventure" | "cultural" | "nature" | "sports" | "entertainment" | "nightlife";
  coordinates: { lat: number; lng: number };
  tags: string[]; // e.g., ["romantic", "family-friendly", "youth", "adventure", "cultural"]
  ageRange: [number, number]; // e.g., [18, 40] means suitable for 18-40 year olds
  groupSize: [number, number]; // e.g., [2, 6] means suitable for 2-6 people
  timePreference: "morning" | "afternoon" | "evening" | "night" | "any";
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
  budget: number;
  startTime: string;
  occasion: string;
  groupSize: number;
  ageGroup: number;
  wantsFood: boolean;
}

// MASSIVE Hyderabad places database - 100+ venues across all categories
const HYDERABAD_PLACES: Place[] = [
  // === MALLS & SHOPPING ===
  {
    placeName: "Inorbit Mall",
    address: "HITEC City, Madhapur",
    baseCost: 400,
    category: "shopping",
    coordinates: { lat: 17.4398, lng: 78.3908 },
    tags: ["family-friendly", "youth", "shopping"],
    ageRange: [10, 60],
    groupSize: [2, 8],
    timePreference: "any",
  },
  {
    placeName: "GVK One Mall",
    address: "Road No 1, Banjara Hills",
    baseCost: 500,
    category: "shopping",
    coordinates: { lat: 17.4326, lng: 78.4071 },
    tags: ["premium", "family-friendly", "shopping"],
    ageRange: [15, 65],
    groupSize: [2, 6],
    timePreference: "any",
  },
  {
    placeName: "Forum Sujana Mall",
    address: "Kukatpally",
    baseCost: 350,
    category: "shopping",
    coordinates: { lat: 17.4926, lng: 78.3956 },
    tags: ["family-friendly", "shopping"],
    ageRange: [10, 60],
    groupSize: [2, 8],
    timePreference: "any",
  },
  {
    placeName: "Sarath City Capital Mall",
    address: "Gachibowli",
    baseCost: 400,
    category: "shopping",
    coordinates: { lat: 17.4401, lng: 78.3489 },
    tags: ["family-friendly", "youth", "shopping"],
    ageRange: [10, 60],
    groupSize: [2, 8],
    timePreference: "any",
  },
  {
    placeName: "Lulu Mall Hyderabad",
    address: "Kukatpally",
    baseCost: 500,
    category: "shopping",
    coordinates: { lat: 17.4850, lng: 78.3950 },
    tags: ["family-friendly", "shopping", "massive"],
    ageRange: [10, 70],
    groupSize: [2, 10],
    timePreference: "any",
  },
  {
    placeName: "Manjeera Mall",
    address: "Kukatpally",
    baseCost: 300,
    category: "shopping",
    coordinates: { lat: 17.4949, lng: 78.3913 },
    tags: ["family-friendly", "shopping"],
    ageRange: [10, 60],
    groupSize: [2, 6],
    timePreference: "any",
  },
  {
    placeName: "City Center Mall",
    address: "Banjara Hills",
    baseCost: 450,
    category: "shopping",
    coordinates: { lat: 17.4212, lng: 78.4497 },
    tags: ["premium", "shopping"],
    ageRange: [15, 65],
    groupSize: [2, 6],
    timePreference: "any",
  },

  // === PARKS & NATURE ===
  {
    placeName: "KBR National Park",
    address: "Jubilee Hills",
    baseCost: 0,
    category: "nature",
    coordinates: { lat: 17.4239, lng: 78.4043 },
    tags: ["nature", "family-friendly", "peaceful"],
    ageRange: [5, 70],
    groupSize: [1, 10],
    timePreference: "morning",
  },
  {
    placeName: "Hussain Sagar Lakeside",
    address: "Tank Bund Road",
    baseCost: 0,
    category: "nature",
    coordinates: { lat: 17.4239, lng: 78.4738 },
    tags: ["romantic", "family-friendly", "scenic"],
    ageRange: [5, 70],
    groupSize: [1, 20],
    timePreference: "evening",
  },
  {
    placeName: "Lumbini Park",
    address: "Secretariat Road",
    baseCost: 30,
    category: "nature",
    coordinates: { lat: 17.4125, lng: 78.4683 },
    tags: ["family-friendly", "scenic", "evening-lights"],
    ageRange: [5, 70],
    groupSize: [2, 15],
    timePreference: "evening",
  },
  {
    placeName: "Nehru Zoological Park",
    address: "Bahadurpura",
    baseCost: 100,
    category: "nature",
    coordinates: { lat: 17.3500, lng: 78.4513 },
    tags: ["family-friendly", "kids", "educational"],
    ageRange: [3, 60],
    groupSize: [2, 10],
    timePreference: "morning",
  },
  {
    placeName: "Botanical Garden",
    address: "Kothaguda, Kondapur",
    baseCost: 25,
    category: "nature",
    coordinates: { lat: 17.4608, lng: 78.3644 },
    tags: ["nature", "peaceful", "family-friendly"],
    ageRange: [5, 70],
    groupSize: [2, 10],
    timePreference: "morning",
  },
  {
    placeName: "Durgam Cheruvu Secret Lake",
    address: "Jubilee Hills",
    baseCost: 0,
    category: "nature",
    coordinates: { lat: 17.4395, lng: 78.3908 },
    tags: ["romantic", "scenic", "hidden-gem"],
    ageRange: [15, 60],
    groupSize: [2, 8],
    timePreference: "evening",
  },

  // === HISTORICAL & CULTURAL ===
  {
    placeName: "Chowmahalla Palace",
    address: "Khilwat, Old City",
    baseCost: 80,
    category: "cultural",
    coordinates: { lat: 17.3616, lng: 78.4740 },
    tags: ["cultural", "historical", "architecture"],
    ageRange: [10, 70],
    groupSize: [1, 15],
    timePreference: "morning",
  },
  {
    placeName: "Golconda Fort",
    address: "Ibrahim Bagh",
    baseCost: 25,
    category: "cultural",
    coordinates: { lat: 17.3833, lng: 78.4011 },
    tags: ["historical", "adventure", "cultural"],
    ageRange: [10, 65],
    groupSize: [2, 20],
    timePreference: "morning",
  },
  {
    placeName: "Salar Jung Museum",
    address: "Darulshifa, Old City",
    baseCost: 50,
    category: "cultural",
    coordinates: { lat: 17.3712, lng: 78.4803 },
    tags: ["cultural", "educational", "art"],
    ageRange: [10, 70],
    groupSize: [1, 10],
    timePreference: "morning",
  },
  {
    placeName: "Charminar",
    address: "Charminar Road, Old City",
    baseCost: 25,
    category: "cultural",
    coordinates: { lat: 17.3616, lng: 78.4747 },
    tags: ["iconic", "cultural", "historical"],
    ageRange: [10, 70],
    groupSize: [1, 20],
    timePreference: "any",
  },
  {
    placeName: "Qutb Shahi Tombs",
    address: "Ibrahim Bagh",
    baseCost: 25,
    category: "cultural",
    coordinates: { lat: 17.3946, lng: 78.3919 },
    tags: ["historical", "peaceful", "architecture"],
    ageRange: [15, 70],
    groupSize: [1, 10],
    timePreference: "morning",
  },
  {
    placeName: "Birla Mandir",
    address: "Naubat Pahad, Khairatabad",
    baseCost: 0,
    category: "cultural",
    coordinates: { lat: 17.4062, lng: 78.4691 },
    tags: ["religious", "peaceful", "scenic-views"],
    ageRange: [5, 75],
    groupSize: [1, 15],
    timePreference: "any",
  },
  {
    placeName: "Mecca Masjid",
    address: "Charminar, Old City",
    baseCost: 0,
    category: "cultural",
    coordinates: { lat: 17.3615, lng: 78.4738 },
    tags: ["religious", "historical", "architecture"],
    ageRange: [10, 70],
    groupSize: [1, 20],
    timePreference: "any",
  },

  // === GO-KARTING & ADVENTURE ===
  {
    placeName: "Raceology Go-Karting",
    address: "Gachibowli",
    baseCost: 600,
    category: "adventure",
    coordinates: { lat: 17.4401, lng: 78.3628 },
    tags: ["adventure", "youth", "adrenaline"],
    ageRange: [14, 45],
    groupSize: [2, 8],
    timePreference: "any",
  },
  {
    placeName: "F9 Go Karting",
    address: "Kompally",
    baseCost: 550,
    category: "adventure",
    coordinates: { lat: 17.5476, lng: 78.4914 },
    tags: ["adventure", "youth", "competitive"],
    ageRange: [14, 45],
    groupSize: [2, 10],
    timePreference: "any",
  },
  {
    placeName: "iKart Racing Hyderabad",
    address: "Shamshabad",
    baseCost: 700,
    category: "adventure",
    coordinates: { lat: 17.2403, lng: 78.4294 },
    tags: ["adventure", "premium", "racing"],
    ageRange: [16, 50],
    groupSize: [2, 8],
    timePreference: "any",
  },
  {
    placeName: "Smaaash Hyderabad",
    address: "Inorbit Mall, Madhapur",
    baseCost: 800,
    category: "entertainment",
    coordinates: { lat: 17.4398, lng: 78.3908 },
    tags: ["gaming", "youth", "activity-center"],
    ageRange: [10, 40],
    groupSize: [2, 10],
    timePreference: "any",
  },
  {
    placeName: "Rush Adventure Park",
    address: "Kompally",
    baseCost: 500,
    category: "adventure",
    coordinates: { lat: 17.5450, lng: 78.4900 },
    tags: ["adventure", "family-friendly", "outdoor"],
    ageRange: [8, 50],
    groupSize: [2, 15],
    timePreference: "any",
  },
  {
    placeName: "Wild Waters Amusement Park",
    address: "Shamirpet",
    baseCost: 750,
    category: "adventure",
    coordinates: { lat: 17.5700, lng: 78.5500 },
    tags: ["water-park", "family-friendly", "summer"],
    ageRange: [5, 60],
    groupSize: [2, 12],
    timePreference: "any",
  },

  // === SPORTS TURFS & GAMING ===
  {
    placeName: "PlayOn Turf Gachibowli",
    address: "Gachibowli",
    baseCost: 400,
    category: "sports",
    coordinates: { lat: 17.4435, lng: 78.3487 },
    tags: ["sports", "youth", "football"],
    ageRange: [15, 40],
    groupSize: [6, 14],
    timePreference: "evening",
  },
  {
    placeName: "Turf Town Kukatpally",
    address: "Kukatpally",
    baseCost: 350,
    category: "sports",
    coordinates: { lat: 17.4926, lng: 78.3956 },
    tags: ["sports", "football", "cricket"],
    ageRange: [15, 45],
    groupSize: [6, 16],
    timePreference: "evening",
  },
  {
    placeName: "Box Cricket Gachibowli",
    address: "Gachibowli Stadium",
    baseCost: 500,
    category: "sports",
    coordinates: { lat: 17.4347, lng: 78.3494 },
    tags: ["sports", "youth", "cricket"],
    ageRange: [15, 45],
    groupSize: [6, 12],
    timePreference: "any",
  },
  {
    placeName: "Playo Badminton Arena",
    address: "Madhapur",
    baseCost: 300,
    category: "sports",
    coordinates: { lat: 17.4483, lng: 78.3915 },
    tags: ["sports", "indoor", "badminton"],
    ageRange: [12, 55],
    groupSize: [2, 8],
    timePreference: "any",
  },
  {
    placeName: "Timezone Arcade",
    address: "Forum Sujana Mall",
    baseCost: 400,
    category: "entertainment",
    coordinates: { lat: 17.4926, lng: 78.3956 },
    tags: ["gaming", "family-friendly", "arcade"],
    ageRange: [6, 40],
    groupSize: [2, 8],
    timePreference: "any",
  },
  {
    placeName: "Breakout Escape Rooms",
    address: "Banjara Hills",
    baseCost: 600,
    category: "entertainment",
    coordinates: { lat: 17.4239, lng: 78.4358 },
    tags: ["puzzle", "youth", "team-building"],
    ageRange: [15, 45],
    groupSize: [4, 8],
    timePreference: "any",
  },
  {
    placeName: "Virtual Reality Lounge",
    address: "GVK One Mall",
    baseCost: 500,
    category: "entertainment",
    coordinates: { lat: 17.4326, lng: 78.4071 },
    tags: ["vr", "youth", "tech"],
    ageRange: [12, 40],
    groupSize: [2, 6],
    timePreference: "any",
  },
  {
    placeName: "Amoeba Bowling Alley",
    address: "Inorbit Mall",
    baseCost: 350,
    category: "entertainment",
    coordinates: { lat: 17.4398, lng: 78.3908 },
    tags: ["bowling", "family-friendly", "indoor"],
    ageRange: [8, 60],
    groupSize: [2, 8],
    timePreference: "any",
  },

  // === ICONIC BIRYANI & LOCAL FOOD ===
  {
    placeName: "Paradise Biryani",
    address: "Multiple Locations",
    baseCost: 350,
    category: "food",
    coordinates: { lat: 17.4326, lng: 78.4071 },
    tags: ["iconic", "biryani", "local"],
    ageRange: [10, 70],
    groupSize: [2, 10],
    timePreference: "any",
  },
  {
    placeName: "Bawarchi Restaurant",
    address: "RTC X Roads",
    baseCost: 300,
    category: "food",
    coordinates: { lat: 17.4399, lng: 78.4983 },
    tags: ["biryani", "local", "famous"],
    ageRange: [10, 70],
    groupSize: [2, 8],
    timePreference: "any",
  },
  {
    placeName: "Shah Ghouse Cafe",
    address: "Tolichowki",
    baseCost: 320,
    category: "food",
    coordinates: { lat: 17.4008, lng: 78.4131 },
    tags: ["biryani", "local", "late-night"],
    ageRange: [12, 65],
    groupSize: [2, 10],
    timePreference: "any",
  },
  {
    placeName: "Shadab Restaurant",
    address: "Near Charminar, Old City",
    baseCost: 250,
    category: "food",
    coordinates: { lat: 17.3616, lng: 78.4747 },
    tags: ["old-city", "haleem", "traditional"],
    ageRange: [12, 70],
    groupSize: [2, 8],
    timePreference: "any",
  },
  {
    placeName: "Sarvi Restaurant",
    address: "Banjara Hills",
    baseCost: 400,
    category: "food",
    coordinates: { lat: 17.4185, lng: 78.4408 },
    tags: ["kebabs", "local", "popular"],
    ageRange: [15, 65],
    groupSize: [2, 8],
    timePreference: "any",
  },
  {
    placeName: "Nimrah Cafe & Bakery",
    address: "Near Charminar",
    baseCost: 150,
    category: "food",
    coordinates: { lat: 17.3616, lng: 78.4747 },
    tags: ["old-city", "chai", "bakery"],
    ageRange: [10, 70],
    groupSize: [2, 6],
    timePreference: "any",
  },
  {
    placeName: "Karachi Bakery",
    address: "Moazzam Jahi Market",
    baseCost: 200,
    category: "dessert",
    coordinates: { lat: 17.3948, lng: 78.4772 },
    tags: ["bakery", "iconic", "snacks"],
    ageRange: [5, 70],
    groupSize: [1, 8],
    timePreference: "any",
  },

  // === FINE DINING & UPSCALE ===
  {
    placeName: "Olive Bistro",
    address: "Road No 5, Banjara Hills",
    baseCost: 1200,
    category: "food",
    coordinates: { lat: 17.4239, lng: 78.4358 },
    tags: ["romantic", "premium", "italian"],
    ageRange: [25, 60],
    groupSize: [2, 6],
    timePreference: "evening",
  },
  {
    placeName: "Fisherman's Wharf",
    address: "Road No 45, Jubilee Hills",
    baseCost: 800,
    category: "food",
    coordinates: { lat: 17.4290, lng: 78.4125 },
    tags: ["seafood", "romantic", "coastal"],
    ageRange: [20, 60],
    groupSize: [2, 8],
    timePreference: "any",
  },
  {
    placeName: "Ohri's Gufaa",
    address: "GVK One Mall, Banjara Hills",
    baseCost: 900,
    category: "food",
    coordinates: { lat: 17.4326, lng: 78.4071 },
    tags: ["unique-ambiance", "cave-theme", "family-friendly"],
    ageRange: [10, 65],
    groupSize: [2, 10],
    timePreference: "any",
  },
  {
    placeName: "Farzi Cafe",
    address: "GVK One Mall",
    baseCost: 1000,
    category: "food",
    coordinates: { lat: 17.4326, lng: 78.4071 },
    tags: ["modern-indian", "youth", "trendy"],
    ageRange: [18, 45],
    groupSize: [2, 8],
    timePreference: "any",
  },
  {
    placeName: "Taj Falaknuma Palace - Adaa",
    address: "Engine Bowli, Falaknuma",
    baseCost: 3000,
    category: "food",
    coordinates: { lat: 17.3287, lng: 78.4632 },
    tags: ["luxury", "royal", "special-occasion"],
    ageRange: [25, 70],
    groupSize: [2, 8],
    timePreference: "evening",
  },
  {
    placeName: "Collage - Hyatt Hyderabad",
    address: "Hitech City",
    baseCost: 1500,
    category: "food",
    coordinates: { lat: 17.4239, lng: 78.3908 },
    tags: ["buffet", "premium", "multicuisine"],
    ageRange: [15, 70],
    groupSize: [2, 10],
    timePreference: "any",
  },
  {
    placeName: "Chutneys Restaurant",
    address: "Road No 10, Banjara Hills",
    baseCost: 350,
    category: "food",
    coordinates: { lat: 17.4185, lng: 78.4408 },
    tags: ["south-indian", "family-friendly", "breakfast"],
    ageRange: [10, 70],
    groupSize: [2, 10],
    timePreference: "morning",
  },

  // === CAFES & CASUAL DINING ===
  {
    placeName: "Lamakaan",
    address: "Road No 1, Banjara Hills",
    baseCost: 250,
    category: "drinks",
    coordinates: { lat: 17.4239, lng: 78.4358 },
    tags: ["cultural", "art", "conversation"],
    ageRange: [18, 50],
    groupSize: [2, 10],
    timePreference: "any",
  },
  {
    placeName: "Roastery Coffee House",
    address: "Film Nagar",
    baseCost: 300,
    category: "drinks",
    coordinates: { lat: 17.4142, lng: 78.4093 },
    tags: ["coffee", "work-friendly", "cozy"],
    ageRange: [18, 55],
    groupSize: [1, 6],
    timePreference: "any",
  },
  {
    placeName: "Autumn Leaf Cafe",
    address: "Jubilee Hills",
    baseCost: 400,
    category: "drinks",
    coordinates: { lat: 17.4312, lng: 78.4095 },
    tags: ["instagrammable", "youth", "coffee"],
    ageRange: [16, 40],
    groupSize: [2, 6],
    timePreference: "any",
  },
  {
    placeName: "Tabula Rasa",
    address: "Jubilee Hills",
    baseCost: 350,
    category: "drinks",
    coordinates: { lat: 17.4312, lng: 78.4095 },
    tags: ["books", "quiet", "coffee"],
    ageRange: [18, 50],
    groupSize: [1, 4],
    timePreference: "any",
  },
  {
    placeName: "Heart Cup Coffee",
    address: "Banjara Hills",
    baseCost: 250,
    category: "drinks",
    coordinates: { lat: 17.4217, lng: 78.4431 },
    tags: ["coffee", "cozy", "casual"],
    ageRange: [16, 50],
    groupSize: [2, 6],
    timePreference: "any",
  },
  {
    placeName: "Cafe Bahar",
    address: "Basheerbagh",
    baseCost: 300,
    category: "food",
    coordinates: { lat: 17.4036, lng: 78.4772 },
    tags: ["irani-chai", "traditional", "local"],
    ageRange: [15, 70],
    groupSize: [2, 8],
    timePreference: "any",
  },
  {
    placeName: "Eat Street Food Court",
    address: "Inorbit Mall, Madhapur",
    baseCost: 400,
    category: "food",
    coordinates: { lat: 17.4398, lng: 78.3908 },
    tags: ["variety", "casual", "mall-food"],
    ageRange: [10, 60],
    groupSize: [2, 10],
    timePreference: "any",
  },

  // === DESSERTS & ICE CREAM ===
  {
    placeName: "Cream Stone Ice Cream",
    address: "Multiple Locations",
    baseCost: 200,
    category: "dessert",
    coordinates: { lat: 17.4217, lng: 78.4431 },
    tags: ["ice-cream", "youth", "trendy"],
    ageRange: [5, 50],
    groupSize: [2, 8],
    timePreference: "any",
  },
  {
    placeName: "Häagen-Dazs",
    address: "GVK One Mall",
    baseCost: 400,
    category: "dessert",
    coordinates: { lat: 17.4326, lng: 78.4071 },
    tags: ["premium", "ice-cream", "date-spot"],
    ageRange: [10, 60],
    groupSize: [2, 6],
    timePreference: "any",
  },
  {
    placeName: "Concu Ice Cream",
    address: "Jubilee Hills",
    baseCost: 250,
    category: "dessert",
    coordinates: { lat: 17.4312, lng: 78.4095 },
    tags: ["artisan", "ice-cream", "unique-flavors"],
    ageRange: [8, 60],
    groupSize: [2, 6],
    timePreference: "any",
  },
  {
    placeName: "Over the Moon Desserts",
    address: "Banjara Hills",
    baseCost: 300,
    category: "dessert",
    coordinates: { lat: 17.4217, lng: 78.4431 },
    tags: ["desserts", "instagram", "youth"],
    ageRange: [12, 45],
    groupSize: [2, 6],
    timePreference: "any",
  },
  {
    placeName: "Almond House Sweets",
    address: "Multiple Locations",
    baseCost: 150,
    category: "dessert",
    coordinates: { lat: 17.4239, lng: 78.4358 },
    tags: ["traditional", "sweets", "local"],
    ageRange: [5, 75],
    groupSize: [2, 10],
    timePreference: "any",
  },

  // === NIGHTLIFE & BARS ===
  {
    placeName: "Social Jubilee Hills",
    address: "Road No 36, Jubilee Hills",
    baseCost: 800,
    category: "nightlife",
    coordinates: { lat: 17.4312, lng: 78.4095 },
    tags: ["youth", "trendy", "drinks"],
    ageRange: [21, 45],
    groupSize: [2, 10],
    timePreference: "night",
  },
  {
    placeName: "Prost Brewery",
    address: "Financial District, Gachibowli",
    baseCost: 900,
    category: "nightlife",
    coordinates: { lat: 17.4167, lng: 78.3450 },
    tags: ["brewery", "youth", "microbrewery"],
    ageRange: [21, 50],
    groupSize: [2, 12],
    timePreference: "evening",
  },
  {
    placeName: "Prism Pub & Brewery",
    address: "Jubilee Hills",
    baseCost: 1000,
    category: "nightlife",
    coordinates: { lat: 17.4312, lng: 78.4095 },
    tags: ["club", "dancing", "young-crowd"],
    ageRange: [21, 35],
    groupSize: [2, 10],
    timePreference: "night",
  },
  {
    placeName: "10 Downing Street",
    address: "Banjara Hills",
    baseCost: 1200,
    category: "nightlife",
    coordinates: { lat: 17.4239, lng: 78.4358 },
    tags: ["upscale", "pub", "expat-favorite"],
    ageRange: [25, 55],
    groupSize: [2, 8],
    timePreference: "night",
  },
  {
    placeName: "Hard Rock Cafe",
    address: "Hitec City",
    baseCost: 1500,
    category: "nightlife",
    coordinates: { lat: 17.4398, lng: 78.3908 },
    tags: ["international", "music", "premium"],
    ageRange: [21, 50],
    groupSize: [2, 10],
    timePreference: "evening",
  },
  {
    placeName: "Playboy Club Hyderabad",
    address: "Banjara Hills",
    baseCost: 2000,
    category: "nightlife",
    coordinates: { lat: 17.4239, lng: 78.4358 },
    tags: ["luxury", "exclusive", "upscale"],
    ageRange: [25, 50],
    groupSize: [2, 8],
    timePreference: "night",
  },
  {
    placeName: "B-Dubs Bar & Grill",
    address: "Madhapur",
    baseCost: 700,
    category: "nightlife",
    coordinates: { lat: 17.4483, lng: 78.3915 },
    tags: ["sports-bar", "casual", "wings"],
    ageRange: [21, 45],
    groupSize: [2, 12],
    timePreference: "evening",
  },

  // === UNIQUE EXPERIENCES ===
  {
    placeName: "Ramoji Film City",
    address: "Abdullahpurmet",
    baseCost: 1500,
    category: "entertainment",
    coordinates: { lat: 17.2543, lng: 78.6808 },
    tags: ["theme-park", "family-friendly", "full-day"],
    ageRange: [5, 70],
    groupSize: [2, 20],
    timePreference: "morning",
  },
  {
    placeName: "Snow World",
    address: "Lower Tank Bund",
    baseCost: 650,
    category: "entertainment",
    coordinates: { lat: 17.4125, lng: 78.4683 },
    tags: ["unique", "kids", "indoor"],
    ageRange: [5, 50],
    groupSize: [2, 10],
    timePreference: "any",
  },
  {
    placeName: "Birla Planetarium",
    address: "Naubat Pahad",
    baseCost: 100,
    category: "cultural",
    coordinates: { lat: 17.4062, lng: 78.4691 },
    tags: ["educational", "space", "kids"],
    ageRange: [8, 60],
    groupSize: [2, 15],
    timePreference: "any",
  },
  {
    placeName: "Wonderla Amusement Park",
    address: "Raviryal Village",
    baseCost: 1200,
    category: "adventure",
    coordinates: { lat: 17.3167, lng: 78.1833 },
    tags: ["theme-park", "family-friendly", "full-day"],
    ageRange: [5, 60],
    groupSize: [2, 15],
    timePreference: "morning",
  },
  {
    placeName: "Jalavihar Water Park",
    address: "Necklace Road",
    baseCost: 400,
    category: "adventure",
    coordinates: { lat: 17.4125, lng: 78.4683 },
    tags: ["water-park", "family-friendly", "summer"],
    ageRange: [5, 55],
    groupSize: [2, 12],
    timePreference: "afternoon",
  },
  {
    placeName: "Shilparamam Cultural Village",
    address: "Madhapur",
    baseCost: 50,
    category: "cultural",
    coordinates: { lat: 17.4483, lng: 78.3915 },
    tags: ["crafts", "traditional", "family-friendly"],
    ageRange: [8, 70],
    groupSize: [2, 15],
    timePreference: "any",
  },
  {
    placeName: "Sudha Cars Museum",
    address: "Bahadurpura",
    baseCost: 50,
    category: "cultural",
    coordinates: { lat: 17.3500, lng: 78.4513 },
    tags: ["quirky", "unique", "photography"],
    ageRange: [10, 60],
    groupSize: [2, 10],
    timePreference: "any",
  },
];

// Extract user context from intent
function extractUserContext(intent: string): UserContext {
  const lower = intent.toLowerCase();
  
  // Extract group size
  const groupMatch = lower.match(/(?:for\s+)?(\d+)\s*(?:people|ppl|persons|folks|friends)/);
  const groupSize = groupMatch ? parseInt(groupMatch[1]) : 2;
  
  // Extract age
  const ageMatch = lower.match(/age\s*(?:group|grp)?\s*(?:of|is)?\s*(\d+)/);
  const ageGroup = ageMatch ? parseInt(ageMatch[1]) : 25;
  
  // Extract budget
  const budgetMatch = intent.match(/₹?\s*(\d+)/);
  const totalBudget = budgetMatch ? parseInt(budgetMatch[1]) : 1500;
  const budget = groupSize > 1 ? Math.floor(totalBudget / groupSize) : totalBudget;
  
  // Extract start time
  const timeMatch = intent.match(/(\d{1,2})\s*(am|pm|AM|PM)/);
  const startTime = timeMatch ? `${timeMatch[1]}:00 ${timeMatch[2].toUpperCase()}` : "7:00 PM";
  
  // Extract occasion
  let occasion = "friends";
  if (lower.includes("date") || lower.includes("romantic") || lower.includes("couple")) {
    occasion = "date";
  } else if (lower.includes("family") || lower.includes("kids") || lower.includes("children")) {
    occasion = "family";
  } else if (lower.includes("solo") || lower.includes("alone")) {
    occasion = "solo";
  }
  
  // Check if wants food
  const wantsFood = lower.includes("food") || lower.includes("eat") || lower.includes("dinner") || 
                    lower.includes("lunch") || lower.includes("breakfast") || lower.includes("biryani");
  
  return { budget, startTime, occasion, groupSize, ageGroup, wantsFood };
}

// Smart filtering based on context
function filterPlacesByContext(places: Place[], context: UserContext): Place[] {
  return places.filter(place => {
    // Budget check
    if (place.baseCost > context.budget / 2) return false;
    
    // Age range check
    if (context.ageGroup < place.ageRange[0] || context.ageGroup > place.ageRange[1]) return false;
    
    // Group size check
    if (context.groupSize < place.groupSize[0] || context.groupSize > place.groupSize[1]) return false;
    
    // Occasion-based tags
    if (context.occasion === "date" && !place.tags.includes("romantic") && place.category === "nightlife") {
      return place.tags.includes("upscale");
    }
    if (context.occasion === "family" && place.category === "nightlife") return false;
    
    return true;
  });
}

// Calculate travel time between two coordinates
function calculateTravelTime(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): string {
  const R = 6371;
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((from.lat * Math.PI) / 180) *
      Math.cos((to.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  const travelMinutes = Math.round((distance / 30) * 60);
  return travelMinutes === 0 ? "0 min" : `${travelMinutes} min`;
}

// Add time to a time string
function addMinutes(timeStr: string, minutes: number): string {
  const [time, period] = timeStr.split(" ");
  const [hours, mins] = time.split(":").map(Number);
  
  let hour24 = hours;
  if (period === "AM" && hours === 12) {
    hour24 = 0;
  } else if (period === "PM" && hours !== 12) {
    hour24 = hours + 12;
  }
  
  let totalMinutes = hour24 * 60 + mins + minutes;
  
  while (totalMinutes >= 24 * 60) totalMinutes -= 24 * 60;
  while (totalMinutes < 0) totalMinutes += 24 * 60;
  
  let newHours = Math.floor(totalMinutes / 60);
  let newMins = totalMinutes % 60;
  let newPeriod = newHours >= 12 ? "PM" : "AM";
  
  if (newHours === 0) newHours = 12;
  else if (newHours > 12) newHours -= 12;
  
  return `${newHours}:${newMins.toString().padStart(2, "0")} ${newPeriod}`;
}

// Generate context-aware reasoning
function generateReasoning(place: Place, context: UserContext, isFirst: boolean, isLast: boolean): string {
  if (isFirst) {
    if (place.category === "nature") return "Perfect scenic start for the evening";
    if (place.category === "cultural") return "Rich cultural experience to begin with";
    if (place.category === "adventure") return "Adrenaline-pumping start to your day";
  }
  
  if (isLast) {
    if (place.category === "food") return "Delicious finale within your budget";
    if (place.category === "dessert") return "Sweet ending to a great outing";
    if (place.category === "nightlife") return "Perfect nightcap for the group";
  }
  
  if (context.occasion === "date" && place.tags.includes("romantic")) {
    return "Intimate ambiance, perfect for couples";
  }
  
  if (context.ageGroup < 25 && place.tags.includes("youth")) {
    return "Trendy spot popular with your age group";
  }
  
  if (context.ageGroup >= 40 && place.tags.includes("family-friendly")) {
    return "Comfortable setting, great reviews";
  }
  
  return "Highly rated, fits your preferences";
}

// Main generator function
export function generateMockItinerary(userIntent: string): MockItineraryStop[] {
  const context = extractUserContext(userIntent);
  const affordablePlaces = filterPlacesByContext(HYDERABAD_PLACES, context);
  
  if (affordablePlaces.length === 0) {
    // Fallback to basic places if filtering is too strict
    return generateBasicItinerary(context);
  }
  
  let selectedPlaces: Place[] = [];
  let totalCost = 0;
  
  // Strategy: Pick diverse categories
  const categories = context.wantsFood 
    ? ["activity", "food", "dessert"]
    : ["activity", "entertainment", "food"];
  
  for (const category of categories) {
    const candidate = affordablePlaces.find(
      p => p.category === category && 
      !selectedPlaces.includes(p) && 
      totalCost + p.baseCost <= context.budget
    );
    
    if (candidate) {
      selectedPlaces.push(candidate);
      totalCost += candidate.baseCost;
    }
  }
  
  // Fill remaining slots
  while (selectedPlaces.length < 3 && selectedPlaces.length < affordablePlaces.length) {
    const remaining = affordablePlaces.find(
      p => !selectedPlaces.includes(p) && totalCost + p.baseCost <= context.budget
    );
    if (remaining) {
      selectedPlaces.push(remaining);
      totalCost += remaining.baseCost;
    } else {
      break;
    }
  }
  
  // Build itinerary with times and travel
  let currentTime = context.startTime;
  const itinerary: MockItineraryStop[] = selectedPlaces.map((place, index) => {
    const travelTime = index === 0
      ? "0 min"
      : calculateTravelTime(selectedPlaces[index - 1].coordinates, place.coordinates);
    
    const travelMinutes = parseInt(travelTime) || 0;
    
    let visitDuration = 45;
    if (place.category === "activity") visitDuration = 60;
    else if (place.category === "food") visitDuration = 60;
    else if (place.category === "adventure") visitDuration = 90;
    else if (place.category === "dessert") visitDuration = 25;
    
    if (index > 0) {
      currentTime = addMinutes(currentTime, travelMinutes + visitDuration);
    }
    
    return {
      placeName: place.placeName,
      address: place.address,
      time: currentTime,
      estimatedCost: place.baseCost,
      travelTimeFromPrevious: travelTime,
      reasoning: generateReasoning(place, context, index === 0, index === selectedPlaces.length - 1),
    };
  });
  
  return itinerary;
}

// Fallback basic itinerary
function generateBasicItinerary(context: UserContext): MockItineraryStop[] {
  const basic: Place[] = [
    HYDERABAD_PLACES.find(p => p.placeName === "Hussain Sagar Lakeside")!,
    HYDERABAD_PLACES.find(p => p.placeName === "Paradise Biryani")!,
    HYDERABAD_PLACES.find(p => p.placeName === "Cream Stone Ice Cream")!,
  ];
  
  let currentTime = context.startTime;
  return basic.map((place, index) => {
    const travelTime = index === 0 ? "0 min" : "15 min";
    if (index > 0) currentTime = addMinutes(currentTime, 75);
    
    return {
      placeName: place.placeName,
      address: place.address,
      time: currentTime,
      estimatedCost: place.baseCost,
      travelTimeFromPrevious: travelTime,
      reasoning: "Popular choice in Hyderabad",
    };
  });
}
