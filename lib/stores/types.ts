// lib/stores/types.ts
// Shared store domain types — used by the stores atlas page, the checkout
// store picker and the interactive map. Keep this the single source of truth.

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface StoreItem {
  id: string;
  name: string;
  address: string;
  coordinates: Coordinates;
  hours: string;
  phone: string;
  rating: number;
  services: string[];
  /** Optional — populated when computing nearby results. */
  distance?: number;
}
