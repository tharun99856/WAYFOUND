import { useState, useRef } from "react";
import { generateMockItinerary } from "@/lib/mockItinerary";

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


const EXAMPLES = [
  "4 people, age 19, go-karting and food under ₹2500",
  "2 people, age 40, romantic date with dinner ₹3000",
  "6 friends, age 25, gaming zone and biryani ₹3600",
  "Family of 4, age 35, cultural places and lunch ₹2000",
];

export default function Home() {
  const [mapReady, setMapReady] = useState(false);
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
  const [lastGroupSize, setLastGroupSize] = useState<number>(1);
  const [lastTotalBudget, setLastTotalBudget] = useState<number>(0);

  // Structured options state
  const [groupSize, setGroupSize] = useState<number>(2);
  const [ageGroup, setAgeGroup] = useState<string>("20s");
  const [occasion, setOccasion] = useState<string>("");
  const [budget, setBudget] = useState<string>("");
  const [wantsFood, setWantsFood] = useState<boolean>(true);
  const [experience, setExperience] = useState<string>("");

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
    setMapReady(true);
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

  const fetchPlace = (query: string): Promise<{ placeId: string; location: google.maps.LatLngLiteral; name: string } | null> =>
    new Promise(resolve => {
      if (!placesRef.current) return resolve(null);
      placesRef.current.findPlaceFromQuery(
        { query, fields: ["place_id", "geometry", "name"] },
        (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results?.[0]?.geometry?.location) {
            const p = results[0];
            resolve({
              placeId: p.place_id!,
              location: { lat: p.geometry!.location!.lat(), lng: p.geometry!.location!.lng() },
              name: p.name!,
            });
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

  const generate = async (userIntent: string) => {
    if (!userIntent.trim()) return;
    setLoading(true);
    setIsOffline(false);

    // Extract group size & budget from intent for display
    const grpMatch = userIntent.match(/(\d+)\s*(?:people|ppl|persons|friends|guys|members)/i);
    const detectedGroup = grpMatch ? parseInt(grpMatch[1]) : groupSize;
    const budgetMatch = userIntent.match(/(?:under|below|within|₹|rs\.?)\s*(\d+)/i) || userIntent.match(/(\d{3,})/);
    const detectedBudget = budgetMatch ? parseInt(budgetMatch[1]) : (budget ? parseInt(budget) : 2000);
    setLastGroupSize(detectedGroup);
    setLastTotalBudget(detectedBudget);

    // Show mock instantly so user sees something immediately
    const mock = generateMockItinerary(userIntent);
    const mockStops = await buildStops(mock);
    setItinerary(mockStops);
    setIsOffline(true);
    addMarkers(mockStops);

    try {
      const key = import.meta.env.VITE_GROQ_KEY;
      if (!key) throw new Error("no key");

      const res = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${key}`,
          },
          body: JSON.stringify({
            model: "llama-3.1-8b-instant", // fastest Groq model
            messages: [
              { role: "system", content: SYSTEM_INSTRUCTION },
              { role: "user", content: userIntent }
            ],
            temperature: 0.7,
            max_tokens: 1024, // reduced for speed
          }),
        }
      );

      if (!res.ok) throw new Error("api error");
      
      const data = await res.json();
      let text = data.choices?.[0]?.message?.content ?? "";
      text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      
      const parsed: GeminiStop[] = JSON.parse(text);
      const aiStops = await buildStops(parsed);
      // Swap mock with real AI results
      setItinerary(aiStops);
      setIsOffline(false);
      addMarkers(aiStops);
      setTimeout(() => { setShowReplan(true); setTimeout(() => setShowReplan(false), 8000); }, 1000);
    } catch (error) {
      console.error("Groq failed, keeping mock:", error);
      // Mock already shown — just keep it, no flicker
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMode === "structured") {
      const ageMap: Record<string, string> = { "teens": "17", "20s": "22", "30s": "32", "40s": "42", "50+": "52" };
      const parts = [
        `${groupSize} people`,
        `age ${ageMap[ageGroup] || "22"}`,
        occasion && occasion,
        wantsFood ? "food" : "",
        experience && experience,
        budget ? `under ₹${budget}` : "",
      ].filter(Boolean);
      const builtIntent = parts.join(", ");
      setIntent(builtIntent);
      generate(builtIntent);
    } else {
      generate(intent);
    }
  };

  const handleNav = () => {
    if (!directionsRef.current || itinerary.length < 2) return;
    const valid = itinerary.filter(s => s.location);
    if (valid.length < 2) return;
    new google.maps.DirectionsService().route(
      {
        origin: valid[0].location!,
        destination: valid[valid.length - 1].location!,
        waypoints: valid.slice(1, -1).map(s => ({ location: s.location!, stopover: true })),
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK) directionsRef.current?.setDirections(result);
      }
    );
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", backgroundColor: "#F7F6F3", fontFamily: "system-ui, sans-serif" }}>

      {/* LEFT — Map top, empty state bottom */}
      <div style={{ width: "58%", display: "flex", flexDirection: "column", borderRight: "0.5px solid #E0DED8" }}>

        {/* Map — top half - Static Hyderabad Map with Claymorphism */}
        <div style={{ 
          flex: 1, 
          position: "relative", 
          overflow: "hidden", 
          background: "linear-gradient(135deg, #FDFCFA 0%, #F7F6F3 50%, #E8E7E3 100%)",
          padding: "24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          {/* Clay card container */}
          <div style={{
            width: "100%",
            height: "100%",
            background: "white",
            borderRadius: "24px",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.1), 0 8px 16px rgba(0, 0, 0, 0.06)",
            border: "3px solid #E0DED8",
            overflow: "hidden",
            position: "relative",
            animation: "fadeIn 0.8s ease-out, scaleIn 0.8s ease-out",
            transition: "all 0.4s ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.01)";
            e.currentTarget.style.boxShadow = "0 24px 80px rgba(0, 0, 0, 0.12), 0 12px 24px rgba(0, 0, 0, 0.08)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 20px 60px rgba(0, 0, 0, 0.1), 0 8px 16px rgba(0, 0, 0, 0.06)";
          }}>
            <img 
              src="/hyderabad-map.jpg" 
              alt="Hyderabad City Map"
              style={{ 
                width: "100%", 
                height: "100%", 
                objectFit: "contain",
                padding: "20px",
                animation: "fadeIn 1s ease-out 0.2s both"
              }}
              onError={(e) => {
                // Fallback if image not found
                const target = e.currentTarget as HTMLImageElement;
                target.style.display = "none";
                const parent = target.parentElement;
                if (parent) {
                  parent.style.background = "linear-gradient(135deg, #E8F5E9, #C8E6C9)";
                  parent.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-family:\'Instrument Serif\',serif;font-size:24px;color:#34A853;flex-direction:column;gap:12px"><span style="font-size:48px">🗺️</span><span>Hyderabad</span></div>';
                }
              }}
            />
            
            {/* Subtle gradient overlay for depth */}
            <div style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to top, rgba(255,255,255,0.1), transparent)",
              pointerEvents: "none"
            }} />
          </div>
          
          {/* Location badge with claymorphism */}
          <div style={{
            position: "absolute",
            bottom: "40px",
            left: "40px",
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            padding: "14px 20px",
            borderRadius: "18px",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.06)",
            border: "2px solid #E0DED8",
            animation: "slideInLeft 0.8s ease-out 0.4s both",
            transition: "all 0.3s ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-4px)";
            e.currentTarget.style.boxShadow = "0 12px 32px rgba(0, 0, 0, 0.15), 0 6px 12px rgba(0, 0, 0, 0.08)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.06)";
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "18px" }}>📍</span>
              <div>
                <p style={{ 
                  fontFamily: "'IBM Plex Mono', monospace", 
                  fontSize: "14px", 
                  fontWeight: "bold", 
                  color: "#1A1A1A", 
                  margin: 0,
                  letterSpacing: "0.02em"
                }}>
                  Hyderabad
                </p>
                <p style={{ 
                  fontFamily: "'Instrument Serif', serif", 
                  fontSize: "12px", 
                  fontStyle: "italic", 
                  color: "#888880", 
                  margin: "2px 0 0 0" 
                }}>
                  City of Pearls
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Ready to explore — bottom half with enhanced claymorphism */}
        <div style={{ 
          height: "46%", 
          backgroundColor: "#FFFFFF", 
          borderTop: "0.5px solid #E0DED8", 
          padding: "32px", 
          display: "flex", 
          flexDirection: "column", 
          justifyContent: "center",
          background: "linear-gradient(to bottom, #FFFFFF, #FDFCFA)",
          animation: "fadeIn 0.8s ease-out 0.6s both"
        }}>
          <h3 style={{ 
            fontFamily: "'Instrument Serif', serif", 
            fontSize: "24px", 
            color: "#1A1A1A", 
            margin: "0 0 10px 0", 
            fontWeight: 400,
            animation: "fadeInUp 0.6s ease-out 0.7s both"
          }}>
            Ready to explore Hyderabad?
          </h3>
          <p style={{ 
            fontFamily: "'Instrument Serif', serif", 
            fontSize: "15px", 
            color: "#888880", 
            fontStyle: "italic", 
            margin: "0 0 24px 0", 
            lineHeight: 1.6,
            animation: "fadeInUp 0.6s ease-out 0.8s both"
          }}>
            Type what you want in the panel. Wayfound does the rest.
          </p>
          <div style={{ 
            display: "flex", 
            flexDirection: "column", 
            gap: "10px",
            padding: "20px",
            background: "linear-gradient(135deg, white, #F7F6F3)",
            border: "2px solid #E0DED8",
            borderRadius: "20px",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.06)",
            animation: "fadeInUp 0.6s ease-out 0.9s both"
          }}>
            {EXAMPLES.map((ex, i) => (
              <div
                key={i}
                onClick={() => { setIntent(ex); generate(ex); }}
                style={{ 
                  padding: "12px 16px", 
                  border: "2px solid #E0DED8", 
                  borderRadius: "14px", 
                  cursor: "pointer", 
                  fontFamily: "'Instrument Serif', serif", 
                  fontStyle: "italic", 
                  fontSize: "14px", 
                  color: "#666", 
                  backgroundColor: "rgba(255, 255, 255, 0.8)",
                  backdropFilter: "blur(8px)",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  animation: `fadeInUp 0.5s ease-out ${1 + i * 0.1}s both`
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = "#34A853";
                  e.currentTarget.style.transform = "translateY(-4px) scale(1.01)";
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(52, 168, 83, 0.15)";
                  e.currentTarget.style.backgroundColor = "white";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = "#E0DED8";
                  e.currentTarget.style.transform = "translateY(0) scale(1)";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.8)";
                }}
              >
                {ex}
              </div>
            ))}
          </div>
          <div style={{ 
            marginTop: "24px", 
            display: "flex", 
            alignItems: "center", 
            gap: "8px",
            animation: "fadeInUp 0.6s ease-out 1.3s both"
          }}>
            <div style={{ 
              width: "8px", 
              height: "8px", 
              borderRadius: "50%", 
              backgroundColor: "#34A853",
              animation: "pulse 2s ease-in-out infinite"
            }} />
            <span style={{ 
              fontFamily: "'IBM Plex Mono', monospace", 
              fontSize: "11px", 
              color: "#AAAAAA",
              letterSpacing: "0.03em"
            }}>
              Powered by Google Places + Gemini
            </span>
          </div>
        </div>
      </div>

      {/* RIGHT — Copilot panel */}
      <div style={{ width: "42%", display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden", backgroundColor: "#FFFFFF" }}>

        {/* Header */}
        <div style={{ 
          padding: "28px 32px 20px", 
          borderBottom: "1px solid #E0DED8", 
          flexShrink: 0,
          background: "white",
        }}>
          <div style={{ position: "relative", zIndex: 1 }}>
            <h1 style={{ 
              fontFamily: "'Instrument Serif', serif", 
              fontSize: "52px", 
              color: "#1A1A1A", 
              margin: "0 0 4px 0", 
              fontWeight: 600, 
              lineHeight: 1,
              letterSpacing: "-0.02em",
            }}>
              Wayfound
            </h1>
            <p style={{ 
              fontFamily: "'Instrument Serif', serif", 
              fontSize: "16px", 
              color: "#888880", 
              fontStyle: "italic", 
              margin: "0 0 12px 0",
            }}>
              Stop searching. Start going.
            </p>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "5px 12px",
              background: "rgba(52, 168, 83, 0.06)",
              borderRadius: "20px",
              border: "1px solid rgba(52, 168, 83, 0.2)",
            }}>
              <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#34A853", animation: "gentlePulse 3s ease-in-out infinite" }} />
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "#34A853", fontWeight: "600", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                AI-Powered
              </span>
            </div>
          </div>
        </div>

        {/* Intent input */}
        <div style={{ padding: "24px 32px", borderBottom: "1px solid #E0DED8", flexShrink: 0, background: "white", overflowY: "auto", maxHeight: "55vh" }}>
          <form onSubmit={handleSubmit}>

            {/* Mode Toggle */}
            <div style={{ display: "flex", gap: "0", marginBottom: "16px", background: "#F7F6F3", borderRadius: "10px", padding: "3px" }}>
              {(["text", "structured"] as const).map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setInputMode(mode)}
                  style={{
                    flex: 1,
                    padding: "8px 0",
                    border: "none",
                    borderRadius: "8px",
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: "11px",
                    fontWeight: "600",
                    letterSpacing: "0.05em",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    background: inputMode === mode ? "white" : "transparent",
                    color: inputMode === mode ? "#1A1A1A" : "#AAAAAA",
                    boxShadow: inputMode === mode ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                    textTransform: "uppercase",
                  }}
                >
                  {mode === "text" ? "✏️ Type" : "🎛️ Choose"}
                </button>
              ))}
            </div>

            {/* TEXT MODE */}
            {inputMode === "text" && (
              <input
                type="text"
                value={intent}
                onChange={e => setIntent(e.target.value)}
                placeholder="e.g., 4 people, age 19, biryani and gaming under ₹3000"
                style={{
                  width: "100%",
                  fontFamily: "'Instrument Serif', serif",
                  fontStyle: "italic",
                  fontSize: "16px",
                  color: "#1A1A1A",
                  padding: "14px 18px",
                  border: "2px solid #E0DED8",
                  borderRadius: "12px",
                  outline: "none",
                  transition: "all 0.3s ease",
                  background: "white",
                  boxSizing: "border-box",
                }}
                onFocus={e => { e.currentTarget.style.borderColor = "#34A853"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(52,168,83,0.08)"; }}
                onBlur={e => { e.currentTarget.style.borderColor = "#E0DED8"; e.currentTarget.style.boxShadow = "none"; }}
              />
            )}

            {/* STRUCTURED MODE */}
            {inputMode === "structured" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

                {/* Group size */}
                <div>
                  <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "#AAAAAA", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px 0" }}>Group Size</p>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {[1,2,3,4,5,6,8,10].map(n => (
                      <button key={n} type="button" onClick={() => setGroupSize(n)}
                        style={{ padding: "6px 14px", border: `1.5px solid ${groupSize === n ? "#34A853" : "#E0DED8"}`, borderRadius: "8px", background: groupSize === n ? "rgba(52,168,83,0.08)" : "white", color: groupSize === n ? "#34A853" : "#666", fontFamily: "'IBM Plex Mono', monospace", fontSize: "12px", cursor: "pointer", fontWeight: groupSize === n ? "700" : "400" }}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Age group */}
                <div>
                  <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "#AAAAAA", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px 0" }}>Age Group</p>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {["teens", "20s", "30s", "40s", "50+"].map(a => (
                      <button key={a} type="button" onClick={() => setAgeGroup(a)}
                        style={{ padding: "6px 14px", border: `1.5px solid ${ageGroup === a ? "#34A853" : "#E0DED8"}`, borderRadius: "8px", background: ageGroup === a ? "rgba(52,168,83,0.08)" : "white", color: ageGroup === a ? "#34A853" : "#666", fontFamily: "'IBM Plex Mono', monospace", fontSize: "12px", cursor: "pointer", fontWeight: ageGroup === a ? "700" : "400" }}>
                        {a}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Occasion */}
                <div>
                  <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "#AAAAAA", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px 0" }}>Occasion</p>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {["friends hangout", "date night", "family day", "birthday", "team outing", "solo"].map(o => (
                      <button key={o} type="button" onClick={() => setOccasion(occasion === o ? "" : o)}
                        style={{ padding: "6px 12px", border: `1.5px solid ${occasion === o ? "#34A853" : "#E0DED8"}`, borderRadius: "8px", background: occasion === o ? "rgba(52,168,83,0.08)" : "white", color: occasion === o ? "#34A853" : "#666", fontFamily: "'Instrument Serif', serif", fontSize: "13px", cursor: "pointer", fontWeight: occasion === o ? "700" : "400" }}>
                        {o}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Experience type */}
                <div>
                  <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "#AAAAAA", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px 0" }}>Vibe</p>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {["go-karting", "food trail", "cafe hopping", "heritage walk", "night out", "shopping day", "adventure", "gaming"].map(v => (
                      <button key={v} type="button" onClick={() => setExperience(experience === v ? "" : v)}
                        style={{ padding: "6px 12px", border: `1.5px solid ${experience === v ? "#34A853" : "#E0DED8"}`, borderRadius: "8px", background: experience === v ? "rgba(52,168,83,0.08)" : "white", color: experience === v ? "#34A853" : "#666", fontFamily: "'Instrument Serif', serif", fontSize: "13px", cursor: "pointer", fontWeight: experience === v ? "700" : "400" }}>
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Food toggle + Budget */}
                <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "#AAAAAA", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px 0" }}>Budget (₹ total)</p>
                    <input type="number" value={budget} onChange={e => setBudget(e.target.value)} placeholder="e.g. 3000"
                      style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #E0DED8", borderRadius: "8px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
                      onFocus={e => e.currentTarget.style.borderColor = "#34A853"}
                      onBlur={e => e.currentTarget.style.borderColor = "#E0DED8"}
                    />
                  </div>
                  <div>
                    <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "#AAAAAA", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px 0" }}>Include food</p>
                    <button type="button" onClick={() => setWantsFood(!wantsFood)}
                      style={{ padding: "8px 16px", border: `1.5px solid ${wantsFood ? "#34A853" : "#E0DED8"}`, borderRadius: "8px", background: wantsFood ? "rgba(52,168,83,0.08)" : "white", color: wantsFood ? "#34A853" : "#999", fontFamily: "'IBM Plex Mono', monospace", fontSize: "12px", cursor: "pointer", fontWeight: "600" }}>
                      {wantsFood ? "✓ Yes" : "No"}
                    </button>
                  </div>
                </div>

              </div>
            )}

            <button
              type="submit"
              disabled={inputMode === "text" ? (!intent.trim() || loading) : loading}
              style={{
                width: "100%",
                marginTop: "14px",
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "13px",
                fontWeight: "600",
                padding: "13px 24px",
                background: loading ? "#CCCCCC" : "linear-gradient(135deg, #34A853, #2d8f45)",
                color: "white",
                border: "none",
                borderRadius: "10px",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.3s ease",
                boxShadow: loading ? "none" : "0 4px 12px rgba(52, 168, 83, 0.25)",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                  <span style={{ display: "inline-block", width: "13px", height: "13px", border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  Planning...
                </span>
              ) : "Generate Itinerary →"}
            </button>

            <p style={{ fontFamily: "'Instrument Serif', serif", fontSize: "11px", fontStyle: "italic", color: "#CCCCCC", margin: "8px 0 0 0", textAlign: "center" }}>
              Defaults: ₹2000 total · 7 PM start · Hyderabad
            </p>
          </form>
        </div>

        {/* Replan alert */}
        {showReplan && (
          <div style={{ margin: "0", padding: "14px 32px", borderBottom: "0.5px solid #E0DED8", borderLeft: "3px solid #F5A623", backgroundColor: "#FFFBF2", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", color: "#F5A623", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 4px 0" }}>Traffic spike detected</p>
              <p style={{ fontFamily: "'Instrument Serif', serif", fontSize: "13px", color: "#1A1A1A", margin: 0 }}>Similar venue 8 min away, ₹50 cheaper. Switch?</p>
            </div>
            <button
              style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "12px", color: "#34A853", background: "none", border: "none", cursor: "pointer", whiteSpace: "nowrap", paddingLeft: "16px" }}
              onClick={() => setShowReplan(false)}
            >
              Switch
            </button>
          </div>
        )}

        {/* Scrollable itinerary area */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px" }}>

          {/* Loading */}
          {loading && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 0", marginBottom: "8px" }}>
              <div style={{ width: "14px", height: "14px", border: "2px solid #E0DED8", borderTopColor: "#34A853", borderRadius: "50%", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", color: "#34A853", margin: 0, letterSpacing: "0.05em" }}>
                {itinerary.length > 0 ? "AI refining results..." : "Planning your adventure..."}
              </p>
            </div>
          )}

          {/* Itinerary */}
          {itinerary.length > 0 && (
            <div>
              {/* Summary bar */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", color: "#888880", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
                  {itinerary.length} stops · optimised route
                </p>
                {lastTotalBudget > 0 && (() => {
                  const totalSpent = itinerary.reduce((sum, s) => sum + parseInt(s.cost.replace("₹", "").replace(/,/g, "") || "0"), 0);
                  const pct = Math.round((totalSpent / lastTotalBudget) * 100);
                  return (
                    <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: pct > 100 ? "#E53E3E" : "#34A853", margin: 0 }}>
                      ₹{totalSpent.toLocaleString()} / ₹{lastTotalBudget.toLocaleString()} ({pct}%)
                    </p>
                  );
                })()}
              </div>

              {/* Timeline */}
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: "8px", top: "8px", bottom: "8px", width: "1px", backgroundColor: "#E0DED8" }} />
                <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
                  {itinerary.map((stop, i) => {
                    const rawCost = parseInt(stop.cost.replace("₹", "").replace(/,/g, "") || "0");
                    const perPerson = lastGroupSize > 1 ? Math.round(rawCost / lastGroupSize) : 0;
                    return (
                      <div key={stop.id} style={{ paddingLeft: "32px", position: "relative", animation: `fadeUp 0.3s ease-out ${i * 60}ms both` }}>
                        <div style={{ position: "absolute", left: "3px", top: "4px", width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#34A853" }} />
                        
                        {/* Place + time */}
                        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "8px", marginBottom: "2px" }}>
                          <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: "16px", color: "#1A1A1A" }}>{stop.place}</span>
                          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", color: "#888880", whiteSpace: "nowrap" }}>{stop.time}</span>
                        </div>

                        {/* Cost breakdown */}
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "12px", color: "#1A1A1A", fontWeight: "600" }}>
                            ₹{rawCost.toLocaleString()} total
                          </span>
                          {lastGroupSize > 1 && perPerson > 0 && (
                            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "#AAAAAA" }}>
                              ₹{perPerson.toLocaleString()}/person × {lastGroupSize}
                            </span>
                          )}
                        </div>

                        {/* Travel time */}
                        {stop.travelTime && stop.travelTime !== "0 min" && (
                          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", color: "#AAAAAA", margin: "0 0 4px 0" }}>
                            🚗 {stop.travelTime} by cab
                          </p>
                        )}
                        <p style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: "13px", color: "#AAAAAA", margin: 0, lineHeight: 1.5 }}>
                          {stop.reasoning}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div style={{ marginTop: "32px", paddingTop: "24px", borderTop: "0.5px solid #E0DED8", display: "flex", gap: "10px" }}>
                <button
                  onClick={() => setItinerary([])}
                  style={{ flex: 1, padding: "12px 20px", backgroundColor: "transparent", color: "#888880", fontFamily: "'IBM Plex Mono', monospace", fontSize: "12px", border: "1px solid #E0DED8", borderRadius: "8px", cursor: "pointer", letterSpacing: "0.05em" }}
                >
                  ↺ Reset
                </button>
              </div>

              {isOffline && !loading && (
                <div style={{ 
                  marginTop: "16px", 
                  padding: "10px 14px", 
                  background: "rgba(245, 166, 35, 0.08)", 
                  border: "1px solid rgba(245, 166, 35, 0.3)", 
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  <span style={{ fontSize: "14px" }}>⚠️</span>
                  <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", color: "#F5A623", margin: 0 }}>
                    Smart preview — AI unavailable. Add VITE_GROQ_KEY to Vercel.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { 
          from { opacity: 0; transform: translateY(12px); } 
          to { opacity: 1; transform: translateY(0); } 
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes scaleIn {
          from { transform: scale(0.95); }
          to { transform: scale(1); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.95); }
        }
        @keyframes gentlePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@0,400;0,600;1,400&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');
      `}</style>
    </div>
  );
}