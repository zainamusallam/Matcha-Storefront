import { type FormEvent, useEffect, useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowRight,
  Check,
  CircleUserRound,
  Heart,
  Leaf,
  Menu,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  Star,
  X,
} from 'lucide-react';
import heroImage from './assets/matcha-corner-hero-clear-cups.jpg';
import matchaImage from './assets/clear-cup-ceremonial.jpg';
import strawberryImage from './assets/clear-cup-strawberry.jpg';
import vanillaImage from './assets/clear-cup-vanilla.jpg';
import ceramicsImage from './assets/ceramics-kit.jpg';
import butterflyImage from './assets/matcha-corner-butterfly.png';

// Edit the customer-facing brand name here; the entire storefront uses this value.
const BRAND_NAME = 'The Matcha Corner';
const CART_STORAGE_KEY = 'the-matcha-corner-cart';
const LEGACY_CART_STORAGE_KEY = 'mori-matcha-cart';

type Product = {
  id: string;
  name: string;
  type: 'Matcha' | 'Accessories';
  image: string;
  prices: number[];
  sizes?: string[];
  rating: string;
  reviews: number;
  tag: string;
  description: string;
  ingredients: string;
  howTo: string;
};

const products: Product[] = [
  {
    id: 'ceremonial',
    name: 'Ceremonial Matcha',
    type: 'Matcha',
    image: matchaImage,
    prices: [28, 68],
    sizes: ['30g', '100g'],
    rating: '4.9',
    reviews: 128,
    tag: 'The good stuff',
    description: 'First-harvest, stone-milled matcha with a silky body and a sweet, clean finish.',
    ingredients: '100% first-harvest Japanese green tea leaves. Nothing else.',
    howTo: 'Sift 1–2 g into a bowl. Add 70 ml warm water (not boiling), then whisk briskly in a W until a fine foam forms.',
  },
  {
    id: 'everyday',
    name: 'Everyday Matcha',
    type: 'Matcha',
    image: matchaImage,
    prices: [18, 42],
    sizes: ['30g', '100g'],
    rating: '4.8',
    reviews: 94,
    tag: 'Daily favorite',
    description: 'A bright, easygoing blend made for your morning cup, iced latte, and everything after.',
    ingredients: '100% shade-grown Japanese green tea leaves.',
    howTo: 'Whisk 1 tsp with 60 ml warm water. Pour over ice and oat milk, or whisk straight into your smoothie.',
  },
  {
    id: 'strawberry',
    name: 'Strawberry Matcha',
    type: 'Matcha',
    image: strawberryImage,
    prices: [24, 55],
    sizes: ['30g', '100g'],
    rating: '4.9',
    reviews: 76,
    tag: 'Berry good',
    description: 'Our smooth everyday matcha with real strawberry for a little sweet-tart sunshine.',
    ingredients: 'Japanese green tea, freeze-dried strawberry. No artificial colors or flavors.',
    howTo: 'Shake 1 tsp with a splash of warm water. Layer over cold milk and crushed strawberries.',
  },
  {
    id: 'vanilla',
    name: 'Vanilla Cloud Latte',
    type: 'Matcha',
    image: vanillaImage,
    prices: [22, 49],
    sizes: ['30g', '100g'],
    rating: '4.7',
    reviews: 63,
    tag: 'Soft landing',
    description: 'A mellow matcha blend with real vanilla bean. Your cozy-cup-in-a-sunbeam moment.',
    ingredients: 'Japanese green tea, real vanilla bean.',
    howTo: 'Whisk 1 tsp into 70 ml warm water. Top with steamed milk for a soft, velvety latte.',
  },
  {
    id: 'starter-kit',
    name: 'Whisk & Bowl Starter Kit',
    type: 'Accessories',
    image: ceramicsImage,
    prices: [38],
    rating: '4.9',
    reviews: 51,
    tag: 'Ritual, included',
    description: 'Your new favorite five-minute ritual: a hand-finished bowl, bamboo whisk, and scoop.',
    ingredients: 'Handmade ceramic bowl, natural bamboo chasen, bamboo scoop.',
    howTo: 'Add sifted matcha to the bowl, pour in warm water, whisk in a loose W motion, and sip.',
  },
  {
    id: 'ceramic-bowl',
    name: 'Ceramic Matcha Bowl',
    type: 'Accessories',
    image: ceramicsImage,
    prices: [32],
    rating: '4.8',
    reviews: 42,
    tag: 'Hand finished',
    description: 'A one-of-a-kind, palm-friendly bowl in our soft pistachio glaze. Made for daily use.',
    ingredients: 'Hand-finished ceramic. Glaze and shape naturally vary from piece to piece.',
    howTo: 'Warm with a little water before whisking. Hand wash gently and let your bowl air dry.',
  },
];

type CartItem = { productId: string; sizeIndex: number; quantity: number };
type Panel = 'cart' | 'detail' | 'checkout' | 'account' | 'menu' | null;
const money = (amount: number) => `$${amount.toFixed(2)}`;

function priceFor(product: Product, sizeIndex: number) {
  return product.prices[sizeIndex] ?? product.prices[0];
}

function readCart(): CartItem[] {
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY) ?? localStorage.getItem(LEGACY_CART_STORAGE_KEY);
    return saved ? JSON.parse(saved) as CartItem[] : [];
  } catch {
    return [];
  }
}

function App() {
  const [cart, setCart] = useState<CartItem[]>(readCart);
  const [activeCategory, setActiveCategory] = useState('Everything');
  const [search, setSearch] = useState('');
  const [panel, setPanel] = useState<Panel>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState(0);
  const [detailQuantity, setDetailQuantity] = useState(1);
  const [toast, setToast] = useState('');
  const [payment, setPayment] = useState('Apple Pay');
  const [confirmed, setConfirmed] = useState(false);
  const [newsletter, setNewsletter] = useState('');

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(''), 3000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPanel(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const visibleProducts = useMemo(() => products.filter((product) => {
    const categoryMatch = activeCategory === 'Everything' || product.type === activeCategory;
    const query = search.trim().toLowerCase();
    return categoryMatch && (!query || `${product.name} ${product.type} ${product.description}`.toLowerCase().includes(query));
  }), [activeCategory, search]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => {
    const product = products.find((entry) => entry.id === item.productId);
    return sum + (product ? priceFor(product, item.sizeIndex) * item.quantity : 0);
  }, 0);
  const shipping = subtotal === 0 || subtotal >= 50 ? 0 : 5;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  function addToCart(product: Product, sizeIndex = 0, quantity = 1) {
    setCart((current) => {
      const exists = current.find((item) => item.productId === product.id && item.sizeIndex === sizeIndex);
      if (exists) return current.map((item) => item === exists ? { ...item, quantity: item.quantity + quantity } : item);
      return [...current, { productId: product.id, sizeIndex, quantity }];
    });
    setToast(`${product.name} added to your bag`);
  }

  function changeQuantity(productId: string, sizeIndex: number, delta: number) {
    setCart((current) => current
      .map((item) => item.productId === productId && item.sizeIndex === sizeIndex
        ? { ...item, quantity: item.quantity + delta }
        : item)
      .filter((item) => item.quantity > 0));
  }

  function openDetail(product: Product) {
    setSelectedProduct(product);
    setSelectedSize(0);
    setDetailQuantity(1);
    setPanel('detail');
  }

  function jumpTo(id: string) {
    setPanel(null);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  function navigateCategory(category: string) {
    setActiveCategory(category);
    jumpTo('shop');
  }

  function handleCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setConfirmed(true);
    setCart([]);
  }

  const categories = ['Everything', 'Matcha', 'Accessories'];

  return (
    <div className="matcha-corner-page">
      <div className="announcement" data-testid="status-announcement">
        <span>THE LITTLE GREEN RESET</span> — FREE SHIPPING ON ORDERS OVER $50 <span>·</span>
      </div>
      <div className="nav-wrap">
        <nav className="nav" aria-label="Main navigation">
          <button className="brand" onClick={() => jumpTo('home')} aria-label={`${BRAND_NAME} home`} data-testid="button-brand-home">
            <img className="brand-butterfly" src={butterflyImage} alt="" aria-hidden="true" />
            {BRAND_NAME}<i>.</i>
          </button>
          <div className="navlinks">
            <a href="#home" onClick={(event) => { event.preventDefault(); jumpTo('home'); }} data-testid="link-home-nav">Home</a>
            <a href="#shop" onClick={(event) => { event.preventDefault(); navigateCategory('Matcha'); }} data-testid="link-shop-matcha">Shop Matcha</a>
            <a href="#shop" onClick={(event) => { event.preventDefault(); navigateCategory('Accessories'); }} data-testid="link-accessories">Accessories</a>
            <a href="#story" onClick={(event) => { event.preventDefault(); jumpTo('story'); }} data-testid="link-story">Story</a>
            <a href="#contact" onClick={(event) => { event.preventDefault(); jumpTo('contact'); }} data-testid="link-contact">Contact</a>
          </div>
          <div className="navtools">
            <button className="icon-button mobile-menu" aria-label="Open navigation menu" data-testid="button-open-menu" onClick={() => setPanel('menu')}><Menu size={19} /></button>
            <button className="icon-button" aria-label="Search products" data-testid="button-search" onClick={() => jumpTo('search-products')}><Search size={19} /></button>
            <button className="icon-button" aria-label="Demo profile" data-testid="button-account" onClick={() => setPanel('account')}><CircleUserRound size={19} /></button>
            <button className="icon-button" aria-label={`Open bag, ${cartCount} items`} data-testid="button-cart" onClick={() => setPanel('cart')}>
              <ShoppingBag size={19} />{cartCount > 0 && <span className="cart-count" data-testid="text-cart-count">{cartCount}</span>}
            </button>
          </div>
        </nav>
      </div>

      <main>
        <section className="hero" id="home" aria-label="Welcome to The Matcha Corner">
          <div className="hero-frame">
            <img className="hero-image" src={heroImage} alt="Three iced matcha drinks served in clear glasses on a warm cream backdrop" />
            <div className="hero-copy">
              <p className="eyebrow"><span className="dot" />A softer kind of buzz</p>
              <h1>Sip the<br /><em>glow.</em></h1>
              <p className="hero-sub">Good matcha, zero ceremony required. A tiny daily ritual that makes the whole day feel a little brighter.</p>
              <div className="hero-actions">
                <button className="pill solid" onClick={() => navigateCategory('Matcha')} data-testid="button-shop-matcha">Shop Fresh Matcha <ArrowRight size={15} /></button>
                <button className="pill" onClick={() => jumpTo('story')} data-testid="button-our-story">Meet your matcha <ArrowDownRight size={15} /></button>
              </div>
            </div>
            <div className="hero-note" data-testid="mascot-butterfly">
              <img src={butterflyImage} alt="" aria-hidden="true" />
              <span>A little flutter<br />in every cup</span>
            </div>
          </div>
        </section>

        <div className="ticker" aria-label="Matcha brand notes">
          <div className="ticker-track">
            {[0, 1].map((copy) => <span key={copy}>GOOD ENERGY, WHISKED <b>·</b> STONE-MILLED IN JAPAN <b>·</b> A LITTLE LESS RUSH, A LITTLE MORE RITUAL <b>·</b> GREEN LOOKS GOOD ON YOU <b>·</b></span>)}
          </div>
        </div>

        <section className="section" id="shop">
          <div className="section-head">
            <div><div className="eyebrow">Your shelf, upgraded</div><h2>Find your <em>green thing.</em></h2></div>
            <p>Thoughtfully sourced, ridiculously sippable, and ready to meet your favorite mug.</p>
          </div>
          <div className="shop-tools">
            <div className="categories" aria-label="Product categories">
              {categories.map((category) => (
                <button key={category} className={`category ${activeCategory === category ? 'active' : ''}`} aria-pressed={activeCategory === category} data-testid={`filter-${category.toLowerCase()}`} onClick={() => setActiveCategory(category)}>{category}</button>
              ))}
            </div>
            <label className="search-box" id="search-products">
              <Search size={15} aria-hidden="true" />
              <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find your favorite..." aria-label="Search products" data-testid="input-product-search" />
            </label>
          </div>
          <div className="product-grid" data-testid="list-products">
            {visibleProducts.map((product, index) => (
              <article className="product-card" key={product.id} style={{ animationDelay: `${index * 55}ms` }} data-testid={`card-product-${product.id}`}>
                <div className="product-visual" onClick={() => openDetail(product)} role="button" tabIndex={0} aria-label={`View ${product.name} details`} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') openDetail(product); }}>
                  <img src={product.image} alt={product.type === 'Matcha' ? `${product.name} served in a clear glass` : `${product.name} on a warm cream background`} loading="lazy" data-testid={`img-product-${product.id}`} />
                  <span className="product-tag">{product.tag}</span>
                  <button className="quick-add" aria-label={`Quick add ${product.name}`} data-testid={`button-quick-add-${product.id}`} onClick={(event) => { event.stopPropagation(); addToCart(product); }}>
                    <Plus size={15} /> Add
                  </button>
                </div>
                <div className="product-meta">
                  <button type="button" className="product-name" onClick={() => openDetail(product)} data-testid={`text-product-name-${product.id}`}>{product.name}</button>
                  <span className="product-price" data-testid={`text-product-price-${product.id}`}>{product.sizes ? `From $${product.prices[0]}` : money(product.prices[0])}</span>
                  <div className="stars" aria-label={`${product.rating} out of 5 stars`}><Star size={11} fill="currentColor" /><span>{product.rating}</span><small>({product.reviews})</small></div>
                  <span className="product-kind">{product.type === 'Matcha' ? `${product.sizes?.join(' · ')} / tin` : 'Made for your ritual'}</span>
                </div>
              </article>
            ))}
            {visibleProducts.length === 0 && <div className="empty-products" data-testid="status-no-products"><Leaf size={24} /><h3>No green things found.</h3><p>Try another search, or browse the whole shelf.</p><button className="pill" onClick={() => { setSearch(''); setActiveCategory('Everything'); }}>Show me everything</button></div>}
          </div>
        </section>

        <section className="intro-band" aria-label="Our matcha promise">
          <div><div className="eyebrow">Better days, in a bowl</div><h3>Bright, vibrant matcha. <em>Nothing extra.</em> Just the good kind of green.</h3></div>
            <div className="intro-stamp">SOURCED WITH<br />A LITTLE MORE<br />HEART <span>·</span></div>
        </section>

        <section className="section story" id="story">
          <div className="story-image"><img src={strawberryImage} alt="A fresh strawberry matcha latte glowing in afternoon sun" loading="lazy" /></div>
          <div className="story-copy">
            <div className="eyebrow">A note from The Matcha Corner</div>
            <h2>Life moves fast.<br />Whisk <em>slow.</em></h2>
            <p>Welcome to The Matcha Corner, a happy little place for good matcha and everyday rituals. Pick your favorite clear-cup drink, find a quiet minute, and make the ritual yours.</p>
            <div className="story-slogans"><span>Your daily dose of green</span><span>Good energy, whisked.</span></div>
            <button className="pill" onClick={() => navigateCategory('Everything')} data-testid="button-explore-shop">Find your daily green <ArrowRight size={15} /></button>
          </div>
        </section>

        <section className="ritual" aria-labelledby="ritual-title">
          <div className="ritual-inner">
            <div><div className="eyebrow">A whole mood in 3 minutes</div><h2 id="ritual-title">The little<br /><em>green ritual.</em></h2><p>No perfect technique. No fancy setup. Just a few good minutes for you.</p></div>
            <div className="ritual-steps">
              <div className="ritual-step"><strong>01 / SCOOP</strong><div><h3>Start with the good green</h3><p>Sift 1–2 g of matcha into your favorite bowl. A little clump-free moment goes a long way.</p></div></div>
              <div className="ritual-step"><strong>02 / WHISK</strong><div><h3>Make it a little frothy</h3><p>Add warm water, then whisk in a loose W motion. A few seconds of your own little zen.</p></div></div>
              <div className="ritual-step"><strong>03 / SIP</strong><div><h3>Take the soft landing</h3><p>Drink it straight, add milk, or pour over ice. There is no wrong way to meet your day.</p></div></div>
            </div>
          </div>
        </section>

        <section className="quote">
          <div className="eyebrow">Good things from good people</div>
          <blockquote>“It's the five minutes I keep <em>for myself</em> before the group chat wakes up.”</blockquote>
          <cite>— Jules, Brooklyn · verified green person</cite>
        </section>

        <footer className="footer" id="contact">
          <div className="footer-inner">
            <div><h2>{BRAND_NAME}<i style={{ color: '#a76073', fontStyle: 'normal' }}>.</i></h2><p>Matcha for the main character moments, and the very regular ones too.</p><button onClick={() => setToast('You are already right where you need to be.')} data-testid="button-community"><Heart size={14} /> Follow the little green life</button></div>
            <div><h3>Go exploring</h3><a href="#shop" onClick={(event) => { event.preventDefault(); navigateCategory('Everything'); }}>Shop all</a><a href="#shop" onClick={(event) => { event.preventDefault(); navigateCategory('Matcha'); }}>Matcha</a><a href="#shop" onClick={(event) => { event.preventDefault(); navigateCategory('Accessories'); }}>Tools & bowls</a></div>
            <div><h3>Little links</h3><a href="#story" onClick={(event) => { event.preventDefault(); jumpTo('story'); }}>Our story</a><button onClick={() => setToast('Contact details are coming soon.')}>Contact us</button><button onClick={() => setToast('A little corner for your daily matcha ritual.')}>Our promise</button></div>
            <div><h3>A little note from us</h3><p>Fresh recipes, slow mornings, and the occasional very good thing.</p><form className="newsletter" onSubmit={(event) => { event.preventDefault(); setToast(newsletter.includes('@') ? 'You’re on the list. Good things incoming.' : 'Add a valid email to join the list.'); if (newsletter.includes('@')) setNewsletter(''); }}><input value={newsletter} onChange={(event) => setNewsletter(event.target.value)} type="email" required placeholder="Your email address" aria-label="Email address for updates" data-testid="input-newsletter-email" /><button type="submit" aria-label="Join the newsletter" data-testid="button-newsletter-submit"><ArrowRight size={16} /></button></form></div>
          </div>
          <div className="footer-bottom"><span>© 2025 {BRAND_NAME}. Little by little.</span><span>Made for the everyday ritual. Demo storefront.</span></div>
        </footer>
      </main>

      {panel && <div className="overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setPanel(null); }} role="presentation">
        <aside className="drawer" role="dialog" aria-modal="true" aria-label={panel === 'detail' ? `${selectedProduct?.name} details` : panel === 'cart' ? 'Your shopping bag' : panel === 'checkout' ? 'Demo checkout' : panel === 'account' ? 'Demo profile' : 'Navigation menu'}>
          <div className="drawer-top">
            <h2>{panel === 'cart' ? `Your bag (${cartCount})` : panel === 'detail' ? 'The details' : panel === 'checkout' ? (confirmed ? 'A little confirmation' : 'Demo checkout') : panel === 'account' ? 'Your Matcha Corner' : 'Take a look around'}</h2>
            <button className="close-button" aria-label="Close panel" data-testid="button-close-panel" onClick={() => setPanel(null)}><X size={18} /></button>
          </div>
          {panel === 'cart' && <div>
            {cart.length === 0 ? <div className="cart-empty" data-testid="status-cart-empty"><ShoppingBag size={35} /><h3>Your bag is taking a little breather.</h3><p>Something good and green is just a scroll away.</p><button className="pill solid" onClick={() => { setPanel(null); jumpTo('shop'); }}>Browse the shelf <ArrowRight size={14} /></button></div> : <>
              {cart.map((item) => {
                const product = products.find((entry) => entry.id === item.productId);
                if (!product) return null;
                return <div className="cart-row" key={`${item.productId}-${item.sizeIndex}`} data-testid={`row-cart-${item.productId}-${item.sizeIndex}`}>
                  <img src={product.image} alt="" />
                  <div><h3>{product.name}</h3><p>{product.sizes?.[item.sizeIndex] ?? 'One size'} · {money(priceFor(product, item.sizeIndex))}</p><div className="qty"><button aria-label={`Decrease ${product.name} quantity`} data-testid={`button-decrease-${product.id}`} onClick={() => changeQuantity(product.id, item.sizeIndex, -1)}><Minus size={12} /></button><span data-testid={`text-quantity-${product.id}`}>{item.quantity}</span><button aria-label={`Increase ${product.name} quantity`} data-testid={`button-increase-${product.id}`} onClick={() => changeQuantity(product.id, item.sizeIndex, 1)}><Plus size={12} /></button></div></div>
                  <div><strong className="product-price">{money(priceFor(product, item.sizeIndex) * item.quantity)}</strong><br /><button className="remove" data-testid={`button-remove-${product.id}`} onClick={() => changeQuantity(product.id, item.sizeIndex, -item.quantity)}>Remove</button></div>
                </div>;
              })}
              <div className="cart-summary">
                <div className="summary-row"><span>Subtotal</span><span data-testid="text-subtotal">{money(subtotal)}</span></div>
                <div className="summary-row"><span>Sample tax · 8%</span><span data-testid="text-tax">{money(tax)}</span></div>
                <div className="summary-row"><span>Shipping {subtotal >= 50 ? '· on us' : ''}</span><span data-testid="text-shipping">{shipping ? money(shipping) : 'Free'}</span></div>
                <div className="summary-row summary-total"><span>Total</span><span data-testid="text-total">{money(total)}</span></div>
                {subtotal > 0 && subtotal < 50 && <p className="drawer-footnote">You’re {money(50 - subtotal)} away from free shipping.</p>}
                <button className="pill solid" onClick={() => { setConfirmed(false); setPanel('checkout'); }} data-testid="button-proceed-checkout">Proceed to demo checkout <ArrowRight size={15} /></button>
                <p className="drawer-footnote">This is a demo. No payment will be taken.</p>
              </div>
            </>}
          </div>}
          {panel === 'detail' && selectedProduct && <div className="detail-layout">
            <img className="detail-image" src={selectedProduct.image} alt={`${selectedProduct.name} product`} />
            <div className="detail-copy">
              <div className="eyebrow">{selectedProduct.tag}</div><h3>{selectedProduct.name}</h3>
              <div className="stars"><Star size={12} fill="currentColor" />{selectedProduct.rating}<small>({selectedProduct.reviews} reviews)</small></div>
              <p>{selectedProduct.description}</p>
              <div className="detail-price" data-testid="text-detail-price">{money(priceFor(selectedProduct, selectedSize))}</div>
              {selectedProduct.sizes && <><div className="option-label">Choose your tin</div><div className="size-options">{selectedProduct.sizes.map((size, index) => <button key={size} className={`size-option ${selectedSize === index ? 'selected' : ''}`} aria-pressed={selectedSize === index} data-testid={`button-size-${size}`} onClick={() => setSelectedSize(index)}>{size} · {money(selectedProduct.prices[index])}</button>)}</div></>}
              <div className="detail-actions"><div className="qty"><button aria-label="Decrease quantity" data-testid="button-detail-decrease" onClick={() => setDetailQuantity(Math.max(1, detailQuantity - 1))}><Minus size={12} /></button><span data-testid="text-detail-quantity">{detailQuantity}</span><button aria-label="Increase quantity" data-testid="button-detail-increase" onClick={() => setDetailQuantity(detailQuantity + 1)}><Plus size={12} /></button></div><button className="pill solid" data-testid="button-add-to-cart" onClick={() => { addToCart(selectedProduct, selectedSize, detailQuantity); setPanel('cart'); }}>Add to bag <ArrowRight size={14} /></button></div>
              <div className="detail-section"><h4>What's inside</h4><p>{selectedProduct.ingredients}</p></div>
              <div className="detail-section"><h4>Make it yours</h4><p>{selectedProduct.howTo}</p></div>
            </div>
          </div>}
          {panel === 'checkout' && (confirmed ? <div className="confirm-view" data-testid="status-order-confirmation"><div className="confirm-mark"><Check size={27} /></div><div className="eyebrow">Demo complete</div><h3>Your good day is in the making.</h3><p>This is a storefront demo only. No payment was processed and no real order was placed. Thanks for playing along.</p><button className="pill solid" onClick={() => { setPanel(null); setConfirmed(false); }} data-testid="button-confirmation-done">Back to the good stuff</button></div> : <form className="checkout-form" onSubmit={handleCheckout} data-testid="form-checkout">
            <div className="demo-notice">Demo checkout — sample totals only. No card details are requested, and nothing will be charged.</div>
            <div className="summary-row"><span>Bag subtotal</span><span>{money(subtotal)}</span></div>
            <div className="summary-row"><span>Sample tax + shipping</span><span>{money(tax + shipping)}</span></div>
            <div className="summary-row summary-total"><span>Demo total</span><span data-testid="text-checkout-total">{money(total)}</span></div>
            <label>Choose a demo payment method</label>
            <div className="payment-options">
              {['Apple Pay', 'Credit card'].map((method) => <button type="button" key={method} className={`payment-option ${payment === method ? 'selected' : ''}`} aria-pressed={payment === method} data-testid={`button-payment-${method.toLowerCase().replace(' ', '-')}`} onClick={() => setPayment(method)}>{method === 'Apple Pay' ? 'Apple Pay' : 'Credit card'} {payment === method && <Check size={13} />}</button>)}
            </div>
            <div className="demo-notice">{payment === 'Apple Pay' ? 'Apple Pay is selected for this demo.' : 'Credit card is selected. No card number will be requested.'}</div>
            <label htmlFor="checkout-name">Full name</label><input id="checkout-name" name="name" autoComplete="name" required minLength={2} placeholder="Name for delivery" data-testid="input-shipping-name" />
            <label htmlFor="checkout-address">Street address</label><input id="checkout-address" name="address" autoComplete="street-address" required minLength={5} placeholder="Street and number" data-testid="input-shipping-address" />
            <div className="form-row"><div><label htmlFor="checkout-city">City</label><input id="checkout-city" name="city" autoComplete="address-level2" required placeholder="City" data-testid="input-shipping-city" /></div><div><label htmlFor="checkout-zip">ZIP code</label><input id="checkout-zip" name="zip" autoComplete="postal-code" required pattern="[A-Za-z0-9 -]{3,10}" placeholder="ZIP / postal" data-testid="input-shipping-zip" /></div></div>
            <div className="form-row"><div><label htmlFor="checkout-state">State / region</label><input id="checkout-state" name="state" autoComplete="address-level1" required placeholder="State" data-testid="input-shipping-state" /></div><div><label htmlFor="checkout-country">Country</label><select id="checkout-country" name="country" defaultValue="" required autoComplete="country-name" data-testid="select-shipping-country"><option value="" disabled>Select country</option><option>United States</option><option>Canada</option><option>United Kingdom</option><option>Australia</option><option>Japan</option></select></div></div>
            <label htmlFor="checkout-email">Email for your demo receipt</label><input id="checkout-email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" data-testid="input-shipping-email" />
            <button className="pill solid" type="submit" style={{ width: '100%', marginTop: 22 }} data-testid="button-pay-now">Pay now · demo only <ArrowRight size={15} /></button>
            <p className="drawer-footnote">No payment will be processed. No actual order will be placed.</p>
          </form>)}
          {panel === 'account' && <div className="account-panel" data-testid="status-demo-account"><CircleUserRound size={36} /><div className="eyebrow" style={{ marginTop: 16 }}>A cozy corner</div><h3>Hi, good energy.</h3><p>This little shop is a local demo, so accounts and sign-in aren't connected. Your bag will stay saved on this device.</p><button className="pill solid" onClick={() => setPanel('cart')} data-testid="button-account-view-bag">Peek at your bag <ShoppingBag size={14} /></button></div>}
          {panel === 'menu' && <div className="account-panel menu-panel">
            <button className="pill" onClick={() => { setPanel(null); jumpTo('home'); }} data-testid="menu-home">Home <ArrowRight size={14} /></button>
            <button className="pill" onClick={() => navigateCategory('Matcha')} data-testid="menu-shop-matcha">Shop Matcha <ArrowRight size={14} /></button>
            <button className="pill" onClick={() => navigateCategory('Accessories')} data-testid="menu-accessories">Accessories <ArrowRight size={14} /></button>
            <button className="pill" onClick={() => jumpTo('story')} data-testid="menu-story">Story <ArrowRight size={14} /></button>
            <button className="pill" onClick={() => jumpTo('contact')} data-testid="menu-contact">Contact <ArrowRight size={14} /></button>
          </div>}
        </aside>
      </div>}
      {toast && <div className="toast" role="status" aria-live="polite" data-testid="status-toast">{toast}</div>}
    </div>
  );
}

export default App;
