# XYONG BRAND · 云南精品园 — Production deployment

This repository deploys three separate services:

- Storefront: `https://xyong.ccwu.cc`
- Private Operations Center: `https://ops.xyong.ccwu.cc`
- Worker API: `https://apixyong.ccwu.cc`

Use `apixyong.ccwu.cc` consistently. Do not use the old `api.xyong.ccwu.cc` hostname in Cloudflare or Pages settings.

## 1. Verify and initialize D1

From the repository root, authenticate to the intended Cloudflare account and inspect the database before applying the checked-in migration:

```bash
npx wrangler whoami
npx wrangler d1 info xyong-db
npx wrangler d1 migrations apply xyong-db --remote
npx wrangler d1 execute xyong-db --remote --command="SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
```

Confirm expected tables including `brands`, `products`, `inventory`, `orders`, `leads`, `campaigns`, `content_items`, `agent_tasks`, and `acquisition_events`. The initial migration inserts the four category brands. Never drop production tables as a troubleshooting shortcut.

## 2. Configure and deploy the Worker

Review `worker/wrangler.toml` against the Cloudflare account: D1 database `xyong-db`, its database ID, R2 bucket `xyong-media`, and allowed browser origins `https://xyong.ccwu.cc` and `https://ops.xyong.ccwu.cc`.

From `worker/`:

```bash
npx wrangler whoami
npx wrangler r2 bucket list
npx wrangler secret put ADMIN_TOKEN
npx wrangler deploy
```

Use a unique, high-entropy token. Keep it only as a Worker secret. Add `apixyong.ccwu.cc` as this Worker’s custom domain and verify DNS/TLS in Cloudflare. Protect `ops.xyong.ccwu.cc` with Cloudflare Access as an additional layer.

Check the public endpoints:

```bash
curl -fsS https://apixyong.ccwu.cc/api/health
curl -fsS https://apixyong.ccwu.cc/api/store/products
```

Health should return `ok: true`; products should return a JSON `products` array (possibly empty before products are added).

## 3. Deploy the Storefront Pages project

Create a Cloudflare Pages project from this repository:

- Root directory: `apps/storefront`
- Build command: `npm run build`
- Build output directory: `dist`
- Environment variable: `VITE_API_BASE_URL=https://apixyong.ccwu.cc`
- Custom domain: `xyong.ccwu.cc`

Set the variable for Production (and Preview if desired) and redeploy: Vite embeds it at build time. The source fallback uses the same API host.

## 4. Deploy the Operations Pages project

Create a separate Pages project:

- Root directory: `apps/ops`
- Build command: `npm run build`
- Build output directory: `dist`
- Environment variable: `VITE_API_BASE_URL=https://apixyong.ccwu.cc`
- Custom domain: `ops.xyong.ccwu.cc`

Enable Cloudflare Access for the Ops hostname and permit only your identity. Enter `ADMIN_TOKEN` on the Ops sign-in page; it is saved in browser local storage. Never set the token as a Pages variable or expose it in browser bundles.

## 5. Production acceptance checks

1. Open `https://xyong.ccwu.cc`; verify the page shows **XYONG BRAND · 云南精品园** and loads products or the empty-state message.
2. In Ops, add real product details and inventory; reload the Storefront and verify name, price, image and stock.
3. Test Add to cart and attribution; inspect browser developer tools to ensure API requests use `https://apixyong.ccwu.cc` and have no CORS, 404, or 5xx failures.
4. Open Ops through Cloudflare Access, sign in with the Worker token, and verify dashboard and Growth Center data load.
5. Confirm the API health and product endpoints using the `curl` commands above.
6. Verify the Worker dashboard shows the configured Cron trigger and that D1/R2 bindings are healthy.

## Feature boundaries before opening for sales

- Checkout currently displays a notice only. It does **not** create an order or accept payment. Before taking orders, implement provider-hosted payment sessions, server-side webhook signature verification, trusted order/payment updates, inventory reservation/decrement, and end-to-end testing.
- The Storefront currently has no lead signup form; the API lead endpoint is not a customer-facing signup flow.
- Cron is configured in `worker/wrangler.toml`; confirm it is active in the deployed Worker dashboard.
- Empty R2 storage is normal, but image/media URLs require a working Worker R2 binding.

## Security

- Keep `ADMIN_TOKEN` in Worker Secrets only; rotate immediately if exposed.
- Use both Cloudflare Access and the API token for Ops.
- Do not expose D1/R2 credentials or admin tokens in client code.
- If production checks fail, inspect the specific DNS, binding, migration or build error before changing production data.
