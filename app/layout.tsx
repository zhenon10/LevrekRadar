import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LevrekRadar — Körfez Akıntı & Av Takip",
  description:
    "Edremit Körfezi ve Ayvalık çevresinde anlık hava durumu, gelgit ve akıntı verilerine göre optimum levrek av saatlerini hesaplar.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "LevrekRadar",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a1420",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className="dark">
      <body className="min-h-screen bg-depth-gradient">{children}</body>
    </html>
  );
}
