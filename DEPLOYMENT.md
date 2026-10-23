# XYONG V2.1 实际落地步骤

## A. GitHub
建议建立一个新仓库：`xyong-commerce-os`。
把本目录所有文件上传到仓库根目录。

## B. D1
Cloudflare Dashboard → Workers & Pages → D1 → 选择已有 `xyong-commerce`。
执行 `db/schema.sql`。

如果你已有 V2 D1 数据，请先备份，再执行 schema；所有表均使用 IF NOT EXISTS，但新增字段/索引应先确认现有表结构。

## C. R2
继续使用已有 `xyong-assets`。本版本不删除现有对象。

## D. Worker
1. 安装 Node.js LTS。
2. 登录 Cloudflare：`npx wrangler login`
3. 进入 `worker` 目录。
4. 修改 `wrangler.toml` 的 `database_id`。
5. 设置管理 Token：`npx wrangler secret put ADMIN_TOKEN`
6. 部署：`npx wrangler deploy`

建议给 Worker 绑定 API 子域，例如 `api.xyong.ccwu.cc`。具体 DNS/route 方式按你的 Cloudflare 账户现有部署选择。

## E. Storefront
Cloudflare Pages 建议单独创建站点，Root directory 指向 `apps/storefront`。
Build command：`npm run build`
Build output：`dist`
Environment variable：`VITE_API_BASE_URL=https://api.xyong.ccwu.cc`
绑定现有 `xyong.ccwu.cc`。

## F. Ops
再创建一个独立 Pages 站点，Root directory：`apps/ops`。
Build command：`npm run build`
Build output：`dist`
Environment variable：`VITE_API_BASE_URL=https://api.xyong.ccwu.cc`
绑定：`ops.xyong.ccwu.cc`。
然后在 Cloudflare Access 中只允许你自己的身份访问该域名。

## G. 首批品牌
在 D1 执行 README 中的 4 条 brand INSERT。
产品通过后台 API 录入，未来增加品牌/产品/SKU/Lot 只加数据，不改架构。

## H. Growth Center
1. 所有广告/社媒/社区/邮件链接带 UTM。
2. Storefront 自动记录 `visit` 和 `add_to_cart`。
3. 订阅表单调用 `/api/leads`，需要明确营销同意才保存 `consent=1`。
4. Ops → Growth Center 查看来源、Leads、Campaigns、AI tasks。
5. 每日定时任务会运行基础 Growth Agent，生成需要你处理的任务。

## I. 真实支付上线前必须完成
本版本故意没有伪造支付成功。接入正式 Stripe/PayPal 等服务时：
- 浏览器创建 payment session。
- 支付服务完成支付。
- Webhook 到 Worker。
- Worker 验证签名。
- Worker 更新 `orders.payment_status` 和 `orders.status`。
- 库存只由后端交易逻辑扣减/预留。

## J. 社媒自动发布
V2.1 只做“渠道数据模型 + 内容草案 + UTM + 人工审批”，不模拟登录或刷屏。以后接官方 API 时，把平台作为 adapter 接入，不改变 `campaigns/content_items/leads/acquisition_events`。

## K. 免费优先
当前代码没有绑定付费 AI API。基础 Agent 是规则型、可运行的自动化；需要生成式文案时再增加可插拔 AI Provider。这样不会因为 AI 订阅费用导致 OPC 的固定成本失控。
