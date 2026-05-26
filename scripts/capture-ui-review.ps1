# Captures Android emulator screen for agent visual review.
# Writes full PNG + downscaled review PNG the agent can read in the same turn.
param(
  [Parameter(Mandatory = $true)]
  [string]$Name,
  [int]$ReviewWidth = 480
)

$ErrorActionPreference = 'Stop'
$Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$DesignDir = Join-Path $Root 'docs\design'
if (-not (Test-Path $DesignDir)) {
  New-Item -ItemType Directory -Path $DesignDir | Out-Null
}

$fullPath = Join-Path $DesignDir "verify-$Name.png"
$reviewPath = Join-Path $DesignDir "review-$Name.png"

$deviceList = adb devices 2>&1 | Out-String
if ($deviceList -notmatch 'device\s*$' -or $deviceList -match 'emulator-\d+\s+offline') {
  if ((adb devices | Select-String 'device$').Count -eq 0) {
    throw 'No Android device/emulator attached. Start the emulator and run pnpm run dev:core first.'
  }
}

Write-Host "Capturing $fullPath ..."
cmd.exe /c "adb exec-out screencap -p > `"$fullPath`""
if (-not (Test-Path $fullPath) -or (Get-Item $fullPath).Length -lt 1000) {
  throw 'adb screencap returned empty or invalid data.'
}

Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile($fullPath)
try {
  $scale = $ReviewWidth / [double]$img.Width
  $newWidth = $ReviewWidth
  $newHeight = [Math]::Max(1, [int][Math]::Round($img.Height * $scale))
  $bmp = New-Object System.Drawing.Bitmap $newWidth, $newHeight
  $graphics = [System.Drawing.Graphics]::FromImage($bmp)
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.DrawImage($img, 0, 0, $newWidth, $newHeight)
  $graphics.Dispose()
  $bmp.Save($reviewPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
}
finally {
  $img.Dispose()
}

Write-Host "Review image: $reviewPath"
Write-Host "Full capture: $fullPath"
