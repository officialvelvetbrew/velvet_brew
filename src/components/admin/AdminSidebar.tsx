import {
  Store,
  LayoutDashboard,
  BookOpen,
  Tag,
  Package,
  Truck,
  Users,
  BarChart3,
  Shield,
  LogOut,
} from "lucide-react";
import logo from "../../assets/velvet-brew-logo.jpg";
import { logout, getAuthSession } from "../../services/adminAuth";
import { useNavigate } from "react-router-dom";

interface AdminSidebarProps {
  activeView: "pos" | "orders" | "menu" | "inventory";
  onChangeView: (view: "pos" | "orders" | "menu" | "inventory") => void;
}

export default function AdminSidebar({ activeView, onChangeView }: AdminSidebarProps) {
  const navigate = useNavigate();
  const session = getAuthSession();
  const isAdmin = session?.role === "ADMIN";

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/admin/login", { replace: true });
    } catch (err) {
      console.error("Logout error", err);
    }
  };

  return (
    <aside className="w-64 flex-shrink-0 h-screen flex flex-col bg-gradient-to-b from-[#2C1810] to-[#1A0F0A] text-[#fdfbf7] p-5">
      <div className="flex items-center gap-3 mb-10 mt-2 px-2">
        <img src={logo} alt="Velvet Brew" className="w-10 h-10 rounded-full border border-[#D4AF37]" />
        <div>
          <h1 className="font-display font-bold text-sm tracking-widest text-[#fdfbf7] uppercase">Velvet Brew</h1>
          <p className="text-[10px] uppercase tracking-widest text-[#D4AF37]">Operations</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 vb-scrollbar">
        {/* COUNTER */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#8B7355] mb-3 px-3">
            Counter
          </p>
          <div className="space-y-1">
            <button
              onClick={() => onChangeView("pos")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
                activeView === "pos"
                  ? "bg-[#D4AF37] text-[#2C1810]"
                  : "text-[#fdfbf7] hover:bg-[#8B7355]/20"
              }`}
            >
              <Store size={18} />
              POS Billing
            </button>
            <button
              onClick={() => onChangeView("orders")}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
                activeView === "orders"
                  ? "bg-[#D4AF37] text-[#2C1810]"
                  : "text-[#fdfbf7] hover:bg-[#8B7355]/20"
              }`}
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard size={18} />
                Order Center
              </div>
            </button>
          </div>
        </div>

        {isAdmin && (
          <>
            {/* CATALOGUE */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#8B7355] mb-3 px-3">
                Catalogue
              </p>
              <div className="space-y-1">
                <button
                  onClick={() => onChangeView("menu")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
                    activeView === "menu"
                      ? "bg-[#D4AF37] text-[#2C1810]"
                      : "text-[#fdfbf7] hover:bg-[#8B7355]/20"
                  }`}
                >
                  <BookOpen size={18} />
                  Menu & Pricing
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-[#8B7355] cursor-not-allowed opacity-70">
                  <Tag size={18} />
                  Offers & QR
                </button>
              </div>
            </div>

            {/* OPERATIONS */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#8B7355] mb-3 px-3">
                Operations
              </p>
              <div className="space-y-1">
                <button
                  onClick={() => onChangeView("inventory")}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
                    activeView === "inventory"
                      ? "bg-[#D4AF37] text-[#2C1810]"
                      : "text-[#fdfbf7] hover:bg-[#8B7355]/20"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Package size={18} />
                    Inventory
                  </div>
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-[#8B7355] cursor-not-allowed opacity-70">
                  <Truck size={18} />
                  Vendors & POs
                </button>
              </div>
            </div>

            {/* GROWTH */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#8B7355] mb-3 px-3">
                Growth
              </p>
              <div className="space-y-1">
                <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-[#8B7355] cursor-not-allowed opacity-70">
                  <Users size={18} />
                  Customers
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-[#8B7355] cursor-not-allowed opacity-70">
                  <BarChart3 size={18} />
                  Reports
                </button>
              </div>
            </div>

            {/* ADMINISTRATION */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#8B7355] mb-3 px-3">
                Administration
              </p>
              <div className="space-y-1">
                <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-[#8B7355] cursor-not-allowed opacity-70">
                  <Shield size={18} />
                  Staff & Access
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-[#8B7355]/30 flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#D4AF37] text-[#2C1810] flex items-center justify-center font-bold text-[11px]">
            {session?.fullName?.substring(0, 2).toUpperCase() || (isAdmin ? "AD" : "ST")}
          </div>
          <div>
            <p className="text-[12px] font-bold text-[#fdfbf7] truncate w-32">{session?.fullName || "User"}</p>
            <p className="text-[10px] text-[#8B7355]">{isAdmin ? "Owner · Full Access" : "Staff Member"}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="text-[#8B7355] hover:text-[#fdfbf7] transition-colors">
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
