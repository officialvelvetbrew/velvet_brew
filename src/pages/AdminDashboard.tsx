import { useEffect, useState, useCallback } from "react";
import { fetchOrders, updateOrderStatus } from "../services/ordersApi";
import { getMenu } from "../api/menu";

import type { Order, OrderStatus } from "../types";
import AdminSidebar from "../components/admin/AdminSidebar";
import PosBillingView from "../components/admin/PosBillingView";
import OrderCenterView from "../components/admin/OrderCenterView";
import MenuPricingView from "../components/admin/MenuPricingView";
import OffersView from "../components/admin/OffersView";
import CustomersView from "../components/admin/CustomersView";

import InventoryView from "../components/admin/inventory/InventoryView";
import VendorsView from "../components/admin/VendorsView";
import ReportsView from "../components/admin/ReportsView";

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [activeView, setActiveView] = useState<"pos" | "orders" | "menu" | "inventory" | "vendors" | "reports" | "offers" | "customers">("orders");
  const [loading, setLoading] = useState(true);

  // ... (keep load logic) ...
  const load = useCallback(async () => {
    try {
      const [data, apiItems] = await Promise.all([
        fetchOrders(),
        getMenu().catch((err) => {
          console.error("Error fetching menu in admin", err);
          return [];
        }),
      ]);

      setMenuItems(apiItems);

      setOrders(data);
    } catch (err) {
      console.error("Admin dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const onUpdate = () => load();
    window.addEventListener("vb-orders-updated", onUpdate);
    window.addEventListener("storage", onUpdate);
    const poll = setInterval(load, 4000);
    return () => {
      window.removeEventListener("vb-orders-updated", onUpdate);
      window.removeEventListener("storage", onUpdate);
      clearInterval(poll);
    };
  }, [load]);

  const handleStatusChange = async (id: string, status: OrderStatus) => {
    const order = orders.find((o) => o.id === id);
    if (!order) return;
    const updated = { ...order, status };
    setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
    await updateOrderStatus(updated);
  };



  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FDFBF7]">
        <p className="text-[#8B7355] font-bold">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#FDFBF7] font-['Jost',sans-serif]">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed md:static inset-y-0 left-0 z-50 transform transition-transform duration-300 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 flex`}>
        <AdminSidebar 
          activeView={activeView} 
          onChangeView={(v) => { setActiveView(v); setIsMobileMenuOpen(false); }} 
        />
      </div>

      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0 relative">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between bg-[#2C1810] text-[#fdfbf7] p-4 shrink-0 shadow-md relative z-30">
          <div className="flex items-center gap-3">
             <button onClick={() => setIsMobileMenuOpen(true)} className="p-1 hover:bg-[#8B7355]/20 rounded-lg transition-colors">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
             </button>
             <h1 className="font-display font-bold text-sm tracking-widest uppercase">Velvet Brew</h1>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden relative">
          {activeView === "pos" ? (
            <PosBillingView items={menuItems} />
          ) : activeView === "menu" ? (
            <MenuPricingView />
          ) : activeView === "offers" ? (
            <OffersView />
          ) : activeView === "customers" ? (
            <CustomersView />
          ) : activeView === "inventory" ? (
            <InventoryView />
          ) : activeView === "vendors" ? (
            <VendorsView />
          ) : activeView === "reports" ? (
            <ReportsView orders={orders} />
          ) : (
            <OrderCenterView 
              orders={orders} 
              onStatusChange={handleStatusChange} 
              onOrderUpdated={load}
            />
          )}
        </div>
      </div>
    </div>
  );
}
