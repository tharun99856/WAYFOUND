import { useState, useRef } from "react";
import { generateMockItinerary } from "@/lib/mockItinerary";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ItineraryStop {
  id: string;
  place: string;
  placeId?: string;
  location?: google.maps.LatLngLiteral;
  time: string;
  cost: string;
  reasoning: string;
  travelTime?: string;
}

interface GeminiStop {
  placeName: string;
  address: string;
  time: string;
  estimatedCost: number;
  travelTimeFromPrevious: string;
  reasoning: string;
}

// ─── AI System Prompt ─────────────────────────────────────────────────────────

const SYSTEM_INSTRUCTION = `You are Wayfound, Hyderabad's most intelligent real-world planning engine. You have deep knowledge of every neighbourhood, venue, and experience across Hyderabad.

OUTPUT FORMAT — NON-NEGOTIABLE:
Return ONLY a raw JSON array. Zero markdown, zero explanation, zero preamble.
Every item must have EXACTLY: placeName, address, time (12hr AM/PM), estimatedCost (number = TOTAL group spend), travelTimeFromPrevious, reasoning (specific, mention cost math and why this group)

HYDERABAD GEOGRAPHIC ZONES:
WEST: Gachibowli, Financial District, Nanakramguda, Kokapet, Narsingi, Madhapur, Hitech City, Kondapur, Raidurg, Jubilee Hills, Banjara Hills, Manikonda
CENTRAL: Punjagutta, Somajiguda, Begumpet, Ameerpet, Himayatnagar, Basheer Bagh, Abids, Lakdikapul
OLD CITY: Charminar, Laad Bazaar, Pathergatti, Falaknuma, Bahadurpura, Chowmahalla, Mecca Masjid, Salar Jung Museum area
NORTH: Secunderabad, Tarnaka, Malkajgiri, ECIL, AS Rao Nagar, Sainikpuri, Kapra, Kompally, Alwal
SOUTH: Attapur, Rajendranagar, Shamshabad, Gandipet, Chilkur
EAST: Uppal, Habsiguda, Nacharam, Pocharam, LB Nagar, Dilsukhnagar

EXPERIENCE TYPES YOU UNDERSTAND:
FOOD TRAIL | CAFE HOPPING | DATE NIGHT | FAMILY DAY OUT | HERITAGE WALK | STUDENT HANGOUT | SHOPPING DAY | NIGHT OUT | WORKATION | FITNESS DAY | PHOTO WALK | RAINY DAY PLAN | BUDGET DAY OUT | PREMIUM LUXURY | TEAM OUTING | BIRTHDAY PLAN | TOURIST DAY | SOLO EXPLORATION

PLACES DATABASE (real, verified, operational):
SHOPPING: Inorbit Mall (Madhapur), GVK One (Banjara Hills), Forum Sujana City (Kukatpally), Sarath City Capital Mall (Kondapur), Nexus Hyderabad Mall (Kukatpally), Lulu Mall (Kukatpally), Manjeera Mall (KPHB), City Centre Mall (Banjara Hills)
HISTORICAL/CULTURE: Chowmahalla Palace (Old City), Golconda Fort (Ibrahim Bagh — CLOSES 5:30 PM), Qutb Shahi Tombs (Ibrahim Bagh), Charminar (Old City), Salar Jung Museum (Darulshifa — CLOSES 5 PM), Birla Mandir (Naubat Pahad), Mecca Masjid (Old City), Falaknuma Palace (Falaknuma), Shilparamam (Madhapur), Sudha Cars Museum (Bahadurpura)
NATURE/LAKES: Hussain Sagar/Tank Bund (BEST at sunset 6-7 PM and night), KBR National Park (Jubilee Hills — CLOSES 6 PM mornings only), Osman Sagar (Gandipet), Nehru Zoo (Bahadurpura — CLOSES 5 PM), Durgam Cheruvu (Jubilee Hills), Lumbini Park (Secretariat Rd), Botanical Garden (Kothaguda)
GO-KARTING: Wheelz Go-Karting (Gachibowli), Raceology (Gachibowli), F9 Go-Karting (Kompally), iKart Racing (Shamshabad)
ADVENTURE/GAMING: Smaaash Entertainment (Inorbit Mall Madhapur), Rush Escape Room (Madhapur), Timezone (Nexus Mall Kukatpally), Jumpzone Trampoline Park (Gachibowli), Lazer Zone VR (Banjara Hills), Snow World (Lower Tank Bund), Wonderla (Shamshabad — FULL DAY only), Ramoji Film City (Anaspur — MINIMUM 4 HOURS, full day only), Wild Waters (Shamirpet), Jalavihar (Necklace Road), bowling at Inorbit and GVK One
SPORTS TURFS: PlayOn Turf (Gachibowli), Turf Town (Kukatpally), Champions Turf (Madhapur), Premier Box Cricket (Gachibowli), Playo Badminton (Madhapur), turfs across Kukatpally, Kompally, Miyapur, Chandanagar
BIRYANI/ICONIC: Paradise Restaurant (Secunderabad/multiple), Bawarchi (RTC X Roads), Shah Ghouse (Tolichowki/Attapur), Shadab Hotel (Old City), Sarvi Hotel (Saidabad/Banjara Hills), Cafe Bahar (Basheer Bagh), Hotel Nayaab (Old City), Pista House (Pathergatti), Chicha's (Tolichowki)
OLD CITY GEMS: Nimrah Cafe (near Charminar), Karachi Bakery (Mozamjahi Market), Laad Bazaar (bangles/shopping), Irani chai spots around Charminar, Hotel Shadab
FINE DINING: Ohri's Gufaa (Necklace Road), The Fisherman's Wharf (Banjara Hills), Farzi Cafe (Banjara Hills), Olive Bistro (Jubilee Hills), Barbeque Nation (multiple), AB's Absolute Barbecues (Gachibowli), Collage at Hyatt (Hitech City), The Moonshine Project (Jubilee Hills), Flechazo (Banjara Hills)
CAFES/CASUAL: Social (Jubilee Hills), Lamakaan (Banjara Hills), Roastery Coffee House (Jubilee Hills), Autumn Leaf Cafe (Jubilee Hills), Tabula Rasa (Banjara Hills), The Black Pearl (Madhapur), Drunken Monkey (multiple), Tie & Chai (Banjara Hills), Third Wave Coffee (multiple), Cafe Niloufer (Lakdikapul), Amara Cafe (Gachibowli)
DESSERTS: Cream Stone (multiple), Haagen-Dazs (GVK One), Rollacosta (Gachibowli), Concu Chocolatier (Jubilee Hills), Corner House (Banjara Hills), Over the Moon (Banjara Hills), Almond House (multiple)
NIGHTLIFE/BARS: Social (Jubilee Hills), Prost Brew Pub (Gachibowli/Financial District), Hard Rock Cafe (Banjara Hills), Prism Skybar (Madhapur), The Grid (Jubilee Hills), Amnesia Club (Banjara Hills), 10 Downing Street (Banjara Hills), Bootlegger (Jubilee Hills), B-Dubs (Madhapur)
EAT STREET: Eat Street (Necklace Road — evening/night), Necklace Road walkway, Hussain Sagar promenade

GROUP CONTEXT RULES:
- Kids/families: parks, Ramoji Film City, zoo, Snow World, safe food, NO bars/nightlife
- College guys 18-22: go-karting, turfs, gaming, street food, biryani, box cricket, escape rooms
- College mixed 18-22: cafes, malls, escape rooms, desserts, casual dining, Social
- Couples/romantic: Hussain Sagar sunset, Durgam Cheruvu, fine dining, rooftop bars, quiet cafes
- Corporate/professionals: fine dining, rooftop bars, upscale cafes, cultural spots
- Tourists: Charminar → Golconda → Paradise biryani → Old City walk → Hussain Sagar
- Senior adults 40+: cultural sites, comfortable restaurants, malls, heritage walks
- Large groups 8+: Ramoji Film City, turfs, Barbeque Nation, escape rooms, Smaaash

BUDGET RULES — CRITICAL:
Budget stated by user = TOTAL for the ENTIRE GROUP. Never per person.
estimatedCost in JSON = rupees spent at that stop by ALL people combined.
Sum of ALL estimatedCost values must be ≤ total budget. Do NOT exceed.
Aim to use 85-100% of budget across all stops. Don't leave more than 15% unspent.
Per-person math goes in reasoning only: "₹600/person × 4 = ₹2400 total"
Example: 4 people ₹3000 budget → stop1: 2400 + stop2: 400 + stop3: 200 = ₹3000 ✓
Default: ₹2000 total budget if none stated.

TIME AND TRAFFIC RULES:
Default start: 7:00 PM unless stated.
Golconda Fort — NEVER after 4 PM visit (closes 5:30 PM).
Salar Jung / KBR / Nehru Zoo — mornings only.
Ramoji Film City — full day plan only, minimum 4 hours.
Old City 4–8 PM — add 25-30 min extra travel buffer (extreme traffic).
Hussain Sagar — best at sunset (6-7 PM) and night.
Gachibowli to Old City = 45-60 min evening traffic.
Malls: 11 AM–10 PM. Old City restaurants: till 11 PM. Jubilee Hills/Banjara Hills: till midnight.
Add 10-15 min to ALL cab times during 5-8 PM peak.
Visit durations: Adventure/Sports 60-90 min | Meals 45-60 min | Cafes 30-45 min | Dessert 20-30 min | Heritage 45-90 min.

ITINERARY QUALITY RULES:
Never recommend stops more than 15 km apart unless asked.
No zig-zag routes — prefer geographic clustering.
Each stop must naturally lead to the next.
No duplicate activity types back to back.
Variety: mix food, activity, sightseeing, relaxation.
3 stops minimum, 5 maximum.

PLAN QUALITY CHECK (run internally before output):
All places real and on Google Maps Hyderabad? Budget respected and maximised? Route logical with no backtracking? Times realistic with traffic? Group preferences respected? No redundant stops? If any fail — regenerate before output.

RECOMMENDATION PRIORITY: 1. User intent 2. Budget maximisation 3. Travel efficiency 4. Venue quality 5. Novelty

WAYFOUND PRINCIPLE:
Users are not asking for locations. They are asking for outcomes.
Always optimise for: "What experience will make this outing successful?"
Reasoning must be specific — mention group type, cost math, why this sequence.`;

// ─── Example prompts ──────────────────────────────────────────────────────────

const EXAMPLES = [
  "4 people, age 19, go-karting and food under ₹2500",
  "2 people, age 40, romantic date with dinner ₹3000",
  "6 friends, age 25, gaming zone and biryani ₹3600",
  "Family of 4, age 35, cultural places and lunch ₹2000",
];

// ─── Chip button ──────────────────────────────────────────────────────────────

function Chip({
  label, active, onClick,
}: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "5px 12px",
        border: `1.5px solid ${active ? "#34A853" : "#E0DED8"}`,
        borderRadius: "6px",
        background: active ? "rgba(52,168,83,0.07)" : "white",
        color: active ? "#2a8040" : "#555",
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: "11px",
        fontWeight: active ? "700" : "400",
        cursor: "pointer",
        transition: "border-color 0.15s, background 0.15s, color 0.15s",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: "10px",
      fontWeight: "600",
      color: "#AAAAAA",
      textTransform: "uppercase",
      letterSpacing: "0.09em",
      margin: "0 0 6px 0",
    }}>
      {children}
    </p>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Home() {
  const mapRef = useRef<google.maps.Map | null>(null);
  const placesRef = useRef<google.maps.places.PlacesService | null>(null);
  const directionsRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);

  const [intent, setIntent] = useState("");
  const [itinerary, setItinerary] = useState<ItineraryStop[]>([]);
  const [showReplan, setShowReplan] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [inputMode, setInputMode] = useState<"text" | "structured">("text");
  const [lastGroupSize, setLastGroupSize] = useState(1);
  const [lastTotalBudget, setLastTotalBudget] = useState(0);

  // Structured mode state
  const [groupSize, setGroupSize] = useState(2);
  const [ageGroup, setAgeGroup] = useState("20s");
  const [occasion, setOccasion] = useState("");
  const [budget, setBudget] = useState("");
  const [wantsFood, setWantsFood] = useState(true);
  const [experience, setExperience] = useState("");

  // ── Map setup ──────────────────────────────────────────────────────────────

  const handleMapReady = (map: google.maps.Map) => {
    mapRef.current = map;
    map.setCenter({ lat: 17.385, lng: 78.4867 });
    map.setZoom(13);
    placesRef.current = new google.maps.places.PlacesService(map);
    directionsRef.current = new google.maps.DirectionsRenderer({
      map,
      suppressMarkers: true,
      polylineOptions: { strokeColor: "#34A853", strokeWeight: 3 },
    });
  };

  const clearMarkers = () => {
    markersRef.current.forEach(m => (m.map = null));
    markersRef.current = [];
  };

  const addMarkers = (stops: ItineraryStop[]) => {
    if (!mapRef.current) return;
    clearMarkers();
    stops.forEach(stop => {
      if (!stop.location) return;
      const m = new google.maps.marker.AdvancedMarkerElement({
        map: mapRef.current,
        position: stop.location,
        title: stop.place,
      });
      markersRef.current.push(m);
    });
    const withLoc = stops.filter(s => s.location);
    if (withLoc.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      withLoc.forEach(s => bounds.extend(s.location!));
      mapRef.current.fitBounds(bounds);
    }
  };

  // ── Data helpers ───────────────────────────────────────────────────────────

  const fetchPlace = (query: string): Promise<{ placeId: string; location: google.maps.LatLngLiteral; name: string } | null> =>
    new Promise(resolve => {
      if (!placesRef.current) return resolve(null);
      placesRef.current.findPlaceFromQuery(
        { query, fields: ["place_id", "geometry", "name"] },
        (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results?.[0]?.geometry?.location) {
            const p = results[0];
            resolve({ placeId: p.place_id!, location: { lat: p.geometry!.location!.lat(), lng: p.geometry!.location!.lng() }, name: p.name! });
          } else resolve(null);
        }
      );
    });

  const buildStops = async (raw: GeminiStop[]): Promise<ItineraryStop[]> =>
    Promise.all(
      raw.map(async (s, i) => {
        const place = await fetchPlace(`${s.placeName} ${s.address} Hyderabad`);
        return {
          id: `stop-${i}`,
          place: place?.name ?? s.placeName,
          placeId: place?.placeId,
          location: place?.location,
          time: s.time,
          cost: `₹${s.estimatedCost}`,
          reasoning: s.reasoning,
          travelTime: s.travelTimeFromPrevious,
        };
      })
    );

  // ── Generate ───────────────────────────────────────────────────────────────

  const generate = async (userIntent: string) => {
    if (!userIntent.trim()) return;
    setLoading(true);
    setIsOffline(false);

    const grpMatch = userIntent.match(/(\d+)\s*(?:people|ppl|persons|friends|guys|members)/i);
    const detectedGroup = grpMatch ? parseInt(grpMatch[1]) : groupSize;
    const budgetMatch = userIntent.match(/(?:under|below|within|₹|rs\.?)\s*(\d+)/i) || userIntent.match(/(\d{3,})/);
    const detectedBudget = budgetMatch ? parseInt(budgetMatch[1]) : (budget ? parseInt(budget) : 2000);
    setLastGroupSize(detectedGroup);
    setLastTotalBudget(detectedBudget);

    // Show mock instantly
    const mock = generateMockItinerary(userIntent);
    const mockStops = await buildStops(mock);
    setItinerary(mockStops);
    setIsOffline(true);
    addMarkers(mockStops);

    try {
      const key = import.meta.env.VITE_GROQ_KEY;
      if (!key) throw new Error("no key");

      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            { role: "system", content: SYSTEM_INSTRUCTION },
            { role: "user", content: userIntent },
          ],
          temperature: 0.7,
          max_tokens: 1024,
        }),
      });

      if (!res.ok) throw new Error("api error");
      const data = await res.json();
      let text = data.choices?.[0]?.message?.content ?? "";
      text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed: GeminiStop[] = JSON.parse(text);
      const aiStops = await buildStops(parsed);
      setItinerary(aiStops);
      setIsOffline(false);
      addMarkers(aiStops);
      setTimeout(() => { setShowReplan(true); setTimeout(() => setShowReplan(false), 8000); }, 1000);
    } catch {
      // Keep mock silently
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMode === "structured") {
      const ageMap: Record<string, string> = { teens: "17", "20s": "22", "30s": "32", "40s": "42", "50+": "52" };
      const parts = [
        `${groupSize} people`,
        `age ${ageMap[ageGroup] || "22"}`,
        occasion,
        wantsFood ? "food" : "",
        experience,
        budget ? `under ₹${budget}` : "",
      ].filter(Boolean);
      const built = parts.join(", ");
      setIntent(built);
      generate(built);
    } else {
      generate(intent);
    }
  };

  // ── Budget display ─────────────────────────────────────────────────────────

  const totalSpent = itinerary.reduce((sum, s) => {
    return sum + parseInt(s.cost.replace("₹", "").replace(/,/g, "") || "0");
  }, 0);
  const budgetPct = lastTotalBudget > 0 ? Math.round((totalSpent / lastTotalBudget) * 100) : 0;
  const budgetColor = budgetPct > 100 ? "#E53E3E" : "#34A853";

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@0,400;0,600;1,400&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.5; }
        }
        @keyframes gentlePulse {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.15); }
        }

        .wf-example:hover {
          border-color: #34A853 !important;
          background: white !important;
          transform: translateX(2px);
        }
        .wf-reset:hover {
          border-color: #CCCCCC !important;
          color: #444 !important;
        }

        @media (max-width: 768px) {
          .wf-layout { flex-direction: column !important; }
          .wf-left   { width: 100% !important; height: 40vh; border-right: none !important; border-bottom: 0.5px solid #E0DED8; }
          .wf-right  { width: 100% !important; height: 60vh; }
          .wf-map-panel { height: 100% !important; }
          .wf-explore  { display: none !important; }
        }
      `}</style>

      <div className="wf-layout" style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#F7F6F3", fontFamily: "'Instrument Serif', serif" }}>

        {/* ── LEFT PANEL ──────────────────────────────────────────────────── */}
        <div className="wf-left" style={{ width: "58%", display: "flex", flexDirection: "column", borderRight: "0.5px solid #E0DED8" }}>

          {/* Map */}
          <div className="wf-map-panel" style={{ flex: 1, position: "relative", padding: "16px", background: "#F7F6F3", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 0 }}>
            <div style={{ width: "100%", height: "100%", background: "white", borderRadius: "16px", border: "1.5px solid #E0DED8", overflow: "hidden", position: "relative", boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
              <img
                src="/hyderabad-map.jpg"
                alt="Hyderabad City Map"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={e => {
                  const t = e.currentTarget;
                  t.style.display = "none";
                  const p = t.parentElement;
                  if (p) {
                    p.style.background = "#F0F7F2";
                    p.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;flex-direction:column;gap:8px;color:#34A853"><span style="font-size:40px">🗺️</span><span style="font-family:\'Instrument Serif\',serif;font-size:18px">Hyderabad</span></div>';
                  }
                }}
              />
              {/* Location pill */}
              <div style={{ position: "absolute", bottom: "14px", left: "14px", background: "rgba(255,255,255,0.96)", border: "1px solid #E0DED8", borderRadius: "10px", padding: "8px 14px", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
                <span style={{ fontSize: "14px" }}>📍</span>
                <div>
                  <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "12px", fontWeight: "700", color: "#1A1A1A", margin: 0 }}>Hyderabad</p>
                  <p style={{ fontFamily: "'Instrument Serif', serif", fontSize: "11px", fontStyle: "italic", color: "#999", margin: 0 }}>City of Pearls</p>
                </div>
              </div>
            </div>
          </div>

          {/* Explore panel */}
          <div className="wf-explore" style={{ borderTop: "0.5px solid #E0DED8", padding: "20px 24px", background: "white" }}>
            <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: "20px", color: "#1A1A1A", margin: "0 0 4px 0", fontWeight: 400 }}>
              Ready to explore Hyderabad?
            </h3>
            <p style={{ fontFamily: "'Instrument Serif', serif", fontSize: "13px", color: "#999", fontStyle: "italic", margin: "0 0 14px 0" }}>
              Type your plan in the panel. Wayfound does the rest.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
              {EXAMPLES.map((ex, i) => (
                <div
                  key={i}
                  className="wf-example"
                  onClick={() => { setIntent(ex); generate(ex); }}
                  style={{
                    padding: "9px 14px",
                    border: "1.5px solid #E8E7E3",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontFamily: "'Instrument Serif', serif",
                    fontStyle: "italic",
                    fontSize: "13px",
                    color: "#666",
                    background: "white",
                    transition: "border-color 0.15s, transform 0.15s",
                  }}
                >
                  {ex}
                </div>
              ))}
            </div>
            <div style={{ marginTop: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#34A853", animation: "pulse 2s ease-in-out infinite" }} />
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "#BBBBBB", letterSpacing: "0.03em" }}>
                Powered by Groq AI + Google Places
              </span>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ─────────────────────────────────────────────────── */}
        <div className="wf-right" style={{ width: "42%", display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden", background: "white" }}>

          {/* Header */}
          <div style={{ padding: "22px 28px 16px", borderBottom: "0.5px solid #E0DED8", flexShrink: 0 }}>
            <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: "44px", fontWeight: 600, color: "#1A1A1A", margin: "0 0 2px 0", lineHeight: 1, letterSpacing: "-0.02em" }}>
              Wayfound
            </h1>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <p style={{ fontFamily: "'Instrument Serif', serif", fontSize: "15px", color: "#999", fontStyle: "italic", margin: 0 }}>
                Stop searching. Start going.
              </p>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "4px 10px", background: "rgba(52,168,83,0.06)", borderRadius: "20px", border: "1px solid rgba(52,168,83,0.18)" }}>
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#34A853", animation: "gentlePulse 3s ease-in-out infinite" }} />
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", color: "#34A853", fontWeight: "700", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  AI Live
                </span>
              </div>
            </div>
          </div>

          {/* Input panel — scrollable */}
          <div style={{ padding: "16px 28px", borderBottom: "0.5px solid #E0DED8", flexShrink: 0, overflowY: "auto", maxHeight: "52vh" }}>
            <form onSubmit={handleSubmit}>

              {/* Mode toggle */}
              <div style={{ display: "flex", gap: "0", marginBottom: "14px", background: "#F7F6F3", borderRadius: "8px", padding: "3px" }}>
                {(["text", "structured"] as const).map(mode => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setInputMode(mode)}
                    style={{
                      flex: 1,
                      padding: "7px 0",
                      border: "none",
                      borderRadius: "6px",
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: "10px",
                      fontWeight: "700",
                      letterSpacing: "0.06em",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      background: inputMode === mode ? "white" : "transparent",
                      color: inputMode === mode ? "#1A1A1A" : "#BBBBBB",
                      boxShadow: inputMode === mode ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                      textTransform: "uppercase",
                    }}
                  >
                    {mode === "text" ? "✏ Type" : "⊞ Choose"}
                  </button>
                ))}
              </div>

              {/* Text mode */}
              {inputMode === "text" && (
                <input
                  type="text"
                  value={intent}
                  onChange={e => setIntent(e.target.value)}
                  placeholder="4 people, age 19, biryani and gaming under ₹3000"
                  style={{
                    width: "100%",
                    fontFamily: "'Instrument Serif', serif",
                    fontStyle: "italic",
                    fontSize: "15px",
                    color: "#1A1A1A",
                    padding: "12px 16px",
                    border: "1.5px solid #E0DED8",
                    borderRadius: "10px",
                    outline: "none",
                    transition: "border-color 0.15s, box-shadow 0.15s",
                    background: "#FDFCFA",
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = "#34A853"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(52,168,83,0.07)"; e.currentTarget.style.background = "white"; }}
                  onBlur={e => { e.currentTarget.style.borderColor = "#E0DED8"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.background = "#FDFCFA"; }}
                />
              )}

              {/* Structured mode */}
              {inputMode === "structured" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

                  <div>
                    <SectionLabel>Group Size</SectionLabel>
                    <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                      {[1, 2, 3, 4, 5, 6, 8, 10].map(n => (
                        <Chip key={n} label={String(n)} active={groupSize === n} onClick={() => setGroupSize(n)} />
                      ))}
                    </div>
                  </div>

                  <div>
                    <SectionLabel>Age Group</SectionLabel>
                    <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                      {["teens", "20s", "30s", "40s", "50+"].map(a => (
                        <Chip key={a} label={a} active={ageGroup === a} onClick={() => setAgeGroup(a)} />
                      ))}
                    </div>
                  </div>

                  <div>
                    <SectionLabel>Occasion</SectionLabel>
                    <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                      {["friends hangout", "date night", "family day", "birthday", "team outing", "solo"].map(o => (
                        <Chip key={o} label={o} active={occasion === o} onClick={() => setOccasion(occasion === o ? "" : o)} />
                      ))}
                    </div>
                  </div>

                  <div>
                    <SectionLabel>Vibe</SectionLabel>
                    <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                      {["go-karting", "food trail", "cafe hopping", "heritage walk", "night out", "shopping", "adventure", "gaming"].map(v => (
                        <Chip key={v} label={v} active={experience === v} onClick={() => setExperience(experience === v ? "" : v)} />
                      ))}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
                    <div style={{ flex: 1 }}>
                      <SectionLabel>Budget (₹ total)</SectionLabel>
                      <input
                        type="number"
                        value={budget}
                        onChange={e => setBudget(e.target.value)}
                        placeholder="e.g. 3000"
                        style={{ width: "100%", padding: "8px 11px", border: "1.5px solid #E0DED8", borderRadius: "8px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "12px", outline: "none", background: "#FDFCFA", transition: "border-color 0.15s" }}
                        onFocus={e => e.currentTarget.style.borderColor = "#34A853"}
                        onBlur={e => e.currentTarget.style.borderColor = "#E0DED8"}
                      />
                    </div>
                    <div>
                      <SectionLabel>Food?</SectionLabel>
                      <Chip label={wantsFood ? "✓ Yes" : "No"} active={wantsFood} onClick={() => setWantsFood(!wantsFood)} />
                    </div>
                  </div>

                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={inputMode === "text" ? (!intent.trim() || loading) : loading}
                style={{
                  width: "100%",
                  marginTop: "12px",
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: "12px",
                  fontWeight: "700",
                  padding: "12px",
                  background: loading ? "#D0D0D0" : "#34A853",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: loading ? "not-allowed" : "pointer",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  transition: "background 0.15s, opacity 0.15s",
                }}
              >
                {loading ? (
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "7px" }}>
                    <span style={{ display: "inline-block", width: "11px", height: "11px", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                    {itinerary.length > 0 ? "Refining with AI..." : "Planning..."}
                  </span>
                ) : "Generate Itinerary →"}
              </button>

              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "#CCCCCC", margin: "7px 0 0 0", textAlign: "center", letterSpacing: "0.02em" }}>
                Defaults: ₹2000 total · 7 PM · Hyderabad
              </p>
            </form>
          </div>

          {/* Replan alert */}
          {showReplan && (
            <div style={{ padding: "10px 28px", borderBottom: "0.5px solid #E0DED8", borderLeft: "2px solid #F5A623", background: "#FFFBF2", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
              <div>
                <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "#F5A623", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 2px 0", fontWeight: "700" }}>Traffic spike</p>
                <p style={{ fontFamily: "'Instrument Serif', serif", fontSize: "13px", color: "#1A1A1A", margin: 0 }}>Similar venue 8 min away, ₹50 cheaper. Switch?</p>
              </div>
              <button onClick={() => setShowReplan(false)} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", fontWeight: "600", color: "#34A853", background: "none", border: "none", cursor: "pointer", flexShrink: 0 }}>
                Switch
              </button>
            </div>
          )}

          {/* Results area */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px" }}>

            {itinerary.length > 0 && (
              <div>
                {/* Summary row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "#AAAAAA", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    {itinerary.length} stops · optimised route
                  </span>
                  {lastTotalBudget > 0 && (
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: budgetColor, fontWeight: "600" }}>
                      ₹{totalSpent.toLocaleString()} / ₹{lastTotalBudget.toLocaleString()} · {budgetPct}%
                    </span>
                  )}
                </div>

                {/* Timeline */}
                <div style={{ position: "relative" }}>
                  <div style={{ position: "absolute", left: "7px", top: "6px", bottom: "6px", width: "1px", background: "#EBEBEB" }} />
                  <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    {itinerary.map((stop, i) => {
                      const rawCost = parseInt(stop.cost.replace("₹", "").replace(/,/g, "") || "0");
                      const perPerson = lastGroupSize > 1 ? Math.round(rawCost / lastGroupSize) : 0;
                      return (
                        <div key={stop.id} style={{ paddingLeft: "26px", position: "relative", animation: `fadeUp 0.25s ease-out ${i * 50}ms both` }}>
                          {/* Dot */}
                          <div style={{ position: "absolute", left: "3px", top: "5px", width: "9px", height: "9px", borderRadius: "50%", background: "#34A853", border: "2px solid white", boxShadow: "0 0 0 1px #34A853" }} />

                          {/* Place name + time */}
                          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "8px", marginBottom: "2px" }}>
                            <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: "15px", color: "#1A1A1A", fontWeight: 400, lineHeight: 1.2 }}>{stop.place}</span>
                            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "#AAAAAA", whiteSpace: "nowrap", flexShrink: 0 }}>{stop.time}</span>
                          </div>

                          {/* Cost */}
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", color: "#333", fontWeight: "600" }}>₹{rawCost.toLocaleString()}</span>
                            {lastGroupSize > 1 && perPerson > 0 && (
                              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "#BBBBBB" }}>
                                ₹{perPerson.toLocaleString()}/pp × {lastGroupSize}
                              </span>
                            )}
                          </div>

                          {/* Travel time */}
                          {stop.travelTime && stop.travelTime !== "0 min" && (
                            <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "#CCCCCC", margin: "0 0 3px 0" }}>
                              {stop.travelTime} by cab
                            </p>
                          )}

                          {/* Reasoning */}
                          <p style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: "12px", color: "#AAAAAA", margin: 0, lineHeight: 1.5 }}>
                            {stop.reasoning}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Reset + offline badge */}
                <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "0.5px solid #F0EFEC" }}>
                  {isOffline && !loading && (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px", padding: "8px 12px", background: "rgba(245,166,35,0.06)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: "7px" }}>
                      <span style={{ fontSize: "12px" }}>⚠</span>
                      <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "#C8860A", margin: 0 }}>
                        Smart preview — AI key missing in Vercel env
                      </p>
                    </div>
                  )}
                  <button
                    className="wf-reset"
                    onClick={() => { setItinerary([]); setIntent(""); }}
                    style={{ width: "100%", padding: "10px", background: "transparent", color: "#AAAAAA", fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", border: "1px solid #EBEBEB", borderRadius: "7px", cursor: "pointer", letterSpacing: "0.05em", transition: "border-color 0.15s, color 0.15s" }}
                  >
                    ↺ Reset
                  </button>
                </div>
              </div>
            )}

            {/* Empty state */}
            {itinerary.length === 0 && !loading && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "8px", opacity: 0.4 }}>
                <span style={{ fontSize: "32px" }}>🗺</span>
                <p style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: "14px", color: "#999", margin: 0 }}>Your plan will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
