// Тип для координат
interface Coordinates {
  lat: number;
  lng: number;
}

// Тип для магазина
interface Store {
  id: string;
  name: string;
  address: string;
  coordinates: Coordinates;
  hours: string;
  phone: string;
  rating: number;
  services: string[];
}

// Список магазинов с координатами
export const stores: Store[] = [
  {
    id: '1',
    name: "ELEVATE Центральный",
    address: "Москва, ул. Арбат, 12",
    coordinates: { lat: 55.753215, lng: 37.588382 },
    hours: "Пн-Вс: 10:00 - 22:00",
    phone: "+7 (495) 123-45-67",
    rating: 4.9,
    services: ["Примерка", "Индивидуальный подход", "Возврат/обмен", "Упаковка в подарок"]
  },
  {
    id: '2',
    name: "ELEVATE Мега Теплый Стан",
    address: "Москва, Новоясеневский пр-т, 2",
    coordinates: { lat: 55.587883, lng: 37.524137 },
    hours: "Пн-Вс: 10:00 - 23:00",
    phone: "+7 (495) 987-65-43",
    rating: 4.8,
    services: ["Примерка", "Доставка", "Возврат/обмен", "VIP-зона"]
  },
  {
    id: '3',
    name: "ELEVATE Петровский Пассаж",
    address: "Москва, ул. Петровка, 23/6",
    coordinates: { lat: 55.759438, lng: 37.618122 },
    hours: "Пн-Вс: 11:00 - 22:00",
    phone: "+7 (495) 567-89-01",
    rating: 5.0,
    services: ["Примерка", "Индивидуальный подход", "Возврат/обмен", "VIP-зона", "Персональный стилист"]
  },
  {
    id: '4',
    name: "ELEVATE Вавилова",
    address: "Москва, ул. Вавилова, 3",
    coordinates: { lat: 55.701245, lng: 37.565432 },
    hours: "Пн-Вс: 10:00 - 22:00",
    phone: "+7 (495) 111-22-33",
    rating: 4.7,
    services: ["Примерка", "Доставка", "Возврат/обмен"]
  },
  {
    id: '5',
    name: "ELEVATE Новокузнецкая",
    address: "Москва, ул. Новокузнецкая, 1",
    coordinates: { lat: 55.744321, lng: 37.628765 },
    hours: "Пн-Вс: 10:00 - 23:00",
    phone: "+7 (495) 444-55-66",
    rating: 4.6,
    services: ["Примерка", "Индивидуальный подход", "Возврат/обмен"]
  }
];