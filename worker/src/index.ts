import { EmailMessage } from 'cloudflare:email';
// @ts-expect-error cloudflare:sockets 由 Workers 运行时提供，编译期类型自行声明于下方
import { connect as tcpConnect } from 'cloudflare:sockets';

declare module 'cloudflare:sockets' {
  export interface Socket {
    readable: ReadableStream<Uint8Array>;
    writable: WritableStream<Uint8Array>;
    closed: Promise<unknown>;
    startTls(options?: { expectedSniHostname?: string }): Promise<Socket>;
    close(): void;
  }
  export function connect(address: string, options?: { secureTransport?: 'starttls' | 'on' | 'off'; allowHalfOpen?: boolean }): Socket;
}

import { FIELD_PAGE_HTML } from './field_page';

export interface Env {
  DB: D1Database;
  ASSETS: R2Bucket;
  ADMIN_TOKEN: string;
  STORE_ORIGIN: string;
  OPS_ORIGIN: string;
  NOTIFY_MAIL?: { send: (message: EmailMessage) => Promise<void> };
  MAIL_FROM?: string;
  MAIL_TO?: string;
  MAIL_BOX?: string;
  RESEND_API_KEY?: string;
  RESEND_FROM?: string;
  SENDGRID_API_KEY?: string;
}

// 统一发信：走 Cloudflare send_email 绑定（免费），发件人为 xyong@xyong.ccwu.cc。
// 失败绝不影响下单/表单主流程。
function mimeHeader(value: string) {
  return /[^\x20-\x7E]/.test(value)
    ? `=?UTF-8?B?${btoa(String.fromCharCode(...new TextEncoder().encode(value)))}?=`
    : value;
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function brandHtml(title: string, lines: string[]) {
  const body = lines.map(l => `<p style="margin:0 0 10px;line-height:1.7;color:#33302c;font-size:14px">${escapeHtml(l)}</p>`).join('');
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:24px 12px;background:#f6f3ee;font-family:-apple-system,'Segoe UI','Microsoft YaHei',sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden">
<tr><td style="background:#1f3b2c;padding:20px 24px">
<div style="color:#f6f3ee;font-size:17px;letter-spacing:.14em;font-weight:600">XYONG</div>
<div style="color:#c9d6cd;font-size:11px;letter-spacing:.28em;margin-top:4px">YUNNAN SELECT</div>
</td></tr>
<tr><td style="padding:26px 24px">
<h2 style="margin:0 0 16px;font-size:18px;color:#1f3b2c;font-weight:600">${escapeHtml(title)}</h2>
${body}
</td></tr>
<tr><td style="padding:16px 24px;border-top:1px solid #ece7df;color:#8a857e;font-size:11px;line-height:1.7">
XYONG 云南精品园 · Yunnan Select<br>
客服邮箱 xyong@xyong.ccwu.cc · https://xyong.ccwu.cc
</td></tr></table></body></html>`;
}

function b64utf8(s: string) {
  return btoa(String.fromCharCode(...new TextEncoder().encode(s)));
}

async function getSettingValue(env: Env, key: string): Promise<string> {
  try {
    const row = await env.DB.prepare(`SELECT value FROM settings WHERE key=? LIMIT 1`).bind(key).first<any>();
    return row?.value ? String(row.value) : '';
  } catch {
    return '';
  }
}

// ---------- Zoho SMTP 直发（客户邮件主通道） ----------
// 经 Cloudflare Workers TCP 直连 smtp.zoho.com:465（TLS），凭据存 D1 settings。
// 失败不影响主流程，返回 false 由后续通道兜底。
async function smtpSend(env: Env, to: string, subject: string, lines: string[], opts: { html?: boolean } = {}): Promise<{ ok: boolean; error?: string }> {
  const user = await getSettingValue(env, 'smtp_user');
  const pass = await getSettingValue(env, 'smtp_pass');
  if (!user || !pass) return { ok: false, error: 'SMTP 未配置' };
  const host = (await getSettingValue(env, 'smtp_host')) || 'smtp.zoho.com';
  const port = Number((await getSettingValue(env, 'smtp_port')) || 465);
  const from = env.MAIL_FROM || 'xyong@xyong.ccwu.cc';
  try {
    const socket = tcpConnect(`${host}:${port}`, { secureTransport: 'on', allowHalfOpen: false });
    const writer = socket.writable.getWriter();
    const reader = socket.readable.getReader();
    const enc = new TextEncoder();
    const dec = new TextDecoder();
    let buffer = '';
    const readReply = async (timeoutMs = 20000): Promise<string> => {
      const deadline = Date.now() + timeoutMs;
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        while (Date.now() < deadline) {
          const idx = buffer.indexOf('\r\n');
          if (idx >= 0) {
            const line = buffer.slice(0, idx);
            buffer = buffer.slice(idx + 2);
            if (/^\d{3}[ -]/.test(line)) return line;
            continue;
          }
          timer = setTimeout(() => { try { reader.cancel(); } catch { /* noop */ } }, deadline - Date.now());
          const { value, done } = await reader.read();
          if (done) throw new Error('连接被服务器关闭');
          clearTimeout(timer); timer = undefined;
          buffer += dec.decode(value, { stream: true });
        }
        throw new Error('等待服务器响应超时');
      } finally {
        if (timer) clearTimeout(timer);
      }
    };
    const cmd = async (line: string, expect?: number) => {
      await writer.write(enc.encode(line + '\r\n'));
      const reply = await readReply();
      const code = parseInt(reply.slice(0, 3), 10);
      if (expect && code !== expect) throw new Error(`服务器返回 ${reply}`);
      return code;
    };

    await readReply(); // 220 greeting
    await cmd(`EHLO xyong.ccwu.cc`, 250);
    await cmd('AUTH LOGIN', 334);
    await cmd(b64utf8(user), 334);
    await cmd(b64utf8(pass), 235);
    await cmd(`MAIL FROM:<${from}>`, 250);
    await cmd(`RCPT TO:<${to}>`, 250);
    await cmd('DATA', 354);

    const text = [...lines, '', `— ${env.MAIL_BOX || 'xyong@xyong.ccwu.cc'} · XYONG 云南精品园`].join('\r\n');
    const head = [
      `From: XYONG 云南精品园 <${from}>`,
      `To: ${to}`,
      `Subject: ${mimeHeader(subject)}`,
      `Date: ${new Date().toUTCString()}`,
      `Message-ID: <${crypto.randomUUID().replace(/-/g, '')}@xyong.ccwu.cc>`,
      'MIME-Version: 1.0',
      `Reply-To: ${env.MAIL_BOX || from}`,
    ];
    let raw: string;
    if (opts.html === false) {
      raw = [...head, 'Content-Type: text/plain; charset=utf-8', 'Content-Transfer-Encoding: 8bit', '', text].join('\r\n');
    } else {
      const boundary = `xyong-${crypto.randomUUID().slice(0, 8)}`;
      raw = [
        ...head,
        `Content-Type: multipart/alternative; boundary="${boundary}"`,
        '',
        `--${boundary}`,
        'Content-Type: text/plain; charset=utf-8',
        'Content-Transfer-Encoding: 8bit',
        '',
        text,
        `--${boundary}`,
        'Content-Type: text/html; charset=utf-8',
        'Content-Transfer-Encoding: 8bit',
        '',
        brandHtml(subject, lines),
        `--${boundary}--`,
      ].join('\r\n');
    }
    // SMTP DATA 点转义（.开头行加倍）+ 结束标记
    await writer.write(enc.encode(raw.replace(/^\./gm, '..') + '\r\n.\r\n'));
    const reply = await readReply();
    if (parseInt(reply.slice(0, 3), 10) !== 250) throw new Error(`投递被拒绝：${reply}`);
    await cmd('QUIT', 221).catch(() => {});
    try { writer.releaseLock(); reader.releaseLock(); } catch { /* noop */ }
    socket.close();
    return { ok: true };
  } catch (e) {
    console.log('smtp_send_fail', to, String(e));
    return { ok: false, error: String(e).replace(/^Error: /, '') };
  }
}

async function sendMail(env: Env, to: string, subject: string, lines: string[], opts: { html?: boolean } = {}) {
  const body = [...lines, '', `— ${env.MAIL_BOX || 'xyong@xyong.ccwu.cc'} · XYONG 云南精品园`].join('\r\n');
  // 通道 0：Zoho SMTP（发件人 xyong@xyong.ccwu.cc，免域名验证，客户邮件主通道）
  const smtpUser = await getSettingValue(env, 'smtp_user');
  const smtpPass = await getSettingValue(env, 'smtp_pass');
  if (smtpUser && smtpPass) {
    const r = await smtpSend(env, to, subject, lines, opts);
    if (r.ok) return true;
    console.log('smtp_channel_fail', to, r.error);
  }
  // 通道 1：SendGrid（无需域名 DNS，只需验证发件邮箱；免费 100 封/天）
  if (env.SENDGRID_API_KEY) {
    try {
      const resp = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.SENDGRID_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: env.MAIL_FROM || 'xyong@xyong.ccwu.cc', name: 'XYONG 云南精品园' },
          reply_to: { email: env.MAIL_BOX || 'xyong@xyong.ccwu.cc', name: 'XYONG 云南精品园' },
          subject,
          content: opts.html === false
            ? [{ type: 'text/plain', value: body }]
            : [
                { type: 'text/plain', value: body },
                { type: 'text/html', value: brandHtml(subject, lines) },
              ],
        }),
      });
      if (resp.ok) return true;
      console.log('sendgrid_fail', resp.status, (await resp.text()).slice(0, 300));
    } catch (e) {
      console.log('sendgrid_exc', String(e));
    }
  }
  // 通道 2：Resend（需域名验证；免费 3000 封/月）
  if (env.RESEND_API_KEY) {
    const from = env.RESEND_FROM || `XYONG 云南精品园 <${env.MAIL_FROM || 'xyong@xyong.ccwu.cc'}>`;
    const text = [...lines, '', `— ${env.MAIL_BOX || 'xyong@xyong.ccwu.cc'} · XYONG 云南精品园`].join('\r\n');
    try {
      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from,
          to: [to],
          subject,
          text,
          html: opts.html === false ? undefined : brandHtml(subject, lines),
          reply_to: env.MAIL_BOX || 'xyong@xyong.ccwu.cc',
        }),
      });
      if (resp.ok) return true;
      console.log('resend_fail', resp.status, (await resp.text()).slice(0, 300));
    } catch (e) {
      console.log('resend_exc', String(e));
    }
  }
  if (!env.NOTIFY_MAIL) return false;
  const from = env.MAIL_FROM || 'orders@xyong.ccwu.cc';
  const text = [...lines, '', `— ${env.MAIL_BOX || 'xyong@xyong.ccwu.cc'} · XYONG 云南精品园`].join('\r\n');
  const head = [
    `From: XYONG 云南精品园 <${from}>`,
    `To: ${to}`,
    `Subject: ${mimeHeader(subject)}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${crypto.randomUUID()}@xyong.ccwu.cc>`,
    'MIME-Version: 1.0',
    'Reply-To: xyong@xyong.ccwu.cc',
  ];
  let raw: string;
  if (opts.html) {
    const boundary = `xyong-${crypto.randomUUID().slice(0, 8)}`;
    raw = [
      ...head,
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset=utf-8',
      'Content-Transfer-Encoding: 8bit',
      '',
      text,
      `--${boundary}`,
      'Content-Type: text/html; charset=utf-8',
      'Content-Transfer-Encoding: 8bit',
      '',
      brandHtml(subject, lines),
      `--${boundary}--`,
    ].join('\r\n');
  } else {
    raw = [
      ...head,
      'Content-Type: text/plain; charset=utf-8',
      'Content-Transfer-Encoding: 8bit',
      '',
      text,
    ].join('\r\n');
  }
  try {
    await env.NOTIFY_MAIL.send(new EmailMessage(from, to, raw));
    return true;
  } catch (e) {
    console.log('mail_fail', to, String(e));
    return false;
  }
}

async function notifyOwner(env: Env, subject: string, lines: string[]) {
  const to = env.MAIL_TO || 'xynong@gmail.com';
  const sent = await sendMail(env, to, subject, lines);
  if (sent) return true;
  // 保底通道：Cloudflare Email Routing 停用（如切换 Zoho MX）后，
  // 用 Resend 默认发件域发到老板自己的 Gmail（无需域名验证，实测可用）。
  if (env.RESEND_API_KEY) {
    try {
      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'XYONG 云南精品园 <onboarding@resend.dev>',
          to: [to],
          subject,
          text: [...lines, '', '— XYONG 云南精品园（保底通知通道）'].join('\r\n'),
        }),
      });
      if (resp.ok) return true;
      console.log('resend_owner_fallback_fail', resp.status, (await resp.text()).slice(0, 200));
    } catch (e) {
      console.log('resend_owner_fallback_exc', String(e));
    }
  }
  return false;
}

const json = (data: unknown, status = 200, origin = '*') => new Response(JSON.stringify(data), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': origin,
    'access-control-allow-headers': 'Content-Type, Authorization',
    'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS'
  }
});

function corsOrigin(request: Request, env: Env) {
  const origin = request.headers.get('Origin');
  return origin === env.STORE_ORIGIN || origin === env.OPS_ORIGIN ? origin : env.STORE_ORIGIN;
}

// 管理密码校验：优先读 D1 settings 表（可在中台自助修改），未设置时回退到部署密钥。
async function authorized(request: Request, env: Env) {
  const header = request.headers.get('Authorization') || '';
  const bearer = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!bearer) return false;
  try {
    const row = await env.DB.prepare(`SELECT value FROM settings WHERE key='admin_token' LIMIT 1`).first<any>();
    if (row?.value) return bearer === String(row.value);
  } catch {
    // settings 表不可用时回退到部署密钥，保证中台不被锁死。
  }
  return !!env.ADMIN_TOKEN && bearer === env.ADMIN_TOKEN;
}

async function body(request: Request) { try { return await request.json<any>(); } catch { return null; } }

const rid = () => crypto.randomUUID();

function orderNo() {
  const d = new Date();
  const stamp = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
  return `XY-${stamp}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

async function createAgentTask(env: Env, agent_name: string, task_type: string, priority: string, title: string, recommendation: string, payload: unknown = {}) {
  const id = rid();
  await env.DB.prepare(`INSERT INTO agent_tasks (id,agent_name,task_type,priority,title,recommendation,payload_json,requires_approval) VALUES (?,?,?,?,?,?,?,1)`)
    .bind(id, agent_name, task_type, priority, title, recommendation, JSON.stringify(payload)).run();
  return id;
}

async function runGrowthAgent(env: Env) {
  const inventory = await env.DB.prepare(`SELECT p.sku,p.name AS name_en,c.slug AS category,COALESCE(i.on_hand-i.reserved,0) AS available_qty FROM products p LEFT JOIN categories c ON c.id=p.category_id LEFT JOIN inventory i ON i.product_id=p.id WHERE p.status='published'`).all<any>();
  const lowStock = (inventory.results || []).filter((x: any) => Number(x.available_qty || 0) <= 10);
  const leads = await env.DB.prepare(`SELECT COUNT(*) AS count FROM leads WHERE stage IN ('new','warm')`).first<any>();
  const tasks: string[] = [];
  if (lowStock.length) tasks.push(await createAgentTask(env, 'Growth & Inventory Agent', 'inventory_alert', 'high', `${lowStock.length} 个 SKU 库存偏低`, '检查补货周期并生成采购草案；AI不得直接下采购单。', { items: lowStock }))
  if (Number(leads?.count || 0) > 0) tasks.push(await createAgentTask(env, 'CRM Agent', 'lead_followup', 'normal', `跟进 ${leads.count} 个活跃潜客`, '根据来源、兴趣品类和最近行为生成个性化英文跟进草稿，发送前由你批准。', {}));
  tasks.push(await createAgentTask(env, 'Content Agent', 'content_batch', 'normal', '生成本周四大品类内容草案', '为 Coffee / Tea / Truffle / Essential Oil 各生成一组内容选题与文案草稿，不自动发布。', { categories: ['coffee','tea','truffle','essential-oil'] }));
  return tasks;
}

// 上下单主流程：读服务端购物车 → 服务器端算价（防篡改）→ 建订单/明细/支付记录 → 锁库存 → 清购物车。
async function performCheckout(env: Env, b: any) {
  const sessionId = String(b?.session_id || '').trim();
  if (!sessionId) return { error: 'session_id required' as const, status: 400 as const };
  const c = b?.customer || {};
  if (!c.name || !c.email || !c.phone || !c.address) return { error: '收货人 / 邮箱 / 电话 / 地址必填', status: 400 as const };

  const cartRows = await env.DB.prepare(
    `SELECT ci.id AS cart_id, ci.quantity, ci.product_id, p.id AS pid, p.sku, p.name, p.price_cents, p.weight, p.unit
       FROM cart_items ci JOIN products p ON p.id = ci.product_id
      WHERE ci.session_id = ? ORDER BY ci.created_at`
  ).bind(sessionId).all<any>();
  const items = (cartRows.results || []).filter((r) => Number(r.quantity) > 0);
  if (!items.length) return { error: '购物车为空', status: 400 as const };

  // 优惠券（可选）
  let discountCents = 0;
  let couponId: string | null = null;
  const code = String(b?.coupon_code || '').trim().toUpperCase();
  let couponCode: string | null = null;
  if (code) {
    const coupon = await env.DB.prepare(`SELECT * FROM coupons WHERE UPPER(code)=? AND is_active=1 AND (starts_at IS NULL OR starts_at<=datetime('now')) AND (ends_at IS NULL OR ends_at>=datetime('now')) AND (max_uses IS NULL OR used_count<max_uses)`).bind(code).first<any>();
    if (!coupon) return { error: '优惠券无效或已过期', status: 400 as const };
    couponId = coupon.id; couponCode = coupon.code;
  }

  const subtotalCents = items.reduce((s, r) => s + Number(r.price_cents) * Math.floor(Number(r.quantity)), 0);
  if (couponId) {
    const coupon = await env.DB.prepare(`SELECT type,value,min_subtotal FROM coupons WHERE id=?`).bind(couponId).first<any>();
    if (subtotalCents < Number(coupon.min_subtotal || 0)) return { error: '未达到优惠券最低消费', status: 400 as const };
    discountCents = coupon.type === 'percentage'
      ? Math.round(subtotalCents * Math.min(100, Number(coupon.value)) / 100)
      : Math.min(Math.round(Number(coupon.value) * 100), subtotalCents);
  }
  const totalCents = Math.max(0, subtotalCents - discountCents);

  const no = orderNo();
  const noteBits = [b?.note, couponCode ? `优惠码:${couponCode} -${(discountCents / 100).toFixed(2)}` : ''].filter(Boolean).join(' | ');
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO orders (order_no,customer_name,customer_phone,customer_email,shipping_address,status,total_cents,note) VALUES (?,?,?,?,?,'pending',?,?)`)
      .bind(no, String(c.name), String(c.phone), String(c.email), [c.address, c.city, c.province, c.country, c.postal_code].filter(Boolean).join(', '), totalCents, noteBits || null),
    ...items.map((r) => env.DB.prepare(`INSERT INTO order_items (order_id,product_id,quantity,unit_price_cents,unit_cost_cents,line_total_cents) SELECT id,?,?,?,?,? FROM orders WHERE order_no=?`)
      .bind(r.pid, Math.floor(Number(r.quantity)), Number(r.price_cents), 0, Number(r.price_cents) * Math.floor(Number(r.quantity)), no)),
    ...items.map((r) => env.DB.prepare(`UPDATE inventory SET reserved = reserved + ? WHERE product_id = ?`).bind(Math.floor(Number(r.quantity)), r.pid)),
    env.DB.prepare(`DELETE FROM cart_items WHERE session_id = ?`).bind(sessionId),
  ]);
  const order = await env.DB.prepare(`SELECT id FROM orders WHERE order_no=?`).bind(no).first<any>();
  // 支付框架：先落一条 pending 支付记录，接真实支付网关时替换 provider 即可。
  await env.DB.prepare(`INSERT INTO payments (id,order_id,provider,amount,currency,status) VALUES (?,?,?,?, 'USD','pending')`)
    .bind(rid(), String(order.id), String(b?.payment_method || 'pending_online'), totalCents / 100).run();
  // 客户档案：首次下单自动建档（customers 表）
  const cust = await env.DB.prepare(`SELECT id FROM customers WHERE email=?`).bind(String(c.email)).first<any>();
  if (cust) {
    await env.DB.prepare(`UPDATE customers SET updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(cust.id).run();
  } else {
    await env.DB.prepare(`INSERT INTO customers (id,email,first_name,country,language,source) VALUES (?,?,?,?,?,'storefront_checkout')`)
      .bind(rid(), String(c.email), String(c.name), String(c.country || ''), 'zh').run().catch(() => {});
  }
  if (couponId) await env.DB.prepare(`UPDATE coupons SET used_count = used_count + 1 WHERE id=?`).bind(couponId).run();
  await notifyOwner(env, `新订单 ${no} · US$${(totalCents / 100).toFixed(2)}`, [
    `订单号：${no}`,
    `客户：${c.name} / ${c.email} / ${c.phone}`,
    `收货地址：${[c.address, c.city, c.province, c.country, c.postal_code].filter(Boolean).join(', ')}`,
    `商品：${items.map((r) => `${r.name}×${r.quantity} US$${(Number(r.price_cents) * Number(r.quantity) / 100).toFixed(2)}`).join('; ')}`,
    `应付：US$${(totalCents / 100).toFixed(2)}${couponCode ? `（优惠 ${(discountCents / 100).toFixed(2)}）` : ''}`,
    `备注：${b?.note || '无'}`,
    '请到运营中台「订单」确认收款并安排发货。',
  ]);
  // 客户自动通知：订单确认函（发件人 xyong@xyong.ccwu.cc）
  await sendMail(env, String(c.email), `订单已确认 ${no} · XYONG 云南精品园`, [
    `尊敬的 ${c.name}，您好！`,
    `感谢您在 XYONG 云南精品园下单，订单号 ${no}。`,
    '',
    `商品清单：${items.map((r) => `${r.name} × ${Math.floor(Number(r.quantity))}`).join('；')}`,
    `订单金额：US$${(totalCents / 100).toFixed(2)}${couponCode ? `（含优惠 ${couponCode}）` : ''}`,
    `收货地址：${[c.address, c.city, c.province, c.country, c.postal_code].filter(Boolean).join(', ')}`,
    '',
    '我们确认收款后将于 1-2 个工作日内为您安排发货，发货后会将物流单号发送至本邮箱。',
    '如有任何疑问，直接回复本邮件即可。',
  ]);
  return {
    ok: true as const, order_no: no, currency: 'USD' as const,
    subtotal_usd: subtotalCents / 100, discount_usd: discountCents / 100, total_usd: totalCents / 100,
    payment_provider: 'pending_online',
  };
}

export default {
  async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext) {
    await runGrowthAgent(env);
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = corsOrigin(request, env);
    if (request.method === 'OPTIONS') return new Response(null, { headers: { 'access-control-allow-origin': origin, 'access-control-allow-headers': 'Content-Type, Authorization', 'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS' } });
    const url = new URL(request.url);

    // Private R2-backed media gateway. Objects remain private in R2.
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

    if (url.pathname === '/api/health') return json({ ok: true, service: 'xyong-commerce-api', version: '3.0.0' }, 200, origin);

    // ================= 手机端实地采集页 =================
    if (url.pathname === '/field' || url.pathname === '/field/') {
      return new Response(FIELD_PAGE_HTML, { headers: { 'content-type': 'text/html; charset=utf-8' } });
    }

    if (url.pathname === '/api/field/ping' && request.method === 'POST') {
      const ok = await authorized(request, env);
      return json({ ok }, ok ? 200 : 401, origin);
    }

    // 提交实地采集报告（手机端）
    if (url.pathname === '/api/field/reports' && request.method === 'POST') {
      if (!await authorized(request, env)) return json({ error: 'Unauthorized' }, 401, origin);
      const body: any = await request.json().catch(() => ({}));
      const category = String(body.category || '');
      const data = body.data || {};
      const name = String(data.name_zh || data.name_en || '').trim();
      if (!['coffee', 'tea', 'truffle', 'oil'].includes(category)) return json({ error: '无效的产品类别' }, 400, origin);
      if (!name) return json({ error: '缺少产品名称' }, 400, origin);
      const id = 'FR-' + Date.now().toString(36).toUpperCase() + '-' + rid().slice(0, 4).toUpperCase();
      const photos: any[] = [];
      for (const p of (body.photos || []).slice(0, 30)) {
        if (!p?.b64) continue;
        const key = `field/${id}/${p.slot || 'photo'}-${photos.length}-${Date.now()}.jpg`;
        try {
          const bytes = Uint8Array.from(atob(String(p.b64)), (ch) => ch.charCodeAt(0));
          await env.ASSETS.put(key, bytes, { httpMetadata: { contentType: 'image/jpeg' } });
          photos.push({ slot: String(p.slot || 'extra'), key, url: `/media/${key}` });
        } catch { /* 单张失败不阻塞 */ }
      }
      const docs: any[] = [];
      for (const d of (body.docs || []).slice(0, 20)) {
        const files: any[] = [];
        for (const f of (d.files || []).slice(0, 6)) {
          if (!f?.b64) continue;
          const ext = String(f.mime || '').includes('pdf') ? 'pdf' : 'jpg';
          const key = `field/${id}/doc-${docs.length}-${files.length}-${Date.now()}.${ext}`;
          try {
            const bytes = Uint8Array.from(atob(String(f.b64)), (ch) => ch.charCodeAt(0));
            await env.ASSETS.put(key, bytes, { httpMetadata: { contentType: f.mime || 'application/octet-stream' } });
            files.push({ name: String(f.name || '文件'), mime: String(f.mime || ''), key, url: `/media/${key}` });
          } catch { /* 跳过 */ }
        }
        docs.push({ type: String(d.type || ''), no: String(d.no || ''), issuer: String(d.issuer || ''), expiry: String(d.expiry || ''), files });
      }
      await env.DB.prepare(`INSERT INTO field_reports (id,category,product_name,data_json,photos_json,docs_json,status) VALUES (?,?,?,?,?,?,'submitted')`)
        .bind(id, category, name, JSON.stringify(data), JSON.stringify(photos), JSON.stringify(docs)).run();
      await notifyOwner(env, '新实地采集报告：' + name, [
        `编号：${id}`,
        `类别：${category}`,
        `地点：${String(data.origin || '')}`,
        `照片 ${photos.length} 张 / 合规文件 ${docs.length} 份`,
        '请到运营中台「实地采集」页审核并转为商品。',
      ]);
      return json({ ok: true, id, photos: photos.length, docs: docs.length }, 201, origin);
    }

    // 手机端查看自己提交过的报告
    if (url.pathname === '/api/field/reports' && request.method === 'GET') {
      if (!await authorized(request, env)) return json({ error: 'Unauthorized' }, 401, origin);
      const { results } = await env.DB.prepare(`SELECT id,category,product_name,status,created_at FROM field_reports ORDER BY created_at DESC LIMIT 20`).all();
      return json({ reports: results }, 200, origin);
    }


    // ================= 商城公开接口 =================
    if (url.pathname === '/api/store/products' && request.method === 'GET') {
      const { results } = await env.DB.prepare(
        `SELECT p.id AS id, p.sku AS sku,
                p.name AS name, p.name AS name_zh, p.name AS name_en,
                c.slug AS category, c.name AS brand_name,
                p.origin AS origin, p.altitude AS altitude, p.unit AS unit, p.weight AS weight,
                p.description AS description, p.description AS description_zh, p.description AS description_en,
                p.selling_points AS selling_points,
                ROUND(p.price_cents / 100.0, 2) AS price_usd, p.price_cents AS price_cents,
                COALESCE(p.currency, 'USD') AS currency,
                p.cover_url AS cover_url, p.cover_url AS image_url,
                COALESCE(i.on_hand - i.reserved, 0) AS available_qty
           FROM products p
           JOIN categories c ON c.id = p.category_id
           LEFT JOIN inventory i ON i.product_id = p.id
          WHERE p.status = 'published' AND c.active = 1
          ORDER BY p.category_id, p.id`
      ).all();
      return json({ products: results, currency: 'USD' }, 200, origin);
    }

    // ---------- 服务端购物车（cart_items 表） ----------
    if (url.pathname === '/api/cart' && request.method === 'GET') {
      const sessionId = url.searchParams.get('session_id') || '';
      if (!sessionId) return json({ error: 'session_id required' }, 400, origin);
      const { results } = await env.DB.prepare(
        `SELECT CAST(ci.product_id AS INTEGER) AS product_id, ci.quantity, p.sku, p.name, p.price_cents, ROUND(p.price_cents/100.0,2) AS price_usd,
                p.cover_url AS image_url, COALESCE(p.currency,'USD') AS currency,
                COALESCE(i.on_hand - i.reserved, 0) AS available_qty
           FROM cart_items ci
           JOIN products p ON p.id = ci.product_id
           LEFT JOIN inventory i ON i.product_id = p.id
          WHERE ci.session_id = ? AND p.status='published'
          ORDER BY ci.created_at`
      ).bind(sessionId).all();
      return json({ items: results, currency: 'USD' }, 200, origin);
    }

    if (url.pathname === '/api/cart' && request.method === 'POST') {
      const b = await body(request);
      if (!b?.session_id || !b?.product_id) return json({ error: 'session_id / product_id required' }, 400, origin);
      const qty = Math.max(1, Math.floor(Number(b.quantity ?? 1)));
      const prod = await env.DB.prepare(`SELECT id FROM products WHERE id=? AND status='published'`).bind(String(b.product_id)).first<any>();
      if (!prod) return json({ error: '商品不存在或未上架' }, 404, origin);
      // 先设置数量（含替换语义），否则累加
      if (b.set_quantity) {
        if (qty <= 0) {
          await env.DB.prepare(`DELETE FROM cart_items WHERE session_id=? AND product_id=?`).bind(String(b.session_id), prod.id).run();
          return json({ ok: true, removed: true }, 200, origin);
        }
        const existing = await env.DB.prepare(`SELECT id FROM cart_items WHERE session_id=? AND product_id=?`).bind(String(b.session_id), prod.id).first<any>();
        if (existing) {
          await env.DB.prepare(`UPDATE cart_items SET quantity=? WHERE id=?`).bind(qty, existing.id).run();
          return json({ ok: true }, 200, origin);
        }
        await env.DB.prepare(`INSERT INTO cart_items (id,session_id,product_id,quantity) VALUES (?,?,?,?)`).bind(rid(), String(b.session_id), prod.id, qty).run();
        return json({ ok: true }, 201, origin);
      }
      const existing = await env.DB.prepare(`SELECT id,quantity FROM cart_items WHERE session_id=? AND product_id=?`).bind(String(b.session_id), prod.id).first<any>();
      if (existing) {
        await env.DB.prepare(`UPDATE cart_items SET quantity=quantity+? WHERE id=?`).bind(qty, existing.id).run();
        return json({ ok: true, quantity: Number(existing.quantity) + qty }, 200, origin);
      }
      await env.DB.prepare(`INSERT INTO cart_items (id,session_id,product_id,quantity) VALUES (?,?,?,?)`).bind(rid(), String(b.session_id), prod.id, qty).run();
      return json({ ok: true, quantity: qty }, 201, origin);
    }

    if (url.pathname === '/api/cart' && request.method === 'DELETE') {
      const sessionId = url.searchParams.get('session_id') || '';
      const productId = url.searchParams.get('product_id') || '';
      if (!sessionId) return json({ error: 'session_id required' }, 400, origin);
      if (productId) {
        await env.DB.prepare(`DELETE FROM cart_items WHERE session_id=? AND product_id=?`).bind(sessionId, productId).run();
      } else {
        await env.DB.prepare(`DELETE FROM cart_items WHERE session_id=?`).bind(sessionId).run();
      }
      return json({ ok: true }, 200, origin);
    }

    // ---------- 结账：建订单 + 支付占位 + 锁库存 ----------
    if (url.pathname === '/api/checkout' && request.method === 'POST') {
      const b = await body(request);
      const result = await performCheckout(env, b);
      if ('error' in result) return json({ error: result.error }, result.status, origin);
      return json(result, 201, origin);
    }

    if (url.pathname === '/api/coupons/validate' && request.method === 'POST') {
      const b = await body(request);
      const code = String(b?.code || '').trim().toUpperCase();
      if (!code) return json({ valid: false, error: '请输入优惠码' }, 400, origin);
      const coupon = await env.DB.prepare(`SELECT code,type,value,min_subtotal FROM coupons WHERE UPPER(code)=? AND is_active=1 AND (starts_at IS NULL OR starts_at<=datetime('now')) AND (ends_at IS NULL OR ends_at>=datetime('now')) AND (max_uses IS NULL OR used_count<max_uses)`).bind(code).first<any>();
      if (!coupon) return json({ valid: false, error: '优惠券无效或已过期' }, 404, origin);
      return json({ valid: true, code: coupon.code, type: coupon.type, value: coupon.value, min_subtotal_usd: Number(coupon.min_subtotal || 0) / 100 }, 200, origin);
    }

    // ---------- 订阅 / 联系表单 → leads ----------
    if (url.pathname === '/api/subscribe' && request.method === 'POST') {
      const b = await body(request);
      const email = String(b?.email || '').trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: '请输入有效邮箱' }, 400, origin);
      const existing = await env.DB.prepare(`SELECT id FROM leads WHERE email=?`).bind(email).first<any>();
      if (existing) {
        await env.DB.prepare(`INSERT INTO lead_events (id,lead_id,event_type,channel,metadata_json) VALUES (?,?,?,?,?)`)
          .bind(rid(), existing.id, 'newsletter_resubscribe', 'newsletter', '{}').run();
        return json({ ok: true, duplicate: true }, 200, origin);
      }
      const id = rid();
      await env.DB.prepare(`INSERT INTO leads (id,email,name,country,source,source_detail,stage,score,consent) VALUES (?,?,?,?,?,?,?,5,?)`)
        .bind(id, email, String(b?.name || null), String(b?.country || null), 'newsletter', 'storefront_footer_subscribe', 'new', b?.consent ? 1 : 0).run();
      await env.DB.prepare(`INSERT INTO lead_events (id,lead_id,event_type,channel,metadata_json) VALUES (?,?,?,?,?)`)
        .bind(rid(), id, 'lead_created', 'newsletter', '{}').run();
      await notifyOwner(env, '新订阅用户', [`邮箱：${email}`, `来源：商城页脚订阅`]);
      return json({ ok: true, lead_id: id }, 201, origin);
    }

    if (url.pathname === '/api/contact' && request.method === 'POST') {
      const b = await body(request);
      if (!b?.email && !b?.message) return json({ error: '请留下邮箱或留言' }, 400, origin);
      const id = rid();
      await env.DB.prepare(`INSERT INTO leads (id,email,name,country,source,source_detail,stage,score,notes,consent) VALUES (?,?,?,?,?,?,?,?,?,?)`)
        .bind(id, String(b.email || null), String(b.name || null), String(b.country || null), 'contact', 'storefront_contact_form', 'new', 10, String(b.message || ''), 0).run();
      await env.DB.prepare(`INSERT INTO lead_events (id,lead_id,event_type,channel,metadata_json) VALUES (?,?,?,?,?)`)
        .bind(rid(), id, 'inquiry', 'contact_form', JSON.stringify({ message: String(b.message || '') })).run();
      await notifyOwner(env, '新表单咨询', [
        `姓名：${b.name || '未填'}`, `邮箱：${b.email || '未填'}`,
        `国家：${b.country || '未填'}`, `留言：${b.message || '（空）'}`,
      ]);
      return json({ ok: true }, 201, origin);
    }

    if (url.pathname === '/api/acquisition/event' && request.method === 'POST') {
      const b = await body(request); if (!b?.event_type) return json({error:'event_type required'},400,origin);
      await env.DB.prepare(`INSERT INTO acquisition_events (id,session_id,source,medium,campaign,landing_path,event_type,product_sku,value_usd,metadata_json) VALUES (?,?,?,?,?,?,?,?,?,?)`)
        .bind(rid(), b.session_id||null,b.source||'direct',b.medium||null,b.campaign||null,b.landing_path||null,b.event_type,b.product_sku||null,Number(b.value_usd||0),JSON.stringify(b.metadata||{})).run();
      return json({ok:true},201,origin);
    }

    if (url.pathname === '/api/leads' && request.method === 'POST') {
      const b = await body(request); if (!b?.source) return json({error:'source required'},400,origin);
      const id=rid();
      await env.DB.prepare(`INSERT INTO leads (id,email,name,country,source,source_detail,interest_category,interest_sku,stage,score,notes,consent) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`)
        .bind(id,b.email||null,b.name||null,b.country||null,b.source,b.source_detail||null,b.interest_category||null,b.interest_sku||null,'new',Math.max(0,Math.min(100,Number(b.score||0))),b.notes||null,b.consent?1:0).run();
      await env.DB.prepare(`INSERT INTO lead_events (id,lead_id,event_type,channel,campaign_id,metadata_json) VALUES (?,?,?,?,?,?)`)
        .bind(rid(),id,'lead_created',b.source,b.campaign_id||null,JSON.stringify(b.metadata||{})).run();
      return json({ok:true,lead_id:id},201,origin);
    }

    // ================= 运营中台接口 =================
    if (url.pathname === '/api/ops/dashboard' && request.method === 'GET') {
      if(!await authorized(request,env)) return json({error:'Unauthorized'},401,origin);
      const [orders,inventory,products,leads,campaigns,tasks,acq,recent,payments,ship]=await Promise.all([
        env.DB.prepare(`SELECT status,COUNT(*) AS count,ROUND(SUM(total_cents)/100.0,2) AS total_usd FROM orders GROUP BY status`).all(),
        env.DB.prepare(`SELECT COUNT(*) AS products,SUM(on_hand) AS units,SUM(reserved) AS reserved FROM inventory`).first(),
        env.DB.prepare(`SELECT COUNT(*) AS count FROM products WHERE status='published'`).first(),
        env.DB.prepare(`SELECT COUNT(*) AS total,SUM(CASE WHEN stage='new' THEN 1 ELSE 0 END) AS new_count,SUM(CASE WHEN stage='warm' THEN 1 ELSE 0 END) AS warm_count FROM leads`).first(),
        env.DB.prepare(`SELECT COUNT(*) AS total,SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) AS active FROM campaigns`).first(),
        env.DB.prepare(`SELECT COUNT(*) AS open_count,SUM(CASE WHEN priority='high' THEN 1 ELSE 0 END) AS high_count FROM agent_tasks WHERE status='open'`).first(),
        env.DB.prepare(`SELECT source,COUNT(*) AS events,SUM(CASE WHEN event_type='purchase' THEN 1 ELSE 0 END) AS purchases FROM acquisition_events GROUP BY source ORDER BY events DESC LIMIT 10`).all(),
        env.DB.prepare(`SELECT id,order_no,customer_name,customer_email,status,total_cents,ROUND(total_cents/100.0,2) AS total_usd,created_at FROM orders ORDER BY id DESC LIMIT 10`).all(),
        env.DB.prepare(`SELECT status,COUNT(*) AS count,ROUND(SUM(amount),2) AS total_usd FROM payments GROUP BY status`).all(),
        env.DB.prepare(`SELECT status,COUNT(*) AS count FROM shipments GROUP BY status`).all(),
      ]);
      return json({currency:'USD',orders:orders.results,inventory,products,leads,campaigns,tasks,acquisition:acq.results,recent_orders:recent.results,payments:payments.results,shipments:ship.results},200,origin);
    }

    // ---------- 订单 + 发货 ----------
    if (url.pathname === '/api/ops/orders' && request.method === 'GET') {
      if(!await authorized(request,env)) return json({error:'Unauthorized'},401,origin);
      const {results} = await env.DB.prepare(
        `SELECT o.id,o.order_no,o.customer_name,o.customer_phone,o.customer_email,o.shipping_address,o.status,o.total_cents,
                ROUND(o.total_cents/100.0,2) AS total_usd,o.note,o.created_at,
                pay.provider AS payment_provider,pay.status AS payment_status,
                sh.carrier,sh.tracking_number,sh.status AS shipment_status
           FROM orders o
           LEFT JOIN payments pay ON CAST(pay.order_id AS INTEGER)=o.id
           LEFT JOIN shipments sh ON CAST(sh.order_id AS INTEGER)=o.id
          ORDER BY o.id DESC LIMIT 200`
      ).all();
      const items = await env.DB.prepare(
        `SELECT oi.order_id,oi.quantity,ROUND(oi.unit_price_cents/100.0,2) AS unit_usd,oi.line_total_cents,p.sku,p.name
           FROM order_items oi JOIN products p ON p.id=oi.product_id`
      ).all();
      const byOrder: Record<number, string[]> = {};
      for (const it of items.results as any[]) {
        (byOrder[it.order_id] ||= []).push(`${it.name}×${it.quantity}(US$${it.line_total_cents/100})`);
      }
      return json({ orders: results.map((o: any) => ({ ...o, items_summary: (byOrder[o.id] || []).join('; ') })), currency: 'USD' }, 200, origin);
    }

    if (url.pathname.startsWith('/api/ops/orders/') && request.method === 'PATCH') {
      if(!await authorized(request,env)) return json({error:'Unauthorized'},401,origin);
      const id = Number(url.pathname.split('/').pop());
      if (!Number.isFinite(id)) return json({ error: 'Invalid order id' }, 400, origin);
      const b = await body(request);
      const status = b?.status;
      if (!['pending','processing','shipped','completed','cancelled','refunded'].includes(status)) return json({ error: 'Invalid status' }, 400, origin);
      const order = await env.DB.prepare(`SELECT id,status FROM orders WHERE id=?`).bind(id).first<any>();
      if (!order) return json({ error: '订单不存在' }, 404, origin);
      const items = await env.DB.prepare(`SELECT product_id,quantity FROM order_items WHERE order_id=?`).bind(id).all<any>();

      // 状态流转联动库存：pending→cancelled 释放预留；→shipped/completed 扣减在库并释放预留。
      if (status === 'cancelled' && ['pending','processing'].includes(order.status)) {
        await env.DB.batch([
          env.DB.prepare(`UPDATE orders SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(status, id),
          ...items.results.map((r: any) => env.DB.prepare(`UPDATE inventory SET reserved = MAX(0, reserved - ?) WHERE product_id=?`).bind(Math.floor(Number(r.quantity)), r.product_id)),
        ]);
      } else if (status === 'refunded') {
        await env.DB.batch([
          env.DB.prepare(`UPDATE orders SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(status, id),
          ...items.results.map((r: any) => env.DB.prepare(`UPDATE inventory SET on_hand = MAX(0, on_hand - ?), reserved = MAX(0, reserved - ?) WHERE product_id=?`).bind(Math.floor(Number(r.quantity)), Math.floor(Number(r.quantity)), r.product_id)),
        ]);
      } else {
        await env.DB.prepare(`UPDATE orders SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(status, id).run();
      }

      // 发货信息（可选一并保存）。先记录本次保存前是否已发过货（用于发货邮件判重）
      const shippedBefore = await env.DB.prepare(`SELECT shipped_at FROM shipments WHERE order_id=?`).bind(String(id)).first<any>();
      if (b?.carrier) {
        const existing = await env.DB.prepare(`SELECT id FROM shipments WHERE order_id=?`).bind(String(id)).first<any>();
        if (existing) {
          await env.DB.prepare(`UPDATE shipments SET carrier=?,tracking_number=?,status=?,shipped_at=COALESCE(shipped_at, CASE WHEN ?='shipped' THEN datetime('now') END) WHERE id=?`)
            .bind(b.carrier, b.tracking_number || null, b.shipment_status || 'created', status, existing.id).run();
        } else {
          await env.DB.prepare(`INSERT INTO shipments (id,order_id,carrier,tracking_number,status,shipped_at) VALUES (?,?,?,?,?,CASE WHEN ?='shipped' THEN datetime('now') END)`)
            .bind(rid(), String(id), b.carrier, b.tracking_number || null, b.shipment_status || 'created', status).run();
        }
      }
      if (status === 'completed') {
        await env.DB.prepare(`UPDATE shipments SET status='delivered',delivered_at=datetime('now') WHERE order_id=? AND delivered_at IS NULL`).bind(String(id)).run();
      }
      // 客户自动通知：发货邮件（状态转为 shipped 且填了物流信息时发送）
      if (status === 'shipped' && !shippedBefore?.shipped_at && (b?.carrier || b?.tracking_number)) {
        const full = await env.DB.prepare(`SELECT order_no,customer_name,customer_email,note FROM orders WHERE id=?`).bind(id).first<any>();
        if (full?.customer_email) {
          const sent = await sendMail(env, String(full.customer_email), `您的订单已发货 ${full.order_no} · XYONG 云南精品园`, [
            `尊敬的 ${full.customer_name}，您好！`,
            `您的订单 ${full.order_no} 已发出，物流信息如下：`,
            '',
            `承运商：${b?.carrier || '国际快递'}`,
            `运单号：${b?.tracking_number || '稍后提供'}`,
            '',
            '您可凭运单号在承运商官网查询实时轨迹。包裹签收后如有任何问题，欢迎随时回复本邮件联系客服。',
          ]);
          if (sent) await env.DB.prepare(`UPDATE orders SET note=COALESCE(note||' | ','')||'发货邮件已发:'||datetime('now') WHERE id=?`).bind(id).run();
        }
      }
      return json({ ok: true, id, status }, 200, origin);
    }

    // ---------- 支付记录 ----------
    if (url.pathname === '/api/ops/payments' && request.method === 'GET') {
      if(!await authorized(request,env)) return json({error:'Unauthorized'},401,origin);
      const {results} = await env.DB.prepare(
        `SELECT pay.id,pay.order_id,o.order_no,pay.provider,pay.transaction_id,pay.amount,ROUND(pay.amount,2) AS amount_usd,pay.currency,pay.status,pay.created_at
           FROM payments pay LEFT JOIN orders o ON o.id=CAST(pay.order_id AS INTEGER) ORDER BY pay.created_at DESC LIMIT 200`
      ).all();
      return json({ payments: results, currency: 'USD' }, 200, origin);
    }

    if (url.pathname.startsWith('/api/ops/payments/') && request.method === 'PATCH') {
      if(!await authorized(request,env)) return json({error:'Unauthorized'},401,origin);
      const id = url.pathname.split('/').pop();
      const b = await body(request);
      const status = b?.status;
      if (!['pending','paid','failed','refunded'].includes(status)) return json({ error: 'Invalid status' }, 400, origin);
      const pay = await env.DB.prepare(`SELECT order_id FROM payments WHERE id=?`).bind(id).first<any>();
      if (!pay) return json({ error: '支付记录不存在' }, 404, origin);
      await env.DB.prepare(`UPDATE payments SET status=?,transaction_id=COALESCE(?,transaction_id) WHERE id=?`).bind(status, b?.transaction_id || null, id).run();
      if (status === 'paid') {
        const order = await env.DB.prepare(`SELECT id,status FROM orders WHERE id=CAST(? AS INTEGER)`).bind(pay.order_id).first<any>();
        if (order && order.status === 'pending') {
          await env.DB.prepare(`UPDATE orders SET status='processing',updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(order.id).run();
        }
      }
      return json({ ok: true }, 200, origin);
    }

    // ---------- 客户管理 ----------
    if (url.pathname === '/api/ops/customers' && request.method === 'GET') {
      if(!await authorized(request,env)) return json({error:'Unauthorized'},401,origin);
      const {results} = await env.DB.prepare(
        `SELECT cu.id,cu.email,cu.first_name,cu.last_name,cu.country,cu.language,cu.source,cu.marketing_consent,cu.created_at,
                COUNT(o.id) AS order_count, ROUND(COALESCE(SUM(o.total_cents),0)/100.0,2) AS lifetime_usd, MAX(o.created_at) AS last_order_at
           FROM customers cu LEFT JOIN orders o ON o.customer_email = cu.email
          GROUP BY cu.id ORDER BY lifetime_usd DESC, cu.created_at DESC LIMIT 200`
      ).all();
      return json({ customers: results, currency: 'USD' }, 200, origin);
    }

    if (url.pathname === '/api/ops/customers' && request.method === 'POST') {
      if(!await authorized(request,env)) return json({error:'Unauthorized'},401,origin);
      const b = await body(request);
      if (!b?.email) return json({ error: 'email 必填' }, 400, origin);
      const existing = await env.DB.prepare(`SELECT id FROM customers WHERE email=?`).bind(String(b.email).toLowerCase()).first<any>();
      if (existing) return json({ ok: true, id: existing.id, duplicate: true }, 200, origin);
      const id = rid();
      await env.DB.prepare(`INSERT INTO customers (id,email,first_name,last_name,country,language,marketing_consent,source) VALUES (?,?,?,?,?,?,?,?)`)
        .bind(id, String(b.email).toLowerCase(), b.first_name || null, b.last_name || null, b.country || null, b.language || 'zh', b.marketing_consent ? 1 : 0, 'ops_manual').run();
      return json({ ok: true, id }, 201, origin);
    }

    if (url.pathname.startsWith('/api/ops/customers/') && request.method === 'PATCH') {
      if(!await authorized(request,env)) return json({error:'Unauthorized'},401,origin);
      const id = url.pathname.split('/').pop();
      const b = await body(request) || {};
      const sets: string[] = []; const vals: any[] = [];
      if (b.first_name !== undefined) { sets.push('first_name=?'); vals.push(b.first_name); }
      if (b.last_name !== undefined) { sets.push('last_name=?'); vals.push(b.last_name); }
      if (b.country !== undefined) { sets.push('country=?'); vals.push(b.country); }
      if (b.marketing_consent !== undefined) { sets.push('marketing_consent=?'); vals.push(b.marketing_consent ? 1 : 0); }
      if (sets.length) {
        sets.push('updated_at=CURRENT_TIMESTAMP');
        await env.DB.prepare(`UPDATE customers SET ${sets.join(',')} WHERE id=?`).bind(...vals, id).run();
      }
      return json({ ok: true }, 200, origin);
    }

    // ---------- 线索 / 订阅 ----------
    if (url.pathname === '/api/ops/leads' && request.method === 'GET') {
      if(!await authorized(request,env)) return json({error:'Unauthorized'},401,origin);
      const {results} = await env.DB.prepare(
        `SELECT l.id,l.email,l.name,l.country,l.source,l.source_detail,l.stage,l.score,l.notes,l.consent,l.created_at,
                (SELECT COUNT(*) FROM lead_events e WHERE e.lead_id=l.id) AS event_count
           FROM leads l ORDER BY l.created_at DESC LIMIT 200`
      ).all();
      return json({ leads: results }, 200, origin);
    }

    if (url.pathname.startsWith('/api/ops/leads/') && request.method === 'PATCH') {
      if(!await authorized(request,env)) return json({error:'Unauthorized'},401,origin);
      const id = url.pathname.split('/').pop();
      const b = await body(request);
      const stage = b?.stage;
      if (!['new','warm','hot','customer','lost'].includes(stage)) return json({ error: 'Invalid stage' }, 400, origin);
      await env.DB.prepare(`UPDATE leads SET stage=?,updated_at=CURRENT_TIMESTAMP,last_touch_at=datetime('now') WHERE id=?`).bind(stage, id).run();
      await env.DB.prepare(`INSERT INTO lead_events (id,lead_id,event_type,channel,metadata_json) VALUES (?,?,?,?,?)`)
        .bind(rid(), id, 'stage_changed', 'ops', JSON.stringify({ stage })).run();
      return json({ ok: true }, 200, origin);
    }

    // ---------- 优惠券 ----------
    if (url.pathname === '/api/ops/coupons' && request.method === 'GET') {
      if(!await authorized(request,env)) return json({error:'Unauthorized'},401,origin);
      const {results} = await env.DB.prepare(`SELECT id,code,type,value,min_subtotal,max_uses,used_count,is_active,ends_at,created_at FROM coupons ORDER BY created_at DESC LIMIT 100`).all();
      return json({ coupons: results }, 200, origin);
    }

    if (url.pathname === '/api/ops/coupons' && request.method === 'POST') {
      if(!await authorized(request,env)) return json({error:'Unauthorized'},401,origin);
      const b = await body(request);
      const code = String(b?.code || '').trim().toUpperCase();
      if (!code) return json({ error: 'code 必填' }, 400, origin);
      const type = b.type === 'fixed' ? 'fixed' : 'percentage';
      const value = Number(b.value || 0);
      if (!Number.isFinite(value) || value <= 0) return json({ error: 'value 必须大于 0（百分比 1-100，或固定美元金额）' }, 400, origin);
      if (type === 'percentage' && value > 100) return json({ error: '百分比折扣不能超过 100' }, 400, origin);
      try {
        await env.DB.prepare(`INSERT INTO coupons (id,code,type,value,min_subtotal,max_uses,ends_at,is_active) VALUES (?,?,?,?,?,?,?,?)`)
          .bind(rid(), code, type, value, Math.round(Number(b.min_subtotal_usd || 0) * 100), b.max_uses ? Math.floor(Number(b.max_uses)) : null, b.ends_at || null, b.is_active === false ? 0 : 1).run();
      } catch {
        return json({ error: '优惠码已存在' }, 409, origin);
      }
      return json({ ok: true, code }, 201, origin);
    }

    if (url.pathname.startsWith('/api/ops/coupons/') && request.method === 'PATCH') {
      if(!await authorized(request,env)) return json({error:'Unauthorized'},401,origin);
      const id = url.pathname.split('/').pop();
      const b = await body(request) || {};
      await env.DB.prepare(`UPDATE coupons SET is_active=? WHERE id=?`).bind(b.is_active ? 1 : 0, id).run();
      return json({ ok: true }, 200, origin);
    }

    // ---------- 评论 ----------
    if (url.pathname === '/api/ops/reviews' && request.method === 'GET') {
      if(!await authorized(request,env)) return json({error:'Unauthorized'},401,origin);
      const {results} = await env.DB.prepare(
        `SELECT r.id,r.product_id,p.name AS product_name,r.rating,r.title,r.content,r.is_published,r.created_at
           FROM reviews r LEFT JOIN products p ON CAST(r.product_id AS INTEGER)=p.id ORDER BY r.created_at DESC LIMIT 100`
      ).all();
      return json({ reviews: results }, 200, origin);
    }

    if (url.pathname.startsWith('/api/ops/reviews/') && request.method === 'PATCH') {
      if(!await authorized(request,env)) return json({error:'Unauthorized'},401,origin);
      const id = url.pathname.split('/').pop();
      const b = await body(request) || {};
      await env.DB.prepare(`UPDATE reviews SET is_published=? WHERE id=?`).bind(b.is_published ? 1 : 0, id).run();
      return json({ ok: true }, 200, origin);
    }

    // ---------- 产品采集：抓取供应商页面 → 解析 → 图片入 R2 → 建草稿商品 ----------
    if (url.pathname === '/api/ops/import' && request.method === 'POST') {
      if(!await authorized(request,env)) return json({error:'Unauthorized'},401,origin);
      const b = await body(request);
      const target = String(b?.url || '').trim();
      if (!/^https?:\/\//i.test(target)) return json({ error: '请提供 http(s) 开头的商品页链接' }, 400, origin);
      let html = '';
      let source: 'direct' | 'reader' | 'html' = 'direct';
      const UA = 'Mozilla/5.0 (compatible; XYONG-Importer/1.0)';
      try {
        const resp = await fetch(target, { headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml' }, redirect: 'follow' });
        if (resp.ok) html = await resp.text();
        if (!html) throw new Error(`HTTP ${resp.status}`);
      } catch {
        // 兜底通道：目标站 TLS 直连失败时，依次尝试公开只读代理（均免费、无需密钥）
        const proxies: Array<{ name: string; build: (u: string) => string; mode: 'reader' | 'html' }> = [
          { name: 'reader', build: (u) => `https://r.jina.ai/${u}`, mode: 'reader' },
          { name: 'allorigins', build: (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`, mode: 'html' },
          { name: 'codetabs', build: (u) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`, mode: 'html' },
        ];
        const failures: string[] = [];
        for (const proxy of proxies) {
          try {
            const proxied = await fetch(proxy.build(target), { headers: { 'user-agent': UA, accept: 'text/plain,text/html' }, redirect: 'follow' });
            if (!proxied.ok) { failures.push(`${proxy.name}:${proxied.status}`); continue; }
            const text = await proxied.text();
            if (text.length < 120) { failures.push(`${proxy.name}:empty`); continue; }
            html = text;
            source = proxy.mode;
            break;
          } catch {
            failures.push(`${proxy.name}:err`);
          }
        }
        if (!html) {
          return json({
            error: '源页面不可访问，自动代理也未取回内容。',
            detail: failures.join(', '),
            hint: '可改用「手工录入 + 图片上传」方式上架，或在商品管理里直接粘贴图片地址。',
          }, 502, origin);
        }
      }
      const meta = (prop: string) => {
        const p1 = new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i').exec(html)?.[1];
        const p2 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`, 'i').exec(html)?.[1];
        return (p1 || p2 || '').trim();
      };
      const decode = (s: string) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');
      const cleanMd = (s: string) => s.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[*_`#>]/g, ' ').replace(/\s+/g, ' ').trim();

      let title = '';
      let description = '';
      if (source === 'reader') {
        const mdTitle = html.match(/^Title:\s*(.+)$/m)?.[1] || html.match(/^#\s+(.+)$/m)?.[1] || '';
        title = cleanMd(mdTitle).slice(0, 200);
        const paragraphs = html.split(/\r?\n/).map((l) => l.trim())
          .filter((l) => l && !l.startsWith('#') && !l.startsWith('!') && !l.startsWith('URL:') && !l.startsWith('Markdown Content'));
        description = cleanMd(paragraphs.slice(0, 3).join(' ')).slice(0, 600);
      } else {
        title = decode(meta('og:title') || html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || '').slice(0, 200);
        description = decode(meta('og:description') || meta('description') || '').slice(0, 1000);
      }

      const imageUrls: string[] = [];
      const pushImg = (url: string) => {
        try {
          const abs = new URL(decode(url), target).toString();
          if (/\.(jpg|jpeg|png|webp)(\?|$)/i.test(abs) && !imageUrls.includes(abs)) imageUrls.push(abs);
        } catch { /* skip */ }
      };
      if (source === 'reader') {
        for (const m of html.matchAll(/!\[[^\]]*\]\(([^)\s]+)\)/g)) pushImg(m[1]);
        for (const m of html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)) pushImg(m[1]);
      } else {
        const ogImg = meta('og:image');
        if (ogImg) pushImg(ogImg);
        for (const m of html.matchAll(/<img[^>]+(?:data-src|src)=["']([^"']+)["']/gi)) pushImg(m[1]);
      }
      imageUrls.splice(8);

      // 价格粗提取（供参考，金额必须人工确认后上架）
      const priceHints = [...html.matchAll(/(?:US?\$|USD|￥|¥|CNY)\s?([0-9][0-9,.]{0,12})/g)].slice(0, 8).map(m => m[1]);

      // 下载首图入 R2（直连失败时走公开图片代理兜底）
      let coverUrl: string | null = null;
      for (const candidate of imageUrls.slice(0, 3)) {
        if (coverUrl) break;
        for (const imgUrl of [candidate, `https://images.weserv.nl/?url=${encodeURIComponent(candidate.replace(/^https?:\/\//, ''))}`]) {
          try {
            const imgResp = await fetch(imgUrl, { headers: { 'user-agent': UA }, redirect: 'follow' });
            if (!imgResp.ok) continue;
            const contentType = imgResp.headers.get('content-type') || 'image/jpeg';
            if (!contentType.startsWith('image/')) continue;
            const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
            const key = `import/${Date.now()}-${rid().slice(0, 8)}.${ext}`;
            await env.ASSETS.put(key, await imgResp.arrayBuffer(), { httpMetadata: { contentType } });
            coverUrl = `/media/import/${key.split('/')[1]}`;
            break;
          } catch { /* try next */ }
        }
      }

      const sku = `IMP-${Date.now().toString(36).toUpperCase()}`;
      const catSlug = String(b?.category || 'coffee');
      const cat = await env.DB.prepare(`SELECT id FROM categories WHERE slug=?`).bind(catSlug).first<any>();
      await env.DB.prepare(`INSERT INTO products (sku,name,category_id,description,unit,price_cents,cost_cents,status,cover_url,currency) VALUES (?,?,?,?,?,?,0,'draft',?,'USD')`)
        .bind(sku, title || '未命名采集商品', cat?.id || 1, description || null, '件', 0, coverUrl).run();
      const created = await env.DB.prepare(`SELECT id FROM products WHERE sku=?`).bind(sku).first<any>();
      await env.DB.prepare(`INSERT INTO inventory (product_id,on_hand,reserved) VALUES (?,0,0) ON CONFLICT(product_id) DO NOTHING`).bind(created.id).run();
      return json({
        ok: true, sku, product_id: created.id, title, description, cover_url: coverUrl,
        candidate_images: imageUrls, price_hints: priceHints, via: source,
        message: '已生成草稿商品。请在中台核对标题、价格（美元）、分类与图片后手动上架。',
      }, 201, origin);
    }

    if (url.pathname === '/api/ops/growth/overview' && request.method === 'GET') {
      if(!await authorized(request,env)) return json({error:'Unauthorized'},401,origin);
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
      if(!await authorized(request,env)) return json({error:'Unauthorized'},401,origin); const b=await body(request); if(!b?.name) return json({error:'name required'},400,origin);
      const id=rid(); const slug=(b.utm_campaign||b.name).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
      await env.DB.prepare(`INSERT INTO campaigns (id,name,objective,status,category,landing_path,utm_source,utm_medium,utm_campaign,budget_usd) VALUES (?,?,?,?,?,?,?,?,?,?)`).bind(id,b.name,b.objective||'traffic','draft',b.category||null,b.landing_path||'/',b.utm_source||'manual',b.utm_medium||'organic',slug,Number(b.budget_usd||0)).run();
      return json({ok:true,id,utm_campaign:slug},201,origin);
    }

    if (url.pathname === '/api/ops/growth/content' && request.method === 'POST') {
      if(!await authorized(request,env)) return json({error:'Unauthorized'},401,origin); const b=await body(request); if(!b?.channel||!b?.body) return json({error:'channel and body required'},400,origin);
      const id=rid(); await env.DB.prepare(`INSERT INTO content_items (id,campaign_id,channel,title,body,status,ai_generated) VALUES (?,?,?,?,?,'draft',?)`).bind(id,b.campaign_id||null,b.channel,b.title||null,b.body, b.ai_generated?1:0).run(); return json({ok:true,id},201,origin);
    }

    if (url.pathname === '/api/ops/agent/run' && request.method === 'POST') {
      if(!await authorized(request,env)) return json({error:'Unauthorized'},401,origin); const ids=await runGrowthAgent(env); return json({ok:true,created_tasks:ids},200,origin);
    }

    if (url.pathname === '/api/ops/agent/tasks' && request.method === 'GET') {
      if(!await authorized(request,env)) return json({error:'Unauthorized'},401,origin); const {results}=await env.DB.prepare(`SELECT * FROM agent_tasks WHERE status='open' ORDER BY CASE priority WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END,created_at DESC`).all(); return json({tasks:results},200,origin);
    }

    if (url.pathname.startsWith('/api/ops/agent/tasks/') && request.method === 'PUT') {
      if(!await authorized(request,env)) return json({error:'Unauthorized'},401,origin); const id=url.pathname.split('/').pop(); const b=await body(request); const status=b?.status; if(!['open','approved','completed','rejected'].includes(status)) return json({error:'Invalid status'},400,origin);
      await env.DB.prepare(`UPDATE agent_tasks SET status=?,completed_at=CASE WHEN ? IN ('completed','rejected') THEN CURRENT_TIMESTAMP ELSE completed_at END WHERE id=?`).bind(status,status,id).run(); return json({ok:true},200,origin);
    }

    if (url.pathname.startsWith('/api/ops/assets/') && request.method === 'PUT') {
      if(!await authorized(request,env)) return json({error:'Unauthorized'},401,origin);
      const key = decodeURIComponent(url.pathname.slice('/api/ops/assets/'.length)).replace(/^\/+/, '');
      if(!key || key.includes('..')) return json({error:'Invalid asset key'},400,origin);
      const contentType = request.headers.get('Content-Type') || 'application/octet-stream';
      await env.ASSETS.put(key, request.body, {httpMetadata:{contentType}});
      return json({ok:true,key,url:`/media/${encodeURIComponent(key).replace(/%2F/g,'/')}`},201,origin);
    }

    if (url.pathname === '/api/ops/products' && request.method === 'GET') {
      if(!await authorized(request,env)) return json({error:'Unauthorized'},401,origin);
      const {results}=await env.DB.prepare(`SELECT p.id,p.sku,p.name,c.slug AS category,c.name AS category_name,p.origin,p.altitude,p.unit,p.weight,p.description,p.selling_points,p.price_cents,ROUND(p.price_cents/100.0,2) AS price_usd,p.cost_cents,ROUND(p.cost_cents/100.0,2) AS cost_usd,COALESCE(p.currency,'USD') AS currency,p.status,p.cover_url,COALESCE(i.on_hand,0) AS on_hand,COALESCE(i.reserved,0) AS reserved,COALESCE(i.on_hand-i.reserved,0) AS available_qty FROM products p LEFT JOIN categories c ON c.id=p.category_id LEFT JOIN inventory i ON i.product_id=p.id ORDER BY CASE p.status WHEN 'published' THEN 0 WHEN 'draft' THEN 1 ELSE 2 END,p.id DESC`).all();
      const cats=await env.DB.prepare(`SELECT id,slug,name FROM categories WHERE active=1 ORDER BY id`).all();
      const imgs=await env.DB.prepare(`SELECT product_id,image_url,is_cover FROM product_images ORDER BY sort_order`).all();
      return json({currency:'USD',products:results,categories:cats.results,images:imgs.results},200,origin);
    }

    if (url.pathname === '/api/ops/products' && request.method === 'POST') {
      if(!await authorized(request,env)) return json({error:'Unauthorized'},401,origin);
      const p=await body(request); if(!p?.sku||!p?.name||!p?.category) return json({error:'sku / name / category 必填'},400,origin);
      const cat=await env.DB.prepare(`SELECT id FROM categories WHERE slug=?`).bind(p.category).first<any>();
      if(!cat) return json({error:`未知分类：${p.category}`},400,origin);
      const priceCents = p.price_cents!=null ? Math.round(Number(p.price_cents)) : Math.round(Number(p.price_usd||0)*100);
      const costCents = p.cost_cents!=null ? Math.round(Number(p.cost_cents)) : Math.round(Number(p.cost_usd||0)*100);
      await env.DB.prepare(`INSERT INTO products (sku,name,category_id,origin,altitude,description,selling_points,unit,weight,price_cents,cost_cents,safety_stock,status,cover_url,currency) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,'USD') ON CONFLICT(sku) DO UPDATE SET name=excluded.name,category_id=excluded.category_id,origin=excluded.origin,altitude=excluded.altitude,description=excluded.description,selling_points=excluded.selling_points,unit=excluded.unit,weight=excluded.weight,price_cents=excluded.price_cents,cost_cents=excluded.cost_cents,safety_stock=excluded.safety_stock,status=excluded.status,cover_url=excluded.cover_url,currency='USD',updated_at=CURRENT_TIMESTAMP`)
        .bind(p.sku,p.name,cat.id,p.origin||null,p.altitude||null,p.description||null,p.selling_points||null,p.unit||'份',p.weight||null,priceCents,costCents,Number(p.safety_stock||0),p.status||'draft',p.cover_url||null).run();
      const row=await env.DB.prepare(`SELECT id FROM products WHERE sku=?`).bind(p.sku).first<any>();
      await env.DB.prepare(`INSERT INTO inventory (product_id,on_hand,reserved) VALUES (?,?,0) ON CONFLICT(product_id) DO NOTHING`).bind(row.id, Number(p.on_hand||0)).run();
      return json({ok:true,id:row.id,sku:p.sku,currency:'USD'},201,origin);
    }

    if (url.pathname.startsWith('/api/ops/products/') && request.method === 'PATCH') {
      if(!await authorized(request,env)) return json({error:'Unauthorized'},401,origin);
      const id=Number(url.pathname.split('/').pop()); if(!Number.isFinite(id)) return json({error:'Invalid product id'},400,origin);
      const p=await body(request)||{};
      const sets:string[]=[]; const vals:any[]=[];
      if(p.name!==undefined){sets.push('name=?');vals.push(p.name)}
      if(p.description!==undefined){sets.push('description=?');vals.push(p.description)}
      if(p.origin!==undefined){sets.push('origin=?');vals.push(p.origin)}
      if(p.altitude!==undefined){sets.push('altitude=?');vals.push(p.altitude)}
      if(p.cover_url!==undefined){sets.push('cover_url=?');vals.push(p.cover_url)}
      if(p.price_usd!==undefined){sets.push('price_cents=?');vals.push(Math.round(Number(p.price_usd)*100))}
      if(p.cost_usd!==undefined){sets.push('cost_cents=?');vals.push(Math.round(Number(p.cost_usd)*100))}
      if(p.status!==undefined){ if(!['draft','published','offline'].includes(p.status)) return json({error:'Invalid status'},400,origin); sets.push('status=?');vals.push(p.status) }
      if(sets.length){ sets.push("currency='USD'"); sets.push('updated_at=CURRENT_TIMESTAMP'); await env.DB.prepare(`UPDATE products SET ${sets.join(',')} WHERE id=?`).bind(...vals,id).run(); }
      if(p.available_qty!==undefined){
        const row=await env.DB.prepare(`SELECT reserved FROM inventory WHERE product_id=?`).bind(id).first<any>();
        if(!row) return json({error:'库存记录不存在'},404,origin);
        const next=Number(row.reserved)+Math.max(0,Number(p.available_qty));
        await env.DB.prepare(`UPDATE inventory SET on_hand=? WHERE product_id=?`).bind(next,id).run();
      }
      return json({ok:true,id,currency:'USD'},200,origin);
    }

    if (url.pathname === '/api/ops/inventory/adjust' && request.method === 'POST') {
      if(!await authorized(request,env)) return json({error:'Unauthorized'},401,origin);
      const b=await body(request); if(!b?.product_id) return json({error:'product_id required'},400,origin);
      const row=await env.DB.prepare(`SELECT on_hand,reserved FROM inventory WHERE product_id=?`).bind(b.product_id).first<any>();
      if(!row) return json({error:'Inventory record not found'},404,origin);
      let next:number;
      if(b.available_qty!==undefined){ next=Number(row.reserved)+Math.max(0,Number(b.available_qty)); }
      else { const qty=Number(b.quantity_delta); if(!Number.isFinite(qty)) return json({error:'Invalid inventory adjustment'},400,origin); next=Number(row.on_hand)+qty; }
      if(!Number.isFinite(next)||next<0) return json({error:'Inventory cannot become negative'},409,origin);
      await env.DB.batch([
        env.DB.prepare(`UPDATE inventory SET on_hand=? WHERE product_id=?`).bind(next,b.product_id),
        env.DB.prepare(`INSERT INTO inventory_events (id,product_id,event_type,quantity,reference_type,note) VALUES (?,?,?,?,?,?)`).bind(rid(),b.product_id,'manual_adjustment',next-Number(row.on_hand),'ops',b.note||'')
      ]);
      return json({ok:true,on_hand:next,available_qty:next-Number(row.reserved),currency:'USD'},200,origin);
    }

    // 密钥管理：查看当前管理密码 / 自助更换（写入 D1 settings，优先于部署密钥）。
    if (url.pathname === '/api/ops/token' && request.method === 'GET') {
      if(!await authorized(request,env)) return json({error:'Unauthorized'},401,origin);
      const row = await env.DB.prepare(`SELECT value FROM settings WHERE key='admin_token' LIMIT 1`).first<any>();
      return json({ok:true, token:String(row?.value || env.ADMIN_TOKEN || ''), source: row?.value ? 'database' : 'deploy_secret'},200,origin);
    }

    if (url.pathname === '/api/ops/token' && request.method === 'POST') {
      if(!await authorized(request,env)) return json({error:'Unauthorized'},401,origin);
      const b=await body(request); const nt=String(b?.new_token||'').trim();
      if(nt.length<8) return json({error:'新密码至少需要 8 个字符'},400,origin);
      await env.DB.prepare(`INSERT INTO settings (key,value,description) VALUES ('admin_token',?,'运营中台管理密码') ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=datetime('now')`).bind(nt).run();
      return json({ok:true,message:'管理密码已更新，下次登录请使用新密码'},200,origin);
    }

    // ---------- 企业邮箱 / 表单 ----------
    if (url.pathname === '/api/ops/mail' && request.method === 'GET') {
      if (!await authorized(request, env)) return json({ error: 'Unauthorized' }, 401, origin);
      const counts = await env.DB.prepare(`SELECT source,COUNT(*) AS count FROM leads GROUP BY source ORDER BY count DESC`).all();
      return json({
        mailbox: env.MAIL_BOX || 'xyong@xyong.ccwu.cc',
        forward_to: env.MAIL_TO || 'xynong@gmail.com',
        sender: env.MAIL_FROM || 'orders@xyong.ccwu.cc',
        notify_enabled: !!env.NOTIFY_MAIL,
        customer_mail_enabled: !!(env.RESEND_API_KEY || env.SENDGRID_API_KEY),
        customer_mail_channel: env.SENDGRID_API_KEY ? 'sendgrid' : env.RESEND_API_KEY ? 'resend' : (await getSettingValue(env, 'smtp_user') ? 'zoho_smtp' : 'none'),
        aliases: ['xyong@xyong.ccwu.cc', 'hello@xyong.ccwu.cc', 'support@xyong.ccwu.cc', 'orders@xyong.ccwu.cc'],
        form_sources: counts.results,
      }, 200, origin);
    }

    if (url.pathname === '/api/ops/mail/test' && request.method === 'POST') {
      if (!await authorized(request, env)) return json({ error: 'Unauthorized' }, 401, origin);
      const b: any = await request.json().catch(() => ({}));
      const to = String(b.to || '').trim();
      const lines = [
        '这是一封来自运营中台的测试邮件。',
        `时间：${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`,
        '若你收到本邮件，说明 xyong@xyong.ccwu.cc 的发信通道已打通。',
      ];
      const sent = to
        ? await sendMail(env, to, 'XYONG 邮箱外部投递测试', lines)
        : await notifyOwner(env, 'XYONG 邮箱连通测试', lines);
      return json({
        ok: sent,
        to: to || (env.MAIL_TO || 'xynong@gmail.com'),
        message: sent ? '邮件已发出' : '发信失败：收件地址可能未验证，或发信绑定未开通',
      }, sent ? 200 : 502, origin);
    }

    // ---------- Zoho SMTP 配置（客户通知邮件） ----------
    if (url.pathname === '/api/ops/smtp' && request.method === 'GET') {
      if (!await authorized(request, env)) return json({ error: 'Unauthorized' }, 401, origin);
      const user = await getSettingValue(env, 'smtp_user');
      return json({
        configured: !!(user && await getSettingValue(env, 'smtp_pass')),
        user: user ? user.replace(/^(.{3}).*(@.*)$/, '$1***$2') : '',
        host: (await getSettingValue(env, 'smtp_host')) || 'smtp.zoho.com',
        port: Number((await getSettingValue(env, 'smtp_port')) || 465),
      }, 200, origin);
    }

    if (url.pathname === '/api/ops/smtp' && request.method === 'POST') {
      if (!await authorized(request, env)) return json({ error: 'Unauthorized' }, 401, origin);
      const b: any = await request.json().catch(() => ({}));
      // 保存配置
      if (b.action === 'save') {
        const user = String(b.user || '').trim();
        const pass = String(b.pass || '');
        if (!user || !pass) return json({ ok: false, message: '账号和密码不能为空' }, 400, origin);
        await env.DB.prepare(`INSERT INTO settings (key,value) VALUES ('smtp_user',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value`).bind(user).run();
        await env.DB.prepare(`INSERT INTO settings (key,value) VALUES ('smtp_pass',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value`).bind(pass).run();
        if (b.host) await env.DB.prepare(`INSERT INTO settings (key,value) VALUES ('smtp_host',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value`).bind(String(b.host).trim()).run();
        if (b.port) await env.DB.prepare(`INSERT INTO settings (key,value) VALUES ('smtp_port',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value`).bind(String(Number(b.port))).run();
        return json({ ok: true, message: 'SMTP 配置已保存，客户通知邮件通道已启用' }, 200, origin);
      }
      // 发测试邮件（直接走 SMTP 通道，返回真实错误便于排障）
      const to = String(b.to || '').trim();
      if (!to) return json({ ok: false, message: '请填写测试收件地址' }, 400, origin);
      const r = await smtpSend(env, to, 'XYONG 客户邮件通道测试', [
        '这是一封客户通知通道的测试邮件。',
        `时间：${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`,
        '若收到本邮件，说明下单确认 / 发货通知可以正常送达客户。',
      ]);
      return json({ ok: r.ok, message: r.ok ? '测试邮件已通过 SMTP 发出' : `SMTP 发送失败：${r.error || '未知错误'}` }, r.ok ? 200 : 502, origin);
    }

    // ================= 实地采集：中台管理 =================
    if (url.pathname === '/api/ops/field/reports' && request.method === 'GET') {
      if (!await authorized(request, env)) return json({ error: 'Unauthorized' }, 401, origin);
      const { results } = await env.DB.prepare(`SELECT * FROM field_reports WHERE status!='deleted' ORDER BY created_at DESC LIMIT 100`).all<any>();
      const reports = (results || []).map((r) => {
        let data: any = {}, photos: any[] = [], docs: any[] = [];
        try { data = JSON.parse(r.data_json || '{}'); } catch { /* ignore */ }
        try { photos = JSON.parse(r.photos_json || '[]'); } catch { /* ignore */ }
        try { docs = JSON.parse(r.docs_json || '[]'); } catch { /* ignore */ }
        return {
          id: r.id, category: r.category, product_name: r.product_name, status: r.status,
          created_at: r.created_at, data, photos, docs,
        };
      });
      return json({ reports }, 200, origin);
    }

    const fieldPublish = url.pathname.match(/^\/api\/ops\/field\/reports\/([^/]+)\/publish$/);
    if (fieldPublish && request.method === 'POST') {
      if (!await authorized(request, env)) return json({ error: 'Unauthorized' }, 401, origin);
      try {
      const repId = fieldPublish[1];
      const rep = await env.DB.prepare(`SELECT * FROM field_reports WHERE id=?`).bind(repId).first<any>();
      if (!rep) return json({ error: '报告不存在' }, 404, origin);
      if (rep.status === 'published') return json({ error: '该报告已转为商品' }, 400, origin);
      const data = JSON.parse(rep.data_json || '{}');
      const photos = JSON.parse(rep.photos_json || '[]');
      const docs = JSON.parse(rep.docs_json || '[]');
      const cat = await env.DB.prepare(`SELECT id FROM categories WHERE slug=?`).bind(rep.category).first<any>();
      if (!cat) return json({ error: '商品分类不存在：' + rep.category }, 400, origin);
      const sku = 'FLD-' + repId.replace(/^FR-/, '').replace(/-/g, '').slice(-10).toUpperCase();
      const existsSku = await env.DB.prepare(`SELECT id FROM products WHERE sku=?`).bind(sku).first<any>();
      if (existsSku) return json({ error: '该报告已生成过商品（SKU ' + sku + '）' }, 400, origin);
      const nameEn = String(data.name_en || '').trim();
      const name = String(data.name_zh || rep.product_name || sku) + (nameEn ? ' | ' + nameEn : '');
      const specLines: string[] = [];
      for (const [k, v] of Object.entries(data)) {
        if (['name_zh', 'name_en', 'origin', 'altitude', 'story', 'price_usd', 'qty', 'unit'].includes(k)) continue;
        if (typeof v === 'string' && v.trim()) specLines.push(`${k}: ${v}`);
      }
      const description = [
        nameEn ? String(data.name_zh || '') + ' · ' + nameEn : String(data.name_zh || ''),
        data.season ? '采收季节：' + data.season : '',
        data.story ? '\n' + data.story : '',
        specLines.length ? '\n规格参数：\n' + specLines.join('\n') : '',
      ].filter(Boolean).join('\n');
      const priceCents = Math.round(Number(data.price_usd || 0) * 100);
      const coverUrl = photos[0]?.url || null;
      await env.DB.prepare(
        `INSERT INTO products (sku,name,category_id,origin,altitude,description,selling_points,unit,price_cents,status,cover_url) VALUES (?,?,?,?,?,?,?,?,?,?,?)`
      ).bind(
        sku, name, cat.id, String(data.origin || ''), String(data.altitude || ''), description,
        JSON.stringify({ flavor: data.flavor || data.taste || data.aroma || '', certifications: data.certifications || '' }),
        String(data.unit || '件'), priceCents, 'draft', coverUrl
      ).run();
      const prodRow = await env.DB.prepare(`SELECT id FROM products WHERE sku=?`).bind(sku).first<any>();
      const prodId = Number(prodRow?.id);
      await env.DB.prepare(`INSERT OR IGNORE INTO inventory (product_id,on_hand,reserved) VALUES (?,?,0)`).bind(prodId, Number(data.qty || 0)).run();
      await env.DB.prepare(`INSERT INTO product_details (product_id,fields_json) VALUES (?,?)`)
        .bind(prodId, JSON.stringify({ field_report: repId, ...data })).run();
      for (let i = 0; i < photos.length; i++) {
        await env.DB.prepare(`INSERT OR IGNORE INTO product_images (product_id,object_key,image_url,image_type,sort_order,is_cover) VALUES (?,?,?,?,?,?)`)
          .bind(prodId, photos[i].key, photos[i].url, photos[i].slot || 'product', i, i === 0 ? 1 : 0).run();
      }
      for (const d of docs) {
        for (const f of (d.files || [])) {
          await env.DB.prepare(`INSERT OR IGNORE INTO evidence_assets (product_id,file_key,file_name,file_type,summary) VALUES (?,?,?,?,?)`)
            .bind(String(prodId), f.key, f.name || '文件', (f.mime || '').includes('pdf') ? 'pdf' : 'image',
              `${d.type || '合规文件'}${d.no ? ' · ' + d.no : ''}${d.issuer ? ' · ' + d.issuer : ''}${d.expiry ? ' · 有效期至 ' + d.expiry : ''}`).run();
        }
      }
      await env.DB.prepare(`UPDATE field_reports SET status='published' WHERE id=?`).bind(repId).run();
      return json({ ok: true, product_id: prodId, sku }, 201, origin);
      } catch (e: any) {
        return json({ error: '转商品失败：' + String(e?.message || e) }, 500, origin);
      }
    }

    const fieldDelete = url.pathname.match(/^\/api\/ops\/field\/reports\/([^/]+)$/);
    if (fieldDelete && request.method === 'DELETE') {
      if (!await authorized(request, env)) return json({ error: 'Unauthorized' }, 401, origin);
      await env.DB.prepare(`UPDATE field_reports SET status='deleted' WHERE id=?`).bind(fieldDelete[1]).run();
      return json({ ok: true }, 200, origin);
    }

    if (url.pathname === '/api/ops/diagnostics' && request.method === 'GET') {
      if (!authorized(request, env)) return json({ error: 'Unauthorized' }, 401, origin);
      try {
        const tableResult = await env.DB.prepare(
          `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`
        ).all<{name: string}>();
        const r2Result = await env.ASSETS.list({ limit: 1 });
        return json({
          ok: true, version: '3.0.0', mode: 'read_only', checked_at: new Date().toISOString(),
          d1: { connected: true, database: 'xyong-db', table_count: tableResult.results.length, tables: tableResult.results.map(row => row.name) },
          r2: { connected: true, bucket: 'xyong-media', has_objects: r2Result.objects.length > 0, listing_truncated: r2Result.truncated }
        }, 200, origin);
      } catch (error) {
        return json({ ok: false, mode: 'read_only', error: error instanceof Error ? error.message : 'Infrastructure check failed' }, 500, origin);
      }
    }

    return json({error:'Not found'},404,origin);
  }
};
