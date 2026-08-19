import { NextRequest, NextResponse } from "next/server";
import { readSettings, writeSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

function mask(key?: string): string {
  if (!key) return "";
  if (key.length <= 4) return "•".repeat(key.length);
  return `${"•".repeat(key.length - 4)}${key.slice(-4)}`;
}

// Vercel gibi sunucusuz platformlarda dosya sistemi kalıcı değildir (her
// çağrı farklı bir örnekte çalışabilir) — bu durumda kullanıcıyı env
// değişkeni kullanmaya yönlendiriyoruz.
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

export async function GET() {
  const settings = await readSettings();
  return NextResponse.json({
    stormglassApiKey: mask(settings.stormglassApiKey),
    worldtidesApiKey: mask(settings.worldtidesApiKey),
    hasStormglass: Boolean(settings.stormglassApiKey),
    hasWorldtides: Boolean(settings.worldtidesApiKey),
    persistent: !isServerless,
  });
}

export async function POST(req: NextRequest) {
  if (isServerless) {
    return NextResponse.json(
      {
        error:
          "Bu deploy'da dosya tabanlı ayarlar kalıcı değil. Lütfen STORMGLASS_API_KEY veya WORLDTIDES_API_KEY'i proje ortam değişkeni olarak ekleyin.",
      },
      { status: 501 }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Geçersiz istek gövdesi." }, { status: 400 });
  }

  try {
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
  } catch (error) {
    console.error("[/api/settings] yazma hatası:", error);
    return NextResponse.json({ error: "Ayarlar kaydedilemedi." }, { status: 500 });
  }
}
