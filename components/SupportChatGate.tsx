'use client';

import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import SupportChatMinimalist from './SupportChatMinimalist';

/** Показывает виджет чата только если модуль «Чат поддержки» включён в /admin/settings. */
export default function SupportChatGate() {
  const { chat } = useFeatureFlags();
  if (!chat) return null;
  return <SupportChatMinimalist />;
}
