import { useState, useEffect } from 'react';
import { ShoppingBag, User2, MapPin } from 'lucide-react';
import { COLORS } from '../data/colors';
import logo from '../assets/velvet-brew-logo.jpg';
import { useNavigate } from 'react-router-dom';
import { useCustomerAuth, signInWithGoogle, logoutCustomer } from '../services/customerAuth';

const LINKS = [
  { id: 'menu', label: 'Menu' },
  { id: 'offers', label: 'Offers' },
  { id: 'visit', label: 'Visit Us' },
];

export default function Header({
  cartCount,
  onOpenCart,
  cartOpen,
  onOpenOrders,
}: {
  cartCount: number;
  onOpenCart: () => void;
  cartOpen?: boolean;
  onOpenOrders?: () => void;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const { user, loading } = useCustomerAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b bg-opacity-90 backdrop-blur-xl'
          : 'border-b-transparent bg-transparent'
      }`}
      style={{
        borderColor: scrolled ? 'rgba(255,255,255,0.08)' : 'transparent',
        backgroundColor: scrolled ? 'rgba(23,15,10,0.88)' : 'transparent',
        fontFamily: "'Jost', sans-serif"
      }}
    >
      <div className="mx-auto flex h-[72px] max-w-7xl items-center gap-4 px-4 sm:px-6">
        <a href="#top" className="shrink-0 flex items-center gap-3">
          <img src={logo} alt="Velvet Brew" className="w-10 h-10 rounded-full object-cover" style={{ border: `1.5px solid ${COLORS.gold}` }} />
          <div className="hidden sm:block">
             <p className="vb-display text-lg tracking-wide leading-tight" style={{ color: COLORS.cream }}>Velvet Brew</p>
             <p className="text-[9px] uppercase tracking-[0.25em]" style={{ color: COLORS.muted }}>Brewed with passion</p>
          </div>
        </a>

        <nav className="ml-6 hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <a
              key={l.id}
              href={`#${l.id}`}
              className="rounded-xl px-3.5 py-2 text-[13px] font-semibold uppercase tracking-wider transition-colors"
              style={{ color: 'rgba(253, 251, 247, 0.7)' }}
              onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.color = COLORS.cream;
              }}
              onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'rgba(253, 251, 247, 0.7)';
              }}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 relative">
          
          {loading ? (
             <div className="h-10 w-24 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}></div>
          ) : user ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex h-10 items-center gap-2 rounded-xl border px-2.5 transition-colors"
                style={{ borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'rgba(253, 251, 247, 0.9)' }}
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'User'} className="h-6 w-6 rounded-full" />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10">
                    <User2 className="h-3 w-3" />
                  </div>
                )}
                <span className="text-[13px] font-semibold hidden sm:inline max-w-[100px] truncate">
                  {user.displayName?.split(' ')[0] || 'User'}
                </span>
              </button>

              {dropdownOpen && (
                <div 
                  className="absolute right-0 top-full mt-2 w-48 rounded-xl border p-2 shadow-xl"
                  style={{ backgroundColor: COLORS.espresso, borderColor: 'rgba(255,255,255,0.12)' }}
                >
                  <div className="px-3 py-2 border-b mb-1" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    <p className="text-[13px] font-semibold truncate" style={{ color: COLORS.cream }}>{user.displayName}</p>
                    <p className="text-[11px] truncate" style={{ color: COLORS.muted }}>{user.email}</p>
                  </div>
                  {onOpenOrders && (
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        onOpenOrders();
                      }}
                      className="w-full text-left rounded-lg px-3 py-2 text-[13px] font-medium transition-colors"
                      style={{ color: COLORS.cream }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      My Orders
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      logoutCustomer();
                    }}
                    className="w-full text-left rounded-lg px-3 py-2 text-[13px] font-medium transition-colors"
                    style={{ color: COLORS.danger }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="flex h-10 items-center gap-2 rounded-xl border px-3.5 text-[13px] font-semibold transition-colors"
              style={{ borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'rgba(253, 251, 247, 0.9)' }}
            >
              <User2 className="h-4 w-4" />
              Sign in
            </button>
          )}

          <button
            onClick={onOpenCart}
            className="relative flex h-10 items-center gap-2 rounded-xl px-4 text-[13px] font-semibold transition-colors"
            style={{ backgroundColor: COLORS.gold, color: COLORS.espresso }}
          >
            <ShoppingBag className="h-4 w-4" />
            <span className="hidden sm:inline">Cart</span>
            {cartCount > 0 && (
                <span
                  className="absolute -right-1.5 -top-1.5 grid h-5 min-w-[20px] place-items-center rounded-full px-1 text-[11px] font-bold"
                  style={{ backgroundColor: COLORS.espresso, color: COLORS.cream }}
                >
                  {cartCount}
                </span>
            )}
          </button>
        </div>
      </div>

      {/* Store status strip */}
      {!cartOpen && (
        <div className="border-t" style={{ borderColor: 'rgba(255,255,255,0.06)', backgroundColor: 'rgba(23,15,10,0.6)', backdropFilter: 'blur(12px)' }}>
          <div className="mx-auto flex max-w-7xl items-center gap-4 overflow-x-auto px-4 py-1.5 text-[11px] font-medium sm:px-6" style={{ color: 'rgba(253, 251, 247, 0.6)' }}>
            <span className="flex shrink-0 items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: '#10b981' }} /> Open now · 05:00 PM – 12:00 AM
            </span>
            <span className="shrink-0 items-center gap-1.5 flex">
              <MapPin className="h-3 w-3" /> Opp. City Hospital, Avas Vikas Road, Shastri Nagar, Civil Lines, Budaun
            </span>
          </div>
        </div>
      )}
    </header>
  );
}
