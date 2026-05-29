'use client';

/**
 * Процедурный 3D-манекен на React Three Fiber.
 * Геометрия строится в коде (ничего не скачивается): торс — тело вращения
 * (LatheGeometry) с профилем под пол, конечности/шея — капсулы, голова — сфера.
 * Освещение ручное (без HDR из сети). Морфится под рост/вес/телосложение/пол
 * с плавной интерполяцией в useFrame.
 */

import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

export type Gender = 'female' | 'male';
export type BodyType = 'slim' | 'normal' | 'athletic' | 'heavy';

interface Mannequin3DProps {
  gender: Gender;
  height: number; // см (140–210)
  weight: number; // кг
  bodyType: BodyType;
}

// Профиль торса (x = радиус, y = высота в условных единицах), снизу вверх.
// Вращением вокруг оси Y получаем гладкий торс с грудью/талией/бёдрами.
const TORSO_PROFILE: Record<Gender, [number, number][]> = {
  female: [
    [0.02, 0.88], [0.17, 0.92], [0.155, 1.02], [0.11, 1.12],
    [0.145, 1.22], [0.15, 1.30], [0.12, 1.40], [0.085, 1.47], [0.05, 1.52],
  ],
  male: [
    [0.02, 0.88], [0.145, 0.92], [0.145, 1.02], [0.142, 1.12],
    [0.172, 1.22], [0.178, 1.32], [0.15, 1.42], [0.115, 1.47], [0.06, 1.52],
  ],
};

const GENDER_PARAMS: Record<Gender, {
  shoulderW: number; hipHalf: number; legR: number; armR: number; headR: number;
}> = {
  female: { shoulderW: 0.30, hipHalf: 0.115, legR: 0.072, armR: 0.05, headR: 0.125 },
  male: { shoulderW: 0.42, hipHalf: 0.10, legR: 0.086, armR: 0.066, headR: 0.135 },
};

const BODYTYPE_MODS: Record<BodyType, { girth: number; shoulder: number }> = {
  slim: { girth: 0.88, shoulder: 0.96 },
  normal: { girth: 1.0, shoulder: 1.0 },
  athletic: { girth: 1.02, shoulder: 1.14 },
  heavy: { girth: 1.22, shoulder: 1.04 },
};

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function Figure({ gender, height, weight, bodyType }: Mannequin3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const torsoRef = useRef<THREE.Mesh>(null);
  const shoulderRef = useRef<THREE.Mesh>(null);
  const armLRef = useRef<THREE.Mesh>(null);
  const armRRef = useRef<THREE.Mesh>(null);
  const legLRef = useRef<THREE.Mesh>(null);
  const legRRef = useRef<THREE.Mesh>(null);

  // Плавно интерполируемые драйверы.
  const hgt = useRef(1);
  const gir = useRef(1);

  const p = GENDER_PARAMS[gender];

  // Профиль торса как массив Vector2 (пересоздаём только при смене пола).
  const torsoPoints = useMemo(
    () => TORSO_PROFILE[gender].map(([x, y]) => new THREE.Vector2(x, y)),
    [gender]
  );

  // Целевые значения морфинга.
  const heightFactor = 0.9 + ((Math.max(140, Math.min(210, height)) - 140) / 70) * 0.22;
  const heightM = height / 100;
  const bmi = weight / (heightM * heightM);
  const bmiClamped = Math.max(15, Math.min(35, bmi));
  const girthBmi = 0.8 + ((bmiClamped - 15) / 20) * 0.5;
  const girth = girthBmi * BODYTYPE_MODS[bodyType].girth;
  const shoulderMod = BODYTYPE_MODS[bodyType].shoulder;

  useFrame(() => {
    hgt.current = lerp(hgt.current, heightFactor, 0.14);
    gir.current = lerp(gir.current, girth, 0.14);
    const g = gir.current;

    if (groupRef.current) groupRef.current.scale.y = hgt.current;
    if (torsoRef.current) torsoRef.current.scale.set(g, 1, g * 0.7);
    if (shoulderRef.current) shoulderRef.current.scale.x = shoulderMod * (0.9 + g * 0.1);
    [armLRef, armRRef, legLRef, legRRef].forEach((r) => {
      if (r.current) r.current.scale.set(g, 1, g);
    });
  });

  // Производные размеры конечностей.
  const legCenterY = (0.06 + 0.92) / 2;
  const legLen = Math.max(0.05, 0.92 - 0.06 - 2 * p.legR);
  const armCenterY = 1.2;
  const armLen = Math.max(0.05, 0.5 - 2 * p.armR);
  const armX = p.shoulderW / 2 + p.armR * 0.4;

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Голова */}
      <mesh position={[0, 1.66, 0]} castShadow>
        <sphereGeometry args={[p.headR, 32, 32]} />
        <meshStandardMaterial color="#cdbfb0" roughness={0.72} metalness={0.08} />
      </mesh>

      {/* Шея */}
      <mesh position={[0, 1.55, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.052, 0.12, 24]} />
        <meshStandardMaterial color="#cdbfb0" roughness={0.72} metalness={0.08} />
      </mesh>

      {/* Плечи (поперечная капсула) */}
      <mesh ref={shoulderRef} position={[0, 1.47, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <capsuleGeometry args={[0.055, p.shoulderW, 8, 16]} />
        <meshStandardMaterial color="#cdbfb0" roughness={0.72} metalness={0.08} />
      </mesh>

      {/* Торс — тело вращения */}
      <mesh ref={torsoRef} castShadow>
        <latheGeometry args={[torsoPoints, 48]} />
        <meshStandardMaterial color="#cdbfb0" roughness={0.72} metalness={0.08} side={THREE.DoubleSide} />
      </mesh>

      {/* Руки */}
      <mesh ref={armLRef} position={[-armX, armCenterY, 0]} castShadow>
        <capsuleGeometry args={[p.armR, armLen, 8, 16]} />
        <meshStandardMaterial color="#cdbfb0" roughness={0.72} metalness={0.08} />
      </mesh>
      <mesh ref={armRRef} position={[armX, armCenterY, 0]} castShadow>
        <capsuleGeometry args={[p.armR, armLen, 8, 16]} />
        <meshStandardMaterial color="#cdbfb0" roughness={0.72} metalness={0.08} />
      </mesh>

      {/* Ноги */}
      <mesh ref={legLRef} position={[-p.hipHalf, legCenterY, 0]} castShadow>
        <capsuleGeometry args={[p.legR, legLen, 8, 16]} />
        <meshStandardMaterial color="#cdbfb0" roughness={0.72} metalness={0.08} />
      </mesh>
      <mesh ref={legRRef} position={[p.hipHalf, legCenterY, 0]} castShadow>
        <capsuleGeometry args={[p.legR, legLen, 8, 16]} />
        <meshStandardMaterial color="#cdbfb0" roughness={0.72} metalness={0.08} />
      </mesh>
    </group>
  );
}

export default function Mannequin3D(props: Mannequin3DProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 1.0, 3.25], fov: 32 }}
      gl={{ antialias: true, alpha: true }}
      style={{ width: '100%', height: '100%' }}
    >
      {/* Освещение — полностью локальное, без HDR из сети */}
      <hemisphereLight args={['#ffffff', '#b8a9c9', 0.55]} />
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[3, 5, 4]}
        intensity={1.6}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      {/* Фиолетовый контровой свет под бренд */}
      <directionalLight position={[-4, 2.5, -3]} intensity={0.7} color="#a855f7" />
      <directionalLight position={[0, 1, -4]} intensity={0.4} color="#ec4899" />

      <Figure {...props} />

      <ContactShadows
        position={[0, 0.02, 0]}
        opacity={0.45}
        scale={3}
        blur={2.6}
        far={2.2}
        color="#3b0764"
      />

      <OrbitControls
        target={[0, 0.95, 0]}
        enablePan={false}
        enableZoom={false}
        autoRotate
        autoRotateSpeed={1.4}
        minPolarAngle={Math.PI / 2.6}
        maxPolarAngle={Math.PI / 1.9}
      />
    </Canvas>
  );
}
