# XYONG V2 业务架构

## 1. Storefront 与 Ops 完全分离
- Storefront：面向客户，只读取公开产品、创建订单、显示订单状态。
- Ops：面向你，只能在受保护域名/身份下访问，管理产品、品牌、批次、库存、采购、证据、订单、物流、支付和 AI Agent。
- API：所有关键写操作由 Worker 完成，浏览器不再直接修改库存或“宣布支付成功”。

## 2. 四大品类固定，产品无限扩展
系统级 category 只有四个首发域：
- coffee
- ancient_tree_tea
- black_truffle
- botanical_essential_oil

产品新增通过数据库记录完成；品牌、SKU、Lot 独立于前端代码，因此增加品牌和产品不需要改架构。

## 3. 一体化数据链
Brand → Product → Lot → Inventory → Order → Order Item → Fulfillment → Evidence

Procurement 进入 Lot/Inventory；订单占用 Inventory；Evidence 可公开或内部可见。

## 4. OPC + AI Agent
AI 不直接拥有资金、发货和发布权限。Agent 负责读取数据、分析、生成草案和提出动作；高风险动作需要你确认。

建议 Agent 权限分层：
- Read：订单/库存/采购/客户/营销数据
- Draft：邮件、补货建议、营销内容、异常处理建议
- Execute with approval：退款、补货单、发货确认、营销发布
- Never autonomous：支付确认、退款到账、删除证据、修改财务历史记录
