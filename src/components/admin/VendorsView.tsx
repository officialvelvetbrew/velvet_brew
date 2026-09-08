import { useState } from "react";
import { Truck, FileText } from "lucide-react";
import SuppliersTab from "./inventory/SuppliersTab";

export default function VendorsView() {
  const [activeTab, setActiveTab] = useState<"suppliers" | "purchase_orders">("suppliers");

  return (
    <div className="h-full flex flex-col bg-[#FDFBF7] font-['Jost',sans-serif]">
      {/* Header */}
      <div className="p-6 pb-0 shrink-0">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-[#2C1810]">Vendors & POs</h2>
            <p className="text-[#8B7355] text-sm mt-1">Manage your suppliers and purchase orders</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-[#e8dfd5] overflow-x-auto vb-scrollbar pb-px">
          <button
            onClick={() => setActiveTab("suppliers")}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-semibold whitespace-nowrap transition-colors ${
              activeTab === "suppliers"
                ? "border-[#2C1810] text-[#2C1810]"
                : "border-transparent text-[#8B7355] hover:text-[#2C1810] hover:border-[#8B7355]/30"
            }`}
          >
            <Truck size={18} />
            Suppliers
          </button>
          <button
            onClick={() => setActiveTab("purchase_orders")}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-semibold whitespace-nowrap transition-colors ${
              activeTab === "purchase_orders"
                ? "border-[#2C1810] text-[#2C1810]"
                : "border-transparent text-[#8B7355] hover:text-[#2C1810] hover:border-[#8B7355]/30"
            }`}
          >
            <FileText size={18} />
            Purchase Orders
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden p-6">
        {activeTab === "suppliers" && <SuppliersTab />}
        {activeTab === "purchase_orders" && (
          <div className="flex h-full items-center justify-center border-2 border-dashed border-[#e8dfd5] rounded-xl bg-gray-50/50">
             <p className="text-[#8B7355]">Purchase Orders coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
}
