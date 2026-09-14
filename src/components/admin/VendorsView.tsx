import { Truck } from "lucide-react";
import SuppliersTab from "./inventory/SuppliersTab";

export default function VendorsView() {
  return (
    <div className="h-full flex flex-col bg-[#FDFBF7] font-['Jost',sans-serif]">
      {/* Header */}
      <div className="p-6 pb-0 shrink-0">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-[#2C1810]">Vendors</h2>
            <p className="text-[#8B7355] text-sm mt-1">Manage your suppliers</p>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden p-6 pt-2">
        <SuppliersTab />
      </div>
    </div>
  );
}
