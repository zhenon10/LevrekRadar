"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, KeyRound, Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface SettingsStatus {
  stormglassApiKey: string;
  worldtidesApiKey: string;
  hasStormglass: boolean;
  hasWorldtides: boolean;
}

export function SettingsForm() {
  const [status, setStatus] = useState<SettingsStatus | null>(null);
  const [stormglassApiKey, setStormglassApiKey] = useState("");
  const [worldtidesApiKey, setWorldtidesApiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data: SettingsStatus) => setStatus(data))
      .catch(() => setError("Mevcut ayarlar okunamadı."));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stormglassApiKey: stormglassApiKey || undefined,
          worldtidesApiKey: worldtidesApiKey || undefined,
        }),
      });
      if (!res.ok) throw new Error("Kaydedilemedi");
      setSaved(true);
      setStormglassApiKey("");
      setWorldtidesApiKey("");
      const refreshed = await fetch("/api/settings").then((r) => r.json());
      setStatus(refreshed);
    } catch {
      setError("Ayarlar kaydedilemedi. Lütfen tekrar deneyin.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <header className="flex items-center gap-3">
        <Link
          href="/"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-abyss-600 bg-abyss-800/70 text-slate-300 transition hover:border-tide-in/50 hover:text-tide-in"
          aria-label="Geri dön"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-lg font-bold leading-tight text-slate-50">Ayarlar</h1>
          <p className="text-[11px] text-slate-500">Gelgit API anahtarları</p>
        </div>
      </header>

      <form
        onSubmit={handleSave}
        className="flex flex-col gap-4 rounded-2xl border border-abyss-600 bg-abyss-900/80 p-5"
      >
        <p className="text-sm text-slate-400">
          Aşağıdakilerden <strong className="text-slate-200">sadece birini</strong> doldurman
          yeterli. Hiçbiri girilmezse uygulama matematiksel sinüs dalgası simülasyonuyla (mock)
          çalışmaya devam eder. Anahtarlar bu cihazda yerel bir dosyada saklanır.
        </p>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Stormglass API Anahtarı
            {status?.hasStormglass && (
              <span className="ml-2 rounded-full bg-tide-in/10 px-2 py-0.5 text-[10px] font-semibold text-tide-in">
                Kayıtlı: {status.stormglassApiKey}
              </span>
            )}
          </span>
          <input
            type="password"
            value={stormglassApiKey}
            onChange={(e) => setStormglassApiKey(e.target.value)}
            placeholder={status?.hasStormglass ? "Değiştirmek için yeni anahtar gir" : "sg_xxxxxxxx"}
            className="rounded-xl border border-abyss-600 bg-abyss-800/80 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-tide-in/60"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
            WorldTides API Anahtarı
            {status?.hasWorldtides && (
              <span className="ml-2 rounded-full bg-tide-in/10 px-2 py-0.5 text-[10px] font-semibold text-tide-in">
                Kayıtlı: {status.worldtidesApiKey}
              </span>
            )}
          </span>
          <input
            type="password"
            value={worldtidesApiKey}
            onChange={(e) => setWorldtidesApiKey(e.target.value)}
            placeholder={status?.hasWorldtides ? "Değiştirmek için yeni anahtar gir" : "wt_xxxxxxxx"}
            className="rounded-xl border border-abyss-600 bg-abyss-800/80 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-tide-in/60"
          />
        </label>

        {error && (
          <p className="rounded-lg border border-score-low/40 bg-score-low/10 px-3 py-2 text-sm text-score-low">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className={cn(
            "flex items-center justify-center gap-2 rounded-xl border border-tide-in/50 bg-tide-in/10 px-4 py-3 text-sm font-semibold text-tide-in transition hover:bg-tide-in/20 disabled:opacity-60"
          )}
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <Check className="h-4 w-4" />
          ) : (
            <KeyRound className="h-4 w-4" />
          )}
          {saving ? "Kaydediliyor..." : saved ? "Kaydedildi" : "Kaydet"}
        </button>

        <p className="text-xs text-slate-500">
          Kaydettikten sonra sayfayı yenilediğinde gelgit verisi otomatik olarak canlı kaynaktan
          gelmeye başlar — sunucuyu yeniden başlatmana gerek yok.
        </p>
      </form>
    </>
  );
}
