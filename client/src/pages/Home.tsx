import { useState, useRef } from "react";
import { MapView } from "@/components/Map";
import CopilotPanel from "@/components/CopilotPanel";

/**
 * Maps Copilot — AI Planning Companion
 * 
 * Design: Clean editorial aesthetic, two-column split layout
 * Left (58%): Google Maps embed
 * Right (42%): Copilot planning panel with intent input and itinerary timeline
 */
export default function Home() {
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);

  const handleMapReady = (map: google.maps.Map) => {
    mapRef.current = map;
    // Center on Hyderabad
    map.setCenter({ lat: 17.3850, lng: 78.4867 });
    map.setZoom(13);
    setMapReady(true);
  };

  return (
    <div className="min-h-screen bg-[#F7F6F3] flex">
      {/* Browser Chrome Mockup */}
      <div className="flex-1 flex flex-col bg-[#F7F6F3]">
        {/* Browser Header */}
        <div className="bg-white border-b border-[#E0DED8] px-4 py-3 flex items-center gap-3 shadow-sm">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-[#F5A623]"></div>
            <div className="w-3 h-3 rounded-full bg-[#34A853]"></div>
            <div className="w-3 h-3 rounded-full bg-[#4285F4]"></div>
          </div>
          <div className="flex-1 bg-[#F7F6F3] px-3 py-1 text-xs text-[#888880] font-mono border border-[#E0DED8]">
            maps.google.com/copilot
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden bg-white">
          {/* Left: Map Panel (58%) */}
          <div className="w-[58%] border-r border-[#E0DED8] bg-white">
            <MapView onMapReady={handleMapReady} />
          </div>

          {/* Right: Copilot Panel (42%) */}
          <div className="w-[42%] bg-white overflow-y-auto border-l border-[#E0DED8]">
            <CopilotPanel mapRef={mapRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
