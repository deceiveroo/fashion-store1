'use client';

import { useEffect, useRef, useState } from 'react';
import { StoreItem } from '@/app/company/stores/page'; // Импортируем тип магазина

interface InteractiveMapProps {
  stores: StoreItem[];
  selectedStore?: StoreItem | null;
  onStoreSelect?: (store: StoreItem) => void;
  showAllStores?: boolean;
  customKey?: string | number; // Изменяем название пропса с key на customKey
}

export default function InteractiveMap({ stores, selectedStore, onStoreSelect, showAllStores = false, customKey }: InteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapInstance, setMapInstance] = useState<any>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    let mapInstanceRef: any = null;

    const initMap = () => {
      if (window.ymaps && mapRef.current) {
        // Уничтожаем предыдущую карту, если она существует
        if (mapInstanceRef) {
          mapInstanceRef.destroy();
        }
        
        const map = new window.ymaps.Map(mapRef.current!, {
          center: [55.7558, 37.6176], // Начальный центр - Москва
          zoom: 5,
          controls: ['zoomControl', 'fullscreenControl']
        });

        mapInstanceRef = map;
        setMapInstance(map);

        // Очищаем старые объекты перед добавлением новых
        map.geoObjects.removeAll();

        // Добавляем метки магазинов
        stores.forEach((store) => {
          const placemark = new window.ymaps.Placemark(
            [store.coordinates.lat, store.coordinates.lng],
            {
              hintContent: store.name,
              balloonContent: `
                <div class="font-bold text-lg" style="font-family: sans-serif; padding: 10px; max-width: 300px;">
                  <div style="color: #4f46e5; font-weight: bold; font-size: 16px;">${store.name}</div>
                  <div style="font-size: 14px; margin-top: 5px; color: #374151;">${store.address}</div>
                  <div style="font-size: 12px; margin-top: 8px; display: flex; align-items: center; color: #7c3aed;">
                    <svg style="width: 14px; height: 14px; margin-right: 4px; fill: #7c3aed;" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    ${store.rating}
                  </div>
                  <div style="margin-top: 10px;">
                    <a href="tel:${store.phone}" style="color: #4f46e5; text-decoration: none; font-size: 13px;">${store.phone}</a>
                  </div>
                </div>
              `
            },
            {
              iconLayout: 'default#image',
              iconImageHref: '/images/store-marker.png', // Путь к кастомному маркеру
              iconImageSize: [40, 40],
              iconImageOffset: [-20, -40]
            }
          );

          // Добавляем обработчик клика
          if (onStoreSelect) {
            placemark.events.add('click', () => {
              onStoreSelect(store);
            });
          }

          map.geoObjects.add(placemark);

          // Центрируем карту на выбранном магазине, если он есть
          if (selectedStore && selectedStore.id === store.id) {
            map.setCenter([store.coordinates.lat, store.coordinates.lng], 15);
          }
        });

        // Устанавливаем оптимальный масштаб, если показываем все магазины
        if (showAllStores && stores.length > 1) {
          // Создаем кластер, чтобы получить границы, охватывающие все метки
          const clusterer = new window.ymaps.Clusterer({
            clusterDisableClickZoom: true,
            clusterHideIconOnBalloonOpen: false,
            geoObjectHideIconOnBalloonOpen: false
          });
          
          const placemarks = stores.map(store => new window.ymaps.Placemark([store.coordinates.lat, store.coordinates.lng]));
          clusterer.add(placemarks);
          
          // Получаем границы кластера и устанавливаем их на карту
          const bounds = clusterer.getBounds();
          if (bounds) {
            map.setBounds(bounds, {
              zoomMargin: [50, 50, 50, 50]
            });
          }
        } else if (selectedStore) {
          // Центрируем на выбранном магазине
          const selected = stores.find(s => s.id === selectedStore.id);
          if (selected) {
            map.setCenter([selected.coordinates.lat, selected.coordinates.lng], 15);
          }
        }

        setMapLoaded(true);
      }
    };

    // Загружаем скрипт Яндекс.Карт только один раз
    if (typeof window !== 'undefined' && !window.ymaps) {
      const script = document.createElement('script');
      // Замените 'ваш_api_ключ' на реальный API-ключ Яндекс.Карт
      script.src = 'https://api-maps.yandex.ru/2.1/?apikey=088bd723-ceaa-45d8-bd21-3311cc79d1bb&lang=ru_RU';
      script.async = true;
      script.onload = () => {
        window.ymaps.ready(initMap);
      };
      document.head.appendChild(script);
    } else if (window.ymaps) {
      initMap();
    }

    // Очистка при размонтировании
    return () => {
      if (mapInstanceRef) {
        mapInstanceRef.destroy();
        mapInstanceRef = null;
      }
    };
  }, [customKey, stores, selectedStore, onStoreSelect, showAllStores]); // Обновляем при изменении customKey

  // Функция для прокладки маршрута
  const buildRoute = (store: StoreItem) => {
    if (window.ymaps && navigator.geolocation && mapInstance) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userCoords = [position.coords.latitude, position.coords.longitude];
          const storeCoords = [store.coordinates.lat, store.coordinates.lng];

          window.ymaps.route([userCoords, storeCoords]).then(
            (route: any) => {
              // Удаляем предыдущие маршруты
              mapInstance.geoObjects.each(obj => {
                if (obj.geometry && obj.geometry.getType() === 'LineString') {
                  mapInstance.geoObjects.remove(obj);
                }
              });
              
              mapInstance.geoObjects.add(route);
              mapInstance.setBounds(route.properties.get('boundedBy'), {
                checkZoomRange: true
              });
            },
            (error: any) => {
              console.error('Ошибка прокладки маршрута:', error);
              alert('Не удалось проложить маршрут. Проверьте настройки геолокации.');
            }
          );
        },
        (error) => {
          console.error('Ошибка получения геолокации:', error);
          alert('Не удалось определить ваше местоположение. Проверьте настройки геолокации.');
        }
      );
    } else {
      alert('Геолокация не поддерживается в вашем браузере или карта еще не загружена.');
    }
  };

  // Функция для центрирования на пользователе
  const centerOnUser = () => {
    if (window.ymaps && navigator.geolocation && mapInstance) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userCoords = [position.coords.latitude, position.coords.longitude];
          mapInstance.setCenter(userCoords, 15);
        },
        (error) => {
          console.error('Ошибка получения геолокации:', error);
          alert('Не удалось определить ваше местоположение. Проверьте настройки геолокации.');
        }
      );
    } else {
      alert('Геолокация не поддерживается в вашем браузере или карта еще не загружена.');
    }
  };

  // Обработка событий, отправляемых извне
  useEffect(() => {
    const handleBuildRoute = (e: any) => {
      if (selectedStore) {
        buildRoute(selectedStore);
      }
    };

    const handleCenterOnUser = () => {
      centerOnUser();
    };

    window.addEventListener('buildRoute', handleBuildRoute as EventListener);
    window.addEventListener('centerOnUser', handleCenterOnUser as EventListener);

    return () => {
      window.removeEventListener('buildRoute', handleBuildRoute as EventListener);
      window.removeEventListener('centerOnUser', handleCenterOnUser as EventListener);
    };
  }, [selectedStore, mapInstance]);

  return (
    <div className="w-full h-full">
      <div ref={mapRef} className="w-full h-full min-h-[300px] rounded-xl" style={{ minHeight: '300px' }} />
    </div>
  );
}

// Определение глобального типа для Yandex Maps
declare global {
  interface Window {
    ymaps: any;
  }
}