import { useState, useRef } from "react";
import { MapView } from "@/components/Map";
import WayfoundPanel from "@/components/WayfoundPanel";

/**
 * Wayfound — Stop searching. Start going.
 * 
 * GenAI planning layer surgically attached to Google Maps.
 * Design: Looks like native Google Maps, not a new app.
 * 
 * Layout: 58% map (left) + 42% Wayfound panel (right)
 * Mobile: Full-width panel with map hidden
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
    <div className="min-h-screen bg-[#F7F6F3] flex flex-col md:flex-row">
      {/* Left: Google Maps (58% on desktop, hidden on mobile) */}
      <div className="hidden md:flex md:w-[58%] bg-white border-r border-[#E0DED8]">
        <MapView onMapReady={handleMapReady} />
      </div>

      {/* Right: Wayfound Panel (42% on desktop, 100% on mobile) */}
      <div className="w-full md:w-[42%] bg-white border-l border-[#E0DED8] md:border-l md:border-[#E0DED8] flex flex-col overflow-hidden">
        <WayfoundPanel mapRef={mapRef} />
      </div>
    </div>
  );
}
