import { useState } from "react";
import { Package, Tags, Truck, ArrowRightLeft, LayoutDashboard } from "lucide-react";
import CategoriesTab from "./CategoriesTab";
import SuppliersTab from "./SuppliersTab";
import ItemsTab from "./ItemsTab";
import MovementsTab from "./MovementsTab";
import DashboardTab from "./DashboardTab";

export default function InventoryView() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "items" | "categories" | "movements">("dashboard");

  return (
    <div className="h-full flex flex-col bg-[#FDFBF7] font-['Jost',sans-serif]">
      {/* Header */}
      <div className="p-6 pb-0 shrink-0">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-[#2C1810]">Inventory</h2>
            <p className="text-[#8B7355] text-sm mt-1">Manage stock, suppliers, and categories</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-[#e8dfd5] overflow-x-auto vb-scrollbar pb-px">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-semibold whitespace-nowrap transition-colors ${
              activeTab === "dashboard"
                ? "border-[#2C1810] text-[#2C1810]"
                : "border-transparent text-[#8B7355] hover:text-[#2C1810] hover:border-[#8B7355]/30"
            }`}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab("items")}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-semibold whitespace-nowrap transition-colors ${
              activeTab === "items"
                ? "border-[#2C1810] text-[#2C1810]"
                : "border-transparent text-[#8B7355] hover:text-[#2C1810] hover:border-[#8B7355]/30"
            }`}
          >
            <Package size={18} />
            Items
          </button>
          <button
            onClick={() => setActiveTab("categories")}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-semibold whitespace-nowrap transition-colors ${
              activeTab === "categories"
                ? "border-[#2C1810] text-[#2C1810]"
                : "border-transparent text-[#8B7355] hover:text-[#2C1810] hover:border-[#8B7355]/30"
            }`}
          >
            <Tags size={18} />
            Categories
          </button>

          <button
            onClick={() => setActiveTab("movements")}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-semibold whitespace-nowrap transition-colors ${
              activeTab === "movements"
                ? "border-[#2C1810] text-[#2C1810]"
                : "border-transparent text-[#8B7355] hover:text-[#2C1810] hover:border-[#8B7355]/30"
            }`}
          >
            <ArrowRightLeft size={18} />
            Movements
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden p-6">
        {activeTab === "dashboard" && <DashboardTab />}
        {activeTab === "items" && <ItemsTab />}
        {activeTab === "categories" && <CategoriesTab />}

        {activeTab === "movements" && <MovementsTab />}
      </div>
    </div>
  );
}
