import { useState, useMemo } from "react";
import { Search, Plus, Minus, Trash2, Banknote, Smartphone, CreditCard } from "lucide-react";
import { rupee } from "../../utils/currency";
import { createOrder, createPayment, verifyPayment, updateOrderPaid, updateOrderPaymentFailed } from "../../services/ordersApi";
import { loadRazorpayScript } from "../../utils/razorpay";
import type { Order, PaymentMethod } from "../../types";
import { validateOffer } from "../../api/offers";

interface PosBillingViewProps {
  items: any[];
}

export default function PosBillingView({ items }: PosBillingViewProps) {
  const [query, setQuery] = useState("");
  const [channel, setChannel] = useState<"Dine-in" | "Takeaway">("Dine-in");
  const [cat, setCat] = useState<string>("1");

  const [cart, setCart] = useState<Record<string, { item: any; qty: number }>>({});
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [payment, setPayment] = useState<PaymentMethod>("cod");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [offerCode, setOfferCode] = useState("");
  const [appliedOfferCode, setAppliedOfferCode] = useState<string | null>(null);
  const [offerDiscount, setOfferDiscount] = useState<number>(0);
  const [validatingOffer, setValidatingOffer] = useState(false);
  const [offerError, setOfferError] = useState<string | null>(null);

  const categories = [
    { id: "1", name: "Hot Coffee", emoji: "☕" },
    { id: "2", name: "Cold Coffee", emoji: "🧊" },
    { id: "3", name: "Shakes", emoji: "🥤" },
    { id: "4", name: "Café Bites", emoji: "🥐" },
  ];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((i) => {
      const matchCat = cat === "all" || String(i.categoryId) === cat;
      const matchQuery = !q || i.name.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [items, cat, query]);

  const addToCart = (item: any) => {
    setCart((prev) => {
      const existing = prev[item.id];
      if (existing) {
        return { ...prev, [item.id]: { ...existing, qty: existing.qty + 1 } };
      }
      return { ...prev, [item.id]: { item, qty: 1 } };
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) => {
      const existing = prev[id];
      if (!existing) return prev;
      const nextQty = existing.qty + delta;
      if (nextQty <= 0) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }
      return { ...prev, [id]: { ...existing, qty: nextQty } };
    });
  };

  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  const cartItems = Object.values(cart);
  const subtotal = cartItems.reduce((acc, { item, qty }) => {
    const price = item.offerPrice !== null && item.offerPrice !== undefined && item.offerPrice < item.price ? item.offerPrice : item.price;
    return acc + price * qty;
  }, 0);

  const finalTotal = Math.max(0, subtotal - offerDiscount);

  const handleApplyOffer = async () => {
    if (!offerCode.trim()) return;
    setValidatingOffer(true);
    setOfferError(null);
    try {
      const itemsPayload = cartItems.map(c => ({
        menuId: Number(c.item.id) || Number(c.item.id.replace(/\\D/g, "")) || 0,
        quantity: c.qty
      }));
      const res = await validateOffer({
        code: offerCode.trim(),
        mobile: customerPhone.trim(),
        items: itemsPayload
      });
      setAppliedOfferCode(res.code);
      setOfferDiscount(res.discountAmount);
    } catch (err: any) {
      setOfferError(err.message || "Invalid offer code");
      setAppliedOfferCode(null);
      setOfferDiscount(0);
    } finally {
      setValidatingOffer(false);
    }
  };

  const removeOffer = () => {
    setOfferCode("");
    setAppliedOfferCode(null);
    setOfferDiscount(0);
    setOfferError(null);
  };

  // ... (handleCharge is unchanged) ...
  const handleCharge = async () => {
    setError(null);
    if (!customerName.trim()) {
      setError("Customer Name is required.");
      return;
    }
    if (!customerPhone.trim() || customerPhone.replace(/\D/g, "").length < 10) {
      setError("Valid Phone Number is required.");
      return;
    }
    if (cartItems.length === 0) return;

    setSubmitting(true);
    try {
      const orderId = `POS-${Date.now()}`;
      const newOrder: Order = {
        id: orderId,
        customerName: customerName.trim(),
        phone: customerPhone.trim(),
        email: "",
        mode: channel,
        note: "",
        items: cartItems.map((c) => {
          const offerPrice = c.item.offerPrice;
          const originalPrice = c.item.price;
          const effectivePrice = (offerPrice !== null && offerPrice !== undefined && offerPrice < originalPrice) ? offerPrice : originalPrice;
          return {
            id: String(c.item.id),
            name: c.item.name,
            category: c.item.categoryName || "hot",
            price: effectivePrice,
            qty: c.qty,
          };
        }),
        subtotal: subtotal,
        savings: offerDiscount,
        total: finalTotal,
        paymentMethod: payment,
        paid: false,
        status: "Pending",
        offerCode: appliedOfferCode || undefined,
        createdAt: new Date().toISOString(),
      };

      if (payment === "cod") {
        await createOrder(newOrder);
        setCart({});
        setCustomerName("");
        setCustomerPhone("");
        setPayment("cod");
        removeOffer();
        setIsMobileCartOpen(false);
        alert("Order placed successfully!");
        setSubmitting(false);
      } else {
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          setError("Failed to load Razorpay payment portal.");
          setSubmitting(false);
          return;
        }

        const initPaymentRes = await createPayment(newOrder);
        const paymentData = initPaymentRes && initPaymentRes.data ? initPaymentRes.data : initPaymentRes;

        const rzpOrderId = paymentData.orderId || paymentData.razorpay_order_id;
        const rzpKeyId = paymentData.key || paymentData.keyId;
        
        const options = {
          key: rzpKeyId,
          amount: Math.round(finalTotal * 100),
          currency: paymentData.currency || "INR",
          name: "Velvet Brew",
          description: `POS Order Payment`,
          order_id: rzpOrderId,
          handler: async function (response: any) {
            try {
              setSubmitting(true);
              await verifyPayment({
                razorpayOrderId: response.razorpay_order_id || rzpOrderId,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });
              setCart({});
              setCustomerName("");
              setCustomerPhone("");
              setIsMobileCartOpen(false);
              alert("Order & Payment successful!");
            } catch (err) {
              console.error(err);
              alert("Payment verification failed.");
            } finally {
              setSubmitting(false);
            }
          },
          modal: {
            ondismiss: async function () {
              setSubmitting(true);
              try {
                alert("Payment was cancelled or failed.");
              } catch (err) {
                console.error("Failed to mark order as payment failed", err);
              } finally {
                setSubmitting(false);
              }
            }
          },
          theme: { color: "#2C1810" }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on("payment.failed", async function (response: any) {
          setSubmitting(true);
          try {
            alert(`Payment failed: ${response.error.description}`);
          } catch (err) {
            console.error(err);
          } finally {
            setSubmitting(false);
          }
        });
        rzp.open();
      }
    } catch (err) {
      console.error(err);
      setError("Failed to place order.");
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row flex-1 h-full overflow-hidden bg-[#FDFBF7] relative">
      {/* Menu Area */}
      <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto vb-scrollbar pb-24 md:pb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center max-w-4xl mb-6">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B7355]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the menu…"
              className="h-12 w-full rounded-2xl border border-[#e8dfd5] bg-white pl-11 pr-4 text-[14px] focus:border-[#D4AF37] focus:outline-none focus:ring-4 focus:ring-[#D4AF37]/20 text-[#2C1810]"
            />
          </div>

          <div className="flex shrink-0 items-center gap-1 rounded-2xl border border-[#e8dfd5] bg-white p-1">
            <button
              onClick={() => setChannel("Dine-in")}
              className={`relative rounded-xl px-4 py-2 text-[13px] font-bold transition-colors ${
                channel === "Dine-in" ? "bg-gradient-to-b from-[#e8dfd5] to-[#d4c5b0] text-[#2C1810]" : "text-[#8B7355]"
              }`}
            >
              Dine-in
            </button>
            <button
              onClick={() => setChannel("Takeaway")}
              className={`relative rounded-xl px-4 py-2 text-[13px] font-bold transition-colors ${
                channel === "Takeaway" ? "bg-gradient-to-b from-[#e8dfd5] to-[#d4c5b0] text-[#2C1810]" : "text-[#8B7355]"
              }`}
            >
              Takeaway
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pb-2 mb-6 pt-1">
          <button
            onClick={() => setCat("all")}
            className={`flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2 text-[13px] font-bold transition-all ${
              cat === "all"
                ? "border-[#2C1810] bg-[#2C1810] text-[#fdfbf7]"
                : "border-[#e8dfd5] bg-white text-[#8B7355] hover:border-[#d4c5b0]"
            }`}
          >
            <span>✨</span> All
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              className={`flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2 text-[13px] font-bold transition-all ${
                cat === c.id
                  ? "border-[#2C1810] bg-[#2C1810] text-[#fdfbf7]"
                  : "border-[#e8dfd5] bg-white text-[#8B7355] hover:border-[#d4c5b0]"
              }`}
            >
              <span>{c.emoji}</span> {c.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 pb-10">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => addToCart(item)}
              className="group overflow-hidden rounded-3xl border border-[#e8dfd5] bg-white text-left shadow-sm transition-shadow hover:shadow-md cursor-pointer select-none flex flex-col"
            >
              <div className="aspect-[5/3] w-full bg-[#2C1810] flex items-center justify-center relative overflow-hidden pattern-dots shrink-0">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl.startsWith("s3://velvetbrew/") ? item.imageUrl.replace("s3://velvetbrew/", "https://velvetbrew.s3.ap-south-1.amazonaws.com/") : item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover opacity-80"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <span className="text-4xl relative z-10">{
                    categories.find(c => String(item.categoryId) === c.id)?.emoji || "☕"
                  }</span>
                )}
              </div>
              <div className="p-3 md:p-4 flex flex-col flex-1 min-w-0">
                <p className="truncate text-[13px] md:text-[14px] font-bold leading-tight text-[#2C1810]">
                  {item.name}
                </p>
                <div className="flex items-center justify-between mt-auto pt-2">
                  <p className="font-display text-[15px] md:text-[16px] font-bold text-[#8B7355]">
                    {rupee(item.offerPrice !== null && item.offerPrice !== undefined && item.offerPrice < item.price ? item.offerPrice : item.price)}
                  </p>
                  {cart[item.id] && (
                    <span className="bg-[#D4AF37] text-[#2C1810] text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ml-1">
                      x{cart[item.id].qty}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-[16px] font-bold text-[#2C1810]">No items match</p>
            <p className="text-[13px] text-[#8B7355] mt-1">Try another category or clear the search.</p>
          </div>
        )}
      </div>

      {/* Cart Sidebar Overlay for Mobile */}
      <div 
        className={`fixed inset-0 z-40 bg-black/50 md:hidden transition-opacity ${isMobileCartOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`} 
        onClick={() => setIsMobileCartOpen(false)} 
      />

      {/* Cart Sidebar */}
      <div className={`fixed md:static inset-y-0 right-0 z-50 w-[85vw] sm:w-96 md:w-80 flex-shrink-0 bg-white border-l border-[#e8dfd5] flex flex-col shadow-2xl md:shadow-[-4px_0_24px_rgba(44,24,16,0.02)] transition-transform duration-300 ${isMobileCartOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"}`}>
        <div className="p-5 border-b border-[#e8dfd5] bg-[#FDFBF7] flex justify-between items-center">
          <div>
            <h2 className="font-display text-[18px] font-bold text-[#2C1810]">Current Ticket</h2>
            <p className="text-[12px] text-[#8B7355] mt-0.5 font-medium">{channel}</p>
          </div>
          <button className="md:hidden p-2 text-[#8B7355] hover:bg-[#e8dfd5] rounded-full" onClick={() => setIsMobileCartOpen(false)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4 vb-scrollbar">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-[#8B7355] opacity-50 space-y-3">
              <span className="text-4xl">🛒</span>
              <p className="text-[13px] font-bold">Ticket is empty</p>
            </div>
          ) : (
            cartItems.map(({ item, qty }) => {
              const price = item.offerPrice !== null && item.offerPrice !== undefined && item.offerPrice < item.price ? item.offerPrice : item.price;
              return (
                <div key={item.id} className="flex flex-col gap-2 p-3 rounded-2xl border border-[#e8dfd5] bg-[#FDFBF7]">
                  <div className="flex justify-between items-start">
                    <p className="text-[13px] font-bold text-[#2C1810] leading-tight flex-1 pr-2">{item.name}</p>
                    <p className="text-[13px] font-bold text-[#8B7355] shrink-0">{rupee(price * qty)}</p>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-3 bg-white border border-[#e8dfd5] rounded-lg p-1">
                      <button
                        onClick={() => updateQty(item.id, -1)}
                        className="w-6 h-6 flex items-center justify-center rounded-md bg-[#FDFBF7] text-[#2C1810] hover:bg-[#e8dfd5] transition-colors"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-[12px] font-bold w-4 text-center text-[#2C1810]">{qty}</span>
                      <button
                        onClick={() => updateQty(item.id, 1)}
                        className="w-6 h-6 flex items-center justify-center rounded-md bg-[#D4AF37] text-[#2C1810] hover:bg-[#c4a130] transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <button
                      onClick={() => updateQty(item.id, -qty)}
                      className="text-[#8B7355] hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-5 border-t border-[#e8dfd5] bg-[#FDFBF7] space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-[12px] font-medium leading-tight">{error}</p>
            </div>
          )}

          <div className="space-y-3">
            <input
              type="text"
              placeholder="Customer Name *"
              value={customerName}
              onChange={(e) => { setCustomerName(e.target.value); setError(null); }}
              className="w-full h-10 rounded-xl border border-[#e8dfd5] bg-white px-3 text-[13px] focus:border-[#D4AF37] focus:outline-none"
            />
            <input
              type="tel"
              placeholder="Phone Number *"
              value={customerPhone}
              onChange={(e) => { setCustomerPhone(e.target.value); setError(null); }}
              className="w-full h-10 rounded-xl border border-[#e8dfd5] bg-white px-3 text-[13px] focus:border-[#D4AF37] focus:outline-none"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setPayment("cod")}
              className={`flex-1 flex flex-col items-center justify-center gap-1.5 rounded-xl border p-2 transition-all ${
                payment === "cod" ? "border-[#2C1810] bg-[#2C1810] text-[#FDFBF7]" : "border-[#e8dfd5] bg-white text-[#8B7355] hover:border-[#d4c5b0]"
              }`}
            >
              <Banknote size={16} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Cash</span>
            </button>
            <button
              onClick={() => setPayment("upi")}
              className={`flex-1 flex flex-col items-center justify-center gap-1.5 rounded-xl border p-2 transition-all ${
                payment === "upi" ? "border-[#2C1810] bg-[#2C1810] text-[#FDFBF7]" : "border-[#e8dfd5] bg-white text-[#8B7355] hover:border-[#d4c5b0]"
              }`}
            >
              <Smartphone size={16} />
              <span className="text-[10px] font-bold uppercase tracking-wider">UPI</span>
            </button>
            <button
              onClick={() => setPayment("card")}
              className={`flex-1 flex flex-col items-center justify-center gap-1.5 rounded-xl border p-2 transition-all ${
                payment === "card" ? "border-[#2C1810] bg-[#2C1810] text-[#FDFBF7]" : "border-[#e8dfd5] bg-white text-[#8B7355] hover:border-[#d4c5b0]"
              }`}
            >
              <CreditCard size={16} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Card</span>
            </button>
          </div>

          <div className="pt-4 border-t border-[#e8dfd5] space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Offer Code"
                value={offerCode}
                onChange={(e) => setOfferCode(e.target.value.toUpperCase())}
                disabled={!!appliedOfferCode || validatingOffer}
                className="flex-1 rounded-xl border border-[#e8dfd5] bg-white px-4 py-2.5 text-[14px] outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] uppercase disabled:bg-gray-50"
              />
              {appliedOfferCode ? (
                <button
                  onClick={removeOffer}
                  className="px-4 py-2.5 rounded-xl border border-red-200 text-red-600 font-bold text-[14px] hover:bg-red-50"
                >
                  Remove
                </button>
              ) : (
                <button
                  onClick={handleApplyOffer}
                  disabled={!offerCode.trim() || validatingOffer || cartItems.length === 0}
                  className="px-4 py-2.5 rounded-xl bg-[#2C1810] text-white font-bold text-[14px] disabled:opacity-50 hover:bg-[#3A2418]"
                >
                  {validatingOffer ? "..." : "Apply"}
                </button>
              )}
            </div>
            {offerError && <p className="text-red-500 text-xs font-bold px-1">{offerError}</p>}
            {appliedOfferCode && <p className="text-green-600 text-xs font-bold px-1">Offer '{appliedOfferCode}' applied: -{rupee(offerDiscount)}</p>}

            <div className="flex justify-between items-center px-1">
              <span className="font-bold text-[#2C1810] text-[14px]">Subtotal</span>
              <span className="font-display font-bold text-[#2C1810] text-[18px]">
                {rupee(subtotal)}
              </span>
            </div>
            {appliedOfferCode && (
              <div className="flex justify-between items-center px-1 text-green-600">
                <span className="font-bold text-[14px]">Discount</span>
                <span className="font-display font-bold text-[18px]">
                  -{rupee(offerDiscount)}
                </span>
              </div>
            )}
            {appliedOfferCode && (
              <div className="flex justify-between items-center px-1 border-t border-[#e8dfd5] pt-2">
                <span className="font-bold text-[#2C1810] text-[16px]">Total</span>
                <span className="font-display font-bold text-[#2C1810] text-[22px]">
                  {rupee(finalTotal)}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={handleCharge}
            disabled={cartItems.length === 0 || submitting}
            className={`w-full py-4 rounded-2xl text-[15px] font-bold transition-all shadow-md ${
              cartItems.length > 0 && !submitting
                ? "bg-[#D4AF37] text-[#2C1810] hover:bg-[#c4a130]"
                : "bg-[#e8dfd5] text-[#8B7355] cursor-not-allowed"
            }`}
          >
            {submitting ? "Processing..." : `Charge ${rupee(subtotal)}`}
          </button>
        </div>
      </div>

      {/* Mobile Cart Floating Bar */}
      {cartItems.length > 0 && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-[#e8dfd5] shadow-[0_-4px_12px_rgba(44,24,16,0.05)] z-30">
          <button 
            onClick={() => setIsMobileCartOpen(true)} 
            className="w-full py-3.5 rounded-xl bg-[#2C1810] text-[#FDFBF7] font-bold text-[14px] flex items-center justify-between px-5 shadow-lg"
          >
            <div className="flex items-center gap-3">
              <span className="bg-[#D4AF37] text-[#2C1810] px-2 py-0.5 rounded-md text-[12px]">{cartItems.length} items</span>
            </div>
            <span>View Ticket · {rupee(subtotal)}</span>
          </button>
        </div>
      )}
    </div>
  );
}
