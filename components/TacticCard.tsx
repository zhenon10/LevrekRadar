import { Fish, Anchor, Ruler } from "lucide-react";
import { TackleAdvice } from "@/lib/types";

interface TacticCardProps {
  advice: TackleAdvice;
}

export function TacticCard({ advice }: TacticCardProps) {
  return (
    <div className="rounded-2xl border border-abyss-600 bg-abyss-900/80 p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-300">
        Taktik & Takım Önerisi
      </h2>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex items-start gap-3 rounded-xl border border-abyss-600 bg-abyss-800/60 px-4 py-3">
          <Anchor className="mt-0.5 h-5 w-5 shrink-0 text-tide-in" />
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">İğne Numarası</p>
            <p className="text-sm font-medium text-slate-100">{advice.hookSize}</p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-abyss-600 bg-abyss-800/60 px-4 py-3">
          <Ruler className="mt-0.5 h-5 w-5 shrink-0 text-tide-in" />
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Lider Kalınlığı</p>
            <p className="text-sm font-medium text-slate-100">{advice.leaderStrengthFC}</p>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-start gap-3 rounded-xl border border-tide-in/30 bg-tide-in/5 px-4 py-3">
        <Fish className="mt-0.5 h-5 w-5 shrink-0 text-tide-in" />
        <div>
          <p className="text-xs uppercase tracking-wide text-tide-in/80">{advice.baitStrategy}</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-200">{advice.tip}</p>
        </div>
      </div>
    </div>
  );
}
