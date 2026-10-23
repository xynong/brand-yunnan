export interface Env {
  DB: D1Database;
  ASSETS: R2Bucket;
  ADMIN_TOKEN: string;
  STORE_ORIGIN: string;
  OPS_ORIGIN: string;
}

const json = (data: unknown, status = 200, origin = '*') => new Response(JSON.stringify(data), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': origin,
    'access-control-allow-headers': 'Content-Type, Authorization',
    'access-control-allow-methods': 'GET,POST,PUT,OPTIONS'
  }
});

function corsOrigin(request: Request, env: Env) {
  const origin = request.headers.get('Origin');
  return origin === env.STORE_ORIGIN || origin === env.OPS_ORIGIN ? origin : env.STORE_ORIGIN;
}

function authorized(request: Request, env: Env) {
  const header = request.headers.get('Authorization') || '';
  return !!env.ADMIN_TOKEN && header === `Bearer ${env.ADMIN_TOKEN}`;
}

async function body(request: Request) { try { return await request.json<any>(); } catch { return null; } }

async function createAgentTask(env: Env, agent_name: string, task_type: string, priority: string, title: string, recommendation: string, payload: unknown = {}) {
  const id = crypto.randomUUID();
  await env.DB.prepare(`INSERT INTO agent_tasks (id,agent_name,task_type,priority,title,recommendation,payload_json,requires_approval) VALUES (?,?,?,?,?,?,?,1)`)
    .bind(id, agent_name, task_type, priority, title, recommendation, JSON.stringify(payload)).run();
  return id;
}

async function runGrowthAgent(env: Env) {
  const inventory = await env.DB.prepare(`SELECT p.sku,p.name_en,p.category,i.available_qty FROM products p LEFT JOIN inventory i ON i.product_id=p.id WHERE p.status='active'`).all<any>();
  const lowStock = (inventory.results || []).filter((x: any) => Number(x.available_qty || 0) <= 10);
  const leads = await env.DB.prepare(`SELECT COUNT(*) AS count FROM leads WHERE stage IN ('new','warm')`).first<any>();
  const tasks: string[] = [];
  if (lowStock.length) tasks.push(await createAgentTask(env, 'Growth & Inventory Agent', 'inventory_alert', 'high', `${lowStock.length} 个 SKU 库存偏低`, '检查补货周期并生成采购草案；AI不得直接下采购单。', { items: lowStock }))
  if (Number(leads?.count || 0) > 0) tasks.push(await createAgentTask(env, 'CRM Agent', 'lead_followup', 'normal', `跟进 ${leads.count} 个活跃潜客`, '根据来源、兴趣品类和最近行为生成个性化英文跟进草稿，发送前由你批准。', {}));
  tasks.push(await createAgentTask(env, 'Content Agent', 'content_batch', 'normal', '生成本周四大品类内容草案', '为 Coffee / Ancient Tree Tea / Black Truffle / Botanical Essential Oil 各生成一组内容选题与文案草稿，不自动发布。', { categories: ['coffee','ancient_tree_tea','black_truffle','botanical_essential_oil'] }));
  return tasks;
}

export default {
  async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext) {
    await runGrowthAgent(env);
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = corsOrigin(request, env);
    if (request.method === 'OPTIONS') return new Response(null, { headers: { 'access-control-allow-origin': origin, 'access-control-allow-headers': 'Content-Type, Authorization', 'access-control-allow-methods': 'GET,POST,PUT,OPTIONS' } });
    const url = new URL(request.url);

    // Private R2-backed media gateway. Objects remain private in R2.
    // Public product/evidence URLs are served through this Worker route.
    if (url.pathname.startsWith('/media/')) {
      const key = decodeURIComponent(url.pathname.slice('/media/'.length));
      if (!key) return new Response('Not found', {status: 404});
      const obj = await env.ASSETS.get(key);
      if (!obj) return new Response('Not found', {status: 404});
      const headers = new Headers();
      obj.writeHttpMetadata(headers);
      headers.set('etag', obj.httpEtag);
      headers.set('cache-control', 'public, max-age=86400');
      return new Response(obj.body, {headers});
    }

    if (url.pathname === '/api/health') return json({ ok: true, service: 'xyong-commerce-api', version: '2.1.0' }, 200, origin);

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
  }
};
