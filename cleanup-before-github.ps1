# Скрипт очистки проекта перед загрузкой на GitHub
# Удаляет все временные файлы, документацию и хлам

Write-Host "🧹 Очистка проекта перед загрузкой на GitHub..." -ForegroundColor Cyan

# Список файлов для удаления
$filesToRemove = @(
    # Временная документация и гайды
    "*.md",
    
    # SQL файлы вне папки migrations
    "*.sql",
    
    # JavaScript утилиты (кроме конфигов)
    "check-*.js",
    "test-*.js",
    "verify-*.js",
    "import-*.js",
    "update-*.js",
    "migrate-*.js",
    "run-*.js",
    "final-*.js",
    "add-*.js",
    "create-*.js",
    "execute-*.js",
    
    # PowerShell тесты
    "test-*.ps1",
    
    # JSON отчеты
    "test-report.json",
    
    # Бэкапы базы данных
    "*backup*.sql",
    "old-backup.sql",
    "data-backup.sql",
    "supabase_backup.sql",
    
    # Текстовые файлы с информацией о базе
    "БАЗА.txt",
    "PROJECT_STRUCTURE.txt",
    "STRUCTURE_BY_FOLDER.txt",
    "STRUCTURE_SUMMARY.txt",
    
    # Build артефакты
    "*.tsbuildinfo"
)

Write-Host "`n📋 Удаление временных файлов..." -ForegroundColor Yellow

foreach ($pattern in $filesToRemove) {
    $files = Get-ChildItem -Path "." -Filter $pattern -File -ErrorAction SilentlyContinue
    foreach ($file in $files) {
        # Не удаляем README.md и файлы из папки migrations
        if ($file.Name -eq "README.md" -or $file.Directory.Name -eq "migrations") {
            continue
        }
        
        Write-Host "  🗑️  $($file.Name)" -ForegroundColor Gray
        Remove-Item $file.FullName -Force -ErrorAction SilentlyContinue
    }
}

# Удаляем конкретные файлы по именам
$specificFiles = @(
    "ACHIEVEMENTS_FIX_INSTRUCTIONS.md",
    "ACHIEVEMENTS_TROUBLESHOOTING.md",
    "ADMIN_AUDIT_CHECKLIST.md",
    "ALL_ISSUES_RESOLVED.md",
    "AUDIT_COMPLETE_FINAL.md",
    "BULLETPROOF_MIGRATION.sql",
    "CHAT_DESIGN_MINIMALIST.md",
    "CHAT_IMPROVEMENTS_ROADMAP.md",
    "CHAT_PERFORMANCE_SETUP.md",
    "CHAT_PHASES_3_4_COMPLETE.md",
    "CHAT_PHASE_4_COMPLETE.md",
    "CHAT_QUICK_REFERENCE.md",
    "CHAT_REBUILD_COMPLETE.md",
    "CHAT_SYSTEM_DOCUMENTATION.md",
    "CHAT_TECHNICAL_IMPROVEMENTS.md",
    "CHAT_USER_GUIDE.md",
    "CLEAN_PRODUCTS_AND_FIX_CHAT.sql",
    "COMPLETE_ADMIN_FIX.md",
    "COMPLETE_AUDIT_AND_FIXES.md",
    "CREATE_ALL_TABLES.sql",
    "CREATE_ALL_TABLES_SAFE.sql",
    "CREATE_USERS_WITH_PASSWORDS.sql",
    "DESIGN_CODE_FOR_AI_REVIEW.md",
    "DROP_AND_RECREATE_ALL.sql",
    "EXECUTE_THIS_NOW.md",
    "FEATURES_IMPLEMENTED.md",
    "FINAL_AUDIT_REPORT.md",
    "FINAL_CHAT_SOLUTION.md",
    "FINAL_CLEANUP_INSTRUCTIONS.md",
    "FINAL_FIXES.md",
    "FINAL_FIX_COMPLETE.md",
    "FINAL_FIX_PLAN.md",
    "FINAL_POOL_OPTIMIZATION.md",
    "FINAL_REPORT_PHASES_3_4.md",
    "FINAL_SAFE_MIGRATION.md",
    "FIXED_SQL_INSTRUCTIONS.md",
    "FIXES_COMPLETE.md",
    "FIXES_REQUIRED.md",
    "FIX_ALL_AND_ADD_TEST_DATA.sql",
    "FIX_ALL_MISSING_COLUMNS.sql",
    "FIX_CHAT_DATABASE.md",
    "FIX_DATABASE_ERRORS.md",
    "FIX_FOREIGN_KEY_AND_TIMEOUT.md",
    "FIX_LOGIN_ISSUE.md",
    "FIX_MISSING_TABLES.md",
    "FIX_NULL_ID_ERROR.md",
    "FIX_ORDERS_TABLE.sql",
    "FIX_REMAINING_ERRORS.md",
    "FIX_RLS_AND_POOL.md",
    "FULL_ACHIEVEMENTS_SYSTEM.md",
    "GAMIFICATION_SETUP_INSTRUCTIONS.md",
    "GAMIFICATION_SYSTEM.md",
    "HEALTH_CHECK_COMPLETE.md",
    "HOLOGRAPHIC_TABS_INTEGRATION.md",
    "HOW_TO_CLEAN_PRODUCTS.md",
    "HOW_TO_RUN_MIGRATION.md",
    "LEVEL_UPDATE_DIAGNOSIS.md",
    "MAINTENANCE_MODE_SETUP.md",
    "MARKETING_SYSTEM_COMPLETE.md",
    "MIGRATION_COMPLETE.md",
    "MIGRATION_INSTRUCTIONS.md",
    "NOTIFICATIONS_SYSTEM_GUIDE.md",
    "OPTIMIZATIONS_COMPLETED.md",
    "PERFORMANCE_OPTIMIZATION.md",
    "PERFORMANCE_OPTIMIZATION_PLAN.md",
    "PROJECT_MAP.md",
    "PROJECT_STRUCTURE_COMPLETE.md",
    "PROJECT_TREE.md",
    "QUICK_START.md",
    "QUICK_START_CHAT.md",
    "QUICK_START_PHASES_3_4.md",
    "REALTIME_MIGRATION_COMPLETE.md",
    "REALTIME_QUICK_START.md",
    "RECOMMENDATIONS_SETUP.md",
    "REVIEWS_SYSTEM_COMPLETE.md",
    "RUN_REVIEWS_MIGRATION.md",
    "RUN_SLA_MIGRATION.md",
    "SET_USER_PASSWORDS.sql",
    "SUPABASE_STORAGE_RLS_SETUP.md",
    "SUPABASE_STORAGE_SETUP.md",
    "URGENT_FIX_DATABASE.md",
    "URGENT_RUN_MIGRATION.md",
    "USE_DROP_AND_RECREATE.md",
    "VERCEL_ENV_SETUP.md",
    "VERCEL_QUICK_UPDATE.md",
    "VERCEL_SUPABASE_SETUP.md",
    "VERCEL_UPDATE_INSTRUCTIONS.md",
    "VIDEO_SUPPORT_IMPLEMENTATION.md",
    "ВИДЕО_БЫСТРЫЙ_СТАРТ.md",
    "ПОСЛЕДНИЙ_ШАНС.sql",
    "next-env.d.ts"
)

Write-Host "`n📋 Удаление конкретных файлов..." -ForegroundColor Yellow

foreach ($fileName in $specificFiles) {
    if (Test-Path $fileName) {
        Write-Host "  🗑️  $fileName" -ForegroundColor Gray
        Remove-Item $fileName -Force -ErrorAction SilentlyContinue
    }
}

# Очищаем папку .next (build artifacts)
if (Test-Path ".next") {
    Write-Host "`n🗑️  Очистка .next директории..." -ForegroundColor Yellow
    Remove-Item ".next" -Recurse -Force -ErrorAction SilentlyContinue
}

# Очищаем папку supabase (local config)
if (Test-Path "supabase") {
    Write-Host "🗑️  Удаление локальной конфигурации Supabase..." -ForegroundColor Yellow
    Remove-Item "supabase" -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host "`n✅ Очистка завершена!" -ForegroundColor Green
Write-Host "`n📝 Следующие шаги:" -ForegroundColor Cyan
Write-Host "  1. Проверьте что не удалилось ничего важного" -ForegroundColor White
Write-Host "  2. Добавьте переменные окружения в Vercel:" -ForegroundColor White
Write-Host "     - UPSTASH_REDIS_REST_URL=<YOUR_UPSTASH_REDIS_REST_URL>" -ForegroundColor Yellow
Write-Host "     - UPSTASH_REDIS_REST_TOKEN=<YOUR_UPSTASH_REDIS_REST_TOKEN>" -ForegroundColor Yellow
Write-Host "  3. Закоммитьте изменения: git add ." -ForegroundColor White
Write-Host "  4. Создайте коммит: git commit -m 'Clean project before GitHub upload'" -ForegroundColor White
Write-Host "  5. Отправьте на GitHub: git push origin main" -ForegroundColor White
Write-Host "`n⚠️  ВАЖНО: Файлы .env.* НЕ должны попадать в Git!" -ForegroundColor Red
