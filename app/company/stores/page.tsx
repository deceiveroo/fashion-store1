// app/company/stores/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { MapPin, Clock, Phone, Star, Globe, ShoppingCart, Package, Store, Navigation, Building, Users, Award, Search, Map, X, TrendingUp, Users2, Building2, ChevronDown, ChevronUp } from 'lucide-react';
import InteractiveMap from '@/components/InteractiveMap';
import AnimatedBackground from '@/components/AnimatedBackground';

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

export default function StoresPage() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  // Используем useState для хранения данных магазинов
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Загружаем данные с помощью useEffect
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

  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [userCity, setUserCity] = useState('');
  const [searchRadius, setSearchRadius] = useState('50');
  const [nearbyStores, setNearbyStores] = useState<StoreItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [selectedStore, setSelectedStore] = useState<StoreItem | null>(null);
  const [showAllStoresModal, setShowAllStoresModal] = useState(false);
  const [expandedStore, setExpandedStore] = useState<string | null>(null);
  const [mapKey, setMapKey] = useState(0); // Для принудительной перезагрузки карты

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const storeStats = [
    { number: "25+", label: "Магазинов по России", icon: Building },
    { number: "100%", label: "Онлайн-бронирование", icon: Globe },
    { number: "24/7", label: "Поддержка", icon: Users },
    { number: "5.0", label: "Средний рейтинг", icon: Award }
  ];

  const storeTypes = [
    { id: 'all', name: 'Все магазины', count: stores.length },
    { id: 'flagship', name: 'Флагманские', count: 3 },
    { id: 'mall', name: 'Торговые центры', count: 7 }
  ];

  // Фильтруем магазины в зависимости от активной вкладки
  const filteredStores = activeTab === 'all' 
    ? stores 
    : stores.filter(store => 
        activeTab === 'flagship' && ['ELEVATE Центральный', 'ELEVATE Петровский Пассаж', 'ELEVATE Сити'].includes(store.name) ||
        activeTab === 'mall' && !['ELEVATE Центральный', 'ELEVATE Петровский Пассаж', 'ELEVATE Сити'].includes(store.name)
      );

  // Ограничиваем количество магазинов на главной странице до 6
  const displayedStores = nearbyStores.length > 0 ? nearbyStores : filteredStores.slice(0, 6);

  // Функция для вычисления расстояния между двумя точками (в км) по формуле гаверсинусов
  const calculateDistance = (coord1: Coordinates, coord2: Coordinates): number => {
    const R = 6371; // Радиус Земли в км
    const dLat = deg2rad(coord2.lat - coord1.lat);
    const dLon = deg2rad(coord2.lng - coord1.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(coord1.lat)) *
        Math.cos(deg2rad(coord2.lat)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const deg2rad = (deg: number): number => {
    return deg * (Math.PI / 180);
  };

  // Функция поиска ближайших магазинов
  const findNearbyStores = async () => {
    if (!userCity.trim()) {
      setSearchError('Пожалуйста, укажите город');
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    
    try {
      // Имитация задержки API
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Имитация геокодирования (в реальном приложении здесь будет вызов API)
      // Для демонстрации мы используем упрощенную реализацию
      const cityCoords = await geocodeCity(userCity);
      
      if (!cityCoords) {
        throw new Error(`Не удалось найти координаты для города: ${userCity}`);
      }

      // Вычисляем расстояния до всех магазинов
      const storesWithDistance = stores.map(store => {
        const distance = calculateDistance(cityCoords, store.coordinates);
        return {
          ...store,
          distance: Math.round(distance * 10) / 10 // Округляем до 1 знака после запятой
        };
      });

      // Фильтруем по радиусу и сортируем по расстоянию
      const radius = parseInt(searchRadius);
      const nearby = storesWithDistance
        .filter(store => store.distance! <= radius)
        .sort((a, b) => (a.distance! - b.distance!))
        .slice(0, 3); // Ограничиваем до 3 ближайших

      if (nearby.length === 0) {
        throw new Error(`В радиусе ${radius} км от ${userCity} магазинов не найдено`);
      }

      setNearbyStores(nearby);
    } catch (error: any) {
      setSearchError(error.message || 'Произошла ошибка при поиске магазинов');
      setNearbyStores([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Упрощенная функция геокодирования (в реальном приложении должна вызывать API)
  const geocodeCity = async (city: string): Promise<Coordinates | null> => {
    // В реальном приложении вы бы вызывали внешнее API:
    // const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(city)}&key=${process.env.GOOGLE_MAPS_API_KEY}`);
    // const data = await response.json();
    // return { lat: data.results[0].geometry.location.lat, lng: data.results[0].geometry.location.lng };

    // Для демонстрации реализуем базовую симуляцию с фиксированными координатами для некоторых городов
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
      'Йошкар-Ола': { lat: 56.6342, lng: 47.8982 }
    };

    // Проверяем, есть ли координаты для указанного города
    const lowerCaseCity = city.toLowerCase();
    for (const [cityName, coords] of Object.entries(cityCoordinates)) {
      if (lowerCaseCity.includes(cityName.toLowerCase())) {
        return coords;
      }
    }

    // Если город не найден в списке, возвращаем null
    return null;
  };

  // Сброс поиска
  const resetSearch = () => {
    setNearbyStores([]);
    setUserCity('');
    setSearchRadius('50');
  };

  // Показать магазин на карте
  const viewOnMap = (store: StoreItem) => {
    setSelectedStore(store);
    setShowMap(true);
  };

  // Показать все магазины на карте
  const viewAllStoresOnMap = () => {
    setShowAllStoresModal(true);
    setMapKey(prev => prev + 1); // Принудительно перезагружаем карту
  };

  // Переключить раскрытие информации о магазине
  const toggleStoreInfo = (storeId: string) => {
    setExpandedStore(expandedStore === storeId ? null : storeId);
  };

  // Обработчик выбора магазина в списке
  const handleStoreSelect = (store: StoreItem) => {
    setSelectedStore(store);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-indigo-900/20 dark:to-gray-900 pt-24 pb-16 relative overflow-hidden">
      {/* Animated background elements */}
      <AnimatedBackground />
      
      {/* Модальное окно для просмотра всех магазинов на карте */}
      {showAllStoresModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
          >
            <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex justify-between items-center">
              <h3 className="text-xl font-bold">Все магазины на карте</h3>
              <button 
                onClick={() => {
                  setShowAllStoresModal(false);
                  setSelectedStore(null);
                }}
                className="text-white hover:text-gray-200"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <p className="text-gray-700">Выберите магазин на карте или в списке для получения дополнительной информации</p>
            </div>
            
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 overflow-auto">
              <div className="h-96 lg:h-full">
                <InteractiveMap 
                  customKey={`all-stores-map-${mapKey}`} // Используем customKey вместо key
                  stores={stores} 
                  showAllStores={true}
                  onStoreSelect={handleStoreSelect}
                />
              </div>
              
              <div className="space-y-4">
                <h4 className="font-bold text-lg text-gray-900">Список магазинов</h4>
                {stores.map((store) => (
                  <div 
                    key={store.id} 
                    className={`border border-gray-200 rounded-xl p-4 cursor-pointer transition-all ${
                      selectedStore?.id === store.id ? 'bg-indigo-50 border-indigo-300' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleStoreSelect(store)}
                  >
                    <div className="flex justify-between items-center">
                      <h5 className="font-bold text-gray-900">{store.name}</h5>
                      <div className="flex items-center gap-1 bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                        <Star size={12} fill="currentColor" />
                        <span className="text-xs font-semibold">{store.rating}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{store.address}</p>
                    <p className="text-sm text-gray-500 mt-2">{store.phone}</p>
                    
                    <div className="mt-2 flex flex-wrap gap-1">
                      {store.services.slice(0, 3).map((service, idx) => (
                        <span 
                          key={idx} 
                          className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs"
                        >
                          {service}
                        </span>
                      ))}
                      {store.services.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                          +{store.services.length - 3} еще
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Карта - модальное окно для одного магазина */}
      {showMap && selectedStore && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
          >
            <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex justify-between items-center">
              <h3 className="text-xl font-bold">{selectedStore.name}</h3>
              <button 
                onClick={() => {
                  setShowMap(false);
                  setSelectedStore(null);
                }}
                className="text-white hover:text-gray-200"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
              <div className="lg:col-span-2 h-96 lg:h-full">
                <InteractiveMap 
                  customKey={`single-store-map-${selectedStore.id}-${mapKey}`} // Используем customKey вместо key
                  stores={[selectedStore]} 
                  selectedStore={selectedStore}
                />
              </div>
              
              <div className="space-y-6">
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => {
                      // Пример реализации прокладки маршрута через API Яндекс.Карт
                      if (typeof window !== 'undefined' && selectedStore) {
                        // Получаем экземпляр карты и вызываем функцию прокладки маршрута
                        const event = new CustomEvent('buildRoute', { detail: selectedStore });
                        window.dispatchEvent(event);
                      }
                    }}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3.5 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Navigation size={18} />
                    Проложить маршрут
                  </button>
                  
                  <button
                    className="bg-gray-200 text-gray-800 px-6 py-3.5 rounded-xl font-semibold hover:bg-gray-300 transition-all flex items-center justify-center gap-2"
                    onClick={() => {
                      // Центрирование карты на пользователе
                      const event = new CustomEvent('centerOnUser', { detail: selectedStore });
                      window.dispatchEvent(event);
                    }}
                  >
                    <MapPin size={18} />
                    Мое местоположение
                  </button>
                </div>
                
                {/* Информация о выбранном магазине */}
                <div className="mt-4 p-4 bg-white rounded-lg shadow-md border border-gray-200">
                  <h3 className="font-bold text-lg text-indigo-700">{selectedStore.name}</h3>
                  <p className="text-gray-600 mt-1">{selectedStore.address}</p>
                  <p className="text-gray-600 mt-1">Телефон: {selectedStore.phone}</p>
                </div>
                
                <div>
                  <h4 className="font-bold text-lg text-gray-900 mb-3">Информация о магазине</h4>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <MapPin size={20} className="text-indigo-600 mt-1 flex-shrink-0" />
                      <div>
                        <h5 className="font-semibold text-gray-900">Адрес</h5>
                        <p className="text-gray-700">{selectedStore.address}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <Clock size={20} className="text-indigo-600 mt-1 flex-shrink-0" />
                      <div>
                        <h5 className="font-semibold text-gray-900">Часы работы</h5>
                        <p className="text-gray-700">{selectedStore.hours}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <Phone size={20} className="text-indigo-600 mt-1 flex-shrink-0" />
                      <div>
                        <h5 className="font-semibold text-gray-900">Телефон</h5>
                        <p className="text-gray-700">{selectedStore.phone}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <Star size={20} className="text-indigo-600 mt-1 flex-shrink-0" />
                      <div>
                        <h5 className="font-semibold text-gray-900">Рейтинг</h5>
                        <p className="text-gray-700">{selectedStore.rating} из 5</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-bold text-lg text-gray-900 mb-3">Услуги</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedStore.services.map((service, idx) => (
                      <span 
                        key={idx} 
                        className="px-3 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
                
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16 relative"
        >
          <div className="flex justify-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur-xl opacity-30"></div>
              <div className="relative bg-gradient-to-r from-indigo-500 to-purple-500 w-24 h-24 rounded-full flex items-center justify-center">
                <Store className="text-white" size={48} />
              </div>
            </motion.div>
          </div>
          <motion.h1 
            className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Наши магазины
          </motion.h1>
          <motion.p 
            className="text-xl text-gray-700 max-w-3xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Посетите наши магазины по всей России и ощутите атмосферу ELEVATE лично
          </motion.p>
        </motion.div>

        {/* Store stats with animated counters */}
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          {storeStats.map((stat, index) => (
            <motion.div 
              key={index}
              className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg"
              whileHover={{ y: -10, scale: 1.05 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + index * 0.1 }}
            >
              <div className="flex justify-center mb-3">
                <stat.icon className="text-indigo-600" size={28} />
              </div>
              <motion.div 
                className="text-3xl font-bold text-indigo-600 mb-2"
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 200, 
                  damping: 10,
                  delay: 1 + index * 0.1 
                }}
              >
                {stat.number}
              </motion.div>
              <div className="text-gray-700 text-sm">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        <div className="mb-16">
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {storeTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => !isSearching && setActiveTab(type.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeTab === type.id && !isSearching
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                    : 'bg-white/80 text-gray-700 hover:bg-indigo-100'
                } ${isSearching ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={isSearching}
              >
                {type.name} <span className="opacity-80">({type.count})</span>
              </button>
            ))}
            
            <button
              onClick={viewAllStoresOnMap}
              className="px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all flex items-center gap-1"
            >
              <Map size={16} />
              Все магазины на карте
            </button>
          </div>

          {/* Поиск ближайших магазинов */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/50 mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Найти ближайший магазин</h2>
            
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ваш город
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={userCity}
                    onChange={(e) => setUserCity(e.target.value)}
                    placeholder="Введите город"
                    className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white/70 backdrop-blur-sm"
                    disabled={isSearching}
                  />
                  <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                </div>
              </div>
              
              <div className="w-full md:w-48">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Радиус поиска (км)
                </label>
                <select 
                  value={searchRadius}
                  onChange={(e) => setSearchRadius(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white/70 backdrop-blur-sm"
                  disabled={isSearching}
                >
                  <option value="10">10 км</option>
                  <option value="25">25 км</option>
                  <option value="50">50 км</option>
                  <option value="100">100 км</option>
                </select>
              </div>
              
              <div className="flex items-end">
                <motion.button
                  className="w-full md:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  onClick={findNearbyStores}
                  disabled={isSearching}
                  whileHover={{ scale: isSearching ? 1 : 1.02 }}
                  whileTap={isSearching ? {} : { scale: 0.98 }}
                >
                  {isSearching ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Поиск...
                    </>
                  ) : (
                    <>
                      <Search size={20} />
                      Найти
                    </>
                  )}
                </motion.button>
              </div>
            </div>
            
            {searchError && (
              <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg text-center">
                {searchError}
              </div>
            )}
            
            {nearbyStores.length > 0 && (
              <div className="mt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Найдено {nearbyStores.length} магазинов
                  </h3>
                  <button 
                    onClick={resetSearch}
                    className="text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Сбросить поиск
                  </button>
                </div>
                
                {/* Карточки найденных магазинов */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
                  {nearbyStores.map((store, index) => (
                    <motion.div
                      key={store.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                      className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-white/50"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-lg font-bold text-gray-900">{store.name}</h3>
                        <div className="flex items-center gap-1 bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                          <Star size={12} fill="currentColor" />
                          <span className="text-xs font-semibold">{store.rating}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-start gap-2">
                          <MapPin size={16} className="text-indigo-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{store.address}</span>
                        </div>
                        
                        {store.distance !== undefined && (
                          <div className="flex items-center gap-2">
                            <Navigation size={16} className="text-indigo-600" />
                            <span className="text-sm text-gray-700">Расстояние: {store.distance} км</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {store.services.slice(0, 2).map((service, idx) => (
                          <span 
                            key={idx} 
                            className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs"
                          >
                            {service}
                          </span>
                        ))}
                        {store.services.length > 2 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                            +{store.services.length - 2} еще
                          </span>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => viewOnMap(store)}
                          className="flex-1 bg-indigo-100 text-indigo-700 py-2 rounded-lg text-sm font-medium hover:bg-indigo-200 transition-colors flex items-center justify-center gap-1"
                        >
                          <Map size={14} />
                          На карте
                        </button>
                        <button
                          className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 rounded-lg text-sm font-medium hover:shadow transition-shadow"
                        >
                          <Navigation size={14} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Отображение результатов поиска или обычных магазинов */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {displayedStores.map((store, index) => (
              <motion.div
                key={store.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 + index * 0.1 }}
                whileHover={{ y: -20, scale: 1.03 }}
                className="bg-white/80 backdrop-blur-sm rounded-3xl overflow-hidden shadow-xl border border-white/50 hover:shadow-2xl transition-all"
              >
                <div className="h-48 bg-gradient-to-r from-indigo-500 to-purple-500 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-5xl">🛍️</div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-bold text-gray-900">{store.name}</h2>
                    <div className="flex items-center gap-1 bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                      <Star size={14} fill="currentColor" />
                      <span className="text-sm font-semibold">{store.rating}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex items-start gap-3">
                      <MapPin size={18} className="text-indigo-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{store.address}</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Clock size={18} className="text-indigo-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{store.hours}</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Phone size={18} className="text-indigo-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{store.phone}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div 
                      className="flex justify-between items-center cursor-pointer"
                      onClick={() => toggleStoreInfo(store.id)}
                    >
                      <h3 className="font-semibold text-gray-900">Услуги:</h3>
                      {expandedStore === store.id ? <ChevronUp /> : <ChevronDown />}
                    </div>
                    
                    {expandedStore === store.id && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {store.services.map((service, idx) => (
                          <span 
                            key={idx} 
                            className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm"
                          >
                            {service}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-3 mt-6">
                    <motion.button
                      className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2.5 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                      onClick={() => viewOnMap(store)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Map size={18} />
                      На карте
                    </motion.button>
                    
                    <motion.button
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2.5 px-4 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Navigation size={18} />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Заменяем секцию с достижениями на кнопку "Все магазины на карте" */}
        <div className="flex justify-center mb-20">
          <motion.button
            onClick={viewAllStoresOnMap}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-xl transition-all flex items-center gap-3"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Map size={24} />
            Посмотреть все магазины на карте
          </motion.button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-white text-center"
        >
          <MapPin size={48} className="mx-auto mb-4 text-white/80" />
          <h2 className="text-2xl font-bold mb-4">Не нашли магазин рядом?</h2>
          <p className="text-indigo-200 mb-6 max-w-2xl mx-auto">
            Мы планируем расширение сети по всей России. Подпишитесь на нашу рассылку, чтобы первыми узнавать о новых магазинах
          </p>
          <a 
            href="/support/contact" 
            className="inline-block bg-white text-indigo-600 px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-all transform hover:scale-105"
          >
            Связаться с нами
          </a>
        </motion.div>
      </div>
    </div>
  );
}

// Экспортируем интерфейсы и типы, чтобы они были доступны в других файлах
export type { StoreItem, Coordinates };
