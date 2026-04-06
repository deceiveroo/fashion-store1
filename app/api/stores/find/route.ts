import { NextRequest } from 'next/server';
import { geocodeAddress } from '@/lib/location'; // Вспомогательная функция для геокодирования
import { stores } from '../stores'; // Используем список магазинов

// Тип для координат
interface Coordinates {
  lat: number;
  lng: number;
}

// Функция для вычисления расстояния между двумя точками (в км) по формуле гаверсинусов
function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
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
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const radiusStr = searchParams.get('radius');

    if (!city) {
      return Response.json({ error: 'Город обязателен для поиска' }, { status: 400 });
    }

    const radius = radiusStr ? parseInt(radiusStr) : 50; // По умолчанию 50 км

    if (isNaN(radius) || radius <= 0) {
      return Response.json({ error: 'Некорректный радиус' }, { status: 400 });
    }

    // Геокодирование города пользователя
    const userCoords = await geocodeAddress(city);
    if (!userCoords) {
      return Response.json({ error: 'Не удалось найти указанный город' }, { status: 404 });
    }

    // Фильтрация магазинов по радиусу
    const nearbyStores = stores.filter(store => {
      const storeCoords = store.coordinates;
      if (!storeCoords) return false; // Пропускаем магазины без координат
      
      const distance = calculateDistance(userCoords, storeCoords);
      return distance <= radius;
    });

    // Добавляем расстояние к каждому магазину
    const storesWithDistance = nearbyStores.map(store => {
      const distance = calculateDistance(userCoords, store.coordinates);
      return {
        ...store,
        distance: Math.round(distance * 10) / 10, // Округляем до 1 знака после запятой
      };
    });

    // Сортируем по расстоянию
    storesWithDistance.sort((a, b) => a.distance - b.distance);

    return Response.json(storesWithDistance);
  } catch (error) {
    console.error('Ошибка при поиске ближайших магазинов:', error);
    return Response.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}