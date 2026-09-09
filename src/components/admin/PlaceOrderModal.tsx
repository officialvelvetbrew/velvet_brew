import { useState, useEffect, useMemo } from "react";
import { X, User, Phone, Mail, Plus, Minus, FileText, Check } from "lucide-react";
import { COLORS } from "../../data/colors";
import { rupee } from "../../utils/currency";
import { CATEGORIES, MENU, PROMO_HOT_PRICE } from "../../data/menu";
import { getMenu, getCategories } from "../../api/menu";
import { createOrder, createPayment, verifyPayment, updateOrderPaid, updateOrderPaymentFailed } from "../../services/ordersApi";
import type { Category, MenuItem, CategoryId, Details, PaymentMethod, Order, OrderItemRecord } from "../../types";
import { loadRazorpayScript } from "../../utils/razorpay";

interface PlaceOrderModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PlaceOrderModal({ open, onClose, onSuccess }: PlaceOrderModalProps) {
  // Menu loading states
  const [categories, setCategories] = useState<Category[]>(CATEGORIES);
  const [menu, setMenu] = useState<Record<CategoryId, MenuItem[]>>(MENU);
  const [activeCategory, setActiveCategory] = useState<CategoryId>("hot");
  const [loadingMenu, setLoadingMenu] = useState(false);

  // Form states
  const [details, setDetails] = useState<Details>({
    name: "",
    phone: "",
    email: "",
    mode: "Takeaway",
    note: "",
  });
  const [payment, setPayment] = useState<PaymentMethod>("upi");
  
  // Cart state: itemId -> quantity
  const [cart, setCart] = useState<Record<string, { item: MenuItem; category: CategoryId; qty: number }>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load menu items and categories
  useEffect(() => {
    if (!open) return;
    
    let active = true;
    async function load() {
      try {
        setLoadingMenu(true);
        const [apiCategories, apiItems] = await Promise.all([
          getCategories(),
          getMenu(),
        ]);
        if (!active) return;

        // Map categories
        const mappedCategories: Category[] = apiCategories.map((cat) => {
          let key: CategoryId = "hot";
          const norm = (cat.name || "").toLowerCase();
          if (cat.id === 1 || norm.includes("hot")) key = "hot";
          else if (cat.id === 2 || norm.includes("cold")) key = "cold";
          else if (cat.id === 3 || norm.includes("shake")) key = "shakes";
          else if (cat.id === 4 || norm.includes("bite")) key = "bites";
          return {
            id: key,
            label: cat.name,
            icon: CATEGORIES.find(c => c.id === key)?.icon || CATEGORIES[0].icon,
          };
        });

        // Unique categories
        const uniqueCategories: Category[] = [];
        const seen = new Set<CategoryId>();
        mappedCategories.forEach((cat) => {
          if (!seen.has(cat.id)) {
            seen.add(cat.id);
            uniqueCategories.push(cat);
          }
        });

        // Group items
        const newMenu: Record<CategoryId, MenuItem[]> = {
          hot: [],
          cold: [],
          shakes: [],
          bites: [],
        };
        apiItems.forEach((item) => {
          let category: CategoryId = "hot";
          if (item.categoryId === 1) category = "hot";
          else if (item.categoryId === 2) category = "cold";
          else if (item.categoryId === 3) category = "shakes";
          else if (item.categoryId === 4) category = "bites";

          newMenu[category].push({
            id: String(item.id),
            name: item.name,
            price: item.price,
            description: item.description,
            imageUrl: item.imageUrl,
            veg: item.veg,
            available: item.available,
            featured: item.featured,
            offerPrice: item.offerPrice,
          });
        });

        setCategories(uniqueCategories.length > 0 ? uniqueCategories : CATEGORIES);
        setMenu(newMenu);
      } catch (err) {
        console.error("PlaceOrderModal error loading menu:", err);
      } finally {
        if (active) setLoadingMenu(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [open]);

  // Pricing helper
  const priceFor = (category: CategoryId, item: MenuItem) => {
    if (item.offerPrice !== undefined && item.offerPrice !== null) {
      return item.offerPrice;
    }
    if (category === "hot") {
      return Math.min(item.price, PROMO_HOT_PRICE);
    }
    return item.price;
  };

  // Cart actions
  const updateQty = (item: MenuItem, category: CategoryId, delta: number) => {
    setCart((prev) => {
      const current = prev[item.id];
      const newQty = (current?.qty || 0) + delta;
      
      const updated = { ...prev };
      if (newQty <= 0) {
        delete updated[item.id];
      } else {
        updated[item.id] = {
          item,
          category,
          qty: newQty,
        };
      }
      return updated;
    });
  };

  // Cart calculations
  const cartItems = useMemo(() => Object.values(cart), [cart]);
  
  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, line) => sum + line.item.price * line.qty, 0);
  }, [cartItems]);

  const total = useMemo(() => {
    return cartItems.reduce((sum, line) => sum + priceFor(line.category, line.item) * line.qty, 0);
  }, [cartItems]);

  const savings = subtotal - total;

  // Handle Form changes
  const handleInputChange = (field: keyof Details, val: string) => {
    setDetails(prev => ({ ...prev, [field]: val }));
  };

  // Submit Order
  const handlePlaceOrder = async () => {
    if (!details.name.trim()) {
      setError("Please enter the customer's name");
      return;
    }
    if (!details.phone.trim() || details.phone.replace(/\D/g, "").length < 10) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }
    if (cartItems.length === 0) {
      setError("Please add at least one item to the order");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const orderId = "VB" + Math.floor(100000 + Math.random() * 900000);
      const items: OrderItemRecord[] = cartItems.map(line => ({
        id: line.item.id,
        name: line.item.name,
        category: line.category,
        price: priceFor(line.category, line.item),
        qty: line.qty,
      }));

      const newOrder: Order = {
        id: orderId,
        customerName: details.name,
        phone: details.phone,
        email: details.email,
        mode: details.mode,
        note: details.note,
        items,
        subtotal,
        savings,
        total,
        paymentMethod: payment,
        paid: payment !== "cod",
        status: "Pending",
        createdAt: new Date().toISOString(),
      };

      if (payment === "cod") {
        const createRes = await createOrder(newOrder);
        const backendOrder = createRes && (createRes as any).data ? (createRes as any).data : createRes;
        const orderNumber = backendOrder.orderNumber || backendOrder.id || orderId;

        onSuccess();
        
        // Reset state
        setCart({});
        setDetails({ name: "", phone: "", email: "", mode: "Takeaway", note: "" });
        setPayment("upi");
        setSubmitting(false);
        onClose();
      } else {
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          setError("Failed to load Razorpay payment portal. Please check your internet connection.");
          setSubmitting(false);
          return;
        }

        const initPaymentRes = await createPayment(newOrder);
        const paymentData = initPaymentRes && initPaymentRes.data ? initPaymentRes.data : initPaymentRes;

        const rzpOrderId = paymentData.orderId || paymentData.razorpay_order_id;
        const rzpKeyId = paymentData.key || paymentData.keyId;
        const options = {
          key: rzpKeyId,
          amount: Math.round(total * 100),
          currency: paymentData.currency || "INR",
          name: "Velvet Brew",
          description: `POS Order Payment`,
          order_id: rzpOrderId,
          handler: async function (response: any) {
            try {
              setSubmitting(true);
              // 1. Verify payment on backend
              await verifyPayment({
                razorpayOrderId: response.razorpay_order_id || rzpOrderId,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });

              onSuccess();
              
              // Reset state
              setCart({});
              setDetails({ name: "", phone: "", email: "", mode: "Takeaway", note: "" });
              setPayment("upi");
              onClose();
            } catch (err: any) {
              console.error("Payment verification failed:", err);
              setError("Payment verification failed. Please contact support.");
            } finally {
              setSubmitting(false);
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
              setSubmitting(false);
            },
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      }
    } catch (err: any) {
      console.error(err);
      setError("Failed to place order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Container */}
      <div 
        className="relative w-[95vw] max-w-5xl h-[88vh] flex flex-col md:flex-row rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        style={{ background: COLORS.espresso, border: `1px solid ${COLORS.line}` }}
      >
        {/* Left Side: POS Menu Browser (60% width on md) */}
        <div className="w-full md:w-3/5 flex flex-col h-1/2 md:h-full border-b md:border-b-0 md:border-r" style={{ borderColor: COLORS.line }}>
          {/* Menu Header */}
          <div className="p-4 flex items-center justify-between shrink-0" style={{ borderBottom: `1px solid ${COLORS.line}` }}>
            <h3 className="vb-display text-xl animate-pulse" style={{ color: COLORS.cream }}>Menu Selector</h3>
            {loadingMenu && <span className="text-xs" style={{ color: COLORS.gold }}>Loading menu...</span>}
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 p-3 overflow-x-auto shrink-0 vb-scrollbar" style={{ background: "rgba(23,15,10,0.4)" }}>
            {categories.map((cat) => {
              const active = activeCategory === cat.id;
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all duration-200 cursor-pointer"
                  style={
                    active
                      ? { background: COLORS.gold, color: COLORS.espresso }
                      : { border: `1px solid ${COLORS.line}`, color: COLORS.muted }
                  }
                >
                  <Icon size={13} />
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Items Grid */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5 vb-scrollbar">
            {menu[activeCategory]?.length === 0 ? (
              <p className="text-xs text-center py-8" style={{ color: COLORS.muted }}>No items in this category.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {menu[activeCategory]?.map((item) => {
                  const qty = cart[item.id]?.qty || 0;
                  const finalPrice = priceFor(activeCategory, item);
                  const isPromo = activeCategory === "hot" && item.price > finalPrice;
                  
                  return (
                    <div 
                      key={item.id} 
                      className="rounded-xl p-3 flex flex-col justify-between transition-all duration-200"
                      style={{ background: COLORS.umber, border: qty > 0 ? `1px solid ${COLORS.gold}` : `1px solid transparent` }}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-1.5">
                          <p className="text-sm font-medium leading-tight" style={{ color: COLORS.cream }}>{item.name}</p>
                          {item.veg !== undefined && (
                            <span 
                              className="text-[9px] px-1 rounded-sm border inline-block shrink-0" 
                              style={item.veg ? { color: COLORS.success, borderColor: COLORS.success } : { color: COLORS.danger, borderColor: COLORS.danger }}
                            >
                              {item.veg ? "VEG" : "NV"}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-baseline gap-1.5 mt-1">
                          <span className="text-xs font-semibold" style={{ color: COLORS.gold }}>{rupee(finalPrice)}</span>
                          {isPromo && (
                            <span className="text-[10px] line-through" style={{ color: COLORS.muted }}>{rupee(item.price)}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <span className="text-[11px]" style={{ color: COLORS.muted }}>
                          {item.description ? item.description.substring(0, 40) + "..." : ""}
                        </span>
                        
                        {qty > 0 ? (
                          <div className="flex items-center gap-2 rounded-full px-2 py-0.5" style={{ background: COLORS.espresso, border: `1px solid ${COLORS.line}` }}>
                            <button onClick={() => updateQty(item, activeCategory, -1)} className="p-1 hover:text-white cursor-pointer" style={{ color: COLORS.gold }}>
                              <Minus size={12} />
                            </button>
                            <span className="text-xs font-bold w-4 text-center" style={{ color: COLORS.cream }}>{qty}</span>
                            <button onClick={() => updateQty(item, activeCategory, 1)} className="p-1 hover:text-white cursor-pointer" style={{ color: COLORS.gold }}>
                              <Plus size={12} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => updateQty(item, activeCategory, 1)}
                            className="text-xs font-semibold px-3 py-1 rounded-full hover:opacity-90 cursor-pointer"
                            style={{ background: COLORS.gold, color: COLORS.espresso }}
                          >
                            Add +
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Order Details & Cart POS Summary (40% width on md) */}
        <div className="w-full md:w-2/5 flex flex-col h-1/2 md:h-full bg-black/20">
          {/* Customer Form Header */}
          <div className="p-4 flex items-center justify-between shrink-0" style={{ borderBottom: `1px solid ${COLORS.line}` }}>
            <h3 className="vb-display text-xl" style={{ color: COLORS.cream }}>Customer Details</h3>
            <button onClick={onClose} className="cursor-pointer" style={{ color: COLORS.muted }}>
              <X size={18} />
            </button>
          </div>

          {/* Form + Summary Scrollable Section */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 vb-scrollbar">
            {error && (
              <div className="rounded-lg p-2.5 text-xs text-center font-medium" style={{ background: "rgba(239,68,68,0.15)", color: COLORS.danger, border: `1px solid ${COLORS.danger}` }}>
                {error}
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-3">
              {/* Name */}
              <div className="relative">
                <span className="absolute left-3 top-3" style={{ color: COLORS.muted }}><User size={14} /></span>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={details.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="w-full text-xs rounded-xl py-2.5 pl-9 pr-4 border transition-all"
                  style={{ background: COLORS.umber, color: COLORS.cream, borderColor: COLORS.line, outline: "none" }}
                />
              </div>

              {/* Mobile */}
              <div className="relative">
                <span className="absolute left-3 top-3" style={{ color: COLORS.muted }}><Phone size={14} /></span>
                <input
                  type="text"
                  placeholder="10-digit Mobile"
                  value={details.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="w-full text-xs rounded-xl py-2.5 pl-9 pr-4 border transition-all"
                  style={{ background: COLORS.umber, color: COLORS.cream, borderColor: COLORS.line, outline: "none" }}
                />
              </div>

              {/* Email */}
              <div className="relative">
                <span className="absolute left-3 top-3" style={{ color: COLORS.muted }}><Mail size={14} /></span>
                <input
                  type="email"
                  placeholder="Email ID (optional)"
                  value={details.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="w-full text-xs rounded-xl py-2.5 pl-9 pr-4 border transition-all"
                  style={{ background: COLORS.umber, color: COLORS.cream, borderColor: COLORS.line, outline: "none" }}
                />
              </div>

              {/* Order Mode (Takeaway / Dine-in) */}
              <div className="flex gap-2">
                {(["Takeaway", "Dine-in"] as const).map((m) => {
                  const selected = details.mode === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleInputChange("mode", m)}
                      className="flex-1 py-2 text-xs rounded-xl transition-all cursor-pointer"
                      style={
                        selected
                          ? { background: COLORS.gold, color: COLORS.espresso, fontWeight: "bold" }
                          : { background: COLORS.umber, color: COLORS.muted, border: `1px solid ${COLORS.line}` }
                      }
                    >
                      {m}
                    </button>
                  );
                })}
              </div>

              {/* Special Instructions */}
              <div className="relative">
                <span className="absolute left-3 top-3" style={{ color: COLORS.muted }}><FileText size={14} /></span>
                <input
                  type="text"
                  placeholder="Special Instructions (e.g. Extra cheese)"
                  value={details.note}
                  onChange={(e) => handleInputChange("note", e.target.value)}
                  className="w-full text-xs rounded-xl py-2.5 pl-9 pr-4 border transition-all"
                  style={{ background: COLORS.umber, color: COLORS.cream, borderColor: COLORS.line, outline: "none" }}
                />
              </div>
            </div>

            {/* Cart Items Summary */}
            <div className="space-y-2 pt-2" style={{ borderTop: `1px solid ${COLORS.line}` }}>
              <p className="text-xs uppercase tracking-wider text-muted font-semibold" style={{ color: COLORS.muted }}>Order Items</p>
              {cartItems.length === 0 ? (
                <p className="text-[11px] italic" style={{ color: COLORS.muted }}>No items selected yet.</p>
              ) : (
                <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1 vb-scrollbar">
                  {cartItems.map((line) => (
                    <div key={line.item.id} className="flex justify-between text-xs items-center">
                      <span style={{ color: COLORS.cream }}>{line.item.name} × {line.qty}</span>
                      <span style={{ color: COLORS.gold }}>{rupee(priceFor(line.category, line.item) * line.qty)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pricing totals */}
            {cartItems.length > 0 && (
              <div className="space-y-1.5 pt-3 text-xs" style={{ borderTop: `1px dashed ${COLORS.line}` }}>
                <div className="flex justify-between">
                  <span style={{ color: COLORS.muted }}>Subtotal</span>
                  <span style={{ color: COLORS.cream }}>{rupee(subtotal)}</span>
                </div>
                {savings > 0 && (
                  <div className="flex justify-between font-medium" style={{ color: COLORS.success }}>
                    <span>Savings</span>
                    <span>-{rupee(savings)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm pt-1" style={{ color: COLORS.gold, borderTop: `1px solid rgba(199,154,86,0.1)` }}>
                  <span>Total Amount</span>
                  <span>{rupee(total)}</span>
                </div>
              </div>
            )}

            {/* Payment Method Selector */}
            {cartItems.length > 0 && (
              <div className="space-y-2 pt-2" style={{ borderTop: `1px solid ${COLORS.line}` }}>
                <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: COLORS.muted }}>Payment Method</p>
                <div className="flex gap-2">
                  {(["upi", "card", "cod"] as const).map((method) => {
                    const selected = payment === method;
                    const labels = { upi: "UPI", card: "Card", cod: "Cash" };
                    return (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPayment(method)}
                        className="flex-1 py-1.5 text-[10px] rounded-lg transition-all border flex items-center justify-center gap-1 cursor-pointer"
                        style={
                          selected
                            ? { background: COLORS.gold, color: COLORS.espresso, borderColor: COLORS.gold, fontWeight: "bold" }
                            : { background: COLORS.umber, color: COLORS.muted, borderColor: COLORS.line }
                        }
                      >
                        {selected && <Check size={10} />}
                        {labels[method]}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer Action */}
          <div className="p-4 shrink-0" style={{ borderTop: `1px solid ${COLORS.line}` }}>
            <button
              onClick={handlePlaceOrder}
              disabled={submitting || cartItems.length === 0}
              className="w-full py-3 rounded-full text-xs font-bold uppercase tracking-wider hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
              style={{ background: COLORS.gold, color: COLORS.espresso }}
            >
              {submitting ? "Placing Order..." : `Confirm & Place Order (${rupee(total)})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
