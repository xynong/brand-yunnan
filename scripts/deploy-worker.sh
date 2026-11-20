#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
echo "1) Check authentication"
npx wrangler whoami
echo "2) Check D1"
npx wrangler d1 info xyong-db
echo "3) Apply D1 migrations to REMOTE"
npx wrangler d1 migrations apply xyong-db --remote
echo "4) Check R2"
npx wrangler r2 bucket list
echo "5) Deploy Worker"
cd worker
npx wrangler deploy
