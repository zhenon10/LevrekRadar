"use client";

import { MapPin, ChevronDown } from "lucide-react";
import { useState } from "react";
import { FishingSpot } from "@/lib/types";
import { FISHING_SPOTS } from "@/lib/spots";
import { cn } from "@/lib/utils";

interface SpotSelectorProps {
  selected: FishingSpot;
  onSelect: (spot: FishingSpot) => void;
}

export function SpotSelector({ selected, onSelect }: SpotSelectorProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 rounded-xl border border-abyss-600 bg-abyss-800/80 px-4 py-3 text-left shadow-sm backdrop-blur transition hover:border-tide-in/60"
      >
        <MapPin className="h-5 w-5 shrink-0 text-tide-in" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-100">{selected.name}</p>
          <p className="truncate text-xs text-slate-400">{selected.description}</p>
        </div>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-slate-400 transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-abyss-600 bg-abyss-800 shadow-xl">
          {FISHING_SPOTS.map((spot) => (
            <button
              key={spot.id}
              type="button"
              onClick={() => {
                onSelect(spot);
                setOpen(false);
              }}
              className={cn(
                "block w-full border-b border-abyss-700 px-4 py-3 text-left last:border-b-0 hover:bg-abyss-700",
                spot.id === selected.id && "bg-abyss-700"
              )}
            >
              <p className="text-sm font-medium text-slate-100">{spot.name}</p>
              <p className="text-xs text-slate-400">{spot.description}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
