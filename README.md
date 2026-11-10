# XYONG BRAND · 云南精品园

XYONG BRAND 是面向云南特色产品的跨境品牌商城与运营基础系统。

## 生产域名

- 商城：`https://xyong.ccwu.cc`
- 运营中心：`https://ops.xyong.ccwu.cc`
- Cloudflare Worker API：`https://apixyong.ccwu.cc`

API 主机名统一使用 `apixyong.ccwu.cc`，不要与旧文档中出现的 `api.xyong.ccwu.cc` 混用。Worker custom domain 和两个 Pages 项目的 `VITE_API_BASE_URL` 必须一致。

## 品类

- 云南精品咖啡
- 云南大叶古树茶
- 云南黑松露
- 云南植物精油

商品通过运营中心录入，不应把真实商业数据写死在前端。

## 当前实现能力

- 双语商品展示与购物车金额预览
- 商品列表、访问/加购 UTM 归因
- 运营中心 dashboard、Growth Center 与规则型 Agent 建议任务
- Worker D1/R2 bindings、媒体路由和每日 Cron 配置
- 初始 D1 migration 和四个品类品牌记录

在线功能依赖 Cloudflare 资源、bindings、迁移和环境变量均配置正确。请按 [生产部署与验收清单](DEPLOYMENT.md) 操作。

## 尚未开通的交易能力

购物车结账按钮目前只显示提示，**不会创建订单或收款**。正式营业前需要集成支付提供商、服务端创建支付会话、验证 webhook、更新订单与库存，并完成端到端验收。当前前端也没有订阅/留资表单，因此不要把 `/api/leads` 当成已开放的访客功能。

## 安全原则

1. 浏览器不直接访问 D1/R2。
2. 运营中心使用 Cloudflare Access 与 Worker `ADMIN_TOKEN` 双重保护。
3. `ADMIN_TOKEN` 仅存为 Worker Secret；不得提交代码或设为 `VITE_*`。
4. 只在支付提供商 webhook 验签后确认付款。
5. Agent 只提供建议，高风险运营动作需人工审批。
6. 不采用自动刷屏、批量骚扰或模拟登录等获客方式。

## Cloudflare 资源和迁移

Worker 预期绑定 D1 `xyong-db`、R2 `xyong-media`。部署前请在目标 Cloudflare 账户核对资源、D1 ID 和 Worker bindings；仓库配置本身无法证明账户侧资源已就绪。

```bash
npx wrangler d1 migrations apply xyong-db --remote
```

部署步骤、Pages 构建设置及线上验收命令见 [DEPLOYMENT.md](DEPLOYMENT.md)。
