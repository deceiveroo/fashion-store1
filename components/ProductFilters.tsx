// components/ProductFilters.tsx
'use client';

export default function ProductFilters({ onFilterChange }) {
  const [filters, setFilters] = useState({
    category: '',
    gender: '',
    collection: '',
    priceRange: [0, 100000]
  });

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="font-semibold mb-4">Фильтры</h3>
      
      <div className="space-y-4">
        {/* Фильтр по категориям */}
        <div>
          <label className="block text-sm font-medium mb-2">Категория</label>
          <select 
            value={filters.category}
            onChange={(e) => setFilters({...filters, category: e.target.value})}
            className="w-full p-2 border rounded"
          >
            <option value="">Все категории</option>
            <option value="new">Новинки</option>
            <option value="male">Мужское</option>
            <option value="female">Женское</option>
            <option value="collection">Коллекции</option>
          </select>
        </div>

        {/* Фильтр по цене */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Цена: до {filters.priceRange[1]} ₽
          </label>
          <input 
            type="range" 
            min="0" 
            max="100000"
            value={filters.priceRange[1]}
            onChange={(e) => setFilters({...filters, priceRange: [0, parseInt(e.target.value)]})}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}