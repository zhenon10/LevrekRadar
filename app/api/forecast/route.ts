import { NextRequest, NextResponse } from "next/server";
import { fetchTideDataResilient } from "@/lib/tide-adapters";
import { fetchWeather } from "@/lib/weather";
import { fetchWaveData } from "@/lib/marine";
import { calculateForecast } from "@/lib/tide-engine";
import { getSpotById } from "@/lib/spots";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const spotId = req.nextUrl.searchParams.get("spot");
  const spot = getSpotById(spotId ?? "");

  try {
    const now = new Date();
    // Gün başından itibaren, 7 günlük tahmini kapsayacak (+ tampon) bir pencere alınır.
    const windowStart = new Date(now);
    windowStart.setHours(windowStart.getHours() - 2, 0, 0, 0);

    const [tide, weather, waves] = await Promise.all([
      fetchTideDataResilient({
        latitude: spot.latitude,
        longitude: spot.longitude,
        start: windowStart.toISOString(),
        hours: 24 * 8,
      }),
      fetchWeather(spot.latitude, spot.longitude),
      fetchWaveData(spot.latitude, spot.longitude),
    ]);

    const forecast = calculateForecast(tide, weather, now, waves);

    return NextResponse.json({
      spot,
      tideSource: tide.source,
      waveAvailable: waves.available,
      forecast,
      generatedAt: now.toISOString(),
    });
  } catch (error) {
    console.error("[/api/forecast] hata:", error);
    return NextResponse.json(
      { error: "Tahmin hesaplanamadı. Lütfen daha sonra tekrar deneyin." },
      { status: 502 }
    );
  }
}
