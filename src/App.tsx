import { useEffect, useMemo, useState } from "react";
import { Coffee, Snowflake, CupSoda, UtensilsCrossed } from "lucide-react";

import "./index.css";



import Header from "./components/Header";
import Hero from "./components/Hero";
import OfferStrip from "./components/OfferStrip";
import MenuSection from "./components/MenuSection";
import CartDrawer from "./components/CartDrawer";
import CheckoutModal from "./components/CheckoutModal";
import LegalModal from "./components/LegalModal";

import { COLORS } from "./data/colors";
import { MENU, CATEGORIES, PROMO_HOT_PRICE } from "./data/menu";
import { getMenu, getCategories } from "./api/menu";

import { createOrder, createPayment, verifyPayment, updateOrderPaid, updateOrderPaymentFailed } from "./services/ordersApi";
import { loadRazorpayScript } from "./utils/razorpay";
import type { Order } from "./types";

import type {
  CartItem,
  CategoryId,
  Category,
  Details,
  MenuItem,
  PaymentMethod,
} from "./types";

export default function App() {
  const [activeCategory, setActiveCategory] =
    useState<CategoryId | "all">("all");

  const [cart, setCart] = useState<Record<string, CartItem>>(() => {
    try {
      const saved = localStorage.getItem("vb_cart");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [cartOpen, setCartOpen] =
    useState(false);

  const [checkoutOpen, setCheckoutOpen] =
    useState(false);

  const [legalOpen, setLegalOpen] =
    useState<"privacy" | "terms" | null>(null);

  const [payment, setPayment] =
    useState<PaymentMethod>("upi");

  const [details, setDetails] = useState<Details>(() => {
    try {
      const saved = localStorage.getItem("vb_details");
      return saved ? JSON.parse(saved) : {
        name: "",
        phone: "",
        email: "",
        mode: "Takeaway",
        note: "",
      };
    } catch {
      return {
        name: "",
        phone: "",
        email: "",
        mode: "Takeaway",
        note: "",
      };
    }
  });

  const [menu, setMenu] = useState<Record<CategoryId, MenuItem[]>>(MENU);

  useEffect(() => {
    localStorage.setItem("vb_cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem("vb_details", JSON.stringify(details));
  }, [details]);

  useEffect(() => {
    const pendingStr = localStorage.getItem("vb_pending_checkout");
    if (!pendingStr) return;

    async function checkPendingOrder() {
      try {
        const pending = JSON.parse(pendingStr as string);
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL ?? "/api/v1"}/customer/orders`);
        if (!res.ok) throw new Error("Failed to fetch orders");
        const result = await res.json();
        const ordersList = result.data || [];
        const backendOrder = ordersList.find((o: any) => o.orderNumber === pending.orderNumber);

        if (backendOrder) {
          if (backendOrder.paymentStatus === "PAID" || ["ACCEPTED", "PREPARING", "READY", "COMPLETED"].includes(backendOrder.orderStatus)) {
            localStorage.removeItem("vb_pending_checkout");
            setCart({});
            alert(`Your payment for order #${pending.orderNumber} was successful!`);
            return;
          }
        }

        setCart(pending.cart);
        setDetails(pending.details);
        setPayment(pending.payment);
        setCheckoutOpen(true);
        localStorage.removeItem("vb_pending_checkout");
      } catch (err) {
        console.error("Error checking pending checkout:", err);
      }
    }

    checkPendingOrder();
  }, []);
  const [categories, setCategories] = useState<Category[]>(CATEGORIES);
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuError, setMenuError] = useState<string | null>(null);

  const mapCategoryKey = (id: number, name: string): CategoryId => {
    if (id === 1) return "hot";
    if (id === 2) return "cold";
    if (id === 3) return "shakes";
    if (id === 4) return "bites";

    const norm = (name || "").toLowerCase();
    if (norm.includes("hot")) return "hot";
    if (norm.includes("cold")) return "cold";
    if (norm.includes("shake")) return "shakes";
    return "bites";
  };

  const getCategoryIcon = (key: CategoryId) => {
    switch (key) {
      case "hot":
        return Coffee;
      case "cold":
        return Snowflake;
      case "shakes":
        return CupSoda;
      case "bites":
      default:
        return UtensilsCrossed;
    }
  };

  useEffect(() => {
    let active = true;
    async function loadMenu() {
      try {
        setMenuLoading(true);
        const [apiCategories, apiItems] = await Promise.all([
          getCategories(),
          getMenu(),
        ]);
        if (!active) return;

        const mappedCategories: Category[] = apiCategories.map((cat) => {
          const key = mapCategoryKey(cat.id, cat.name);
          return {
            id: key,
            label: cat.name,
            icon: getCategoryIcon(key),
          };
        });

        const uniqueCategories: Category[] = [];
        const seenKeys = new Set<CategoryId>();
        mappedCategories.forEach((cat) => {
          if (!seenKeys.has(cat.id)) {
            seenKeys.add(cat.id);
            uniqueCategories.push(cat);
          }
        });

        const newMenu: Record<CategoryId, MenuItem[]> = {
          hot: [],
          cold: [],
          shakes: [],
          bites: [],
        };

        apiItems.forEach((item) => {
          const category = mapCategoryKey(item.categoryId, item.categoryName);

          let parsedImageUrl = item.imageUrl;
          if (parsedImageUrl && parsedImageUrl.startsWith('s3://velvetbrew/')) {
              parsedImageUrl = parsedImageUrl.replace('s3://velvetbrew/', 'https://velvetbrew.s3.ap-south-1.amazonaws.com/');
          }

          newMenu[category].push({
            id: String(item.id),
            name: item.name,
            price: item.price,
            description: item.description,
            imageUrl: parsedImageUrl,
            veg: item.veg,
            available: item.available,
            featured: item.featured,
            offerPrice: item.offerPrice,
          });
        });

        uniqueCategories.forEach(cat => {
            const firstItemWithImage = newMenu[cat.id].find(i => i.imageUrl);
            if (firstItemWithImage) {
                cat.image = firstItemWithImage.imageUrl;
            }
        });

        setCategories(uniqueCategories.length > 0 ? uniqueCategories : CATEGORIES);
        setMenu(newMenu);
        setMenuError(null);
      } catch (err: any) {
        console.error("Error loading menu or categories from API:", err);
        if (active) {
          setMenuError("Failed to fetch latest menu. Using offline fallback menu.");
        }
      } finally {
        if (active) {
          setMenuLoading(false);
        }
      }
    }
    loadMenu();
    return () => {
      active = false;
    };
  }, []);

  const handleRetryFetchMenu = async () => {
    try {
      setMenuLoading(true);
      setMenuError(null);
      const [apiCategories, apiItems] = await Promise.all([
        getCategories(),
        getMenu(),
      ]);

      const mappedCategories: Category[] = apiCategories.map((cat) => {
        const key = mapCategoryKey(cat.id, cat.name);
        return {
          id: key,
          label: cat.name,
          icon: getCategoryIcon(key),
        };
      });

      const uniqueCategories: Category[] = [];
      const seenKeys = new Set<CategoryId>();
      mappedCategories.forEach((cat) => {
        if (!seenKeys.has(cat.id)) {
          seenKeys.add(cat.id);
          uniqueCategories.push(cat);
        }
      });

      const newMenu: Record<CategoryId, MenuItem[]> = {
        hot: [],
        cold: [],
        shakes: [],
        bites: [],
      };

      apiItems.forEach((item) => {
        const category = mapCategoryKey(item.categoryId, item.categoryName);

        let parsedImageUrl = item.imageUrl;
        if (parsedImageUrl && parsedImageUrl.startsWith('s3://velvetbrew/')) {
            parsedImageUrl = parsedImageUrl.replace('s3://velvetbrew/', 'https://velvetbrew.s3.ap-south-1.amazonaws.com/');
        }

        newMenu[category].push({
          id: String(item.id),
          name: item.name,
          price: item.price,
          description: item.description,
          imageUrl: parsedImageUrl,
          veg: item.veg,
          available: item.available,
          featured: item.featured,
          offerPrice: item.offerPrice,
        });
      });

      uniqueCategories.forEach(cat => {
          const firstItemWithImage = newMenu[cat.id].find(i => i.imageUrl);
          if (firstItemWithImage) {
              cat.image = firstItemWithImage.imageUrl;
          }
      });

      setCategories(uniqueCategories.length > 0 ? uniqueCategories : CATEGORIES);
      setMenu(newMenu);
      setMenuError(null);
    } catch (err: any) {
      console.error("Error retrying menu load:", err);
      setMenuError("Failed to fetch latest menu. Using offline fallback menu.");
    } finally {
      setMenuLoading(false);
    }
  };

  const priceFor = (
    category: CategoryId,
    item: MenuItem
  ) => {
    if (item.offerPrice !== undefined && item.offerPrice !== null) {
      return item.offerPrice;
    }

    if (category === "hot") {
      return Math.min(
        item.price,
        PROMO_HOT_PRICE
      );
    }

    return item.price;
  };

  const addToCart = (
    category: CategoryId,
    item: MenuItem
  ) => {
    setCart((prev) => {
      const current = prev[item.id];

      return {
        ...prev,
        [item.id]: {
          category,
          item,
          qty: current
            ? current.qty + 1
            : 1,
        },
      };
    });
  };

  const changeQty = (
    id: string,
    delta: number
  ) => {
    setCart((prev) => {
      const current = prev[id];

      if (!current) return prev;

      const qty =
        current.qty + delta;

      if (qty <= 0) {
        const updated = {
          ...prev,
        };

        delete updated[id];

        return updated;
      }

      return {
        ...prev,
        [id]: {
          ...current,
          qty,
        },
      };
    });
  };

  const cartItems = useMemo(
    () => Object.values(cart),
    [cart]
  );

  const total = useMemo(() => {
    return cartItems.reduce(
      (sum, line) =>
        sum +
        priceFor(
          line.category,
          line.item
        ) *
        line.qty,
      0
    );
  }, [cartItems]);

  const savings = useMemo(() => {
    return cartItems.reduce(
      (sum, line) => {
        if (
          line.category !== "hot"
        )
          return sum;

        return (
          sum +
          (line.item.price -
            priceFor(
              line.category,
              line.item
            )) *
          line.qty
        );
      },
      0
    );
  }, [cartItems]);

  const cartCount = cartItems.reduce(
    (sum, item) =>
      sum + item.qty,
    0
  );

  const handleCheckout = () => {
    setCartOpen(false);
    setCheckoutOpen(true);
  };

  const confirmOrder = async () => {
    if (!details.phone || !details.phone.trim()) {
      alert("Please enter phone number");
      return;
    }

    const id = "VB" + Math.floor(100000 + Math.random() * 900000);

    const order: Order = {
      id,
      customerName: details.name,
      phone: details.phone,
      email: details.email,
      mode: details.mode,
      note: details.note,
      items: cartItems.map((line) => ({
        id: line.item.id,
        name: line.item.name,
        category: line.category,
        price: line.item.price,
        qty: line.qty,
      })),
      subtotal: total + savings,
      savings,
      total,
      paymentMethod: payment,
      paid: false,
      status: "Pending",
      createdAt: new Date().toISOString(),
    };

    console.log("--- TRACING ORDER BEFORE createOrder() ---");
    cartItems.forEach((line) => {
      console.log(`Item Name: ${line.item.name}`);
      console.log(`Original price: ${line.item.price}`);
      console.log(`offerPrice: ${line.item.offerPrice}`);
    });
    console.log("Final order.items array sent to API:", order.items);
    console.log("------------------------------------------");

    try {
      if (payment === "cod") {
        const createRes = await createOrder(order);
        const backendOrder = createRes && (createRes as any).data ? (createRes as any).data : createRes;
        const orderNumber = backendOrder.orderNumber || backendOrder.id || id;

        alert(`Order placed successfully! Order ID: ${orderNumber}`);

        setCheckoutOpen(false);
        setCart({});
        setDetails({
          name: "",
          phone: "",
          email: "",
          mode: "Takeaway",
          note: "",
        });
        setPayment("upi");
      } else {
        let orderNumber = id;
        const pendingStr = localStorage.getItem("vb_pending_checkout");
        if (pendingStr) {
          try {
            const pending = JSON.parse(pendingStr);
            if (pending.orderNumber) {
              orderNumber = pending.orderNumber;
            }
          } catch (e) {
            console.error("Failed to parse pending checkout", e);
          }
        }
        
        if (orderNumber === id) {
          // Create the backend order first!
          const createRes = await createOrder(order);
          const backendOrder = createRes && (createRes as any).data ? (createRes as any).data : createRes;
          orderNumber = backendOrder.orderNumber || backendOrder.id || id;
        }

        // Save pending checkout state to localStorage before opening Razorpay
        localStorage.setItem("vb_pending_checkout", JSON.stringify({
          orderNumber: orderNumber,
          cart,
          details,
          payment,
          amountToPay: total
        }));

        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          alert("Failed to load Razorpay payment portal. Please check your internet connection.");
          localStorage.removeItem("vb_pending_checkout");
          return;
        }

        const initPaymentRes = await createPayment(orderNumber, total);
        const paymentData = initPaymentRes && initPaymentRes.data ? initPaymentRes.data : initPaymentRes;

        const rzpOrderId = paymentData.orderId;
        const rzpKeyId = paymentData.key;
        const options = {
          key: rzpKeyId,
          amount: Math.round(total * 100),
          currency: paymentData.currency || "INR",
          name: "Velvet Brew",
          description: `Order Payment - #${orderNumber}`,
          order_id: rzpOrderId,
          handler: async function (response: any) {
            try {
              // 1. Verify payment on backend
              await verifyPayment({
                razorpayOrderId: response.razorpay_order_id || rzpOrderId,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });

              // 2. Update the backend customer order's payment status to SUCCESS
              await updateOrderPaid({ ...order, id: orderNumber, paid: true });

              alert(`Payment successful! Order ID: ${orderNumber}`);

              localStorage.removeItem("vb_pending_checkout");
              setCheckoutOpen(false);
              setCart({});
              setDetails({ name: "", phone: "", email: "", mode: "Takeaway", note: "" });
              setPayment("upi");
            } catch (err: any) {
              console.error("Payment verification or order creation failed:", err);
              await updateOrderPaymentFailed(order, orderNumber);
              alert("Payment verification or order creation failed. Please contact support.");
            }
          },
          prefill: {
            name: details.name,
            email: details.email,
            contact: details.phone,
          },
          theme: {
            color: "#C79A56",
          },
          modal: {
            ondismiss: async function () {
              localStorage.removeItem("vb_pending_checkout");
              await updateOrderPaymentFailed(order, orderNumber);
              alert("Payment session closed. You can retry paying by clicking pay again.");
            },
          },
          redirect: false, // Prevent top-level redirect on mobile browsers
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      }
    } catch (err: any) {
      console.error("Checkout process failed:", err);
      alert("Checkout failed: " + err.message);
    }
  };
  return (
    <main
      className="min-h-screen"
      style={{
        background: COLORS.espresso,
      }}
    >
      <Header
        cartCount={cartCount}
        onOpenCart={() => setCartOpen(true)}
        cartOpen={cartOpen}
      />

      <Hero />

      <OfferStrip
        promoPrice={PROMO_HOT_PRICE}
      />

      <MenuSection
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        cart={cart}
        promoPrice={PROMO_HOT_PRICE}
        addToCart={addToCart}
        changeQty={changeQty}
        menu={menu}
        loading={menuLoading}
        error={menuError}
        onRetry={handleRetryFetchMenu}
        categories={categories}
      />

      {/* Footer */}

      <footer
        id="visit"
        className="mt-20 px-6 py-14"
        style={{
          borderTop: `1px solid ${COLORS.line}`,
        }}
      >
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-10">

          <div>
            <h3
              className="vb-display text-2xl mb-3"
              style={{
                color: COLORS.cream,
              }}
            >
              Velvet Brew
            </h3>

            <p
              className="text-sm leading-7"
              style={{
                color: COLORS.muted,
              }}
            >
              Fresh coffee, handcrafted beverages,
              delicious café bites and warm hospitality.
              Made fresh every day.
            </p>
          </div>

          <div>
            <h4
              className="font-semibold mb-3"
              style={{
                color: COLORS.gold,
              }}
            >
              Opening Hours
            </h4>

            <div
              className="space-y-2 text-sm"
              style={{
                color: COLORS.muted,
              }}
            >
              <p>Monday – Sunday</p>
              <p>05:00 PM – 12:00 AM</p>
            </div>
          </div>

          <div>
            <h4
              className="font-semibold mb-3"
              style={{
                color: COLORS.gold,
              }}
            >
              Visit Us
            </h4>

            <div
              className="space-y-2 text-sm"
              style={{
                color: COLORS.muted,
              }}
            >
              <p>Opp. City Hospital, Avas Vikas Road, Shastri Nagar, Civil Lines, Budaun, Uttar Pradesh – 243601</p>
              <p>Contact: +91 8399999090</p>
              <p>officialvelvetbrew@gmail.com</p>
            </div>
          </div>
        </div>

        <div
          className="mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs"
          style={{
            borderTop: `1px solid ${COLORS.line}`,
            color: COLORS.clay,
          }}
        >
          <div>
            © {new Date().getFullYear()} Velvet Brew. All rights reserved.
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setLegalOpen("privacy")}
              className="transition hover:text-white cursor-pointer"
              style={{ color: COLORS.muted }}
            >
              Privacy Policy
            </button>
            <span style={{ color: COLORS.line }}>|</span>
            <button
              onClick={() => setLegalOpen("terms")}
              className="transition hover:text-white cursor-pointer"
              style={{ color: COLORS.muted }}
            >
              Terms & Conditions
            </button>
          </div>
        </div>
      </footer>
      <CartDrawer
        open={cartOpen}
        cart={cart}
        total={total}
        savings={savings}
        onClose={() => setCartOpen(false)}
        changeQty={changeQty}
        priceFor={priceFor}
        onCheckout={handleCheckout}
      />

      <CheckoutModal
        open={checkoutOpen}
        details={details}
        payment={payment}
        total={total}
        savings={savings}
        onClose={() => setCheckoutOpen(false)}
        onPaymentChange={setPayment}
        onDetailsChange={(field, value) =>
          setDetails((prev) => ({
            ...prev,
            [field]: value,
          }))
        }
        onConfirm={confirmOrder}
      />

      <LegalModal
        open={legalOpen !== null}
        initialTab={legalOpen === "terms" ? "terms" : "privacy"}
        onClose={() => setLegalOpen(null)}
      />
    </main>
  );
}