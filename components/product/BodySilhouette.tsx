'use client';

/**
 * 2D-силуэт тела (fashion-croquis) вместо процедурного 3D-манекена.
 * Цельная связная фигура заливается фирменным градиентом purple→pink и
 * плавно меняет пропорции под рост/вес/телосложение/пол. Без Three.js,
 * без сети, без uncanny-эффекта «из сосисок». Геометрия — в bodyFigure.ts
 * (та же функция, что проверяется скриптом на отсутствие клиппинга кадра).
 */

import { useId } from 'react';
import { motion } from 'framer-motion';
import {
  buildFigure,
  VB_W,
  VB_H,
  type Gender,
  type BodyType,
} from './bodyFigure';

interface BodySilhouetteProps {
  gender: Gender;
  height: number;
  weight: number;
  bodyType: BodyType;
}

const SPRING = { type: 'spring' as const, stiffness: 120, damping: 20, mass: 0.6 };

export default function BodySilhouette({ gender, height, weight, bodyType }: BodySilhouetteProps) {
  const f = buildFigure({ gender, height, weight, bodyType });
  const uid = useId().replace(/:/g, '');
  const gradId = `bodyGrad-${uid}`;
  const glowId = `bodyGlow-${uid}`;
  const headY = f.head.cy;
  // groupTransform = translate(0 TY) scale(1 SY) вокруг origin 0,0.
  // Разбираем в отдельные motion-значения, чтобы framer плавно интерполировал.
  const tm = f.groupTransform.match(/translate\(0 (-?\d+\.?\d*)\) scale\(1 (-?\d+\.?\d*)\)/);
  const groupY = tm ? Number(tm[1]) : 0;
  const groupScaleY = tm ? Number(tm[2]) : 1;

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      className="h-full w-full"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Силуэт фигуры по вашим параметрам"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="45%" stopColor="#9333ea" />
          <stop offset="100%" stopColor="#db2777" />
        </linearGradient>
        <radialGradient id={glowId} cx="50%" cy="42%" r="60%">
          <stop offset="0%" stopColor="#c084fc" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#c084fc" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Мягкое свечение за фигурой */}
      <rect x="0" y="0" width={VB_W} height={VB_H} fill={`url(#${glowId})`} />

      {/* Тень-подставка */}
      <ellipse cx={VB_W / 2} cy={420} rx={48} ry={9} fill="#7c3aed" opacity={0.18} />

      <motion.g
        animate={{ y: groupY, scaleY: groupScaleY }}
        transition={SPRING}
        style={{ transformBox: 'view-box', transformOrigin: '0px 0px' } as React.CSSProperties}
        fill={`url(#${gradId})`}
      >
        {/* Голова + шея */}
        <motion.ellipse
          animate={{ cx: f.head.cx, cy: f.head.cy, rx: f.head.rx, ry: f.head.ry }}
          transition={SPRING}
        />
        <motion.rect
          animate={{ x: f.head.cx - f.head.rx * 0.36, y: headY + f.head.ry - 4, width: f.head.rx * 0.72, height: 18 }}
          transition={SPRING}
        />

        {/* Руки — чуть темнее, уходят за торс по глубине */}
        <motion.path animate={{ d: f.armL }} transition={SPRING} fillOpacity={0.82} />
        <motion.path animate={{ d: f.armR }} transition={SPRING} fillOpacity={0.82} />

        {/* Ноги */}
        <motion.path animate={{ d: f.legL }} transition={SPRING} />
        <motion.path animate={{ d: f.legR }} transition={SPRING} />

        {/* Торс — поверх рук/ног, чтобы стыки были скрыты */}
        <motion.path animate={{ d: f.torso }} transition={SPRING} />

        {/* Тонкий световой блик по центру торса */}
        <motion.path
          animate={{ d: f.torso }}
          transition={SPRING}
          fill="#ffffff"
          fillOpacity={0.07}
          style={{ mixBlendMode: 'overlay' } as React.CSSProperties}
        />
      </motion.g>
    </svg>
  );
}
