# XYONG Cloudflare verification checklist

## What your screenshots prove

- D1 database `xyong-db` exists.
- It currently shows **0 tables**, so the database has NOT yet been initialized with the V2.1 schema.
- R2 bucket `xyong-media` exists.
- It currently shows **0 objects / 0 B**. That is normal for a new bucket; it does NOT prove that the Worker is bound to it.

## After GitHub upload

From the `worker` directory:

```bash
npx wrangler whoami
npx wrangler d1 info xyong-db
npx wrangler d1 migrations apply xyong-db --remote
npx wrangler d1 execute xyong-db --remote --command="SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
npx wrangler r2 bucket list
npx wrangler deploy
```

Expected D1 result includes:

`brands`, `products`, `lots`, `inventory`, `orders`, `order_items`, `customers`, `leads`,
`lead_events`, `campaigns`, `content_items`, `agent_tasks`, `acquisition_events`.

Do not run a destructive `DROP TABLE` command on the production database.
