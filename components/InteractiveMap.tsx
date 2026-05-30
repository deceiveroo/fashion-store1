'use client';

import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import type { Map as LeafletMap, Marker, LayerGroup } from 'leaflet';
import type { StoreItem } from '@/lib/stores/types';

interface InteractiveMapProps {
  stores: StoreItem[];
  selectedStore?: StoreItem | null;
  onStoreSelect?: (store: StoreItem) => void;
  showAllStores?: boolean;
  customKey?: string | number; // совместимость со старым API (не используется)
}

const ACCENT = '#8b7cf6';

// Кастомный маркер бренда (SVG-«капля» с акцентным градиентом)
function markerSvg(active: boolean): string {
  const scale = active ? 1.15 : 1;
  return `
    <div style="transform: translate(-50%, -100%) scale(${scale}); transform-origin: bottom center; transition: transform .2s;">
      <svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 0C7.163 0 0 7.163 0 16c0 11 16 26 16 26s16-15 16-26C32 7.163 24.837 0 16 0z"
          fill="${active ? '#7c3aed' : ACCENT}"/>
        <circle cx="16" cy="16" r="6" fill="white"/>
      </svg>
    </div>`;
}

// Ссылка на построение маршрута в Яндекс.Навигаторе/Картах
function routeUrl(from: { lat: number; lng: number } | null, store: StoreItem): string {
  const to = `${store.coordinates.lat},${store.coordinates.lng}`;
  if (from) {
    return `https://yandex.ru/maps/?rtext=${from.lat},${from.lng}~${to}&rtt=auto`;
  }
  // без геолокации — просто построим маршрут «до точки» (старт пользователь укажет сам)
  return `https://yandex.ru/maps/?rtext=~${to}&rtt=auto`;
}

export default function InteractiveMap({
  stores,
  selectedStore,
  onStoreSelect,
  showAllStores = false,
}: InteractiveMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layerRef = useRef<LayerGroup | null>(null);
  const markersRef = useRef<Record<string, Marker>>({});
  const leafletRef = useRef<typeof import('leaflet') | null>(null);
  const onSelectRef = useRef(onStoreSelect);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    onSelectRef.current = onStoreSelect;
  }, [onStoreSelect]);

  // 1) Инициализация карты один раз (Leaflet работает только в браузере)
  useEffect(() => {
    let cancelled = false;

    import('leaflet')
      .then((L) => {
        if (cancelled || !containerRef.current || mapRef.current) return;
        leafletRef.current = L;

        const map = L.map(containerRef.current, {
          center: [55.7558, 37.6176],
          zoom: 4,
          scrollWheelZoom: true,
          attributionControl: true,
        });

        // CARTO Voyager — нейтральные премиальные тайлы, без ключа.
        // Тёмная тема сайта → тёмные тайлы (dark_all), светлая → voyager.
        const isDark =
          typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
        const tileUrl = isDark
          ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
          : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

        L.tileLayer(tileUrl, {
          maxZoom: 20,
          subdomains: 'abcd',
          attribution: '© CARTO',
        }).addTo(map);

        layerRef.current = L.layerGroup().addTo(map);
        mapRef.current = map;
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        layerRef.current = null;
        markersRef.current = {};
      }
    };
  }, []);

  // 2) Перерисовка меток + позиционирование при изменении данных
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    const layer = layerRef.current;
    if (status !== 'ready' || !L || !map || !layer) return;

    layer.clearLayers();
    markersRef.current = {};

    stores.forEach((store) => {
      const active = selectedStore?.id === store.id;
      const icon = L.divIcon({
        html: markerSvg(active),
        className: '',
        iconSize: [32, 42],
        iconAnchor: [16, 42],
        popupAnchor: [0, -40],
      });

      const marker = L.marker([store.coordinates.lat, store.coordinates.lng], {
        icon,
        zIndexOffset: active ? 1000 : 0,
      });

      marker.bindPopup(
        `<div style="font-family: sans-serif; min-width: 180px;">
          <div style="color:${ACCENT}; font-weight:700; font-size:14px;">${store.name}</div>
          <div style="font-size:12px; margin-top:4px; color:#374151;">${store.address}</div>
          <div style="font-size:12px; margin-top:6px; color:${ACCENT};">★ ${store.rating}</div>
          <a href="${routeUrl(null, store)}" target="_blank" rel="noopener noreferrer"
             style="display:inline-block; margin-top:8px; color:#fff; background:${ACCENT}; padding:5px 10px; border-radius:8px; font-size:12px; text-decoration:none;">
            Маршрут →
          </a>
        </div>`,
        { closeButton: true }
      );

      marker.on('click', () => onSelectRef.current?.(store));
      marker.addTo(layer);
      markersRef.current[store.id] = marker;
    });

    // Позиционирование
    if (selectedStore) {
      const m = markersRef.current[selectedStore.id];
      map.flyTo([selectedStore.coordinates.lat, selectedStore.coordinates.lng], 13, { duration: 0.6 });
      if (m) setTimeout(() => m.openPopup(), 350);
    } else if (stores.length > 1) {
      const bounds = L.latLngBounds(stores.map((s) => [s.coordinates.lat, s.coordinates.lng]));
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 12 });
    } else if (stores.length === 1) {
      map.setView([stores[0].coordinates.lat, stores[0].coordinates.lng], 13);
    }
    void showAllStores;
  }, [stores, selectedStore, showAllStores, status]);

  // 3) Внешние события: «Проложить маршрут» / «Где я» — открываем навигатор
  useEffect(() => {
    const openRoute = (store: StoreItem) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const from = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            window.open(routeUrl(from, store), '_blank', 'noopener,noreferrer');
          },
          () => {
            // нет доступа к геолокации — открываем маршрут без точки старта
            window.open(routeUrl(null, store), '_blank', 'noopener,noreferrer');
          },
          { timeout: 8000 }
        );
      } else {
        window.open(routeUrl(null, store), '_blank', 'noopener,noreferrer');
      }
    };

    const centerOnUser = () => {
      const map = mapRef.current;
      if (map && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => map.flyTo([pos.coords.latitude, pos.coords.longitude], 13, { duration: 0.6 }),
          () => alert('Не удалось определить ваше местоположение. Проверьте настройки геолокации.')
        );
      } else {
        alert('Геолокация не поддерживается в вашем браузере.');
      }
    };

    const handleBuildRoute = (e: Event) => {
      const detail = (e as CustomEvent).detail as StoreItem | undefined;
      const target = detail ?? selectedStore;
      if (target) openRoute(target);
    };
    const handleCenterOnUser = () => centerOnUser();

    window.addEventListener('buildRoute', handleBuildRoute as EventListener);
    window.addEventListener('centerOnUser', handleCenterOnUser as EventListener);
    return () => {
      window.removeEventListener('buildRoute', handleBuildRoute as EventListener);
      window.removeEventListener('centerOnUser', handleCenterOnUser as EventListener);
    };
  }, [selectedStore]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full min-h-[300px] w-full rounded-xl" style={{ minHeight: '300px', zIndex: 0 }} />

      {status === 'loading' && (
        <div className="absolute inset-0 z-[1] flex items-center justify-center rounded-xl bg-[var(--fc-surface-elevated)]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#8b7cf6] border-t-transparent" />
        </div>
      )}

      {status === 'error' && (
        <div className="absolute inset-0 z-[1] flex flex-col items-center justify-center gap-3 rounded-xl bg-[var(--fc-surface-elevated)] p-6 text-center">
          <p className="text-sm text-[var(--text-secondary)]">Не удалось загрузить карту. Проверьте подключение к интернету.</p>
        </div>
      )}
    </div>
  );
}
