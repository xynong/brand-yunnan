# XYONG Commerce & Growth OS V2.1.1

这是 XYONG 一人公司（OPC）跨境品牌电商的可部署基础工程。

## 本版本的真实目标

- 客户商城：`https://xyong.ccwu.cc`
- 私有运营中心：`https://ops.xyong.ccwu.cc`
- Cloudflare Worker API：建议使用 `https://api.xyong.ccwu.cc`
- Cloudflare D1：**xyong-db**（来自当前 Cloudflare 截图）
- Cloudflare R2：**xyong-media**（来自当前 Cloudflare 截图）
- GitHub：源码版本管理

## 四大首发品类

1. 云南精品咖啡
2. 云南大叶古树茶
3. 云南黑松露
4. 云南植物精油

产品不是写死在程序里。未来新增品牌、产品、SKU、Lot，只增加 D1 数据，不修改核心架构。

## V2.1.1 新增

- Growth Center 获客中心
- acquisition_events 渠道归因
- UTM 追踪
- Lead / CRM
- Campaign
- Content
- AI Agent task queue
- 每日 Growth Agent Cron
- R2 私有媒体网关 `/media/*`
- R2 后台上传接口 `/api/ops/assets/*`
- D1 versioned migration
- 四大品类初始品牌记录

## 重要安全原则

1. 浏览器不直接访问 D1/R2。
2. Ops 必须使用 Cloudflare Access + 应用 Token 双层保护。
3. ADMIN_TOKEN 只能作为 Worker Secret，绝不能提交 GitHub。
4. 支付成功必须由支付服务 webhook 在后端确认。
5. AI Agent 默认只建议，不直接付款、退款、删除证据或发布内容。
6. 不使用自动刷屏、批量骚扰、模拟登录等违规获客方式。

## 当前 Cloudflare 资源状态

根据 2026-10-22 用户提供的 Cloudflare 截图：

- `xyong-db`：已经创建，但目前 0 tables，尚未初始化业务 schema。
- `xyong-media`：已经创建，目前 0 objects / 0 B；空桶是正常的。
- 截图本身不能证明 Worker binding 已经完成，因此部署时必须再验证 `DB` 与 `ASSETS` bindings。

## 初始化 D1

推荐使用迁移：

```bash
cd worker
npx wrangler d1 migrations apply xyong-db --remote
```

Cloudflare 官方文档支持使用 `d1 migrations apply <DATABASE> --remote` 对远程 D1 应用迁移。执行后再查询表名确认。

## R2

R2 桶已经存在，不要重复创建。部署前确认：

```bash
npx wrangler r2 bucket list
```

`worker/wrangler.toml` 已经按照你的真实桶名 `xyong-media` 配置。

## Worker

必须先把 `worker/wrangler.toml` 中：

```toml
database_id = "REPLACE_WITH_YOUR_FULL_D1_DATABASE_ID"
```

替换为 Cloudflare 页面显示的完整 D1 UUID。

然后：

```bash
cd worker
npx wrangler login
npx wrangler secret put ADMIN_TOKEN
npx wrangler deploy
```

## 前端

Storefront 和 Ops 是两个独立前端。

构建时设置：

```text
VITE_API_BASE_URL=https://api.xyong.ccwu.cc
```

先把 Worker 部署到 Cloudflare，确认 `/api/health` 正常，再绑定 `api.xyong.ccwu.cc`。

## 免费 / 低成本策略

第一阶段优先使用：

- GitHub
- Cloudflare Pages
- Cloudflare Workers
- Cloudflare D1
- Cloudflare R2
- 规则型 Agent
- 人工审批

生成式 AI、支付、邮件、社媒官方 API 等可能存在供应商费用或使用限制，因此采用可插拔方式，先不把系统锁定在收费服务上。

## 生产顺序

1. D1 初始化
2. Worker binding + deploy
3. `/api/health` 验证
4. Storefront 接 API
5. Ops 接 API
6. Cloudflare Access 保护 Ops
7. R2 图片上传/读取
8. 再接真实支付 webhook
9. 再接官方社媒/邮件 API
