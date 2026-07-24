import { useState, useEffect } from "react";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import logo from "@/imports/ChatGPT_Image_24_juil._2026__05_40_23-removebg-preview.png";
import watch001 from "@/imports/MONTRES-001-Aret_3d6d7ba3-ca23-429f-83e5-bd83c69d9c49_2.jpeg";
import watch003 from "@/imports/MONTRES-003-Aret.jpeg";
import watch005 from "@/imports/MONTRES-005-Aret_db0fe4f7-9bee-42ee-a6d6-872e2b53bbd0.jpeg";
import watch011 from "@/imports/MONTRES-011-Aret_e57993d7-4581-4c44-9836-23e8b962ec38.jpeg";
import watch007 from "@/imports/MONTRES-007-Aret_a4accda0-fefe-46da-aacf-d8818a523bc1.jpeg";
import watch013 from "@/imports/MONTRES-013-Aret_38872fd3-3e91-44db-9dbf-ca3e7dee97da.jpeg";
import { Cart } from "../components/Cart";
import { CheckoutForm } from "../components/CheckoutForm";
import { OrderConfirmation } from "../components/OrderConfirmation";
import { About } from "../components/About";
import { Terms } from "../components/Terms";
import { ShoppingBag, X, Menu } from "lucide-react";
import { Product as SupabaseProduct, productService } from "../lib/supabase";
import { formatPrice, hasActiveDiscount, getStockStatus } from "../lib/pricing";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  initialPrice: number;
  salePrice: number;
  discountPercentage: number;
  stock: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

const convertSupabaseProduct = (p: SupabaseProduct): Product => ({
  id: p.id,
  name: p.name,
  description: p.description,
  price: p.salePrice || p.initialPrice || 0,
  image: p.imageUrl,
  initialPrice: p.initialPrice || 0,
  salePrice: p.salePrice || p.initialPrice || 0,
  discountPercentage: p.discountPercentage || 0,
  stock: p.stock !== undefined ? p.stock : 100,
});

const DEMO_PRODUCTS: Product[] = [
  {
    id: "ieke-001",
    name: "IEKE 001 — Cadran Vert Royal",
    description: "Cadran vert profond avec motif nid d'abeille, boîtier octogonal serti de cristaux et bracelet doré en acier inoxydable. Mouvement quartz de précision.",
    price: 129, initialPrice: 149, salePrice: 129, discountPercentage: 13, stock: 10,
    image: watch001,
  },
  {
    id: "ieke-003",
    name: "IEKE 003 — Émeraude Royale",
    description: "Cadran vert émeraude nacré, lunette dorée tressée ornée de cristaux, chiffres romains et bracelet en acier doré poli. Un bijou au poignet.",
    price: 149, initialPrice: 149, salePrice: 149, discountPercentage: 0, stock: 8,
    image: watch003,
  },
  {
    id: "ieke-005",
    name: "IEKE 005 — Or Champagne",
    description: "Cadran champagne texturé façon nid d'abeille, boîtier carré serti de cristaux étincelants, bracelet entièrement doré. Élégance intemporelle.",
    price: 119, initialPrice: 139, salePrice: 119, discountPercentage: 14, stock: 15,
    image: watch005,
  },
  {
    id: "ieke-011",
    name: "IEKE 011 — Nacre Blanche",
    description: "Cadran nacre blanc ivoire, lunette dorée tressée avec double rang de cristaux, index sertis et bracelet doré brossé. La quintessence de la féminité.",
    price: 159, initialPrice: 159, salePrice: 159, discountPercentage: 0, stock: 6,
    image: watch011,
  },
  {
    id: "bs-007",
    name: "Bee Sister 007 — Rose Poudré",
    description: "Cadran rose saumon délicat, lunette ronde sertie de cristaux scintillants, affichage de la date et bracelet en acier doré. Douceur et élégance au quotidien.",
    price: 109, initialPrice: 129, salePrice: 109, discountPercentage: 16, stock: 12,
    image: watch007,
  },
  {
    id: "lw-013",
    name: "Lookworld 013 — Nuit Dorée",
    description: "Cadran noir anthracite serti de cristaux sur double rang, bracelet bicolore noir et or en acier inoxydable. Allure audacieuse et contemporaine.",
    price: 169, initialPrice: 169, salePrice: 169, discountPercentage: 0, stock: 5,
    image: watch013,
  },
];

type StoreView = "products" | "cart" | "checkout" | "confirmation" | "about" | "terms";

function StoreProductCard({ product, onAddToCart }: { product: Product; onAddToCart: (p: Product) => void }) {
  const hasDiscount = hasActiveDiscount(product.discountPercentage || 0);
  const stockInfo = getStockStatus(product.stock !== undefined ? product.stock : 100);
  const isOutOfStock = product.stock === 0;
  const [imageError, setImageError] = useState(false);

  return (
    <article className="group flex flex-col bg-card border border-border overflow-hidden">
      {/* Image zone */}
      <div className="relative overflow-hidden bg-secondary" style={{ aspectRatio: "3/4" }}>
        {hasDiscount && (
          <div className="absolute top-3 left-3 z-10 bg-accent text-accent-foreground text-xs tracking-widest uppercase px-3 py-1 font-medium">
            -{product.discountPercentage.toFixed(0)}%
          </div>
        )}
        {isOutOfStock && (
          <div className="absolute top-3 left-3 z-10 bg-foreground text-background text-xs tracking-widest uppercase px-3 py-1 font-medium">
            Épuisé
          </div>
        )}
        {!isOutOfStock && stockInfo.status === "low-stock" && !hasDiscount && (
          <div className="absolute top-3 right-3 z-10 bg-muted text-muted-foreground text-xs tracking-wider uppercase px-2 py-1">
            {stockInfo.label}
          </div>
        )}
        {imageError ? (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <span className="text-muted-foreground text-xs tracking-wider uppercase">Image</span>
          </div>
        ) : (
          <img
            src={product.image}
            alt={product.name}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        )}
      </div>

      {/* Info zone */}
      <div className="flex flex-col flex-1 p-5 gap-3">
        <h3
          className="font-serif text-base font-medium leading-snug tracking-wide"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          {product.name}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 flex-1">
          {product.description}
        </p>

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-medium" style={{ color: "var(--accent)" }}>
            {formatPrice(product.salePrice || product.initialPrice)}
          </span>
          {hasDiscount && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(product.initialPrice)}
            </span>
          )}
        </div>

        {/* CTA */}
        <button
          onClick={() => !isOutOfStock && onAddToCart(product)}
          disabled={isOutOfStock}
          className={`mt-1 w-full py-3 text-sm tracking-widest uppercase transition-all duration-200 border ${
            isOutOfStock
              ? "border-border text-muted-foreground cursor-not-allowed"
              : "border-foreground text-foreground hover:bg-foreground hover:text-background"
          }`}
        >
          {isOutOfStock ? "Rupture de stock" : "Ajouter au panier"}
        </button>
      </div>
    </article>
  );
}

export default function StorePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [view, setView] = useState<StoreView>("products");
  const [orderNumber, setOrderNumber] = useState("");
  const [cartNotification, setCartNotification] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = async () => {
    try {
      const data = await productService.getActiveProducts();
      setProducts(data.map(convertSupabaseProduct));
    } catch {
      setProducts(DEMO_PRODUCTS);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const addToCart = (product: Product) => {
    if (product.stock === 0) return;
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { product, quantity: 1 }];
    });
    setCartNotification(true);
    setTimeout(() => setCartNotification(false), 2200);
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) { setCart((prev) => prev.filter((i) => i.product.id !== productId)); return; }
    setCart((prev) => prev.map((i) => i.product.id === productId ? { ...i, quantity } : i));
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const handleOrderSuccess = (num: string, _total?: number) => {
    setOrderNumber(num);
    setCart([]);
    setView("confirmation");
  };

  const calculateTotal = () => cart.reduce((t, i) => t + i.product.price * i.quantity, 0);

  const cartItemCount = cart.reduce((t, i) => t + i.quantity, 0);

  const isShopView = view === "products";

  return (
    <div className="min-h-screen bg-background flex flex-col" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* Cart notification toast */}
      <div
        className={`fixed top-6 left-1/2 -translate-x-1/2 z-[200] bg-foreground text-background text-sm tracking-widest uppercase px-6 py-3 transition-all duration-300 pointer-events-none ${
          cartNotification ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
        }`}
      >
        Ajouté au panier
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
          {/* Left nav (desktop) */}
          <nav className="hidden md:flex items-center gap-8">
            <button
              onClick={() => setView("about")}
              className="text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
            >
              À propos
            </button>
            <button
              onClick={() => setView("terms")}
              className="text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
            >
              Conditions
            </button>
          </nav>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden text-foreground"
            onClick={() => setMobileMenuOpen((o) => !o)}
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Centered logo */}
          <button
            onClick={() => { setView("products"); setMobileMenuOpen(false); }}
            className="absolute left-1/2 -translate-x-1/2"
          >
            <ImageWithFallback src={logo} alt="IEKE" className="h-20 w-auto object-contain" />
          </button>

          {/* Right: cart */}
          <button
            onClick={() => setView(view === "cart" ? "products" : "cart")}
            className="relative flex items-center gap-2 text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Panier"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartItemCount > 0 && (
              <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-accent text-accent-foreground text-[10px] flex items-center justify-center font-medium">
                {cartItemCount}
              </span>
            )}
            <span className="hidden sm:inline">Panier{cartItemCount > 0 ? ` (${cartItemCount})` : ""}</span>
          </button>
        </div>

        {/* Mobile dropdown nav */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background px-6 py-4 flex flex-col gap-4">
            <button
              onClick={() => { setView("about"); setMobileMenuOpen(false); }}
              className="text-sm tracking-widest uppercase text-left text-muted-foreground hover:text-foreground transition-colors"
            >
              À propos
            </button>
            <button
              onClick={() => { setView("terms"); setMobileMenuOpen(false); }}
              className="text-sm tracking-widest uppercase text-left text-muted-foreground hover:text-foreground transition-colors"
            >
              Conditions
            </button>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1">
        {/* Products view */}
        {view === "products" && (
          <>
            {/* Hero banner */}
            <section className="relative overflow-hidden bg-secondary">
              <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20 md:py-28">
                <div className="max-w-xl">
                  <p className="text-xs tracking-[0.25em] uppercase text-accent mb-4 font-medium">
                    Montres Femme
                  </p>
                  <h1
                    className="text-4xl md:text-5xl lg:text-6xl font-medium leading-[1.15] mb-6"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                  >
                    L&apos;élégance<br />
                    <em className="italic font-normal">à votre poignet</em>
                  </h1>
                  <p className="text-muted-foreground leading-relaxed mb-8 max-w-sm">
                    Une collection de montres féminines d&apos;exception, alliant artisanat précieux et design contemporain.
                  </p>
                  <a
                    href="#collection"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById("collection")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="inline-flex items-center gap-3 text-xs tracking-widest uppercase border border-foreground px-8 py-3.5 hover:bg-foreground hover:text-background transition-all duration-200"
                  >
                    Découvrir la collection
                  </a>
                </div>
              </div>

              {/* Decorative accent bar */}
              <div className="absolute right-0 top-0 w-1 h-full bg-accent opacity-30" />
            </section>

            {/* Thin ornamental divider */}
            <div className="max-w-7xl mx-auto px-6 lg:px-10">
              <div className="border-t border-border" />
            </div>

            {/* Product grid */}
            <section id="collection" className="max-w-7xl mx-auto px-6 lg:px-10 py-16">
              <div className="flex items-baseline justify-between mb-10">
                <h2
                  className="text-2xl font-medium"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  Notre Collection
                </h2>
                <span className="text-xs tracking-widest uppercase text-muted-foreground">
                  {products.length} pièces
                </span>
              </div>

              {isLoadingProducts ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="bg-background" style={{ aspectRatio: "3/5" }}>
                      <div className="w-full h-3/5 bg-muted animate-pulse" />
                      <div className="p-5 space-y-3">
                        <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                        <div className="h-3 bg-muted rounded animate-pulse w-full" />
                        <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
                  {products.map((p) => (
                    <div key={p.id} className="bg-background">
                      <StoreProductCard product={p} onAddToCart={addToCart} />
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Brand promise strip */}
            <section className="border-t border-border bg-secondary">
              <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
                {[
                  { label: "Livraison soignée", sub: "Emballage premium inclus" },
                  { label: "Paiement sécurisé", sub: "Vos données protégées" },
                  { label: "Service client", sub: "Disponible 7j/7" },
                ].map(({ label, sub }) => (
                  <div key={label} className="flex flex-col items-center gap-1">
                    <div className="w-6 h-px bg-accent mb-3" />
                    <p className="text-sm font-medium tracking-wide">{label}</p>
                    <p className="text-xs text-muted-foreground">{sub}</p>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {/* Cart view */}
        {view === "cart" && (
          <div className="max-w-4xl mx-auto px-6 lg:px-10 py-12">
            <Cart
              cart={cart}
              onUpdateQuantity={updateQuantity}
              onRemoveItem={removeFromCart}
              onContinueShopping={() => setView("products")}
              onProceedToCheckout={() => setView("checkout")}
              total={calculateTotal()}
            />
          </div>
        )}

        {/* Checkout view */}
        {view === "checkout" && (
          <div className="max-w-4xl mx-auto px-6 lg:px-10 py-12">
            <CheckoutForm
              cart={cart}
              total={calculateTotal()}
              onSuccess={handleOrderSuccess}
              onBack={() => setView("cart")}
            />
          </div>
        )}

        {/* Confirmation view */}
        {view === "confirmation" && (
          <div className="max-w-4xl mx-auto px-6 lg:px-10 py-12">
            <OrderConfirmation orderNumber={orderNumber} onBackToHome={() => setView("products")} />
          </div>
        )}

        {view === "about" && (
          <div className="max-w-4xl mx-auto px-6 lg:px-10 py-12">
            <About onBack={() => setView("products")} />
          </div>
        )}

        {view === "terms" && (
          <div className="max-w-4xl mx-auto px-6 lg:px-10 py-12">
            <Terms onBack={() => setView("products")} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-foreground text-background">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <p
                className="text-xl font-medium tracking-widest uppercase mb-1"
                style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "var(--accent)" }}
              >
                IEKE
              </p>
              <p className="text-xs opacity-50 tracking-wider">L&apos;élégance à votre poignet</p>
            </div>
            <nav className="flex flex-wrap gap-6 text-xs tracking-widest uppercase opacity-60">
              <button onClick={() => setView("products")} className="hover:opacity-100 transition-opacity">
                Collection
              </button>
              <button onClick={() => setView("about")} className="hover:opacity-100 transition-opacity">
                À propos
              </button>
              <button onClick={() => setView("terms")} className="hover:opacity-100 transition-opacity">
                Conditions
              </button>
            </nav>
          </div>
          <div className="border-t border-white/10 mt-8 pt-6 flex flex-col sm:flex-row justify-between gap-2 text-xs opacity-40 tracking-wide">
            <span>© {new Date().getFullYear()} IEKE — Tous droits réservés</span>
            <span>Montres féminines de prestige</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
