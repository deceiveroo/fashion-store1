-- Per-message идентичность оператора в чате поддержки.
-- Зачем: чтобы старые сообщения сохраняли имя/аватар ТОГО оператора, кто их написал,
-- даже после передачи чата другому (иначе показывается текущий оператор сессии).
--
-- Безопасно: только добавление nullable-колонок (IF NOT EXISTS). Запускать один раз
-- в Supabase → SQL Editor. Код устойчив и БЕЗ этой миграции (пишет без sender_*),
-- но для идеальной истории атрибуции миграцию нужно применить.

ALTER TABLE public.support_chat_messages ADD COLUMN IF NOT EXISTS sender_id text;
ALTER TABLE public.support_chat_messages ADD COLUMN IF NOT EXISTS sender_name text;
ALTER TABLE public.support_chat_messages ADD COLUMN IF NOT EXISTS sender_avatar text;
