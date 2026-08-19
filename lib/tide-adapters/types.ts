import { TideData } from "../types";

export interface TideAdapterParams {
  latitude: number;
  longitude: number;
  /** Tahminin başlayacağı an (ISO 8601) */
  start: string;
  /** Kaç saatlik pencere hesaplanacak */
  hours: number;
}

export interface TideAdapter {
  /** Adapter'ı tanımlayan kısa isim (log/debug amaçlı) */
  readonly name: TideData["source"];
  fetchTideData(params: TideAdapterParams): Promise<TideData>;
}
