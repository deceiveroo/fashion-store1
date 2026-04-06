-- Verify chat tables have all required fields
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'support_chat_sessions'
ORDER BY ordinal_position;

SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'support_chat_messages'
ORDER BY ordinal_position;

-- Check if admin takeover fields exist
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'support_chat_sessions' 
      AND column_name = 'ai_disabled'
    ) THEN 'ai_disabled exists ✓'
    ELSE 'ai_disabled MISSING ✗'
  END as ai_disabled_check,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'support_chat_sessions' 
      AND column_name = 'taken_over_by'
    ) THEN 'taken_over_by exists ✓'
    ELSE 'taken_over_by MISSING ✗'
  END as taken_over_by_check,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'support_chat_sessions' 
      AND column_name = 'taken_over_at'
    ) THEN 'taken_over_at exists ✓'
    ELSE 'taken_over_at MISSING ✗'
  END as taken_over_at_check;

-- Check sender enum includes 'admin'
SELECT 
  constraint_name,
  check_clause
FROM information_schema.check_constraints
WHERE constraint_name LIKE '%sender%';
