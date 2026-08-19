import { fetchTideDataResilient } from "@/lib/tide-adapters";
import { fetchWeather } from "@/lib/weather";
import { fetchWaveData } from "@/lib/marine";
import { calculateForecast } from "@/lib/tide-engine";
import { getSpotById, DEFAULT_SPOT_ID } from "@/lib/spots";
import { Dashboard } from "@/components/Dashboard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const spot = getSpotById(DEFAULT_SPOT_ID);
  const now = new Date();
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

  return (
    <Dashboard
      initialSpot={spot}
      initialForecast={forecast}
      initialTideSource={tide.source}
      initialWaveAvailable={waves.available}
    />
  );
}
