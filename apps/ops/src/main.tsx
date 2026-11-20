import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

const API = import.meta.env.VITE_API_BASE_URL || 'https://apixyong.ccwu.cc';

type Any = Record<string, any>;

const usd = (value: any) => {
  const n = Number(value || 0);
  return `US$${(Number.isFinite(n) ? n : 0).toFixed(2)}`;
};

const TABS = [
  ['overview', '概览'],
  ['catalog', '商品'],
  ['orders', '订单 / 发货'],
  ['payments', '支付'],
  ['customers', '客户'],
  ['leads', '线索 / 订阅'],
  ['coupons', '优惠券'],
  ['mail', '邮箱 / 表单'],
  ['import', '产品采集'],
  ['field', '实地采集'],
  ['ai', 'AI 工作区'],
  ['access', '密钥'],
] as const;

type Tab = typeof TABS[number][0];

const ORDER_STATUS: Any = {
  pending: '待付款', processing: '待发货', shipped: '已发货',
  completed: '已完成', cancelled: '已取消', refunded: '已退款',
};

function App() {
  const [token, setToken] = useState(localStorage.getItem('xyong_ops_token') || '');
  const [tab, setTab] = useState<Tab>('overview');
  const [dashboard, setDashboard] = useState<Any | null>(null);
  const [growth, setGrowth] = useState<Any | null>(null);
  const [products, setProducts] = useState<Any[]>([]);
  const [categories, setCategories] = useState<Any[]>([]);
  const [orders, setOrders] = useState<Any[]>([]);
  const [payments, setPayments] = useState<Any[]>([]);
  const [customers, setCustomers] = useState<Any[]>([]);
  const [leads, setLeads] = useState<Any[]>([]);
  const [coupons, setCoupons] = useState<Any[]>([]);
  const [mail, setMail] = useState<Any | null>(null);
  const [smtpInfo, setSmtpInfo] = useState<Any | null>(null);
  const [smtpForm, setSmtpForm] = useState({ user: '', pass: '', host: 'smtp.zoho.com', port: '465' });
  const [smtpTestTo, setSmtpTestTo] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [draft, setDraft] = useState<Record<string, Any>>({});
  const [creating, setCreating] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<Any | null>(null);
  const [newToken, setNewToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [ship, setShip] = useState<Record<string, Any>>({});
  const [customerForm, setCustomerForm] = useState({ email: '', first_name: '', country: '' });
  const [couponForm, setCouponForm] = useState({ code: '', type: 'percentage', value: '', min_subtotal_usd: '', max_uses: '' });
  const [importUrl, setImportUrl] = useState('');
  const [importCat, setImportCat] = useState('coffee');
  const [importResult, setImportResult] = useState<Any | null>(null);
  const [importing, setImporting] = useState(false);
  const [importMode, setImportMode] = useState<'web' | 'manual'>('web');
  const [fieldReports, setFieldReports] = useState<Any[]>([]);
  const [fieldOpen, setFieldOpen] = useState('');
  const [manual, setManual] = useState<Any>({
    category: 'coffee', name_zh: '', name_en: '', origin: '', altitude: '', season: '', batch: '',
    qty: '', unit: '', price_usd: '', shelf_life: '', storage: '', certifications: '', story: '',
  });
  const [form, setForm] = useState<Any>({
    sku: '', name: '', category: 'coffee', price_usd: '', cost_usd: '',
    on_hand: '0', status: 'draft', origin: '', altitude: '', unit: '',
    weight: '', description: '', cover_url: '',
  });

  const headers = () => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' });

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const res = await Promise.all([
        fetch(`${API}/api/ops/dashboard`, { headers: headers() }),
        fetch(`${API}/api/ops/growth/overview`, { headers: headers() }),
        fetch(`${API}/api/ops/products`, { headers: headers() }),
        fetch(`${API}/api/ops/orders`, { headers: headers() }),
        fetch(`${API}/api/ops/payments`, { headers: headers() }),
        fetch(`${API}/api/ops/customers`, { headers: headers() }),
        fetch(`${API}/api/ops/leads`, { headers: headers() }),
        fetch(`${API}/api/ops/coupons`, { headers: headers() }),
        fetch(`${API}/api/ops/mail`, { headers: headers() }),
        fetch(`${API}/api/ops/token`, { headers: headers() }),
        fetch(`${API}/api/ops/smtp`, { headers: headers() }),
      ]);
      const [a, b, c, d, e, f, g, h, i, k, s] = await Promise.all(res.map((r) => r.json()));
      if (!res[0].ok) throw new Error(a.error || '加载失败');
      setDashboard(a); setGrowth(b);
      setProducts(c.products || []); setCategories(c.categories || []);
      setOrders(d.orders || []); setPayments(e.payments || []);
      setCustomers(f.customers || []); setLeads(g.leads || []);
      setCoupons(h.coupons || []); setMail(i);
      setTokenInfo(res[9].ok ? k : null);
      if (res[10].ok) {
        setSmtpInfo(s);
        setSmtpForm((prev) => ({ ...prev, user: prev.user || s.user || '', host: s.host || 'smtp.zoho.com', port: String(s.port || 465) }));
      }
      setError('');
      setDraft({});
    } catch (err: any) {
      setError(err.message || '网络请求失败');
    } finally {
      setBusy(false);
    }
  }, [token]);

  useEffect(() => { if (token) load(); }, [token, load]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 2800);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const call = async (path: string, method: string, payload?: Any) => {
    const resp = await fetch(`${API}${path}`, {
      method, headers: headers(), body: payload ? JSON.stringify(payload) : undefined,
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) throw new Error(data.error || `请求失败 ${resp.status}`);
    return data;
  };

  const guard = async (fn: () => Promise<void>, okMsg?: string) => {
    setBusy(true);
    try {
      await fn();
      if (okMsg) setNotice(okMsg);
      await load();
    } catch (e: any) {
      setError(e.message || '操作失败');
    } finally {
      setBusy(false);
    }
  };

  const patchProduct = (id: number, payload: Any) => guard(() => call(`/api/ops/products/${id}`, 'PATCH', payload).then(() => {}), '已保存');

  const createProduct = async () => {
    if (!form.sku || !form.name) { setError('SKU 与商品名必填'); return; }
    await guard(async () => {
      await call('/api/ops/products', 'POST', {
        ...form, price_usd: Number(form.price_usd || 0), cost_usd: Number(form.cost_usd || 0), on_hand: Number(form.on_hand || 0),
      });
      setCreating(false);
      setForm({ ...form, sku: '', name: '', price_usd: '', cost_usd: '', description: '', cover_url: '' });
    }, '商品已保存（美元计价）');
  };

  const uploadCover = async (file: File) => {
    setBusy(true);
    try {
      const key = `products/${Date.now()}-${file.name}`;
      const resp = await fetch(`${API}/api/ops/assets/${encodeURIComponent(key)}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': file.type || 'application/octet-stream' },
        body: file,
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || '上传失败');
      setForm((prev: Any) => ({ ...prev, cover_url: data.url }));
      setNotice('图片已上传到图库');
    } catch (e: any) {
      setError(e.message || '上传失败');
    } finally {
      setBusy(false);
    }
  };

  const saveOrder = (row: Any, status: string) => {
    const s = ship[row.id] || {};
    return guard(() => call(`/api/ops/orders/${row.id}`, 'PATCH', {
      status,
      carrier: s.carrier || row.carrier || undefined,
      tracking_number: s.tracking_number || row.tracking_number || undefined,
      shipment_status: status === 'shipped' ? 'in_transit' : undefined,
    }).then(() => {}), `订单 ${row.order_no} 已更新为「${ORDER_STATUS[status] || status}」`);
  };

  const markPaid = (row: Any) => guard(
    () => call(`/api/ops/payments/${row.id}`, 'PATCH', { status: 'paid', transaction_id: `manual-${Date.now()}` }).then(() => {}),
    `已确认收款 ${usd(row.amount_usd)}`,
  );

  const rotateToken = async () => {
    const next = newToken.trim();
    if (next.length < 8) { setError('新密码至少 8 个字符'); return; }
    await guard(async () => {
      await call('/api/ops/token', 'POST', { new_token: next });
      localStorage.setItem('xyong_ops_token', next);
      setToken(next); setNewToken(''); setShowToken(false);
    }, '管理密码已更新');
  };

  const loadField = useCallback(async () => {
    try {
      const d = await call('/api/ops/field/reports', 'GET');
      setFieldReports(d.reports || []);
    } catch { /* 静默 */ }
  }, [token]);

  useEffect(() => { if (token && (tab === 'field' || tab === 'import')) loadField(); }, [token, tab, loadField]);

  const submitManual = async () => {
    if (!String(manual.name_zh || '').trim()) { setError('请填写产品名称'); return; }
    if (!String(manual.origin || '').trim()) { setError('请填写产地 / 采集地点'); return; }
    await guard(async () => {
      await call('/api/field/reports', 'POST', { category: manual.category, data: manual, photos: [], docs: [] });
      setManual({ ...manual, name_zh: '', name_en: '', batch: '', story: '' });
    }, '手工录入已保存，到「实地采集」页审核后转为商品');
    loadField();
  };

  const publishField = async (id: string) => {
    await guard(async () => { await call(`/api/ops/field/reports/${id}/publish`, 'POST', {}); }, '已生成商品草稿，到「商品」页核对上架');
    loadField();
  };

  const deleteField = async (id: string) => {
    await guard(async () => { await call(`/api/ops/field/reports/${id}`, 'DELETE'); }, '报告已移除');
    loadField();
  };

  const runImport = async () => {
    if (!/^https?:\/\//.test(importUrl)) { setError('请填写商品页链接（http/https）'); return; }
    setImporting(true); setImportResult(null);
    try {
      const data = await call('/api/ops/import', 'POST', { url: importUrl, category: importCat });
      setImportResult(data);
      setNotice('已生成草稿商品，请核对价格与图片后上架');
      await load();
    } catch (e: any) {
      setError(e.message || '采集失败');
    } finally {
      setImporting(false);
    }
  };

  const testMail = () => guard(async () => {
    const r = await call('/api/ops/mail/test', 'POST', {});
    setNotice(r.message || '已发送');
  });

  const saveSmtp = () => guard(async () => {
    if (!smtpForm.user || !smtpForm.pass) { setError('请填写 SMTP 账号和应用专用密码'); return; }
    const r = await call('/api/ops/smtp', 'POST', { action: 'save', user: smtpForm.user, pass: smtpForm.pass, host: smtpForm.host, port: smtpForm.port });
    setNotice(r.message || '已保存');
    setSmtpForm((p) => ({ ...p, pass: '' }));
    await load();
  });

  const testSmtp = () => guard(async () => {
    if (!smtpTestTo) { setError('请先填写测试收件地址'); return; }
    const r = await call('/api/ops/smtp', 'POST', { action: 'test', to: smtpTestTo });
    if (!r.ok) setError(r.message || 'SMTP 测试失败');
    setNotice(r.message || '已发送');
  });

  const revenue = useMemo(
    () => orders.reduce((sum, row) => sum + Number(row.total_usd || 0), 0),
    [orders],
  );
  const availableUnits = useMemo(
    () => products.reduce((sum, row) => sum + Number(row.available_qty || 0), 0),
    [products],
  );
  const pendingShip = useMemo(
    () => orders.filter((o) => ['pending', 'processing'].includes(o.status)).length,
    [orders],
  );

  const visible = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return products.filter((row) => {
      const matchStatus = filter === 'all' || row.status === filter;
      const matchKeyword = !keyword
        || String(row.sku).toLowerCase().includes(keyword)
        || String(row.name).toLowerCase().includes(keyword);
      return matchStatus && matchKeyword;
    });
  }, [products, query, filter]);

  if (!token || error === 'Unauthorized') {
    return (
      <main className="login">
        <div className="box">
          <div className="eyebrow">XYONG BRAND · OPERATIONS</div>
          <h1>云南精品园</h1>
          <p>运营中台仅限内部使用。请输入管理密码进入；离职或换人时请立即在「密钥」里更换密码。</p>
          <input type="password" placeholder="管理密码" id="token" />
          <button onClick={() => {
            const value = (document.getElementById('token') as HTMLInputElement).value.trim();
            localStorage.setItem('xyong_ops_token', value);
            setToken(value);
          }}>进入中台</button>
          {error === 'Unauthorized' && <p className="err">密码不正确，请重新输入。</p>}
          <p className="muted" style={{ marginTop: 18 }}>
            入口固定为 <code>ops.xyong.ccwu.cc</code>，商城页脚也有「运营管理」链接。
          </p>
          <p className="muted"><a href="https://xyong.ccwu.cc/shop/">← 返回商城</a></p>
        </div>
      </main>
    );
  }

  return (
    <main>
      <header>
        <div><b>XYONG BRAND</b><span> · 云南精品园 · Operations</span></div>
        <div>
          <button onClick={load} disabled={busy}>{busy ? '同步中…' : '刷新'}</button>
          <button onClick={() => { localStorage.removeItem('xyong_ops_token'); setToken(''); }}>退出</button>
        </div>
      </header>

      {notice && <div className="toast ok">{notice}</div>}
      {error && error !== 'Unauthorized' && <div className="toast bad">{error}</div>}

      <nav className="tabs">
        {TABS.map(([key, label]) => (
          <button key={key} className={tab === key ? 'on' : ''} onClick={() => setTab(key)}>
            {label}
            {key === 'orders' && pendingShip > 0 && <i>{pendingShip}</i>}
          </button>
        ))}
      </nav>

      {tab === 'overview' && (
        <>
          <section className="cards">
            <div><span>在售商品 / LIVE SKUs</span><strong>{dashboard?.products?.count ?? '—'}</strong></div>
            <div><span>可售库存 / UNITS</span><strong>{availableUnits}</strong></div>
            <div><span>客户 / CUSTOMERS</span><strong>{customers.length}</strong></div>
            <div><span>累计订单额 / REVENUE</span><strong>{usd(revenue)}</strong></div>
          </section>
          <section className="panel">
            <div className="panel-head"><h2>待处理</h2><span className="muted">待付款 / 待发货 {pendingShip} 单</span></div>
            <div className="quickrow">
              <button onClick={() => setTab('orders')}>去发货 →</button>
              <button onClick={() => setTab('payments')}>确认收款 →</button>
              <button onClick={() => setTab('import')}>采集新品 →</button>
              <button onClick={() => setTab('mail')}>邮箱 / 表单 →</button>
            </div>
          </section>
          <section className="panel">
            <div className="panel-head"><h2>近期订单</h2><span className="muted">金额单位 USD</span></div>
            <div className="tablewrap">
              <table className="ops">
                <thead><tr><th>订单号</th><th>客户</th><th>金额</th><th>状态</th><th>时间</th></tr></thead>
                <tbody>
                  {(dashboard?.recent_orders || []).map((row: Any) => (
                    <tr key={row.id}>
                      <td>{row.order_no}</td>
                      <td>{row.customer_name}<small className="block">{row.customer_email || '—'}</small></td>
                      <td className="num">{usd(row.total_usd)}</td>
                      <td><span className={`pill ${row.status}`}>{ORDER_STATUS[row.status] || row.status}</span></td>
                      <td className="muted">{row.created_at}</td>
                    </tr>
                  ))}
                  {!(dashboard?.recent_orders || []).length && <tr><td colSpan={5} className="empty">暂无订单</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {tab === 'catalog' && (
        <section className="panel">
          <div className="panel-head">
            <h2>商品管理</h2>
            <button onClick={() => setCreating((v) => !v)}>{creating ? '收起表单' : '＋ 新增商品'}</button>
          </div>
          <p className="muted">改价请直接填美元金额（69 表示 US$69.00）。库存填“可售数量”，保存后商城立即生效。</p>

          {creating && (
            <div className="formgrid">
              <label>SKU<input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="COF-NUJ-002" /></label>
              <label>商品名<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="木澪咖啡 · 日晒" /></label>
              <label>分类
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}（{c.slug}）</option>)}
                </select>
              </label>
              <label>美元售价<input value={form.price_usd} onChange={(e) => setForm({ ...form, price_usd: e.target.value })} placeholder="69" /></label>
              <label>美元成本<input value={form.cost_usd} onChange={(e) => setForm({ ...form, cost_usd: e.target.value })} placeholder="32" /></label>
              <label>可售库存<input value={form.on_hand} onChange={(e) => setForm({ ...form, on_hand: e.target.value })} placeholder="50" /></label>
              <label>状态
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="draft">草稿（不展示）</option>
                  <option value="published">已上架</option>
                  <option value="offline">已下架</option>
                </select>
              </label>
              <label>规格单位<input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="袋 / 100g" /></label>
              <label>产地<input value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value })} placeholder="云南 · 怒江" /></label>
              <label>海拔<input value={form.altitude} onChange={(e) => setForm({ ...form, altitude: e.target.value })} placeholder="1,800m" /></label>
              <label className="wide">卖点<input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="日晒处理，果香与可可尾韵" /></label>
              <label className="wide">封面图
                <span className="uploadrow">
                  <input value={form.cover_url} onChange={(e) => setForm({ ...form, cover_url: e.target.value })} placeholder="上传后自动填入，或粘贴图片地址" />
                  <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCover(f); }} />
                </span>
              </label>
              <div className="formactions"><button onClick={createProduct} disabled={busy}>保存商品</button></div>
            </div>
          )}

          <div className="toolbar">
            <input placeholder="搜索 SKU 或商品名" value={query} onChange={(e) => setQuery(e.target.value)} />
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">全部状态</option>
              <option value="published">已上架</option>
              <option value="draft">草稿</option>
              <option value="offline">已下架</option>
            </select>
            <span className="muted">共 {visible.length} 条 · 币种 USD</span>
          </div>

          <div className="tablewrap">
            <table className="ops">
              <thead><tr><th>商品</th><th>分类</th><th>美元售价</th><th>可售库存</th><th>状态</th><th>操作</th></tr></thead>
              <tbody>
                {visible.map((row) => {
                  const price = draft[row.id]?.price ?? Number(row.price_usd || 0).toFixed(2);
                  const qty = draft[row.id]?.qty ?? String(Number(row.available_qty || 0));
                  return (
                    <tr key={row.id}>
                      <td>
                        <div className="prodcell">
                          {row.cover_url ? <img src={String(row.cover_url).startsWith('http') ? row.cover_url : `${API}${row.cover_url}`} alt="" /> : <div className="noimg" />}
                          <div><b>{row.name}</b><small>{row.sku}</small></div>
                        </div>
                      </td>
                      <td>{row.category_name || row.category}</td>
                      <td className="num">
                        <span className="cur">US$</span>
                        <input className="mini" value={price} onChange={(e) => setDraft({ ...draft, [row.id]: { ...draft[row.id], price: e.target.value } })} />
                      </td>
                      <td className="num"><input className="mini" value={qty} onChange={(e) => setDraft({ ...draft, [row.id]: { ...draft[row.id], qty: e.target.value } })} /></td>
                      <td>
                        <select value={row.status} onChange={(e) => patchProduct(Number(row.id), { status: e.target.value })}>
                          <option value="published">已上架</option>
                          <option value="draft">草稿</option>
                          <option value="offline">已下架</option>
                        </select>
                      </td>
                      <td>
                        <button className="ghost" onClick={() => patchProduct(Number(row.id), { price_usd: Number(price || 0), available_qty: Number(qty || 0) })} disabled={busy}>保存</button>
                      </td>
                    </tr>
                  );
                })}
                {!visible.length && <tr><td colSpan={6} className="empty">没有匹配的商品</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === 'orders' && (
        <section className="panel">
          <div className="panel-head"><h2>订单 / 发货</h2><span className="muted">状态变更会联动库存</span></div>
          <p className="muted">「待付款」确认收款后进入「待发货」；填物流商与单号后点「发货」，客户订单转为已发货。</p>
          <div className="tablewrap">
            <table className="ops">
              <thead><tr><th>订单</th><th>客户 / 地址</th><th>商品</th><th>金额</th><th>支付</th><th>物流</th><th>状态</th></tr></thead>
              <tbody>
                {orders.map((row) => (
                  <tr key={row.id}>
                    <td><b>{row.order_no}</b><small className="block">{row.created_at}</small></td>
                    <td>{row.customer_name}<small className="block">{row.customer_email || '—'} · {row.customer_phone}</small><small className="block">{row.shipping_address || '—'}</small></td>
                    <td><small>{row.items_summary || '—'}</small></td>
                    <td className="num">{usd(row.total_usd)}</td>
                    <td><span className={`pill ${row.payment_status || 'pending'}`}>{row.payment_status === 'paid' ? '已收款' : '未收款'}</span></td>
                    <td>
                      <input placeholder="物流商" className="mini wide" defaultValue={row.carrier || ''} onChange={(e) => setShip({ ...ship, [row.id]: { ...ship[row.id], carrier: e.target.value } })} />
                      <input placeholder="单号" className="mini wide" defaultValue={row.tracking_number || ''} onChange={(e) => setShip({ ...ship, [row.id]: { ...ship[row.id], tracking_number: e.target.value } })} />
                    </td>
                    <td>
                      <select value={row.status} onChange={(e) => saveOrder(row, e.target.value)} disabled={busy}>
                        {Object.entries(ORDER_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
                {!orders.length && <tr><td colSpan={7} className="empty">暂无订单。商城下单后会立即出现在这里。</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === 'payments' && (
        <section className="panel">
          <div className="panel-head"><h2>支付记录</h2><span className="muted">当前为人工收款框架，可接 Stripe / PayPal</span></div>
          <p className="muted">每笔订单生成一条待支付记录。收到银行转账或 PayPal 款项后点「确认收款」，订单自动进入待发货。</p>
          <div className="tablewrap">
            <table className="ops">
              <thead><tr><th>订单号</th><th>通道</th><th>金额</th><th>状态</th><th>时间</th><th>操作</th></tr></thead>
              <tbody>
                {payments.map((row) => (
                  <tr key={row.id}>
                    <td>{row.order_no || row.order_id}</td>
                    <td>{row.provider}</td>
                    <td className="num">{usd(row.amount_usd ?? row.amount)}</td>
                    <td><span className={`pill ${row.status}`}>{row.status === 'paid' ? '已收款' : row.status === 'pending' ? '待收款' : row.status}</span></td>
                    <td className="muted">{row.created_at}</td>
                    <td>
                      {row.status !== 'paid'
                        ? <button className="ghost" onClick={() => markPaid(row)} disabled={busy}>确认收款</button>
                        : <span className="muted">已完成</span>}
                    </td>
                  </tr>
                ))}
                {!payments.length && <tr><td colSpan={6} className="empty">暂无支付记录</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === 'customers' && (
        <section className="panel">
          <div className="panel-head"><h2>客户管理</h2><span className="muted">下单自动建档</span></div>
          <div className="toolbar">
            <input placeholder="手动添加客户邮箱" value={customerForm.email} onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })} />
            <input placeholder="姓名" value={customerForm.first_name} onChange={(e) => setCustomerForm({ ...customerForm, first_name: e.target.value })} />
            <input placeholder="国家" value={customerForm.country} onChange={(e) => setCustomerForm({ ...customerForm, country: e.target.value })} />
            <button onClick={() => guard(async () => {
              await call('/api/ops/customers', 'POST', customerForm);
              setCustomerForm({ email: '', first_name: '', country: '' });
            }, '客户已添加')} disabled={busy}>添加</button>
          </div>
          <div className="tablewrap">
            <table className="ops">
              <thead><tr><th>客户</th><th>国家</th><th>订单数</th><th>累计消费</th><th>最近下单</th><th>来源</th></tr></thead>
              <tbody>
                {customers.map((row) => (
                  <tr key={row.id}>
                    <td>{row.first_name || row.email}<small className="block">{row.email}</small></td>
                    <td>{row.country || '—'}</td>
                    <td className="num">{row.order_count}</td>
                    <td className="num">{usd(row.lifetime_usd)}</td>
                    <td className="muted">{row.last_order_at || '—'}</td>
                    <td><small>{row.source || '—'}</small></td>
                  </tr>
                ))}
                {!customers.length && <tr><td colSpan={6} className="empty">暂无客户。第一笔订单会自动建档。</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === 'leads' && (
        <section className="panel">
          <div className="panel-head"><h2>线索 / 订阅</h2><span className="muted">商城订阅与咨询表单汇入此处</span></div>
          <div className="tablewrap">
            <table className="ops">
              <thead><tr><th>邮箱</th><th>来源</th><th>留言</th><th>事件</th><th>阶段</th><th>时间</th></tr></thead>
              <tbody>
                {leads.map((row) => (
                  <tr key={row.id}>
                    <td>{row.email || row.name || '—'}<small className="block">{row.country || ''}</small></td>
                    <td><small>{row.source}{row.source_detail ? ` / ${row.source_detail}` : ''}</small></td>
                    <td><small>{row.notes || '—'}</small></td>
                    <td className="num">{row.event_count}</td>
                    <td>
                      <select value={row.stage} onChange={(e) => guard(() => call(`/api/ops/leads/${row.id}`, 'PATCH', { stage: e.target.value }).then(() => {}), '阶段已更新')}>
                        <option value="new">新线索</option>
                        <option value="warm">有意向</option>
                        <option value="hot">高意向</option>
                        <option value="customer">已成客户</option>
                        <option value="lost">已流失</option>
                      </select>
                    </td>
                    <td className="muted">{row.created_at}</td>
                  </tr>
                ))}
                {!leads.length && <tr><td colSpan={6} className="empty">暂无线索</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === 'coupons' && (
        <section className="panel">
          <div className="panel-head"><h2>优惠券</h2><span className="muted">结账时可用</span></div>
          <div className="toolbar">
            <input placeholder="优惠码，如 WELCOME10" value={couponForm.code} onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })} />
            <select value={couponForm.type} onChange={(e) => setCouponForm({ ...couponForm, type: e.target.value })}>
              <option value="percentage">百分比折扣 %</option>
              <option value="fixed">固定减免 USD</option>
            </select>
            <input placeholder={couponForm.type === 'percentage' ? '折扣 10' : '减免 5'} value={couponForm.value} onChange={(e) => setCouponForm({ ...couponForm, value: e.target.value })} />
            <input placeholder="最低消费 USD" value={couponForm.min_subtotal_usd} onChange={(e) => setCouponForm({ ...couponForm, min_subtotal_usd: e.target.value })} />
            <input placeholder="可用次数" value={couponForm.max_uses} onChange={(e) => setCouponForm({ ...couponForm, max_uses: e.target.value })} />
            <button onClick={() => guard(async () => {
              await call('/api/ops/coupons', 'POST', {
                ...couponForm,
                value: Number(couponForm.value || 0),
                min_subtotal_usd: Number(couponForm.min_subtotal_usd || 0),
                max_uses: couponForm.max_uses ? Number(couponForm.max_uses) : undefined,
              });
              setCouponForm({ code: '', type: 'percentage', value: '', min_subtotal_usd: '', max_uses: '' });
            }, '优惠券已创建')} disabled={busy}>创建</button>
          </div>
          <div className="tablewrap">
            <table className="ops">
              <thead><tr><th>优惠码</th><th>类型</th><th>力度</th><th>已用 / 上限</th><th>状态</th><th>操作</th></tr></thead>
              <tbody>
                {coupons.map((row) => (
                  <tr key={row.id}>
                    <td><b>{row.code}</b></td>
                    <td>{row.type === 'percentage' ? '百分比' : '固定额'}</td>
                    <td className="num">{row.type === 'percentage' ? `${row.value}%` : usd(row.value)}</td>
                    <td className="num">{row.used_count}{row.max_uses ? ` / ${row.max_uses}` : ' / ∞'}</td>
                    <td><span className={`pill ${row.is_active ? 'paid' : 'pending'}`}>{row.is_active ? '启用' : '停用'}</span></td>
                    <td>
                      <button className="ghost" onClick={() => guard(() => call(`/api/ops/coupons/${row.id}`, 'PATCH', { is_active: !row.is_active }).then(() => {}), '已更新')}>
                        {row.is_active ? '停用' : '启用'}
                      </button>
                    </td>
                  </tr>
                ))}
                {!coupons.length && <tr><td colSpan={6} className="empty">暂无优惠券</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === 'mail' && (
        <>
          <section className="panel">
            <div className="panel-head"><h2>企业邮箱</h2><button onClick={testMail} disabled={busy}>发送测试邮件</button></div>
            <div className="kv">
              <div><span>企业邮箱</span><b>{mail?.mailbox || 'xyong@xyong.ccwu.cc'}</b></div>
              <div><span>网页登录</span><b><a href="https://mail.zoho.com" target="_blank" rel="noreferrer">mail.zoho.com</a>（免费版）</b></div>
              <div><span>来信去向</span><b>直达 Zoho 收件箱（不再转发）</b></div>
              <div><span>系统提醒</span><b>新订单 / 咨询提醒仍发到 Gmail</b></div>
            </div>
            <p className="muted">
              日常用浏览器打开 mail.zoho.com 收发邮件，发件人自动显示为 xyong@xyong.ccwu.cc，发件不退信。
              手机或 Outlook / Foxmail 等客户端可用 IMAP / SMTP 收发：
              收件 imap.zoho.com（端口 993，SSL）；
              发件 smtp.zoho.com（端口 465，SSL）；
              账号填 xyong@xyong.ccwu.cc，密码用 Zoho 账号密码（若开启两步验证，请到 Zoho 安全页生成应用专用密码）。
              防伪造认证 SPF / DKIM / DMARC 已全部生效。
            </p>
          </section>
          <section className="panel">
            <div className="panel-head">
              <h2>客户通知邮件（SMTP）</h2>
              <span className="muted">{smtpInfo?.configured ? '已启用 · 客户下单/发货自动收信' : '未配置 · 配置后客户可自动收单'}</span>
            </div>
            <p className="muted">
              配置后：客户下单自动收「订单确认函」，发货自动收「发货通知（含单号）」，发件人为 xyong@xyong.ccwu.cc。
              密码请用 Zoho「应用专用密码」：用 xyong@xyong.ccwu.cc 登录 accounts.zoho.com → 安全性 → 应用专用密码 → 新建（名称随意，生成后复制下来）。
            </p>
            <div className="toolbar">
              <input placeholder="SMTP 账号 xyong@xyong.ccwu.cc" value={smtpForm.user} onChange={(e) => setSmtpForm({ ...smtpForm, user: e.target.value })} />
              <input type="password" placeholder="应用专用密码" value={smtpForm.pass} onChange={(e) => setSmtpForm({ ...smtpForm, pass: e.target.value })} />
              <input placeholder="smtp.zoho.com" value={smtpForm.host} onChange={(e) => setSmtpForm({ ...smtpForm, host: e.target.value })} style={{ width: 150 }} />
              <input placeholder="465" value={smtpForm.port} onChange={(e) => setSmtpForm({ ...smtpForm, port: e.target.value })} style={{ width: 60 }} />
              <button onClick={saveSmtp} disabled={busy}>保存</button>
            </div>
            <div className="toolbar">
              <input placeholder="测试收件地址（如自己的 163 / Gmail）" value={smtpTestTo} onChange={(e) => setSmtpTestTo(e.target.value)} />
              <button onClick={testSmtp} disabled={busy}>发送客户通道测试</button>
            </div>
          </section>
          <section className="panel">
            <div className="panel-head"><h2>表单提交量</h2><span className="muted">按来源统计</span></div>
            <div className="tablewrap">
              <table className="ops">
                <thead><tr><th>来源</th><th>条数</th></tr></thead>
                <tbody>
                  {(mail?.form_sources || []).map((row: Any) => (
                    <tr key={row.source}><td>{row.source}</td><td className="num">{row.count}</td></tr>
                  ))}
                  {!(mail?.form_sources || []).length && <tr><td colSpan={2} className="empty">暂无表单提交</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {tab === 'import' && (
        <section className="panel">
          <div className="panel-head">
            <h2>产品采集</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className={importMode === 'web' ? '' : 'ghost'} onClick={() => setImportMode('web')}>网页采集</button>
              <button className={importMode === 'manual' ? '' : 'ghost'} onClick={() => setImportMode('manual')}>手写录入</button>
            </div>
          </div>
          {importMode === 'web' && (
            <>
              <p className="muted">粘贴供应商商品页链接（支持带 og:title / og:image 的页面）。系统会抓取标题、描述与图片，图片自动存入图库，生成草稿商品；价格需你按美元人工填写后上架。</p>
              <div className="toolbar">
                <input placeholder="https://供应商商品页链接" value={importUrl} onChange={(e) => setImportUrl(e.target.value)} style={{ width: 420 }} />
                <select value={importCat} onChange={(e) => setImportCat(e.target.value)}>
                  {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                </select>
                <button onClick={runImport} disabled={importing}>{importing ? '采集中…' : '开始采集'}</button>
              </div>
              {importResult && (
                <div className="import-result">
                  <div className="import-head">
                    {importResult.cover_url && <img src={`${API}${importResult.cover_url}`} alt="" />}
                    <div>
                      <b>{importResult.title || '未命名'}</b>
                      <small className="block">{importResult.sku} · 已存为草稿</small>
                      <p>{importResult.description}</p>
                    </div>
                  </div>
                  {!!(importResult.price_hints || []).length && (
                    <p className="muted">页面价格线索：{(importResult.price_hints || []).join('、')}（仅供参考，请按美元定价）</p>
                  )}
                  {!!(importResult.candidate_images || []).length && (
                    <div className="import-thumbs">
                      {(importResult.candidate_images || []).slice(0, 6).map((src: string) => <img key={src} src={src} alt="" />)}
                    </div>
                  )}
                  <button className="ghost" onClick={() => { setTab('catalog'); setFilter('draft'); }}>去商品表核对并上架 →</button>
                </div>
              )}
            </>
          )}
          {importMode === 'manual' && (
            <>
              <p className="muted">不依赖网页：直接手工录入产品数据，先存为「采集报告」，再到「实地采集」页补照片与检测报告后一键转商品。田间地头用手机录入请打开 <code>{API}/field</code>。</p>
              <div className="formgrid">
                <label>类别
                  <select value={manual.category} onChange={(e) => setManual({ ...manual, category: e.target.value })}>
                    {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                  </select>
                </label>
                <label>产品名称（中文）*
                  <input value={manual.name_zh} onChange={(e) => setManual({ ...manual, name_zh: e.target.value })} placeholder="保山高黎贡山精品阿拉比卡" />
                </label>
                <label>Product Name（英文）
                  <input value={manual.name_en} onChange={(e) => setManual({ ...manual, name_en: e.target.value })} placeholder="GaoLiGong Mountain Arabica" />
                </label>
                <label>产地 / 采集地点*
                  <input value={manual.origin} onChange={(e) => setManual({ ...manual, origin: e.target.value })} placeholder="云南省保山市隆阳区" />
                </label>
                <label>海拔（米）
                  <input value={manual.altitude} onChange={(e) => setManual({ ...manual, altitude: e.target.value })} placeholder="1500-1800" />
                </label>
                <label>采收季节 / 日期
                  <input value={manual.season} onChange={(e) => setManual({ ...manual, season: e.target.value })} placeholder="2026年11月" />
                </label>
                <label>批号
                  <input value={manual.batch} onChange={(e) => setManual({ ...manual, batch: e.target.value })} />
                </label>
                <label>可供货量
                  <input value={manual.qty} onChange={(e) => setManual({ ...manual, qty: e.target.value })} placeholder="500" />
                </label>
                <label>计量单位
                  <input value={manual.unit} onChange={(e) => setManual({ ...manual, unit: e.target.value })} placeholder="kg" />
                </label>
                <label>参考单价（美元）
                  <input value={manual.price_usd} onChange={(e) => setManual({ ...manual, price_usd: e.target.value })} placeholder="69" />
                </label>
                <label>保质期
                  <input value={manual.shelf_life} onChange={(e) => setManual({ ...manual, shelf_life: e.target.value })} placeholder="12个月" />
                </label>
                <label>储存条件
                  <input value={manual.storage} onChange={(e) => setManual({ ...manual, storage: e.target.value })} placeholder="阴凉干燥、避光密封" />
                </label>
                <label className="wide">认证情况
                  <input value={manual.certifications} onChange={(e) => setManual({ ...manual, certifications: e.target.value })} placeholder="中国有机 / USDA Organic / 检测报告编号…" />
                </label>
                <label className="wide">品牌故事 / 备注
                  <textarea value={manual.story} onChange={(e) => setManual({ ...manual, story: e.target.value })} rows={3} placeholder="产地故事、加工细节、核心卖点…" />
                </label>
              </div>
              <div className="formactions">
                <button onClick={submitManual} disabled={busy}>保存为采集报告</button>
                <button className="ghost" onClick={() => setTab('field')}>去「实地采集」审核 →</button>
              </div>
            </>
          )}
        </section>
      )}

      {tab === 'field' && (
        <section className="panel">
          <div className="panel-head"><h2>实地采集</h2><span className="muted">产地现场数据 · 照片 · 检测报告</span></div>
          <p className="muted">手机打开 <code>{API}/field</code>（输入中台访问码）即可在产地实地拍照录入；这里的报告可一键转为商品草稿，检测报告等合规文件随商品归档。</p>
          {!fieldReports.length && <p className="muted">暂无实地采集报告。去产地时用手机打开上面的链接开始采集。</p>}
          <div className="tasks">
            {fieldReports.map((r: Any) => {
              const open = fieldOpen === r.id;
              const photos: Any[] = r.photos || [];
              const docs: Any[] = r.docs || [];
              const d = r.data || {};
              return (
                <article key={r.id} className="task" style={{ display: 'block' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    {photos[0] && <img src={`${API}${photos[0].url}`} alt="" style={{ width: 54, height: 54, objectFit: 'cover', borderRadius: 8 }} />}
                    <div style={{ flex: 1, minWidth: 160 }}>
                      <b>{r.product_name || '未命名'}</b>
                      <small className="block muted">{r.id} · {r.category} · {r.created_at} · {r.status === 'published' ? '已转商品' : '待审核'} · 照片 {photos.length} 张 / 文件 {docs.length} 份</small>
                    </div>
                    <button onClick={() => setFieldOpen(open ? '' : r.id)}>{open ? '收起' : '查看'}</button>
                    {r.status !== 'published' && <button onClick={() => publishField(r.id)}>转为商品</button>}
                    <button className="ghost" onClick={() => deleteField(r.id)}>删除</button>
                  </div>
                  {open && (
                    <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 14 }}>
                      <div>
                        <h4 style={{ marginBottom: 6 }}>采集数据</h4>
                        <table className="plain">
                          <tbody>
                            {Object.entries(d).filter(([, v]) => typeof v === 'string' && v).map(([k, v]) => (
                              <tr key={k}><th style={{ whiteSpace: 'nowrap' }}>{k}</th><td>{String(v)}</td></tr>
                            ))}
                            {!Object.keys(d).length && <tr><td className="muted">无数据字段</td></tr>}
                          </tbody>
                        </table>
                      </div>
                      <div>
                        <h4 style={{ marginBottom: 6 }}>现场照片</h4>
                        <div className="import-thumbs" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {photos.map((p) => <img key={p.key} src={`${API}${p.url}`} alt={p.slot} title={p.slot} style={{ width: 84, height: 84, objectFit: 'cover', borderRadius: 8 }} />)}
                          {!photos.length && <span className="muted">无照片</span>}
                        </div>
                        <h4 style={{ margin: '12px 0 6px' }}>合规 / 检测文件</h4>
                        {!docs.length && <span className="muted">未上传文件</span>}
                        {docs.map((doc, i) => (
                          <div key={i} style={{ marginBottom: 8 }}>
                            <b style={{ fontSize: 13 }}>{doc.type}</b>
                            <small className="block muted">{[doc.no, doc.issuer, doc.expiry && ('有效期至 ' + doc.expiry)].filter(Boolean).join(' · ') || '（未填编号）'}</small>
                            {(doc.files || []).map((f: Any) => (
                              <a key={f.key} href={`${API}${f.url}`} target="_blank" rel="noreferrer" style={{ marginRight: 8, fontSize: 12 }}>
                                {f.mime && f.mime.indexOf('image') === 0
                                  ? <img src={`${API}${f.url}`} alt="" style={{ width: 46, height: 46, objectFit: 'cover', borderRadius: 6 }} />
                                  : '📄 ' + (f.name || '文件')}
                              </a>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}

      {tab === 'ai' && (
        <section className="panel">
          <div className="panel-head"><h2>AI Agent 工作区</h2><button onClick={() => guard(() => call('/api/ops/agent/run', 'POST', {}).then(() => {}), 'Agent 已生成新任务')} disabled={busy}>运行 AI Agent</button></div>
          <p className="muted">AI 只给建议；资金、退款、发布需要你批准。</p>
          <div className="tasks">
            {(growth?.tasks || []).map((x: Any) => (
              <article key={x.id} className={`task ${x.priority}`}>
                <div><b>{x.title}</b><p>{x.recommendation}</p><small>{x.agent_name} · {x.priority}</small></div>
                <div>
                  <button onClick={() => guard(() => call(`/api/ops/agent/tasks/${x.id}`, 'PUT', { status: 'approved' }).then(() => {}), '已批准')}>批准</button>
                  <button onClick={() => guard(() => call(`/api/ops/agent/tasks/${x.id}`, 'PUT', { status: 'rejected' }).then(() => {}), '已拒绝')}>拒绝</button>
                </div>
              </article>
            ))}
            {!(growth?.tasks || []).length && <p className="muted">暂无待办</p>}
          </div>
        </section>
      )}

      {tab === 'access' && (
        <section className="panel" id="access">
          <div className="panel-head"><h2>密钥管理</h2><span className="muted">中台唯一管理密码</span></div>
          <p className="muted">
            中台入口 <code>https://ops.xyong.ccwu.cc</code>。密码保存在云数据库 settings 表，修改后立即生效，无需重新部署。
          </p>
          <div className="tokenline">
            <span className="muted">当前密码</span>
            <code>{tokenInfo ? (showToken ? String(tokenInfo.token) : '•'.repeat(Math.min(20, String(tokenInfo.token).length))) : '—'}</code>
            <button className="ghost" onClick={() => setShowToken((v) => !v)}>{showToken ? '隐藏' : '显示'}</button>
            <button className="ghost" onClick={() => { navigator.clipboard?.writeText(String(tokenInfo?.token || '')); setNotice('密码已复制'); }}>复制</button>
            <span className="muted">{tokenInfo?.source === 'database' ? '（自定义密码）' : '（初始部署密钥）'}</span>
          </div>
          <div className="formgrid">
            <label className="wide">设置新密码（至少 8 位）
              <input value={newToken} onChange={(e) => setNewToken(e.target.value)} placeholder="例如 xyong-ops-2026-a8f3" />
            </label>
            <div className="formactions"><button onClick={rotateToken} disabled={busy}>更新密码</button></div>
          </div>
          <p className="muted">忘记密码：D1 → xyong-db → 执行 <code>DELETE FROM settings WHERE key='admin_token'</code>，即回到部署密钥。</p>
        </section>
      )}

      <footer className="opsfoot">
        <span>XYONG · 运营中台</span>
        <span>所有金额为美元（USD） · <a href="https://xyong.ccwu.cc/shop/">返回商城</a></span>
      </footer>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
