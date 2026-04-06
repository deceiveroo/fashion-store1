import { NextResponse } from 'next/server';

interface StoreItem {
  id: string;
  name: string;
  address: string;
  hours: string;
  phone: string;
  rating: number;
  services: string[];
}

export async function GET() {
  const stores: StoreItem[] = [
    {
      id: '1',
      name: "ELEVATE Центральный",
      address: "Москва, ул. Арбат, 12",
      hours: "Пн-Вс: 10:00 - 22:00",
      phone: "+7 (495) 123-45-67",
      rating: 4.9,
      services: ["Примерка", "Индивидуальный подход", "Возврат/обмен", "Упаковка в подарок"]
    },
    {
      id: '2',
      name: "ELEVATE Мега Теплый Стан",
      address: "Москва, МКАД 40-й км, ТРЦ МЕГА",
      hours: "Пн-Вс: 10:00 - 22:00",
      phone: "+7 (495) 234-56-78",
      rating: 4.8,
      services: ["Примерка", "Возврат/обмен", "Доставка из магазина"]
    },
    {
      id: '3',
      name: "ELEVATE Европейский",
      address: "Москва, пл. Киевского Вокзала, 2, ТЦ Европейский",
      hours: "Пн-Вс: 10:00 - 22:00",
      phone: "+7 (495) 345-67-89",
      rating: 4.7,
      services: ["Примерка", "Возврат/обмен", "Подарочная упаковка"]
    },
    {
      id: '4',
      name: "ELEVAVE Санкт-Петербург Невский",
      address: "Санкт-Петербург, Невский пр., 100",
      hours: "Пн-Вс: 10:00 - 22:00",
      phone: "+7 (812) 456-78-90",
      rating: 4.9,
      services: ["Примерка", "Индивидуальный подход", "Возврат/обмен"]
    },
    {
      id: '5',
      name: "ELEVATE Казань",
      address: "Казань, ул. Баумана, 50",
      hours: "Пн-Вс: 10:00 - 21:00",
      phone: "+7 (843) 567-89-01",
      rating: 4.6,
      services: ["Примерка", "Возврат/обмен"]
    }
  ];

  return NextResponse.json(stores);
}
