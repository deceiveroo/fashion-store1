// app/company/stores/page.tsx
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { MapPin, Clock, Phone, Star, Globe, Store, Navigation, Building, Users, Award, Search, Crosshair, ArrowUpRight } from 'lucide-react';
import InteractiveMap from '@/components/InteractiveMap';
import {
  PageShell,
  PageHeader,
  StatGrid,
  Pill,
  MagneticButton,
  CTABand,
  EASE,
} from '@/components/company/PageKit';

// Тип для координат
interface Coordinates {
  lat: number;
  lng: number;
}

// Тип для магазина
export interface StoreItem {
  id: string;
  name: string;
  address: string;
  coordinates: Coordinates;
  hours: string;
  phone: string;
  rating: number;
  services: string[];
  distance?: number; // Опционально, для отображения расстояния
}

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

  // ─── Геометрия и поиск ───────────────────────────────────────
  const deg2rad = (deg: number): number => deg * (Math.PI / 180);

  const calculateDistance = (coord1: Coordinates, coord2: Coordinates): number => {
    const R = 6371;
    const dLat = deg2rad(coord2.lat - coord1.lat);
    const dLon = deg2rad(coord2.lng - coord1.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(coord1.lat)) * Math.cos(deg2rad(coord2.lat)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const findNearbyStores = async () => {
    if (!userCity.trim()) {
      setSearchError('Пожалуйста, укажите город');
      return;
    }
    setIsSearching(true);
    setSearchError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      const cityCoords = await geocodeCity(userCity);
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
    } catch (error: any) {
      setSearchError(error.message || 'Произошла ошибка при поиске магазинов');
      setNearbyStores([]);
    } finally {
      setIsSearching(false);
    }
  };

  const geocodeCity = async (city: string): Promise<Coordinates | null> => {
    const cityCoordinates: Record<string, Coordinates> = {
      'Москва': { lat: 55.7558, lng: 37.6176 },
      'Санкт-Петербург': { lat: 59.9343, lng: 30.3351 },
      'Новосибирск': { lat: 55.0084, lng: 82.9357 },
      'Екатеринбург': { lat: 56.8389, lng: 60.6057 },
      'Казань': { lat: 55.7964, lng: 49.1082 },
      'Нижний Новгород': { lat: 56.2965, lng: 43.9361 },
      'Челябинск': { lat: 55.1644, lng: 61.4368 },
      'Самара': { lat: 53.2418, lng: 50.2212 },
      'Омск': { lat: 54.9886, lng: 73.3249 },
      'Ростов-на-Дону': { lat: 47.2357, lng: 39.7015 },
      'Уфа': { lat: 54.7348, lng: 55.9578 },
      'Красноярск': { lat: 56.0184, lng: 92.8672 },
      'Воронеж': { lat: 51.6720, lng: 39.1843 },
      'Пермь': { lat: 58.0105, lng: 56.2502 },
      'Волгоград': { lat: 48.7080, lng: 44.5133 },
      'Краснодар': { lat: 45.0448, lng: 38.9760 },
      'Саратов': { lat: 51.5405, lng: 46.0086 },
      'Тюмень': { lat: 57.1522, lng: 65.5565 },
      'Тольятти': { lat: 53.5087, lng: 49.4195 },
      'Ижевск': { lat: 56.8439, lng: 53.2011 },
      'Барнаул': { lat: 53.3606, lng: 83.7636 },
      'Ульяновск': { lat: 54.3182, lng: 48.3820 },
      'Иркутск': { lat: 52.2869, lng: 104.2857 },
      'Хабаровск': { lat: 48.4809, lng: 135.0935 },
      'Махачкала': { lat: 42.9763, lng: 47.5022 },
      'Ярославль': { lat: 57.6266, lng: 39.8938 },
      'Владивосток': { lat: 43.1056, lng: 131.8735 },
      'Сочи': { lat: 43.6028, lng: 39.7342 },
      'Оренбург': { lat: 51.7727, lng: 55.0987 },
      'Новокузнецк': { lat: 53.7595, lng: 87.1351 },
      'Кемерово': { lat: 55.3374, lng: 86.0359 },
      'Рязань': { lat: 54.6269, lng: 39.7342 },
      'Астрахань': { lat: 46.3582, lng: 48.0537 },
      'Набережные Челны': { lat: 55.7278, lng: 52.3303 },
      'Пенза': { lat: 53.1955, lng: 45.0186 },
      'Липецк': { lat: 52.6031, lng: 39.5706 },
      'Киров': { lat: 58.6037, lng: 49.6653 },
      'Чебоксары': { lat: 56.1366, lng: 47.2494 },
      'Калининград': { lat: 54.7065, lng: 20.5110 },
      'Тула': { lat: 54.1962, lng: 37.6184 },
      'Курск': { lat: 51.7373, lng: 36.1875 },
      'Улан-Удэ': { lat: 51.8239, lng: 107.5856 },
      'Ставрополь': { lat: 45.0448, lng: 41.9686 },
      'Магнитогорск': { lat: 53.3983, lng: 58.7875 },
      'Иваново': { lat: 57.0004, lng: 40.9731 },
      'Брянск': { lat: 53.2521, lng: 34.3713 },
      'Сургут': { lat: 61.2557, lng: 73.3533 },
      'Белгород': { lat: 50.5959, lng: 36.5853 },
      'Владикавказ': { lat: 43.0468, lng: 44.6816 },
      'Чита': { lat: 52.0315, lng: 113.5011 },
      'Архангельск': { lat: 64.5466, lng: 40.5390 },
      'Смоленск': { lat: 54.7828, lng: 32.0451 },
      'Калуга': { lat: 54.5290, lng: 36.2757 },
      'Волжский': { lat: 48.8225, lng: 44.7750 },
      'Вологда': { lat: 59.2211, lng: 39.8945 },
      'Саранск': { lat: 54.1836, lng: 45.1739 },
      'Якутск': { lat: 62.0281, lng: 129.7326 },
      'Орёл': { lat: 52.9656, lng: 36.0655 },
      'Череповец': { lat: 59.1336, lng: 37.9059 },
      'Владимир': { lat: 56.1291, lng: 40.4068 },
      'Мурманск': { lat: 68.9605, lng: 33.0844 },
      'Курган': { lat: 55.4478, lng: 65.3393 },
      'Симферополь': { lat: 44.9521, lng: 34.1024 },
      'Грозный': { lat: 43.3122, lng: 45.6877 },
      'Кострома': { lat: 57.7677, lng: 40.9252 },
      'Петрозаводск': { lat: 61.7849, lng: 34.3473 },
      'Тамбов': { lat: 52.7236, lng: 41.4422 },
      'Нижневартовск': { lat: 60.9346, lng: 76.5596 },
      'Нальчик': { lat: 43.4856, lng: 43.6077 },
      'Тверь': { lat: 56.8587, lng: 35.9176 },
      'Новочеркасск': { lat: 47.4067, lng: 40.0945 },
      'Йошкар-Ола': { lat: 56.6342, lng: 47.8982 },
    };

    const lowerCaseCity = city.toLowerCase();
    for (const [cityName, coords] of Object.entries(cityCoordinates)) {
      if (lowerCaseCity.includes(cityName.toLowerCase())) return coords;
    }
    return null;
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

// StoreItem is already exported via `export interface StoreItem`. Coordinates is internal.
export type { Coordinates };
