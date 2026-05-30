// components/checkout/StorePickerModal.tsx
'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Clock, Phone, Star, Search, Crosshair, X, Check,
  Navigation, Store as StoreIcon, History, Heart, List, Map as MapIcon,
} from 'lucide-react';
import InteractiveMap from '@/components/InteractiveMap';
import StoreListItem from './StoreListItem';
import type { StoreItem } from '@/lib/stores/types';
import { calculateDistance, geocodeCity } from '@/lib/stores/geo';
import {
  getRecentStores, getFavoriteStores, toggleFavoriteStore, isFavoriteStore,
} from '@/lib/stores/recent';

const ACCENT = '#8b7cf6';
const ACCENT_TO = '#c4b5fd';
const RADII = ['10', '25', '50', '100'];

interface StorePickerModalProps {
  open: boolean;
  stores: StoreItem[];
  selectedStore: StoreItem | null;
  onClose: () => void;
  onConfirm: (store: StoreItem) => void;
}

export default function StorePickerModal({
  open, stores, selectedStore, onClose, onConfirm,
}: StorePickerModalProps) {
  const [draft, setDraft] = useState<StoreItem | null>(selectedStore);
  const [query, setQuery] = useState('');
  const [userCity, setUserCity] = useState('');
  const [radius, setRadius] = useState('50');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [nearby, setNearby] = useState<StoreItem[]>([]);
  const [recents, setRecents] = useState<StoreItem[]>([]);
  const [favorites, setFavorites] = useState<StoreItem[]>([]);
  const [mobilePane, setMobilePane] = useState<'list' | 'map'>('list');
  const searchRef = useRef<HTMLInputElement>(null);

  // Sync draft + load recents/favorites whenever the modal opens.
  useEffect(() => {
    if (!open) return;
    setDraft(selectedStore);
    // Filter to only include stores that exist in the current stores list
    setRecents(getRecentStores().filter(r => stores.some(s => s.id === r.id)));
    setFavorites(getFavoriteStores().filter(f => stores.some(s => s.id === f.id)));
    setQuery('');
    setNearby([]);
    setSearchError(null);
    setMobilePane('list');
    const t = setTimeout(() => searchRef.current?.focus(), 120);
    return () => clearTimeout(t);
  }, [open, selectedStore, stores]);

  // Lock body scroll + Escape to close while open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  // Revealing the map pane on mobile (display:none → flex) leaves Leaflet at
  // 0×0. Its trackResize listens to window resize → nudge it after paint.
  useEffect(() => {
    if (mobilePane !== 'map') return;
    const t = setTimeout(() => window.dispatchEvent(new Event('resize')), 80);
    return () => clearTimeout(t);
  }, [mobilePane]);

  const runSearch = async () => {
    if (!userCity.trim()) {
      setSearchError('Укажите город');
      return;
    }
    setIsSearching(true);
    setSearchError(null);
    try {
      await new Promise((r) => setTimeout(r, 500));
      const coords = geocodeCity(userCity);
      if (!coords) throw new Error(`Не удалось найти город: ${userCity}`);
      const withDist = stores.map((s) => ({
        ...s,
        distance: Math.round(calculateDistance(coords, s.coordinates) * 10) / 10,
      }));
      const r = parseInt(radius);
      const found = withDist
        .filter((s) => s.distance! <= r)
        .sort((a, b) => a.distance! - b.distance!);
      if (found.length === 0) throw new Error(`В радиусе ${r} км ничего не найдено`);
      setNearby(found);
      setDraft(found[0]);
      setMobilePane('map');
    } catch (e: any) {
      setSearchError(e.message || 'Ошибка поиска');
      setNearby([]);
    } finally {
      setIsSearching(false);
    }
  };

  const resetSearch = () => {
    setNearby([]);
    setUserCity('');
    setSearchError(null);
  };

  const handleSelect = useCallback((s: StoreItem) => {
    setDraft(s);
    setMobilePane('map');
  }, []);

  const handleToggleFav = useCallback((s: StoreItem) => {
    setFavorites(toggleFavoriteStore(s));
  }, []);

  // Active list: search results > text filter over all stores.
  const listed = useMemo(() => {
    const base = nearby.length > 0 ? nearby : stores;
    const q = query.trim().toLowerCase();
    if (!q) return base;
    return base.filter(
      (s) => s.name.toLowerCase().includes(q) || s.address.toLowerCase().includes(q)
    );
  }, [stores, nearby, query]);

  // Stable list for the map so it doesn't remount mid-animation.
  const mapStores = useMemo(() => (nearby.length > 0 ? nearby : stores), [nearby, stores]);

  const inputCls =
    'w-full rounded-xl border-2 border-gray-200 bg-white/70 px-4 py-3 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-[#8b7cf6] focus:ring-4 focus:ring-[#8b7cf6]/20 dark:border-gray-700 dark:bg-gray-800/60 dark:text-white';

  return (
    <AnimatePresence>
      {open && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          transition={{ type: 'spring', stiffness: 260, damping: 26 }}
          onClick={(e) => e.stopPropagation()}
          className="flex h-full w-full flex-col overflow-hidden bg-white shadow-2xl dark:bg-gray-900 sm:h-[90vh] sm:max-w-5xl sm:rounded-3xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 border-b border-gray-200/70 px-5 py-4 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-2xl text-white shadow-lg"
                style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_TO})` }}
              >
                <StoreIcon size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Выбор магазина</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {stores.length} магазинов · самовывоз бесплатно
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Закрыть"
              className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            >
              <X size={22} />
            </button>
          </div>

          {/* Mobile pane switcher */}
          <div className="flex gap-1 border-b border-gray-200/70 p-2 dark:border-gray-800 lg:hidden">
            {([['list', 'Список', List], ['map', 'Карта', MapIcon]] as const).map(([id, label, Icon]) => (
              <button
                key={id}
                onClick={() => setMobilePane(id)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all ${
                  mobilePane === id
                    ? 'bg-[#8b7cf6] text-white shadow-md'
                    : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>

          {/* Body */}
          <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-5">
            {/* LEFT: search + list */}
            <div
              className={`flex min-h-0 flex-col border-gray-200/70 dark:border-gray-800 lg:col-span-2 lg:border-r ${
                mobilePane === 'list' ? 'flex' : 'hidden'
              } lg:flex`}
            >
              <div className="space-y-3 border-b border-gray-200/70 p-4 dark:border-gray-800">
                {/* Free-text filter */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    ref={searchRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Магазин или адрес"
                    className={`${inputCls} pl-10`}
                  />
                </div>
                {/* Nearby search */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      value={userCity}
                      onChange={(e) => setUserCity(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && runSearch()}
                      placeholder="Ваш город"
                      className={`${inputCls} pl-10`}
                      disabled={isSearching}
                    />
                  </div>
                  <select
                    value={radius}
                    onChange={(e) => setRadius(e.target.value)}
                    className={`${inputCls} w-24 shrink-0`}
                    disabled={isSearching}
                  >
                    {RADII.map((r) => (
                      <option key={r} value={r}>{r} км</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={runSearch}
                  disabled={isSearching}
                  className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition-all hover:shadow-lg disabled:opacity-60"
                  style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_TO})` }}
                >
                  {isSearching
                    ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    : <Crosshair size={16} />}
                  Найти ближайшие
                </button>
                {searchError && (
                  <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-2.5 text-center text-xs text-rose-500">
                    {searchError}
                  </div>
                )}
                {nearby.length > 0 && (
                  <button onClick={resetSearch} className="text-xs font-medium text-[#8b7cf6] hover:text-[#a78bfa]">
                    ✕ Сбросить ({nearby.length} найдено)
                  </button>
                )}
              </div>

              {/* Scrollable list */}
              <div className="catalog-scrollbar min-h-0 flex-1 space-y-2.5 overflow-y-auto p-4">
                {/* Favorites */}
                {favorites.length > 0 && nearby.length === 0 && !query && (
                  <Section icon={Heart} label="Избранное">
                    {favorites.map((s, i) => (
                      <StoreListItem
                        key={`fav-${s.id}`} store={s} index={i}
                        active={draft?.id === s.id} favorite
                        onSelect={handleSelect} onToggleFavorite={handleToggleFav}
                      />
                    ))}
                  </Section>
                )}
                {/* Recents */}
                {recents.length > 0 && nearby.length === 0 && !query && (
                  <Section icon={History} label="Недавние">
                    {recents.map((s, i) => (
                      <StoreListItem
                        key={`recent-${s.id}`} store={s} index={i}
                        active={draft?.id === s.id} favorite={favorites.some((f) => f.id === s.id)}
                        onSelect={handleSelect} onToggleFavorite={handleToggleFav}
                      />
                    ))}
                  </Section>
                )}
                {/* All / results */}
                <Section
                  icon={StoreIcon}
                  label={nearby.length > 0 ? 'Ближайшие магазины' : 'Все магазины'}
                  count={listed.length}
                >
                  {listed.length === 0 ? (
                    <p className="py-8 text-center text-sm text-gray-400">Ничего не найдено</p>
                  ) : (
                    listed.map((s, i) => (
                      <StoreListItem
                        key={s.id} store={s} index={i}
                        active={draft?.id === s.id} favorite={favorites.some((f) => f.id === s.id)}
                        onSelect={handleSelect} onToggleFavorite={handleToggleFav}
                      />
                    ))
                  )}
                </Section>
              </div>
            </div>

            {/* RIGHT: map + detail */}
            <div
              className={`flex min-h-0 flex-col lg:col-span-3 ${mobilePane === 'map' ? 'flex' : 'hidden'} lg:flex`}
            >
              <div className="relative min-h-[240px] flex-1">
                <InteractiveMap
                  stores={mapStores}
                  selectedStore={draft}
                  showAllStores={!draft}
                  onStoreSelect={handleSelect}
                />
                <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2 rounded-full border border-gray-200/60 bg-white/85 px-3 py-1.5 text-xs font-medium text-gray-600 backdrop-blur-md dark:border-gray-700 dark:bg-gray-900/80 dark:text-gray-300">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#8b7cf6]" />
                  {draft ? draft.name : `${mapStores.length} магазинов на карте`}
                </div>
              </div>
              {/* Selected detail */}
              <div className="border-t border-gray-200/70 p-4 dark:border-gray-800">
                <AnimatePresence mode="wait">
                  {draft ? (
                    <motion.div
                      key={draft.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                    >
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-bold uppercase tracking-tight text-gray-900 dark:text-white">
                            {draft.name}
                          </h3>
                          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                            <MapPin size={14} className="text-[#8b7cf6]" />
                            {draft.address}
                          </p>
                        </div>
                        <span className="flex shrink-0 items-center gap-1 rounded-full bg-[#8b7cf6]/12 px-2.5 py-1 text-[#8b7cf6]">
                          <Star size={13} fill="currentColor" />
                          <span className="text-sm font-semibold">{draft.rating}</span>
                        </span>
                      </div>
                      <div className="mb-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1.5">
                          <Clock size={14} className="text-[#8b7cf6]" />{draft.hours}
                        </span>
                        <a href={`tel:${draft.phone}`} className="flex items-center gap-1.5 hover:text-[#8b7cf6]">
                          <Phone size={14} className="text-[#8b7cf6]" />{draft.phone}
                        </a>
                        {draft.distance !== undefined && (
                          <span className="flex items-center gap-1.5 font-medium text-[#8b7cf6]">
                            <Navigation size={14} />{draft.distance} км
                          </span>
                        )}
                      </div>
                      {draft.services.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {draft.services.map((s, i) => (
                            <span key={i} className="rounded-full bg-[#8b7cf6]/12 px-2.5 py-1 text-xs text-[#8b7cf6]">
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <p className="py-4 text-center text-sm text-gray-400">
                      Выберите магазин в списке или на карте
                    </p>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 border-t border-gray-200/70 px-5 py-4 dark:border-gray-800">
            <p className="hidden text-sm text-gray-500 dark:text-gray-400 sm:block">
              {draft ? <>Выбрано: <span className="font-semibold text-gray-900 dark:text-white">{draft.name}</span></> : 'Магазин не выбран'}
            </p>
            <div className="flex w-full gap-3 sm:w-auto">
              <button
                onClick={onClose}
                className="flex-1 rounded-xl border-2 border-gray-200 px-5 py-3 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 sm:flex-none"
              >
                Отмена
              </button>
              <button
                onClick={() => draft && onConfirm(draft)}
                disabled={!draft}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-7 py-3 text-sm font-semibold transition-all sm:flex-none ${
                  draft
                    ? 'text-white shadow-lg hover:shadow-xl'
                    : 'cursor-not-allowed bg-gray-200 text-gray-400 dark:bg-gray-800 dark:text-gray-600'
                }`}
                style={draft ? { background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_TO})` } : undefined}
              >
                <Check size={18} />
                Выбрать этот магазин
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  );
}

function Section({
  icon: Icon, label, count, children,
}: {
  icon: typeof StoreIcon;
  label: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2 px-1 pt-1">
        <Icon size={13} className="text-[#8b7cf6]" />
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">{label}</span>
        {count !== undefined && (
          <span className="ml-auto rounded-full bg-[#8b7cf6]/12 px-2 py-0.5 text-xs font-semibold text-[#8b7cf6]">
            {count}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
