import { useState, useRef } from "react";
import { MapPin, ChevronRight } from "lucide-react";
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

const SYSTEM_INSTRUCTION = `You are Wayfound, a context-aware planning engine for Hyderabad, India. Generate precise itineraries based on group size, age, budget, and preferences.

CRITICAL OUTPUT FORMAT:
- Return ONLY a valid JSON array — no markdown, no \`\`\`json, no explanation, no preamble
- Each item must have EXACTLY these fields:
  • placeName (string): Real venue name in Hyderabad
  • address (string): Specific area/landmark (e.g., "Road No 36, Jubilee Hills")
  • time (string): 12-hour format with AM/PM (e.g., "7:00 PM", "8:45 PM")
  • estimatedCost (number): INR per person, realistic 2026 pricing
  • travelTimeFromPrevious (string): Format "X min" (e.g., "0 min", "15 min", "22 min")
  • reasoning (string): One practical sentence explaining why this fits their context

CONTEXT-AWARE RECOMMENDATIONS:
- AGE 15-25: Prefer go-karting, gaming zones, turfs, trendy cafes, adventure activities, malls
- AGE 25-40: Mix of fine dining, breweries, cultural spots, adventure activities, upscale venues
- AGE 40+: Cultural places, malls, comfortable restaurants, parks, historical sites, relaxed venues
- GROUP SIZE: Consider venue capacity and group dynamics
- OCCASION: Date (romantic), Friends (social/adventure), Family (kid-friendly), Solo (peaceful)

HYDERABAD VENUE DATABASE (100+ places):
MALLS: Inorbit, GVK One, Forum Sujana, Sarath City Capital, Lulu, Manjeera, City Center
PARKS: KBR Park, Hussain Sagar, Lumbini Park, Nehru Zoo, Botanical Garden, Durgam Cheruvu
HISTORICAL: Chowmahalla Palace, Golconda Fort, Salar Jung Museum, Charminar, Qutb Shahi Tombs, Birla Mandir
GO-KARTING: Raceology (Gachibowli), F9 (Kompally), iKart (Shamshabad)
ADVENTURE: Smaaash, Rush Adventure Park, Wild Waters, Wonderla, Jalavihar
SPORTS: PlayOn Turf, Turf Town, Box Cricket, Playo Badminton
GAMING: Timezone, Breakout Escape Rooms, VR Lounge, Amoeba Bowling
BIRYANI: Paradise, Bawarchi, Shah Ghouse, Shadab, Sarvi
CAFES: Lamakaan, Roastery Coffee House, Autumn Leaf, Tabula Rasa, Heart Cup Coffee
FINE DINING: Olive Bistro, Fisherman's Wharf, Ohri's Gufaa, Farzi Cafe, Taj Falaknuma
DESSERTS: Cream Stone, Häagen-Dazs, Concu, Over the Moon, Almond House, Karachi Bakery
NIGHTLIFE: Social, Prost, Prism, 10 Downing Street, Hard Rock Cafe, B-Dubs
UNIQUE: Ramoji Film City, Snow World, Birla Planetarium, Shilparamam, Sudha Cars Museum

BUDGET & TIME RULES:
- Extract: group size, age, budget (total or per person), start time
- If group size given, divide total budget by group size
- Default: ₹1500 per person, starts 7:00 PM
- Time calc: previous time + visit duration + travel time
- Visit durations: Activities (60-90min), Meals (60min), Cafes (30-45min), Dessert (25min)

EXAMPLE OUTPUT:
[{"placeName":"Raceology Go-Karting","address":"Gachibowli","time":"7:00 PM","estimatedCost":600,"travelTimeFromPrevious":"0 min","reasoning":"Perfect for 19-year-old group, adrenaline rush"},{"placeName":"Paradise Biryani","address":"Banjara Hills","time":"8:45 PM","estimatedCost":350,"travelTimeFromPrevious":"15 min","reasoning":"Iconic Hyderabad biryani, group-friendly"},{"placeName":"Cream Stone Ice Cream","address":"Jubilee Hills","time":"10:00 PM","estimatedCost":200,"travelTimeFromPrevious":"10 min","reasoning":"Trendy dessert spot for young groups"}]`;


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

    try {
      // Try OpenRouter API (more reliable)
      console.log("Calling OpenRouter API...");
      const res = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "HTTP-Referer": window.location.origin,
            "X-Title": "Wayfound",
          },
          body: JSON.stringify({
            model: "google/gemini-flash-1.5",
            messages: [
              { role: "system", content: SYSTEM_INSTRUCTION },
              { role: "user", content: userIntent }
            ],
          }),
        }
      );

      if (!res.ok) {
        const errorText = await res.text();
        console.error("OpenRouter API error:", res.status, errorText);
        throw new Error("api error");
      }
      
      const data = await res.json();
      console.log("OpenRouter response:", data);
      
      let text = data.choices?.[0]?.message?.content ?? "";
      text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      console.log("Parsed text:", text);
      
      const parsed: GeminiStop[] = JSON.parse(text);
      const stops = await buildStops(parsed);
      setItinerary(stops);
      addMarkers(stops);
      setTimeout(() => { setShowReplan(true); setTimeout(() => setShowReplan(false), 8000); }, 3000);
    } catch (error) {
      console.error("Error generating itinerary:", error);
      const mock = generateMockItinerary(userIntent);
      const stops = await buildStops(mock);
      setItinerary(stops);
      setIsOffline(true);
      addMarkers(stops);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); generate(intent); };

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

        {/* Header - Enhanced */}
        <div style={{ 
          padding: "48px 32px 32px", 
          borderBottom: "1px solid #E0DED8", 
          flexShrink: 0,
          background: "linear-gradient(to bottom, #FFFFFF, #FDFCFA)",
          position: "relative",
          overflow: "hidden"
        }}>
          {/* Subtle decorative element */}
          <div style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "200px",
            height: "200px",
            background: "radial-gradient(circle, rgba(52, 168, 83, 0.03), transparent)",
            pointerEvents: "none"
          }} />
          
          <div style={{ position: "relative", zIndex: 1 }}>
            <h1 style={{ 
              fontFamily: "'Instrument Serif', serif", 
              fontSize: "72px", 
              color: "#1A1A1A", 
              margin: "0 0 8px 0", 
              fontWeight: 600, 
              lineHeight: 1,
              letterSpacing: "-0.02em",
              animation: "fadeInScale 0.8s ease-out"
            }}>
              Wayfound
            </h1>
            <p style={{ 
              fontFamily: "'Instrument Serif', serif", 
              fontSize: "20px", 
              color: "#888880", 
              fontStyle: "italic", 
              margin: "0 0 16px 0",
              animation: "fadeIn 0.8s ease-out 0.2s both"
            }}>
              Stop searching. Start going.
            </p>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              background: "linear-gradient(135deg, rgba(52, 168, 83, 0.08), rgba(52, 168, 83, 0.04))",
              borderRadius: "20px",
              border: "1px solid rgba(52, 168, 83, 0.2)",
              animation: "fadeIn 0.8s ease-out 0.4s both"
            }}>
              <div style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#34A853",
                animation: "gentlePulse 3s ease-in-out infinite"
              }} />
              <span style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "11px",
                color: "#34A853",
                fontWeight: "600",
                letterSpacing: "0.05em",
                textTransform: "uppercase"
              }}>
                AI-Powered
              </span>
            </div>
          </div>
        </div>

        {/* Intent input - Enhanced */}
        <div style={{ padding: "32px", borderBottom: "1px solid #E0DED8", flexShrink: 0, background: "white" }}>
          <form onSubmit={handleSubmit}>
            <label style={{ 
              fontFamily: "'IBM Plex Mono', monospace", 
              fontSize: "11px", 
              color: "#888880", 
              textTransform: "uppercase", 
              letterSpacing: "0.1em", 
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "12px",
              fontWeight: "600"
            }}>
              <span style={{ 
                width: "3px", 
                height: "12px", 
                background: "#34A853", 
                borderRadius: "2px" 
              }} />
              Your Intent
            </label>
            <input
              type="text"
              value={intent}
              onChange={e => setIntent(e.target.value)}
              placeholder="e.g., 4 people, age 19, biryani and gaming under ₹3000"
              style={{
                width: "100%",
                fontFamily: "'Instrument Serif', serif",
                fontStyle: "italic",
                fontSize: "17px",
                color: "#1A1A1A",
                padding: "16px 20px",
                border: "2px solid #E0DED8",
                borderRadius: "16px",
                outline: "none",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                background: "linear-gradient(to bottom, white, #FDFCFA)",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)"
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#34A853";
                e.currentTarget.style.boxShadow = "0 4px 16px rgba(52, 168, 83, 0.12)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#E0DED8";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.04)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            />
            <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
              <button
                type="submit"
                disabled={!intent.trim() || loading}
                style={{
                  flex: 1,
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: "14px",
                  fontWeight: "600",
                  padding: "14px 24px",
                  background: loading ? "#CCCCCC" : "linear-gradient(135deg, #34A853, #2d8f45)",
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  cursor: loading || !intent.trim() ? "not-allowed" : "pointer",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow: loading ? "none" : "0 4px 12px rgba(52, 168, 83, 0.25)",
                  letterSpacing: "0.03em",
                  textTransform: "uppercase"
                }}
                onMouseEnter={(e) => {
                  if (!loading && intent.trim()) {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 6px 20px rgba(52, 168, 83, 0.35)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = loading ? "none" : "0 4px 12px rgba(52, 168, 83, 0.25)";
                }}
              >
                {loading ? (
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                    <span style={{ display: "inline-block", width: "14px", height: "14px", border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    Planning...
                  </span>
                ) : "Generate Itinerary"}
              </button>
            </div>
            <p style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: "12px",
              fontStyle: "italic",
              color: "#AAAAAA",
              margin: "12px 0 0 0",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}>
              <span style={{ fontSize: "14px" }}>💡</span>
              Specify: group size, age, activities, budget. Defaults: ₹1500/person, 7 PM
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
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "16px" }}>
              <div style={{ width: "32px", height: "32px", border: "2px solid #E0DED8", borderTopColor: "#34A853", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              <p style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: "15px", color: "#888880" }}>Planning your adventure...</p>
            </div>
          )}

          {/* Itinerary */}
          {!loading && itinerary.length > 0 && (
            <div>
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", color: "#888880", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 24px 0" }}>
                {itinerary.length} stops · optimised route
              </p>

              {/* Timeline */}
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: "8px", top: "8px", bottom: "8px", width: "1px", backgroundColor: "#E0DED8" }} />
                <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
                  {itinerary.map((stop, i) => (
                    <div
                      key={stop.id}
                      style={{ paddingLeft: "32px", position: "relative", animation: `fadeUp 0.3s ease-out ${i * 60}ms both` }}
                    >
                      <div style={{ position: "absolute", left: "3px", top: "4px", width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#34A853" }} />
                      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "8px", marginBottom: "4px" }}>
                        <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: "16px", color: "#1A1A1A" }}>{stop.place}</span>
                        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "12px", color: "#888880", whiteSpace: "nowrap" }}>{stop.time} · {stop.cost}</span>
                      </div>
                      {stop.travelTime && stop.travelTime !== "0 min" && (
                        <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", color: "#AAAAAA", margin: "0 0 4px 0" }}>
                          {stop.travelTime} by cab
                        </p>
                      )}
                      <p style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: "13px", color: "#AAAAAA", margin: 0, lineHeight: 1.5 }}>
                        {stop.reasoning}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div style={{ marginTop: "32px", paddingTop: "24px", borderTop: "0.5px solid #E0DED8", display: "flex", gap: "10px" }}>
                <button
                  onClick={handleNav}
                  style={{ flex: 1, padding: "12px", backgroundColor: "#34A853", color: "#FFFFFF", fontFamily: "'IBM Plex Mono', monospace", fontSize: "13px", border: "none", borderRadius: "4px", cursor: "pointer" }}
                >
                  Start navigation →
                </button>
                <button
                  onClick={() => setItinerary([])}
                  style={{ padding: "12px 20px", backgroundColor: "transparent", color: "#1A1A1A", fontFamily: "'IBM Plex Mono', monospace", fontSize: "13px", border: "0.5px solid #E0DED8", borderRadius: "4px", cursor: "pointer" }}
                >
                  Reset
                </button>
              </div>

              {isOffline && (
                <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "#CCCCCC", textAlign: "center", marginTop: "16px" }}>
                  Offline mode
                </p>
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