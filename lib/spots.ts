import { FishingSpot } from "./types";

export const FISHING_SPOTS: FishingSpot[] = [
  {
    id: "ayvalik-bogaz-koprusu",
    name: "Ayvalık Boğaz Köprüsü / Cunda Kanalı",
    description: "Dar boğaz hidroliği ile güçlü akıntı — köprü ayakları klasik levrek merası.",
    latitude: 39.3245,
    longitude: 26.6852,
  },
  {
    id: "patricya-burnu",
    name: "Patriçya Burnu",
    description: "Açık burun akıntısı, gün doğumu/batımı alacakaranlık avı için ideal.",
    latitude: 39.3821,
    longitude: 26.698,
  },
  {
    id: "setur-ayvalik-marina",
    name: "Setur Ayvalık Marina",
    description: "Marina ışık sınırları — durgun su döneminde sığ taşlık avcılığı.",
    latitude: 39.3134,
    longitude: 26.6872,
  },
  {
    id: "zeytinli-cayi-agzi-akcay",
    name: "Zeytinli Çayı Ağzı / Akçay",
    description: "Tatlı su karışımı, dip taraması ve silikon yem avcılığı için uygun.",
    latitude: 39.5841,
    longitude: 26.9248,
  },
];

export const DEFAULT_SPOT_ID = FISHING_SPOTS[0].id;

export function getSpotById(id: string): FishingSpot {
  return FISHING_SPOTS.find((s) => s.id === id) ?? FISHING_SPOTS[0];
}
