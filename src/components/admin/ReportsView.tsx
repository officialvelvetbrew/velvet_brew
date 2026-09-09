import { useState } from "react";
import { Bell, Store, TrendingUp, ShoppingBag, Star, Download } from "lucide-react";
import type { Order } from "../../types";
import { rupee } from "../../utils/currency";

interface ReportsViewProps {
  orders: Order[];
}

export default function ReportsView({ orders }: ReportsViewProps) {
  const [activeTab, setActiveTab] = useState<"daily" | "weekly" | "monthly" | "yearly">("daily");

  const todayOrders = orders; 
  const netSales = todayOrders.reduce((sum, o) => sum + o.total, 0) || 3871;
  const numOrders = todayOrders.length || 13;
  const avgOrderValue = numOrders > 0 ? Math.round(netSales / numOrders) : 298;
  
  // Payment mix (Cash vs Online)
  let cashTotal = 0;
  let onlineTotal = 0;
  
  if (todayOrders.length > 0) {
     todayOrders.forEach(o => {
       if (o.paymentMethod?.toLowerCase() === "cash") {
         cashTotal += o.total;
       } else {
         onlineTotal += o.total;
       }
     });
  } else {
    // Mock data based on screenshot
    cashTotal = 732;
    onlineTotal = 2043 + 796 + 300; 
  }
  
  const totalPayments = cashTotal + onlineTotal || 1;
  const cashPct = Math.round((cashTotal / totalPayments) * 100);
  const onlinePct = Math.round((onlineTotal / totalPayments) * 100);

  // Top items logic
  const itemCounts = new Map<string, { qty: number; revenue: number }>();
  todayOrders.forEach(o => {
    o.items.forEach(item => {
      const existing = itemCounts.get(item.name) || { qty: 0, revenue: 0 };
      itemCounts.set(item.name, {
        qty: existing.qty + item.qty,
        revenue: existing.revenue + (item.price * item.qty)
      });
    });
  });
  const topItems = Array.from(itemCounts.entries())
    .map(([name, data]) => ({ name, qty: data.qty, revenue: data.revenue }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 6);
    
  if (topItems.length === 0) {
    topItems.push(
      { name: "Oreo Shake", qty: 3, revenue: 407 },
      { name: "Velvet Brew Cold Coffee", qty: 3, revenue: 357 },
      { name: "Cappuccino", qty: 3, revenue: 267 },
      { name: "Cheesy Fries", qty: 3, revenue: 297 },
      { name: "Classic Cold Coffee", qty: 3, revenue: 297 },
      { name: "Peri Peri Fries", qty: 2, revenue: 233 }
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#FDFBF7] font-['Jost',sans-serif] overflow-y-auto vb-scrollbar">
      {/* Top Header */}
      <div className="flex items-center justify-between p-6 pb-4 border-b border-[#e8dfd5]">
        <div>
          <h1 className="text-2xl font-bold text-[#2C1810]">Reports</h1>
          <p className="text-[#8B7355] text-sm">Velvet Brew · Flagship</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-red-50 text-red-600 px-3 py-1.5 rounded-full text-xs font-semibold border border-red-100">
            3 low stock
          </div>
          <button className="p-2 border border-[#e8dfd5] rounded-full text-[#8B7355] hover:bg-gray-50">
            <Bell size={16} />
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 border border-[#e8dfd5] rounded-lg text-sm font-semibold text-[#2C1810] hover:bg-gray-50">
            <Store size={16} />
            View store
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 border border-[#e8dfd5] rounded-lg text-sm font-semibold text-[#2C1810]">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            Store open
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Date Tabs */}
        <div className="flex items-center justify-between">
          <div className="flex items-center bg-white border border-[#e8dfd5] rounded-full p-1">
             {["Daily", "Weekly", "Monthly", "Yearly"].map(tab => {
               const id = tab.toLowerCase() as any;
               const isActive = activeTab === id;
               return (
                 <button
                   key={tab}
                   onClick={() => setActiveTab(id)}
                   className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${isActive ? "bg-[#D4AF37] text-[#2C1810]" : "text-[#8B7355] hover:text-[#2C1810]"}`}
                 >
                   {tab} Reports
                 </button>
               )
             })}
          </div>
          <div className="flex items-center gap-2 bg-white border border-[#e8dfd5] rounded-full p-1">
             <button className="p-1.5 text-[#8B7355] hover:text-[#2C1810]">{'<'}</button>
             <div className="flex items-center gap-2 px-2 text-sm font-semibold text-[#2C1810]">
               <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#8B7355]"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
               Today - 09 Sept 2026
               <span className="bg-[#FDFBF7] border border-[#D4AF37] text-[#8B7355] text-[10px] px-1.5 py-0.5 rounded ml-1">IN PROGRESS</span>
             </div>
             <button className="p-1.5 text-[#8B7355] hover:text-[#2C1810]">{'>'}</button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-[#D4AF37] rounded-2xl p-5 shadow-sm text-[#2C1810] relative overflow-hidden flex flex-col justify-between">
             <div className="text-[11px] font-bold tracking-widest uppercase opacity-80 mb-2">Net Sales · Day</div>
             <div>
               <div className="text-3xl font-bold mb-1">{rupee(netSales)}</div>
               <div className="text-xs font-semibold flex items-center gap-1 opacity-80">
                 <span>▲ 103.6%</span> vs previous day
               </div>
             </div>
             <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/10 flex items-center justify-center">₹</div>
          </div>
          <div className="bg-white border border-[#e8dfd5] rounded-2xl p-5 shadow-sm relative flex flex-col justify-between">
             <div className="text-[11px] font-bold tracking-widest uppercase text-[#8B7355] mb-2">Orders</div>
             <div>
               <div className="text-3xl font-bold text-[#2C1810] mb-1">{numOrders}</div>
               <div className="text-xs font-semibold flex items-center gap-1 text-[#8B7355]">
                 <span className="text-[#8B7355]">▲ 62.5%</span> vs previous day
               </div>
             </div>
             <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 text-[#8B7355] flex items-center justify-center">
               <ShoppingBag size={14} />
             </div>
          </div>
          <div className="bg-white border border-[#e8dfd5] rounded-2xl p-5 shadow-sm relative flex flex-col justify-between">
             <div className="text-[11px] font-bold tracking-widest uppercase text-[#8B7355] mb-2">Average Order Value</div>
             <div>
               <div className="text-3xl font-bold text-[#2C1810] mb-1">{rupee(avgOrderValue)}</div>
               <div className="text-xs font-semibold flex items-center gap-1 text-[#8B7355]">
                 <span className="text-[#8B7355]">▲ 25.3%</span> vs previous day
               </div>
             </div>
             <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 text-[#8B7355] flex items-center justify-center">
               <TrendingUp size={14} />
             </div>
          </div>
          <div className="bg-[#2C1810] rounded-2xl p-5 shadow-sm text-[#fdfbf7] relative flex flex-col justify-between">
             <div className="text-[11px] font-bold tracking-widest uppercase opacity-80 mb-2 text-[#D4AF37]">Avg. Rating</div>
             <div>
               <div className="text-3xl font-bold mb-1 flex items-baseline gap-1">4.6 <Star size={20} className="fill-current text-[#D4AF37]"/></div>
               <div className="text-xs opacity-60">
                 31 items · 1 rejected
               </div>
             </div>
             <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
               <Star size={14} />
             </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 bg-white border border-[#e8dfd5] rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[#8B7355]">
                  <TrendingUp size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-[#2C1810]">Sales through the day</h3>
                  <p className="text-xs text-[#8B7355]">Today · 09 Sept 2026</p>
                </div>
              </div>
              <div className="text-xs font-bold text-[#8B7355] bg-gray-50 px-3 py-1 rounded-full border border-[#e8dfd5]">
                Daily
              </div>
            </div>
            {/* Mock Line Chart */}
            <div className="h-64 relative w-full border-b border-l border-[#e8dfd5] pb-6 pl-8">
              <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[10px] text-[#8B7355] font-semibold py-4 -ml-2">
                <span>₹1.4K</span>
                <span>₹1.1K</span>
                <span>₹700</span>
                <span>₹350</span>
                <span>₹0</span>
              </div>
              <div className="absolute bottom-0 left-8 w-full flex justify-between text-[10px] text-[#8B7355] font-semibold pr-4 pt-2 -mb-2">
                <span>08:00</span>
                <span>10:00</span>
                <span>12:00</span>
                <span>14:00</span>
                <span>16:00</span>
                <span>18:00</span>
                <span>20:00</span>
                <span>22:00</span>
              </div>
              
              <div className="w-full h-full relative">
                {/* Horizontal grid lines */}
                <div className="absolute top-[20%] w-full border-b border-dashed border-[#e8dfd5]"></div>
                <div className="absolute top-[40%] w-full border-b border-dashed border-[#e8dfd5]"></div>
                <div className="absolute top-[60%] w-full border-b border-dashed border-[#e8dfd5]"></div>
                <div className="absolute top-[80%] w-full border-b border-dashed border-[#e8dfd5]"></div>
                
                {/* SVG Curve */}
                <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                  <path d="M 0,80 Q 5,95 10,95 T 20,20 T 30,90 L 100,90" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M 0,100 L 0,80 Q 5,95 10,95 T 20,20 T 30,90 L 100,90 L 100,100 Z" fill="rgba(212,175,55,0.1)"/>
                </svg>
              </div>
            </div>
          </div>
          
          <div className="col-span-1 bg-white border border-[#e8dfd5] rounded-2xl p-6 shadow-sm flex flex-col">
            <h3 className="font-bold text-[#2C1810]">Revenue by channel</h3>
            <p className="text-xs text-[#8B7355] mb-8">Across this day</p>
            <div className="flex-1 flex flex-col items-center justify-center">
              {/* CSS Donut Chart */}
              <div className="relative w-48 h-48 rounded-full mb-8" style={{ background: "conic-gradient(#5C3A21 0% 33%, #D4AF37 33% 80%, #E8D399 80% 100%)" }}>
                 <div className="absolute inset-0 m-auto w-32 h-32 bg-white rounded-full"></div>
                 {/* Gap lines */}
                 <div className="absolute inset-0" style={{ transform: "rotate(33deg)" }}>
                   <div className="w-full h-1 bg-white absolute top-1/2 -translate-y-1/2"></div>
                 </div>
                 <div className="absolute inset-0" style={{ transform: "rotate(80deg)" }}>
                   <div className="w-full h-1 bg-white absolute top-1/2 -translate-y-1/2"></div>
                 </div>
                 <div className="absolute inset-0" style={{ transform: "rotate(0deg)" }}>
                   <div className="w-full h-1 bg-white absolute top-1/2 -translate-y-1/2"></div>
                 </div>
              </div>
              
              <div className="flex items-center gap-4 text-xs font-semibold text-[#2C1810]">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#E8D399]"></div> Dine-in</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#5C3A21]"></div> Takeaway</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#D4AF37]"></div> Delivery</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-2 gap-6">
          {/* Top Selling Items */}
          <div className="bg-white border border-[#e8dfd5] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[#8B7355]">
                <ShoppingBag size={16} />
              </div>
              <div>
                <h3 className="font-bold text-[#2C1810]">Top selling items</h3>
                <p className="text-xs text-[#8B7355]">By units sold this day</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {topItems.map((item, i) => {
                const maxQty = topItems[0].qty;
                const pct = (item.qty / maxQty) * 100;
                return (
                  <div key={i} className="flex items-center gap-4 text-sm font-semibold">
                    <div className="w-6 text-center text-[#8B7355] bg-gray-50 rounded py-1">{i + 1}</div>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-[#2C1810]">{item.name}</span>
                        <span className="text-[#8B7355]">{item.qty} · {rupee(item.revenue)}</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#D4AF37] rounded-full" style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="space-y-6 flex flex-col">
            {/* Revenue by category */}
            <div className="bg-white border border-[#e8dfd5] rounded-2xl p-6 shadow-sm flex-1">
               <div className="flex items-center gap-3 mb-4">
                 <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[#8B7355]">
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>
                 </div>
                 <div>
                   <h3 className="font-bold text-[#2C1810]">Revenue by category</h3>
                   <p className="text-xs text-[#8B7355]">Today's mix</p>
                 </div>
               </div>
               
               <div className="h-40 flex items-end justify-around border-l border-b border-[#e8dfd5] ml-8 pb-0 pt-4 relative">
                  <div className="absolute left-[-32px] top-0 h-full flex flex-col justify-between text-[10px] text-[#8B7355] font-semibold py-2">
                    <span>₹1K</span>
                    <span>₹750</span>
                    <span>₹500</span>
                    <span>₹250</span>
                    <span>₹0</span>
                  </div>
                  {/* Grid lines */}
                  <div className="absolute top-[25%] left-0 w-full border-b border-dashed border-[#e8dfd5]"></div>
                  <div className="absolute top-[50%] left-0 w-full border-b border-dashed border-[#e8dfd5]"></div>
                  <div className="absolute top-[75%] left-0 w-full border-b border-dashed border-[#e8dfd5]"></div>

                  {/* Bars */}
                  <div className="w-12 bg-[#D4AF37] rounded-t-lg z-10 relative" style={{ height: "95%" }}></div>
                  <div className="w-12 bg-[#5C3A21] rounded-t-lg z-10 relative" style={{ height: "90%" }}></div>
                  <div className="w-12 bg-[#E8D399] rounded-t-lg z-10 relative" style={{ height: "65%" }}></div>
                  <div className="w-12 bg-[#8B5A2B] rounded-t-lg z-10 relative" style={{ height: "88%" }}></div>
               </div>
               <div className="flex justify-around ml-8 mt-2 text-[11px] font-bold text-[#2C1810]">
                 <span className="w-12 text-center leading-tight">Hot Coffee</span>
                 <span className="w-12 text-center leading-tight">Cold Coffee</span>
                 <span className="w-12 text-center leading-tight">Shakes</span>
                 <span className="w-12 text-center leading-tight">Café Bites</span>
               </div>
            </div>
            
            {/* Payment mix */}
            <div className="bg-white border border-[#e8dfd5] rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-[#2C1810]">Payment mix</h3>
                  <p className="text-xs text-[#8B7355]">Settled value by method this day</p>
                </div>
                <button className="flex items-center gap-2 bg-[#2C1810] text-[#fdfbf7] px-4 py-2 rounded-xl text-sm font-semibold hover:bg-black transition-colors">
                  <Download size={14} /> Generate daily report
                </button>
              </div>

              <div className="space-y-4 mt-6">
                <div>
                  <div className="flex justify-between text-sm font-bold text-[#2C1810] mb-2">
                    <span>Online</span>
                    <span className="text-[#8B7355] font-normal"><strong className="text-[#2C1810]">{rupee(onlineTotal)}</strong> {onlinePct}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#D4AF37] rounded-full" style={{ width: `${onlinePct}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm font-bold text-[#2C1810] mb-2">
                    <span>Cash</span>
                    <span className="text-[#8B7355] font-normal"><strong className="text-[#2C1810]">{rupee(cashTotal)}</strong> {cashPct}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#5C3A21] rounded-full" style={{ width: `${cashPct}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="pb-10"></div>
      </div>
    </div>
  );
}
