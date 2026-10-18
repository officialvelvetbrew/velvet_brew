import { useState, useMemo } from "react";
import { Bell, Store, TrendingUp, ShoppingBag, Star, Download, Printer, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
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

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// ── Component ───────────────────────────────────────────────────────────────

export default function ReportsView({ orders }: ReportsViewProps) {
  const [activeTab, setActiveTab] = useState<"daily" | "weekly" | "monthly" | "yearly">("daily");
  const now = useMemo(() => new Date(), []);

  // ── Daily state ──
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });

  const selectedDateObj = useMemo(() => {
    if (!selectedDate) return now;
    const [y, m, d] = selectedDate.split("-").map(Number);
    return new Date(y, m - 1, d);
  }, [selectedDate, now]);

  const isSelectedToday = isSameDay(selectedDateObj, now);

  const selectedDateLabel = selectedDateObj.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  // ── Weekly state ──
  const [selectedWeekDate, setSelectedWeekDate] = useState<string>(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });

  const selectedWeekRange = useMemo(() => {
    const d = new Date(selectedWeekDate + "T00:00:00");
    const validD = isNaN(d.getTime()) ? new Date(now) : d;
    const day = validD.getDay(); // 0 = Sun, 1 = Mon ...
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const start = new Date(validD.getFullYear(), validD.getMonth(), validD.getDate() + diffToMonday, 0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }, [selectedWeekDate, now]);

  const thisWeekRange = useMemo(() => {
    const day = now.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday, 0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }, [now]);

  const isThisWeek = useMemo(() => {
    return selectedWeekRange.start.getTime() === thisWeekRange.start.getTime();
  }, [selectedWeekRange, thisWeekRange]);

  const weekLabel = useMemo(() => {
    const startStr = selectedWeekRange.start.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
    const endStr = selectedWeekRange.end.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    return `${startStr} – ${endStr}`;
  }, [selectedWeekRange]);

  const handlePrevWeek = () => {
    const cur = new Date(selectedWeekDate + "T00:00:00");
    cur.setDate(cur.getDate() - 7);
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, "0");
    const d = String(cur.getDate()).padStart(2, "0");
    setSelectedWeekDate(`${y}-${m}-${d}`);
  };

  const handleNextWeek = () => {
    const cur = new Date(selectedWeekDate + "T00:00:00");
    cur.setDate(cur.getDate() + 7);
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, "0");
    const d = String(cur.getDate()).padStart(2, "0");
    setSelectedWeekDate(`${y}-${m}-${d}`);
  };

  const handleResetThisWeek = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    setSelectedWeekDate(`${y}-${m}-${day}`);
  };

  // ── Monthly state ──
  const [selectedMonth, setSelectedMonth] = useState<number>(() => now.getMonth());
  const [selectedMonthYear, setSelectedMonthYear] = useState<number>(() => now.getFullYear());

  const isThisMonth = selectedMonth === now.getMonth() && selectedMonthYear === now.getFullYear();
  const monthLabel = `${MONTH_NAMES[selectedMonth]} ${selectedMonthYear}`;

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedMonthYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedMonthYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const handleResetThisMonth = () => {
    setSelectedMonth(now.getMonth());
    setSelectedMonthYear(now.getFullYear());
  };

  // ── Yearly state ──
  const [selectedYear, setSelectedYear] = useState<number>(() => now.getFullYear());
  const isThisYear = selectedYear === now.getFullYear();
  const yearLabel = String(selectedYear);

  const YEAR_OPTIONS = useMemo(() => {
    const curY = now.getFullYear();
    const list: number[] = [];
    for (let y = curY - 5; y <= curY + 2; y++) {
      list.push(y);
    }
    return list;
  }, [now]);

  // ── Filter orders by time window ─────────────────────────────────────────
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const d = parseOrderDate(o.createdAt);
      if (activeTab === "daily") return isSameDay(d, selectedDateObj);
      if (activeTab === "weekly") {
        return d >= selectedWeekRange.start && d <= selectedWeekRange.end;
      }
      if (activeTab === "monthly") {
        return d.getFullYear() === selectedMonthYear && d.getMonth() === selectedMonth;
      }
      // yearly
      return d.getFullYear() === selectedYear;
    });
  }, [orders, activeTab, selectedDateObj, selectedWeekRange, selectedMonth, selectedMonthYear, selectedYear]);

  // ── Filter completed orders for revenue calculations ──────────────────────
  const completedOrders = useMemo(() => {
    return filteredOrders.filter(o => (o.status || "").toLowerCase() === "completed" && o.paid === true);
  }, [filteredOrders]);

  // ── KPIs ─────────────────────────────────────────────────────────────────
  const netSales = completedOrders.reduce((s, o) => s + (o.total || 0), 0);
  const numOrders = filteredOrders.length;
  const numCompleted = completedOrders.length;
  const avgOrderValue = numCompleted > 0 ? Math.round(netSales / numCompleted) : 0;

  // ── Payment mix (cod = cash, upi/card = online) ───────────────────────────
  let cashTotal = 0;
  let onlineTotal = 0;
  completedOrders.forEach((o) => {
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
  completedOrders.forEach((o) => {
    if ((o.mode || "").toLowerCase().includes("dine")) dineInTotal += o.total || 0;
    else takeawayTotal += o.total || 0;
  });
  const modeTotalRev = dineInTotal + takeawayTotal || 1;
  const dineInPct = Math.round((dineInTotal / modeTotalRev) * 100);
  const takeawayPct = 100 - dineInPct;

  // ── Category revenue ──────────────────────────────────────────────────────
  const categoryRevenue: Record<string, number> = { hot: 0, cold: 0, shakes: 0, bites: 0 };
  completedOrders.forEach((o) => {
    o.items.forEach((item) => {
      const cat = (item.category || "hot") as keyof typeof categoryRevenue;
      if (cat in categoryRevenue) categoryRevenue[cat] += item.price * item.qty;
    });
  });
  const maxCatRev = Math.max(...Object.values(categoryRevenue), 1);

  // ── Top items ─────────────────────────────────────────────────────────────
  const itemCounts = new Map<string, { qty: number; revenue: number }>();
  completedOrders.forEach((o) => {
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
    completedOrders.forEach((o) => {
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
  const tabLabel = activeTab === "daily" ? (isSelectedToday ? `Today — ${selectedDateLabel}` : selectedDateLabel) :
    activeTab === "weekly" ? (isThisWeek ? `This Week (${weekLabel})` : weekLabel) :
    activeTab === "monthly" ? monthLabel :
    yearLabel;

  const isEmpty = filteredOrders.length === 0;

  // ── High Quality Visual Report Generator (PDF / Print / Printable HTML) ───
  const handleExportVisualReport = (autoPrint: boolean = false) => {
    const reportTitle = `Velvet Brew · ${activeTab.toUpperCase()} REPORT`;
    const periodLabel = activeTab === "daily" ? (isSelectedToday ? `Today (${selectedDateLabel})` : selectedDateLabel) : tabLabel;
    
    // Top items rows
    const topItemsRows = topItems.map((item, idx) => `
      <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid #f0ebe4; font-size:13px;">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="display:inline-block; width:22px; height:22px; line-height:22px; text-align:center; background:#f4ede4; color:#8B7355; border-radius:4px; font-weight:700; font-size:11px;">#${idx + 1}</span>
          <span style="color:#2C1810; font-weight:600;">${item.name}</span>
        </div>
        <div style="text-align:right;">
          <strong style="color:#2C1810;">₹${item.revenue.toLocaleString("en-IN")}</strong>
          <span style="color:#8B7355; font-size:11px; margin-left:6px;">(${item.qty} units)</span>
        </div>
      </div>
    `).join("") || '<p style="color:#8B7355; font-size:13px; font-style:italic;">No items data available.</p>';

    // Categories breakdown bars
    const catKeys = [
      { key: "hot", label: "Hot Coffee", color: "#D4AF37" },
      { key: "cold", label: "Cold Brews", color: "#5C3A21" },
      { key: "shakes", label: "Shakes", color: "#C69C2B" },
      { key: "bites", label: "Bites & Snacks", color: "#8B5A2B" },
    ];
    const catRows = catKeys.map(({ key, label, color }) => {
      const rev = categoryRevenue[key] || 0;
      const pct = netSales > 0 ? Math.round((rev / netSales) * 100) : 0;
      return `
        <div style="margin-bottom:12px;">
          <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:600; color:#2C1810; margin-bottom:4px;">
            <span><span style="display:inline-block; width:10px; height:10px; background:${color}; border-radius:2px; margin-right:6px;"></span>${label}</span>
            <span>₹${rev.toLocaleString("en-IN")} <span style="color:#8B7355; font-weight:normal;">(${pct}%)</span></span>
          </div>
          <div style="width:100%; height:8px; background:#f4ede4; border-radius:99px; overflow:hidden;">
            <div style="width:${pct}%; height:100%; background:${color}; border-radius:99px;"></div>
          </div>
        </div>
      `;
    }).join("");

    // Hourly bar chart in visual format
    const hourlyBars = HOURS.map((h) => {
      const val = hourlyRev[h] || 0;
      const pct = maxHourlyRev > 0 ? (val / maxHourlyRev) * 100 : 0;
      return `
        <div style="flex:1; display:flex; flex-direction:column; align-items:center; height:120px; justify-content:flex-end;">
          <div style="font-size:9px; color:#8B7355; margin-bottom:2px; font-weight:600;">${val > 0 ? `₹${val}` : ""}</div>
          <div style="width:100%; max-width:18px; height:${Math.max(pct, val > 0 ? 6 : 2)}%; background:${val > 0 ? "#D4AF37" : "#eee7de"}; border-radius:4px 4px 0 0;"></div>
          <div style="font-size:9px; color:#8B7355; margin-top:4px; font-weight:600;">${h}</div>
        </div>
      `;
    }).join("");

    const printHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${reportTitle} - ${periodLabel}</title>
        <meta charset="utf-8"/>
        <link href="https://fonts.googleapis.com/css2?family=Jost:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Jost', sans-serif; }
          body { background: #FDFBF7; color: #2C1810; padding: 32px; }
          .container { max-width: 900px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #E8DFD5; padding: 32px; box-shadow: 0 4px 20px rgba(0,0,0,0.04); }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #F0EBE4; padding-bottom: 20px; margin-bottom: 24px; }
          .logo { font-size: 24px; font-weight: 800; color: #2C1810; letter-spacing: 1px; }
          .logo span { color: #D4AF37; }
          .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 28px; }
          .kpi-card { background: #FDFBF7; border: 1px solid #E8DFD5; border-radius: 12px; padding: 16px; }
          .kpi-card.gold { background: #D4AF37; color: #2C1810; border-color: #D4AF37; }
          .kpi-card.dark { background: #2C1810; color: #FDFBF7; border-color: #2C1810; }
          .kpi-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.8; margin-bottom: 6px; }
          .kpi-value { font-size: 26px; font-weight: 800; margin-bottom: 4px; }
          .kpi-sub { font-size: 11px; opacity: 0.7; font-weight: 600; }
          .card { background: #ffffff; border: 1px solid #E8DFD5; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
          .card-title { font-size: 15px; font-weight: 700; color: #2C1810; margin-bottom: 2px; }
          .card-sub { font-size: 11px; color: #8B7355; margin-bottom: 16px; }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
          .print-bar { display: flex; justify-content: flex-end; gap: 10px; margin-bottom: 16px; }
          .btn { background: #2C1810; color: #fff; padding: 8px 16px; border-radius: 8px; border: none; font-size: 13px; font-weight: 600; cursor: pointer; }
          .btn-gold { background: #D4AF37; color: #2C1810; }
          @media print {
            .no-print { display: none !important; }
            body { padding: 0; background: #fff; }
            .container { border: none; box-shadow: none; padding: 12px; }
          }
        </style>
      </head>
      <body>
        <div class="no-print print-bar">
          <button class="btn btn-gold" onclick="window.print()">🖨️ Print / Save as PDF</button>
          <button class="btn" onclick="window.close()">Close Window</button>
        </div>

        <div class="container">
          <div class="header">
            <div>
              <div class="logo">VELVET <span>BREW</span></div>
              <p style="font-size:12px; color:#8B7355; margin-top:3px;">Flagship Café · Operations & Analytics Report</p>
            </div>
            <div style="text-align:right;">
              <h2 style="font-size:18px; font-weight:700; color:#2C1810;">${reportTitle}</h2>
              <p style="font-size:12px; color:#8B7355; margin-top:2px;">Period: <strong>${periodLabel}</strong></p>
              <p style="font-size:11px; color:#A4907C; margin-top:2px;">Generated: ${new Date().toLocaleTimeString("en-IN")}, ${new Date().toLocaleDateString("en-IN")}</p>
            </div>
          </div>

          <!-- KPI Summary -->
          <div class="kpi-grid">
            <div class="kpi-card gold">
              <div class="kpi-title">Net Sales</div>
              <div class="kpi-value">₹${netSales.toLocaleString("en-IN")}</div>
              <div class="kpi-sub">${numCompleted} orders paid</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-title">Total Orders</div>
              <div class="kpi-value">${numOrders}</div>
              <div class="kpi-sub">${numCompleted} completed</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-title">Avg Order Value</div>
              <div class="kpi-value">₹${avgOrderValue.toLocaleString("en-IN")}</div>
              <div class="kpi-sub">per completed order</div>
            </div>
            <div class="kpi-card dark">
              <div class="kpi-title" style="color:#D4AF37;">Payment Breakdown</div>
              <div class="kpi-value" style="font-size:20px;">Cash: ${cashPct}%</div>
              <div class="kpi-sub" style="color:#e8dfd5;">Online: ${onlinePct}% · ₹${onlineTotal.toLocaleString("en-IN")}</div>
            </div>
          </div>

          <!-- Hourly Sales Distribution Chart (Daily) -->
          ${activeTab === "daily" ? `
            <div class="card">
              <div class="card-title">Hourly Sales Activity (6:00 AM – 10:00 PM)</div>
              <div class="card-sub">Real distribution of revenue generated by hour</div>
              <div style="display:flex; align-items:flex-end; gap:6px; border-bottom:1px solid #E8DFD5; padding-bottom:8px;">
                ${hourlyBars}
              </div>
            </div>
          ` : ""}

          <!-- 2 Columns: Top Selling Items + Category & Mode Mix -->
          <div class="grid-2">
            <div class="card" style="margin-bottom:0;">
              <div class="card-title">Top Selling Items</div>
              <div class="card-sub">Ranked by unit volume & revenue</div>
              <div>${topItemsRows}</div>
            </div>

            <div class="card" style="margin-bottom:0;">
              <div class="card-title">Category Revenue Split</div>
              <div class="card-sub">Sales breakdown across food & beverages</div>
              <div>${catRows}</div>

              <div style="margin-top:20px; padding-top:16px; border-top:1px dashed #E8DFD5;">
                <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:700; color:#2C1810; margin-bottom:6px;">
                  <span>Mode: Dine-in vs Takeaway</span>
                  <span>Takeaway ${takeawayPct}% · Dine-in ${dineInPct}%</span>
                </div>
                <div style="display:flex; height:8px; border-radius:99px; overflow:hidden; background:#eee;">
                  <div style="width:${takeawayPct}%; background:#5C3A21;"></div>
                  <div style="width:${dineInPct}%; background:#D4AF37;"></div>
                </div>
                <div style="display:flex; justify-content:space-between; font-size:11px; color:#8B7355; margin-top:4px;">
                  <span>Takeaway: ₹${takeawayTotal.toLocaleString("en-IN")}</span>
                  <span>Dine-in: ₹${dineInTotal.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>
          </div>

          <div style="margin-top:28px; text-align:center; font-size:11px; color:#A4907C; border-top:1px solid #F0EBE4; padding-top:16px;">
            Velvet Brew Point of Sale · Confidential Internal Report
          </div>
        </div>

        <script>
          ${autoPrint ? "window.onload = function() { window.print(); };" : ""}
        </script>
      </body>
      </html>
    `;

    const reportWin = window.open("", "_blank");
    if (reportWin) {
      reportWin.document.open();
      reportWin.document.write(printHtml);
      reportWin.document.close();
    }
  };

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
        {/* Tab Selector & Date Picker */}
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

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExportVisualReport(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#D4AF37] hover:bg-[#c29e2e] text-[#2C1810] rounded-full text-xs font-bold transition-all shadow-sm cursor-pointer"
              title="Download formatted visual report or save as PDF"
            >
              <Printer size={13} />
              <span>Print / PDF Report</span>
            </button>

            {/* Daily Picker */}
            {activeTab === "daily" && (
              <div className="flex items-center gap-1.5 bg-white border border-[#e8dfd5] hover:border-[#D4AF37] transition-all rounded-full px-2.5 py-1.5 shadow-sm text-sm font-semibold text-[#2C1810]">
                <button
                  type="button"
                  onClick={() => {
                    const prevD = new Date(selectedDateObj);
                    prevD.setDate(prevD.getDate() - 1);
                    const y = prevD.getFullYear();
                    const m = String(prevD.getMonth() + 1).padStart(2, "0");
                    const day = String(prevD.getDate()).padStart(2, "0");
                    setSelectedDate(`${y}-${m}-${day}`);
                  }}
                  className="p-1 hover:bg-[#FDFBF7] rounded-full text-[#8B7355] hover:text-[#2C1810] transition-colors cursor-pointer"
                  title="Previous Day"
                >
                  <ChevronLeft size={14} />
                </button>

                <label htmlFor="report-date-picker" className="flex items-center gap-1.5 cursor-pointer select-none">
                  <Calendar size={14} className="text-[#8B7355]" />
                  <span className="font-semibold text-xs sm:text-sm text-[#2C1810]">
                    {isSelectedToday ? `Today (${selectedDateLabel})` : selectedDateLabel}
                  </span>
                </label>

                <input
                  id="report-date-picker"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    if (e.target.value) {
                      setSelectedDate(e.target.value);
                    }
                  }}
                  className="bg-transparent text-xs text-[#2C1810] font-medium border-l border-[#e8dfd5] pl-1.5 outline-none cursor-pointer w-7"
                  title="Select Date"
                />

                <button
                  type="button"
                  onClick={() => {
                    const nextD = new Date(selectedDateObj);
                    nextD.setDate(nextD.getDate() + 1);
                    const y = nextD.getFullYear();
                    const m = String(nextD.getMonth() + 1).padStart(2, "0");
                    const day = String(nextD.getDate()).padStart(2, "0");
                    setSelectedDate(`${y}-${m}-${day}`);
                  }}
                  className="p-1 hover:bg-[#FDFBF7] rounded-full text-[#8B7355] hover:text-[#2C1810] transition-colors cursor-pointer"
                  title="Next Day"
                >
                  <ChevronRight size={14} />
                </button>

                {isSelectedToday ? (
                  <span className="bg-[#FDFBF7] border border-[#D4AF37] text-[#8B7355] text-[10px] px-1.5 py-0.5 rounded font-bold ml-1">
                    {now.getHours() < 22 ? "IN PROGRESS" : "DONE"}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      const year = d.getFullYear();
                      const month = String(d.getMonth() + 1).padStart(2, "0");
                      const day = String(d.getDate()).padStart(2, "0");
                      setSelectedDate(`${year}-${month}-${day}`);
                    }}
                    className="text-[11px] text-[#8B7355] hover:text-[#2C1810] underline font-medium cursor-pointer ml-1 whitespace-nowrap"
                  >
                    Reset Today
                  </button>
                )}
              </div>
            )}

            {/* Weekly Picker */}
            {activeTab === "weekly" && (
              <div className="flex items-center gap-1.5 bg-white border border-[#e8dfd5] hover:border-[#D4AF37] transition-all rounded-full px-2.5 py-1.5 shadow-sm text-sm font-semibold text-[#2C1810]">
                <button
                  type="button"
                  onClick={handlePrevWeek}
                  className="p-1 hover:bg-[#FDFBF7] rounded-full text-[#8B7355] hover:text-[#2C1810] transition-colors cursor-pointer"
                  title="Previous Week"
                >
                  <ChevronLeft size={14} />
                </button>

                <label htmlFor="report-week-picker" className="flex items-center gap-1.5 cursor-pointer select-none">
                  <Calendar size={14} className="text-[#8B7355]" />
                  <span className="font-semibold text-xs sm:text-sm text-[#2C1810]">
                    {isThisWeek ? `This Week (${weekLabel})` : weekLabel}
                  </span>
                </label>

                <input
                  id="report-week-picker"
                  type="date"
                  value={selectedWeekDate}
                  onChange={(e) => {
                    if (e.target.value) {
                      setSelectedWeekDate(e.target.value);
                    }
                  }}
                  className="bg-transparent text-xs text-[#2C1810] font-medium border-l border-[#e8dfd5] pl-1.5 outline-none cursor-pointer w-7"
                  title="Pick any date to view its week"
                />

                <button
                  type="button"
                  onClick={handleNextWeek}
                  className="p-1 hover:bg-[#FDFBF7] rounded-full text-[#8B7355] hover:text-[#2C1810] transition-colors cursor-pointer"
                  title="Next Week"
                >
                  <ChevronRight size={14} />
                </button>

                {!isThisWeek && (
                  <button
                    type="button"
                    onClick={handleResetThisWeek}
                    className="text-[11px] text-[#8B7355] hover:text-[#2C1810] underline font-medium cursor-pointer ml-1 whitespace-nowrap"
                  >
                    This Week
                  </button>
                )}
              </div>
            )}

            {/* Monthly Picker */}
            {activeTab === "monthly" && (
              <div className="flex items-center gap-1.5 bg-white border border-[#e8dfd5] hover:border-[#D4AF37] transition-all rounded-full px-2.5 py-1.5 shadow-sm text-sm font-semibold text-[#2C1810]">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1 hover:bg-[#FDFBF7] rounded-full text-[#8B7355] hover:text-[#2C1810] transition-colors cursor-pointer"
                  title="Previous Month"
                >
                  <ChevronLeft size={14} />
                </button>

                <div className="flex items-center gap-1 px-1">
                  <Calendar size={14} className="text-[#8B7355]" />
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="bg-transparent text-xs sm:text-sm font-semibold text-[#2C1810] outline-none cursor-pointer"
                  >
                    {MONTH_NAMES.map((name, i) => (
                      <option key={i} value={i}>{name}</option>
                    ))}
                  </select>
                  <select
                    value={selectedMonthYear}
                    onChange={(e) => setSelectedMonthYear(Number(e.target.value))}
                    className="bg-transparent text-xs sm:text-sm font-semibold text-[#2C1810] outline-none cursor-pointer"
                  >
                    {YEAR_OPTIONS.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1 hover:bg-[#FDFBF7] rounded-full text-[#8B7355] hover:text-[#2C1810] transition-colors cursor-pointer"
                  title="Next Month"
                >
                  <ChevronRight size={14} />
                </button>

                {!isThisMonth && (
                  <button
                    type="button"
                    onClick={handleResetThisMonth}
                    className="text-[11px] text-[#8B7355] hover:text-[#2C1810] underline font-medium cursor-pointer ml-1 whitespace-nowrap"
                  >
                    This Month
                  </button>
                )}
              </div>
            )}

            {/* Yearly Picker */}
            {activeTab === "yearly" && (
              <div className="flex items-center gap-1.5 bg-white border border-[#e8dfd5] hover:border-[#D4AF37] transition-all rounded-full px-2.5 py-1.5 shadow-sm text-sm font-semibold text-[#2C1810]">
                <button
                  type="button"
                  onClick={() => setSelectedYear((y) => y - 1)}
                  className="p-1 hover:bg-[#FDFBF7] rounded-full text-[#8B7355] hover:text-[#2C1810] transition-colors cursor-pointer"
                  title="Previous Year"
                >
                  <ChevronLeft size={14} />
                </button>

                <div className="flex items-center gap-1.5 px-1">
                  <Calendar size={14} className="text-[#8B7355]" />
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="bg-transparent text-xs sm:text-sm font-semibold text-[#2C1810] outline-none cursor-pointer"
                  >
                    {YEAR_OPTIONS.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedYear((y) => y + 1)}
                  className="p-1 hover:bg-[#FDFBF7] rounded-full text-[#8B7355] hover:text-[#2C1810] transition-colors cursor-pointer"
                  title="Next Year"
                >
                  <ChevronRight size={14} />
                </button>

                {!isThisYear && (
                  <button
                    type="button"
                    onClick={() => setSelectedYear(now.getFullYear())}
                    className="text-[11px] text-[#8B7355] hover:text-[#2C1810] underline font-medium cursor-pointer ml-1 whitespace-nowrap"
                  >
                    This Year
                  </button>
                )}
              </div>
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
              <div className="text-xs font-semibold opacity-70">{numCompleted} orders total</div>
            </div>
            <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/10 flex items-center justify-center">₹</div>
          </div>

          <div className="bg-white border border-[#e8dfd5] rounded-2xl p-5 shadow-sm relative flex flex-col justify-between">
            <div className="text-[11px] font-bold tracking-widest uppercase text-[#8B7355] mb-2">Orders</div>
            <div>
              <div className="text-3xl font-bold text-[#2C1810] mb-1">{numOrders}</div>
              <div className="text-xs font-semibold text-[#8B7355]">
                {numCompleted} completed
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
              /* Weekly/Monthly/Yearly: proper bar chart with y-axis */
              (() => {
                let entries: { key: string; label: string; fullLabel: string; val: number }[] = [];

                if (activeTab === "weekly") {
                  // 7 days of the selected week (Mon..Sun)
                  const cur = new Date(selectedWeekRange.start);
                  for (let i = 0; i < 7; i++) {
                    const dayName = cur.toLocaleDateString("en-IN", { weekday: "short" });
                    const dateNum = cur.getDate();
                    const monthStr = cur.toLocaleDateString("en-IN", { month: "short" });
                    entries.push({
                      key: `w-${i}`,
                      label: `${dayName} ${dateNum}`,
                      fullLabel: `${dayName}, ${dateNum} ${monthStr}`,
                      val: 0,
                    });
                    cur.setDate(cur.getDate() + 1);
                  }
                  completedOrders.forEach((o) => {
                    const d = parseOrderDate(o.createdAt);
                    const diffDays = Math.floor((d.getTime() - selectedWeekRange.start.getTime()) / (24 * 60 * 60 * 1000));
                    if (diffDays >= 0 && diffDays < 7) {
                      entries[diffDays].val += (o.total || 0);
                    }
                  });
                } else if (activeTab === "monthly") {
                  // Days of the selected month
                  const daysInMonth = new Date(selectedMonthYear, selectedMonth + 1, 0).getDate();
                  for (let d = 1; d <= daysInMonth; d++) {
                    entries.push({
                      key: `m-${d}`,
                      label: String(d).padStart(2, "0"),
                      fullLabel: `${d} ${MONTH_NAMES[selectedMonth]} ${selectedMonthYear}`,
                      val: 0,
                    });
                  }
                  completedOrders.forEach((o) => {
                    const d = parseOrderDate(o.createdAt);
                    if (d.getFullYear() === selectedMonthYear && d.getMonth() === selectedMonth) {
                      const dayNum = d.getDate();
                      if (dayNum >= 1 && dayNum <= daysInMonth) {
                        entries[dayNum - 1].val += (o.total || 0);
                      }
                    }
                  });
                } else {
                  // Yearly: 12 months of the selected year
                  for (let m = 0; m < 12; m++) {
                    entries.push({
                      key: `y-${m}`,
                      label: MONTH_NAMES[m].slice(0, 3),
                      fullLabel: `${MONTH_NAMES[m]} ${selectedYear}`,
                      val: 0,
                    });
                  }
                  completedOrders.forEach((o) => {
                    const d = parseOrderDate(o.createdAt);
                    if (d.getFullYear() === selectedYear) {
                      const m = d.getMonth();
                      if (m >= 0 && m < 12) {
                        entries[m].val += (o.total || 0);
                      }
                    }
                  });
                }

                const max = Math.max(...entries.map((e) => e.val), 1);
                const hasAnyData = entries.some((e) => e.val > 0);

                if (!hasAnyData && completedOrders.length === 0) {
                  return <p className="text-xs text-[#8B7355] text-center py-12">No data for this period.</p>;
                }

                return (
                  <div className="flex gap-2 h-48 mt-2">
                    {/* Y-axis */}
                    <div className="flex flex-col justify-between text-[10px] text-[#8B7355] font-semibold py-1 shrink-0 w-10 text-right">
                      <span>{max >= 1000 ? `₹${(max / 1000).toFixed(1)}K` : `₹${max}`}</span>
                      <span>{Math.round(max / 2) >= 1000 ? `₹${(Math.round(max / 2) / 1000).toFixed(1)}K` : `₹${Math.round(max / 2)}`}</span>
                      <span>₹0</span>
                    </div>
                    {/* Bars */}
                    <div className="flex-1 flex items-end gap-1 border-b border-l border-[#e8dfd5] pb-0 pt-2 overflow-x-auto vb-scrollbar">
                      {entries.map((item) => (
                        <div key={item.key} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group min-w-[16px]">
                          <div
                            className="w-full bg-[#D4AF37] rounded-t-md transition-all group-hover:bg-[#c4a130]"
                            style={{ height: `${(item.val / max) * 100}%`, minHeight: item.val > 0 ? "6px" : "0" }}
                            title={`${item.fullLabel}: ${rupee(item.val)}`}
                          />
                          <span className="text-[8px] text-[#8B7355] font-semibold whitespace-nowrap">
                            {item.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()
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

              {/* Y-axis + bars in a proper row layout so labels don't overlap bars */}
              <div className="flex gap-2 h-36">
                {/* Y-axis labels */}
                <div className="flex flex-col justify-between text-[10px] text-[#8B7355] font-semibold py-1 shrink-0 w-10 text-right">
                  <span>{maxCatRev >= 1000 ? `₹${(maxCatRev/1000).toFixed(1)}K` : `₹${maxCatRev}`}</span>
                  <span>{Math.round(maxCatRev/2) >= 1000 ? `₹${(Math.round(maxCatRev/2)/1000).toFixed(1)}K` : `₹${Math.round(maxCatRev/2)}`}</span>
                  <span>₹0</span>
                </div>
                {/* Bars area */}
                <div className="flex-1 flex items-end gap-3 border-b border-l border-[#e8dfd5] pb-0 pt-2">
                  {[
                    { key: "hot", label: "Hot Coffee", color: "#D4AF37" },
                    { key: "cold", label: "Cold", color: "#5C3A21" },
                    { key: "shakes", label: "Shakes", color: "#E8D399" },
                    { key: "bites", label: "Bites", color: "#8B5A2B" },
                  ].map(({ key, label, color }) => {
                    const val = categoryRevenue[key] || 0;
                    const pct = (val / maxCatRev) * 100;
                    return (
                      <div key={key} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                        <div
                          className="w-full rounded-t-md transition-all"
                          style={{ height: `${pct}%`, background: color, minHeight: val > 0 ? "6px" : "0" }}
                          title={`${label}: ${rupee(val)}`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-around mt-2 ml-12 text-[11px] font-bold text-[#2C1810]">
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
                <div className="flex items-center gap-2">
                  <button
                    className="flex items-center gap-1.5 bg-[#D4AF37] text-[#2C1810] px-3 py-2 rounded-xl text-xs font-bold hover:bg-[#c29e2e] transition-colors cursor-pointer shadow-sm"
                    onClick={() => handleExportVisualReport(false)}
                    title="Open print-ready formatted visual dashboard report"
                  >
                    <Printer size={13} /> Visual Report
                  </button>
                  <button
                    className="flex items-center gap-1.5 bg-[#2C1810] text-[#fdfbf7] px-3 py-2 rounded-xl text-xs font-semibold hover:bg-black transition-colors cursor-pointer"
                    onClick={() => {
                      const periodLabel = activeTab === "daily" ? (isSelectedToday ? `Today (${selectedDateLabel})` : selectedDateLabel) : tabLabel;
                      const dateStamp = activeTab === "daily" ? selectedDate :
                        activeTab === "weekly" ? selectedWeekDate :
                        activeTab === "monthly" ? `${selectedMonthYear}-${String(selectedMonth + 1).padStart(2, "0")}` :
                        String(selectedYear);
                      
                      const lines = [
                        `VELVET BREW - DETAILED OPERATIONS & SALES REPORT`,
                        `Report Type,${activeTab.toUpperCase()}`,
                        `Period / Date,${periodLabel}`,
                        `Generated On,"${new Date().toLocaleString("en-IN")}"`,
                        ``,
                        `--- KEY PERFORMANCE INDICATORS (KPIs) ---`,
                        `Metric,Value,Unit / Notes`,
                        `Net Sales,${netSales},INR (Total Completed & Paid)`,
                        `Total Orders Placed,${numOrders},Orders Count`,
                        `Completed Orders,${numCompleted},Orders Count`,
                        `Pending Orders,${filteredOrders.filter(o => (o.status || "").toLowerCase() === "pending").length},Orders Count`,
                        `Rejected Orders,${filteredOrders.filter(o => (o.status || "").toLowerCase() === "rejected").length},Orders Count`,
                        `Average Order Value (AOV),${avgOrderValue},INR per Completed Order`,
                        ``,
                        `--- PAYMENT BREAKDOWN ---`,
                        `Payment Method,Revenue (INR),Percentage`,
                        `Cash (COD),${cashTotal},${cashPct}%`,
                        `Online (UPI / Card),${onlineTotal},${onlinePct}%`,
                        `Total Payment Collected,${cashTotal + onlineTotal},100%`,
                        ``,
                        `--- ORDER MODE MIX ---`,
                        `Mode,Revenue (INR),Share`,
                        `Dine-in,${dineInTotal},${dineInPct}%`,
                        `Takeaway,${takeawayTotal},${takeawayPct}%`,
                        ``,
                        `--- CATEGORY REVENUE BREAKDOWN ---`,
                        `Category,Revenue (INR),Share of Net Sales`,
                        `Hot Coffee,${categoryRevenue.hot || 0},${netSales > 0 ? Math.round(((categoryRevenue.hot || 0)/netSales)*100) : 0}%`,
                        `Cold Brews,${categoryRevenue.cold || 0},${netSales > 0 ? Math.round(((categoryRevenue.cold || 0)/netSales)*100) : 0}%`,
                        `Shakes,${categoryRevenue.shakes || 0},${netSales > 0 ? Math.round(((categoryRevenue.shakes || 0)/netSales)*100) : 0}%`,
                        `Bites & Snacks,${categoryRevenue.bites || 0},${netSales > 0 ? Math.round(((categoryRevenue.bites || 0)/netSales)*100) : 0}%`,
                        ``,
                        `--- TOP SELLING ITEMS (BY UNITS SOLD) ---`,
                        `Rank,Item Name,Units Sold,Total Revenue (INR)`,
                        ...topItems.map((item, idx) => `"#${idx + 1}","${item.name.replace(/"/g, '""')}",${item.qty},${item.revenue}`),
                        ``,
                        `--- HOURLY SALES DISTRIBUTION (6 AM - 10 PM) ---`,
                        `Hour,Sales Revenue (INR),Visual Bar`,
                        ...HOURS.map((h) => {
                          const val = hourlyRev[h] || 0;
                          const bar = "#".repeat(Math.min(Math.round((val / (maxHourlyRev || 1)) * 20), 20));
                          return `"${h}:00",${val},"${bar}"`;
                        }),
                      ];

                      const csv = "\uFEFF" + lines.join("\r\n"); // \uFEFF UTF-8 BOM so Excel opens with proper encoding
                      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                      const a = document.createElement("a");
                      a.href = URL.createObjectURL(blob);
                      a.download = `velvetbrew_detailed_report_${activeTab}_${dateStamp}.csv`;
                      a.click();
                    }}
                  >
                    <Download size={13} /> Detailed CSV
                  </button>
                </div>
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
