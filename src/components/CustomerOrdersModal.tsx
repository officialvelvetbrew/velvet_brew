import { useState, useEffect } from "react";
import { X, Clock, CheckCircle2, AlertCircle, RefreshCw, ShoppingBag, ArrowRight } from "lucide-react";
import { COLORS } from "../data/colors";
import { fetchCustomerOrders } from "../services/ordersApi";
import { rupee } from "../utils/currency";
import type { Order } from "../types";

interface CustomerOrdersModalProps {
  open: boolean;
  onClose: () => void;
}

export default function CustomerOrdersModal({ open, onClose }: CustomerOrdersModalProps) {
  const [phone, setPhone] = useState<string>("");
  const [inputPhone, setInputPhone] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize phone from local storage when modal opens
  useEffect(() => {
    if (open) {
      const savedPhone = localStorage.getItem("vb_customer_phone");
      if (savedPhone) {
        setPhone(savedPhone);
        setInputPhone(savedPhone);
      } else {
        try {
          const detailsStr = localStorage.getItem("vb_details");
          if (detailsStr) {
            const details = JSON.parse(detailsStr);
            if (details.phone) {
              setPhone(details.phone);
              setInputPhone(details.phone);
              localStorage.setItem("vb_customer_phone", details.phone);
            }
          }
        } catch (e) {
          // ignore parsing error
        }
      }
    }
  }, [open]);

  // Fetch orders when phone changes
  useEffect(() => {
    if (!open || !phone) return;

    let active = true;
    setLoading(true);
    setError(null);

    fetchCustomerOrders(phone)
      .then((res) => {
        if (active) {
          setOrders(res || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          console.error("Failed to fetch customer orders:", err);
          setError("Failed to load your orders. Please try again.");
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [open, phone]);

  const handleSetPhone = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputPhone.replace(/\D/g, "").length >= 10) {
      setPhone(inputPhone);
      localStorage.setItem("vb_customer_phone", inputPhone);
    } else {
      setError("Please enter a valid mobile number.");
    }
  };

  const handleChangeNumber = () => {
    setPhone("");
    setOrders([]);
    setError(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#10b981]/10 text-[#10b981]"><CheckCircle2 size={12} /> Completed</span>;
      case "preparing":
      case "accepted":
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#f59e0b]/10 text-[#f59e0b]"><RefreshCw size={12} className="animate-spin" /> {status}</span>;
      case "ready":
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#3b82f6]/10 text-[#3b82f6]"><CheckCircle2 size={12} /> Ready</span>;
      case "rejected":
      case "cancelled":
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#ef4444]/10 text-[#ef4444]"><AlertCircle size={12} /> {status}</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#8B7355]/10 text-[#8B7355]"><Clock size={12} /> {status}</span>;
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-md h-full bg-[#fdfbf7] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#f3eee7] bg-white shrink-0">
          <div>
            <h2 className="text-xl font-bold text-[#2C1810]">My Orders</h2>
            {phone && (
              <p className="text-[12px] text-[#8B7355] font-medium mt-0.5 flex items-center gap-2">
                +91 {phone}
                <button onClick={handleChangeNumber} className="text-[#d4af37] underline hover:text-[#c5a028] transition-colors">Change</button>
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-2 rounded-full text-[#8B7355] hover:bg-[#f3eee7] hover:text-[#2C1810] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto vb-scrollbar p-6">
          {!phone ? (
            // Phone prompt
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-[#f3eee7] flex items-center justify-center text-[#8B7355]">
                <ShoppingBag size={32} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#2C1810]">Track Your Orders</h3>
                <p className="text-sm text-[#8B7355] mt-2 max-w-[280px]">
                  Enter your mobile number to view your active and past orders.
                </p>
              </div>

              <form onSubmit={handleSetPhone} className="w-full max-w-xs space-y-4">
                <input
                  type="tel"
                  placeholder="Mobile number"
                  value={inputPhone}
                  onChange={(e) => setInputPhone(e.target.value)}
                  className="w-full h-12 rounded-xl border border-[#e8dfd5] bg-white px-4 text-[14px] text-center text-[#2C1810] font-medium tracking-widest outline-none focus:border-[#d4c5b0] focus:ring-1 focus:ring-[#d4c5b0] transition-shadow placeholder:tracking-normal placeholder:font-normal placeholder:text-[#d4c5b0]"
                  maxLength={10}
                />
                {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
                <button
                  type="submit"
                  disabled={inputPhone.length < 10}
                  className="w-full h-12 rounded-xl text-[14px] font-bold tracking-wide transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: COLORS.espresso, color: COLORS.cream }}
                >
                  View Orders <ArrowRight size={16} />
                </button>
              </form>
            </div>
          ) : (
            // Orders list
            <div className="space-y-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-[#8B7355]">
                   <RefreshCw className="h-8 w-8 animate-spin mb-4 text-[#d4af37]" />
                   <p className="text-sm font-medium">Fetching your orders...</p>
                </div>
              ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-600 text-sm font-medium">
                  {error}
                </div>
              ) : orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <ShoppingBag className="h-12 w-12 text-[#e8dfd5] mb-4" />
                  <p className="text-[#2C1810] font-bold">No orders found</p>
                  <p className="text-sm text-[#8B7355] mt-1">You haven't placed any orders with this number yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="bg-white border border-[#e8dfd5] rounded-2xl p-4 shadow-sm hover:border-[#d4c5b0] transition-colors relative overflow-hidden group">
                      
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-1">
                            {new Date(order.createdAt.endsWith('Z') ? order.createdAt : order.createdAt + 'Z').toLocaleDateString("en-IN", { day: "numeric", month: "short" })} • {new Date(order.createdAt.endsWith('Z') ? order.createdAt : order.createdAt + 'Z').toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                          <p className="font-bold text-[#2C1810]">#{order.id}</p>
                        </div>
                        {getStatusBadge(order.status)}
                      </div>

                      <div className="bg-[#fdfbf7] border border-[#f3eee7] rounded-xl p-3 mb-3">
                        <ul className="space-y-1.5">
                          {order.items?.map((item, idx) => (
                            <li key={idx} className="flex justify-between text-[13px]">
                              <span className="text-[#8B7355] font-medium"><span className="text-[#2C1810] font-bold">{item.qty}x</span> {item.name}</span>
                              <span className="text-[#2C1810] font-medium">{rupee(item.price * item.qty)}</span>
                            </li>
                          ))}
                        </ul>
                        {order.note && (
                          <div className="mt-2 pt-2 border-t border-[#f3eee7]">
                            <p className="text-[11px] italic text-[#8B7355]">"{order.note}"</p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          order.paymentMethod === 'upi'
                            ? 'bg-violet-50 text-violet-700 border border-violet-200'
                            : order.paymentMethod === 'card'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-[#f3eee7] text-[#8B7355] border border-[#e8dfd5]'
                        }`}>
                          {order.paymentMethod === 'upi' ? 'UPI' : order.paymentMethod === 'card' ? 'Card' : 'Cash'}
                        </span>

                        <div className="text-right">
                           <p className="text-sm font-bold text-[#2C1810]">{rupee(order.total || 0)}</p>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
