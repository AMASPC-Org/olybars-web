---
description: Safely restore the dev environment when localhost is broken or ports are locked.
---

# Restore Dev Environment

Use this workflow when `EADDRINUSE: 3000` occurs or when the local database connection is lost.

## 1. Automated Safety Kill

Run the self-heal diagnostic to clear stuck processes:

```powershell
.\scripts\self-heal.ps1
```

## 2. Port Cleansing (Manual Fallback)

If port 3000 is still locked after self-heal:

```powershell
$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($port3000) { Stop-Process -Id $port3000.OwningProcess -Force }
```

## 3. Cache & Build Recovery

Clear poisoned caches that might cause runtime failures:

```powershell
rm -r .vite, dist, server/dist -ErrorAction SilentlyContinue
```

## 4. Service Recovery

Restart services in the current terminal context to ensure logs are visible for verification:

1. **Backend**: `npm run server`
2. **Frontend**: `npm run dev`
