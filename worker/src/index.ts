// xyong-commerce-api  —  worker/src/index.ts
// 说明：第 “路由部分” 的代码是你原来的；文件开头（辅助函数）和结尾（收尾括号）是补上的。

export interface Env {
  DB: D1Database;        // D1 数据库绑定，名称必须是 DB
  ASSETS: R2Bucket;      // R2 存储桶绑定，名称必须是 ASSETS
  OPS_TOKEN?: string;    // 后台口令（用 wrangler secret put OPS_TOKEN 设置）
  OPS_ORIGIN?: string;   // 后台网站地址，例如 https://ops.xyong.ccwu.cc
  STORE_ORIGIN?: string; // 商城网站地址，例如 https://xyong.ccwu.cc
}

// 允许跨域访问的网站（每次请求开始时由 OPS_ORIGIN / STORE_ORIGIN 填入）
let ALLOWED_ORIGINS: string[] = [];

/* ---------- 辅助函数 ---------- */

function corsHeaders(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin':
      ALLOWED_ORIGINS.length === 0 ? (origin || '*') : (ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]),
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Ops-Token',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

function json(data: unknown, status = 200, origin = ''): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...corsHeaders(origin),
    },
  });
}

async function body(request: Request): Promise<any> {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

function authorized(request: Request, env: Env): boolean {
  const expected = env.OPS_TOKEN;
  if (!expected) return false; // 没设置口令时，一律拒绝后台请求
  const header = request.headers.get('Authorization') || '';
  const token = header.startsWith('Bearer ')
    ? header.slice(7).trim()
    : (request.headers.get('X-Ops-Token') || '').trim();
  if (!token || token.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= token.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

// 增长助手：按简单规则生成待办任务，已存在的同名未完成任务不会重复创建
async function runGrowthAgent(env: Env): Promise<string[]> {
  const created: string[] = [];

  async function addTask(
    taskType: string,
    priority: 'high' | 'normal' | 'low',
    title: string,
    recommendation: string,
    requiresApproval: boolean
  ) {
    const exists = await env.DB.prepare(
      `SELECT id FROM agent_tasks WHERE status='open' AND task_type=? AND title=? LIMIT 1`
    ).bind(taskType, title).first<any>();
    if (exists) return;
    const id = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO agent_tasks (id,agent_name,task_type,priority,status,title,recommendation,requires_approval) VALUES (?,?,?,?,?,?,?,?)`
    ).bind(id, 'growth_agent', taskType, priority, 'open', title, recommendation, requiresApproval ? 1 : 0).run();
    created.push(id);
  }

  const newLeads = await env.DB.prepare(`SELECT COUNT(*) AS n FROM leads WHERE stage='new'`).first<any>();
  if (Number(newLeads?.n || 0) > 0) {
    await addTask('lead_followup', 'high', `跟进 ${newLeads.n} 条新线索`,
      '尽快给新线索发送欢迎邮件或消息，并根据兴趣品类推荐商品。', true);
  }

  const lowStock = await env.DB.prepare(
    `SELECT COUNT(*) AS n FROM products p LEFT JOIN inventory i ON i.product_id=p.id WHERE p.status='active' AND COALESCE(i.available_qty,0)<=5`
  ).first<any>();
  if (Number(lowStock?.n || 0) > 0) {
    await addTask('restock', 'high', `${lowStock.n} 个在售商品库存不足（≤5）`,
      '检查库存并安排补货，或暂时下架缺货商品。', true);
  }

  const pending = await env.DB.prepare(`SELECT COUNT(*) AS n FROM orders WHERE status='pending_payment'`).first<any>();
  if (Number(pending?.n || 0) > 0) {
    await addTask('order_followup', 'normal', `${pending.n} 个订单待付款`,
      '向未付款客户发送付款提醒，或确认订单是否需要取消。', true);
  }

  const active = await env.DB.prepare(`SELECT COUNT(*) AS n FROM campaigns WHERE status='active'`).first<any>();
  if (Number(active?.n || 0) === 0) {
    await addTask('campaign_create', 'normal', '当前没有进行中的营销活动',
      '创建一个新的营销活动，设置好 UTM 参数和落地页。', true);
  }

  return created;
}

/* ---------- 入口 ---------- */

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    ALLOWED_ORIGINS = [env.OPS_ORIGIN, env.STORE_ORIGIN].filter(Boolean) as string[];

    // 浏览器跨域预检
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    try {
      // 健康检查
      if (url.pathname === '/' || url.pathname === '/api/health') {
        return json({ ok: true, service: 'xyong-commerce-api' }, 200, origin);
      }

      // 图片/素材读取（后台通过 /api/ops/assets/ 上传到 R2）
      if (url.pathname.startsWith('/media/') && (request.method === 'GET' || request.method === 'HEAD')) {
        const key = decodeURIComponent(url.pathname.slice('/media/'.length));
        if (!key || key.includes('..')) return json({ error: 'Invalid asset key' }, 400, origin);
        const obj = await env.ASSETS.get(key);
        if (!obj) return json({ error: 'Not found' }, 404, origin);
        const headers = new Headers(corsHeaders(origin));
        headers.set('Content-Type', obj.httpMetadata?.contentType || 'application/octet-stream');
        headers.set('Cache-Control', 'public, max-age=3600');
        return new Response(request.method === 'HEAD' ? null : obj.body, { status: 200, headers });
      }

      /* ---------- 路由部分（你原来的代码） ---------- */

    if (url.pathname === '/api/store/products' && request.method === 'GET') {
      const { results } = await env.DB.prepare(`SELECT p.*, b.name AS brand_name, b.name_en AS brand_name_en, COALESCE(i.available_qty,0) AS available_qty FROM products p JOIN brands b ON b.id=p.brand_id LEFT JOIN inventory i ON i.product_id=p.id WHERE p.status='active' ORDER BY p.category, p.created_at DESC`).all();
      return json({ products: results }, 200, origin);
    }

    if (url.pathname === '/api/acquisition/event' && request.method === 'POST') {
      const b = await body(request); if (!b?.event_type) return json({error:'event_type required'},400,origin);
      await env.DB.prepare(`INSERT INTO acquisition_events (id,session_id,source,medium,campaign,landing_path,event_type,product_sku,value_usd,metadata_json) VALUES (?,?,?,?,?,?,?,?,?,?)`)
        .bind(crypto.randomUUID(), b.session_id||null,b.source||'direct',b.medium||null,b.campaign||null,b.landing_path||null,b.event_type,b.product_sku||null,Number(b.value_usd||0),JSON.stringify(b.metadata||{})).run();
      return json({ok:true},201,origin);
    }

    if (url.pathname === '/api/leads' && request.method === 'POST') {
      const b = await body(request); if (!b?.source) return json({error:'source required'},400,origin);
      const id=crypto.randomUUID();
      await env.DB.prepare(`INSERT INTO leads (id,email,name,country,source,source_detail,interest_category,interest_sku,stage,score,notes,consent) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`)
        .bind(id,b.email||null,b.name||null,b.country||null,b.source,b.source_detail||null,b.interest_category||null,b.interest_sku||null,'new',Math.max(0,Math.min(100,Number(b.score||0))),b.notes||null,b.consent?1:0).run();
      await env.DB.prepare(`INSERT INTO lead_events (id,lead_id,event_type,channel,campaign_id,metadata_json) VALUES (?,?,?,?,?,?)`)
        .bind(crypto.randomUUID(),id,'lead_created',b.source,b.campaign_id||null,JSON.stringify(b.metadata||{})).run();
      return json({ok:true,lead_id:id},201,origin);
    }

    if (url.pathname === '/api/orders' && request.method === 'POST') {
      const b=await body(request); if(!b?.email||!Array.isArray(b?.items)||!b.items.length) return json({error:'Invalid order'},400,origin);
      const orderId=crypto.randomUUID(); const orderNo=`XY${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${crypto.randomUUID().slice(0,6).toUpperCase()}`; let subtotal=0; const items:any[]=[];
      for(const item of b.items){
        const product=await env.DB.prepare(`SELECT p.*,COALESCE(i.available_qty,0) AS available_qty FROM products p LEFT JOIN inventory i ON i.product_id=p.id WHERE p.sku=? AND p.status='active'`).bind(item.sku).first<any>();
        const qty=Number(item.quantity); if(!product||!Number.isFinite(qty)||qty<=0) return json({error:`Invalid SKU or quantity: ${item.sku}`},400,origin);
        if(Number(product.available_qty)<qty) return json({error:`Out of stock: ${item.sku}`},409,origin);
        const line=Number(product.price_usd)*qty; subtotal+=line; items.push({product,qty,line});
      }
      const shipping=Number(b.shipping_usd||0),tax=Number(b.tax_usd||0),total=subtotal+shipping+tax;
      const stm=[env.DB.prepare(`INSERT INTO orders (id,order_no,email,currency,subtotal_usd,shipping_usd,tax_usd,total_usd,status,payment_status,shipping_address_json,customs_json) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).bind(orderId,orderNo,b.email,b.currency||'USD',subtotal,shipping,tax,total,'pending_payment','pending',JSON.stringify(b.shipping_address||{}),JSON.stringify(b.customs||{})),...items.map(x=>env.DB.prepare(`INSERT INTO order_items (id,order_id,product_id,sku,quantity,unit_price_usd,line_total_usd) VALUES (?,?,?,?,?,?,?)`).bind(crypto.randomUUID(),orderId,x.product.id,x.product.sku,x.qty,x.product.price_usd,x.line))];
      await env.DB.batch(stm);
      return json({orderId,orderNo,status:'pending_payment',total_usd:total},201,origin);
    }

    if (url.pathname === '/api/ops/dashboard' && request.method === 'GET') {
      if(!authorized(request,env)) return json({error:'Unauthorized'},401,origin);
      const [orders,inventory,products,leads,campaigns,tasks,acq]=await Promise.all([
        env.DB.prepare(`SELECT status,payment_status,COUNT(*) AS count,SUM(total_usd) AS total FROM orders GROUP BY status,payment_status`).all(),
        env.DB.prepare(`SELECT COUNT(*) AS products,SUM(available_qty) AS units,SUM(reserved_qty) AS reserved FROM inventory`).first(),
        env.DB.prepare(`SELECT COUNT(*) AS count FROM products WHERE status='active'`).first(),
        env.DB.prepare(`SELECT COUNT(*) AS total,SUM(CASE WHEN stage='new' THEN 1 ELSE 0 END) AS new_count,SUM(CASE WHEN stage='warm' THEN 1 ELSE 0 END) AS warm_count FROM leads`).first(),
        env.DB.prepare(`SELECT COUNT(*) AS total,SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) AS active FROM campaigns`).first(),
        env.DB.prepare(`SELECT COUNT(*) AS open_count,SUM(CASE WHEN priority='high' THEN 1 ELSE 0 END) AS high_count FROM agent_tasks WHERE status='open'`).first(),
        env.DB.prepare(`SELECT source,COUNT(*) AS events,SUM(CASE WHEN event_type='purchase' THEN 1 ELSE 0 END) AS purchases FROM acquisition_events GROUP BY source ORDER BY events DESC LIMIT 10`).all()
      ]);
      return json({orders:orders.results,inventory,products,leads,campaigns,tasks,acquisition:acq.results},200,origin);
    }

    if (url.pathname === '/api/ops/growth/overview' && request.method === 'GET') {
      if(!authorized(request,env)) return json({error:'Unauthorized'},401,origin);
      const [leads,campaigns,content,tasks,channels]=await Promise.all([
        env.DB.prepare(`SELECT stage,COUNT(*) AS count FROM leads GROUP BY stage`).all(),
        env.DB.prepare(`SELECT id,name,status,objective,category,utm_source,utm_medium,utm_campaign,budget_usd FROM campaigns ORDER BY created_at DESC LIMIT 20`).all(),
        env.DB.prepare(`SELECT channel,status,COUNT(*) AS count FROM content_items GROUP BY channel,status`).all(),
        env.DB.prepare(`SELECT id,agent_name,task_type,priority,status,title,recommendation,requires_approval,created_at FROM agent_tasks WHERE status='open' ORDER BY CASE priority WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END,created_at DESC LIMIT 30`).all(),
        env.DB.prepare(`SELECT source,medium,campaign,event_type,COUNT(*) AS count,SUM(value_usd) AS value FROM acquisition_events GROUP BY source,medium,campaign,event_type ORDER BY count DESC LIMIT 30`).all()
      ]);
      return json({leads:leads.results,campaigns:campaigns.results,content:content.results,tasks:tasks.results,channels:channels.results},200,origin);
    }

    if (url.pathname === '/api/ops/growth/campaigns' && request.method === 'POST') {
      if(!authorized(request,env)) return json({error:'Unauthorized'},401,origin); const b=await body(request); if(!b?.name) return json({error:'name required'},400,origin);
      const id=crypto.randomUUID(); const slug=(b.utm_campaign||b.name).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
      await env.DB.prepare(`INSERT INTO campaigns (id,name,objective,status,category,landing_path,utm_source,utm_medium,utm_campaign,budget_usd) VALUES (?,?,?,?,?,?,?,?,?,?)`).bind(id,b.name,b.objective||'traffic','draft',b.category||null,b.landing_path||'/',b.utm_source||'manual',b.utm_medium||'organic',slug,Number(b.budget_usd||0)).run();
      return json({ok:true,id,utm_campaign:slug},201,origin);
    }

    if (url.pathname === '/api/ops/growth/content' && request.method === 'POST') {
      if(!authorized(request,env)) return json({error:'Unauthorized'},401,origin); const b=await body(request); if(!b?.channel||!b?.body) return json({error:'channel and body required'},400,origin);
      const id=crypto.randomUUID(); await env.DB.prepare(`INSERT INTO content_items (id,campaign_id,channel,title,body,status,ai_generated) VALUES (?,?,?,?,?,'draft',?)`).bind(id,b.campaign_id||null,b.channel,b.title||null,b.body, b.ai_generated?1:0).run(); return json({ok:true,id},201,origin);
    }

    if (url.pathname === '/api/ops/agent/run' && request.method === 'POST') {
      if(!authorized(request,env)) return json({error:'Unauthorized'},401,origin); const ids=await runGrowthAgent(env); return json({ok:true,created_tasks:ids},200,origin);
    }

    if (url.pathname === '/api/ops/agent/tasks' && request.method === 'GET') {
      if(!authorized(request,env)) return json({error:'Unauthorized'},401,origin); const {results}=await env.DB.prepare(`SELECT * FROM agent_tasks WHERE status='open' ORDER BY CASE priority WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END,created_at DESC`).all(); return json({tasks:results},200,origin);
    }

    if (url.pathname.startsWith('/api/ops/agent/tasks/') && request.method === 'PUT') {
      if(!authorized(request,env)) return json({error:'Unauthorized'},401,origin); const id=url.pathname.split('/').pop(); const b=await body(request); const status=b?.status; if(!['open','approved','completed','rejected'].includes(status)) return json({error:'Invalid status'},400,origin);
      await env.DB.prepare(`UPDATE agent_tasks SET status=?,completed_at=CASE WHEN ? IN ('completed','rejected') THEN CURRENT_TIMESTAMP ELSE completed_at END WHERE id=?`).bind(status,status,id).run(); return json({ok:true},200,origin);
    }

    if (url.pathname.startsWith('/api/ops/assets/') && request.method === 'PUT') {
      if(!authorized(request,env)) return json({error:'Unauthorized'},401,origin);
      const key = decodeURIComponent(url.pathname.slice('/api/ops/assets/'.length)).replace(/^\/+/, '');
      if(!key || key.includes('..')) return json({error:'Invalid asset key'},400,origin);
      const contentType = request.headers.get('Content-Type') || 'application/octet-stream';
      await env.ASSETS.put(key, request.body, {httpMetadata:{contentType}});
      return json({ok:true,key,url:`/media/${encodeURIComponent(key).replace(/%2F/g,'/')}`},201,origin);
    }

    if (url.pathname === '/api/ops/products' && request.method === 'POST') {
      if(!authorized(request,env)) return json({error:'Unauthorized'},401,origin); const p=await body(request); if(!p?.sku||!p?.name_zh||!p?.category||!p?.brand_id) return json({error:'Missing product fields'},400,origin); const id=p.id||crypto.randomUUID();
      await env.DB.batch([env.DB.prepare(`INSERT INTO products (id,sku,brand_id,category,name_zh,name_en,description_zh,description_en,price_usd,spec,image_url,hs_code) VALUES (?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name_zh=excluded.name_zh,name_en=excluded.name_en,description_zh=excluded.description_zh,description_en=excluded.description_en,price_usd=excluded.price_usd,spec=excluded.spec,image_url=excluded.image_url,hs_code=excluded.hs_code,updated_at=CURRENT_TIMESTAMP`).bind(id,p.sku,p.brand_id,p.category,p.name_zh,p.name_en||p.name_zh,p.description_zh||'',p.description_en||'',Number(p.price_usd||0),p.spec||'',p.image_url||null,p.hs_code||null),env.DB.prepare(`INSERT INTO inventory (product_id,available_qty) VALUES (?,?) ON CONFLICT(product_id) DO NOTHING`).bind(id)]); return json({ok:true,id},201,origin);
    }

    if (url.pathname === '/api/ops/inventory/adjust' && request.method === 'POST') {
      if(!authorized(request,env)) return json({error:'Unauthorized'},401,origin); const b=await body(request); const qty=Number(b.quantity_delta); if(!b?.product_id||!Number.isFinite(qty)) return json({error:'Invalid inventory adjustment'},400,origin); const row=await env.DB.prepare(`SELECT available_qty FROM inventory WHERE product_id=?`).bind(b.product_id).first<any>(); if(!row) return json({error:'Inventory record not found'},404,origin); const next=Number(row.available_qty)+qty; if(next<0) return json({error:'Inventory cannot become negative'},409,origin); await env.DB.batch([env.DB.prepare(`UPDATE inventory SET available_qty=?,updated_at=CURRENT_TIMESTAMP WHERE product_id=?`).bind(next,b.product_id),env.DB.prepare(`INSERT INTO inventory_events (id,product_id,event_type,quantity,reference_type,note) VALUES (?,?,?,?,?,?)`).bind(crypto.randomUUID(),b.product_id,'manual_adjustment',qty,'ops',b.note||'')]); return json({ok:true,available_qty:next},200,origin);
    }

    return json({error:'Not found'},404,origin);

    /* ---------- 路由部分结束 ---------- */
    } catch (err) {
      console.error('Unhandled error:', err);
      // 临时调试：返回具体错误原因，问题解决后可以删掉 detail 这一项
      return json({ error: 'Internal server error', detail: String((err as any)?.message || err) }, 500, origin);
    }
  },
};
