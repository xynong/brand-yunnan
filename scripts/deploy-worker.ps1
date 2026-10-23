$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")
Write-Host "1) Check authentication"
npx wrangler whoami
Write-Host "2) Check D1"
npx wrangler d1 info xyong-db
Write-Host "3) Apply D1 migrations to REMOTE"
npx wrangler d1 migrations apply xyong-db --remote
Write-Host "4) Check R2"
npx wrangler r2 bucket list
Write-Host "5) Deploy Worker"
Set-Location worker
npx wrangler deploy
