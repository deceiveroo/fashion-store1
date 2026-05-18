export type EcoLevel = 'good' | 'neutral' | 'attention';

export type EcoMetrics = {
  level: EcoLevel;
  carbonKg: number;
  ethicalScore: number;
  materials: string[];
};

function hashProductId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/** Deterministic eco preview until DB fields exist */
export function getEcoMetrics(productId: string, description = ''): EcoMetrics {
  const h = hashProductId(productId);
  const carbonKg = Number(((h % 80) / 10 + 1.2).toFixed(1));
  const ethicalScore = 55 + (h % 45);
  const level: EcoLevel =
    ethicalScore >= 80 ? 'good' : ethicalScore >= 65 ? 'neutral' : 'attention';

  const materials =
    description.length > 20
      ? ['Основная ткань', 'Подкладка', 'Фурнитура']
      : ['Хлопок 68%', 'Лён 22%', 'Эластан 10%'];

  return { level, carbonKg, ethicalScore, materials };
}

export const ecoLevelColors: Record<EcoLevel, string> = {
  good: '#22c55e',
  neutral: '#eab308',
  attention: '#f97316',
};
