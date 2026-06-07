import { useEffect, useState } from "react";

/**
 * Launch Screen
 * 
 * Full-screen entry animation shown on first load.
 * - Wayfound wordmark fades in (400ms)
 * - Tagline fades in 200ms after
 * - Green line draws left to right under tagline (300ms)
 * - After 2s total, screen fades out
 */

interface LaunchScreenProps {
  onComplete: () => void;
}

export default function LaunchScreen({ onComplete }: LaunchScreenProps) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    // After 2 seconds, start fade out
    const timer = setTimeout(() => {
      setShow(false);
      // After fade out completes, notify parent
      setTimeout(onComplete, 400);
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 bg-[#F7F6F3] flex items-center justify-center z-50 transition-opacity duration-400 ${
        show ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="text-center">
        {/* Wordmark */}
        <h1
          className="font-serif text-[48px] text-[#1A1A1A] mb-2 animate-fade-in"
          style={{ animationDuration: "400ms" }}
        >
          Wayfound
        </h1>

        {/* Tagline */}
        <p
          className="font-mono text-[13px] text-[#888880] mb-3 animate-fade-in"
          style={{ animationDelay: "200ms", animationDuration: "400ms", animationFillMode: "backwards" }}
        >
          Stop searching. Start going.
        </p>

        {/* Animated line */}
        <div
          className="h-[1px] bg-[#34A853] animate-draw-line mx-auto"
          style={{ animationDelay: "400ms", animationDuration: "300ms", animationFillMode: "backwards" }}
        />
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-fade-in {
          animation: fadeIn forwards;
          opacity: 0;
        }
        @keyframes drawLine {
          from {
            width: 0;
          }
          to {
            width: 200px;
          }
        }
        .animate-draw-line {
          animation: drawLine forwards;
          width: 0;
        }
      `}</style>
    </div>
  );
}
