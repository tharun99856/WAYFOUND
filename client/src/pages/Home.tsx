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

// ─── AI Prompt ────────────────────────────────────────────────────────────────

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

EXPERIENCE TYPES: FOOD TRAIL | CAFE HOPPING | DATE NIGHT | FAMILY DAY OUT | HERITAGE WALK | STUDENT HANGOUT | SHOPPING DAY | NIGHT OUT | WORKATION | FITNESS DAY | PHOTO WALK | RAINY DAY PLAN | BUDGET DAY OUT | PREMIUM LUXURY | TEAM OUTING | BIRTHDAY PLAN | TOURIST DAY | SOLO EXPLORATION

PLACES DATABASE (real, verified, operational):
SHOPPING: Inorbit Mall (Madhapur), GVK One (Banjara Hills), Forum Sujana City (Kukatpally), Sarath City Capital Mall (Kondapur), Nexus Hyderabad Mall (Kukatpally), Lulu Mall (Kukatpally)
HISTORICAL/CULTURE: Chowmahalla Palace (Old City), Golconda Fort (Ibrahim Bagh — CLOSES 5:30 PM), Charminar (Old City), Salar Jung Museum (Darulshifa — CLOSES 5 PM), Birla Mandir (Naubat Pahad), Falaknuma Palace (Falaknuma), Shilparamam (Madhapur)
NATURE/LAKES: Hussain Sagar/Tank Bund (BEST sunset 6-7 PM), KBR National Park (CLOSES 6 PM), Osman Sagar (Gandipet), Durgam Cheruvu (Jubilee Hills), Lumbini Park (Secretariat Rd)
GO-KARTING: Wheelz Go-Karting (Gachibowli), Raceology (Gachibowli), F9 Go-Karting (Kompally), iKart Racing (Shamshabad)
ADVENTURE/GAMING: Smaaash Entertainment (Inorbit Mall Madhapur), Rush Escape Room (Madhapur), Timezone (Nexus Mall Kukatpally), Jumpzone Trampoline Park (Gachibowli), Lazer Zone VR (Banjara Hills), Snow World (Lower Tank Bund)
SPORTS TURFS: PlayOn Turf (Gachibowli), Champions Turf (Madhapur), Premier Box Cricket (Gachibowli), Playo Badminton (Madhapur)
BIRYANI/ICONIC: Paradise Restaurant (Secunderabad), Bawarchi (RTC X Roads), Shah Ghouse (Tolichowki), Shadab Hotel (Old City), Sarvi Hotel (Banjara Hills), Cafe Bahar (Basheer Bagh), Nimrah Cafe (near Charminar), Pista House (Pathergatti)
FINE DINING: Ohri's Gufaa (Necklace Road), The Fisherman's Wharf (Banjara Hills), Farzi Cafe (Banjara Hills), Olive Bistro (Jubilee Hills), Barbeque Nation (multiple), AB's Absolute Barbecues (Gachibowli), The Moonshine Project (Jubilee Hills)
CAFES: Social (Jubilee Hills), Lamakaan (Banjara Hills), Roastery Coffee House (Jubilee Hills), Autumn Leaf Cafe (Jubilee Hills), Tabula Rasa (Banjara Hills), Third Wave Coffee (multiple)
DESSERTS: Cream Stone (multiple), Haagen-Dazs (GVK One), Rollacosta (Gachibowli), Concu Chocolatier (Jubilee Hills), Almond House (multiple)
NIGHTLIFE: Social (Jubilee Hills), Prost Brew Pub (Gachibowli), Hard Rock Cafe (Banjara Hills), Prism Skybar (Madhapur), Bootlegger (Jubilee Hills)

GROUP CONTEXT RULES:
- Kids/families: parks, Ramoji Film City, zoo, Snow World, safe food, NO bars
- College guys 18-22: go-karting, turfs, gaming, biryani, box cricket, escape rooms
- College mixed 18-22: cafes, malls, escape rooms, desserts, casual dining
- Couples: Hussain Sagar sunset, Durgam Cheruvu, fine dining, rooftop, quiet cafes
- Corporate: fine dining, rooftop bars, cultural spots
- Tourists: Charminar → Golconda → Paradise biryani → Old City → Hussain Sagar
- 40+: cultural sites, comfortable restaurants, malls, heritage walks
- 8+ people: turfs, Barbeque Nation, escape rooms, Smaaash

BUDGET RULES — CRITICAL:
Budget = TOTAL for the ENTIRE GROUP. Never per person.
estimatedCost = total rupees at that stop by ALL people.
Sum of ALL estimatedCost ≤ total budget. Use 85–100%. Don't exceed.
Per-person math in reasoning only: "₹600/person × 4 = ₹2400 total"
Default: ₹2000 total if none stated.

TIME RULES:
Default start: 7:00 PM. Golconda — never after 4 PM. Salar Jung / KBR — mornings only.
Old City 4–8 PM: add 25-30 min buffer. Hussain Sagar: best at sunset and night.
Malls: 11AM–10PM. Add 10-15 min to all cabs during 5-8 PM.
Visit durations: Adventure 60-90 min | Meals 45-60 min | Cafes 30-45 min | Dessert 20-30 min | Heritage 45-90 min.

RULES: No zig-zag routes. No stops >15km apart. No consecutive same category. 3-5 stops.
PRINCIPLE: Users want outcomes, not locations. "What makes this outing successful?"`;

// ─── Examples ─────────────────────────────────────────────────────────────────

const EXAMPLES = [
  "4 friends, age 19, go-karting and food under ₹2500",
  "2 people, age 40, romantic dinner and evening ₹3000",
  "6 guys, age 25, gaming zone and biryani ₹3600",
  "Family of 4, age 35, cultural day and lunch ₹2000",
];

// ─── Logo SVG ─────────────────────────────────────────────────────────────────

function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 2C9.03 2 5 6.03 5 11c0 6.5 9 15 9 15s9-8.5 9-15c0-4.97-4.03-9-9-9z" fill="var(--color-green)" />
      <path d="M9 9.5L11.2 16L14 11.5L16.8 16L19 9.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

// ─── Chip ─────────────────────────────────────────────────────────────────────

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" className={`wf-chip${active ? " active" : ""}`} onClick={onClick}>
      {label}
    </button>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

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

  const [groupSize, setGroupSize] = useState(2);
  const [ageGroup, setAgeGroup] = useState("20s");
  const [occasion, setOccasion] = useState("");
  const [budget, setBudget] = useState("");
  const [wantsFood, setWantsFood] = useState(true);
  const [experience, setExperience] = useState("");

  // ── Map ──

  const handleMapReady = (map: google.maps.Map) => {
    mapRef.current = map;
    map.setCenter({ lat: 17.385, lng: 78.4867 });
    map.setZoom(13);
    placesRef.current = new google.maps.places.PlacesService(map);
    directionsRef.current = new google.maps.DirectionsRenderer({
      map, suppressMarkers: true,
      polylineOptions: { strokeColor: "#34A853", strokeWeight: 3 },
    });
  };

  const clearMarkers = () => { markersRef.current.forEach(m => (m.map = null)); markersRef.current = []; };

  const addMarkers = (stops: ItineraryStop[]) => {
    if (!mapRef.current) return;
    clearMarkers();
    stops.forEach(stop => {
      if (!stop.location) return;
      markersRef.current.push(new google.maps.marker.AdvancedMarkerElement({ map: mapRef.current, position: stop.location, title: stop.place }));
    });
    const withLoc = stops.filter(s => s.location);
    if (withLoc.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      withLoc.forEach(s => bounds.extend(s.location!));
      mapRef.current.fitBounds(bounds);
    }
  };

  // ── Data ──

  const fetchPlace = (query: string): Promise<{ placeId: string; location: google.maps.LatLngLiteral; name: string } | null> =>
    new Promise(resolve => {
      if (!placesRef.current) return resolve(null);
      placesRef.current.findPlaceFromQuery(
        { query, fields: ["place_id", "geometry", "name"] },
        (results: google.maps.places.PlaceResult[] | null, status: google.maps.places.PlacesServiceStatus) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results?.[0]?.geometry?.location) {
            const p = results[0];
            resolve({ placeId: p.place_id!, location: { lat: p.geometry!.location!.lat(), lng: p.geometry!.location!.lng() }, name: p.name! });
          } else resolve(null);
        }
      );
    });

  const buildStops = async (raw: GeminiStop[]): Promise<ItineraryStop[]> =>
    Promise.all(raw.map(async (s, i) => {
      const place = await fetchPlace(`${s.placeName} ${s.address} Hyderabad`);
      return { id: `stop-${i}`, place: place?.name ?? s.placeName, placeId: place?.placeId, location: place?.location, time: s.time, cost: `₹${s.estimatedCost}`, reasoning: s.reasoning, travelTime: s.travelTimeFromPrevious };
    }));

  // ── Generate ──

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
        body: JSON.stringify({ model: "llama-3.1-8b-instant", messages: [{ role: "system", content: SYSTEM_INSTRUCTION }, { role: "user", content: userIntent }], temperature: 0.7, max_tokens: 1024 }),
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
      // keep mock silently
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMode === "structured") {
      const ageMap: Record<string, string> = { teens: "17", "20s": "22", "30s": "32", "40s": "42", "50+": "52" };
      const parts = [`${groupSize} people`, `age ${ageMap[ageGroup] || "22"}`, occasion, wantsFood ? "food" : "", experience, budget ? `under ₹${budget}` : ""].filter(Boolean);
      const built = parts.join(", ");
      setIntent(built);
      generate(built);
    } else {
      generate(intent);
    }
  };

  // ── Budget ──

  const totalSpent = itinerary.reduce((sum, s) => sum + parseInt(s.cost.replace("₹", "").replace(/,/g, "") || "0"), 0);
  const budgetPct = lastTotalBudget > 0 ? Math.round((totalSpent / lastTotalBudget) * 100) : 0;

  // ── Render ──

  return (
    <div className="wf-root">

      {/* ── MAP PANEL ── */}
      <div className="wf-map-panel">
        <div className="wf-map-img-wrap">
          <img
            src="/hyderabad-map.png"
            alt="Hyderabad"
            onError={e => {
              const t = e.currentTarget; t.style.display = "none";
              const p = t.parentElement;
              if (p) { p.style.background = "#EEF7F1"; p.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;flex-direction:column;gap:8px;color:var(--color-green)"><span style="font-size:36px">🗺️</span><span style="font-family:var(--font-serif);font-size:16px">Hyderabad</span></div>'; }
            }}
          />
        </div>

        {/* Location badge */}
        <div className="wf-map-badge">
          <span style={{ fontSize: "13px" }}>📍</span>
          <div>
            <span className="wf-map-badge-name">Hyderabad</span>
            <span className="wf-map-badge-sub">City of Pearls</span>
          </div>
        </div>

        {/* Examples card — floats over map */}
        <div className="wf-explore">
          <p className="wf-explore-title">Ready to explore?</p>
          <p className="wf-explore-sub">Try one of these or type your own →</p>
          {EXAMPLES.map((ex, i) => (
            <button key={i} className="wf-example-btn" onClick={() => { setIntent(ex); generate(ex); }}>
              {ex}
            </button>
          ))}
          <div className="wf-powered">
            <div className="wf-powered-dot" />
            <span className="wf-powered-label">Groq AI · Google Places</span>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="wf-panel">

        {/* Header */}
        <div className="wf-header">
          <div className="wf-logo-row">
            <LogoMark size={30} />
            <h1 className="wf-wordmark">Wayfound</h1>
          </div>
          <div className="wf-tagline-row">
            <p className="wf-tagline">Stop searching. Start going.</p>
            <div className="wf-badge">
              <div className="wf-badge-dot" />
              <span className="wf-badge-text">AI Live</span>
            </div>
          </div>
        </div>

        {/* Input */}
        <div className="wf-input-area">
          <form onSubmit={handleSubmit}>

            {/* Toggle */}
            <div className="wf-toggle">
              {(["text", "structured"] as const).map(mode => (
                <button key={mode} type="button" className={`wf-toggle-btn${inputMode === mode ? " active" : ""}`} onClick={() => setInputMode(mode)}>
                  {mode === "text" ? "✏ Type" : "⊞ Choose"}
                </button>
              ))}
            </div>

            {/* Text mode */}
            {inputMode === "text" && (
              <input
                className="wf-text-input"
                type="text"
                value={intent}
                onChange={e => setIntent(e.target.value)}
                placeholder="4 friends, age 19, go-karting and food under ₹3000"
              />
            )}

            {/* Structured mode */}
            {inputMode === "structured" && (
              <div className="wf-fields">
                <div>
                  <span className="wf-field-label">Group Size</span>
                  <div className="wf-chips">
                    {[1, 2, 3, 4, 5, 6, 8, 10].map(n => <Chip key={n} label={String(n)} active={groupSize === n} onClick={() => setGroupSize(n)} />)}
                  </div>
                </div>
                <div>
                  <span className="wf-field-label">Age Group</span>
                  <div className="wf-chips">
                    {["teens", "20s", "30s", "40s", "50+"].map(a => <Chip key={a} label={a} active={ageGroup === a} onClick={() => setAgeGroup(a)} />)}
                  </div>
                </div>
                <div>
                  <span className="wf-field-label">Occasion</span>
                  <div className="wf-chips">
                    {["friends hangout", "date night", "family day", "birthday", "team outing", "solo"].map(o => <Chip key={o} label={o} active={occasion === o} onClick={() => setOccasion(occasion === o ? "" : o)} />)}
                  </div>
                </div>
                <div>
                  <span className="wf-field-label">Vibe</span>
                  <div className="wf-chips">
                    {["go-karting", "food trail", "cafe hopping", "heritage walk", "night out", "shopping", "adventure", "gaming"].map(v => <Chip key={v} label={v} active={experience === v} onClick={() => setExperience(experience === v ? "" : v)} />)}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
                  <div style={{ flex: 1 }}>
                    <span className="wf-field-label">Budget ₹ total</span>
                    <input className="wf-number-input" type="number" value={budget} onChange={e => setBudget(e.target.value)} placeholder="e.g. 3000" />
                  </div>
                  <div>
                    <span className="wf-field-label">Food?</span>
                    <Chip label={wantsFood ? "✓ Yes" : "No"} active={wantsFood} onClick={() => setWantsFood(!wantsFood)} />
                  </div>
                </div>
              </div>
            )}

            <button type="submit" className="wf-submit" disabled={inputMode === "text" ? (!intent.trim() || loading) : loading}>
              {loading
                ? <><span className="wf-spinner" />{itinerary.length > 0 ? "Refining with AI..." : "Planning..."}</>
                : "Generate Itinerary →"
              }
            </button>
            <span className="wf-submit-hint">Defaults: ₹2000 total · 7 PM · Hyderabad</span>
          </form>
        </div>

        {/* Replan */}
        {showReplan && (
          <div className="wf-replan">
            <div>
              <span className="wf-replan-label">Traffic spike</span>
              <span className="wf-replan-msg">Similar venue 8 min away, ₹50 cheaper. Switch?</span>
            </div>
            <button className="wf-replan-btn" onClick={() => setShowReplan(false)}>Switch</button>
          </div>
        )}

        {/* Results */}
        <div className="wf-results">

          {/* Loading */}
          {loading && (
            <div className="wf-loading-row">
              <div className="wf-loading-spinner" />
              <span className="wf-loading-text">
                {itinerary.length > 0 ? "AI refining results..." : "Planning your adventure..."}
              </span>
            </div>
          )}

          {/* Itinerary */}
          {itinerary.length > 0 && (
            <>
              <div className="wf-summary">
                <span className="wf-summary-label">{itinerary.length} stops · optimised route</span>
                {lastTotalBudget > 0 && (
                  <span className="wf-budget-display" style={{ color: budgetPct > 100 ? "var(--color-danger)" : "var(--color-green)" }}>
                    ₹{totalSpent.toLocaleString()} / ₹{lastTotalBudget.toLocaleString()} · {budgetPct}%
                  </span>
                )}
              </div>

              <div className="wf-timeline">
                {itinerary.map((stop, i) => {
                  const rawCost = parseInt(stop.cost.replace("₹", "").replace(/,/g, "") || "0");
                  const perPerson = lastGroupSize > 1 ? Math.round(rawCost / lastGroupSize) : 0;
                  return (
                    <div key={stop.id} className="wf-stop" style={{ animationDelay: `${i * 50}ms` }}>
                      <div className="wf-stop-dot" />
                      <div className="wf-stop-row">
                        <span className="wf-stop-name">{stop.place}</span>
                        <span className="wf-stop-time">{stop.time}</span>
                      </div>
                      <div className="wf-stop-cost-row">
                        <span className="wf-stop-cost">₹{rawCost.toLocaleString()}</span>
                        {lastGroupSize > 1 && perPerson > 0 && (
                          <span className="wf-stop-cost-pp">₹{perPerson.toLocaleString()}/pp × {lastGroupSize}</span>
                        )}
                      </div>
                      {stop.travelTime && stop.travelTime !== "0 min" && (
                        <span className="wf-stop-travel">{stop.travelTime} by cab</span>
                      )}
                      <p className="wf-stop-reason">{stop.reasoning}</p>
                    </div>
                  );
                })}
              </div>

              <div className="wf-footer">
                {isOffline && !loading && (
                  <div className="wf-offline-badge">
                    <span style={{ fontSize: "11px" }}>⚠</span>
                    <span className="wf-offline-text">Smart preview · AI key missing in Vercel env</span>
                  </div>
                )}
                <button className="wf-reset-btn" onClick={() => { setItinerary([]); setIntent(""); }}>
                  ↺ Reset
                </button>
              </div>
            </>
          )}

          {/* Empty */}
          {itinerary.length === 0 && !loading && (
            <div className="wf-empty">
              <span className="wf-empty-icon">🗺</span>
              <p className="wf-empty-text">Your plan will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
