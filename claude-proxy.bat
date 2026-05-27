@echo off
echo ========================================
echo Запуск Claude Code с прокси
echo ========================================

set ANTHROPIC_BASE_URL=https://cc.freemodel.dev
set ANTHROPIC_API_KEY=fe_oa_9baa91aec3ba40bb5183c04f0d7a14b5907c2a014105dc9e
set ANTHROPIC_MODEL=claude-sonnet-4-20250514
set CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1
set CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS=1

echo ANTHROPIC_BASE_URL=%ANTHROPIC_BASE_URL%
echo ANTHROPIC_API_KEY=%ANTHROPIC_API_KEY%
echo.

:: Запуск Claude через PowerShell (так как это .ps1 скрипт)
powershell -NoExit -Command "claude --enable-auto-mode"