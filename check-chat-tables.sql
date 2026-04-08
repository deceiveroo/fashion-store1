-- Проверка таблиц чата поддержки

-- 1. Проверка существования таблиц
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_name IN ('support_chat_sessions', 'support_chat_messages')
ORDER BY table_name;

-- 2. Проверка структуры таблицы support_chat_sessions
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'support_chat_sessions'
ORDER BY ordinal_position;

-- 3. Проверка структуры таблицы support_chat_messages
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'support_chat_messages'
ORDER BY ordinal_position;

-- 4. Проверка индексов
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename IN ('support_chat_sessions', 'support_chat_messages')
ORDER BY tablename, indexname;

-- 5. Статистика по чатам
SELECT 
    status,
    COUNT(*) as count,
    COUNT(CASE WHEN ai_disabled = true THEN 1 END) as taken_over_count,
    AVG(message_count) as avg_messages,
    MAX(last_message_at) as last_activity
FROM support_chat_sessions
GROUP BY status;

-- 6. Последние 10 сессий
SELECT 
    session_id,
    user_name,
    user_email,
    status,
    message_count,
    ai_disabled,
    taken_over_by,
    created_at,
    last_message_at
FROM support_chat_sessions
ORDER BY created_at DESC
LIMIT 10;

-- 7. Последние 20 сообщений
SELECT 
    scm.id,
    scm.session_id,
    scm.sender,
    LEFT(scm.message, 50) as message_preview,
    scm.ai_model,
    scm.created_at,
    scs.user_name
FROM support_chat_messages scm
LEFT JOIN support_chat_sessions scs ON scm.session_id = scs.session_id
ORDER BY scm.created_at DESC
LIMIT 20;

-- 8. Проверка на orphaned messages (сообщения без сессии)
SELECT COUNT(*) as orphaned_messages_count
FROM support_chat_messages scm
LEFT JOIN support_chat_sessions scs ON scm.session_id = scs.session_id
WHERE scs.id IS NULL;

-- 9. Активные чаты (с сообщениями за последние 24 часа)
SELECT 
    scs.session_id,
    scs.user_name,
    scs.status,
    scs.message_count,
    scs.ai_disabled,
    scs.last_message_at,
    COUNT(scm.id) as recent_messages
FROM support_chat_sessions scs
LEFT JOIN support_chat_messages scm ON scs.session_id = scm.session_id 
    AND scm.created_at > NOW() - INTERVAL '24 hours'
WHERE scs.last_message_at > NOW() - INTERVAL '24 hours'
GROUP BY scs.id, scs.session_id, scs.user_name, scs.status, scs.message_count, scs.ai_disabled, scs.last_message_at
ORDER BY scs.last_message_at DESC;

-- 10. Проверка foreign keys
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name IN ('support_chat_sessions', 'support_chat_messages');
