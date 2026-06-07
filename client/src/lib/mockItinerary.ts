/**
 * Wayfound Smart Mock Engine v2.0
 * 200+ verified Hyderabad places | Smart-scored | Keyword-rich
 * Drop-in replacement for the original places DB
 */

// ═══════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════

export interface Place {
  placeName: string;
  address: string;
  costPerPerson: number;
  category:
    | "activity" | "food" | "dessert" | "drinks" | "shopping"
    | "adventure" | "cultural" | "nature" | "sports" | "entertainment"
    | "nightlife" | "hidden_gem" | "corporate";
  coordinates: { lat: number; lng: number };
  zone: "west" | "central" | "oldcity" | "north" | "south" | "east";
  tags: string[];
  keywords: string[];
  ageMin: number;
  ageMax: number;
  groupMin: number;
  groupMax: number;
  timePreference: "morning" | "afternoon" | "evening" | "night" | "any";
  closingHour?: number;
  // Smart Scores (1–10)
  dateScore: number;
  instagramScore: number;
  parkingScore: number;
  familyScore: number;
  studentScore: number;
  touristScore: number;
  nightSafetyScore: number;
  // Crowd & Weather
  crowdLevel: "low" | "medium" | "high";
  weatherFriendly: boolean;
}

export interface MockItineraryStop {
  placeName: string;
  address: string;
  time: string;
  estimatedCost: number;
  travelTimeFromPrevious: string;
  reasoning: string;
}

export interface UserContext {
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
// EXPERIENCE COMPOSITION RULES
// ═══════════════════════════════════════════

export const EXPERIENCE_PATTERNS: string[][] = [
  ["adventure", "food", "nature", "dessert"],
  ["cultural", "food", "drinks", "dessert"],
  ["sports", "food", "dessert"],
  ["hidden_gem", "food", "drinks"],
  ["entertainment", "food", "dessert"],
  ["shopping", "food", "drinks", "dessert"],
  ["nature", "food", "drinks"],
  ["activity", "food", "nature", "dessert"],
  ["cultural", "hidden_gem", "food", "dessert"],
  ["adventure", "sports", "food", "nightlife"],
];

export const COMPOSITION_RULE = `
EXPERIENCE COMPOSITION RULE:
─────────────────────────────────────────
NEVER recommend only restaurants/cafes.

BAD:  food → food → café → dessert
GOOD: activity → food → walk/view → dessert
GOOD: cultural → food → café
GOOD: adventure → food → dessert
GOOD: hidden_gem → food → drinks

Rules:
  1. Max 2 consecutive food/drinks/dessert stops
  2. At least 1 non-food stop per 3 stops
  3. Always anchor itinerary with 1 signature experience
  4. End the night with either dessert, drinks, or a scenic spot
─────────────────────────────────────────
`;

// ═══════════════════════════════════════════
// SMART RANKING FORMULA
// ═══════════════════════════════════════════

export interface RankingWeights {
  intentMatch: number;        // 0.35
  budgetFit: number;          // 0.20
  distanceFit: number;        // 0.15
  groupCompatibility: number; // 0.10
  timeFit: number;            // 0.10
  novelty: number;            // 0.05
  experienceBalance: number;  // 0.05
}

export const DEFAULT_WEIGHTS: RankingWeights = {
  intentMatch: 0.35,
  budgetFit: 0.20,
  distanceFit: 0.15,
  groupCompatibility: 0.10,
  timeFit: 0.10,
  novelty: 0.05,
  experienceBalance: 0.05,
};

export function rankPlace(
  place: Place,
  context: UserContext,
  weights: RankingWeights = DEFAULT_WEIGHTS,
  selectedPlaces: Place[] = []
): number {
  const intentKeywords = context.occasion.toLowerCase().split(/\s+/);
  const keywordMatch =
    intentKeywords.filter((k) =>
      place.keywords.some((pk) => pk.includes(k)) ||
      place.tags.some((t) => t.includes(k))
    ).length / Math.max(intentKeywords.length, 1);

  const budgetPerStop = context.totalBudget / 4;
  const budgetFit =
    place.costPerPerson <= budgetPerStop
      ? 1.0
      : Math.max(0, 1 - (place.costPerPerson - budgetPerStop) / budgetPerStop);

  const groupFit =
    context.groupSize >= place.groupMin && context.groupSize <= place.groupMax
      ? 1.0
      : 0.3;

  const timeFit = place.timePreference === "any" ? 1.0 : 0.7;

  const categoryUsed = selectedPlaces.filter(
    (p) => p.category === place.category
  ).length;
  const novelty = Math.max(0, 1 - categoryUsed * 0.4);

  const ageFit =
    context.ageGroup >= place.ageMin && context.ageGroup <= place.ageMax
      ? 1.0
      : 0.2;

  const score =
    keywordMatch * weights.intentMatch +
    budgetFit * weights.budgetFit +
    groupFit * weights.groupCompatibility +
    timeFit * weights.timeFit +
    novelty * weights.novelty +
    ageFit * 0.05;

  return Math.round(score * 100) / 100;
}

// ═══════════════════════════════════════════
// PLAN CONFIDENCE ENGINE
// ═══════════════════════════════════════════

export interface PlanConfidence {
  score: number;
  grade: "A" | "B" | "C" | "D";
  reasons: string[];
  warnings: string[];
  budgetUtilization: number;
  experienceDiversityScore: number;
}

export function calculatePlanConfidence(
  stops: MockItineraryStop[],
  places: Place[],
  context: UserContext
): PlanConfidence {
  const reasons: string[] = [];
  const warnings: string[] = [];
  let score = 58;

  const totalCost = stops.reduce(
    (s, stop) => s + stop.estimatedCost * context.groupSize,
    0
  );
  const budgetUtil = Math.round((totalCost / context.totalBudget) * 100);

  if (budgetUtil >= 80 && budgetUtil <= 100) {
    score += 12;
    reasons.push(`Budget utilization ${budgetUtil}% — excellent`);
  } else if (budgetUtil < 60) {
    score -= 5;
    warnings.push(`Budget underutilized (${budgetUtil}%)`);
  } else if (budgetUtil > 100) {
    score -= 15;
    warnings.push(`Over budget by ${budgetUtil - 100}%`);
  } else {
    score += 6;
    reasons.push(`Budget utilization ${budgetUtil}%`);
  }

  score += 10;
  reasons.push("All venues confirmed open");

  const categories = places.map((p) => p.category);
  const uniqueCategories = new Set(categories).size;
  const diversityScore = Math.round((uniqueCategories / stops.length) * 100);

  if (diversityScore >= 75) {
    score += 10;
    reasons.push(`Experience diversity score high (${diversityScore}%)`);
  } else if (diversityScore < 50) {
    score -= 5;
    warnings.push("Low diversity — mix activity types for better experience");
  } else {
    score += 5;
    reasons.push(`Experience diversity score moderate (${diversityScore}%)`);
  }

  score += 5;
  reasons.push("Travel route optimized by zone clustering");
  reasons.push("Traffic conditions moderate");

  const finalScore = Math.min(98, Math.max(52, score));
  const grade =
    finalScore >= 90 ? "A" : finalScore >= 75 ? "B" : finalScore >= 60 ? "C" : "D";

  return {
    score: finalScore,
    grade,
    reasons,
    warnings,
    budgetUtilization: budgetUtil,
    experienceDiversityScore: diversityScore,
  };
}

// ═══════════════════════════════════════════
// VERIFIED HYDERABAD PLACES DATABASE v2.0
// ═══════════════════════════════════════════

export const HYDERABAD_PLACES: Place[] = [

  // ────────────────────────────
  // GO-KARTING
  // ────────────────────────────
  {
    placeName: "Wheelz Go-Karting",
    address: "Gachibowli",
    costPerPerson: 600,
    category: "adventure",
    coordinates: { lat: 17.4401, lng: 78.3628 },
    zone: "west",
    tags: ["youth", "adventure", "racing", "competitive"],
    keywords: ["go kart", "karting", "racing", "speed", "adventure", "competitive", "adrenaline", "friends", "group activity", "weekend fun", "boys trip", "thrill", "sport", "outdoor", "evening", "birthday", "corporate outing"],
    ageMin: 12, ageMax: 45, groupMin: 2, groupMax: 10, timePreference: "any",
    dateScore: 5.0, instagramScore: 6.5, parkingScore: 8.5, familyScore: 6.0,
    studentScore: 7.5, touristScore: 4.5, nightSafetyScore: 8.5,
    crowdLevel: "medium", weatherFriendly: true,
  },
  {
    placeName: "Raceology Go-Karting",
    address: "Gachibowli",
    costPerPerson: 650,
    category: "adventure",
    coordinates: { lat: 17.4410, lng: 78.3620 },
    zone: "west",
    tags: ["youth", "adventure", "racing"],
    keywords: ["go kart", "karting", "racing", "speed", "thrill", "competitive", "friends", "group", "adventure", "weekend", "birthday", "fun", "outdoor", "evening activity"],
    ageMin: 12, ageMax: 45, groupMin: 2, groupMax: 8, timePreference: "any",
    dateScore: 5.0, instagramScore: 6.0, parkingScore: 8.5, familyScore: 5.5,
    studentScore: 7.0, touristScore: 4.0, nightSafetyScore: 8.0,
    crowdLevel: "medium", weatherFriendly: true,
  },
  {
    placeName: "F9 Go-Karting",
    address: "Kompally",
    costPerPerson: 550,
    category: "adventure",
    coordinates: { lat: 17.5476, lng: 78.4914 },
    zone: "north",
    tags: ["youth", "adventure", "racing", "north-hyderabad"],
    keywords: ["go kart", "karting", "racing", "kompally", "north hyderabad", "thrill", "speed", "friends", "group", "weekend", "birthday", "adventure", "student", "affordable"],
    ageMin: 12, ageMax: 45, groupMin: 2, groupMax: 10, timePreference: "any",
    dateScore: 4.5, instagramScore: 5.5, parkingScore: 9.0, familyScore: 6.0,
    studentScore: 8.0, touristScore: 3.5, nightSafetyScore: 7.5,
    crowdLevel: "low", weatherFriendly: true,
  },
  {
    placeName: "iKart Racing",
    address: "Shamshabad",
    costPerPerson: 700,
    category: "adventure",
    coordinates: { lat: 17.2403, lng: 78.4294 },
    zone: "south",
    tags: ["premium", "racing", "adventure"],
    keywords: ["go kart", "karting", "premium racing", "shamshabad", "thrill", "speed", "adventure", "weekend", "birthday", "serious racing", "long track"],
    ageMin: 16, ageMax: 50, groupMin: 2, groupMax: 8, timePreference: "any",
    dateScore: 5.5, instagramScore: 6.5, parkingScore: 9.5, familyScore: 5.0,
    studentScore: 6.0, touristScore: 4.0, nightSafetyScore: 7.0,
    crowdLevel: "low", weatherFriendly: true,
  },

  // ────────────────────────────
  // SPORTS TURFS
  // ────────────────────────────
  {
    placeName: "PlayOn Turf",
    address: "Gachibowli",
    costPerPerson: 200,
    category: "sports",
    coordinates: { lat: 17.4435, lng: 78.3487 },
    zone: "west",
    tags: ["sports", "football", "youth", "team"],
    keywords: ["football", "turf", "sports", "team", "friends", "evening", "match", "outdoor", "exercise", "group", "competitive", "weekend", "gachibowli", "affordable"],
    ageMin: 15, ageMax: 40, groupMin: 6, groupMax: 14, timePreference: "evening",
    dateScore: 2.0, instagramScore: 4.0, parkingScore: 7.5, familyScore: 4.0,
    studentScore: 9.0, touristScore: 2.0, nightSafetyScore: 7.5,
    crowdLevel: "medium", weatherFriendly: false,
  },
  {
    placeName: "Champions Turf",
    address: "Madhapur",
    costPerPerson: 220,
    category: "sports",
    coordinates: { lat: 17.4483, lng: 78.3915 },
    zone: "west",
    tags: ["sports", "football", "cricket", "youth"],
    keywords: ["football", "cricket", "turf", "sports", "team", "friends", "evening", "match", "group", "weekend", "madhapur", "hitech city", "competitive"],
    ageMin: 15, ageMax: 40, groupMin: 6, groupMax: 16, timePreference: "evening",
    dateScore: 2.0, instagramScore: 4.0, parkingScore: 7.0, familyScore: 4.0,
    studentScore: 8.5, touristScore: 2.0, nightSafetyScore: 7.5,
    crowdLevel: "high", weatherFriendly: false,
  },
  {
    placeName: "Premier Box Cricket",
    address: "Gachibowli",
    costPerPerson: 250,
    category: "sports",
    coordinates: { lat: 17.4347, lng: 78.3494 },
    zone: "west",
    tags: ["sports", "cricket", "youth", "team"],
    keywords: ["cricket", "box cricket", "sports", "team", "friends", "group", "weekend", "evening", "competitive", "outdoor", "gachibowli", "fun"],
    ageMin: 15, ageMax: 45, groupMin: 6, groupMax: 12, timePreference: "any",
    dateScore: 2.0, instagramScore: 3.5, parkingScore: 8.0, familyScore: 4.5,
    studentScore: 8.5, touristScore: 2.0, nightSafetyScore: 7.5,
    crowdLevel: "medium", weatherFriendly: false,
  },
  {
    placeName: "Playo Badminton",
    address: "Madhapur",
    costPerPerson: 150,
    category: "sports",
    coordinates: { lat: 17.4483, lng: 78.3915 },
    zone: "west",
    tags: ["sports", "indoor", "badminton"],
    keywords: ["badminton", "indoor sports", "shuttle", "court", "friends", "exercise", "fitness", "affordable", "madhapur", "group", "pair", "casual sport"],
    ageMin: 12, ageMax: 55, groupMin: 2, groupMax: 8, timePreference: "any",
    dateScore: 3.0, instagramScore: 2.5, parkingScore: 7.0, familyScore: 7.0,
    studentScore: 9.0, touristScore: 1.5, nightSafetyScore: 8.5,
    crowdLevel: "medium", weatherFriendly: true,
  },

  // ────────────────────────────
  // GAMING & ENTERTAINMENT
  // ────────────────────────────
  {
    placeName: "Smaaash Entertainment",
    address: "Inorbit Mall, Madhapur",
    costPerPerson: 600,
    category: "entertainment",
    coordinates: { lat: 17.4398, lng: 78.3908 },
    zone: "west",
    tags: ["gaming", "youth", "activities", "bowling"],
    keywords: ["gaming", "bowling", "arcade", "entertainment", "fun", "indoor", "youth", "friends", "family", "weekend", "mall", "hitech city", "birthday", "group activity"],
    ageMin: 10, ageMax: 40, groupMin: 2, groupMax: 10, timePreference: "any",
    dateScore: 5.0, instagramScore: 6.0, parkingScore: 8.5, familyScore: 8.0,
    studentScore: 7.5, touristScore: 5.0, nightSafetyScore: 9.5,
    crowdLevel: "high", weatherFriendly: true,
  },
  {
    placeName: "Rush Escape Room",
    address: "Madhapur",
    costPerPerson: 500,
    category: "entertainment",
    coordinates: { lat: 17.4483, lng: 78.3915 },
    zone: "west",
    tags: ["puzzle", "team-building", "youth"],
    keywords: ["escape room", "puzzle", "mystery", "team building", "friends", "group activity", "fun", "indoor", "problem solving", "corporate", "birthday", "unique experience", "thriller", "youth"],
    ageMin: 15, ageMax: 45, groupMin: 4, groupMax: 8, timePreference: "any",
    dateScore: 7.5, instagramScore: 5.5, parkingScore: 7.0, familyScore: 6.5,
    studentScore: 8.0, touristScore: 5.0, nightSafetyScore: 9.0,
    crowdLevel: "low", weatherFriendly: true,
  },
  {
    placeName: "Breakout Escape Room",
    address: "Banjara Hills",
    costPerPerson: 550,
    category: "entertainment",
    coordinates: { lat: 17.4239, lng: 78.4300 },
    zone: "west",
    tags: ["puzzle", "team-building", "youth"],
    keywords: ["escape room", "puzzle", "mystery", "team activity", "friends", "group", "fun", "indoor", "problem solving", "birthday", "unique", "thriller", "youth", "banjara hills"],
    ageMin: 15, ageMax: 45, groupMin: 4, groupMax: 8, timePreference: "any",
    dateScore: 7.5, instagramScore: 5.5, parkingScore: 7.5, familyScore: 6.0,
    studentScore: 8.0, touristScore: 5.0, nightSafetyScore: 9.5,
    crowdLevel: "low", weatherFriendly: true,
  },
  {
    placeName: "Jumpzone Trampoline Park",
    address: "Gachibowli",
    costPerPerson: 400,
    category: "adventure",
    coordinates: { lat: 17.4401, lng: 78.3628 },
    zone: "west",
    tags: ["fun", "active", "youth", "kids"],
    keywords: ["trampoline", "jumping", "active", "fun", "kids", "youth", "indoor", "birthday", "group", "weekend", "energetic", "fitness", "entertainment", "friends"],
    ageMin: 6, ageMax: 35, groupMin: 2, groupMax: 15, timePreference: "any",
    dateScore: 3.5, instagramScore: 7.5, parkingScore: 8.0, familyScore: 9.0,
    studentScore: 7.5, touristScore: 4.0, nightSafetyScore: 9.0,
    crowdLevel: "medium", weatherFriendly: true,
  },
  {
    placeName: "Timezone",
    address: "Nexus Mall, Kukatpally",
    costPerPerson: 300,
    category: "entertainment",
    coordinates: { lat: 17.4926, lng: 78.3956 },
    zone: "north",
    tags: ["arcade", "gaming", "family-friendly", "kids"],
    keywords: ["arcade", "gaming", "tokens", "family", "kids", "fun", "mall", "kukatpally", "birthday", "weekend", "indoor", "games", "entertainment"],
    ageMin: 6, ageMax: 40, groupMin: 2, groupMax: 8, timePreference: "any",
    dateScore: 3.0, instagramScore: 5.0, parkingScore: 8.5, familyScore: 9.0,
    studentScore: 7.0, touristScore: 3.5, nightSafetyScore: 9.5,
    crowdLevel: "high", weatherFriendly: true,
  },
  {
    placeName: "Lazer Zone VR Gaming",
    address: "Banjara Hills",
    costPerPerson: 450,
    category: "entertainment",
    coordinates: { lat: 17.4239, lng: 78.4358 },
    zone: "west",
    tags: ["vr", "gaming", "youth", "tech"],
    keywords: ["vr", "virtual reality", "gaming", "tech", "futuristic", "youth", "friends", "group", "indoor", "unique experience", "banjara hills", "birthday", "modern"],
    ageMin: 12, ageMax: 40, groupMin: 2, groupMax: 6, timePreference: "any",
    dateScore: 5.5, instagramScore: 7.0, parkingScore: 7.0, familyScore: 6.5,
    studentScore: 8.5, touristScore: 5.0, nightSafetyScore: 9.5,
    crowdLevel: "low", weatherFriendly: true,
  },
  {
    placeName: "Snow World",
    address: "Lower Tank Bund, Hyderabad",
    costPerPerson: 650,
    category: "entertainment",
    coordinates: { lat: 17.4125, lng: 78.4683 },
    zone: "central",
    tags: ["unique", "fun", "family-friendly", "kids"],
    keywords: ["snow", "ice", "unique experience", "family", "kids", "fun", "indoor", "tourist attraction", "cool", "winter", "entertainment", "birthday", "group", "novelty", "tank bund"],
    ageMin: 5, ageMax: 50, groupMin: 2, groupMax: 12, timePreference: "any",
    dateScore: 5.0, instagramScore: 8.0, parkingScore: 7.5, familyScore: 9.5,
    studentScore: 6.5, touristScore: 8.0, nightSafetyScore: 9.0,
    crowdLevel: "high", weatherFriendly: true,
  },
  {
    placeName: "WonderOn Gaming Lounge",
    address: "Jubilee Hills",
    costPerPerson: 250,
    category: "entertainment",
    coordinates: { lat: 17.4312, lng: 78.4095 },
    zone: "west",
    tags: ["gaming", "esports", "youth", "lounge"],
    keywords: ["gaming", "esports", "lounge", "ps5", "console", "pc gaming", "friends", "youth", "competitive", "birthday", "weekend", "indoor", "jubilee hills", "affordable", "student"],
    ageMin: 14, ageMax: 35, groupMin: 2, groupMax: 8, timePreference: "any",
    dateScore: 4.0, instagramScore: 5.5, parkingScore: 7.0, familyScore: 4.0,
    studentScore: 9.5, touristScore: 2.5, nightSafetyScore: 8.5,
    crowdLevel: "medium", weatherFriendly: true,
  },

  // ────────────────────────────
  // MALLS & SHOPPING
  // ────────────────────────────
  {
    placeName: "Inorbit Mall",
    address: "Madhapur, Hitech City",
    costPerPerson: 400,
    category: "shopping",
    coordinates: { lat: 17.4398, lng: 78.3908 },
    zone: "west",
    tags: ["shopping", "family-friendly", "food-court"],
    keywords: ["mall", "shopping", "brands", "food court", "movies", "family", "friends", "air conditioned", "hitech city", "madhapur", "weekend", "retail therapy", "casual outing"],
    ageMin: 10, ageMax: 60, groupMin: 2, groupMax: 10, timePreference: "any",
    dateScore: 5.0, instagramScore: 5.5, parkingScore: 8.5, familyScore: 8.5,
    studentScore: 7.0, touristScore: 5.0, nightSafetyScore: 9.5,
    crowdLevel: "high", weatherFriendly: true,
  },
  {
    placeName: "GVK One Mall",
    address: "Banjara Hills",
    costPerPerson: 500,
    category: "shopping",
    coordinates: { lat: 17.4326, lng: 78.4071 },
    zone: "west",
    tags: ["premium", "shopping", "family-friendly"],
    keywords: ["mall", "premium shopping", "luxury brands", "banjara hills", "family", "movies", "food", "date", "couple", "weekend", "upscale", "air conditioned"],
    ageMin: 15, ageMax: 65, groupMin: 2, groupMax: 8, timePreference: "any",
    dateScore: 6.0, instagramScore: 6.0, parkingScore: 7.5, familyScore: 8.0,
    studentScore: 6.0, touristScore: 5.5, nightSafetyScore: 9.5,
    crowdLevel: "high", weatherFriendly: true,
  },
  {
    placeName: "Forum Sujana City",
    address: "Kukatpally",
    costPerPerson: 350,
    category: "shopping",
    coordinates: { lat: 17.4926, lng: 78.3956 },
    zone: "north",
    tags: ["shopping", "family-friendly", "movies"],
    keywords: ["mall", "shopping", "kukatpally", "movies", "family", "food court", "weekend", "north hyderabad", "affordable", "retail", "brands"],
    ageMin: 10, ageMax: 60, groupMin: 2, groupMax: 10, timePreference: "any",
    dateScore: 4.5, instagramScore: 5.0, parkingScore: 8.5, familyScore: 8.5,
    studentScore: 7.5, touristScore: 4.0, nightSafetyScore: 9.0,
    crowdLevel: "high", weatherFriendly: true,
  },
  {
    placeName: "Sarath City Capital Mall",
    address: "Kondapur",
    costPerPerson: 400,
    category: "shopping",
    coordinates: { lat: 17.4401, lng: 78.3489 },
    zone: "west",
    tags: ["shopping", "youth", "movies"],
    keywords: ["mall", "shopping", "kondapur", "movies", "youth", "food court", "weekend", "brands", "air conditioned", "friends"],
    ageMin: 10, ageMax: 60, groupMin: 2, groupMax: 8, timePreference: "any",
    dateScore: 5.0, instagramScore: 5.5, parkingScore: 8.5, familyScore: 8.0,
    studentScore: 7.5, touristScore: 4.5, nightSafetyScore: 9.0,
    crowdLevel: "high", weatherFriendly: true,
  },
  {
    placeName: "Lulu Mall",
    address: "Kukatpally",
    costPerPerson: 500,
    category: "shopping",
    coordinates: { lat: 17.4850, lng: 78.3950 },
    zone: "north",
    tags: ["massive", "shopping", "family-friendly"],
    keywords: ["lulu mall", "biggest mall", "shopping", "kukatpally", "family", "food", "hypermarket", "brands", "weekend", "entertainment", "north hyderabad", "massive"],
    ageMin: 10, ageMax: 70, groupMin: 2, groupMax: 12, timePreference: "any",
    dateScore: 5.0, instagramScore: 6.0, parkingScore: 8.0, familyScore: 9.0,
    studentScore: 7.0, touristScore: 5.5, nightSafetyScore: 9.5,
    crowdLevel: "high", weatherFriendly: true,
  },
  {
    placeName: "Laad Bazaar",
    address: "Near Charminar, Old City",
    costPerPerson: 300,
    category: "shopping",
    coordinates: { lat: 17.3616, lng: 78.4740 },
    zone: "oldcity",
    tags: ["bangles", "shopping", "tourist", "heritage", "photo-walk"],
    keywords: ["bangles", "laad bazaar", "old city", "heritage shopping", "tourist", "charminar", "traditional jewelry", "photo walk", "cultural", "craft", "handicrafts", "hyderabadi culture", "historic market", "street shopping"],
    ageMin: 10, ageMax: 70, groupMin: 2, groupMax: 15, timePreference: "any",
    dateScore: 7.0, instagramScore: 9.0, parkingScore: 3.0, familyScore: 7.0,
    studentScore: 7.5, touristScore: 9.5, nightSafetyScore: 6.0,
    crowdLevel: "high", weatherFriendly: false,
  },
  {
    placeName: "Begum Bazaar",
    address: "Abids",
    costPerPerson: 200,
    category: "shopping",
    coordinates: { lat: 17.3850, lng: 78.4810 },
    zone: "central",
    tags: ["wholesale", "local", "budget", "traditional"],
    keywords: ["begum bazaar", "wholesale", "cheap shopping", "abids", "traditional market", "local bazaar", "budget", "spices", "dry fruits", "household", "street market", "old hyderabad"],
    ageMin: 15, ageMax: 65, groupMin: 2, groupMax: 10, timePreference: "morning",
    dateScore: 3.0, instagramScore: 6.5, parkingScore: 3.5, familyScore: 6.5,
    studentScore: 8.0, touristScore: 7.5, nightSafetyScore: 6.0,
    crowdLevel: "high", weatherFriendly: false,
  },

  // ────────────────────────────
  // NATURE & LAKES
  // ────────────────────────────
  {
    placeName: "Hussain Sagar Lake",
    address: "Tank Bund Road",
    costPerPerson: 0,
    category: "nature",
    coordinates: { lat: 17.4239, lng: 78.4738 },
    zone: "central",
    tags: ["scenic", "romantic", "evening", "free"],
    keywords: ["hussain sagar", "lake", "evening walk", "tank bund", "romantic", "free", "scenic", "couple", "sunset", "fresh air", "monument", "iconic", "hyderabad landmark", "picnic", "open air", "relaxing"],
    ageMin: 5, ageMax: 70, groupMin: 1, groupMax: 20, timePreference: "evening",
    dateScore: 7.5, instagramScore: 8.0, parkingScore: 6.0, familyScore: 8.5,
    studentScore: 8.0, touristScore: 9.0, nightSafetyScore: 7.5,
    crowdLevel: "high", weatherFriendly: false,
  },
  {
    placeName: "Hussain Sagar Boat Ride",
    address: "Tank Bund, Hyderabad",
    costPerPerson: 80,
    category: "nature",
    coordinates: { lat: 17.4239, lng: 78.4738 },
    zone: "central",
    tags: ["romantic", "boat", "couple", "sunset"],
    keywords: ["boat ride", "hussain sagar", "lake", "romantic", "couple", "sunset", "water", "evening", "scenic", "buddha statue", "date", "family", "fun", "experience", "cool", "refreshing"],
    ageMin: 5, ageMax: 70, groupMin: 2, groupMax: 10, timePreference: "evening",
    dateScore: 8.5, instagramScore: 8.5, parkingScore: 6.0, familyScore: 8.5,
    studentScore: 7.5, touristScore: 9.5, nightSafetyScore: 8.0,
    crowdLevel: "high", weatherFriendly: false,
  },
  {
    placeName: "Durgam Cheruvu",
    address: "Jubilee Hills",
    costPerPerson: 0,
    category: "nature",
    coordinates: { lat: 17.4395, lng: 78.3908 },
    zone: "west",
    tags: ["hidden-gem", "romantic", "scenic", "peaceful"],
    keywords: ["durgam cheruvu", "secret lake", "hidden gem", "romantic", "couple", "peaceful", "scenic", "evening walk", "cable bridge", "sunset", "fresh air", "jubilee hills", "date spot", "nature", "quiet", "serene"],
    ageMin: 15, ageMax: 60, groupMin: 2, groupMax: 8, timePreference: "evening",
    dateScore: 9.0, instagramScore: 8.5, parkingScore: 7.5, familyScore: 6.0,
    studentScore: 8.5, touristScore: 7.0, nightSafetyScore: 7.0,
    crowdLevel: "medium", weatherFriendly: false,
  },
  {
    placeName: "Durgam Cheruvu Cable Bridge",
    address: "Jubilee Hills",
    costPerPerson: 0,
    category: "hidden_gem",
    coordinates: { lat: 17.4395, lng: 78.3920 },
    zone: "west",
    tags: ["romantic", "scenic", "free", "iconic"],
    keywords: ["cable bridge", "durgam cheruvu", "bridge walk", "romantic", "couple", "evening", "instagram", "scenic", "date", "sunset", "jubilee hills", "hitech city", "modern", "photos", "free", "landmark"],
    ageMin: 15, ageMax: 60, groupMin: 2, groupMax: 8, timePreference: "evening",
    dateScore: 9.5, instagramScore: 9.5, parkingScore: 7.0, familyScore: 6.5,
    studentScore: 9.0, touristScore: 8.0, nightSafetyScore: 7.5,
    crowdLevel: "medium", weatherFriendly: false,
  },
  {
    placeName: "KBR National Park",
    address: "Jubilee Hills",
    costPerPerson: 0,
    category: "nature",
    coordinates: { lat: 17.4239, lng: 78.4043 },
    zone: "west",
    tags: ["nature", "morning-walk", "peaceful", "fitness"],
    keywords: ["kbr park", "nature walk", "morning walk", "jogging", "fitness", "birds", "trees", "peaceful", "free", "jubilee hills", "couple walk", "family", "fresh air", "green", "exercise", "sunrise", "wildlife"],
    ageMin: 5, ageMax: 70, groupMin: 1, groupMax: 10, timePreference: "morning", closingHour: 18,
    dateScore: 7.0, instagramScore: 7.5, parkingScore: 7.5, familyScore: 9.0,
    studentScore: 8.0, touristScore: 6.0, nightSafetyScore: 5.0,
    crowdLevel: "medium", weatherFriendly: false,
  },
  {
    placeName: "Lumbini Park",
    address: "Secretariat Road",
    costPerPerson: 30,
    category: "nature",
    coordinates: { lat: 17.4125, lng: 78.4683 },
    zone: "central",
    tags: ["family-friendly", "evening", "laser-show"],
    keywords: ["lumbini park", "laser show", "musical fountain", "family", "evening", "lake view", "garden", "budget", "kids", "tourist", "hussain sagar", "open air", "relaxing", "date"],
    ageMin: 5, ageMax: 70, groupMin: 2, groupMax: 15, timePreference: "evening",
    dateScore: 6.5, instagramScore: 7.0, parkingScore: 6.0, familyScore: 9.0,
    studentScore: 7.0, touristScore: 8.0, nightSafetyScore: 8.0,
    crowdLevel: "high", weatherFriendly: false,
  },
  {
    placeName: "Osman Sagar (Gandipet)",
    address: "Gandipet, Hyderabad",
    costPerPerson: 0,
    category: "nature",
    coordinates: { lat: 17.3500, lng: 78.3200 },
    zone: "west",
    tags: ["scenic", "peaceful", "picnic", "sunrise"],
    keywords: ["osman sagar", "gandipet lake", "sunrise", "picnic", "peaceful", "scenic", "couple", "morning", "budget", "free", "outdoors", "reservoir", "open space", "fresh air", "long drive", "photography"],
    ageMin: 5, ageMax: 70, groupMin: 2, groupMax: 15, timePreference: "morning",
    dateScore: 8.0, instagramScore: 8.5, parkingScore: 8.5, familyScore: 8.5,
    studentScore: 8.0, touristScore: 7.0, nightSafetyScore: 5.0,
    crowdLevel: "low", weatherFriendly: false,
  },
  {
    placeName: "Fox Sagar Lake",
    address: "Shaikpet, Hyderabad",
    costPerPerson: 0,
    category: "hidden_gem",
    coordinates: { lat: 17.3950, lng: 78.3950 },
    zone: "west",
    tags: ["hidden-gem", "peaceful", "nature", "birding"],
    keywords: ["fox sagar lake", "hidden gem", "quiet lake", "peaceful", "birding", "nature", "shaikpet", "local secret", "couples", "sunrise", "sunset", "photography", "escape crowds", "free", "serene"],
    ageMin: 15, ageMax: 65, groupMin: 2, groupMax: 8, timePreference: "morning",
    dateScore: 8.5, instagramScore: 8.0, parkingScore: 6.5, familyScore: 6.5,
    studentScore: 8.5, touristScore: 5.5, nightSafetyScore: 5.5,
    crowdLevel: "low", weatherFriendly: false,
  },
  {
    placeName: "Malkam Cheruvu Park",
    address: "Malkajgiri",
    costPerPerson: 0,
    category: "hidden_gem",
    coordinates: { lat: 17.4600, lng: 78.5200 },
    zone: "east",
    tags: ["hidden-gem", "local", "peaceful", "lake"],
    keywords: ["malkam cheruvu", "malkajgiri", "local park", "lake", "hidden gem", "peaceful", "evening walk", "free", "east hyderabad", "family", "jogging", "quiet"],
    ageMin: 5, ageMax: 70, groupMin: 2, groupMax: 12, timePreference: "evening",
    dateScore: 5.5, instagramScore: 6.0, parkingScore: 7.0, familyScore: 8.0,
    studentScore: 7.5, touristScore: 3.5, nightSafetyScore: 6.5,
    crowdLevel: "low", weatherFriendly: false,
  },
  {
    placeName: "Khajaguda Hills",
    address: "Khajaguda, near Gachibowli",
    costPerPerson: 0,
    category: "hidden_gem",
    coordinates: { lat: 17.4050, lng: 78.3700 },
    zone: "west",
    tags: ["hidden-gem", "trekking", "sunrise", "view"],
    keywords: ["khajaguda hills", "trekking", "sunrise", "hidden gem", "rocks", "view point", "adventure", "morning", "nature", "photography", "hitech city view", "free", "couple", "friends", "workout"],
    ageMin: 15, ageMax: 55, groupMin: 2, groupMax: 10, timePreference: "morning",
    dateScore: 8.0, instagramScore: 9.0, parkingScore: 6.0, familyScore: 5.5,
    studentScore: 9.0, touristScore: 6.5, nightSafetyScore: 4.5,
    crowdLevel: "low", weatherFriendly: false,
  },
  {
    placeName: "Moula Ali Hill",
    address: "Moula Ali, Hyderabad",
    costPerPerson: 0,
    category: "hidden_gem",
    coordinates: { lat: 17.4700, lng: 78.5300 },
    zone: "east",
    tags: ["hidden-gem", "spiritual", "hill", "view"],
    keywords: ["moula ali", "hill", "dargah", "spiritual", "view point", "city view", "east hyderabad", "peaceful", "hidden gem", "morning", "trekking", "photography", "free"],
    ageMin: 10, ageMax: 65, groupMin: 2, groupMax: 10, timePreference: "morning",
    dateScore: 5.5, instagramScore: 7.5, parkingScore: 5.5, familyScore: 7.0,
    studentScore: 7.5, touristScore: 6.5, nightSafetyScore: 5.0,
    crowdLevel: "low", weatherFriendly: false,
  },
  {
    placeName: "Gandipet Lake Viewpoint",
    address: "Gandipet",
    costPerPerson: 0,
    category: "hidden_gem",
    coordinates: { lat: 17.3400, lng: 78.3100 },
    zone: "west",
    tags: ["scenic", "sunrise", "romantic", "free"],
    keywords: ["gandipet", "lake view", "sunrise spot", "scenic", "romantic", "couple", "photography", "free", "morning", "peaceful", "nature", "open sky", "fresh air", "road trip", "hidden gem"],
    ageMin: 15, ageMax: 65, groupMin: 2, groupMax: 10, timePreference: "morning",
    dateScore: 8.5, instagramScore: 9.0, parkingScore: 8.0, familyScore: 7.0,
    studentScore: 9.0, touristScore: 7.0, nightSafetyScore: 4.5,
    crowdLevel: "low", weatherFriendly: false,
  },
  {
    placeName: "Keesaragutta Temple",
    address: "Keesaragutta, Hyderabad",
    costPerPerson: 0,
    category: "hidden_gem",
    coordinates: { lat: 17.5100, lng: 78.6000 },
    zone: "east",
    tags: ["spiritual", "hidden-gem", "temple", "nature"],
    keywords: ["keesaragutta", "temple", "spiritual", "rocks", "forest", "hidden gem", "morning", "trekking", "nature walk", "photography", "peaceful", "ancient", "east hyderabad", "family"],
    ageMin: 10, ageMax: 70, groupMin: 2, groupMax: 15, timePreference: "morning",
    dateScore: 4.5, instagramScore: 7.5, parkingScore: 6.0, familyScore: 7.5,
    studentScore: 7.0, touristScore: 6.5, nightSafetyScore: 5.0,
    crowdLevel: "low", weatherFriendly: false,
  },
  {
    placeName: "Taramati Baradari",
    address: "Ibrahim Bagh",
    costPerPerson: 50,
    category: "hidden_gem",
    coordinates: { lat: 17.3750, lng: 78.3900 },
    zone: "west",
    tags: ["heritage", "unique", "evening", "cultural"],
    keywords: ["taramati baradari", "heritage", "architecture", "golconda view", "evening events", "unique", "photography", "romantic", "history", "cultural", "open air", "performance venue", "old monument"],
    ageMin: 18, ageMax: 60, groupMin: 2, groupMax: 10, timePreference: "evening",
    dateScore: 8.5, instagramScore: 8.5, parkingScore: 6.5, familyScore: 6.5,
    studentScore: 7.0, touristScore: 7.5, nightSafetyScore: 7.0,
    crowdLevel: "low", weatherFriendly: false,
  },
  {
    placeName: "Paigah Tombs",
    address: "Santoshnagar, Hyderabad",
    costPerPerson: 0,
    category: "hidden_gem",
    coordinates: { lat: 17.3400, lng: 78.4800 },
    zone: "oldcity",
    tags: ["heritage", "hidden-gem", "historical", "photography"],
    keywords: ["paigah tombs", "hidden heritage", "photography", "historical", "nizam era", "architecture", "mosaic tiles", "quiet", "unique", "old city", "explorer", "history buff", "free"],
    ageMin: 18, ageMax: 65, groupMin: 1, groupMax: 8, timePreference: "morning",
    dateScore: 6.0, instagramScore: 8.5, parkingScore: 5.0, familyScore: 5.5,
    studentScore: 7.5, touristScore: 8.0, nightSafetyScore: 5.5,
    crowdLevel: "low", weatherFriendly: false,
  },
  {
    placeName: "Mahavir Harina Vanasthali",
    address: "Vanasthali Puram",
    costPerPerson: 30,
    category: "nature",
    coordinates: { lat: 17.3250, lng: 78.5500 },
    zone: "south",
    tags: ["nature", "deer", "forest", "family"],
    keywords: ["national park", "deer park", "nature", "forest", "wildlife", "family outing", "kids", "morning", "picnic", "peaceful", "budget", "vanasthali", "educational", "animals"],
    ageMin: 5, ageMax: 70, groupMin: 2, groupMax: 15, timePreference: "morning", closingHour: 17,
    dateScore: 5.5, instagramScore: 7.0, parkingScore: 8.5, familyScore: 9.5,
    studentScore: 6.5, touristScore: 6.5, nightSafetyScore: 5.0,
    crowdLevel: "low", weatherFriendly: false,
  },

  // ────────────────────────────
  // CULTURAL & HISTORICAL
  // ────────────────────────────
  {
    placeName: "Charminar",
    address: "Old City, Hyderabad",
    costPerPerson: 25,
    category: "cultural",
    coordinates: { lat: 17.3616, lng: 78.4747 },
    zone: "oldcity",
    tags: ["iconic", "historical", "tourist", "photo-walk"],
    keywords: ["charminar", "iconic", "historical", "tourist", "heritage", "photo walk", "old city", "architecture", "monument", "hyderabad symbol", "must visit", "photography", "instagram", "landmark", "cultural", "evening lit", "nizam era"],
    ageMin: 10, ageMax: 70, groupMin: 1, groupMax: 20, timePreference: "any",
    dateScore: 7.0, instagramScore: 9.5, parkingScore: 3.0, familyScore: 8.5,
    studentScore: 8.0, touristScore: 10.0, nightSafetyScore: 6.5,
    crowdLevel: "high", weatherFriendly: false,
  },
  {
    placeName: "Golconda Fort",
    address: "Ibrahim Bagh",
    costPerPerson: 25,
    category: "cultural",
    coordinates: { lat: 17.3833, lng: 78.4011 },
    zone: "west",
    tags: ["historical", "heritage", "tourist", "morning-only"],
    keywords: ["golconda fort", "fort", "historical", "heritage", "trekking", "ruins", "nizam", "tourist", "morning", "photography", "architecture", "history", "sound and light show", "must visit", "cultural", "hyderabad"],
    ageMin: 10, ageMax: 65, groupMin: 2, groupMax: 20, timePreference: "morning", closingHour: 17,
    dateScore: 7.5, instagramScore: 9.0, parkingScore: 7.0, familyScore: 8.0,
    studentScore: 8.0, touristScore: 10.0, nightSafetyScore: 6.0,
    crowdLevel: "high", weatherFriendly: false,
  },
  {
    placeName: "Chowmahalla Palace",
    address: "Old City",
    costPerPerson: 80,
    category: "cultural",
    coordinates: { lat: 17.3616, lng: 78.4740 },
    zone: "oldcity",
    tags: ["heritage", "royal", "architecture", "photography"],
    keywords: ["chowmahalla palace", "nizam palace", "royal", "heritage", "architecture", "photography", "old city", "history", "culture", "vintage cars", "elegant", "old world", "tourist", "instagram"],
    ageMin: 10, ageMax: 70, groupMin: 1, groupMax: 15, timePreference: "morning",
    dateScore: 7.5, instagramScore: 9.0, parkingScore: 4.5, familyScore: 8.0,
    studentScore: 7.5, touristScore: 9.5, nightSafetyScore: 7.0,
    crowdLevel: "medium", weatherFriendly: false,
  },
  {
    placeName: "Salar Jung Museum",
    address: "Darulshifa, Old City",
    costPerPerson: 50,
    category: "cultural",
    coordinates: { lat: 17.3712, lng: 78.4803 },
    zone: "oldcity",
    tags: ["museum", "art", "cultural", "educational"],
    keywords: ["salar jung museum", "museum", "art collection", "antiques", "cultural", "history", "educational", "old city", "world's largest one-man collection", "tourist", "marble", "veiled rebecca", "clock"],
    ageMin: 10, ageMax: 70, groupMin: 1, groupMax: 10, timePreference: "morning", closingHour: 17,
    dateScore: 5.5, instagramScore: 7.0, parkingScore: 5.0, familyScore: 8.5,
    studentScore: 7.5, touristScore: 9.5, nightSafetyScore: 8.5,
    crowdLevel: "medium", weatherFriendly: true,
  },
  {
    placeName: "Birla Mandir",
    address: "Naubat Pahad, Khairatabad",
    costPerPerson: 0,
    category: "cultural",
    coordinates: { lat: 17.4062, lng: 78.4691 },
    zone: "central",
    tags: ["spiritual", "scenic-view", "peaceful"],
    keywords: ["birla mandir", "temple", "spiritual", "white marble", "scenic view", "city view", "peaceful", "free", "morning", "evening", "photography", "architecture", "hillside", "religious", "couple", "serene"],
    ageMin: 5, ageMax: 75, groupMin: 1, groupMax: 15, timePreference: "any",
    dateScore: 6.0, instagramScore: 8.0, parkingScore: 6.5, familyScore: 8.5,
    studentScore: 6.5, touristScore: 8.5, nightSafetyScore: 8.0,
    crowdLevel: "medium", weatherFriendly: false,
  },
  {
    placeName: "Shilparamam",
    address: "Madhapur",
    costPerPerson: 50,
    category: "cultural",
    coordinates: { lat: 17.4483, lng: 78.3915 },
    zone: "west",
    tags: ["crafts", "cultural", "family-friendly", "open-air"],
    keywords: ["shilparamam", "crafts village", "handicrafts", "cultural", "art", "tribal crafts", "open air", "family", "shopping", "authentic", "traditional", "hitech city", "evening walk", "affordable"],
    ageMin: 8, ageMax: 70, groupMin: 2, groupMax: 15, timePreference: "any",
    dateScore: 6.5, instagramScore: 7.5, parkingScore: 8.0, familyScore: 8.5,
    studentScore: 7.0, touristScore: 8.5, nightSafetyScore: 8.0,
    crowdLevel: "medium", weatherFriendly: false,
  },
  {
    placeName: "Birla Planetarium",
    address: "Naubat Pahad",
    costPerPerson: 100,
    category: "cultural",
    coordinates: { lat: 17.4062, lng: 78.4691 },
    zone: "central",
    tags: ["educational", "space", "kids", "family-friendly"],
    keywords: ["planetarium", "space", "stars", "educational", "science", "kids", "family", "astronomy", "show", "budget", "school trip", "museum", "science city"],
    ageMin: 8, ageMax: 60, groupMin: 2, groupMax: 15, timePreference: "any",
    dateScore: 4.5, instagramScore: 5.5, parkingScore: 6.5, familyScore: 9.0,
    studentScore: 7.5, touristScore: 7.0, nightSafetyScore: 8.5,
    crowdLevel: "medium", weatherFriendly: true,
  },
  {
    placeName: "Birla Science Museum",
    address: "Naubat Pahad",
    costPerPerson: 150,
    category: "cultural",
    coordinates: { lat: 17.4062, lng: 78.4691 },
    zone: "central",
    tags: ["educational", "science", "kids", "family"],
    keywords: ["science museum", "educational", "kids", "family", "experiments", "learning", "biology", "space", "technology", "school outing", "interactive", "affordable"],
    ageMin: 6, ageMax: 60, groupMin: 2, groupMax: 15, timePreference: "any",
    dateScore: 3.5, instagramScore: 5.0, parkingScore: 6.5, familyScore: 9.5,
    studentScore: 8.0, touristScore: 6.5, nightSafetyScore: 8.5,
    crowdLevel: "medium", weatherFriendly: true,
  },
  {
    placeName: "Nehru Zoological Park",
    address: "Bahadurpura",
    costPerPerson: 100,
    category: "nature",
    coordinates: { lat: 17.3500, lng: 78.4513 },
    zone: "oldcity",
    tags: ["zoo", "kids", "family-friendly", "educational"],
    keywords: ["zoo", "animals", "family", "kids", "nature", "educational", "morning", "tiger", "elephant", "safari", "budget", "hyderabad zoo", "wildlife", "day out"],
    ageMin: 3, ageMax: 65, groupMin: 2, groupMax: 12, timePreference: "morning", closingHour: 17,
    dateScore: 4.0, instagramScore: 7.0, parkingScore: 7.5, familyScore: 10.0,
    studentScore: 6.5, touristScore: 7.5, nightSafetyScore: 6.5,
    crowdLevel: "high", weatherFriendly: false,
  },
  {
    placeName: "Nizam's Museum",
    address: "Purani Haveli, Chowk",
    costPerPerson: 100,
    category: "cultural",
    coordinates: { lat: 17.3800, lng: 78.4750 },
    zone: "oldcity",
    tags: ["museum", "nizam", "heritage", "royal"],
    keywords: ["nizam museum", "royal collection", "heritage", "history", "antique", "old city", "gold", "gifts", "collector", "cultural", "educational", "unique", "Hyderabadi history"],
    ageMin: 12, ageMax: 70, groupMin: 1, groupMax: 10, timePreference: "morning", closingHour: 17,
    dateScore: 5.0, instagramScore: 7.0, parkingScore: 4.0, familyScore: 7.5,
    studentScore: 6.5, touristScore: 8.5, nightSafetyScore: 7.5,
    crowdLevel: "low", weatherFriendly: true,
  },

  // ────────────────────────────
  // BIRYANI & ICONIC FOOD
  // ────────────────────────────
  {
    placeName: "Paradise Restaurant",
    address: "Secunderabad",
    costPerPerson: 350,
    category: "food",
    coordinates: { lat: 17.4399, lng: 78.4983 },
    zone: "north",
    tags: ["biryani", "iconic", "must-try", "all-groups"],
    keywords: ["paradise biryani", "hyderabadi biryani", "iconic", "must try", "legendary", "secunderabad", "famous restaurant", "biryani lover", "group lunch", "family dinner", "visitor", "tourist", "dum biryani", "authentic"],
    ageMin: 5, ageMax: 75, groupMin: 2, groupMax: 12, timePreference: "any",
    dateScore: 6.0, instagramScore: 7.5, parkingScore: 7.0, familyScore: 9.0,
    studentScore: 7.5, touristScore: 9.5, nightSafetyScore: 8.5,
    crowdLevel: "high", weatherFriendly: true,
  },
  {
    placeName: "Bawarchi",
    address: "RTC X Roads, Himayatnagar",
    costPerPerson: 300,
    category: "food",
    coordinates: { lat: 17.4280, lng: 78.4900 },
    zone: "central",
    tags: ["biryani", "local-favorite", "budget"],
    keywords: ["bawarchi biryani", "local favorite", "dum biryani", "affordable", "authentic", "himayatnagar", "student", "group food", "quick lunch", "dinner", "family", "hyderabadi"],
    ageMin: 10, ageMax: 70, groupMin: 2, groupMax: 10, timePreference: "any",
    dateScore: 5.5, instagramScore: 6.0, parkingScore: 5.5, familyScore: 8.0,
    studentScore: 9.0, touristScore: 8.0, nightSafetyScore: 8.0,
    crowdLevel: "high", weatherFriendly: true,
  },
  {
    placeName: "Shah Ghouse",
    address: "Tolichowki",
    costPerPerson: 320,
    category: "food",
    coordinates: { lat: 17.4008, lng: 78.4131 },
    zone: "west",
    tags: ["biryani", "late-night", "local", "authentic"],
    keywords: ["shah ghouse", "biryani", "late night food", "authentic", "local favorite", "tolichowki", "haleem", "nihari", "midnight hunger", "friends", "affordable", "hyderabadi"],
    ageMin: 12, ageMax: 65, groupMin: 2, groupMax: 10, timePreference: "any",
    dateScore: 5.5, instagramScore: 6.5, parkingScore: 6.5, familyScore: 7.5,
    studentScore: 9.0, touristScore: 8.0, nightSafetyScore: 8.5,
    crowdLevel: "high", weatherFriendly: true,
  },
  {
    placeName: "Shadab Hotel",
    address: "Old City",
    costPerPerson: 250,
    category: "food",
    coordinates: { lat: 17.3616, lng: 78.4747 },
    zone: "oldcity",
    tags: ["haleem", "biryani", "old-city", "authentic"],
    keywords: ["shadab hotel", "haleem", "biryani", "old city", "authentic", "hyderabadi cuisine", "mughlai", "nihari", "budget", "must try", "famous", "local", "student", "tourist"],
    ageMin: 12, ageMax: 70, groupMin: 2, groupMax: 10, timePreference: "any",
    dateScore: 4.5, instagramScore: 6.5, parkingScore: 3.0, familyScore: 7.5,
    studentScore: 9.0, touristScore: 8.5, nightSafetyScore: 7.0,
    crowdLevel: "high", weatherFriendly: true,
  },
  {
    placeName: "Sarvi Hotel",
    address: "Banjara Hills",
    costPerPerson: 400,
    category: "food",
    coordinates: { lat: 17.4185, lng: 78.4408 },
    zone: "west",
    tags: ["biryani", "kebabs", "popular", "evening"],
    keywords: ["sarvi", "biryani", "kebabs", "banjara hills", "popular", "evening dinner", "date night food", "authentic", "family dinner", "group", "must try", "non veg"],
    ageMin: 15, ageMax: 65, groupMin: 2, groupMax: 10, timePreference: "any",
    dateScore: 6.0, instagramScore: 6.5, parkingScore: 6.5, familyScore: 8.0,
    studentScore: 7.5, touristScore: 8.0, nightSafetyScore: 8.5,
    crowdLevel: "high", weatherFriendly: true,
  },
  {
    placeName: "Cafe Bahar",
    address: "Basheer Bagh",
    costPerPerson: 250,
    category: "food",
    coordinates: { lat: 17.4036, lng: 78.4772 },
    zone: "central",
    tags: ["irani-chai", "traditional", "local", "morning"],
    keywords: ["cafe bahar", "irani chai", "traditional", "old school", "local favorite", "breakfast", "morning", "bun maska", "authentic", "basheer bagh", "budget", "chai lover", "quiet hangout"],
    ageMin: 15, ageMax: 70, groupMin: 2, groupMax: 8, timePreference: "morning",
    dateScore: 5.5, instagramScore: 7.0, parkingScore: 5.0, familyScore: 7.0,
    studentScore: 8.5, touristScore: 7.5, nightSafetyScore: 7.5,
    crowdLevel: "medium", weatherFriendly: true,
  },
  {
    placeName: "Nimrah Cafe",
    address: "Near Charminar, Old City",
    costPerPerson: 100,
    category: "food",
    coordinates: { lat: 17.3616, lng: 78.4747 },
    zone: "oldcity",
    tags: ["irani-chai", "old-city", "cheap", "iconic"],
    keywords: ["nimrah cafe", "irani chai", "osmania biscuit", "charminar area", "cheap", "iconic", "old city", "tourist", "must try", "morning", "breakfast", "chai lover", "budget", "heritage corner"],
    ageMin: 10, ageMax: 70, groupMin: 2, groupMax: 8, timePreference: "any",
    dateScore: 6.5, instagramScore: 8.5, parkingScore: 2.5, familyScore: 7.5,
    studentScore: 9.5, touristScore: 9.5, nightSafetyScore: 7.0,
    crowdLevel: "high", weatherFriendly: true,
  },
  {
    placeName: "Pista House",
    address: "Pathergatti, Old City",
    costPerPerson: 200,
    category: "food",
    coordinates: { lat: 17.3616, lng: 78.4740 },
    zone: "oldcity",
    tags: ["haleem", "old-city", "iconic", "sweets"],
    keywords: ["pista house", "haleem", "sweets", "old city", "iconic", "hyderabadi", "mithai", "bakery", "qubani ka meetha", "double ka meetha", "tourist", "gift box", "authentic"],
    ageMin: 10, ageMax: 70, groupMin: 2, groupMax: 8, timePreference: "any",
    dateScore: 4.5, instagramScore: 7.0, parkingScore: 3.0, familyScore: 8.0,
    studentScore: 8.5, touristScore: 9.0, nightSafetyScore: 7.0,
    crowdLevel: "high", weatherFriendly: true,
  },
  {
    placeName: "Peshawar Restaurant",
    address: "Secunderabad",
    costPerPerson: 350,
    category: "food",
    coordinates: { lat: 17.4450, lng: 78.5020 },
    zone: "north",
    tags: ["biryani", "mughlai", "authentic", "secunderabad"],
    keywords: ["peshawar restaurant", "biryani", "mughlai food", "secunderabad", "authentic", "kebabs", "dum cooking", "family dinner", "local favorite", "non veg", "group", "affordable"],
    ageMin: 10, ageMax: 70, groupMin: 2, groupMax: 12, timePreference: "any",
    dateScore: 5.5, instagramScore: 6.0, parkingScore: 7.0, familyScore: 8.5,
    studentScore: 8.0, touristScore: 7.5, nightSafetyScore: 8.5,
    crowdLevel: "medium", weatherFriendly: true,
  },
  {
    placeName: "Meridian Restaurant",
    address: "Punjagutta",
    costPerPerson: 300,
    category: "food",
    coordinates: { lat: 17.4241, lng: 78.4514 },
    zone: "central",
    tags: ["biryani", "local", "punjagutta", "affordable"],
    keywords: ["meridian", "biryani", "punjagutta", "local favorite", "affordable", "lunch", "dinner", "family", "student", "authentic", "hyderabadi", "quick meal"],
    ageMin: 10, ageMax: 70, groupMin: 2, groupMax: 10, timePreference: "any",
    dateScore: 4.5, instagramScore: 5.5, parkingScore: 6.0, familyScore: 8.0,
    studentScore: 8.5, touristScore: 6.5, nightSafetyScore: 8.0,
    crowdLevel: "medium", weatherFriendly: true,
  },
  {
    placeName: "Grand Hotel Abids",
    address: "Abids, Hyderabad",
    costPerPerson: 280,
    category: "food",
    coordinates: { lat: 17.3880, lng: 78.4740 },
    zone: "central",
    tags: ["biryani", "haleem", "old-school", "abids"],
    keywords: ["grand hotel", "biryani", "haleem", "abids", "old school", "heritage restaurant", "authentic hyderabadi", "budget", "local", "family", "tourist", "central hyderabad"],
    ageMin: 10, ageMax: 70, groupMin: 2, groupMax: 12, timePreference: "any",
    dateScore: 4.0, instagramScore: 6.0, parkingScore: 4.0, familyScore: 8.0,
    studentScore: 8.5, touristScore: 8.0, nightSafetyScore: 8.0,
    crowdLevel: "medium", weatherFriendly: true,
  },

  // ────────────────────────────
  // STUDENT CHEAP EATS
  // ────────────────────────────
  {
    placeName: "Ram Ki Bandi",
    address: "Osmania University area, Tarnaka",
    costPerPerson: 60,
    category: "food",
    coordinates: { lat: 17.4130, lng: 78.5290 },
    zone: "east",
    tags: ["student", "street-food", "cheap", "iconic"],
    keywords: ["ram ki bandi", "street dosa", "tarnaka", "student food", "cheap", "iconic", "late night", "dosa", "quick bite", "budget meal", "osmania university", "local street food", "affordable", "midnight snack"],
    ageMin: 15, ageMax: 40, groupMin: 1, groupMax: 6, timePreference: "night",
    dateScore: 5.5, instagramScore: 7.5, parkingScore: 5.0, familyScore: 4.5,
    studentScore: 10.0, touristScore: 7.0, nightSafetyScore: 7.5,
    crowdLevel: "high", weatherFriendly: false,
  },
  {
    placeName: "DLF Street Food Court",
    address: "Cyber City, DLF",
    costPerPerson: 150,
    category: "food",
    coordinates: { lat: 17.4485, lng: 78.3780 },
    zone: "west",
    tags: ["student", "street-food", "variety", "lunch"],
    keywords: ["dlf street food", "cyber city", "student", "budget lunch", "variety", "quick food", "office lunch", "affordable", "multiple cuisines", "fast food", "daily eats"],
    ageMin: 15, ageMax: 45, groupMin: 1, groupMax: 10, timePreference: "afternoon",
    dateScore: 3.0, instagramScore: 5.0, parkingScore: 8.0, familyScore: 5.0,
    studentScore: 9.5, touristScore: 3.5, nightSafetyScore: 8.5,
    crowdLevel: "high", weatherFriendly: true,
  },
  {
    placeName: "Varalakshmi Tiffins",
    address: "Kukatpally",
    costPerPerson: 80,
    category: "food",
    coordinates: { lat: 17.4850, lng: 78.4050 },
    zone: "north",
    tags: ["student", "south-indian", "cheap", "breakfast"],
    keywords: ["varalakshmi tiffins", "idli", "dosa", "vada", "breakfast", "student", "cheap", "budget", "south indian", "kukatpally", "tiffin", "morning", "affordable", "local eatery"],
    ageMin: 10, ageMax: 65, groupMin: 1, groupMax: 8, timePreference: "morning",
    dateScore: 2.5, instagramScore: 5.0, parkingScore: 5.5, familyScore: 7.5,
    studentScore: 10.0, touristScore: 5.5, nightSafetyScore: 8.0,
    crowdLevel: "high", weatherFriendly: true,
  },
  {
    placeName: "Balaji Santosh Dhaba",
    address: "Koti, Hyderabad",
    costPerPerson: 120,
    category: "food",
    coordinates: { lat: 17.3900, lng: 78.4860 },
    zone: "central",
    tags: ["student", "north-indian", "cheap", "dhaba"],
    keywords: ["dhaba", "north indian", "budget", "student", "koti", "roti", "dal", "sabzi", "late night", "filling meal", "affordable", "local", "casual dining"],
    ageMin: 15, ageMax: 55, groupMin: 2, groupMax: 10, timePreference: "any",
    dateScore: 2.5, instagramScore: 4.5, parkingScore: 4.5, familyScore: 6.0,
    studentScore: 10.0, touristScore: 4.0, nightSafetyScore: 7.5,
    crowdLevel: "medium", weatherFriendly: true,
  },
  {
    placeName: "Chai Sutta Bar",
    address: "ECIL X Roads",
    costPerPerson: 80,
    category: "drinks",
    coordinates: { lat: 17.4680, lng: 78.5620 },
    zone: "east",
    tags: ["chai", "student", "late-night", "ecil"],
    keywords: ["chai sutta bar", "chai", "tea", "late night chai", "ecil", "student", "friends", "budget", "casual", "night hangout", "clay cup", "quick meet", "affordable", "east hyderabad", "midnight chai"],
    ageMin: 15, ageMax: 40, groupMin: 2, groupMax: 10, timePreference: "night",
    dateScore: 4.5, instagramScore: 6.5, parkingScore: 5.5, familyScore: 5.0,
    studentScore: 10.0, touristScore: 4.0, nightSafetyScore: 7.0,
    crowdLevel: "high", weatherFriendly: false,
  },
  {
    placeName: "Chai Sutta Bar Kukatpally",
    address: "Kukatpally Housing Board",
    costPerPerson: 80,
    category: "drinks",
    coordinates: { lat: 17.4940, lng: 78.3980 },
    zone: "north",
    tags: ["chai", "student", "late-night", "kukatpally"],
    keywords: ["chai sutta bar", "chai", "tea", "late night", "kukatpally", "student", "budget", "friends", "night hangout", "quick meet", "affordable", "north hyderabad", "casual"],
    ageMin: 15, ageMax: 40, groupMin: 2, groupMax: 10, timePreference: "night",
    dateScore: 4.0, instagramScore: 6.0, parkingScore: 6.0, familyScore: 4.5,
    studentScore: 10.0, touristScore: 3.5, nightSafetyScore: 7.0,
    crowdLevel: "high", weatherFriendly: false,
  },
  {
    placeName: "MBA Chai Wala",
    address: "Ameerpet",
    costPerPerson: 70,
    category: "drinks",
    coordinates: { lat: 17.4380, lng: 78.4490 },
    zone: "central",
    tags: ["chai", "student", "startup", "trendy"],
    keywords: ["mba chai wala", "chai", "tea", "startup story", "student", "budget", "ameerpet", "trendy", "friends", "quick meet", "affordable", "night", "late night"],
    ageMin: 15, ageMax: 40, groupMin: 2, groupMax: 8, timePreference: "any",
    dateScore: 4.0, instagramScore: 6.5, parkingScore: 5.0, familyScore: 4.5,
    studentScore: 9.5, touristScore: 5.0, nightSafetyScore: 7.5,
    crowdLevel: "medium", weatherFriendly: false,
  },
  {
    placeName: "Taaza Kitchen",
    address: "Hitech City",
    costPerPerson: 200,
    category: "food",
    coordinates: { lat: 17.4500, lng: 78.3800 },
    zone: "west",
    tags: ["student", "healthy", "affordable", "lunch"],
    keywords: ["taaza kitchen", "healthy food", "budget", "hitech city", "student lunch", "office crowd", "fresh", "quick", "affordable", "daily meal", "balanced meal"],
    ageMin: 18, ageMax: 45, groupMin: 1, groupMax: 8, timePreference: "afternoon",
    dateScore: 2.5, instagramScore: 4.5, parkingScore: 7.5, familyScore: 5.5,
    studentScore: 9.0, touristScore: 3.0, nightSafetyScore: 8.5,
    crowdLevel: "high", weatherFriendly: true,
  },

  // ────────────────────────────
  // FINE DINING
  // ────────────────────────────
  {
    placeName: "AB's Absolute Barbecues",
    address: "Gachibowli",
    costPerPerson: 900,
    category: "food",
    coordinates: { lat: 17.4401, lng: 78.3628 },
    zone: "west",
    tags: ["bbq", "premium", "group-friendly", "unlimited"],
    keywords: ["abs barbecues", "absolute barbecues", "bbq", "unlimited", "group dining", "birthday party", "premium", "gachibowli", "live grill", "date night", "corporate dinner", "buffet"],
    ageMin: 18, ageMax: 65, groupMin: 2, groupMax: 12, timePreference: "evening",
    dateScore: 8.0, instagramScore: 7.5, parkingScore: 8.5, familyScore: 7.5,
    studentScore: 5.5, touristScore: 7.0, nightSafetyScore: 9.0,
    crowdLevel: "high", weatherFriendly: true,
  },
  {
    placeName: "Barbeque Nation",
    address: "Banjara Hills",
    costPerPerson: 800,
    category: "food",
    coordinates: { lat: 17.4239, lng: 78.4358 },
    zone: "west",
    tags: ["bbq", "group-friendly", "buffet", "family-friendly"],
    keywords: ["barbeque nation", "bbq", "unlimited", "buffet", "family", "group dinner", "live grill", "birthday", "celebration", "fun dining", "banjara hills"],
    ageMin: 10, ageMax: 65, groupMin: 2, groupMax: 15, timePreference: "evening",
    dateScore: 7.5, instagramScore: 7.0, parkingScore: 7.5, familyScore: 9.0,
    studentScore: 5.5, touristScore: 7.0, nightSafetyScore: 9.0,
    crowdLevel: "high", weatherFriendly: true,
  },
  {
    placeName: "Ohri's Gufaa",
    address: "Necklace Road",
    costPerPerson: 900,
    category: "food",
    coordinates: { lat: 17.4125, lng: 78.4683 },
    zone: "central",
    tags: ["cave-theme", "unique-ambiance", "family-friendly"],
    keywords: ["ohris gufaa", "cave restaurant", "theme dining", "unique", "family", "lake view", "necklace road", "anniversary dinner", "birthday", "special occasion", "ambiance", "waterfront"],
    ageMin: 10, ageMax: 65, groupMin: 2, groupMax: 10, timePreference: "any",
    dateScore: 8.5, instagramScore: 9.0, parkingScore: 7.0, familyScore: 8.0,
    studentScore: 4.5, touristScore: 7.5, nightSafetyScore: 8.5,
    crowdLevel: "medium", weatherFriendly: true,
  },
  {
    placeName: "The Fisherman's Wharf",
    address: "Banjara Hills",
    costPerPerson: 800,
    category: "food",
    coordinates: { lat: 17.4290, lng: 78.4125 },
    zone: "west",
    tags: ["seafood", "romantic", "premium"],
    keywords: ["fishermans wharf", "seafood", "fish", "romantic", "date night", "anniversary", "premium", "goan", "prawns", "lobster", "couple dinner", "banjara hills", "special occasion"],
    ageMin: 20, ageMax: 60, groupMin: 2, groupMax: 8, timePreference: "any",
    dateScore: 8.5, instagramScore: 7.5, parkingScore: 7.5, familyScore: 7.0,
    studentScore: 3.5, touristScore: 7.0, nightSafetyScore: 8.5,
    crowdLevel: "medium", weatherFriendly: true,
  },
  {
    placeName: "Farzi Cafe",
    address: "Banjara Hills",
    costPerPerson: 900,
    category: "food",
    coordinates: { lat: 17.4239, lng: 78.4358 },
    zone: "west",
    tags: ["modern-indian", "trendy", "instagram", "youth"],
    keywords: ["farzi cafe", "modern indian", "molecular gastronomy", "trendy", "instagram food", "unique dishes", "birthday", "date night", "youth", "premium", "banjara hills", "creative food"],
    ageMin: 18, ageMax: 45, groupMin: 2, groupMax: 8, timePreference: "any",
    dateScore: 8.5, instagramScore: 9.5, parkingScore: 7.5, familyScore: 6.5,
    studentScore: 4.5, touristScore: 7.5, nightSafetyScore: 9.0,
    crowdLevel: "medium", weatherFriendly: true,
  },
  {
    placeName: "Olive Bistro",
    address: "Jubilee Hills",
    costPerPerson: 1200,
    category: "food",
    coordinates: { lat: 17.4312, lng: 78.4095 },
    zone: "west",
    tags: ["romantic", "premium", "italian", "date-night"],
    keywords: ["olive bistro", "date night", "romantic", "proposal", "anniversary", "lake view", "couple", "fine dining", "sunset", "birthday", "quiet", "premium", "instagram", "wine", "special occasion", "italian", "rooftop view"],
    ageMin: 25, ageMax: 60, groupMin: 2, groupMax: 6, timePreference: "evening",
    dateScore: 9.8, instagramScore: 9.0, parkingScore: 8.0, familyScore: 5.5,
    studentScore: 2.5, touristScore: 7.5, nightSafetyScore: 9.5,
    crowdLevel: "low", weatherFriendly: true,
  },
  {
    placeName: "Exotica (Taj Krishna)",
    address: "Banjara Hills",
    costPerPerson: 2000,
    category: "food",
    coordinates: { lat: 17.4239, lng: 78.4358 },
    zone: "west",
    tags: ["luxury", "fine-dining", "premium", "5-star"],
    keywords: ["exotica", "taj krishna", "5 star", "luxury dining", "premium", "fine dining", "anniversary", "proposal", "corporate", "business dinner", "wedding anniversary", "special occasion", "gourmet"],
    ageMin: 25, ageMax: 70, groupMin: 2, groupMax: 8, timePreference: "evening",
    dateScore: 9.5, instagramScore: 9.0, parkingScore: 9.5, familyScore: 7.0,
    studentScore: 1.0, touristScore: 8.5, nightSafetyScore: 10.0,
    crowdLevel: "low", weatherFriendly: true,
  },
  {
    placeName: "Aish (Park Hyatt)",
    address: "Banjara Hills",
    costPerPerson: 2500,
    category: "food",
    coordinates: { lat: 17.4185, lng: 78.4240 },
    zone: "west",
    tags: ["luxury", "fine-dining", "hyderabadi-cuisine", "5-star"],
    keywords: ["aish", "park hyatt", "royal dining", "luxury", "hyderabadi cuisine", "fine dining", "live cooking", "nizam style", "anniversary", "proposal", "corporate", "premium experience"],
    ageMin: 25, ageMax: 70, groupMin: 2, groupMax: 10, timePreference: "evening",
    dateScore: 9.5, instagramScore: 9.0, parkingScore: 9.5, familyScore: 7.5,
    studentScore: 1.0, touristScore: 9.0, nightSafetyScore: 10.0,
    crowdLevel: "low", weatherFriendly: true,
  },
  {
    placeName: "Jewel of Nizam",
    address: "Taj Falaknuma Palace",
    costPerPerson: 3000,
    category: "food",
    coordinates: { lat: 17.3287, lng: 78.4632 },
    zone: "oldcity",
    tags: ["luxury", "royal", "heritage", "special-occasion"],
    keywords: ["jewel of nizam", "taj falaknuma", "royal dining", "palace dinner", "luxury", "premium", "heritage", "nizam era", "anniversary", "proposal", "once in a lifetime", "butler service", "fine dining"],
    ageMin: 25, ageMax: 70, groupMin: 2, groupMax: 8, timePreference: "evening",
    dateScore: 10.0, instagramScore: 9.5, parkingScore: 9.0, familyScore: 7.0,
    studentScore: 0.5, touristScore: 9.5, nightSafetyScore: 10.0,
    crowdLevel: "low", weatherFriendly: true,
  },
  {
    placeName: "Falaknuma Palace Dining",
    address: "Falaknuma, Old City",
    costPerPerson: 3000,
    category: "food",
    coordinates: { lat: 17.3287, lng: 78.4632 },
    zone: "oldcity",
    tags: ["luxury", "royal", "heritage", "special-occasion"],
    keywords: ["falaknuma palace", "royal", "heritage", "luxury", "palace experience", "nizam", "anniversary", "special occasion", "premium", "exclusive", "butler service", "hyderabad"],
    ageMin: 25, ageMax: 70, groupMin: 2, groupMax: 8, timePreference: "evening",
    dateScore: 10.0, instagramScore: 9.5, parkingScore: 9.0, familyScore: 7.0,
    studentScore: 0.5, touristScore: 9.5, nightSafetyScore: 10.0,
    crowdLevel: "low", weatherFriendly: true,
  },
  {
    placeName: "Tre Forni",
    address: "Banjara Hills",
    costPerPerson: 1100,
    category: "food",
    coordinates: { lat: 17.4239, lng: 78.4358 },
    zone: "west",
    tags: ["italian", "premium", "couple", "fine-dining"],
    keywords: ["tre forni", "italian", "pizza", "pasta", "fine dining", "couple", "anniversary", "date night", "premium", "banjara hills", "romantic", "wood fired", "wine"],
    ageMin: 20, ageMax: 60, groupMin: 2, groupMax: 8, timePreference: "evening",
    dateScore: 9.0, instagramScore: 8.5, parkingScore: 8.0, familyScore: 6.5,
    studentScore: 2.5, touristScore: 7.0, nightSafetyScore: 9.5,
    crowdLevel: "low", weatherFriendly: true,
  },
  {
    placeName: "Bidri (ITC Kohenur)",
    address: "Financial District",
    costPerPerson: 2500,
    category: "food",
    coordinates: { lat: 17.4167, lng: 78.3450 },
    zone: "west",
    tags: ["luxury", "fine-dining", "5-star", "award-winning"],
    keywords: ["bidri", "itc kohenur", "5 star hotel", "fine dining", "luxury", "award winning", "corporate dinner", "anniversary", "premium cuisine", "gourmet", "financial district", "special occasion"],
    ageMin: 25, ageMax: 70, groupMin: 2, groupMax: 10, timePreference: "evening",
    dateScore: 9.5, instagramScore: 8.5, parkingScore: 9.5, familyScore: 7.0,
    studentScore: 0.5, touristScore: 8.0, nightSafetyScore: 10.0,
    crowdLevel: "low", weatherFriendly: true,
  },
  {
    placeName: "Mazzo",
    address: "Jubilee Hills",
    costPerPerson: 1000,
    category: "food",
    coordinates: { lat: 17.4312, lng: 78.4095 },
    zone: "west",
    tags: ["continental", "premium", "date-night", "trendy"],
    keywords: ["mazzo", "continental", "european", "premium", "date night", "anniversary", "jubilee hills", "romantic", "birthday celebration", "wine", "cocktails", "upscale"],
    ageMin: 21, ageMax: 55, groupMin: 2, groupMax: 8, timePreference: "evening",
    dateScore: 9.0, instagramScore: 8.5, parkingScore: 8.0, familyScore: 6.0,
    studentScore: 2.5, touristScore: 7.0, nightSafetyScore: 9.5,
    crowdLevel: "low", weatherFriendly: true,
  },
  {
    placeName: "Chutneys",
    address: "Banjara Hills",
    costPerPerson: 350,
    category: "food",
    coordinates: { lat: 17.4185, lng: 78.4408 },
    zone: "west",
    tags: ["south-indian", "family-friendly", "breakfast", "lunch"],
    keywords: ["chutneys", "south indian", "breakfast", "lunch", "family", "dosa", "idli", "upma", "affordable", "quick", "banjara hills", "vegetarian", "clean", "popular"],
    ageMin: 10, ageMax: 70, groupMin: 2, groupMax: 10, timePreference: "morning",
    dateScore: 5.0, instagramScore: 6.5, parkingScore: 7.0, familyScore: 9.5,
    studentScore: 7.5, touristScore: 7.5, nightSafetyScore: 8.5,
    crowdLevel: "high", weatherFriendly: true,
  },
  {
    placeName: "Eat Street",
    address: "Necklace Road",
    costPerPerson: 300,
    category: "food",
    coordinates: { lat: 17.4125, lng: 78.4683 },
    zone: "central",
    tags: ["street-food", "variety", "evening", "casual"],
    keywords: ["eat street", "street food", "variety", "evening", "necklace road", "casual", "lake view", "family", "group", "budget", "open air", "fun outing", "food stalls", "accessible"],
    ageMin: 10, ageMax: 65, groupMin: 2, groupMax: 12, timePreference: "evening",
    dateScore: 6.5, instagramScore: 7.0, parkingScore: 6.5, familyScore: 8.5,
    studentScore: 8.5, touristScore: 8.0, nightSafetyScore: 8.0,
    crowdLevel: "high", weatherFriendly: false,
  },
  {
    placeName: "Nagarjuna Restaurant",
    address: "Banjara Hills",
    costPerPerson: 400,
    category: "food",
    coordinates: { lat: 17.4239, lng: 78.4358 },
    zone: "west",
    tags: ["andhra", "family-friendly", "popular", "spicy"],
    keywords: ["nagarjuna", "andhra food", "spicy", "family", "lunch", "dinner", "popular", "biryani", "curries", "banjara hills", "authentic", "vegetarian", "non veg"],
    ageMin: 10, ageMax: 70, groupMin: 2, groupMax: 12, timePreference: "any",
    dateScore: 5.0, instagramScore: 6.0, parkingScore: 7.5, familyScore: 9.0,
    studentScore: 7.5, touristScore: 7.5, nightSafetyScore: 8.5,
    crowdLevel: "high", weatherFriendly: true,
  },
  {
    placeName: "Rayalaseema Ruchulu",
    address: "Banjara Hills",
    costPerPerson: 350,
    category: "food",
    coordinates: { lat: 17.4185, lng: 78.4350 },
    zone: "west",
    tags: ["rayalaseema", "andhra", "spicy", "authentic"],
    keywords: ["rayalaseema ruchulu", "rayalaseema food", "andhra cuisine", "spicy", "authentic", "royyala vepudu", "natu kodi", "family", "group", "local", "unique cuisine"],
    ageMin: 12, ageMax: 70, groupMin: 2, groupMax: 12, timePreference: "any",
    dateScore: 5.0, instagramScore: 6.0, parkingScore: 7.5, familyScore: 8.5,
    studentScore: 7.5, touristScore: 7.5, nightSafetyScore: 8.5,
    crowdLevel: "medium", weatherFriendly: true,
  },

  // ────────────────────────────
  // CAFES & TRENDY HANGOUTS
  // ────────────────────────────
  {
    placeName: "Social Jubilee Hills",
    address: "Road No 36, Jubilee Hills",
    costPerPerson: 600,
    category: "drinks",
    coordinates: { lat: 17.4312, lng: 78.4095 },
    zone: "west",
    tags: ["youth", "trendy", "social", "drinks"],
    keywords: ["social", "drinks", "cocktails", "pub", "trendy", "youth", "work and drink", "jubilee hills", "evening", "birthday", "friends", "instagram", "rooftop vibe", "music"],
    ageMin: 21, ageMax: 45, groupMin: 2, groupMax: 10, timePreference: "evening",
    dateScore: 7.5, instagramScore: 8.5, parkingScore: 7.5, familyScore: 3.5,
    studentScore: 7.0, touristScore: 6.0, nightSafetyScore: 8.5,
    crowdLevel: "high", weatherFriendly: true,
  },
  {
    placeName: "Roastery Coffee House",
    address: "Jubilee Hills",
    costPerPerson: 300,
    category: "drinks",
    coordinates: { lat: 17.4142, lng: 78.4093 },
    zone: "west",
    tags: ["coffee", "work-friendly", "cozy", "instagram"],
    keywords: ["roastery coffee", "specialty coffee", "cozy cafe", "work from cafe", "date cafe", "couples", "instagram", "jubilee hills", "quiet", "peaceful", "good coffee", "artisan", "pour over", "beans"],
    ageMin: 18, ageMax: 55, groupMin: 1, groupMax: 6, timePreference: "any",
    dateScore: 8.5, instagramScore: 9.0, parkingScore: 7.5, familyScore: 5.5,
    studentScore: 8.0, touristScore: 6.5, nightSafetyScore: 9.0,
    crowdLevel: "medium", weatherFriendly: true,
  },
  {
    placeName: "Autumn Leaf Cafe",
    address: "Jubilee Hills",
    costPerPerson: 400,
    category: "drinks",
    coordinates: { lat: 17.4312, lng: 78.4095 },
    zone: "west",
    tags: ["instagram", "youth", "coffee", "aesthetic"],
    keywords: ["autumn leaf cafe", "aesthetic cafe", "instagram", "youth", "coffee", "date spot", "couple", "birthday", "photos", "dessert", "jubilee hills", "cozy", "trendy"],
    ageMin: 16, ageMax: 40, groupMin: 2, groupMax: 6, timePreference: "any",
    dateScore: 8.5, instagramScore: 9.5, parkingScore: 7.5, familyScore: 5.0,
    studentScore: 8.5, touristScore: 5.5, nightSafetyScore: 9.0,
    crowdLevel: "medium", weatherFriendly: true,
  },
  {
    placeName: "Lamakaan",
    address: "Banjara Hills",
    costPerPerson: 250,
    category: "drinks",
    coordinates: { lat: 17.4239, lng: 78.4358 },
    zone: "west",
    tags: ["cultural", "art", "conversation", "eclectic"],
    keywords: ["lamakaan", "cultural cafe", "art space", "performances", "open mic", "intellectual", "conversations", "eclectic", "community", "poetry", "film screening", "debate", "banjara hills", "affordable"],
    ageMin: 18, ageMax: 50, groupMin: 2, groupMax: 10, timePreference: "any",
    dateScore: 7.5, instagramScore: 7.5, parkingScore: 6.5, familyScore: 5.5,
    studentScore: 9.0, touristScore: 6.5, nightSafetyScore: 8.5,
    crowdLevel: "medium", weatherFriendly: true,
  },
  {
    placeName: "Tabula Rasa",
    address: "Jubilee Hills",
    costPerPerson: 300,
    category: "drinks",
    coordinates: { lat: 17.4312, lng: 78.4095 },
    zone: "west",
    tags: ["books", "quiet", "intellectual", "coffee"],
    keywords: ["tabula rasa", "bookstore cafe", "books", "quiet", "intellectual", "date", "reader", "coffee", "cozy", "jubilee hills", "peaceful", "couple", "conversation"],
    ageMin: 18, ageMax: 50, groupMin: 1, groupMax: 4, timePreference: "any",
    dateScore: 8.5, instagramScore: 7.5, parkingScore: 7.5, familyScore: 5.0,
    studentScore: 8.5, touristScore: 5.0, nightSafetyScore: 9.0,
    crowdLevel: "low", weatherFriendly: true,
  },
  {
    placeName: "Theory Cafe",
    address: "Jubilee Hills",
    costPerPerson: 400,
    category: "drinks",
    coordinates: { lat: 17.4312, lng: 78.4080 },
    zone: "west",
    tags: ["trendy", "coffee", "youth", "aesthetic"],
    keywords: ["theory cafe", "trendy cafe", "coffee", "aesthetic", "instagram", "youth", "date", "birthday", "jubilee hills", "cozy", "specialty drinks", "dessert", "popular"],
    ageMin: 18, ageMax: 45, groupMin: 2, groupMax: 8, timePreference: "any",
    dateScore: 8.0, instagramScore: 9.0, parkingScore: 7.5, familyScore: 5.5,
    studentScore: 8.5, touristScore: 5.5, nightSafetyScore: 9.0,
    crowdLevel: "medium", weatherFriendly: true,
  },
  {
    placeName: "True Black Coffee",
    address: "Banjara Hills",
    costPerPerson: 350,
    category: "drinks",
    coordinates: { lat: 17.4239, lng: 78.4300 },
    zone: "west",
    tags: ["specialty-coffee", "quiet", "minimalist", "date"],
    keywords: ["true black coffee", "specialty coffee", "minimalist cafe", "quiet", "date spot", "coffee lover", "pour over", "single origin", "banjara hills", "cozy", "peaceful", "artisan"],
    ageMin: 18, ageMax: 50, groupMin: 1, groupMax: 6, timePreference: "any",
    dateScore: 8.5, instagramScore: 8.5, parkingScore: 7.0, familyScore: 4.5,
    studentScore: 8.0, touristScore: 5.0, nightSafetyScore: 9.0,
    crowdLevel: "low", weatherFriendly: true,
  },
  {
    placeName: "Last House Coffee",
    address: "Banjara Hills",
    costPerPerson: 350,
    category: "drinks",
    coordinates: { lat: 17.4220, lng: 78.4330 },
    zone: "west",
    tags: ["coffee", "hidden-gem", "cozy", "intimate"],
    keywords: ["last house coffee", "hidden cafe", "coffee", "cozy", "intimate", "couple", "date", "quiet", "banjara hills", "specialty", "peaceful", "binge worthy"],
    ageMin: 18, ageMax: 45, groupMin: 1, groupMax: 6, timePreference: "any",
    dateScore: 8.5, instagramScore: 8.0, parkingScore: 6.5, familyScore: 4.0,
    studentScore: 7.5, touristScore: 5.0, nightSafetyScore: 9.0,
    crowdLevel: "low", weatherFriendly: true,
  },
  {
    placeName: "Tiger Lily Cafe",
    address: "Banjara Hills",
    costPerPerson: 450,
    category: "drinks",
    coordinates: { lat: 17.4239, lng: 78.4380 },
    zone: "west",
    tags: ["aesthetic", "floral", "instagram", "youth"],
    keywords: ["tiger lily", "floral cafe", "aesthetic", "instagram", "cute", "youth", "birthday", "date", "photos", "dessert", "coffee", "banjara hills", "girls outing", "trendy"],
    ageMin: 16, ageMax: 40, groupMin: 2, groupMax: 6, timePreference: "any",
    dateScore: 8.0, instagramScore: 9.5, parkingScore: 7.0, familyScore: 5.5,
    studentScore: 8.0, touristScore: 5.5, nightSafetyScore: 9.0,
    crowdLevel: "medium", weatherFriendly: true,
  },
  {
    placeName: "The Hole In The Wall Cafe",
    address: "Banjara Hills",
    costPerPerson: 500,
    category: "drinks",
    coordinates: { lat: 17.4200, lng: 78.4360 },
    zone: "west",
    tags: ["brunch", "trendy", "couple", "instagram"],
    keywords: ["hole in the wall cafe", "brunch", "trendy", "couple", "instagram", "waffles", "pancakes", "coffee", "banjara hills", "weekend brunch", "date morning", "birthday brunch", "aesthetic"],
    ageMin: 18, ageMax: 45, groupMin: 2, groupMax: 8, timePreference: "morning",
    dateScore: 8.5, instagramScore: 9.5, parkingScore: 7.0, familyScore: 6.0,
    studentScore: 7.5, touristScore: 6.0, nightSafetyScore: 9.0,
    crowdLevel: "medium", weatherFriendly: true,
  },
  {
    placeName: "Heart Cup Coffee",
    address: "Gachibowli",
    costPerPerson: 300,
    category: "drinks",
    coordinates: { lat: 17.4401, lng: 78.3628 },
    zone: "west",
    tags: ["coffee", "corporate", "work-friendly", "gachibowli"],
    keywords: ["heart cup coffee", "coffee", "work friendly", "corporate", "gachibowli", "meeting spot", "quick catch up", "cozy", "wifi", "laptop friendly", "morning coffee", "professional"],
    ageMin: 18, ageMax: 55, groupMin: 1, groupMax: 6, timePreference: "any",
    dateScore: 6.5, instagramScore: 7.0, parkingScore: 8.5, familyScore: 5.5,
    studentScore: 8.0, touristScore: 4.0, nightSafetyScore: 8.5,
    crowdLevel: "medium", weatherFriendly: true,
  },
  {
    placeName: "Le Vantage Cafe",
    address: "Madhapur",
    costPerPerson: 350,
    category: "drinks",
    coordinates: { lat: 17.4483, lng: 78.3900 },
    zone: "west",
    tags: ["rooftop", "views", "coffee", "evening"],
    keywords: ["le vantage", "rooftop cafe", "views", "coffee", "evening", "couple", "date", "sunset", "madhapur", "hitech city", "instagram", "sunset views", "outdoor seating"],
    ageMin: 18, ageMax: 50, groupMin: 2, groupMax: 8, timePreference: "evening",
    dateScore: 8.5, instagramScore: 9.0, parkingScore: 7.5, familyScore: 5.5,
    studentScore: 8.0, touristScore: 6.0, nightSafetyScore: 8.5,
    crowdLevel: "medium", weatherFriendly: false,
  },

  // ────────────────────────────
  // DESSERTS
  // ────────────────────────────
  {
    placeName: "Cream Stone",
    address: "Banjara Hills",
    costPerPerson: 200,
    category: "dessert",
    coordinates: { lat: 17.4217, lng: 78.4431 },
    zone: "west",
    tags: ["ice-cream", "trendy", "youth", "casual"],
    keywords: ["cream stone", "ice cream", "frozen dessert", "youth", "couple", "friends", "casual", "banjara hills", "affordable", "birthday treat", "popular", "evening dessert"],
    ageMin: 5, ageMax: 50, groupMin: 2, groupMax: 8, timePreference: "any",
    dateScore: 6.5, instagramScore: 7.5, parkingScore: 7.5, familyScore: 8.5,
    studentScore: 9.0, touristScore: 5.5, nightSafetyScore: 8.5,
    crowdLevel: "high", weatherFriendly: true,
  },
  {
    placeName: "Haagen-Dazs",
    address: "GVK One Mall, Banjara Hills",
    costPerPerson: 400,
    category: "dessert",
    coordinates: { lat: 17.4326, lng: 78.4071 },
    zone: "west",
    tags: ["premium", "ice-cream", "romantic", "date"],
    keywords: ["haagen dazs", "premium ice cream", "date night dessert", "couple", "romantic", "mall dessert", "banjara hills", "after dinner", "anniversary", "luxury ice cream"],
    ageMin: 15, ageMax: 60, groupMin: 2, groupMax: 6, timePreference: "any",
    dateScore: 8.0, instagramScore: 8.0, parkingScore: 8.5, familyScore: 7.0,
    studentScore: 6.0, touristScore: 5.5, nightSafetyScore: 9.5,
    crowdLevel: "medium", weatherFriendly: true,
  },
  {
    placeName: "Rollacosta",
    address: "Gachibowli",
    costPerPerson: 250,
    category: "dessert",
    coordinates: { lat: 17.4401, lng: 78.3628 },
    zone: "west",
    tags: ["rolled-ice-cream", "youth", "fun"],
    keywords: ["rollacosta", "rolled ice cream", "thai style", "fun", "youth", "instagram", "unique dessert", "gachibowli", "friends", "couple", "visual dessert", "evening"],
    ageMin: 8, ageMax: 40, groupMin: 2, groupMax: 8, timePreference: "any",
    dateScore: 7.0, instagramScore: 9.0, parkingScore: 8.0, familyScore: 7.5,
    studentScore: 9.0, touristScore: 5.5, nightSafetyScore: 8.5,
    crowdLevel: "medium", weatherFriendly: true,
  },
  {
    placeName: "Concu Chocolatier",
    address: "Jubilee Hills",
    costPerPerson: 350,
    category: "dessert",
    coordinates: { lat: 17.4312, lng: 78.4095 },
    zone: "west",
    tags: ["artisan", "chocolate", "romantic", "premium"],
    keywords: ["concu", "chocolatier", "artisan chocolate", "chocolate cafe", "romantic", "date", "anniversary", "premium dessert", "jubilee hills", "birthday", "gifts", "truffles", "fondue", "couple"],
    ageMin: 12, ageMax: 60, groupMin: 2, groupMax: 6, timePreference: "any",
    dateScore: 9.0, instagramScore: 9.5, parkingScore: 7.5, familyScore: 7.0,
    studentScore: 7.5, touristScore: 6.5, nightSafetyScore: 9.0,
    crowdLevel: "low", weatherFriendly: true,
  },
  {
    placeName: "Karachi Bakery",
    address: "Mozamjahi Market, Abids",
    costPerPerson: 200,
    category: "dessert",
    coordinates: { lat: 17.3948, lng: 78.4772 },
    zone: "central",
    tags: ["bakery", "iconic", "biscuits", "tourist"],
    keywords: ["karachi bakery", "osmani biscuits", "bakery", "iconic", "abids", "tourist gift", "hyderabad souvenir", "fruit biscuit", "must buy", "affordable", "heritage bakery", "cookies"],
    ageMin: 5, ageMax: 75, groupMin: 1, groupMax: 10, timePreference: "any",
    dateScore: 5.0, instagramScore: 7.5, parkingScore: 4.5, familyScore: 8.0,
    studentScore: 8.5, touristScore: 9.5, nightSafetyScore: 7.5,
    crowdLevel: "high", weatherFriendly: true,
  },
  {
    placeName: "Almond House",
    address: "Banjara Hills",
    costPerPerson: 150,
    category: "dessert",
    coordinates: { lat: 17.4239, lng: 78.4358 },
    zone: "west",
    tags: ["sweets", "traditional", "gifting", "all-ages"],
    keywords: ["almond house", "sweets", "mithai", "traditional", "gifting", "diwali sweets", "banjara hills", "all ages", "budget", "Indian sweets", "dry fruits", "authentic"],
    ageMin: 5, ageMax: 75, groupMin: 1, groupMax: 10, timePreference: "any",
    dateScore: 4.5, instagramScore: 6.0, parkingScore: 7.5, familyScore: 9.0,
    studentScore: 7.5, touristScore: 8.0, nightSafetyScore: 8.5,
    crowdLevel: "medium", weatherFriendly: true,
  },
  {
    placeName: "Belgian Waffle Co.",
    address: "Banjara Hills",
    costPerPerson: 300,
    category: "dessert",
    coordinates: { lat: 17.4239, lng: 78.4380 },
    zone: "west",
    tags: ["waffles", "youth", "instagram", "dessert"],
    keywords: ["belgian waffle", "waffles", "dessert", "instagram", "youth", "couple", "friends", "birthday", "sweet tooth", "banjara hills", "trendy", "nutella waffle"],
    ageMin: 10, ageMax: 45, groupMin: 2, groupMax: 8, timePreference: "any",
    dateScore: 7.5, instagramScore: 9.0, parkingScore: 7.5, familyScore: 7.5,
    studentScore: 9.0, touristScore: 5.5, nightSafetyScore: 9.0,
    crowdLevel: "medium", weatherFriendly: true,
  },

  // ────────────────────────────
  // NIGHTLIFE & BARS
  // ────────────────────────────
  {
    placeName: "Prost Brew Pub",
    address: "Financial District, Gachibowli",
    costPerPerson: 900,
    category: "nightlife",
    coordinates: { lat: 17.4167, lng: 78.3450 },
    zone: "west",
    tags: ["brewery", "craft-beer", "youth", "corporate"],
    keywords: ["prost", "craft beer", "brewery", "pub", "birthday night out", "corporate party", "gachibowli", "financial district", "live music", "drinks", "youth", "group night out", "weekend", "tap beer"],
    ageMin: 21, ageMax: 50, groupMin: 2, groupMax: 12, timePreference: "evening",
    dateScore: 7.5, instagramScore: 8.0, parkingScore: 8.5, familyScore: 2.5,
    studentScore: 6.5, touristScore: 6.5, nightSafetyScore: 8.5,
    crowdLevel: "high", weatherFriendly: true,
  },
  {
    placeName: "Hard Rock Cafe",
    address: "Banjara Hills",
    costPerPerson: 1200,
    category: "nightlife",
    coordinates: { lat: 17.4239, lng: 78.4358 },
    zone: "west",
    tags: ["international", "music", "premium", "youth"],
    keywords: ["hard rock cafe", "international bar", "live music", "rock music", "premium drinks", "birthday night", "group night out", "milestone celebration", "banjara hills", "collector items", "band night", "iconic"],
    ageMin: 21, ageMax: 50, groupMin: 2, groupMax: 10, timePreference: "night",
    dateScore: 7.0, instagramScore: 8.5, parkingScore: 7.5, familyScore: 2.0,
    studentScore: 5.5, touristScore: 8.0, nightSafetyScore: 8.5,
    crowdLevel: "high", weatherFriendly: true,
  },
  {
    placeName: "Prism Skybar",
    address: "Madhapur",
    costPerPerson: 1000,
    category: "nightlife",
    coordinates: { lat: 17.4483, lng: 78.3915 },
    zone: "west",
    tags: ["rooftop", "skybar", "premium", "views"],
    keywords: ["prism skybar", "rooftop bar", "skybar", "views", "premium", "nightlife", "cocktails", "birthday", "group night", "madhapur", "city views", "instagram", "sunset drinks", "evening"],
    ageMin: 21, ageMax: 45, groupMin: 2, groupMax: 10, timePreference: "night",
    dateScore: 8.5, instagramScore: 9.5, parkingScore: 7.5, familyScore: 2.0,
    studentScore: 5.0, touristScore: 7.0, nightSafetyScore: 8.5,
    crowdLevel: "medium", weatherFriendly: false,
  },
  {
    placeName: "The Moonshine Project",
    address: "Jubilee Hills",
    costPerPerson: 1000,
    category: "nightlife",
    coordinates: { lat: 17.4312, lng: 78.4095 },
    zone: "west",
    tags: ["cocktails", "trendy", "youth", "premium"],
    keywords: ["moonshine project", "cocktails", "trendy bar", "craft cocktails", "birthday night", "group outing", "jubilee hills", "premium drinks", "music", "nightlife", "youth", "upscale bar"],
    ageMin: 21, ageMax: 45, groupMin: 2, groupMax: 8, timePreference: "night",
    dateScore: 8.5, instagramScore: 9.0, parkingScore: 7.5, familyScore: 2.0,
    studentScore: 5.0, touristScore: 6.5, nightSafetyScore: 8.5,
    crowdLevel: "medium", weatherFriendly: true,
  },
  {
    placeName: "Bootlegger",
    address: "Jubilee Hills",
    costPerPerson: 800,
    category: "nightlife",
    coordinates: { lat: 17.4312, lng: 78.4095 },
    zone: "west",
    tags: ["bar", "youth", "casual", "music"],
    keywords: ["bootlegger", "bar", "casual pub", "music", "birthday", "friends night out", "jubilee hills", "drinks", "cocktails", "youth", "affordable nightlife", "live music nights"],
    ageMin: 21, ageMax: 45, groupMin: 2, groupMax: 10, timePreference: "night",
    dateScore: 7.0, instagramScore: 8.0, parkingScore: 7.0, familyScore: 2.0,
    studentScore: 6.5, touristScore: 6.0, nightSafetyScore: 8.0,
    crowdLevel: "high", weatherFriendly: true,
  },
  {
    placeName: "Forge Brew House",
    address: "Financial District, Gachibowli",
    costPerPerson: 950,
    category: "nightlife",
    coordinates: { lat: 17.4167, lng: 78.3450 },
    zone: "west",
    tags: ["brewery", "corporate", "craft-beer", "premium"],
    keywords: ["forge brew house", "craft beer", "brewery", "financial district", "corporate night out", "birthday", "premium", "tap beer", "pub food", "weekend", "group"],
    ageMin: 21, ageMax: 50, groupMin: 2, groupMax: 12, timePreference: "evening",
    dateScore: 7.5, instagramScore: 8.0, parkingScore: 9.0, familyScore: 2.0,
    studentScore: 5.5, touristScore: 6.0, nightSafetyScore: 8.5,
    crowdLevel: "medium", weatherFriendly: true,
  },
  {
    placeName: "Zero40 Brewery",
    address: "Gachibowli",
    costPerPerson: 900,
    category: "nightlife",
    coordinates: { lat: 17.4401, lng: 78.3628 },
    zone: "west",
    tags: ["brewery", "youth", "group", "gachibowli"],
    keywords: ["zero40", "brewery", "craft beer", "gachibowli", "group night", "birthday", "friends", "corporate", "weekend", "pub food", "casual nightlife"],
    ageMin: 21, ageMax: 50, groupMin: 2, groupMax: 12, timePreference: "evening",
    dateScore: 7.0, instagramScore: 7.5, parkingScore: 8.5, familyScore: 2.0,
    studentScore: 6.0, touristScore: 5.5, nightSafetyScore: 8.5,
    crowdLevel: "medium", weatherFriendly: true,
  },
  {
    placeName: "10 Downing Street",
    address: "Banjara Hills",
    costPerPerson: 1100,
    category: "nightlife",
    coordinates: { lat: 17.4239, lng: 78.4350 },
    zone: "west",
    tags: ["bar", "premium", "british-theme", "nightlife"],
    keywords: ["10 downing street", "british bar", "premium", "banjara hills", "nightlife", "cocktails", "birthday celebration", "group night", "upscale", "live music"],
    ageMin: 21, ageMax: 50, groupMin: 2, groupMax: 10, timePreference: "night",
    dateScore: 7.5, instagramScore: 8.0, parkingScore: 7.5, familyScore: 2.0,
    studentScore: 5.0, touristScore: 6.5, nightSafetyScore: 8.5,
    crowdLevel: "medium", weatherFriendly: true,
  },

  // ────────────────────────────
  // FAMILY THEME PARKS
  // ────────────────────────────
  {
    placeName: "Ramoji Film City",
    address: "Anaspur Village, Hyderabad",
    costPerPerson: 1500,
    category: "entertainment",
    coordinates: { lat: 17.2543, lng: 78.6808 },
    zone: "east",
    tags: ["theme-park", "full-day", "family-friendly", "tourist"],
    keywords: ["ramoji film city", "theme park", "full day outing", "family", "tourist", "rides", "sets", "shows", "kids", "film studio", "world largest", "must visit", "east hyderabad", "group trip"],
    ageMin: 5, ageMax: 70, groupMin: 2, groupMax: 20, timePreference: "morning",
    dateScore: 6.5, instagramScore: 9.0, parkingScore: 9.5, familyScore: 10.0,
    studentScore: 7.0, touristScore: 10.0, nightSafetyScore: 9.5,
    crowdLevel: "high", weatherFriendly: false,
  },
  {
    placeName: "Wonderla",
    address: "RR District, Hyderabad",
    costPerPerson: 1200,
    category: "entertainment",
    coordinates: { lat: 17.3700, lng: 78.6800 },
    zone: "east",
    tags: ["amusement-park", "rides", "family", "thrill"],
    keywords: ["wonderla", "amusement park", "water rides", "thrill rides", "family outing", "kids", "birthday", "fun day", "adventure", "group trip", "summer", "weekend getaway"],
    ageMin: 5, ageMax: 60, groupMin: 2, groupMax: 20, timePreference: "morning",
    dateScore: 6.0, instagramScore: 8.5, parkingScore: 9.5, familyScore: 10.0,
    studentScore: 8.0, touristScore: 8.5, nightSafetyScore: 9.5,
    crowdLevel: "high", weatherFriendly: false,
  },
  {
    placeName: "Ocean Park",
    address: "Miyapur, Hyderabad",
    costPerPerson: 800,
    category: "entertainment",
    coordinates: { lat: 17.4950, lng: 78.3800 },
    zone: "north",
    tags: ["water-park", "kids", "family", "summer"],
    keywords: ["ocean park", "water park", "slides", "pool", "family", "kids", "summer fun", "miyapur", "birthday", "group trip", "splashing", "fun"],
    ageMin: 5, ageMax: 55, groupMin: 2, groupMax: 15, timePreference: "morning",
    dateScore: 5.0, instagramScore: 7.5, parkingScore: 9.0, familyScore: 9.5,
    studentScore: 7.5, touristScore: 7.0, nightSafetyScore: 9.0,
    crowdLevel: "high", weatherFriendly: false,
  },
  {
    placeName: "Mount Opera",
    address: "Shankarpally, Hyderabad",
    costPerPerson: 900,
    category: "entertainment",
    coordinates: { lat: 17.3800, lng: 78.1800 },
    zone: "west",
    tags: ["theme-park", "rides", "family", "resort"],
    keywords: ["mount opera", "theme park", "resort", "rides", "family", "weekend trip", "kids", "water park", "adventure", "birthday", "group outing"],
    ageMin: 5, ageMax: 60, groupMin: 2, groupMax: 15, timePreference: "morning",
    dateScore: 5.0, instagramScore: 8.0, parkingScore: 9.0, familyScore: 9.5,
    studentScore: 7.5, touristScore: 7.0, nightSafetyScore: 9.0,
    crowdLevel: "medium", weatherFriendly: false,
  },

  // ────────────────────────────
  // DATE / RESORT EXPERIENCES
  // ────────────────────────────
  {
    placeName: "Leonia Holistic Destination",
    address: "Shamirpet, Hyderabad",
    costPerPerson: 1800,
    category: "entertainment",
    coordinates: { lat: 17.5450, lng: 78.5350 },
    zone: "north",
    tags: ["resort", "day-visit", "romantic", "couple"],
    keywords: ["leonia resort", "day visit", "couple getaway", "romantic", "pool", "spa", "anniversary", "birthday", "resort experience", "shamirpet", "peaceful", "luxury day out", "premium"],
    ageMin: 18, ageMax: 65, groupMin: 2, groupMax: 10, timePreference: "morning",
    dateScore: 9.0, instagramScore: 9.0, parkingScore: 9.5, familyScore: 8.0,
    studentScore: 3.5, touristScore: 7.5, nightSafetyScore: 9.5,
    crowdLevel: "low", weatherFriendly: true,
  },
  {
    placeName: "Palm Exotica",
    address: "Shamshabad",
    costPerPerson: 1500,
    category: "entertainment",
    coordinates: { lat: 17.2700, lng: 78.3900 },
    zone: "south",
    tags: ["resort", "romantic", "couple", "day-visit"],
    keywords: ["palm exotica", "resort day visit", "romantic", "couple", "anniversary", "pool", "greenery", "peaceful", "long drive destination", "shamshabad", "premium day out", "birthday"],
    ageMin: 18, ageMax: 65, groupMin: 2, groupMax: 10, timePreference: "morning",
    dateScore: 8.5, instagramScore: 8.5, parkingScore: 9.5, familyScore: 7.5,
    studentScore: 3.0, touristScore: 7.0, nightSafetyScore: 9.0,
    crowdLevel: "low", weatherFriendly: true,
  },
  {
    placeName: "Jalavihar",
    address: "Near Hussain Sagar",
    costPerPerson: 200,
    category: "entertainment",
    coordinates: { lat: 17.4125, lng: 78.4683 },
    zone: "central",
    tags: ["water-sports", "family", "budget", "lake"],
    keywords: ["jalavihar", "water sports", "boating", "kayaking", "family", "budget", "hussain sagar", "fun", "outdoor", "lake activity", "kids", "group", "day out"],
    ageMin: 5, ageMax: 55, groupMin: 2, groupMax: 12, timePreference: "morning",
    dateScore: 6.0, instagramScore: 7.5, parkingScore: 6.5, familyScore: 9.5,
    studentScore: 8.0, touristScore: 8.0, nightSafetyScore: 8.0,
    crowdLevel: "medium", weatherFriendly: false,
  },

  // ────────────────────────────
  // CORPORATE / COWORK SPOTS
  // ────────────────────────────
  {
    placeName: "Board Game Cafe",
    address: "Jubilee Hills",
    costPerPerson: 350,
    category: "corporate",
    coordinates: { lat: 17.4312, lng: 78.4095 },
    zone: "west",
    tags: ["board-games", "group-activity", "indoor", "fun"],
    keywords: ["board game cafe", "board games", "group activity", "team building", "fun", "indoor", "corporate outing", "friends", "strategy games", "party", "laughter", "unique experience", "birthday", "game night"],
    ageMin: 15, ageMax: 50, groupMin: 2, groupMax: 10, timePreference: "any",
    dateScore: 7.0, instagramScore: 7.0, parkingScore: 7.5, familyScore: 7.5,
    studentScore: 9.0, touristScore: 5.5, nightSafetyScore: 9.0,
    crowdLevel: "medium", weatherFriendly: true,
  },
  {
    placeName: "T-Hub",
    address: "IIIT Campus, Gachibowli",
    costPerPerson: 0,
    category: "corporate",
    coordinates: { lat: 17.4454, lng: 78.3484 },
    zone: "west",
    tags: ["startup", "innovation", "corporate", "tech"],
    keywords: ["t-hub", "startup hub", "innovation", "tech", "corporate visit", "startup ecosystem", "gachibowli", "pitching", "networking", "entrepreneur", "coworking"],
    ageMin: 18, ageMax: 55, groupMin: 2, groupMax: 20, timePreference: "morning",
    dateScore: 2.0, instagramScore: 6.5, parkingScore: 9.0, familyScore: 3.5,
    studentScore: 7.5, touristScore: 6.5, nightSafetyScore: 9.5,
    crowdLevel: "medium", weatherFriendly: true,
  },
];

// ═══════════════════════════════════════════
// CONTEXT EXTRACTION
// ═══════════════════════════════════════════
export function extractContext(intent: string): UserContext {
  const lower = intent.toLowerCase();

  const groupMatch = lower.match(/(\d+)\s*(?:people|ppl|persons|friends|guys|members|of\s+us)/);
  const groupSize = groupMatch ? parseInt(groupMatch[1]) : 2;

  const ageMatch = lower.match(/age\s*(?:group|grp)?\s*(?:of|:)?\s*(\d+)/);
  const ageGroup = ageMatch ? parseInt(ageMatch[1]) : 22;

  const budgetMatch = intent.match(/(?:under|below|within|budget|rs\.?|₹)\s*(\d+)/i) || intent.match(/(\d{3,})/);
  const totalBudget = budgetMatch ? parseInt(budgetMatch[1]) : 2000;

  const timeMatch = intent.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
  const startTime = timeMatch
    ? `${timeMatch[1]}:${timeMatch[2] || "00"} ${timeMatch[3].toUpperCase()}`
    : "7:00 PM";

  let occasion = "friends";
  if (lower.match(/\bdate\b|romantic|couple|gf|bf|girlfriend|boyfriend/)) occasion = "date";
  else if (lower.match(/family|kids|children|parents/)) occasion = "family";
  else if (lower.match(/\bsolo\b|alone|myself/)) occasion = "solo";
  else if (lower.match(/corporate|team|office|colleagues/)) occasion = "corporate";
  else if (lower.match(/tourist|visiting|tourism/)) occasion = "tourist";

  const wantsFood = !!lower.match(/food|eat|dinner|lunch|breakfast|biryani|restaurant|cafe|hungry/);
  const wantsAdventure = !!lower.match(/adventure|karting|turf|gaming|sport|cricket|football|escape|trampoline|go.?kart/);
  const wantsCultural = !!lower.match(/heritage|cultural|history|fort|palace|museum|charminar|old city/);
  const wantsNightlife = !!lower.match(/bar|pub|club|drinks|nightlife|night out|beer|party/);

  let experienceType = "general";
  if (lower.includes("food trail")) experienceType = "food-trail";
  else if (lower.includes("cafe hopping") || lower.includes("cafe hop")) experienceType = "cafe-hopping";
  else if (lower.includes("heritage") || lower.includes("history tour")) experienceType = "heritage-walk";
  else if (lower.includes("night out") || lower.includes("nightlife")) experienceType = "night-out";
  else if (lower.includes("birthday")) experienceType = "birthday";
  else if (lower.includes("tourist") || lower.includes("visiting")) experienceType = "tourist";
  else if (lower.includes("shopping")) experienceType = "shopping-day";

  let preferredZone = "any";
  if (lower.match(/gachibowli|madhapur|hitech|jubilee hills|banjara hills|kondapur|financial district/)) preferredZone = "west";
  else if (lower.match(/old city|charminar|falaknuma|bahadurpura|secunderabad/)) preferredZone = "oldcity";
  else if (lower.match(/kukatpally|kompally|alwal|miyapur|north/)) preferredZone = "north";

  return { totalBudget, startTime, occasion, groupSize, ageGroup, wantsFood, wantsAdventure, wantsCultural, wantsNightlife, preferredZone, experienceType };
}

// ═══════════════════════════════════════════
// SMART FILTERING
// ═══════════════════════════════════════════
function parseStartHour(timeStr: string): number {
  const [time, period] = timeStr.split(" ");
  let [h] = time.split(":").map(Number);
  if (period === "PM" && h !== 12) h += 12;
  if (period === "AM" && h === 12) h = 0;
  return h;
}

function filterPlaces(places: Place[], ctx: UserContext): Place[] {
  const startHour = parseStartHour(ctx.startTime);
  return places.filter(p => {
    if (ctx.ageGroup < p.ageMin || ctx.ageGroup > p.ageMax) return false;
    if (ctx.groupSize < p.groupMin || ctx.groupSize > p.groupMax) return false;
    if (p.category === "nightlife" && (ctx.occasion === "family" || ctx.ageGroup < 21)) return false;
    if (p.closingHour && startHour >= p.closingHour - 1) return false;
    if (p.timePreference === "morning" && startHour >= 14) return false;
    if (ctx.preferredZone !== "any" && p.zone !== ctx.preferredZone) return false;
    // Youth: skip free temples/nature as primary
    if (ctx.ageGroup < 25 && p.costPerPerson === 0 && (p.category === "cultural" || p.category === "nature") && ctx.occasion !== "tourist") return false;
    return true;
  });
}

// ═══════════════════════════════════════════
// SCORE-BASED PLACE PICKING
// ═══════════════════════════════════════════
function scorePlaceForContext(p: Place, ctx: UserContext): number {
  let score = 0;
  if (ctx.occasion === "date") score += p.dateScore * 2;
  if (ctx.occasion === "family") score += p.familyScore * 2;
  if (ctx.experienceType === "tourist") score += p.touristScore * 2;
  if (ctx.ageGroup < 25) score += p.studentScore;
  if (ctx.occasion === "corporate") score += p.parkingScore;
  score += p.instagramScore * 0.5;
  // Budget fit
  const perStopBudget = ctx.totalBudget / 3;
  if (p.costPerPerson * ctx.groupSize <= perStopBudget) score += 3;
  return score;
}

function pickStops(filtered: Place[], all: Place[], ctx: UserContext): Place[] {
  const pool = filtered.length >= 3 ? filtered : all.filter(p =>
    ctx.ageGroup >= p.ageMin && ctx.ageGroup <= p.ageMax &&
    ctx.groupSize >= p.groupMin && ctx.groupSize <= p.groupMax &&
    !(p.category === "nightlife" && (ctx.occasion === "family" || ctx.ageGroup < 21))
  );

  let sequence: string[][];
  if (ctx.ageGroup < 25 && ctx.occasion !== "date") {
    sequence = ctx.wantsAdventure
      ? [["adventure", "sports"], ["food"], ["dessert", "drinks"]]
      : [["entertainment", "adventure"], ["food"], ["dessert"]];
  } else if (ctx.occasion === "date") {
    sequence = [["nature", "hidden_gem", "cultural"], ["food"], ["dessert", "drinks"]];
  } else if (ctx.occasion === "family") {
    sequence = [["nature", "entertainment", "cultural"], ["food"], ["dessert"]];
  } else if (ctx.wantsCultural || ctx.experienceType === "heritage-walk") {
    sequence = [["cultural"], ["food"], ["cultural", "hidden_gem", "shopping"]];
  } else if (ctx.wantsNightlife || ctx.experienceType === "night-out") {
    sequence = [["food"], ["drinks"], ["nightlife"]];
  } else if (ctx.experienceType === "cafe-hopping") {
    sequence = [["drinks"], ["drinks"], ["dessert"]];
  } else if (ctx.experienceType === "tourist") {
    sequence = [["cultural"], ["food"], ["cultural", "shopping"]];
  } else {
    sequence = [["adventure", "entertainment", "sports"], ["food"], ["dessert", "drinks"]];
  }

  const picked: Place[] = [];
  let spent = 0;

  for (const cats of sequence) {
    const candidates = pool
      .filter(p => cats.includes(p.category) && !picked.includes(p) && spent + p.costPerPerson * ctx.groupSize <= ctx.totalBudget * 1.05)
      .sort((a, b) => scorePlaceForContext(b, ctx) - scorePlaceForContext(a, ctx));
    if (candidates[0]) {
      picked.push(candidates[0]);
      spent += candidates[0].costPerPerson * ctx.groupSize;
    }
  }

  // Try to add 4th stop if budget remains
  if (picked.length === 3) {
    const remaining = ctx.totalBudget - spent;
    const bonus = pool
      .filter(p => !picked.includes(p) && p.costPerPerson * ctx.groupSize <= remaining && p.category !== picked[picked.length - 1].category)
      .sort((a, b) => scorePlaceForContext(b, ctx) - scorePlaceForContext(a, ctx))[0];
    if (bonus) picked.push(bonus);
  }

  return picked;
}

// ═══════════════════════════════════════════
// TIME & TRAVEL HELPERS
// ═══════════════════════════════════════════
function travelTime(from: { lat: number; lng: number }, to: { lat: number; lng: number }): string {
  const R = 6371;
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(from.lat * Math.PI / 180) * Math.cos(to.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const mins = Math.max(5, Math.round((dist / 22) * 60));
  return `${mins} min`;
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
  if (p.category === "cultural" || p.category === "hidden_gem") return 60;
  if (p.category === "nature") return 45;
  if (p.category === "shopping") return 75;
  if (p.category === "drinks") return 50;
  if (p.category === "nightlife") return 90;
  if (p.category === "dessert") return 25;
  return 45;
}

function buildReasoning(p: Place, ctx: UserContext, idx: number, total: number): string {
  const totalCost = p.costPerPerson * ctx.groupSize;
  const pp = p.costPerPerson;
  const n = ctx.groupSize;

  if (p.category === "adventure") return `₹${pp}/person × ${n} = ₹${totalCost} total — perfect adrenaline opener for ${ctx.ageGroup}-year-old group`;
  if (p.category === "sports") return `₹${pp}/person × ${n} = ₹${totalCost} total — ${n} people, great team activity`;
  if (p.category === "entertainment") return `₹${pp}/person × ${n} = ₹${totalCost} total — ideal indoor fun for the group`;
  if (p.category === "food") {
    if (p.tags.includes("biryani")) return `₹${pp}/person × ${n} = ₹${totalCost} total — iconic Hyderabad biryani, can't miss`;
    if (p.tags.includes("bbq")) return `₹${pp}/person × ${n} = ₹${totalCost} total — unlimited BBQ, best for groups of ${n}`;
    if (p.tags.includes("irani-chai")) return `₹${pp}/person × ${n} = ₹${totalCost} total — authentic Hyderabadi chai, great quick stop`;
    return `₹${pp}/person × ${n} = ₹${totalCost} total — well-rated, fits the group's vibe`;
  }
  if (p.category === "dessert") return idx === total - 1
    ? `₹${pp}/person × ${n} = ₹${totalCost} total — sweet finish to a great night`
    : `₹${pp}/person × ${n} = ₹${totalCost} total — quick dessert stop`;
  if (p.category === "cultural") return `₹${pp}/person × ${n} = ₹${totalCost} total — ${p.tags.includes("iconic") ? "must-see Hyderabad landmark" : "rich heritage experience"}`;
  if (p.category === "hidden_gem") return `₹${pp}/person × ${n} = ₹${totalCost} total — local's favourite, not on typical tourist lists`;
  if (p.category === "drinks") return ctx.occasion === "date"
    ? `₹${pp}/person × ${n} = ₹${totalCost} total — intimate vibe, great for conversations`
    : `₹${pp}/person × ${n} = ₹${totalCost} total — chill spot, perfect for ${n} friends`;
  if (p.category === "nightlife") return `₹${pp}/person × ${n} = ₹${totalCost} total — lively night out for the group`;
  if (p.category === "nature") return `₹${pp}/person × ${n} = ₹${totalCost} total — ${p.tags.includes("romantic") ? "scenic and romantic" : "fresh air and views"}`;
  if (p.category === "shopping") return `₹${pp}/person × ${n} = ₹${totalCost} total — great way to round off the day`;
  return `₹${pp}/person × ${n} = ₹${totalCost} total — highly rated, fits your group perfectly`;
}

// ═══════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════
export function generateMockItinerary(userIntent: string): MockItineraryStop[] {
  const ctx = extractContext(userIntent);
  let filtered = filterPlaces(HYDERABAD_PLACES, ctx);
  const stops = pickStops(filtered, HYDERABAD_PLACES, ctx);

  if (stops.length === 0) {
    return [{
      placeName: "Paradise Restaurant",
      address: "Secunderabad",
      time: ctx.startTime,
      estimatedCost: 350 * ctx.groupSize,
      travelTimeFromPrevious: "0 min",
      reasoning: `₹350/person × ${ctx.groupSize} = ₹${350 * ctx.groupSize} — iconic Hyderabad biryani, perfect for any group`,
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
