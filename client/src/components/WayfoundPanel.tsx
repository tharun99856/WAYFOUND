import { useState, useRef } from "react";

/**
 * Wayfound Panel Component
 * 
 * GenAI planning layer for Google Maps.
 * Design: Looks like native Google Maps, not a startup product.
 * 
 * Features:
 * - Intent input with Instrument Serif placeholder
 * - Timeline-based itinerary with real Hyderabad locations
 * - Replan alert with amber left border
 * - Staggered animations (no spinners, no skeletons)
 * - "Powered by Google Places + Gemini" badge at bottom
 */

interface ItineraryStop {
  id: string;
  place: string;
  time: string;
  cost: string;
  reasoning: string;
  travelTime?: string;
}

interface WayfoundPanelProps {
  mapRef: React.MutableRefObject<google.maps.Map | null>;
}

// Real Hyderabad locations for fallback data
const HYDERABAD_LOCATIONS = {
  productive: [
    {
      id: "1",
      place: "Lamakaan",
      time: "2:30 PM",
      cost: "₹280",
      reasoning: "Open-air cafe in Banjara Hills, quiet workspace, WiFi available",
    },
    {
      id: "2",
      place: "Hussain Sagar Lake",
      time: "3:45 PM",
      cost: "Free",
      reasoning: "8 min by cab, scenic lakeside walk to refresh",
    },
    {
      id: "3",
      place: "Inorbit Mall",
      time: "4:30 PM",
      cost: "₹0–500",
      reasoning: "Hitec City location, browsing and light shopping within budget",
    },
    {
      id: "4",
      place: "Social",
      time: "6:30 PM",
      cost: "₹450/person",
      reasoning: "Jubilee Hills cafe and bar, good for evening wind-down",
    },
  ],
  date: [
    {
      id: "1",
      place: "Hussain Sagar Lake",
      time: "7:00 PM",
      cost: "₹0",
      reasoning: "Starting with the lake keeps the evening unhurried and sets the mood",
    },
    {
      id: "2",
      place: "Ohri's Gufaa",
      time: "8:00 PM",
      cost: "₹900/person",
      reasoning: "Cave-themed interiors on Necklace Road, memorable without being loud",
    },
    {
      id: "3",
      place: "Eat Street",
      time: "9:30 PM",
      cost: "₹200/person",
      reasoning: "Necklace Road dessert stop, open-air setting extends the evening",
    },
  ],
  family: [
    {
      id: "1",
      place: "Hyderabad Zoo",
      time: "9:30 AM",
      cost: "₹100/person",
      reasoning: "Kid-friendly, parking available, opens early",
    },
    {
      id: "2",
      place: "Eat Street",
      time: "12:30 PM",
      cost: "₹400/person",
      reasoning: "Family-sized portions, open-air setting, less crowded",
    },
    {
      id: "3",
      place: "Chowmahalla Palace",
      time: "2:30 PM",
      cost: "₹150/person",
      reasoning: "Heritage site in Old City, educational and scenic",
    },
  ],
};

export default function WayfoundPanel({ mapRef }: WayfoundPanelProps) {
  const [intent, setIntent] = useState("");
  const [itinerary, setItinerary] = useState<ItineraryStop[]>([]);
  const [showReplan, setShowReplan] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Generate itinerary with smart selection based on keywords
  const generateItinerary = (text: string) => {
    if (!text.trim()) return;

    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      let selectedItinerary = HYDERABAD_LOCATIONS.productive;
      const lowerText = text.toLowerCase();

      if (lowerText.includes("date") || lowerText.includes("romantic") || lowerText.includes("couple")) {
        selectedItinerary = HYDERABAD_LOCATIONS.date;
      } else if (lowerText.includes("family") || lowerText.includes("kids") || lowerText.includes("children")) {
        selectedItinerary = HYDERABAD_LOCATIONS.family;
      }

      setItinerary(selectedItinerary);
      setLoading(false);
    }, 800);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generateItinerary(intent);
  };

  const handleExample = () => {
    setIntent("Plan a date night under ₹2000 in Hyderabad");
    setTimeout(() => {
      generateItinerary("Plan a date night under ₹2000 in Hyderabad");
    }, 100);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Intent Input Section */}
      <div className="px-6 pt-6 pb-6 border-b border-[#E0DED8]">
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            placeholder="What do you want to do?"
            className="w-full font-serif text-[15px] text-[#1A1A1A] placeholder-italic placeholder-[#888880] bg-transparent border-b border-[#E0DED8] pb-2 focus:border-[#34A853] transition-colors outline-none leading-relaxed"
          />
          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={!intent.trim() || loading}
              className="px-3 py-2 bg-[#34A853] text-white font-mono text-xs font-medium hover:bg-[#2d8f45] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? "Planning..." : "Generate Plan"}
            </button>
            <button
              type="button"
              onClick={handleExample}
              className="px-3 py-2 border border-[#E0DED8] text-[#1A1A1A] font-mono text-xs hover:bg-[#F7F6F3] active:scale-95 transition-all"
            >
              Example
            </button>
          </div>
        </form>
      </div>

      {/* Replan Alert */}
      {showReplan && (
        <div className="px-6 py-3 border-l-3 border-[#F5A623] bg-[#FFFBF2] animate-fade-in">
          <div className="flex items-center justify-between gap-4">
            <p className="font-mono text-xs text-[#1A1A1A] leading-relaxed">
              Traffic increased. Similar venue 8 min away, ₹950 avg.
            </p>
            <button className="font-mono text-xs text-[#34A853] hover:underline whitespace-nowrap font-medium">
              Switch?
            </button>
          </div>
        </div>
      )}

      {/* Itinerary Timeline */}
      {itinerary.length > 0 && (
        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col">
          <div className="relative flex-1">
            {/* Vertical Timeline Line */}
            <div className="absolute left-2 top-0 bottom-0 w-px bg-[#E0DED8]" />

            {/* Timeline Stops */}
            <div className="space-y-6">
              {itinerary.map((stop, index) => (
                <div
                  key={stop.id}
                  className="pl-8 opacity-0 animate-fade-in-up"
                  style={{
                    animationDelay: `${index * 50}ms`,
                    animationFillMode: "forwards",
                  }}
                >
                  {/* Timeline Dot */}
                  <div className="absolute left-0 top-0 w-1.5 h-1.5 bg-[#34A853] rounded-full mt-1" />

                  {/* Stop Content */}
                  <div>
                    <div className="flex items-baseline justify-between gap-4">
                      <h3 className="font-serif text-[15px] text-[#1A1A1A] font-normal">
                        {stop.place}
                      </h3>
                      <div className="font-mono text-xs text-[#888880] space-x-2 flex-shrink-0">
                        <span>{stop.time}</span>
                        <span>•</span>
                        <span>{stop.cost}</span>
                      </div>
                    </div>
                    <p className="font-serif italic text-xs text-[#AAAAAA] mt-1.5 leading-relaxed">
                      {stop.reasoning}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 pt-6 border-t border-[#E0DED8] flex gap-2">
            <button className="flex-1 px-4 py-2.5 bg-[#34A853] text-white font-mono text-xs font-medium hover:bg-[#2d8f45] transition-colors active:scale-95">
              Start Navigation
            </button>
            <button className="flex-1 px-4 py-2.5 border border-[#E0DED8] text-[#1A1A1A] font-mono text-xs hover:bg-[#F7F6F3] transition-colors active:scale-95">
              Edit Plan
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {itinerary.length === 0 && !loading && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
          <p className="font-serif text-sm text-[#888880] mb-4 leading-relaxed">
            Describe your ideal outing. We'll create a plan.
          </p>
          <div className="space-y-2 text-xs text-[#AAAAAA] font-serif italic">
            <p>"Productive afternoon under ₹500"</p>
            <p>"Date night for 2, under ₹2000"</p>
            <p>"Family day with kids"</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-[#E0DED8] border-t-[#34A853] rounded-full animate-spin mx-auto mb-3" />
            <p className="font-mono text-xs text-[#888880]">Planning your outing…</p>
          </div>
        </div>
      )}

      {/* Live Data Badge - Always Visible at Bottom */}
      <div className="px-6 py-3 border-t border-[#E0DED8] flex items-center gap-2">
        <div className="w-1.5 h-1.5 bg-[#34A853] rounded-full" />
        <p className="font-mono text-xs text-[#888880]">Powered by Google Places + Gemini</p>
      </div>

      {/* Custom Animation Styles */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 200ms ease-out forwards;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-fade-in {
          animation: fadeIn 150ms ease-out;
        }
      `}</style>
    </div>
  );
}
