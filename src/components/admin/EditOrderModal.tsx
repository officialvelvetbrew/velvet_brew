import { useState, useEffect, useMemo } from "react";
import { X, Plus, Minus, Search, ShoppingBag } from "lucide-react";
import { COLORS } from "../../data/colors";
import { rupee } from "../../utils/currency";
import { CATEGORIES, MENU } from "../../data/menu";
import { getMenu, getCategories } from "../../api/menu";
import { updateOrderItems } from "../../services/ordersApi";
import type { Category, MenuItem, CategoryId, Order, OrderItemRecord } from "../../types";

interface EditOrderModalProps {
  order: Order | null;
  open: boolean;
  onClose: () => void;
  onSuccess: (updatedOrder: Order) => void;
}

export default function EditOrderModal({ order, open, onClose, onSuccess }: EditOrderModalProps) {
  const [categories, setCategories] = useState<Category[]>(CATEGORIES);
  const [menu, setMenu] = useState<Record<CategoryId, MenuItem[]>>(MENU);
  const [activeCategory, setActiveCategory] = useState<CategoryId>("hot");
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Local cart state: map of itemId -> { item, category, qty }
  const [cart, setCart] = useState<Record<string, { item: MenuItem; category: CategoryId; qty: number }>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize cart from order items when modal opens
  useEffect(() => {
    if (!open || !order) return;

    setError(null);
    setSearchQuery("");

    // Load available menu items from API
    let active = true;
    async function load() {
      try {
        setLoadingMenu(true);
        const [apiCategories, apiItems] = await Promise.all([
          getCategories().catch(() => []),
          getMenu().catch(() => []),
        ]);
        if (!active) return;

        if (apiCategories.length > 0) {
          const mappedCategories: Category[] = apiCategories.map((cat: any) => {
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

          const uniqueCategories: Category[] = [];
          const seen = new Set<CategoryId>();
          mappedCategories.forEach((cat) => {
            if (!seen.has(cat.id)) {
              seen.add(cat.id);
              uniqueCategories.push(cat);
            }
          });
          setCategories(uniqueCategories.length > 0 ? uniqueCategories : CATEGORIES);
        }

        if (apiItems.length > 0) {
          const newMenu: Record<CategoryId, MenuItem[]> = { hot: [], cold: [], shakes: [], bites: [] };
          const nameToApiMap = new Map<string, any>();

          apiItems.forEach((item: any) => {
            nameToApiMap.set(item.name.trim().toLowerCase(), item);
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
          setMenu(newMenu);

          // Re-map initial cart items to real backend menu IDs
          setCart((prevCart) => {
            const updatedCart: Record<string, { item: MenuItem; category: CategoryId; qty: number }> = {};
            Object.values(prevCart).forEach((line) => {
              const match = nameToApiMap.get(line.item.name.trim().toLowerCase()) ||
                apiItems.find((i: any) => String(i.id) === String(line.item.id));
              
              const realId = match ? String(match.id) : line.item.id;
              const realPrice = match ? match.price : line.item.price;

              updatedCart[realId] = {
                item: {
                  ...line.item,
                  id: realId,
                  price: realPrice,
                },
                category: line.category,
                qty: line.qty,
              };
            });
            return updatedCart;
          });
        }
      } catch (err) {
        console.error("EditOrderModal menu load error:", err);
      } finally {
        if (active) setLoadingMenu(false);
      }
    }

    load();

    // Populate initial cart from order items
    const initialCart: Record<string, { item: MenuItem; category: CategoryId; qty: number }> = {};
    order.items.forEach((it) => {
      initialCart[it.id] = {
        item: {
          id: it.id,
          name: it.name,
          price: it.price,
        },
        category: it.category || "hot",
        qty: it.qty,
      };
    });
    setCart(initialCart);

    return () => {
      active = false;
    };
  }, [open, order]);

  const updateQty = (item: MenuItem, category: CategoryId, delta: number) => {
    setCart((prev) => {
      const current = prev[item.id];
      const newQty = (current?.qty || 0) + delta;
      const updated = { ...prev };
      if (newQty <= 0) {
        delete updated[item.id];
      } else {
        updated[item.id] = {
          item: current?.item || item,
          category,
          qty: newQty,
        };
      }
      return updated;
    });
  };

  const cartItems = useMemo(() => Object.values(cart), [cart]);

  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, line) => sum + line.item.price * line.qty, 0);
  }, [cartItems]);

  const handleSave = async () => {
    if (!order) return;
    if (cartItems.length === 0) {
      setError("An order must have at least 1 item");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const newItems: OrderItemRecord[] = cartItems.map((line) => ({
        id: line.item.id,
        name: line.item.name,
        category: line.category,
        price: line.item.price,
        qty: line.qty,
      }));

      const updated = await updateOrderItems(order, newItems);
      if (updated) {
        onSuccess(updated);
      } else {
        // Fallback update
        onSuccess({
          ...order,
          items: newItems,
          subtotal,
          total: Math.max(0, subtotal - order.savings),
        });
      }
      onClose();
    } catch (err: any) {
      console.error("Edit order error:", err);
      setError(err?.message || "Failed to update order items");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open || !order) return null;

  const currentCategoryItems = menu[activeCategory] || [];
  const filteredCategoryItems = currentCategoryItems.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Box */}
      <div 
        className="relative w-[95vw] max-w-4xl h-[85vh] flex flex-col md:flex-row rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        style={{ background: COLORS.espresso, border: `1px solid ${COLORS.line}` }}
      >
        {/* Left Side: Item Browser */}
        <div className="w-full md:w-7/12 flex flex-col h-1/2 md:h-full border-b md:border-b-0 md:border-r" style={{ borderColor: COLORS.line }}>
          {/* Modal Header */}
          <div className="p-4 flex items-center justify-between shrink-0" style={{ borderBottom: `1px solid ${COLORS.line}` }}>
            <div>
              <h3 className="vb-display text-lg font-bold" style={{ color: COLORS.cream }}>Add / Edit Items</h3>
              <p className="text-xs" style={{ color: COLORS.muted }}>Order #{order.id} · {order.customerName}</p>
            </div>
            {loadingMenu && <span className="text-xs" style={{ color: COLORS.gold }}>Loading menu...</span>}
          </div>

          {/* Search bar & Categories */}
          <div className="p-3 space-y-2.5 shrink-0" style={{ background: "rgba(23,15,10,0.4)", borderBottom: `1px solid ${COLORS.line}` }}>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5" style={{ color: COLORS.muted }} />
              <input
                type="text"
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs rounded-xl py-2 pl-9 pr-3 border"
                style={{ background: COLORS.umber, color: COLORS.cream, borderColor: COLORS.line, outline: "none" }}
              />
            </div>

            <div className="flex gap-2 overflow-x-auto vb-scrollbar pb-1">
              {categories.map((cat) => {
                const active = activeCategory === cat.id;
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all shrink-0 cursor-pointer"
                    style={
                      active
                        ? { background: COLORS.gold, color: COLORS.espresso, fontWeight: "bold" }
                        : { border: `1px solid ${COLORS.line}`, color: COLORS.muted }
                    }
                  >
                    <Icon size={12} />
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Menu Items Grid */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 vb-scrollbar">
            {filteredCategoryItems.length === 0 ? (
              <p className="text-xs text-center py-8" style={{ color: COLORS.muted }}>No items found.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {filteredCategoryItems.map((item) => {
                  const qty = cart[item.id]?.qty || 0;
                  return (
                    <div
                      key={item.id}
                      className="rounded-xl p-3 flex flex-col justify-between transition-all"
                      style={{ background: COLORS.umber, border: qty > 0 ? `1px solid ${COLORS.gold}` : `1px solid transparent` }}
                    >
                      <div>
                        <div className="flex justify-between items-start">
                          <p className="text-xs font-semibold" style={{ color: COLORS.cream }}>{item.name}</p>
                          <span className="text-xs font-bold" style={{ color: COLORS.gold }}>{rupee(item.price)}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-end mt-2.5">
                        {qty > 0 ? (
                          <div className="flex items-center gap-2 rounded-full px-2 py-0.5" style={{ background: COLORS.espresso, border: `1px solid ${COLORS.line}` }}>
                            <button onClick={() => updateQty(item, activeCategory, -1)} className="p-1 cursor-pointer hover:text-white" style={{ color: COLORS.gold }}>
                              <Minus size={11} />
                            </button>
                            <span className="text-xs font-bold w-4 text-center" style={{ color: COLORS.cream }}>{qty}</span>
                            <button onClick={() => updateQty(item, activeCategory, 1)} className="p-1 cursor-pointer hover:text-white" style={{ color: COLORS.gold }}>
                              <Plus size={11} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => updateQty(item, activeCategory, 1)}
                            className="text-[11px] font-bold px-2.5 py-1 rounded-full cursor-pointer hover:opacity-90"
                            style={{ background: COLORS.gold, color: COLORS.espresso }}
                          >
                            + Add
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

        {/* Right Side: Order Summary & Confirm */}
        <div className="w-full md:w-5/12 flex flex-col h-1/2 md:h-full bg-black/20">
          <div className="p-4 flex items-center justify-between shrink-0" style={{ borderBottom: `1px solid ${COLORS.line}` }}>
            <div className="flex items-center gap-2">
              <ShoppingBag size={16} style={{ color: COLORS.gold }} />
              <h3 className="vb-display text-base font-bold" style={{ color: COLORS.cream }}>Updated Items</h3>
            </div>
            <button onClick={onClose} className="cursor-pointer hover:text-white" style={{ color: COLORS.muted }}>
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 vb-scrollbar">
            {error && (
              <div className="rounded-lg p-2.5 text-xs text-center font-medium" style={{ background: "rgba(239,68,68,0.15)", color: COLORS.danger, border: `1px solid ${COLORS.danger}` }}>
                {error}
              </div>
            )}

            <div className="space-y-2">
              {cartItems.length === 0 ? (
                <p className="text-xs text-center py-6 italic" style={{ color: COLORS.muted }}>No items in order.</p>
              ) : (
                cartItems.map((line) => (
                  <div key={line.item.id} className="flex items-center justify-between text-xs p-2.5 rounded-xl border" style={{ background: COLORS.umber, borderColor: COLORS.line }}>
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="font-semibold truncate" style={{ color: COLORS.cream }}>{line.item.name}</p>
                      <p className="text-[10.5px]" style={{ color: COLORS.muted }}>{rupee(line.item.price)} each</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1.5 rounded-full px-2 py-0.5" style={{ background: COLORS.espresso, border: `1px solid ${COLORS.line}` }}>
                        <button onClick={() => updateQty(line.item, line.category, -1)} className="p-0.5 cursor-pointer hover:text-white" style={{ color: COLORS.gold }}>
                          <Minus size={11} />
                        </button>
                        <span className="text-xs font-bold w-4 text-center" style={{ color: COLORS.cream }}>{line.qty}</span>
                        <button onClick={() => updateQty(line.item, line.category, 1)} className="p-0.5 cursor-pointer hover:text-white" style={{ color: COLORS.gold }}>
                          <Plus size={11} />
                        </button>
                      </div>
                      <span className="font-bold w-14 text-right" style={{ color: COLORS.gold }}>
                        {rupee(line.item.price * line.qty)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pricing Totals & Confirm */}
          <div className="p-4 shrink-0 space-y-3" style={{ borderTop: `1px solid ${COLORS.line}`, background: COLORS.espresso }}>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span style={{ color: COLORS.muted }}>Subtotal</span>
                <span style={{ color: COLORS.cream }}>{rupee(subtotal)}</span>
              </div>
              {order.savings > 0 && (
                <div className="flex justify-between" style={{ color: COLORS.success }}>
                  <span>Offer Savings</span>
                  <span>-{rupee(order.savings)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm pt-1" style={{ color: COLORS.gold, borderTop: `1px solid ${COLORS.line}` }}>
                <span>Estimated Total</span>
                <span>{rupee(Math.max(0, subtotal - order.savings))}</span>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={submitting || cartItems.length === 0}
              className="w-full py-3 rounded-full text-xs font-bold uppercase tracking-wider hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer"
              style={{ background: COLORS.gold, color: COLORS.espresso }}
            >
              {submitting ? "Updating Order..." : "Save Updated Order"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
