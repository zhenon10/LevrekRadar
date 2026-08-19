import { NextRequest, NextResponse } from "next/server";
import { readSettings, writeSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

function mask(key?: string): string {
  if (!key) return "";
  if (key.length <= 4) return "•".repeat(key.length);
  return `${"•".repeat(key.length - 4)}${key.slice(-4)}`;
}

export async function GET() {
  const settings = await readSettings();
  return NextResponse.json({
    stormglassApiKey: mask(settings.stormglassApiKey),
    worldtidesApiKey: mask(settings.worldtidesApiKey),
    hasStormglass: Boolean(settings.stormglassApiKey),
    hasWorldtides: Boolean(settings.worldtidesApiKey),
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Geçersiz istek gövdesi." }, { status: 400 });
  }

  const current = await readSettings();
  const stormglassApiKey =
    typeof body.stormglassApiKey === "string" ? body.stormglassApiKey.trim() : current.stormglassApiKey;
  const worldtidesApiKey =
    typeof body.worldtidesApiKey === "string" ? body.worldtidesApiKey.trim() : current.worldtidesApiKey;

  await writeSettings({
    stormglassApiKey: stormglassApiKey || undefined,
    worldtidesApiKey: worldtidesApiKey || undefined,
  });

  return NextResponse.json({ ok: true });
}
