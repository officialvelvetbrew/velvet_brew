import React, { useEffect, useState } from "react";
import { X, IndianRupee, ShoppingBag, Award, Clock, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { fetchCustomerOrders } from "../../services/ordersApi";
import { rupee } from "../../utils/currency";
import type { Order } from "../../types";

interface CustomerManageModalProps {
  customer: {
    id?: string;
    fullName?: string;
    mobile?: string;
    lifetimeSpend?: number;
    totalVisits?: number;
    lastVisit?: string | null;
    loyaltyPoints?: number;
    joinedAt?: string;
    createdAt?: string;
  };
  onClose: () => void;
}

export default function CustomerManageModal({ customer, onClose }: CustomerManageModalProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    fetchCustomerOrders(customer.mobile || "", customer.id)
      .then((res) => {
        if (mounted) {
          setOrders(res || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          console.error("Failed to load customer orders:", err);
          setError("Failed to load customer orders.");
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [customer.mobile, customer.id]);

  const getInitials = (name: string) => {
    if (!name || name === "Unknown") return "?";
    const parts = name.split(" ").filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle2 size={12} /> Completed</span>;
      case "preparing":
      case "accepted":
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200"><RefreshCw size={12} className="animate-spin" /> {status}</span>;
      case "ready":
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200"><CheckCircle2 size={12} /> Ready</span>;
      case "rejected":
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200"><AlertCircle size={12} /> Rejected</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200"><Clock size={12} /> {status}</span>;
    }
  };

  const formatJoined = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
    } catch {
      return null;
    }
  };

  const joinedFormatted = formatJoined(customer.joinedAt || customer.createdAt);
  const loyaltyPoints = customer.loyaltyPoints !== undefined ? customer.loyaltyPoints : Math.floor((customer.lifetimeSpend || 0) / 10);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-3xl max-h-[90vh] bg-[#FDFBF7] rounded-3xl border border-[#e8dfd5] shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-white border-b border-[#f3eee7] px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-[#2C1810] text-[#D4AF37] flex items-center justify-center font-bold text-lg shadow-sm">
              {getInitials(customer.fullName || "")}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-[#2C1810]">{customer.fullName || "Customer Details"}</h2>
                {joinedFormatted && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#f3eee7] text-[#8B7355] font-medium">
                    Joined {joinedFormatted}
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-[#8B7355]">
                {customer.mobile ? `+91 ${customer.mobile}` : "No Mobile Number"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-10 w-10 rounded-full hover:bg-[#f3eee7] flex items-center justify-center text-[#8B7355] hover:text-[#2C1810] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 vb-scrollbar flex-1">
          
          {/* KPI Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-[#f3eee7] shadow-sm flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#2C1810] text-[#D4AF37] flex items-center justify-center shrink-0">
                <IndianRupee size={18} />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#8B7355]">Lifetime Spend</p>
                <p className="text-lg font-bold text-[#2C1810]">{rupee(customer.lifetimeSpend || 0)}</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#f3eee7] shadow-sm flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#fdfbf7] border border-[#e8dfd5] text-[#8B7355] flex items-center justify-center shrink-0">
                <ShoppingBag size={18} />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#8B7355]">Total Visits</p>
                <p className="text-lg font-bold text-[#2C1810]">{customer.totalVisits || 0} visits</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#f3eee7] shadow-sm flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#FFFBF0] border border-[#F6E0B3] text-[#D4AF37] flex items-center justify-center shrink-0">
                <Award size={18} />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#8B7355]">Loyalty Points</p>
                <p className="text-lg font-bold text-[#2C1810]">{loyaltyPoints} pts</p>
              </div>
            </div>
          </div>

          {/* Order History Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#2C1810] flex items-center gap-2">
                Order History
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#e8dfd5] text-[#2C1810]">
                  {orders.length}
                </span>
              </h3>
            </div>

            {loading ? (
              <div className="bg-white rounded-2xl border border-[#e8dfd5] p-12 text-center flex flex-col items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2C1810] border-t-transparent mb-3"></div>
                <p className="text-sm font-medium text-[#8B7355]">Loading order history...</p>
              </div>
            ) : error ? (
              <div className="bg-white rounded-2xl border border-red-100 p-6 text-center text-red-600 text-sm">
                {error}
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#e8dfd5] p-10 text-center">
                <ShoppingBag className="mx-auto h-10 w-10 text-[#8B7355]/40 mb-2" />
                <p className="text-sm font-semibold text-[#2C1810]">No orders found</p>
                <p className="text-xs text-[#8B7355] mt-1">This customer has not placed any orders yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div key={order.id} className="bg-white rounded-2xl border border-[#e8dfd5] p-4 shadow-sm hover:border-[#d4c5b0] transition-colors space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#2C1810] text-sm">#{order.id}</span>
                        <span className="text-xs text-[#8B7355]">
                          • {new Date(order.createdAt.endsWith('Z') ? order.createdAt : order.createdAt + 'Z').toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(order.status)}
                      </div>
                    </div>

                    {/* Items */}
                    <div className="text-xs text-[#2C1810] bg-[#fdfbf7] p-3 rounded-xl border border-[#f3eee7] space-y-1">
                      <p className="font-semibold text-[#8B7355] text-[11px] uppercase tracking-wider">Items Ordered</p>
                      <p className="text-xs font-medium">
                        {order.items && order.items.length > 0
                          ? order.items.map((it) => `${it.qty}x ${it.name}`).join(", ")
                          : "Custom Order"}
                      </p>
                      {order.note && (
                        <p className="text-[11px] italic text-[#8B7355] mt-1">Note: "{order.note}"</p>
                      )}
                    </div>

                    {/* Payment & Total */}
                    <div className="flex items-center justify-between pt-1 border-t border-[#f3eee7]">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        order.paymentMethod === 'upi'
                          ? 'bg-violet-50 text-violet-700 border border-violet-200'
                          : order.paymentMethod === 'card'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-[#f3eee7] text-[#8B7355] border border-[#e8dfd5]'
                      }`}>
                        {order.paymentMethod === 'upi' ? '⚡ UPI' : order.paymentMethod === 'card' ? '💳 Card' : '💵 Cash'}
                      </span>
                      <span className="text-sm font-bold text-[#2C1810]">
                        {rupee(order.total || 0)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
