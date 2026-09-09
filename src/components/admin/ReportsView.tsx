import { useState, useMemo } from "react";
import { Bell, Store, TrendingUp, ShoppingBag, Star, Download } from "lucide-react";
import type { Order } from "../../types";
import { rupee } from "../../utils/currency";

interface ReportsViewProps {
  orders: Order[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

function isSameDay(dateA: Date, dateB: Date) {
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
}

function parseOrderDate(raw: any): Date {
  if (!raw) return new Date(0);
  if (typeof raw === "object" && raw !== null) {
    if (raw._seconds) return new Date(raw._seconds * 1000);
    if (raw.seconds) return new Date(raw.seconds * 1000);
  }
  let s = String(raw);
  if (!s.includes("Z") && !s.includes("+")) s += "Z";
  const d = new Date(s);
  return isNaN(d.getTime()) ? new Date(0) : d;
}

// ── Component ───────────────────────────────────────────────────────────────

export default function ReportsView({ orders }: ReportsViewProps) {
  const [activeTab, setActiveTab] = useState<"daily" | "weekly" | "monthly" | "yearly">("daily");

  const now = new Date();
  const todayLabel = now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  // ── Filter orders by time window ─────────────────────────────────────────
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const d = parseOrderDate(o.createdAt);
      if (activeTab === "daily") return isSameDay(d, now);
      if (activeTab === "weekly") {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        return d >= startOfWeek;
      }
      if (activeTab === "monthly") {
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      }
      // yearly
      return d.getFullYear() === now.getFullYear();
    });
  }, [orders, activeTab]);

  // ── KPIs ─────────────────────────────────────────────────────────────────
  const netSales = filteredOrders.reduce((s, o) => s + (o.total || 0), 0);
  const numOrders = filteredOrders.length;
  const avgOrderValue = numOrders > 0 ? Math.round(netSales / numOrders) : 0;

  // ── Payment mix (cod = cash, upi/card = online) ───────────────────────────
  let cashTotal = 0;
  let onlineTotal = 0;
  filteredOrders.forEach((o) => {
    const pm = (o.paymentMethod || "").toLowerCase();
    if (pm === "cod" || pm === "cash") {
      cashTotal += o.total || 0;
    } else {
      onlineTotal += o.total || 0;
    }
  });
  const totalPayments = cashTotal + onlineTotal || 1;
  const cashPct = Math.round((cashTotal / totalPayments) * 100);
  const onlinePct = 100 - cashPct;

  // ── Mode mix (Dine-in vs Takeaway) ───────────────────────────────────────
  let dineInTotal = 0;
  let takeawayTotal = 0;
  filteredOrders.forEach((o) => {
    if ((o.mode || "").toLowerCase().includes("dine")) dineInTotal += o.total || 0;
    else takeawayTotal += o.total || 0;
  });
  const modeTotalRev = dineInTotal + takeawayTotal || 1;
  const dineInPct = Math.round((dineInTotal / modeTotalRev) * 100);
  const takeawayPct = 100 - dineInPct;

  // ── Category revenue ──────────────────────────────────────────────────────
  const categoryRevenue: Record<string, number> = { hot: 0, cold: 0, shakes: 0, bites: 0 };
  filteredOrders.forEach((o) => {
    o.items.forEach((item) => {
      const cat = (item.category || "hot") as keyof typeof categoryRevenue;
      if (cat in categoryRevenue) categoryRevenue[cat] += item.price * item.qty;
    });
  });
  const maxCatRev = Math.max(...Object.values(categoryRevenue), 1);

  // ── Top items ─────────────────────────────────────────────────────────────
  const itemCounts = new Map<string, { qty: number; revenue: number }>();
  filteredOrders.forEach((o) => {
    o.items.forEach((item) => {
      const existing = itemCounts.get(item.name) || { qty: 0, revenue: 0 };
      itemCounts.set(item.name, {
        qty: existing.qty + item.qty,
        revenue: existing.revenue + item.price * item.qty,
      });
    });
  });
  const topItems = Array.from(itemCounts.entries())
    .map(([name, data]) => ({ name, qty: data.qty, revenue: data.revenue }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 6);

  // ── Hourly revenue for line chart (6am – 10pm) ───────────────────────────
  const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 6..22
  const hourlyRev: Record<number, number> = {};
  HOURS.forEach((h) => (hourlyRev[h] = 0));
  if (activeTab === "daily") {
    filteredOrders.forEach((o) => {
      const d = parseOrderDate(o.createdAt);
      const h = d.getHours();
      if (h >= 6 && h <= 22) hourlyRev[h] = (hourlyRev[h] || 0) + (o.total || 0);
    });
  }
  const maxHourlyRev = Math.max(...Object.values(hourlyRev), 1);

  // Build SVG polyline points (viewBox 0 0 100 60)
  const svgPoints = HOURS.map((h, i) => {
    const x = (i / (HOURS.length - 1)) * 100;
    const y = 60 - (hourlyRev[h] / maxHourlyRev) * 55;
    return `${x},${y}`;
  }).join(" ");
  const svgFill = `0,60 ${svgPoints} 100,60`;

  // ── Donut conic gradient for mode ─────────────────────────────────────────
  const conicStyle = {
    background: `conic-gradient(#5C3A21 0% ${takeawayPct}%, #D4AF37 ${takeawayPct}% ${takeawayPct + dineInPct}%, #E8D399 ${takeawayPct + dineInPct}% 100%)`,
  } as React.CSSProperties;

  // ── Tab label ─────────────────────────────────────────────────────────────
  const tabLabel = activeTab === "daily" ? `Today — ${todayLabel}` :
    activeTab === "weekly" ? "This Week" :
    activeTab === "monthly" ? now.toLocaleDateString("en-IN", { month: "long", year: "numeric" }) :
    String(now.getFullYear());

  const isEmpty = filteredOrders.length === 0;

  return (
    <div className="h-full flex flex-col bg-[#FDFBF7] font-['Jost',sans-serif] overflow-y-auto vb-scrollbar">
      {/* Top Header */}
      <div className="flex items-center justify-between p-6 pb-4 border-b border-[#e8dfd5]">
        <div>
          <h1 className="text-2xl font-bold text-[#2C1810]">Reports</h1>
          <p className="text-[#8B7355] text-sm">Velvet Brew · Flagship</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 border border-[#e8dfd5] rounded-full text-[#8B7355] hover:bg-gray-50">
            <Bell size={16} />
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 border border-[#e8dfd5] rounded-lg text-sm font-semibold text-[#2C1810] hover:bg-gray-50">
            <Store size={16} />
            View store
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 border border-[#e8dfd5] rounded-lg text-sm font-semibold text-[#2C1810]">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            Store open
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Tab Selector */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center bg-white border border-[#e8dfd5] rounded-full p-1">
            {(["Daily", "Weekly", "Monthly", "Yearly"] as const).map((tab) => {
              const id = tab.toLowerCase() as typeof activeTab;
              const isActive = activeTab === id;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(id)}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                    isActive ? "bg-[#D4AF37] text-[#2C1810]" : "text-[#8B7355] hover:text-[#2C1810]"
                  }`}
                >
                  {tab} Reports
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 bg-white border border-[#e8dfd5] rounded-full px-4 py-2 text-sm font-semibold text-[#2C1810]">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#8B7355]"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            {tabLabel}
            {activeTab === "daily" && (
              <span className="bg-[#FDFBF7] border border-[#D4AF37] text-[#8B7355] text-[10px] px-1.5 py-0.5 rounded ml-1">
                {now.getHours() < 22 ? "IN PROGRESS" : "DONE"}
              </span>
            )}
          </div>
        </div>

        {/* No data banner */}
        {isEmpty && (
          <div className="rounded-2xl border border-[#e8dfd5] bg-white p-6 text-center text-[#8B7355] text-sm font-semibold">
            No orders found for this period. Data will appear as orders come in.
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#D4AF37] rounded-2xl p-5 shadow-sm text-[#2C1810] relative overflow-hidden flex flex-col justify-between">
            <div className="text-[11px] font-bold tracking-widest uppercase opacity-80 mb-2">Net Sales</div>
            <div>
              <div className="text-3xl font-bold mb-1">{rupee(netSales)}</div>
              <div className="text-xs font-semibold opacity-70">{numOrders} orders total</div>
            </div>
            <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/10 flex items-center justify-center">₹</div>
          </div>

          <div className="bg-white border border-[#e8dfd5] rounded-2xl p-5 shadow-sm relative flex flex-col justify-between">
            <div className="text-[11px] font-bold tracking-widest uppercase text-[#8B7355] mb-2">Orders</div>
            <div>
              <div className="text-3xl font-bold text-[#2C1810] mb-1">{numOrders}</div>
              <div className="text-xs font-semibold text-[#8B7355]">
                {filteredOrders.filter(o => o.status === "Completed").length} completed
              </div>
            </div>
            <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 text-[#8B7355] flex items-center justify-center">
              <ShoppingBag size={14} />
            </div>
          </div>

          <div className="bg-white border border-[#e8dfd5] rounded-2xl p-5 shadow-sm relative flex flex-col justify-between">
            <div className="text-[11px] font-bold tracking-widest uppercase text-[#8B7355] mb-2">Avg Order Value</div>
            <div>
              <div className="text-3xl font-bold text-[#2C1810] mb-1">{rupee(avgOrderValue)}</div>
              <div className="text-xs font-semibold text-[#8B7355]">per order</div>
            </div>
            <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 text-[#8B7355] flex items-center justify-center">
              <TrendingUp size={14} />
            </div>
          </div>

          <div className="bg-[#2C1810] rounded-2xl p-5 shadow-sm text-[#fdfbf7] relative flex flex-col justify-between">
            <div className="text-[11px] font-bold tracking-widest uppercase opacity-80 mb-2 text-[#D4AF37]">Rejected</div>
            <div>
              <div className="text-3xl font-bold mb-1">
                {filteredOrders.filter(o => o.status === "Rejected").length}
              </div>
              <div className="text-xs opacity-60">
                {filteredOrders.filter(o => o.status === "Pending").length} still pending
              </div>
            </div>
            <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <Star size={14} />
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Hourly / Time chart */}
          <div className="lg:col-span-2 bg-white border border-[#e8dfd5] rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[#8B7355]">
                  <TrendingUp size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-[#2C1810]">
                    {activeTab === "daily" ? "Sales through the day" : "Sales trend"}
                  </h3>
                  <p className="text-xs text-[#8B7355]">{tabLabel}</p>
                </div>
              </div>
              <div className="text-xs font-bold text-[#8B7355] bg-gray-50 px-3 py-1 rounded-full border border-[#e8dfd5] capitalize">
                {activeTab}
              </div>
            </div>

            {activeTab === "daily" ? (
              <div className="h-56 relative w-full">
                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[10px] text-[#8B7355] font-semibold py-1 w-10">
                  {[maxHourlyRev, Math.round(maxHourlyRev * 0.75), Math.round(maxHourlyRev * 0.5), Math.round(maxHourlyRev * 0.25), 0].map((v, i) => (
                    <span key={i}>{v >= 1000 ? `₹${(v / 1000).toFixed(1)}K` : `₹${v}`}</span>
                  ))}
                </div>

                {/* Chart area */}
                <div className="absolute left-10 right-0 top-0 bottom-5 border-b border-l border-[#e8dfd5]">
                  {/* Grid lines */}
                  {[25, 50, 75].map(pct => (
                    <div key={pct} className="absolute w-full border-b border-dashed border-[#e8dfd5]" style={{ top: `${pct}%` }} />
                  ))}

                  {/* Real SVG chart */}
                  <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 60">
                    <defs>
                      <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.02" />
                      </linearGradient>
                    </defs>
                    <polygon points={svgFill} fill="url(#chartGrad)" />
                    <polyline points={svgPoints} fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    {/* Dots on data points */}
                    {HOURS.map((h, i) => {
                      if (hourlyRev[h] === 0) return null;
                      const x = (i / (HOURS.length - 1)) * 100;
                      const y = 60 - (hourlyRev[h] / maxHourlyRev) * 55;
                      return <circle key={h} cx={x} cy={y} r="1.5" fill="#D4AF37" />;
                    })}
                  </svg>
                </div>

                {/* X-axis labels */}
                <div className="absolute left-10 right-0 bottom-0 flex justify-between text-[9px] text-[#8B7355] font-semibold">
                  {HOURS.filter((_, i) => i % 2 === 0).map(h => (
                    <span key={h}>{h}:00</span>
                  ))}
                </div>
              </div>
            ) : (
              /* Weekly/Monthly/Yearly: show bar chart grouped by orders */
              <div className="h-56 flex items-end gap-1 border-b border-l border-[#e8dfd5] px-2 pb-0">
                {filteredOrders.length === 0 ? (
                  <p className="text-xs text-[#8B7355] m-auto">No data for this period.</p>
                ) : (
                  (() => {
                    // Group by day
                    const dayMap = new Map<string, number>();
                    filteredOrders.forEach(o => {
                      const d = parseOrderDate(o.createdAt);
                      const key = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
                      dayMap.set(key, (dayMap.get(key) || 0) + (o.total || 0));
                    });
                    const entries = Array.from(dayMap.entries()).slice(-14);
                    const max = Math.max(...entries.map(([, v]) => v), 1);
                    return entries.map(([label, val]) => (
                      <div key={label} className="flex-1 flex flex-col items-center gap-1 group">
                        <div
                          className="w-full bg-[#D4AF37] rounded-t-md transition-all group-hover:bg-[#c4a130]"
                          style={{ height: `${(val / max) * 100}%`, minHeight: val > 0 ? "4px" : "0" }}
                          title={`${label}: ${rupee(val)}`}
                        />
                        <span className="text-[8px] text-[#8B7355] font-semibold">{label.split(" ")[0]}</span>
                      </div>
                    ));
                  })()
                )}
              </div>
            )}
          </div>

          {/* Mode donut */}
          <div className="bg-white border border-[#e8dfd5] rounded-2xl p-6 shadow-sm flex flex-col">
            <h3 className="font-bold text-[#2C1810]">Revenue by mode</h3>
            <p className="text-xs text-[#8B7355] mb-6">Dine-in vs Takeaway</p>
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="relative w-40 h-40 rounded-full mb-6" style={conicStyle}>
                <div className="absolute inset-0 m-auto w-24 h-24 bg-white rounded-full flex flex-col items-center justify-center">
                  <span className="text-xs font-bold text-[#2C1810]">{rupee(modeTotalRev)}</span>
                  <span className="text-[9px] text-[#8B7355]">total</span>
                </div>
              </div>
              <div className="space-y-2 w-full">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#5C3A21]" />Takeaway</div>
                  <span className="text-[#8B7355]">{takeawayPct}% · {rupee(takeawayTotal)}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />Dine-in</div>
                  <span className="text-[#8B7355]">{dineInPct}% · {rupee(dineInTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Selling Items */}
          <div className="bg-white border border-[#e8dfd5] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[#8B7355]">
                <ShoppingBag size={16} />
              </div>
              <div>
                <h3 className="font-bold text-[#2C1810]">Top selling items</h3>
                <p className="text-xs text-[#8B7355]">By units sold</p>
              </div>
            </div>

            {topItems.length === 0 ? (
              <p className="text-xs text-[#8B7355] text-center py-6 italic">No items data for this period.</p>
            ) : (
              <div className="space-y-4">
                {topItems.map((item, i) => {
                  const maxQty = topItems[0].qty;
                  const pct = (item.qty / maxQty) * 100;
                  return (
                    <div key={i} className="flex items-center gap-4 text-sm font-semibold">
                      <div className="w-6 text-center text-[#8B7355] bg-gray-50 rounded py-1 text-xs">{i + 1}</div>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-[#2C1810] truncate max-w-[160px]">{item.name}</span>
                          <span className="text-[#8B7355] text-xs shrink-0">{item.qty} sold · {rupee(item.revenue)}</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-[#D4AF37] rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-6 flex flex-col">
            {/* Category revenue bar chart */}
            <div className="bg-white border border-[#e8dfd5] rounded-2xl p-6 shadow-sm flex-1">
              <h3 className="font-bold text-[#2C1810] mb-1">Revenue by category</h3>
              <p className="text-xs text-[#8B7355] mb-4">Real breakdown</p>

              <div className="h-36 flex items-end gap-3 border-b border-l border-[#e8dfd5] px-2 pb-0 pt-4 relative">
                <div className="absolute left-[-2px] top-0 h-full flex flex-col justify-between text-[10px] text-[#8B7355] font-semibold py-2">
                  <span>{maxCatRev >= 1000 ? `₹${(maxCatRev/1000).toFixed(1)}K` : `₹${maxCatRev}`}</span>
                  <span>{Math.round(maxCatRev/2) >= 1000 ? `₹${(Math.round(maxCatRev/2)/1000).toFixed(1)}K` : `₹${Math.round(maxCatRev/2)}`}</span>
                  <span>₹0</span>
                </div>
                {[
                  { key: "hot", label: "Hot", color: "#D4AF37" },
                  { key: "cold", label: "Cold", color: "#5C3A21" },
                  { key: "shakes", label: "Shakes", color: "#E8D399" },
                  { key: "bites", label: "Bites", color: "#8B5A2B" },
                ].map(({ key, label, color }) => {
                  const val = categoryRevenue[key] || 0;
                  const pct = (val / maxCatRev) * 100;
                  return (
                    <div key={key} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t-md transition-all"
                        style={{ height: `${pct}%`, background: color, minHeight: val > 0 ? "4px" : "0" }}
                        title={`${label}: ${rupee(val)}`}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-around mt-2 text-[11px] font-bold text-[#2C1810]">
                {[
                  { key: "hot", label: "Hot Coffee", color: "#D4AF37" },
                  { key: "cold", label: "Cold", color: "#5C3A21" },
                  { key: "shakes", label: "Shakes", color: "#E8D399" },
                  { key: "bites", label: "Bites", color: "#8B5A2B" },
                ].map(({ key, label, color }) => (
                  <div key={key} className="flex flex-col items-center gap-1">
                    <span className="text-[9px] text-center leading-tight text-[#2C1810]">{label}</span>
                    <span className="text-[9px] font-normal text-[#8B7355]">{rupee(categoryRevenue[key] || 0)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment mix */}
            <div className="bg-white border border-[#e8dfd5] rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-[#2C1810]">Payment mix</h3>
                  <p className="text-xs text-[#8B7355]">Online vs Cash</p>
                </div>
                <button
                  className="flex items-center gap-2 bg-[#2C1810] text-[#fdfbf7] px-3 py-2 rounded-xl text-xs font-semibold hover:bg-black transition-colors"
                  onClick={() => {
                    const csv = [
                      "Metric,Value",
                      `Net Sales,${netSales}`,
                      `Orders,${numOrders}`,
                      `Avg Order Value,${avgOrderValue}`,
                      `Online Revenue,${onlineTotal}`,
                      `Cash Revenue,${cashTotal}`,
                    ].join("\n");
                    const blob = new Blob([csv], { type: "text/csv" });
                    const a = document.createElement("a");
                    a.href = URL.createObjectURL(blob);
                    a.download = `velvetbrew_report_${activeTab}_${now.toISOString().slice(0,10)}.csv`;
                    a.click();
                  }}
                >
                  <Download size={13} /> Export CSV
                </button>
              </div>

              <div className="space-y-4 mt-2">
                <div>
                  <div className="flex justify-between text-sm font-bold text-[#2C1810] mb-2">
                    <span>Online (UPI / Card)</span>
                    <span className="text-[#8B7355] font-normal"><strong className="text-[#2C1810]">{rupee(onlineTotal)}</strong> {onlinePct}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#D4AF37] rounded-full transition-all" style={{ width: `${onlinePct}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm font-bold text-[#2C1810] mb-2">
                    <span>Cash (COD)</span>
                    <span className="text-[#8B7355] font-normal"><strong className="text-[#2C1810]">{rupee(cashTotal)}</strong> {cashPct}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#5C3A21] rounded-full transition-all" style={{ width: `${cashPct}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pb-10" />
      </div>
    </div>
  );
}
