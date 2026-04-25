# Stops processes listening on common local dev ports
# (Expo/Metro, CMS/Next, and supporting local services).
param(
    [int[]]$Ports = @(
        3000,  # Next.js default
        4000,  # CMS/dev API (project default)
        5173,  # Vite default
        8081,  # Metro / Expo
        8082,  # Metro fallback
        19000, # Expo dev tools / legacy
        19001, # Expo LAN
        19002, # Expo tunnel
        27017  # MongoDB / mongodb-memory-server
    )
)

$ErrorActionPreference = 'SilentlyContinue'
$stopped = @{}

foreach ($port in $Ports) {
    $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    foreach ($c in $conns) {
        $procId = $c.OwningProcess
        if (-not $procId -or $stopped.ContainsKey($procId)) { continue }
        $stopped[$procId] = $true
        $p = Get-Process -Id $procId -ErrorAction SilentlyContinue
        $name = if ($p) { $p.ProcessName } else { '?' }
        Write-Host "Stopping PID $procId ($name) on port $port"
        Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
    }
}

if ($stopped.Count -eq 0) {
    $list = $Ports -join ', '
    Write-Host "No LISTEN processes on ports: $list."
}
