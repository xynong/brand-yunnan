import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787';
const LANGUAGE_KEY = 'xyong-storefront-language';

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
    checkout: 'Proceed to secure checkout',
    checkoutNotice: 'Checkout is not enabled yet. Please contact us to place an order.',
    language: '中文',
    currency: 'USD',
    brandTagline: 'Yunnan Origin',
  },
  zh: {
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
    checkout: '前往安全结账',
    checkoutNotice: '在线结账暂未开放。如需购买，请联系我们。',
    language: 'EN',
    currency: '美元',
    brandTagline: '云南原产地',
  },
} as const;

const categoryNames: Record<string, Record<Language, string>> = {
  coffee: { en: 'Coffee', zh: '咖啡' },
  ancient_tree_tea: { en: 'Ancient Tree Tea', zh: '古树茶' },
  black_truffle: { en: 'Black Truffle', zh: '黑松露' },
  botanical_essential_oil: { en: 'Botanical Essential Oil', zh: '植物精油' },
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

  // Keep absolute image/CDN URLs absolute. encodeURI preserves URL syntax
  // while encoding Chinese and other non-ASCII characters in the path.
  const encoded = encodeURI(value);
  if (/^(https?:)?\/\//i.test(value) || /^(data|blob):/i.test(value)) {
    return encoded;
  }

  return new URL(encoded, `${API.replace(/\/$/, '')}/`).toString();
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
    image_url: optionalText(row.cover_url) ?? optionalText(row.image_url),
    available_qty: availableQty,
    brand_name: optionalText(row.brand_name),
    spec: optionalText(row.spec),
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
    const saved = window.localStorage.getItem(LANGUAGE_KEY);
    if (saved === 'zh' || saved === 'en') return saved;
  } catch {
    // Storage may be unavailable in private browsing; use browser preference.
  }
  return navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [lang, setLang] = useState<Language>(initialLanguage);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const t = messages[lang];

  const params = new URLSearchParams(location.search);
  const source = params.get('utm_source') || 'direct';
  const medium = params.get('utm_medium') || '';
  const campaign = params.get('utm_campaign') || '';

  useEffect(() => {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    document.title = lang === 'zh'
      ? 'XYONG 云南原产地精选 | 跨境商城'
      : 'XYONG Yunnan Origin | International Store';
    try {
      window.localStorage.setItem(LANGUAGE_KEY, lang);
    } catch {
      // The selected language still works for the current page session.
    }
  }, [lang]);

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      try {
        // This is the product-list route currently implemented by the Worker.
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

  const total = cart.reduce(
    (sum, item) => sum + item.product.price_usd * item.quantity,
    0,
  );
  const money = (amount: number) => new Intl.NumberFormat(
    lang === 'zh' ? 'zh-CN' : 'en-US',
    { style: 'currency', currency: 'USD' },
  ).format(amount);
  const productName = (product: Product) =>
    lang === 'zh'
      ? product.name_zh || product.name
      : product.name_en || product.name;
  const categoryName = (category: string) =>
    categoryNames[category]?.[lang] || category.replaceAll('_', ' ');
  const canAdd = (product: Product) =>
    product.available_qty === undefined || product.available_qty > 0;

  return (
    <div className="site">
      <header>
        <div className="brand">XYONG <span>{t.brandTagline}</span></div>
        <nav>
          <a href="#shop">{t.navShop}</a>
          <a href="#origin">{t.navOrigin}</a>
          <a href="#trace">{t.navTrace}</a>
          <button
            type="button"
            aria-label={lang === 'en' ? '切换到中文' : 'Switch to English'}
            onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
          >
            {t.language}
          </button>
          <span className="cart">
            {t.cart} {cart.reduce((sum, item) => sum + item.quantity, 0)}
          </span>
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
          <div className="chips">
            {Object.keys(categoryNames).map(category => (
              <span key={category}>{categoryName(category)}</span>
            ))}
          </div>
        </div>

        {loading ? (
          <p>{t.loading}</p>
        ) : loadError ? (
          <p role="alert">{t.loadError}</p>
        ) : products.length === 0 ? (
          <p>{t.noProducts}</p>
        ) : (
          <div className="grid">
            {products.map(product => (
              <article className="card" key={product.sku}>
                <div className="image">
                  <ProductImage
                    src={product.image_url}
                    alt={productName(product)}
                    fallback={categoryName(product.category)}
                  />
                </div>
                <div className="card-body">
                  <div className="meta">
                    <span>{product.brand_name || categoryName(product.category)}</span>
                    <span>
                      {product.available_qty === undefined || product.available_qty > 0
                        ? t.available
                        : t.preOrder}
                    </span>
                  </div>
                  <h3>{productName(product)}</h3>
                  {product.origin && (
                    <p><strong>{t.originLabel}: </strong>{product.origin}</p>
                  )}
                  {product.altitude && (
                    <p><strong>{t.altitudeLabel}: </strong>{product.altitude}</p>
                  )}
                  {(lang === 'zh'
                    ? product.description_zh || product.description
                    : product.description_en || product.description) && (
                    <p>{lang === 'zh'
                      ? product.description_zh || product.description
                      : product.description_en || product.description}</p>
                  )}
                  {product.spec && <p>{product.spec}</p>}
                  <div className="buy">
                    <strong>{money(product.price_usd)}</strong>
                    <button disabled={!canAdd(product)} onClick={() => add(product)}>
                      {t.addToCart}
                    </button>
                  </div>
                </div>
              </article>
            ))}
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

      <aside className="cart-panel">
        <div>
          <b>{t.cart}</b>
          <span>{cart.length} {t.itemTypes}</span>
        </div>
        {cart.map(item => (
          <div className="line" key={item.product.sku}>
            <span>{productName(item.product)} × {item.quantity}</span>
            <strong>{money(item.product.price_usd * item.quantity)}</strong>
          </div>
        ))}
        <div className="total">
          <span>{t.total}</span>
          <strong>{money(total)}</strong>
        </div>
        <button
          className="checkout"
          disabled={!cart.length}
          onClick={() => window.alert(t.checkoutNotice)}
        >
          {t.checkout}
        </button>
      </aside>

      <footer>© 2026 XYONG · {t.brandTagline} · {lang === 'zh' ? '跨境商城' : 'International Store'}</footer>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
