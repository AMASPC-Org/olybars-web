import React, { useRef, useState, useEffect } from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  action: () => void;
  isActive: boolean;
}

interface InfinityNavRailProps {
  items: NavItem[];
  className?: string;
}

export const InfinityNavRail: React.FC<InfinityNavRailProps> = ({
  items,
  className,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Scroll-fast multiplier
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  // Scroll active item into view on mount/change
  useEffect(() => {
    if (scrollRef.current) {
      const activeItem = scrollRef.current.querySelector(
        '[data-active="true"]',
      );
      if (activeItem) {
        activeItem.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [items.find((i) => i.isActive)?.id]);

  return (
    <div
      className={cn(
        "relative w-full border-b border-white/10 bg-black/40 backdrop-blur-xl",
        className,
      )}
    >
      {/* Scroll Container */}
      <div
        ref={scrollRef}
        className="flex items-center overflow-x-auto no-scrollbar py-2 px-4 gap-2 select-none"
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        style={{
          cursor: isDragging ? "grabbing" : "grab",
          scrollbarWidth: "none", // Firefox
          msOverflowStyle: "none", // IE/Edge
        }}
      >
        {items.map((item) => (
          <button
            key={item.id}
            data-active={item.isActive}
            onClick={(e) => {
              // Prevent click if we were dragging
              if (!isDragging) {
                item.action();
              }
            }}
            className={cn(
              "group relative flex flex-col items-center justify-center min-w-[72px] px-2 py-3 rounded-xl transition-all duration-300",
              "hover:bg-white/5",
              item.isActive
                ? "text-primary"
                : "text-slate-500 hover:text-slate-200",
            )}
          >
            <div
              className={cn(
                "mb-2 p-2 rounded-full transition-all duration-300",
                item.isActive
                  ? "bg-primary/10 scale-110 shadow-[0_0_15px_rgba(250,204,21,0.2)]"
                  : "group-hover:bg-white/5 group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]",
              )}
            >
              <item.icon
                strokeWidth={item.isActive ? 2.5 : 2}
                className={cn(
                  "w-5 h-5 transition-transform duration-300",
                  item.isActive ? "scale-110" : "group-hover:scale-110",
                )}
              />
            </div>

            <span
              className={cn(
                "text-[10px] font-black uppercase tracking-widest transition-opacity duration-300",
                item.isActive
                  ? "opacity-100"
                  : "opacity-70 group-hover:opacity-100",
              )}
            >
              {item.label}
            </span>

            {/* Active Indicator (Yellow Underline) */}
            {item.isActive && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full shadow-[0_0_10px_rgba(250,204,21,0.5)]" />
            )}
          </button>
        ))}
        {/* Spacer for right padding */}
        <div className="w-4 shrink-0" />
      </div>

      {/* Fade Gradients */}
      <div className="absolute top-0 left-0 w-8 h-full bg-gradient-to-r from-black/80 to-transparent pointer-events-none" />
      <div className="absolute top-0 right-0 w-8 h-full bg-gradient-to-l from-black/80 to-transparent pointer-events-none" />
    </div>
  );
};
