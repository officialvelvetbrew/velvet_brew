import { useState, useEffect, useMemo } from "react";
import { Users, IndianRupee, Search } from "lucide-react";
import { fetchCustomers } from "../../services/ordersApi";
import { rupee } from "../../utils/currency";
import CustomerManageModal from "./CustomerManageModal";

export default function CustomersView() {
  const [data, setData] = useState<{
    totalCustomers: number;
    lifetimeRevenue: number;
    customers: any[];
  }>({ totalCustomers: 0, lifetimeRevenue: 0, customers: [] });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  useEffect(() => {
    fetchCustomers().then(res => {
      setData(res || { totalCustomers: 0, lifetimeRevenue: 0, customers: [] });
      setLoading(false);
    }).catch(err => {
      console.error("Failed to load customers view:", err);
      setLoading(false);
    });
  }, []);

  const customers = data.customers || [];

  const filteredCustomers = useMemo(() => {
    if (!searchQuery) return customers;
    const q = searchQuery.toLowerCase();
    return customers.filter(c => 
      (c.fullName || "").toLowerCase().includes(q) || 
      (c.mobile || "").toLowerCase().includes(q)
    );
  }, [customers, searchQuery]);

  const totalCustomers = data.totalCustomers || customers.length;
  const lifetimeRevenue = data.lifetimeRevenue || customers.reduce((sum, c) => sum + (c.lifetimeSpend || 0), 0);

  const formatAge = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    // Backend sends UTC timestamps without Z suffix — force UTC parsing
    const utcStr = dateStr.endsWith("Z") || dateStr.includes("+") ? dateStr : dateStr + "Z";
    const d = new Date(utcStr);
    const ms = Date.now() - d.getTime();
    const mins = Math.max(0, Math.floor(ms / 60000));
    
    if (mins < 60) return mins === 0 ? "just now" : `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hr ago`;
    const days = Math.floor(hrs / 24);
    if (days === 1) return `1d ago`;
    return `${days}d ago`;
  };

  const getInitials = (name: string) => {
    if (name === "Unknown" || !name) return "?";
    const parts = name.split(" ").filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#FDFBF7]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2C1810] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-6 h-full overflow-y-auto bg-[#FDFBF7] vb-scrollbar">
      <div className="max-w-6xl space-y-6">
        
        {/* Header Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm border border-[#f3eee7] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#8B7355]">Customers</p>
              <div className="h-8 w-8 rounded-full bg-[#fdfbf7] flex items-center justify-center text-[#8B7355] border border-[#f3eee7]">
                <Users size={16} />
              </div>
            </div>
            <p className="text-3xl font-bold text-[#2C1810] mt-4">{totalCustomers}</p>
          </div>

          <div className="rounded-2xl bg-[#1A0F0A] p-5 shadow-sm border border-[#2C1810] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#D4AF37]">Lifetime Revenue</p>
              <div className="h-8 w-8 rounded-full bg-[#2C1810] flex items-center justify-center text-[#D4AF37]">
                <IndianRupee size={16} />
              </div>
            </div>
            <p className="text-3xl font-bold text-white mt-4">{rupee(lifetimeRevenue)}</p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B7355]" size={18} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or mobile..."
              className="h-12 w-full rounded-2xl border border-[#e8dfd5] pl-11 pr-4 text-[14px] outline-none transition-colors focus:border-[#d4c5b0] bg-white placeholder:text-[#8B7355]/50"
            />
          </div>
        </div>

        {/* Data Grid */}
        <div className="rounded-2xl border border-[#e8dfd5] bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-[#fdfbf7] text-[#8B7355]">
                <tr>
                  <th className="px-5 py-4 font-bold uppercase tracking-wider text-[11px]">Customer</th>
                  <th className="px-5 py-4 font-bold uppercase tracking-wider text-[11px] text-right">Lifetime Spend</th>
                  <th className="px-5 py-4 font-bold uppercase tracking-wider text-[11px] text-center">Visits</th>
                  <th className="px-5 py-4 font-bold uppercase tracking-wider text-[11px]">Last Visit</th>
                  <th className="px-5 py-4 font-bold uppercase tracking-wider text-[11px] text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3eee7]">
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((c) => (
                    <tr key={c.id || c.mobile} className="hover:bg-[#fdfbf7] transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 shrink-0 rounded-full bg-[#E8DFD5] text-[#8B7355] flex items-center justify-center font-bold text-[14px]">
                            {getInitials(c.fullName)}
                          </div>
                          <div>
                            <p className="font-bold text-[#2C1810] text-[14px]">{c.fullName || "Unknown"}</p>
                            <p className="text-[#8B7355] text-[12px]">{c.mobile || "No Mobile"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="font-bold text-[#2C1810]">{rupee(c.lifetimeSpend || 0)}</span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="text-[#8B7355]">{c.totalVisits || 0}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-[#8B7355]">{formatAge(c.lastVisit)}</span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => setSelectedCustomer(c)}
                          className="rounded-lg border border-[#e8dfd5] px-4 py-1.5 text-[12px] font-semibold text-[#2C1810] hover:bg-[#f3eee7] transition-colors"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-[#8B7355]">
                      {searchQuery ? "No customers found matching your search." : "No customer data available."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {selectedCustomer && (
        <CustomerManageModal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
    </div>
  );
}
