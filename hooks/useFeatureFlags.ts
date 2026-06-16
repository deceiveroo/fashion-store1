'use client';

import { useEffect, useState } from 'react';

export type FeatureFlags = {
  gamification: boolean;
  reviews: boolean;
  chat: boolean;
};

// Фейл-открыто: пока флаги не загрузились или запрос упал — модули включены.
// Так выключение работает только при явном false из /admin/settings.
const DEFAULTS: FeatureFlags = { gamification: true, reviews: true, chat: true };

/** Публичные фич-флаги модулей сайта (управляются в /admin/settings → «Модули сайта»). */
export function useFeatureFlags(): FeatureFlags {
  const [flags, setFlags] = useState<FeatureFlags>(DEFAULTS);

  useEffect(() => {
    let active = true;
    fetch('/api/feature-flags')
      .then((r) => (r.ok ? r.json() : null))
      .then((f) => {
        if (active && f) setFlags({ ...DEFAULTS, ...f });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  return flags;
}
