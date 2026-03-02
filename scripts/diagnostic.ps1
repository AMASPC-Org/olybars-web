# OlyBars Diagnostic Script

Write-Host "Starting Diagnostic Checks..." -ForegroundColor Cyan

# 1. Check Port 3000
$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($port3000) {
    Write-Host "[FAIL] Port 3000 is occupied by PID $($port3000.OwningProcess)" -ForegroundColor Red
} else {
    Write-Host "[PASS] Port 3000 is free" -ForegroundColor Green
}

# 2. Check Dependencies
if (Test-Path "node_modules") {
    Write-Host "[PASS] node_modules found" -ForegroundColor Green
} else {
    Write-Host "[FAIL] node_modules MISSING" -ForegroundColor Red
}

# 3. Check Environment Variables
if (Test-Path ".env") {
    Write-Host "[PASS] .env file found" -ForegroundColor Green
} else {
    Write-Host "[FAIL] .env file MISSING" -ForegroundColor Red
}

write-host "Diagnostic Complete."
