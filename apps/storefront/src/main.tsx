import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787';

const categories = [
  'Coffee',
  'Ancient Tree Tea',
  'Black Truffle',
  'Botanical Essential Oil',
];

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

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [lang, setLang] = useState<'zh' | 'en'>('en');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const params = new URLSearchParams(location.search);
  const source = params.get('utm_source') || 'direct';
  const medium = params.get('utm_medium') || '';
  const campaign = params.get('utm_campaign') || '';

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      try {
        const response = await fetch(`${API}/api/products`);
        if (!response.ok) {
          throw new Error(`商品列表加载失败（HTTP ${response.status}）`);
        }

        const data = (await response.json()) as { products?: ProductRow[] };
        if (!cancelled) {
          setProducts((data.products ?? []).map(normalizeProduct));
          setLoadError('');
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof Error ? error.message : '商品列表加载失败',
          );
        }
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
          quantity:
            product.available_qty === undefined
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
  const productName = (product: Product) =>
    lang === 'zh'
      ? product.name_zh || product.name
      : product.name_en || product.name;
  const canAdd = (product: Product) =>
    product.available_qty === undefined || product.available_qty > 0;

  return (
    <div className="site">
      <header>
        <div className="brand">XYONG <span>Yunnan Origin</span></div>
        <nav>
          <a href="#shop">Shop</a>
          <a href="#origin">Origin</a>
          <a href="#trace">Traceability</a>
          <button onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}>
            {lang === 'en' ? '中' : 'EN'}
          </button>
          <span className="cart">
            Cart {cart.reduce((sum, item) => sum + item.quantity, 0)}
          </span>
        </nav>
      </header>

      <section className="hero">
        <div>
          <p className="eyebrow">YUNNAN • CHINA • SINGLE ORIGIN</p>
          <h1>
            {lang === 'en'
              ? 'Exceptional Yunnan, delivered to the world.'
              : '云南精品，原产地直达世界。'}
          </h1>
          <p>
            {lang === 'en'
              ? 'A focused collection of four Yunnan categories, selected by origin, batch and quality evidence.'
              : '聚焦四大云南精品品类，以产地、批次和质量存证为核心。'}
          </p>
          <a className="cta" href="#shop">Explore the collection</a>
        </div>
      </section>

      <section id="shop" className="section">
        <div className="section-head">
          <div>
            <p className="eyebrow">THE COLLECTION</p>
            <h2>
              {lang === 'en'
                ? 'Four categories. One origin philosophy.'
                : '四大品类，一套原产地标准。'}
            </h2>
          </div>
          <div className="chips">
            {categories.map(category => <span key={category}>{category}</span>)}
          </div>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : loadError ? (
          <p role="alert">{loadError}</p>
        ) : products.length === 0 ? (
          <p>{lang === 'en' ? 'No active products found.' : '暂无在售商品。'}</p>
        ) : (
          <div className="grid">
            {products.map(product => (
              <article className="card" key={product.sku}>
                <div className="image">
                  {product.image_url ? (
                    <img src={product.image_url} alt={productName(product)} />
                  ) : (
                    <span>{product.category}</span>
                  )}
                </div>
                <div className="card-body">
                  <div className="meta">
                    <span>{product.brand_name || product.category}</span>
                    <span>
                      {product.available_qty === undefined
                        ? (lang === 'en' ? 'Available' : '可购买')
                        : product.available_qty > 0
                          ? (lang === 'en' ? 'Available' : '有库存')
                          : (lang === 'en' ? 'Pre-order' : '可预订')}
                    </span>
                  </div>
                  <h3>{productName(product)}</h3>
                  {product.origin && (
                    <p>
                      <strong>{lang === 'en' ? 'Origin: ' : '产地：'}</strong>
                      {product.origin}
                    </p>
                  )}
                  {product.altitude && (
                    <p>
                      <strong>{lang === 'en' ? 'Altitude: ' : '海拔：'}</strong>
                      {product.altitude}
                    </p>
                  )}
                  {product.description && <p>{product.description}</p>}
                  <div className="buy">
                    <strong>${product.price_usd.toFixed(2)}</strong>
                    <button disabled={!canAdd(product)} onClick={() => add(product)}>
                      {lang === 'en' ? 'Add to cart' : '加入购物车'}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section id="origin" className="dark section">
        <p className="eyebrow">ORIGIN FIRST</p>
        <h2>
          {lang === 'en'
            ? 'From Yunnan source to your door.'
            : '从云南原产地，到你的手中。'}
        </h2>
        <p className="wide">
          {lang === 'en'
            ? 'Every product is designed around a traceable SKU and lot. Procurement, quality evidence, inventory and customer orders are connected in the private XYONG Operations Center.'
            : '每个产品都围绕可追踪的 SKU 与批次建立。采购、质检、存证、库存和订单统一连接到 XYONG 私有运营中心。'}
        </p>
      </section>

      <section id="trace" className="section">
        <div className="trace">
          <div>
            <p className="eyebrow">TRACEABILITY</p>
            <h2>Lot-based proof, not just a story.</h2>
          </div>
          <div className="steps">
            <div><b>01</b><span>Origin</span></div>
            <div><b>02</b><span>Lot</span></div>
            <div><b>03</b><span>Quality</span></div>
            <div><b>04</b><span>Fulfillment</span></div>
          </div>
        </div>
      </section>

      <aside className="cart-panel">
        <div>
          <b>Cart</b>
          <span>{cart.length} item types</span>
        </div>
        {cart.map(item => (
          <div className="line" key={item.product.sku}>
            <span>{productName(item.product)} × {item.quantity}</span>
            <strong>
              ${(item.product.price_usd * item.quantity).toFixed(2)}
            </strong>
          </div>
        ))}
        <div className="total">
          <span>Total</span>
          <strong>${total.toFixed(2)}</strong>
        </div>
        <button
          className="checkout"
          disabled={!cart.length}
          onClick={() => alert(
            'V2.1 checkout shell: connect a real payment provider webhook before accepting live payments.',
          )}
        >
          Proceed to secure checkout
        </button>
      </aside>

      <footer>© 2026 XYONG · Yunnan Origin · Customer storefront</footer>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
