import { promises as fs } from "fs";
import path from "path";

export interface AppSettings {
  stormglassApiKey?: string;
  worldtidesApiKey?: string;
}

const SETTINGS_DIR = path.join(process.cwd(), "data");
const SETTINGS_FILE = path.join(SETTINGS_DIR, "settings.json");

/**
 * Ayarlar sayfasından girilen API anahtarlarını yerel bir JSON dosyasında saklar.
 * Bu dosya .gitignore'da olduğu için repoya dahil edilmez. Tek kullanıcılı,
 * yerel geliştirme senaryosu için tasarlanmıştır (ör. bir sunucuya deploy
 * ediyorsan bunun yerine gerçek ortam değişkenlerini kullanmalısın).
 */
export async function readSettings(): Promise<AppSettings> {
  try {
    const raw = await fs.readFile(SETTINGS_FILE, "utf-8");
    return JSON.parse(raw) as AppSettings;
  } catch {
    return {};
  }
}

export async function writeSettings(settings: AppSettings): Promise<void> {
  await fs.mkdir(SETTINGS_DIR, { recursive: true });
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), "utf-8");
}
