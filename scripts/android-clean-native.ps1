# Stops Gradle and removes stale CMake/Skia native build dirs (fixes file-lock / missing libsvg.a).
$ErrorActionPreference = 'Stop'
$Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$CoreAndroid = Join-Path $Root 'apps\core\android'

Write-Host 'Stopping Gradle daemons...'
if (Test-Path (Join-Path $CoreAndroid 'gradlew.bat')) {
  Push-Location $CoreAndroid
  & .\gradlew.bat --stop 2>$null
  Pop-Location
}

$paths = @(
  (Join-Path $Root 'apps\core\android\build'),
  (Join-Path $Root 'apps\core\android\.gradle'),
  (Join-Path $Root 'apps\core\android\app\build'),
  (Join-Path $Root 'node_modules\expo-modules-core\android\.cxx'),
  (Join-Path $Root 'node_modules\expo-modules-core\android\build'),
  (Join-Path $Root 'node_modules\@shopify\react-native-skia\android\build'),
  (Join-Path $Root 'node_modules\react-native-worklets\android\build')
)

foreach ($p in $paths) {
  if (Test-Path $p) {
    Write-Host "Removing $p"
    Remove-Item -Recurse -Force $p
  }
}

Write-Host 'Done. Run: pnpm --filter @deelbaar/core android'
