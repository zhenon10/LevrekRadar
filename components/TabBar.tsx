import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TabItem<T extends string> {
  id: T;
  label: string;
  icon: LucideIcon;
}

interface TabBarProps<T extends string> {
  tabs: TabItem<T>[];
  active: T;
  onChange: (id: T) => void;
}

export function TabBar<T extends string>({ tabs, active, onChange }: TabBarProps<T>) {
  return (
    <div className="grid grid-flow-col auto-cols-fr gap-1 rounded-2xl border border-abyss-600 bg-abyss-900/80 p-1.5">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const selected = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-xs font-medium transition sm:flex-row sm:justify-center sm:gap-1.5 sm:text-sm",
              selected ? "bg-tide-in/15 text-tide-in" : "text-slate-400 hover:bg-abyss-800/70 hover:text-slate-200"
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
