import { Navigation } from "lucide-react";
import { compassLabel } from "@/lib/utils";

interface WindCompassProps {
  speedKmh: number;
  directionDeg: number;
}

export function WindCompass({ speedKmh, directionDeg }: WindCompassProps) {
  const compass = compassLabel(directionDeg);

  return (
    <div className="flex items-center gap-3 rounded-xl border border-abyss-600 bg-abyss-800/60 px-4 py-3">
      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-abyss-600 bg-abyss-900">
        <Navigation
          className="h-6 w-6 text-tide-in transition-transform"
          style={{ transform: `rotate(${directionDeg}deg)` }}
        />
      </div>
      <div>
        <p className="text-lg font-semibold leading-tight text-slate-100">
          {speedKmh.toFixed(0)} km/s
        </p>
        <p className="text-xs text-slate-400">
          {compass.abbr} · {compass.name}
        </p>
      </div>
    </div>
  );
}
