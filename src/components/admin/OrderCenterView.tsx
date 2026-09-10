import { useState, useMemo } from "react";
import { Clock3, Store, UtensilsCrossed, X, Check, PackageCheck } from "lucide-react";
import { rupee } from "../../utils/currency";
import type { Order, OrderStatus } from "../../types";

const FILTERS: Array<"All" | OrderStatus> = [
  "All",
  "Pending",
  "Accepted",
  "Preparing",
  "Ready",
  "Completed",
  "Rejected",
];

const NEXT_LABEL: Record<string, string> = {
  Pending: "Accept order",
  Accepted: "Start preparing",
  Preparing: "Mark ready",
  Ready: "Complete",
};

const NEXT_STATUS: Record<string, OrderStatus> = {
  Pending: "Accepted",
  Accepted: "Preparing",
  Preparing: "Ready",
  Ready: "Completed",
};

interface OrderCenterViewProps {
  orders: Order[];
  onStatusChange: (id: string, status: OrderStatus) => void;
}

export default function OrderCenterView({
  orders,
  onStatusChange,
}: OrderCenterViewProps) {
  const [filter, setFilter] = useState<"All" | OrderStatus>("All");


  const live = orders.filter((o) => !["Completed", "Rejected"].includes(o.status));
  const visible = filter === "All" ? orders : orders.filter((o) => o.status === filter);

  const getAgeMins = (dateStr: any) => {
    let d: Date;
    if (typeof dateStr === "object" && dateStr !== null) {
      if (dateStr._seconds) d = new Date(dateStr._seconds * 1000);
      else if (dateStr.seconds) d = new Date(dateStr.seconds * 1000);
      else d = new Date();
    } else {
      let str = String(dateStr);
      if (!str.includes("Z") && !str.includes("+")) {
        str += "Z";
      }
      d = new Date(str);
    }
    if (isNaN(d.getTime())) return 0;
    const ms = Date.now() - d.getTime();
    return Math.max(0, Math.floor(ms / 60000));
  };

  const formatAge = (mins: number) => {
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${hrs} hr ${m} min ago` : `${hrs} hr ago`;
  };

  const getOldestText = (status: OrderStatus) => {
    const rows = orders.filter((o) => o.status === status);
    if (rows.length === 0) return null;
    const oldest = Math.max(...rows.map((r) => getAgeMins(r.createdAt)));
    return formatAge(oldest);
  };

  const count = (f: "All" | OrderStatus) => {
    if (f === "All") return orders.length;
    return orders.filter((o) => o.status === f).length;
  };

  const advance = (order: Order) => {
    const next = NEXT_STATUS[order.status];
    if (next) {
      onStatusChange(order.id, next);
    }
  };

  return (
    <div className="flex-1 p-4 md:p-6 h-full overflow-y-auto bg-[#FDFBF7] vb-scrollbar pb-24 md:pb-6">
      <div className="max-w-6xl space-y-6">
        
        {/* Stats Strip */}
        <div className="grid grid-cols-2 gap-3 md:gap-4 sm:grid-cols-4">
          {(["Pending", "Accepted", "Preparing", "Ready"] as OrderStatus[]).map((s) => {
            const rows = orders.filter((o) => o.status === s);
            const oldestText = getOldestText(s);
            const isActive = filter === s;
            
            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`rounded-2xl border p-4 text-left transition-all ${
                  isActive
                    ? "border-[#2C1810] bg-[#2C1810] text-[#fdfbf7] shadow-sm"
                    : "border-[#e8dfd5] bg-white hover:border-[#d4c5b0]"
                }`}
              >
                <p className={`text-[11px] font-bold uppercase tracking-wider ${
                  isActive ? "text-[#fdfbf7]/70" : "text-[#8B7355]"
                }`}>
                  {s}
                </p>
                <p className="mt-1.5 font-display text-3xl font-bold leading-none">{rows.length}</p>
                {rows.length > 0 && (
                  <p className={`mt-1.5 text-[11.5px] ${
                    isActive ? "text-[#fdfbf7]/60" : "text-[#8B7355]"
                  }`}>
                    Oldest {oldestText}
                  </p>
                )}
              </button>
            );
          })}
        </div>

        {/* Tabs & Live Count */}
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => {
              const active = filter === f;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[12px] font-bold transition-colors ${
                    active
                      ? "bg-[#D4AF37] text-[#2C1810]"
                      : "border border-[#e8dfd5] bg-white text-[#8B7355] hover:bg-[#e8dfd5]/30"
                  }`}
                >
                  {f}
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                    active ? "bg-[#2C1810]/10" : "bg-[#e8dfd5]"
                  }`}>
                    {count(f)}
                  </span>
                </button>
              );
            })}
          </div>
          
          <div className="flex items-center gap-1.5 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1.5 text-[12px] font-bold text-[#8B7355]">
            <Clock3 className="h-3.5 w-3.5" />
            {live.length} live on the board
          </div>
        </div>

        {/* Grid */}
        {visible.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-[16px] font-bold text-[#2C1810]">Nothing here right now</p>
            <p className="text-[13px] text-[#8B7355] mt-1">New orders will appear the moment a customer checks out.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((order) => {
              const mins = getAgeMins(order.createdAt);
              const stale = mins > 12 && !["Completed", "Rejected"].includes(order.status);
              const done = ["Completed", "Rejected"].includes(order.status);
              const Icon = order.mode === "Dine-in" ? UtensilsCrossed : Store;

              return (
                <article
                  key={order.id}
                  className={`flex flex-col overflow-hidden rounded-3xl border bg-white shadow-sm transition-all ${
                    order.status === "Pending"
                      ? "border-[#D4AF37]/50"
                      : stale
                      ? "border-red-400/50"
                      : "border-[#e8dfd5]"
                  }`}
                >
                  <header
                    className={`flex items-start justify-between gap-3 px-5 py-4 ${
                      order.status === "Pending" ? "bg-[#D4AF37]/10" : "bg-[#fdfbf7]"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-[16px] font-bold text-[#2C1810]">
                          #{order.id.slice(-5).toUpperCase()}
                        </h3>
                        <span className="rounded-md bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#8B7355] border border-[#e8dfd5]">
                          {order.status}
                        </span>
                      </div>
                      <p className="mt-1 text-[13.5px] font-bold text-[#2C1810] truncate">
                        {order.customerName || "Walk-in Guest"}
                      </p>
                      {order.phone && (
                        <p className="mt-0.5 text-[11.5px] font-medium text-[#8B7355] truncate">
                          {order.phone}
                        </p>
                      )}
                      <p className="mt-0.5 flex items-center gap-1.5 text-[11.5px] font-medium text-[#8B7355]">
                        <Icon className="h-3 w-3" />
                        {order.mode}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-bold tabular-nums whitespace-nowrap ${
                        stale ? "bg-red-50 text-red-600" : "bg-white border border-[#e8dfd5] text-[#2C1810]"
                      }`}
                    >
                      {formatAge(mins)}
                    </span>
                  </header>

                  <div className="flex-1 px-5 py-4">
                    <div className="space-y-2.5">
                      {order.items.map((l, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <span className="grid h-[22px] min-w-[22px] shrink-0 place-items-center rounded bg-[#2C1810] text-[11px] font-bold text-[#fdfbf7]">
                            {l.qty}
                          </span>
                          <div className="min-w-0 flex-1 flex justify-between items-center gap-2">
                            <p className="truncate text-[13px] font-bold text-[#2C1810]">
                              {l.name}
                            </p>
                            <p className="text-[13px] font-bold text-[#8B7355] whitespace-nowrap">
                              {rupee(l.price * l.qty)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {order.note && (
                      <p className="mt-4 rounded-xl bg-[#fdfbf7] border border-[#e8dfd5] px-3 py-2.5 text-[12px] font-medium text-[#8B7355]">
                        {order.note}
                      </p>
                    )}
                  </div>

                  <footer className="border-t border-[#e8dfd5] px-5 py-4 bg-[#fdfbf7]/50">
                    <div className="flex flex-col gap-4">
                      <div className="flex justify-between items-center">
                        <p className="font-display text-[18px] font-bold text-[#2C1810]">
                          {rupee(order.total)}
                        </p>
                        <span 
                          className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider bg-green-100 text-green-700"
                        >
                          {order.paymentMethod === "upi" || order.paymentMethod === "card" ? "UPI/CARD" : "CASH"}
                        </span>
                      </div>

                      <div className="flex shrink-0 gap-2">
                        {!done && (
                          <button 
                            onClick={() => advance(order)}
                            className="flex-[2] flex items-center justify-center gap-1.5 rounded-xl bg-[#D4AF37] px-3 py-2.5 text-[12px] font-bold text-[#2C1810] hover:bg-[#c4a130] transition-colors"
                          >
                            {order.status === "Ready" || order.status === "Preparing" ? (
                              <PackageCheck className="h-4 w-4" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                            {NEXT_LABEL[order.status] || "Advance"}
                          </button>
                        )}
                        {order.status === "Pending" && (
                          <button
                            onClick={() => onStatusChange(order.id, "Rejected")}
                            className="flex shrink-0 items-center justify-center rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-colors w-10"
                            title="Reject Order"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </footer>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

