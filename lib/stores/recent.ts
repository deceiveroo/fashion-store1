// lib/stores/recent.ts
// Client-side persistence for recently picked / saved pickup stores.
// Stores the full StoreItem so the checkout summary can render offline.

import type { StoreItem } from './types';

const RECENT_KEY = 'pickup_recent_stores';
const FAVORITE_KEY = 'pickup_favorite_stores';
const MAX_RECENT = 4;

function read(key: string): StoreItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as StoreItem[]) : [];
  } catch {
    return [];
  }
}

function write(key: string, value: StoreItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private mode — non-fatal */
  }
}

export function getRecentStores(): StoreItem[] {
  return read(RECENT_KEY);
}

/** Push a store to the front of the recents list (de-duped, capped). */
export function pushRecentStore(store: StoreItem): StoreItem[] {
  const next = [store, ...read(RECENT_KEY).filter((s) => s.id !== store.id)].slice(0, MAX_RECENT);
  write(RECENT_KEY, next);
  return next;
}

export function getFavoriteStores(): StoreItem[] {
  return read(FAVORITE_KEY);
}

export function isFavoriteStore(id: string): boolean {
  return read(FAVORITE_KEY).some((s) => s.id === id);
}

/** Add or remove a store from favourites; returns the updated list. */
export function toggleFavoriteStore(store: StoreItem): StoreItem[] {
  const current = read(FAVORITE_KEY);
  const exists = current.some((s) => s.id === store.id);
  const next = exists ? current.filter((s) => s.id !== store.id) : [store, ...current];
  write(FAVORITE_KEY, next);
  return next;
}
