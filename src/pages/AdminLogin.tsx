import { useState, type FormEvent } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { ArrowLeft, Lock, ShieldCheck, Mail } from 'lucide-react';
import { COLORS } from '../data/colors';
import { useAdminAuth, setAuthSession } from '../services/adminAuth';
import logo from '../assets/velvet-brew-logo.jpg';

const API_BASE = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? "https://api.velvetbrew.in/api/v1" : "/api/v1");

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const { user, isAdmin, loading: authLoading } = useAdminAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center px-4" style={{ background: COLORS.espresso }}>
         <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: COLORS.gold, borderTopColor: 'transparent' }}></div>
      </div>
    );
  }

  // Only auto-redirect if they are fully authenticated AND are an admin/staff.
  if (user && isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    
    setError("");
    setLoading(true);
    
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: email,
          password: password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || "Invalid email or password.");
        setLoading(false);
        return;
      }

      // Check if user has correct role
      const data = result.data || result; // depending on whether response wraps in data
      const role = data.role?.toUpperCase();
      
      if (role !== "ADMIN" && role !== "STAFF") {
        setError("Access denied: You do not have admin/staff privileges.");
        setLoading(false);
        return;
      }

      setAuthSession({
        token: data.token,
        role: data.role,
        fullName: data.fullName,
        email: data.email,
      });

      navigate("/admin", { replace: true });
    } catch (err: any) {
      console.error("Login error", err);
      setError("Failed to log in. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2" style={{ backgroundColor: COLORS.espresso, fontFamily: "'Jost', sans-serif" }}>
      {/* Left panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden p-12 lg:flex">
        {/* Background effects */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\\'20\\' height=\\'20\\' viewBox=\\'0 0 20 20\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cg fill=\\'%23cca556\\' fill-opacity=\\'1\\' fill-rule=\\'evenodd\\'%3E%3Ccircle cx=\\'3\\' cy=\\'3\\' r=\\'1\\'/%3E%3Ccircle cx=\\'13\\' cy=\\'13\\' r=\\'1\\'/%3E%3C/g%3E%3C/svg%3E')" }} />
        <div className="pointer-events-none absolute -left-24 top-1/3 h-96 w-96 rounded-full blur-3xl" style={{ backgroundColor: "rgba(253, 251, 247, 0.04)" }} />

        <div className="relative">
          <img src={logo} alt="Velvet Brew" className="w-16 h-16 rounded-full object-cover" style={{ border: `1.5px solid ${COLORS.gold}` }} />
        </div>

        <div className="relative max-w-md text-white z-10">
          <h1 className="font-bold leading-tight text-4xl mb-4" style={{ fontFamily: "'Jost', sans-serif", color: COLORS.cream }}>
            The counter, the kitchen and the books — on one screen.
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-white/60">
            Velvet Brew's operations console: fast billing, a live order board, recipe-linked
            inventory and daily reporting that closes itself.
          </p>

          <div className="mt-8 grid gap-4">
            {[
              ['Split bills & table service', 'Dine-in, takeaway and delivery in one till'],
              ['Recipe-linked stock', 'Every cappuccino deducts beans and milk automatically'],
              ['Live analytics', 'Net sales, AOV and top movers, refreshed as you sell'],
            ].map(([t, d]) => (
              <div key={t} className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" style={{ color: COLORS.gold }} />
                <div>
                  <p className="text-[13.5px] font-semibold text-white/90">{t}</p>
                  <p className="text-[12.5px] text-white/50">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-[12px] text-white/40">
          © 2026 Velvet Brew Café · Flagship, Indiranagar
        </p>
      </div>

      {/* Right panel - Login form */}
      <div className="flex items-center justify-center p-6 sm:p-10" style={{ backgroundColor: COLORS.cream }}>
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex justify-center">
             <img src={logo} alt="Velvet Brew" className="w-16 h-16 rounded-full object-cover" style={{ border: `1.5px solid ${COLORS.gold}` }} />
          </div>

          <h2 className="mt-6 text-2xl font-bold lg:mt-0" style={{ color: COLORS.espresso }}>Staff sign in</h2>
          <p className="mt-1.5 text-[13.5px] mb-8" style={{ color: COLORS.clay }}>
            Access is securely managed.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: COLORS.espresso }}>Work email <span style={{ color: COLORS.danger }}>*</span></label>
              <div className="flex items-center gap-2 rounded-lg px-3 py-3" style={{ background: '#fff', border: `1px solid ${error ? COLORS.danger : COLORS.line}` }}>
                <Mail size={16} style={{ color: COLORS.clay }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@velvetbrew.in"
                  className="bg-transparent outline-none text-sm w-full"
                  style={{ color: COLORS.espresso }}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: COLORS.espresso }}>Password <span style={{ color: COLORS.danger }}>*</span></label>
              <div className="flex items-center gap-2 rounded-lg px-3 py-3" style={{ background: '#fff', border: `1px solid ${error ? COLORS.danger : COLORS.line}` }}>
                <Lock size={16} style={{ color: COLORS.clay }} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-transparent outline-none text-sm w-full"
                  style={{ color: COLORS.espresso }}
                  required
                />
              </div>
              {error && <p className="text-[13px] mt-2 font-medium" style={{ color: COLORS.danger }}>{error}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-[14px] font-medium tracking-wide transition-opacity disabled:opacity-50 mt-6"
              style={{ background: COLORS.espresso, color: COLORS.cream }}
            >
              {loading ? (
                 <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: COLORS.cream, borderTopColor: 'transparent' }}></div>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  Sign in
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 flex justify-center" style={{ borderTop: `1px solid ${COLORS.line}` }}>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-[12.5px] font-semibold transition-colors"
              style={{ color: COLORS.clay }}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to the store
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
