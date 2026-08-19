import { CalendarDays } from "lucide-react";
import { DailySummary } from "@/lib/types";
import { cn, dayLabelFor, scoreColorClass, shortDateFor } from "@/lib/utils";

interface WeekCalendarProps {
  days: DailySummary[];
  selectedDateKey: string;
  onSelect: (dateKey: string) => void;
}

export function WeekCalendar({ days, selectedDateKey, onSelect }: WeekCalendarProps) {
  return (
    <div className="rounded-2xl border border-abyss-600 bg-abyss-900/80 p-4">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-slate-300">
        <CalendarDays className="h-4 w-4 text-tide-in" />7 Günlük Takvim
      </h2>

      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day) => {
          const selected = day.dateKey === selectedDateKey;
          return (
            <button
              key={day.dateKey}
              type="button"
              onClick={() => onSelect(day.dateKey)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl border px-1 py-2.5 transition",
                selected
                  ? "border-tide-in bg-tide-in/10"
                  : "border-abyss-700 bg-abyss-800/40 hover:border-abyss-600"
              )}
            >
              <span className="text-[10px] font-medium uppercase text-slate-400">
                {dayLabelFor(day.dateKey)}
              </span>
              <span className="text-[9px] text-slate-500">{shortDateFor(day.dateKey)}</span>
              <span className={cn("text-base font-bold tabular-nums", scoreColorClass(day.bestScore))}>
                {day.bestScore}
              </span>
              <span className="text-[8px] text-slate-500">ort. {day.avgScore}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
