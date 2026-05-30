// app/company/stores/page.tsx
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { MapPin, Clock, Phone, Star, Globe, Store, Navigation, Building, Users, Award, Search, Crosshair, ArrowUpRight } from 'lucide-react';
import InteractiveMap from '@/components/InteractiveMap';
import type { Coordinates, StoreItem } from '@/lib/stores/types';
import { calculateDistance, geocodeCity } from '@/lib/stores/geo';
import {
  PageShell,
  PageHeader,
  StatGrid,
  Pill,
  MagneticButton,
  CTABand,
  EASE,
} from '@/components/company/PageKit';

// Re-export so existing imports of these types from this module keep working.
export type { Coordinates, StoreItem };

const ACCENT = '#8b7cf6';
const ACCENT_TO = '#c4b5fd';
const FLAGSHIP = ['ELEVATE Центральный', 'ELEVATE Петровский Пассаж', 'ELEVATE Сити'];

// Декоративный список городов для кинетического маркизе в hero
const MARQUEE_CITIES = [
  'МОСКВА', 'САНКТ-ПЕТЕРБУРГ', 'КАЗАНЬ', 'ЕКАТЕРИНБУРГ', 'НОВОСИБИРСК',
  'СОЧИ', 'КРАСНОДАР', 'НИЖНИЙ НОВГОРОД', 'ВЛАДИВОСТОК', 'КАЛИНИНГРАД',
];

export default function StoresPage() {
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const reduce = useReducedMotion();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/stores');
        const data = await response.json();
        setStores(data);
      } catch (error) {
        console.error('Error loading stores:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const [activeTab, setActiveTab] = useState('all');
  const [userCity, setUserCity] = useState('');
  const [searchRadius, setSearchRadius] = useState('50');
  const [nearbyStores, setNearbyStores] = useState<StoreItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedStore, setSelectedStore] = useState<StoreItem | null>(null);

  const storeStats = [
    { value: '25+', label: 'Магазинов по России', icon: Building },
    { value: '100%', label: 'Онлайн-бронирование', icon: Globe },
    { value: '24/7', label: 'Поддержка', icon: Users },
    { value: '5.0', label: 'Средний рейтинг', icon: Award },
  ];

  const storeTypes = [
    { id: 'all', name: 'Все', count: stores.length },
    { id: 'flagship', name: 'Флагманские', count: stores.filter((s) => FLAGSHIP.includes(s.name)).length },
    { id: 'mall', name: 'Торговые центры', count: stores.filter((s) => !FLAGSHIP.includes(s.name)).length },
  ];

  // Мемоизируем список — стабильная ссылка не даёт карте перемонтироваться в цикле
  const displayedStores = useMemo(() => {
    if (nearbyStores.length > 0) return nearbyStores;
    if (activeTab === 'all') return stores;
    if (activeTab === 'flagship') return stores.filter((s) => FLAGSHIP.includes(s.name));
    return stores.filter((s) => !FLAGSHIP.includes(s.name));
  }, [stores, activeTab, nearbyStores]);

  // ─── Поиск ───────────────────────────────────────────────────
  const findNearbyStores = async () => {
    if (!userCity.trim()) {
      setSearchError('Пожалуйста, укажите город');
      return;
    }
    setIsSearching(true);
    setSearchError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      const cityCoords = geocodeCity(userCity);
      if (!cityCoords) throw new Error(`Не удалось найти координаты для города: ${userCity}`);

      const storesWithDistance = stores.map((store) => ({
        ...store,
        distance: Math.round(calculateDistance(cityCoords, store.coordinates) * 10) / 10,
      }));

      const radius = parseInt(searchRadius);
      const nearby = storesWithDistance
        .filter((store) => store.distance! <= radius)
        .sort((a, b) => a.distance! - b.distance!)
        .slice(0, 3);

      if (nearby.length === 0) throw new Error(`В радиусе ${radius} км от ${userCity} магазинов не найдено`);

      setNearbyStores(nearby);
      setSelectedStore(nearby[0]);
    } catch (error: unknown) {
      setSearchError(error.message || 'Произошла ошибка при поиске магазинов');
      setNearbyStores([]);
    } finally {
      setIsSearching(false);
    }
  };

  const resetSearch = () => {
    setNearbyStores([]);
    setUserCity('');
    setSearchRadius('50');
    setSelectedStore(null);
  };

  // Стабильный колбэк выбора метки — без него карта перемонтируется
  const handleStoreSelect = useCallback((store: StoreItem) => {
    setSelectedStore(store);
  }, []);

  const inputCls =
    'w-full rounded-xl border border-[var(--fc-glass-border)] bg-[var(--fc-surface-elevated)] px-4 py-3 text-sm text-[var(--foreground)] placeholder-[var(--text-secondary)] outline-none transition-all focus:border-[#8b7cf6] focus:ring-2 focus:ring-[#8b7cf6]/40 disabled:opacity-60';

  return (
    <PageShell>
      <PageHeader
        eyebrow="Компания"
        title="Атлас"
        highlight="ELEVATE"
        description="Живая карта магазинов по всей России. Найдите ближайший — и почувствуйте бренд вживую."
        icon={Store}
      />

      {/* Кинетический маркизе городов */}
      <div className="relative mb-16 overflow-hidden py-2 [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
        <motion.div
          className="flex gap-10 whitespace-nowrap"
          animate={reduce ? undefined : { x: ['0%', '-50%'] }}
          transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
        >
          {[...MARQUEE_CITIES, ...MARQUEE_CITIES].map((city, i) => (
            <span
              key={i}
              className="text-5xl font-bold uppercase tracking-tight text-transparent sm:text-7xl"
              style={{ WebkitTextStroke: `1px ${ACCENT}55` }}
            >
              {city}
              <span className="mx-6 align-middle text-[#8b7cf6]">✦</span>
            </span>
          ))}
        </motion.div>
      </div>

      <StatGrid stats={storeStats} />

      {/* ─── ATLAS: split-screen локатор ─── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* ЛЕВО: поиск + фильтры + список */}
        <div className="flex flex-col gap-5 lg:col-span-2">
          {/* Командная строка поиска */}
          <div className="fc-glass-card p-5">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold uppercase tracking-tight text-[var(--foreground)]">
              <Crosshair size={18} className="text-[#8b7cf6]" />
              Найти ближайший
            </h2>
            <div className="relative mb-3">
              <input
                type="text"
                value={userCity}
                onChange={(e) => setUserCity(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && findNearbyStores()}
                placeholder="Ваш город"
                className={`${inputCls} pl-11`}
                disabled={isSearching}
              />
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
            </div>
            <div className="flex gap-3">
              <select value={searchRadius} onChange={(e) => setSearchRadius(e.target.value)} className={inputCls} disabled={isSearching}>
                <option value="10">10 км</option>
                <option value="25">25 км</option>
                <option value="50">50 км</option>
                <option value="100">100 км</option>
              </select>
              <button
                onClick={findNearbyStores}
                disabled={isSearching}
                className="flex shrink-0 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold uppercase tracking-wide text-white transition-all hover:shadow-lg disabled:opacity-60"
                style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_TO})` }}
              >
                {isSearching ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Search size={16} />}
                Найти
              </button>
            </div>
            {searchError && (
              <div className="mt-3 rounded-xl border border-rose-400/30 bg-rose-500/10 p-2.5 text-center text-xs text-rose-500">
                {searchError}
              </div>
            )}
            {nearbyStores.length > 0 && (
              <button onClick={resetSearch} className="mt-3 text-xs font-medium text-[#8b7cf6] hover:text-[#a78bfa]">
                ✕ Сбросить поиск ({nearbyStores.length} найдено)
              </button>
            )}
          </div>

          {/* Фильтры */}
          {nearbyStores.length === 0 && (
            <div className="flex flex-wrap gap-2">
              {storeTypes.map((type) => (
                <Pill key={type.id} active={activeTab === type.id} onClick={() => setActiveTab(type.id)}>
                  {type.name} ({type.count})
                </Pill>
              ))}
            </div>
          )}

          {/* Список магазинов */}
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
              {nearbyStores.length > 0 ? 'Ближайшие магазины' : 'Магазины'}
            </h3>
            {!loading && (
              <span className="rounded-full bg-[#8b7cf6]/12 px-2.5 py-0.5 text-xs font-semibold text-[#8b7cf6]">
                {displayedStores.length}
              </span>
            )}
          </div>
          <div className="relative">
            <div className="catalog-scrollbar flex max-h-[440px] flex-col gap-3 overflow-y-auto px-1 pb-4 lg:max-h-[600px]">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-24 shrink-0 animate-pulse rounded-2xl bg-[var(--fc-surface-elevated)]" />
                ))
              ) : displayedStores.length === 0 ? (
                <p className="py-10 text-center text-sm text-[var(--text-secondary)]">Магазины не найдены</p>
              ) : (
                displayedStores.map((store, index) => {
                  const active = selectedStore?.id === store.id;
                  return (
                    <motion.button
                      key={store.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index * 0.03, 0.25), ease: EASE }}
                      onClick={() => setSelectedStore(store)}
                      className={`group relative w-full shrink-0 overflow-hidden rounded-2xl border p-4 text-left transition-all ${
                        active
                          ? 'border-[#8b7cf6] bg-[#8b7cf6]/8 shadow-[0_0_0_1px_rgba(139,124,246,0.4),0_8px_30px_rgba(139,124,246,0.18)]'
                          : 'border-[var(--fc-glass-border)] bg-[var(--fc-surface)] hover:border-[#8b7cf6]/40'
                      }`}
                    >
                      {/* акцентная полоса слева у активного */}
                      <span
                        className={`absolute inset-y-0 left-0 w-1 transition-opacity ${active ? 'opacity-100' : 'opacity-0'}`}
                        style={{ background: `linear-gradient(to bottom, ${ACCENT}, ${ACCENT_TO})` }}
                      />
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold uppercase tracking-tight text-[var(--foreground)]">{store.name}</h3>
                        <span className="flex shrink-0 items-center gap-1 rounded-full bg-[#8b7cf6]/12 px-2 py-0.5 text-[#8b7cf6]">
                          <Star size={11} fill="currentColor" />
                          <span className="text-xs font-semibold">{store.rating}</span>
                        </span>
                      </div>
                      <p className="mt-1 flex items-start gap-1.5 text-sm text-[var(--text-secondary)]">
                        <MapPin size={14} className="mt-0.5 shrink-0 text-[#8b7cf6]" />
                        {store.address}
                      </p>
                      {store.distance !== undefined && (
                        <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-[#8b7cf6]">
                          <Navigation size={12} />
                          {store.distance} км от вас
                        </p>
                      )}
                    </motion.button>
                  );
                })
              )}
            </div>
            {/* мягкое затухание снизу, чтобы длинный список не обрывался резко */}
            {!loading && displayedStores.length > 4 && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[var(--background)] to-transparent" />
            )}
          </div>
        </div>

        {/* ПРАВО: постоянная карта + деталь выбранного */}
        <div className="lg:col-span-3">
          <div className="lg:sticky lg:top-24">
            <div className="fc-glass-card overflow-hidden !p-0">
              {/* Карта */}
              <div className="relative h-[380px] w-full sm:h-[440px]">
                {loading ? (
                  <div className="flex h-full items-center justify-center bg-[var(--fc-surface-elevated)]">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#8b7cf6] border-t-transparent" />
                  </div>
                ) : (
                  <InteractiveMap
                    stores={displayedStores}
                    selectedStore={selectedStore}
                    showAllStores={!selectedStore}
                    onStoreSelect={handleStoreSelect}
                  />
                )}
                {/* верхняя плашка-подсказка */}
                <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 rounded-full border border-[var(--fc-glass-border)] bg-[var(--fc-surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] backdrop-blur-md">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#8b7cf6]" />
                  {selectedStore ? selectedStore.name : `${displayedStores.length} магазинов на карте`}
                </div>
              </div>

              {/* Деталь выбранного магазина */}
              <div className="border-t border-[var(--fc-glass-border)] p-6">
                {selectedStore ? (
                  <motion.div
                    key={selectedStore.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ease: EASE }}
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-2xl font-bold uppercase tracking-tight text-[var(--foreground)]">{selectedStore.name}</h3>
                        <p className="mt-1 text-sm text-[var(--text-secondary)]">{selectedStore.address}</p>
                      </div>
                      <span className="flex shrink-0 items-center gap-1 rounded-full bg-[#8b7cf6]/12 px-3 py-1 text-[#8b7cf6]">
                        <Star size={14} fill="currentColor" />
                        <span className="text-sm font-semibold">{selectedStore.rating}</span>
                      </span>
                    </div>

                    <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="flex items-center gap-2.5 text-sm text-[var(--text-secondary)]">
                        <Clock size={16} className="text-[#8b7cf6]" />
                        {selectedStore.hours}
                      </div>
                      <a href={`tel:${selectedStore.phone}`} className="flex items-center gap-2.5 text-sm text-[var(--text-secondary)] transition-colors hover:text-[#8b7cf6]">
                        <Phone size={16} className="text-[#8b7cf6]" />
                        {selectedStore.phone}
                      </a>
                    </div>

                    <div className="mb-5 flex flex-wrap gap-2">
                      {selectedStore.services.map((service, idx) => (
                        <span key={idx} className="rounded-full bg-[#8b7cf6]/12 px-3 py-1 text-xs text-[#8b7cf6]">{service}</span>
                      ))}
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <button
                        onClick={() => window.dispatchEvent(new CustomEvent('buildRoute', { detail: selectedStore }))}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold uppercase tracking-wide text-white transition-all hover:shadow-lg"
                        style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_TO})` }}
                      >
                        <Navigation size={16} />
                        Проложить маршрут
                      </button>
                      <button
                        onClick={() => window.dispatchEvent(new CustomEvent('centerOnUser', { detail: selectedStore }))}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--fc-glass-border)] bg-[var(--fc-surface-elevated)] px-5 py-3 text-sm font-semibold uppercase tracking-wide text-[var(--foreground)] transition-all hover:border-[#8b7cf6]/40"
                      >
                        <Crosshair size={16} />
                        Где я
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center gap-3 py-6 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#8b7cf6]/12 text-[#8b7cf6]">
                      <ArrowUpRight size={22} />
                    </div>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Выберите магазин в списке или на карте, чтобы увидеть детали и проложить маршрут
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <CTABand
        icon={MapPin}
        title="Не нашли магазин рядом?"
        description="Мы расширяем сеть по всей России. Подпишитесь на рассылку — и узнайте об открытии первыми."
      >
        <MagneticButton href="/support/contact" variant="outline" className="!bg-white !text-gray-900">
          Связаться с нами
        </MagneticButton>
      </CTABand>
    </PageShell>
  );
}
