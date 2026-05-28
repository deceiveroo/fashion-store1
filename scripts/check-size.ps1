$folders = 'node_modules', '.next', 'public', 'app', 'components', 'lib', 'migrations', 'context', 'hooks'
$total = 0
foreach ($f in $folders) {
  if (Test-Path $f) {
    $size = (Get-ChildItem $f -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
    if ($null -eq $size) { $size = 0 }
    $mb = [math]::Round($size / 1MB, 1)
    Write-Host ("{0,-15} {1,8} MB" -f $f, $mb)
    if ($f -ne 'node_modules' -and $f -ne '.next') { $total += $size }
  }
}
Write-Host ""
$rootFiles = (Get-ChildItem -File -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
if ($null -eq $rootFiles) { $rootFiles = 0 }
$total += $rootFiles
Write-Host ("Root files:     {0,8} MB" -f ([math]::Round($rootFiles / 1MB, 1)))
Write-Host ("Source total:   {0,8} MB (без node_modules и .next)" -f ([math]::Round($total / 1MB, 1)))
