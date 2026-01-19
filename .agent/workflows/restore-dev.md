---
description: Safely restore the dev environment when localhost is broken or ports are locked.
---

# Restore Dev Environment

Use this workflow when `EADDRINUSE: 3000` occurs or when the local database connection is lost.

## 1. Safety First Kill
Instead of blinding killing `node.exe`, we target the process holding our ports.

```powershell
# Find and kill the process holding port 3000
$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($port3000) {
    Write-Host "Killing process on Port 3000: $($port3000.OwningProcess)"
    Stop-Process -Id $port3000.OwningProcess -Force
} else {
    Write-Host "Port 3000 is clean."
}

# Find and kill the process holding port 8080 (Common for Emulators)
$port8080 = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue
if ($port8080) {
    Write-Host "Killing process on Port 8080: $($port8080.OwningProcess)"
    Stop-Process -Id $port8080.OwningProcess -Force
}
```

## 2. Verify Emulators
If the Firestore Emulator is stuck, we may need to kill Java processes (rare, but possible).

```powershell
# Optional: Only run if emulators are definitely stuck
# Stop-Process -Name "java" -Force -ErrorAction SilentlyContinue
```

## 3. Restart Services
// turbo
1. Run `npm run dev` to restart the main development server.
