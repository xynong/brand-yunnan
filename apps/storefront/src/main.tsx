import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

const API = import.meta.env.VITE_API_BASE_URL || 'https://apixyong.ccwu.cc';
const LANGUAGE_KEY = 'xyong-storefront-language';
const SESSION_KEY = 'xyong-cart-session';

type Language = 'zh' | 'en';

type Product = {
  id: string;
  sku: string;
  name: string;
  name_zh?: string;
  name_en?: string;
  category: string;
  origin?: string;
  altitude?: string;
  description: string;
  description_zh?: string;
  description_en?: string;
  currency?: string;
  price_usd: number;
  image_url?: string;
  available_qty?: number;
  brand_name?: string;
  spec?: string;
};

type ProductRow = Record<string, unknown>;

type CartItem = {
  product: Product;
  quantity: number;
};

const messages = {
  en: {
    navHome: 'Home',
    navShop: 'Shop',
    navOrigin: 'Our Origin',
    navTrace: 'Traceability',
    heroEyebrow: 'YUNNAN • CHINA • SINGLE ORIGIN',
    heroTitle: 'Exceptional Yunnan, delivered to the world.',
    heroBody: 'Discover exceptional products from Yunnan, selected for their origin, quality, and traceability.',
    explore: 'Explore the collection',
    collectionEyebrow: 'THE COLLECTION',
    collectionTitle: 'Distinctive products. One origin philosophy.',
    loading: 'Loading products…',
    loadError: 'Could not load products. Please try again later.',
    noProducts: 'No active products are available right now.',
    originLabel: 'Origin',
    altitudeLabel: 'Altitude',
    available: 'Available',
    preOrder: 'Pre-order',
    addToCart: 'Add to cart',
    originEyebrow: 'ORIGIN FIRST',
    originTitle: 'From Yunnan source to your door.',
    originBody: 'We connect product origins, batches, quality evidence, inventory, and customer orders to support transparent cross-border commerce.',
    traceEyebrow: 'TRACEABILITY',
    traceTitle: 'Traceable from origin to delivery.',
    traceOrigin: 'Origin',
    traceBatch: 'Batch',
    traceQuality: 'Quality',
    traceDelivery: 'Delivery',
    cart: 'Cart',
    itemTypes: 'product types',
    total: 'Total',
    checkout: 'Proceed to checkout',
    language: '中文',
    currency: 'USD',
    brandTagline: 'Yunnan Boutique Garden',
    cartEmpty: 'Your cart is empty. Add a product to start.',
    close: 'Close',
    viewCart: 'View cart',
    opsEntry: 'Operations',
    qty: 'Qty',
    remove: 'Remove',
    coupon: 'Coupon code',
    applyCoupon: 'Apply',
    couponOk: 'Coupon applied',
    couponBad: 'Invalid coupon',
    checkOutTitle: 'Shipping details',
    fName: 'Full name',
    fEmail: 'Email',
    fPhone: 'Phone',
    fCountry: 'Country / Region',
    fAddress: 'Shipping address',
    fCity: 'City',
    fPostal: 'Postal code',
    fNote: 'Order note (optional)',
    placeOrder: 'Place order (pay later)',
    placing: 'Placing order…',
    orderDone: 'Order placed successfully!',
    orderNoLabel: 'Order number',
    orderTotalLabel: 'Amount due',
    payPending: 'Online payment is coming soon. We will email you a secure payment link for this order.',
    backShop: 'Continue shopping',
    subscribe: 'Subscribe',
    subscribePh: 'Email for new arrivals',
    subscribeOk: 'Subscribed! Welcome aboard.',
    subscribeBad: 'Please enter a valid email.',
    contactTitle: 'Wholesale & inquiries',
    contactName: 'Your name',
    contactMsg: 'Message',
    contactSend: 'Send inquiry',
    contactOk: 'Inquiry sent. We reply within one business day.',
  },
  zh: {
    navHome: '首页',
    navShop: '商品',
    navOrigin: '产地介绍',
    navTrace: '溯源信息',
    heroEyebrow: '中国 • 云南 • 原产地精选',
    heroTitle: '甄选云南好物，送达世界各地。',
    heroBody: '探索来自云南的特色产品，以原产地、品质和可追溯信息为核心。',
    explore: '浏览商品',
    collectionEyebrow: '精选商品',
    collectionTitle: '甄选云南特色好物，坚持原产地理念。',
    loading: '正在加载商品…',
    loadError: '暂时无法加载商品，请稍后重试。',
    noProducts: '目前暂无在售商品。',
    originLabel: '产地',
    altitudeLabel: '海拔',
    available: '有货',
    preOrder: '可预订',
    addToCart: '加入购物车',
    originEyebrow: '原产地优先',
    originTitle: '从云南原产地，送到您手中。',
    originBody: '我们连接产品产地、批次、品质信息、库存和客户订单，支持透明、可信的跨境电商服务。',
    traceEyebrow: '产品溯源',
    traceTitle: '从产地到交付，全程可追溯。',
    traceOrigin: '产地',
    traceBatch: '批次',
    traceQuality: '品质',
    traceDelivery: '交付',
    cart: '购物车',
    itemTypes: '种商品',
    total: '合计',
    checkout: '去结算',
    language: 'EN',
    currency: '美元',
    brandTagline: '云南精品园',
    cartEmpty: '购物车还是空的，选一件商品开始吧。',
    close: '关闭',
    viewCart: '查看购物车',
    opsEntry: '运营管理',
    qty: '数量',
    remove: '删除',
    coupon: '优惠码',
    applyCoupon: '使用',
    couponOk: '优惠码已生效',
    couponBad: '优惠码无效或已过期',
    checkOutTitle: '填写收货信息',
    fName: '收货人姓名',
    fEmail: '电子邮箱',
    fPhone: '联系电话',
    fCountry: '国家 / 地区',
    fAddress: '详细地址',
    fCity: '城市',
    fPostal: '邮政编码',
    fNote: '订单备注（选填）',
    placeOrder: '提交订单（后付）',
    placing: '正在提交…',
    orderDone: '下单成功！',
    orderNoLabel: '订单号',
    orderTotalLabel: '应付金额',
    payPending: '在线支付即将开通，我们会向您的邮箱发送本订单的安全支付链接。',
    backShop: '继续购物',
    subscribe: '订阅',
    subscribePh: '输入邮箱，获取新品上架通知',
    subscribeOk: '订阅成功，欢迎加入！',
    subscribeBad: '请输入有效邮箱',
    contactTitle: '批发与咨询',
    contactName: '您的称呼',
    contactMsg: '留言内容',
    contactSend: '发送咨询',
    contactOk: '咨询已发送，我们会在一个工作日内回复。',
  },
} as const;

const categoryNames: Record<string, Record<Language, string>> = {
  coffee: { en: 'Coffee', zh: '咖啡' },
  tea: { en: 'Ancient Tree Tea', zh: '古树茶' },
  truffle: { en: 'Black Truffle', zh: '黑松露' },
  'essential-oil': { en: 'Botanical Essential Oil', zh: '植物精油' },
  ancient_tree_tea: { en: 'Ancient Tree Tea', zh: '古树茶' },
  black_truffle: { en: 'Black Truffle', zh: '黑松露' },
  botanical_essential_oil: { en: 'Botanical Essential Oil', zh: '植物精油' },
};

const categorySlugs = ['coffee', 'tea', 'truffle', 'essential-oil'] as const;

// 商品资料目前只存中文（数据库单语）。英文界面用这份对照表输出纯英文，
// 未收录的新商品自动回退中文，不会出现半中半英。
type LocalizedCopy = { name: string; origin?: string; altitude?: string; description?: string; spec?: string };
const englishContent: Record<string, LocalizedCopy> = {
  'COF-NUJ-001': {
    name: 'Muling Coffee',
    origin: 'Nujiang Valley, Yunnan',
    altitude: '1,500 m',
    description: 'Specialty coffee grown in the Nujiang Valley of Yunnan, sun-dried and slow roasted.',
    spec: '250g / bag · whole bean',
  },
  'TEA-LC-001': {
    name: 'Hani Ancient Tree Tea',
    origin: 'Lüchun, Yunnan',
    altitude: '1,900 m',
    description: 'Hand-picked from old tea trees in the highlands of Lüchun, Yunnan.',
    spec: '100g / jar · loose leaf',
  },
  'TRU-001-100g': {
    name: 'Lijiang Black Truffle',
    origin: 'Lijiang, Yunnan',
    altitude: '1,800 m',
    description: 'Wild-harvested black truffle from the highlands of Lijiang at 1,800 m.',
    spec: '100g / bag · fresh',
  },
  'SKU-1793888955283': {
    name: 'Fresh Breeze Botanical Oil',
    origin: 'Kunming, Yunnan',
    altitude: '1,900 m',
    description: 'Tea tree hydrosol blended with clary sage essential oil. No synthetic fragrance.',
    spec: '30ml / bottle',
  },
};

function optionalNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function optionalText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const text = value.trim();
  return text || undefined;
}

function imageSrc(value?: string): string | undefined {
  if (!value) return undefined;
  if (/^https?:\/\//i.test(value)) return value;
  if (/^(data|blob):/i.test(value) || value.startsWith('//')) return value;
  if (value.startsWith('/')) {
    return new URL(encodeURI(value), `${API.replace(/\/$/, '')}/`).toString();
  }
  return value;
}

function normalizeProduct(row: ProductRow): Product {
  const priceUsd = optionalNumber(row.price_usd);
  const priceCents = optionalNumber(row.price_cents);
  const availableQty = optionalNumber(row.available_qty);
  return {
    id: String(row.id ?? row.sku ?? ''),
    sku: String(row.sku ?? row.id ?? ''),
    name:
      optionalText(row.name) ??
      optionalText(row.name_en) ??
      optionalText(row.name_zh) ??
      String(row.sku ?? ''),
    name_zh: optionalText(row.name_zh) ?? optionalText(row.name),
    name_en: optionalText(row.name_en) ?? optionalText(row.name),
    category: optionalText(row.category) ?? '',
    origin: optionalText(row.origin),
    altitude: optionalText(row.altitude),
    description:
      optionalText(row.description) ??
      optionalText(row.description_en) ??
      optionalText(row.description_zh) ??
      '',
    description_zh:
      optionalText(row.description_zh) ?? optionalText(row.description),
    description_en:
      optionalText(row.description_en) ?? optionalText(row.description),
    price_usd: priceUsd ?? (priceCents !== undefined ? priceCents / 100 : 0),
    currency: optionalText(row.currency) ?? 'USD',
    image_url: optionalText(row.cover_url) ?? optionalText(row.image_url),
    available_qty: availableQty,
    brand_name: optionalText(row.brand_name),
    spec:
      optionalText(row.spec) ??
      ([optionalText(row.weight), optionalText(row.unit)].filter(Boolean).join(' · ') || undefined),
  };
}

function ProductImage({ src, alt, fallback }: { src?: string; alt: string; fallback: string }) {
  const [failed, setFailed] = useState(false);
  const resolvedSrc = imageSrc(src);
  if (!resolvedSrc || failed) {
    return <span className="product-image-fallback">{fallback}</span>;
  }
  return (
    <img
      src={resolvedSrc}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

function initialLanguage(): Language {
  try {
    const shared = window.localStorage.getItem('xyong-lang');
    if (shared === 'zh' || shared === 'en') return shared;
    const saved = window.localStorage.getItem(LANGUAGE_KEY);
    if (saved === 'zh' || saved === 'en') return saved;
  } catch {
    // Storage may be unavailable in private browsing; use browser preference.
  }
  return navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

function cartSessionId(): string {
  try {
    let sid = window.localStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid = crypto.randomUUID();
      window.localStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
  } catch {
    return 'anon-session';
  }
}

type DrawerView = 'cart' | 'form' | 'done';

type ShippingForm = {
  name: string; email: string; phone: string; country: string;
  address: string; city: string; postal_code: string; note: string;
};

const emptyForm: ShippingForm = {
  name: '', email: '', phone: '', country: '', address: '', city: '', postal_code: '', note: '',
};

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [lang, setLang] = useState<Language>(initialLanguage);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [view, setView] = useState<DrawerView>('cart');
  const [coupon, setCoupon] = useState('');
  const [couponApplied, setCouponApplied] = useState<string | null>(null);
  const [couponMsg, setCouponMsg] = useState('');
  const [form, setForm] = useState<ShippingForm>(emptyForm);
  const [placing, setPlacing] = useState(false);
  const [orderResult, setOrderResult] = useState<{ order_no: string; total_usd: number } | null>(null);
  const [subEmail, setSubEmail] = useState('');
  const [subState, setSubState] = useState('');
  const [inquiry, setInquiry] = useState({ name: '', email: '', message: '' });
  const [inquiryState, setInquiryState] = useState('');
  const [sendingInquiry, setSendingInquiry] = useState(false);
  const t = messages[lang];

  const params = new URLSearchParams(location.search);
  const source = params.get('utm_source') || 'direct';
  const medium = params.get('utm_medium') || '';
  const campaign = params.get('utm_campaign') || '';

  useEffect(() => {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    document.title = lang === 'zh'
      ? 'XYONG BRAND · 云南精品园 | 跨境商城'
      : 'XYONG BRAND · Yunnan Boutique Garden';
    try {
      window.localStorage.setItem(LANGUAGE_KEY, lang);
      window.localStorage.setItem('xyong-lang', lang);
    } catch {
      // The selected language still works for the current page session.
    }
  }, [lang]);

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      try {
        const response = await fetch(`${API}/api/store/products`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = (await response.json()) as { products?: ProductRow[] };
        if (!cancelled) {
          setProducts((data.products ?? []).map(normalizeProduct));
          setLoadError(false);
        }
      } catch {
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadProducts();

    // 服务端购物车：用固定 session_id 恢复上次的购物车
    (async () => {
      try {
        const sid = cartSessionId();
        const resp = await fetch(`${API}/api/cart?session_id=${encodeURIComponent(sid)}`);
        if (!resp.ok) return;
        const data = await resp.json() as { items?: any[] };
        if (!cancelled && data.items) {
          setCart(data.items.map((row) => ({
            product: normalizeProduct({
              ...row,
              id: row.product_id,
              description: row.description ?? '',
            }),
            quantity: Number(row.quantity || 1),
          })));
        }
      } catch {
        // 服务端购物车不可用时保持本地状态，不影响浏览。
      }
    })();

    fetch(`${API}/api/acquisition/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: crypto.randomUUID(),
        source,
        medium,
        campaign,
        landing_path: location.pathname,
        event_type: 'visit',
      }),
    }).catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  const add = (product: Product) => {
    setCartOpen(true);
    setView('cart');
    setCart(current => {
      const existing = current.find(item => item.product.sku === product.sku);
      if (!existing) return [...current, { product, quantity: 1 }];
      return current.map(item => {
        if (item.product.sku !== product.sku) return item;
        const nextQuantity = item.quantity + 1;
        return {
          ...item,
          quantity: product.available_qty === undefined
            ? nextQuantity
            : Math.min(nextQuantity, product.available_qty),
        };
      });
    });

    // 同步到服务端购物车（cart_items 表）
    fetch(`${API}/api/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: cartSessionId(), product_id: product.id, quantity: 1 }),
    }).catch(() => {});

    fetch(`${API}/api/acquisition/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source,
        medium,
        campaign,
        landing_path: location.pathname,
        event_type: 'add_to_cart',
        product_sku: product.sku,
        value_usd: product.price_usd,
      }),
    }).catch(() => {});
  };

  const setQuantity = (product: Product, next: number) => {
    setCart(current => {
      if (next <= 0) return current.filter(item => item.product.sku !== product.sku);
      return current.map(item =>
        item.product.sku === product.sku
          ? {
              ...item,
              quantity: product.available_qty === undefined
                ? next
                : Math.min(next, product.available_qty),
            }
          : item,
      );
    });
    fetch(`${API}/api/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: cartSessionId(), product_id: product.id, quantity: Math.max(0, next), set_quantity: true }),
    }).catch(() => {});
  };

  const clearCart = () => {
    setCart([]);
    fetch(`${API}/api/cart?session_id=${encodeURIComponent(cartSessionId())}`, { method: 'DELETE' }).catch(() => {});
  };

  const checkCoupon = async () => {
    const code = coupon.trim();
    if (!code) return;
    setCouponMsg('');
    try {
      const resp = await fetch(`${API}/api/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await resp.json();
      if (resp.ok && data.valid) {
        setCouponApplied(data.code);
        setCouponMsg(t.couponOk);
      } else {
        setCouponApplied(null);
        setCouponMsg(data.error || t.couponBad);
      }
    } catch {
      setCouponMsg(t.couponBad);
    }
  };

  const submitOrder = async () => {
    if (!form.name || !form.email || !form.phone || !form.address) return;
    setPlacing(true);
    try {
      const resp = await fetch(`${API}/api/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: cartSessionId(),
          coupon_code: couponApplied || undefined,
          customer: {
            name: form.name, email: form.email, phone: form.phone,
            country: form.country || 'China', address: form.address,
            city: form.city, postal_code: form.postal_code,
          },
          note: form.note || undefined,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'checkout failed');
      setOrderResult({ order_no: data.order_no, total_usd: data.total_usd });
      setCart([]);
      setView('done');
    } catch {
      // 提交失败保留表单，让用户重试。
    } finally {
      setPlacing(false);
    }
  };

  const subscribe = async () => {    const email = subEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setSubState(t.subscribeBad); return; }
    try {
      const resp = await fetch(`${API}/api/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'footer', consent: true }),
      });
      setSubState(resp.ok ? t.subscribeOk : t.subscribeBad);
      if (resp.ok) setSubEmail('');
    } catch {
      setSubState(t.subscribeBad);
    }
  };

  const sendInquiry = async () => {
    if (!inquiry.email || !inquiry.message) return;
    setSendingInquiry(true);
    setInquiryState('');
    try {
      const resp = await fetch(`${API}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...inquiry, country: '', source: 'storefront_contact' }),
      });
      if (!resp.ok) throw new Error('failed');
      setInquiryState(t.contactOk);
      setInquiry({ name: '', email: '', message: '' });
    } catch {
      setInquiryState(t.subscribeBad);
    } finally {
      setSendingInquiry(false);
    }
  };

  const total = cart.reduce(
    (sum, item) => sum + item.product.price_usd * item.quantity,
    0,
  );
  // 全站统一美元报价：金额以“美分”存储，展示时固定两位小数并注明 US$。
  const money = (amount: number, currency = 'USD') => {
    const value = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number.isFinite(amount) ? amount : 0);
    return currency === 'USD' ? `US$${value}` : `${currency} ${value}`;
  };
  const categoryName = (category: string) =>
    categoryNames[category]?.[lang] || category.replaceAll('_', ' ');
  // 中英分离：英文界面用英文对照表，缺失字段宁可留空也不混排中文。
  const localized = (product: Product) => {
    const en = englishContent[product.sku];
    const clean = (value?: string) =>
      value && !/[\u4e00-\u9fa5]/.test(value) ? value : undefined;
    const altitude = (value?: string) =>
      value ? (/^\d+(\.\d+)?$/.test(value.trim()) ? `${value.trim()} m` : value.trim()) : undefined;
    if (lang === 'en') {
      return {
        name: en?.name || clean(product.name_en) || product.name,
        origin: en?.origin || clean(product.origin),
        altitude: en?.altitude || altitude(product.altitude),
        description: en?.description || clean(product.description_en),
        spec: en?.spec || clean(product.spec),
      };
    }
    return {
      name: product.name_zh || product.name,
      origin: product.origin,
      altitude: altitude(product.altitude),
      description: product.description_zh || product.description,
      spec: product.spec,
    };
  };
  const productName = (product: Product) => localized(product).name;
  const canAdd = (product: Product) =>
    product.available_qty === undefined || product.available_qty > 0;

  const formValid = form.name && form.email && form.phone && form.address;

  return (
    <div className="site">
      <header>
        <a className="brand" href="/">XYONG BRAND <span>{t.brandTagline}</span></a>
        <nav>
          <a href="/">{t.navHome}</a>
          <a href="#shop">{t.navShop}</a>
          <a href="#origin">{t.navOrigin}</a>
          <a href="#trace">{t.navTrace}</a>
          <button
            type="button"
            className="lang-btn"
            aria-label={lang === 'en' ? '切换到中文' : 'Switch to English'}
            onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
          >
            {t.language}
          </button>
          <button
            type="button"
            className="cart-btn"
            onClick={() => { setCartOpen(true); setView('cart'); }}
            aria-label={t.viewCart}
          >
            {t.cart}
            <i>{cart.reduce((sum, item) => sum + item.quantity, 0)}</i>
          </button>
        </nav>
      </header>

      <section className="hero">
        <div>
          <p className="eyebrow">{t.heroEyebrow}</p>
          <h1>{t.heroTitle}</h1>
          <p>{t.heroBody}</p>
          <a className="cta" href="#shop">{t.explore}</a>
        </div>
      </section>

      <section id="shop" className="section">
        <div className="section-head">
          <div>
            <p className="eyebrow">{t.collectionEyebrow}</p>
            <h2>{t.collectionTitle}</h2>
          </div>
        </div>
        <div className="chips">
          {categorySlugs.map(category => (
            <span key={category}>{categoryName(category)}</span>
          ))}
        </div>

        {loading ? (
          <p>{t.loading}</p>
        ) : loadError ? (
          <p role="alert">{t.loadError}</p>
        ) : products.length === 0 ? (
          <p>{t.noProducts}</p>
        ) : (
          <div className="grid">
            {products.map(product => {
              const copy = localized(product);
              return (
                <article className="card" key={product.sku}>
                  <div className="image">
                    <ProductImage
                      src={product.image_url}
                      alt={copy.name}
                      fallback={categoryName(product.category)}
                    />
                  </div>
                  <div className="card-body">
                    <div className="meta">
                      <span>{categoryName(product.category)}</span>
                      <span className={canAdd(product) ? 'in-stock' : 'pre-order'}>
                        {canAdd(product) ? t.available : t.preOrder}
                      </span>
                    </div>
                    <h3>{copy.name}</h3>
                    <div className="facts">
                      {copy.origin && (
                        <p><span>{t.originLabel}</span>{copy.origin}</p>
                      )}
                      {copy.altitude && (
                        <p><span>{t.altitudeLabel}</span>{copy.altitude}</p>
                      )}
                    </div>
                    {copy.description && <p className="desc">{copy.description}</p>}
                    {copy.spec && <p className="spec">{copy.spec}</p>}
                    <div className="buy">
                      <strong>{money(product.price_usd, product.currency)}</strong>
                      <button disabled={!canAdd(product)} onClick={() => add(product)}>
                        {t.addToCart}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section id="origin" className="dark section">
        <p className="eyebrow">{t.originEyebrow}</p>
        <h2>{t.originTitle}</h2>
        <p className="wide">{t.originBody}</p>
      </section>

      <section id="trace" className="section">
        <div className="trace">
          <div>
            <p className="eyebrow">{t.traceEyebrow}</p>
            <h2>{t.traceTitle}</h2>
          </div>
          <div className="steps">
            <div><b>01</b><span>{t.traceOrigin}</span></div>
            <div><b>02</b><span>{t.traceBatch}</span></div>
            <div><b>03</b><span>{t.traceQuality}</span></div>
            <div><b>04</b><span>{t.traceDelivery}</span></div>
          </div>
        </div>
      </section>

      <section className="contact section">
        <div className="contact-grid">
          <div>
            <p className="eyebrow">WHOLESALE / CONTACT</p>
            <h2>{t.contactTitle}</h2>
            <p className="contact-note">
              {lang === 'zh'
                ? '批发、企业礼品与产地定制，请留下需求，我们一个工作日内回复。也可直接写信到 xyong@xyong.ccwu.cc。'
                : 'Wholesale, corporate gifting and origin sourcing — leave your needs and we reply within one business day. Or email xyong@xyong.ccwu.cc.'}
            </p>
          </div>
          <div className="contact-form">
            <input placeholder={t.contactName} value={inquiry.name} onChange={(e) => setInquiry({ ...inquiry, name: e.target.value })} />
            <input placeholder={t.fEmail} type="email" value={inquiry.email} onChange={(e) => setInquiry({ ...inquiry, email: e.target.value })} />
            <textarea placeholder={t.contactMsg} rows={3} value={inquiry.message} onChange={(e) => setInquiry({ ...inquiry, message: e.target.value })} />
            <button disabled={!inquiry.email || !inquiry.message || sendingInquiry} onClick={sendInquiry}>
              {sendingInquiry ? '…' : t.contactSend}
            </button>
            {inquiryState && <p className="contact-state">{inquiryState}</p>}
          </div>
        </div>
      </section>

      {cartOpen && <div className="cart-overlay" onClick={() => setCartOpen(false)} />}
      <aside className={cartOpen ? 'cart-panel open' : 'cart-panel'} aria-hidden={!cartOpen}>
        <div className="cart-head">
          <div>
            <b>{view === 'form' ? t.checkOutTitle : view === 'done' ? t.orderDone : t.cart}</b>
            {view === 'cart' && <small>{cart.reduce((sum, item) => sum + item.quantity, 0)} {t.itemTypes}</small>}
          </div>
          <button type="button" className="cart-close" onClick={() => setCartOpen(false)} aria-label={t.close}>
            ×
          </button>
        </div>

        {view === 'cart' && (
          <>
            <div className="cart-lines">
              {cart.map(item => (
                <div className="line" key={item.product.sku}>
                  <div className="line-info">
                    <span>{productName(item.product)}</span>
                    <small>{money(item.product.price_usd, item.product.currency)}</small>
                  </div>
                  <div className="line-qty">
                    <button onClick={() => setQuantity(item.product, item.quantity - 1)} aria-label="-">−</button>
                    <b>{item.quantity}</b>
                    <button
                      onClick={() => setQuantity(item.product, item.quantity + 1)}
                      disabled={item.product.available_qty !== undefined && item.quantity >= item.product.available_qty}
                      aria-label="+"
                    >+</button>
                  </div>
                </div>
              ))}
              {!cart.length && <p className="cart-empty">{t.cartEmpty}</p>}
            </div>
            <div className="coupon-row">
              <input
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                placeholder={t.coupon}
                disabled={!!couponApplied}
              />
              <button onClick={checkCoupon} disabled={!coupon.trim() || !!couponApplied}>{t.applyCoupon}</button>
            </div>
            {couponMsg && <p className={couponApplied ? 'coupon-ok' : 'coupon-bad'}>{couponMsg}</p>}
            <div className="total">
              <span>{t.total}</span>
              <strong>{money(total, 'USD')}</strong>
            </div>
            <button
              className="checkout"
              disabled={!cart.length}
              onClick={() => setView('form')}
            >
              {t.checkout}
            </button>
          </>
        )}

        {view === 'form' && (
          <>
            <div className="checkout-form">
              <input placeholder={t.fName} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <input placeholder={t.fEmail} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <input placeholder={t.fPhone} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <input placeholder={t.fCountry} value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
              <input placeholder={t.fAddress} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              <div className="two-col">
                <input placeholder={t.fCity} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                <input placeholder={t.fPostal} value={form.postal_code} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} />
              </div>
              <textarea placeholder={t.fNote} rows={2} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </div>
            <div className="total">
              <span>{t.total}</span>
              <strong>{money(total, 'USD')}</strong>
            </div>
            <button className="checkout" disabled={!formValid || placing} onClick={submitOrder}>
              {placing ? t.placing : t.placeOrder}
            </button>
            <button className="linklike" onClick={() => setView('cart')}>← {t.cart}</button>
          </>
        )}

        {view === 'done' && orderResult && (
          <div className="done-view">
            <div className="done-badge">✓</div>
            <p className="done-total"><span>{t.orderNoLabel}</span><code>{orderResult.order_no}</code></p>
            <p className="done-total"><span>{t.orderTotalLabel}</span><strong>{money(orderResult.total_usd, 'USD')}</strong></p>
            <p className="done-note">{t.payPending}</p>
            <button className="checkout" onClick={() => { setCartOpen(false); setView('cart'); setOrderResult(null); }}>
              {t.backShop}
            </button>
          </div>
        )}
      </aside>

      <footer>
        <span>© 2026 XYONG BRAND · {t.brandTagline} · {lang === 'zh' ? '跨境商城' : 'International Store'}</span>
        <span className="subrow">
          <input
            value={subEmail}
            onChange={(e) => setSubEmail(e.target.value)}
            placeholder={t.subscribePh}
            aria-label={t.subscribe}
          />
          <button onClick={subscribe}>{t.subscribe}</button>
          {subState && <em>{subState}</em>}
        </span>
        <a href="https://ops.xyong.ccwu.cc" target="_blank" rel="noreferrer">{t.opsEntry}</a>
      </footer>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
