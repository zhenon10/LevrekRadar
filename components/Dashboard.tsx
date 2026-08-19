"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { RefreshCw, Radar, Settings, Waves, CloudSun, Fish } from "lucide-react";
import { FishingSpot, ForecastResult } from "@/lib/types";
import { SpotSelector } from "./SpotSelector";
import { HeroScoreCard } from "./HeroScoreCard";
import { WeatherCard } from "./WeatherCard";
import { BestWindowsCard } from "./BestWindowsCard";
import { WeekCalendar } from "./WeekCalendar";
import { Timeline } from "./Timeline";
import { TacticCard } from "./TacticCard";
import { TabBar, TabItem } from "./TabBar";
import { cn, dayLabelFor, istanbulDateKey, istanbulHourOfDay } from "@/lib/utils";

type TabId = "fishing" | "weather" | "tactic";

interface DashboardProps {
  initialSpot: FishingSpot;
  initialForecast: ForecastResult;
  initialTideSource: string;
  initialWaveAvailable: boolean;
}

export function Dashboard({
  initialSpot,
  initialForecast,
  initialTideSource,
  initialWaveAvailable,
}: DashboardProps) {
  const [spot, setSpot] = useState(initialSpot);
  const [forecast, setForecast] = useState(initialForecast);
  const [tideSource, setTideSource] = useState(initialTideSource);
  const [waveAvailable, setWaveAvailable] = useState(initialWaveAvailable);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [selectedDateKey, setSelectedDateKey] = useState(
    () => initialForecast.dailySummaries[0]?.dateKey ?? istanbulDateKey(new Date().toISOString())
  );
  const [activeTab, setActiveTab] = useState<TabId>("fishing");

  async function loadSpot(next: FishingSpot) {
    setSpot(next);
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/forecast?spot=${next.id}`, { cache: "no-store" });
        if (!res.ok) throw new Error("İstek başarısız");
        const data = await res.json();
        setForecast(data.forecast);
        setTideSource(data.tideSource);
        setWaveAvailable(Boolean(data.waveAvailable));
        setSelectedDateKey(data.forecast.dailySummaries[0]?.dateKey ?? selectedDateKey);
      } catch {
        setError("Veriler yüklenemedi. Bağlantınızı kontrol edip tekrar deneyin.");
      }
    });
  }

  const current = forecast.hourly[0];
  const nowIso = current.time;
  const todayKey = forecast.dailySummaries[0]?.dateKey ?? istanbulDateKey(new Date().toISOString());
  const isToday = selectedDateKey === todayKey;

  const selectedDay = useMemo(
    () => forecast.dailySummaries.find((d) => d.dateKey === selectedDateKey) ?? forecast.dailySummaries[0],
    [forecast.dailySummaries, selectedDateKey]
  );

  // Hava Durumu kartı seçili günü yansıtır: bugünse "şu an", ileri bir günse o
  // günün öğle saatine en yakın saat (günü temsil eden makul bir referans).
  const weatherReferenceHour = useMemo(() => {
    if (isToday || !selectedDay || selectedDay.hourly.length === 0) return current;
    return selectedDay.hourly.reduce((closest, h) => {
      const diff = Math.abs(istanbulHourOfDay(h.time) - 12);
      const closestDiff = Math.abs(istanbulHourOfDay(closest.time) - 12);
      return diff < closestDiff ? h : closest;
    }, selectedDay.hourly[0]);
  }, [isToday, selectedDay, current]);

  // Mera değişince seçili gün listede yoksa (farklı veri seti geldiyse) ilk güne dön.
  useEffect(() => {
    if (!forecast.dailySummaries.some((d) => d.dateKey === selectedDateKey)) {
      setSelectedDateKey(forecast.dailySummaries[0]?.dateKey ?? selectedDateKey);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forecast.dailySummaries]);

  // "Taktik" sekmesi sadece bugün için anlamlı; başka gün seçiliyken "Av Saatleri"ne düş.
  useEffect(() => {
    if (activeTab === "tactic" && !isToday) {
      setActiveTab("fishing");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isToday]);

  const tabs: TabItem<TabId>[] = [
    { id: "fishing", label: "Av Saatleri", icon: Waves },
    { id: "weather", label: "Hava Durumu", icon: CloudSun },
    ...(isToday ? [{ id: "tactic" as const, label: "Taktik", icon: Fish }] : []),
  ];

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-5 px-4 pb-10 pt-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-tide-in/10">
            <Radar className="h-5 w-5 text-tide-in" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight text-slate-50">LevrekRadar</h1>
            <p className="text-[11px] text-slate-500">
              Körfez Akıntı & Av Takip · {tideSource === "mock-sine" ? "sim. gelgit" : tideSource}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadSpot(spot)}
            disabled={isPending}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-abyss-600 bg-abyss-800/70 text-slate-300 transition hover:border-tide-in/50 hover:text-tide-in disabled:opacity-50"
            aria-label="Yenile"
          >
            <RefreshCw className={cn("h-4 w-4", isPending && "animate-spin")} />
          </button>
          <Link
            href="/settings"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-abyss-600 bg-abyss-800/70 text-slate-300 transition hover:border-tide-in/50 hover:text-tide-in"
            aria-label="Ayarlar"
          >
            <Settings className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <SpotSelector selected={spot} onSelect={loadSpot} />

      {error && (
        <p className="rounded-lg border border-score-low/40 bg-score-low/10 px-3 py-2 text-sm text-score-low">
          {error}
        </p>
      )}

      <div className={cn("flex flex-col gap-5 transition-opacity", isPending && "opacity-60")}>
        <HeroScoreCard current={current} waveAvailable={waveAvailable} />

        <WeekCalendar
          days={forecast.dailySummaries}
          selectedDateKey={selectedDateKey}
          onSelect={setSelectedDateKey}
        />

        <TabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />

        {activeTab === "fishing" && selectedDay && (
          <>
            <BestWindowsCard
              windows={selectedDay.bestWindows}
              title={`İdeal Av Saatleri · ${dayLabelFor(selectedDay.dateKey)}`}
              emptyLabel={`${dayLabelFor(selectedDay.dateKey)} için belirgin bir akıntı zirvesi tespit edilemedi.`}
            />
            <Timeline
              hourly={selectedDay.hourly}
              bestWindows={selectedDay.bestWindows}
              nowIso={nowIso}
              title={`${dayLabelFor(selectedDay.dateKey)} · Akıntı & Av Skoru`}
              avgScore={selectedDay.avgScore}
              bestScore={selectedDay.bestScore}
            />
          </>
        )}

        {activeTab === "weather" && (
          <WeatherCard
            current={weatherReferenceHour}
            isToday={isToday}
            days={forecast.dailySummaries}
            selectedDateKey={selectedDateKey}
          />
        )}

        {activeTab === "tactic" && isToday && <TacticCard advice={forecast.tackleAdvice} />}
      </div>

      <footer className="mt-2 text-center text-[11px] text-slate-600">
        Rüzgar ve dalga verisi Open-Meteo&apos;dan (anahtarsız){" "}
        {waveAvailable ? "canlı alınır." : "alınır (dalga verisi şu an erişilemiyor)."} Gelgit
        verisi{" "}
        {tideSource === "mock-sine"
          ? "matematiksel simülasyondur (API anahtarı eklendiğinde canlıya geçer)."
          : `${tideSource} kaynağından canlı olarak alınır.`}
      </footer>
    </main>
  );
}
