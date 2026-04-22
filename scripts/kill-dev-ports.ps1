# Stops processes listening on common local dev ports (CMS Next + Mongo Memory Server).
param(
    [int[]]$Ports = @(4000, 27017)
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
