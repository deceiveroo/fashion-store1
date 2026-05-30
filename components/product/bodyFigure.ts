/**
 * Параметрический построитель женского/мужского силуэта (fashion-croquis).
 * Чистая геометрия: на вход — пол/рост/вес/телосложение, на выход — набор
 * SVG-путей (торс, ноги, руки) + голова/шея. Фигура цельная и связная
 * (ноги растут из бёдер торса, руки — из плеч), поэтому читается как один
 * силуэт, а не «из сосисок». Все формы заливаются одним градиентом бренда.
 *
 * Эту же функцию использует скрипт визуальной проверки (рендер в PNG),
 * поэтому здесь только числа и строки — никакого JSX/DOM.
 */

export type Gender = 'female' | 'male';
export type BodyType = 'slim' | 'normal' | 'athletic' | 'heavy';

export interface FigureParams {
  gender: Gender;
  height: number; // см 140..210
  weight: number; // кг
  bodyType: BodyType;
}

export interface FigureGeometry {
  torso: string;
  legL: string;
  legR: string;
  armL: string;
  armR: string;
  head: { cx: number; cy: number; rx: number; ry: number };
  scaleY: number; // вертикальный масштаб группы (рост)
  groupTransform: string; // готовый transform: масштаб роста вокруг центра фигуры
}

// Холст. Запас сверху/снизу, чтобы фигура не упиралась в края при масштабе роста.
export const VB_W = 200;
export const VB_H = 440;
const CX = 100;

// Вертикальные ориентиры (до масштабирования ростом).
const Y = {
  neckTop: 72,
  neckBot: 88,
  shoulder: 96,
  chest: 128,
  waist: 188,
  hip: 232,
  crotch: 246,
  knee: 322,
  ankle: 408,
};

// Базовые полуширины торса/рук/головы по полу.
const BASE: Record<Gender, {
  neck: number; shoulder: number; chest: number; waist: number; hip: number;
  arm: number; wrist: number; headRX: number; headRY: number;
}> = {
  female: {
    neck: 8, shoulder: 36, chest: 32, waist: 24, hip: 44,
    arm: 9, wrist: 5.2, headRX: 17.5, headRY: 22.5,
  },
  male: {
    neck: 11, shoulder: 50, chest: 44, waist: 36, hip: 36,
    arm: 12.5, wrist: 7.2, headRX: 19.5, headRY: 24,
  },
};

// Параметры ног отдельно — здесь решается «мужественность» силуэта:
// стойка (расстояние между ногами), толщина бедра/икры, размер стопы.
// female — слиняя, ноги сводятся к центру; male — толще, шире расставлены,
// крупная стопа, почти параллельные голени.
const LEG: Record<Gender, {
  hipCenter: number; ankCenter: number;
  thighHW: number; kneeHW: number; calfHW: number; ankleHW: number; footLen: number;
}> = {
  female: { hipCenter: 21, ankCenter: 12.5, thighHW: 12, kneeHW: 6.4, calfHW: 8, ankleHW: 4.4, footLen: 13 },
  male:   { hipCenter: 19, ankCenter: 16.5, thighHW: 15, kneeHW: 9, calfHW: 11, ankleHW: 6.2, footLen: 18 },
};

const BODY_MOD: Record<BodyType, { girth: number; shoulder: number }> = {
  slim: { girth: 0.86, shoulder: 0.96 },
  normal: { girth: 1.0, shoulder: 1.0 },
  athletic: { girth: 1.04, shoulder: 1.16 },
  heavy: { girth: 1.26, shoulder: 1.05 },
};

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const r1 = (n: number) => Math.round(n * 10) / 10;

export function buildFigure({ gender, height, weight, bodyType }: FigureParams): FigureGeometry {
  const b = BASE[gender];
  const mod = BODY_MOD[bodyType];

  // Обхват от ИМТ.
  const hM = clamp(height, 140, 210) / 100;
  const bmi = clamp(weight / (hM * hM), 15, 36);
  const girthBmi = 0.82 + ((bmi - 15) / 21) * 0.5; // 0.82..1.32
  const g = girthBmi * mod.girth;

  // Плечи растут слабее обхвата (костяк), но реагируют на телосложение.
  const sMod = mod.shoulder * (0.92 + g * 0.08);

  const sh = b.shoulder * sMod;
  const ch = b.chest * (0.9 + g * 0.1) * (mod.shoulder * 0.5 + 0.5);
  const wa = b.waist * g;
  const hp = b.hip * (0.9 + g * 0.1);
  const arm = b.arm * (0.92 + g * 0.08);
  const wr = b.wrist * (0.95 + g * 0.05);
  const nk = b.neck;

  // Рост → вертикальный масштаб 0.90..1.00. Потолок = 1.0, пивот ровно на
  // линии стоп (натуральный низ фигуры ≈ 417): стопы зафиксированы для любого
  // роста, вверх двигается только макушка — клиппинг кадра невозможен.
  const scaleY = 0.90 + ((clamp(height, 140, 210) - 140) / 70) * 0.10;
  const FEET_Y = 417;
  const groupTransform = `translate(0 ${r1(FEET_Y * (1 - scaleY))}) scale(1 ${r1(scaleY)})`;

  const L = CX, c = (n: number) => r1(n);

  // ── Торс: плечи → грудь → талия → бёдра → промежность (песочные часы) ──
  const torso = [
    `M ${c(L - sh)} ${Y.shoulder}`,
    `C ${c(L - ch)} ${Y.chest} ${c(L - wa - 3)} ${Y.waist - 16} ${c(L - wa)} ${Y.waist}`,
    `C ${c(L - wa + 1)} ${Y.waist + 22} ${c(L - hp)} ${Y.hip - 24} ${c(L - hp)} ${Y.hip}`,
    `C ${c(L - hp)} ${Y.hip + 9} ${c(L - hp + 8)} ${Y.crotch} ${c(L - 3)} ${Y.crotch}`,
    `L ${c(L + 3)} ${Y.crotch}`,
    `C ${c(L + hp - 8)} ${Y.crotch} ${c(L + hp)} ${Y.hip + 9} ${c(L + hp)} ${Y.hip}`,
    `C ${c(L + hp)} ${Y.hip - 24} ${c(L + wa - 1)} ${Y.waist + 22} ${c(L + wa)} ${Y.waist}`,
    `C ${c(L + wa + 3)} ${Y.waist - 16} ${c(L + ch)} ${Y.chest} ${c(L + sh)} ${Y.shoulder}`,
    `C ${c(L + sh * 0.5)} ${Y.shoulder - 8} ${c(L + nk + 3)} ${Y.neckBot - 1} ${c(L + nk)} ${Y.neckBot}`,
    `L ${c(L - nk)} ${Y.neckBot}`,
    `C ${c(L - nk - 3)} ${Y.neckBot - 1} ${c(L - sh * 0.5)} ${Y.shoulder - 8} ${c(L - sh)} ${Y.shoulder}`,
    'Z',
  ].join(' ');

  // ── Ноги: модель «осевая линия + полуширина», сильная разница по полу ──
  // Каждая нога имеет центр на уровне бедра (cHip) и лодыжки (cAnk); ширина
  // тейперится бедро→колено→икра→лодыжка. Стопа смотрит слегка наружу.
  const lp = LEG[gender];
  const gW = 0.9 + g * 0.18; // ширина ног от обхвата
  const tHW = lp.thighHW * gW;
  const kHW = lp.kneeHW * (0.94 + g * 0.08);
  const cHW = lp.calfHW * gW;
  const aHW = lp.ankleHW * (0.96 + g * 0.05);

  const leg = (s: number) => {
    const cHip = L + s * (lp.hipCenter * (0.96 + g * 0.06));
    const cAnk = L + s * (lp.ankCenter * (0.92 + g * 0.10));
    const cKnee = L + s * ((lp.ankCenter + (lp.hipCenter - lp.ankCenter) * 0.5) * (0.95 + g * 0.07));
    const toe = cAnk + s * (lp.footLen * (0.95 + g * 0.05));

    const yThigh = Y.hip + 34;
    const yCalf = Y.knee + 30;
    const yFoot = Y.ankle + 8;

    return [
      `M ${c(cHip + s * tHW)} ${Y.hip}`,
      `C ${c(cHip + s * tHW)} ${yThigh} ${c(cKnee + s * (kHW + 2))} ${Y.knee - 26} ${c(cKnee + s * kHW)} ${Y.knee}`,
      `C ${c(cKnee + s * cHW)} ${yCalf} ${c(cAnk + s * (aHW + 1))} ${Y.ankle - 16} ${c(cAnk + s * aHW)} ${Y.ankle}`,
      `C ${c(cAnk + s * aHW)} ${yFoot - 2} ${c(toe)} ${yFoot} ${c(toe)} ${yFoot}`,
      `L ${c(cAnk - s * aHW * 0.6)} ${yFoot}`,
      `L ${c(cAnk - s * aHW)} ${Y.ankle}`,
      `C ${c(cAnk - s * aHW)} ${yCalf} ${c(cKnee - s * kHW)} ${Y.knee + 18} ${c(cKnee - s * kHW)} ${Y.knee}`,
      `C ${c(cKnee - s * kHW)} ${Y.knee - 28} ${c(cHip - s * tHW * 0.4)} ${Y.crotch + 16} ${c(L + s * 1.5)} ${Y.crotch + 3}`,
      'Z',
    ].join(' ');
  };

  // ── Руки (свисают вдоль торса, тейпер плечо→запястье) ──
  const armPath = (s: number) => {
    const top = L + s * (sh - 3);
    const elbow = L + s * (sh + 4);
    const wrX = L + s * (sh - 2);
    return [
      `M ${c(top)} ${Y.shoulder + 3}`,
      `C ${c(top + s * (arm + 2))} ${Y.chest} ${c(elbow)} ${Y.waist - 10} ${c(elbow - s * 1)} ${Y.waist + 14}`,
      `C ${c(elbow - s * 1)} ${Y.waist + 26} ${c(wrX + s * wr)} ${Y.waist + 26} ${c(wrX)} ${Y.waist + 14}`,
      `C ${c(wrX)} ${Y.waist - 12} ${c(top - s * (arm - 4))} ${Y.chest + 6} ${c(top - s * 4)} ${Y.shoulder + 6}`,
      'Z',
    ].join(' ');
  };

  return {
    torso,
    legL: leg(-1),
    legR: leg(1),
    armL: armPath(-1),
    armR: armPath(1),
    head: { cx: CX, cy: 50, rx: r1(b.headRX), ry: r1(b.headRY) },
    scaleY: r1(scaleY),
    groupTransform,
  };
}
