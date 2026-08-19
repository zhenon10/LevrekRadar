# LevrekRadar — Körfez Akıntı & Av Takip

Edremit Körfezi ve Ayvalık çevresindeki balıkçılar için anlık hava durumu, astronomik
gelgit verisi ve dar boğaz hidroliğini birleştirip optimum levrek av saatlerini ve
akıntı yönlerini hesaplayan Next.js 14 (App Router) + TypeScript + Tailwind CSS PWA'sı.

## Kurulum

```bash
npm install
npm run dev
```

Tarayıcıda [http://localhost:3000](http://localhost:3000) açılır.

## Gelgit verisi: mock'tan canlıya geçiş

Varsayılan olarak `/lib/tide-adapters/mock-sine.ts` içindeki matematiksel sinüs
dalgası simülasyonu kullanılır (Ege'nin gerçek yarı-günlük M2 periyoduna ~12.42
saat yakın, konuma göre deterministik faz kaymalı). Canlı veriye geçmek için
`.env.local` dosyasına (`.env.local.example`'dan kopyalayın):

```
STORMGLASS_API_KEY=xxxx
```

veya

```
WORLDTIDES_API_KEY=xxxx
```

eklemeniz yeterli — `lib/tide-adapters/index.ts` adapter pattern ile otomatik
olarak doğru kaynağı seçer, uygulamanın geri kalanında hiçbir değişiklik gerekmez.

## Klasör yapısı

```
app/
  page.tsx              — sunucu bileşeni: ilk yüklemede tahmini hesaplar
  api/forecast/route.ts — mera değişiminde çağrılan API route
  layout.tsx, globals.css
components/
  Dashboard.tsx          — istemci state + spot değişimi
  HeroScoreCard.tsx       — anlık skor / akıntı / rüzgar
  Timeline.tsx            — 24 saatlik zaman çizelgesi
  TacticCard.tsx          — iğne/lider/yem önerisi
  SpotSelector.tsx, WindCompass.tsx
lib/
  tide-engine.ts          — çekirdek hesaplama motoru (3. Saat Kuralı, skor, tavsiye)
  tide-adapters/          — mock-sine / stormglass / worldtides adapter'ları
  weather.ts              — Open-Meteo entegrasyonu (+ çevrimdışı yedek veri)
  spots.ts, types.ts, utils.ts
public/
  manifest.json, icons/   — PWA ikonları (scripts/generate-icons.js ile üretildi)
```

## Hesaplama kuralları (`lib/tide-engine.ts`)

1. **3. Saat Kuralı** — Yüksek/alçak su anları durgun su (slack) kabul edilir;
   bu iki an arasındaki orta nokta (M2 periyodunda ~3.1 saat sonrası) akıntının
   zirve yaptığı andır. Akıntı gücü, su seviyesinin sayısal türevinden (eğim)
   hesaplanır ve tüm 30 saatlik pencerede normalize edilir.
2. **Akıntı yönü** — seviye yükseliyorsa İÇERİ (dolduran), düşüyorsa DIŞARI
   (boşalan), eğim çok düşükse DURGUN.
3. **Av skoru (0-100)** — taban puan akıntı gücünden, üzerine rüzgar çarpanı
   (8-18 km/s ideal, <4 km/s ceza), akıntı zirve bonusu ve gün doğumu/batımı
   çakışma bonusu eklenir.
4. **Taktik tavsiyesi** — anlık akıntı/rüzgar durumuna göre iğne no, lider
   kalınlığı ve yem stratejisi öneren dinamik metin üretir.
