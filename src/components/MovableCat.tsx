import React, { useState, useEffect, useRef, useCallback } from "react";
import { Sparkles, UtensilsCrossed, X, ChevronUp, GripHorizontal, Move, CornerDownRight } from "lucide-react";

interface MovableCatProps {
  onOpenMenu: () => void;
  onPetCat?: () => void;
  petCount?: number;
}

const CAT_QUOTES = [
  "Meow! Tap me to view our fresh sandwich menu!",
  "Craving truffle melts? Click me to explore the menu 🥪",
  "Fresh brioche batch is baking! Tap me for menu ✨",
  "Click me to open the food & coffee menu!",
  "Move me anywhere if I block any buttons!",
];

export const MovableCat: React.FC<MovableCatProps> = ({ onOpenMenu, onPetCat }) => {
  // Load saved position or default to bottom-right
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    try {
      const saved = localStorage.getItem("niea_cat_pos");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === "number" && typeof parsed.y === "number") {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return { x: 24, y: 120 };
  });

  const [isDragging, setIsDragging] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [minimized, setMinimized] = useState(false);
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number }[]>([]);
  const [pupilOffset, setPupilOffset] = useState({ x: 0, y: 0 });

  const catRef = useRef<HTMLDivElement | null>(null);
  const dragStartRef = useRef<{
    startX: number;
    startY: number;
    posX: number;
    posY: number;
    moved: boolean;
    pointerId: number | null;
  }>({
    startX: 0,
    startY: 0,
    posX: 0,
    posY: 0,
    moved: false,
    pointerId: null,
  });

  // Position initialization to bottom right if on initial desktop/mobile load
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("niea_cat_pos");
      if (!saved) {
        const defaultX = Math.max(16, window.innerWidth - 100);
        const defaultY = Math.max(80, window.innerHeight - 150);
        setPosition({ x: defaultX, y: defaultY });
      }
    }
  }, []);

  // Save position when it changes
  useEffect(() => {
    try {
      localStorage.setItem("niea_cat_pos", JSON.stringify(position));
    } catch {
      // ignore
    }
  }, [position]);

  // Keep within viewport on window resize
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => ({
        x: Math.max(8, Math.min(window.innerWidth - 80, prev.x)),
        y: Math.max(60, Math.min(window.innerHeight - 80, prev.y)),
      }));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Cycle speech quotes
  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % CAT_QUOTES.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Eye tracking towards mouse cursor on desktop (RAF throttled for 60fps smoothness)
  useEffect(() => {
    let rafId: number | null = null;
    let latestEvent: MouseEvent | null = null;

    const updatePupils = () => {
      if (!latestEvent || !catRef.current) {
        rafId = null;
        return;
      }
      const rect = catRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const dx = latestEvent.clientX - centerX;
      const dy = latestEvent.clientY - centerY;
      const angle = Math.atan2(dy, dx);
      const dist = Math.min(Math.hypot(dx, dy) / 30, 2);

      setPupilOffset({
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
      });
      rafId = null;
    };

    const handleMouseMove = (e: MouseEvent) => {
      latestEvent = e;
      if (rafId === null) {
        rafId = requestAnimationFrame(updatePupils);
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  // W3C Pointer Events Dragging Implementation (Works 100% on touch screens & mouse)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only primary button
    if (e.button !== 0 && e.pointerType === "mouse") return;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: position.x,
      posY: position.y,
      moved: false,
      pointerId: e.pointerId,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStartRef.current.startX;
    const deltaY = e.clientY - dragStartRef.current.startY;

    if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
      dragStartRef.current.moved = true;
    }

    const newX = Math.max(8, Math.min(window.innerWidth - 80, dragStartRef.current.posX + deltaX));
    const newY = Math.max(55, Math.min(window.innerHeight - 80, dragStartRef.current.posY + deltaY));
    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    setIsDragging(false);

    // If user merely tapped (did not drag), handle click
    if (!dragStartRef.current.moved) {
      handleCatClick();
    }
  };

  const handlePointerCancel = () => {
    setIsDragging(false);
  };

  const handleCatClick = () => {
    // Spawn floating heart
    setHearts((prev) => [
      ...prev.slice(-3),
      { id: Date.now(), x: Math.random() * 20 - 10, y: -10 },
    ]);

    if (onPetCat) onPetCat();
    onOpenMenu();
  };

  // Quick action: Dock to bottom-right corner if blocking buttons
  const handleDockCorner = (e: React.MouseEvent) => {
    e.stopPropagation();
    const cornerX = Math.max(16, window.innerWidth - 90);
    const cornerY = Math.max(70, window.innerHeight - 110);
    setPosition({ x: cornerX, y: cornerY });
  };

  if (minimized) {
    return (
      <aside className="fixed bottom-4 right-4 z-40">
        <button
          onClick={() => setMinimized(false)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1E2B25] text-[#F5E086] border border-[#F5E086]/40 shadow-xl font-bold text-xs hover:scale-105 active:scale-95 transition"
          title="Open NiEA Mascot"
        >
          <span>🐱 NiEA</span>
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
      </aside>
    );
  }

  return (
    <div
      ref={catRef}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        touchAction: "none",
      }}
      className={`fixed z-40 select-none ${
        isDragging ? "cursor-grabbing scale-105" : "cursor-grab"
      } transition-transform duration-75`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      {/* Moveable Indicator Grip Handle */}
      <div
        className="absolute -top-7 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-black/80 text-[#F5E086] text-[9px] font-black border border-[#F5E086]/40 flex items-center gap-1 shadow-lg backdrop-blur-md whitespace-nowrap cursor-grab active:cursor-grabbing hover:bg-black transition"
        title="Hold and drag anywhere across the screen to move"
      >
        <Move className="w-2.5 h-2.5 text-[#F5E086]" />
        <span>Drag anywhere</span>
      </div>

      {/* Speech Bubble */}
      <div
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute -top-14 -left-20 w-48 bg-[#1E2B25]/95 text-[#F5E086] text-[10px] font-bold py-1.5 px-2.5 rounded-xl border border-[#F5E086]/40 shadow-xl backdrop-blur-md flex items-center justify-between gap-1 pointer-events-auto"
      >
        <button
          onClick={handleCatClick}
          className="truncate text-left hover:underline flex items-center gap-1 flex-1 cursor-pointer"
        >
          <UtensilsCrossed className="w-3 h-3 text-emerald-400 shrink-0" />
          <span className="truncate">{CAT_QUOTES[quoteIndex]}</span>
        </button>

        {/* Dock to Corner shortcut button if blocking buttons */}
        <button
          onClick={handleDockCorner}
          className="text-white/60 hover:text-[#F5E086] shrink-0 p-0.5 transition cursor-pointer"
          title="Dock to bottom-right corner"
        >
          <CornerDownRight className="w-3 h-3" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setMinimized(true);
          }}
          className="text-white/50 hover:text-white shrink-0 p-0.5 transition cursor-pointer"
          title="Minimize mascot"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Floating Hearts Animation */}
      {hearts.map((h) => (
        <span
          key={h.id}
          className="absolute text-rose-400 text-xs pointer-events-none animate-bounce"
          style={{
            left: `${35 + h.x}px`,
            top: `${h.y}px`,
          }}
        >
          ❤️
        </span>
      ))}

      {/* Tuxedo Cat Avatar (Clicking opens menu, Dragging moves it) */}
      <div
        className="w-16 h-16 rounded-full bg-[#1A2621] border-2 border-[#F5E086] shadow-2xl flex items-center justify-center relative hover:scale-105 transition transform active:scale-95 group focus:outline-none cursor-pointer"
        title="I am NiEA! Tap to open Menu, or drag me anywhere on screen!"
      >
        {/* Cat Ears */}
        <span className="absolute -top-2 left-1.5 w-3.5 h-3.5 bg-[#17221D] border-t-2 border-l-2 border-[#F5E086] rounded-tl-md rotate-[-20deg]" />
        <span className="absolute -top-2 right-1.5 w-3.5 h-3.5 bg-[#17221D] border-t-2 border-r-2 border-[#F5E086] rounded-tr-md rotate-[20deg]" />

        {/* Eyes with gaze tracking */}
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3.5 h-3.5 rounded-full bg-[#F5E086] relative overflow-hidden flex items-center justify-center">
            <span
              className="w-1.5 h-2.5 rounded-full bg-[#1E2B25] absolute transition-transform duration-75"
              style={{
                transform: `translate(${pupilOffset.x}px, ${pupilOffset.y}px)`,
              }}
            />
          </div>
          <div className="w-3.5 h-3.5 rounded-full bg-[#F5E086] relative overflow-hidden flex items-center justify-center">
            <span
              className="w-1.5 h-2.5 rounded-full bg-[#1E2B25] absolute transition-transform duration-75"
              style={{
                transform: `translate(${pupilOffset.x}px, ${pupilOffset.y}px)`,
              }}
            />
          </div>
        </div>

        {/* Cute Pink Nose & White Tuxedo Chest */}
        <span className="absolute bottom-3 left-1/2 -translate-x-1/2 w-1.5 h-1 bg-rose-400 rounded-full" />
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-2 bg-white rounded-t-full opacity-90" />

        {/* Menu quick indicator pill */}
        <span className="absolute -bottom-2 bg-[#F5E086] text-[#24332D] text-[9px] font-black px-1.5 py-0.2 rounded-full border border-[#17221D] shadow-sm uppercase tracking-wider">
          Menu
        </span>
      </div>
    </div>
  );
};
