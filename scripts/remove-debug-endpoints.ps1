# Script to remove debug API endpoints before production deployment
# Run this script: .\scripts\remove-debug-endpoints.ps1

Write-Host "🔍 Removing debug API endpoints..." -ForegroundColor Cyan

$debugEndpoints = @(
    "app\api\debug",
    "app\api\debug-auth",
    "app\api\debug-db",
    "app\api\debug-error",
    "app\api\debug-products",
    "app\api\debug-token",
    "app\api\debug-update",
    "app\api\db-test",
    "app\api\test",
    "app\api\test-simple"
)

$removed = 0
$notFound = 0

foreach ($endpoint in $debugEndpoints) {
    $path = Join-Path $PSScriptRoot "..\$endpoint"
    
    if (Test-Path $path) {
        Write-Host "  ❌ Removing: $endpoint" -ForegroundColor Yellow
        Remove-Item -Path $path -Recurse -Force
        $removed++
    } else {
        Write-Host "  ✓ Already removed: $endpoint" -ForegroundColor Gray
        $notFound++
    }
}

Write-Host ""
Write-Host "✅ Debug endpoints cleanup complete!" -ForegroundColor Green
Write-Host "   Removed: $removed" -ForegroundColor White
Write-Host "   Not found: $notFound" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  IMPORTANT: Commit these changes before deploying to production!" -ForegroundColor Yellow
Write-Host ""

