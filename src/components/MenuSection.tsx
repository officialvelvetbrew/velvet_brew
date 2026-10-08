import { useState, useMemo, ElementType } from 'react';
import { Leaf, Search, Sparkles } from 'lucide-react';
import { COLORS } from '../data/colors';
import MenuCard from './MenuCard';
import type { CategoryId, Category, MenuItem, CartItem } from '../types';

interface MenuSectionProps {
  activeCategory: CategoryId | 'all';
  setActiveCategory: (category: CategoryId | 'all') => void;
  cart: Record<string, CartItem>;
  promoPrice: number;
  addToCart: (category: CategoryId, item: MenuItem) => void;
  changeQty: (id: string, delta: number) => void;
  menu: Record<CategoryId, MenuItem[]>;
  categories: Category[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

function CategoryIcon({ src, alt, icon: Icon, size }: { src?: string, alt: string, icon: ElementType, size: number }) {
    const [error, setError] = useState(false);
    if (!src || error) {
        return <Icon size={size} />;
    }
    return (
        <img 
            src={src} 
            alt={alt} 
            className="object-cover rounded-full" 
            style={{ width: size, height: size }}
            onError={() => setError(true)} 
        />
    );
}

export default function MenuSection({
  activeCategory,
  setActiveCategory,
  cart,
  promoPrice,
  addToCart,
  changeQty,
  menu,
  categories,
  loading,
  error,
  onRetry,
}: MenuSectionProps) {
  const [query, setQuery] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const [channel, setChannel] = useState<'dine-in' | 'takeaway' | 'delivery'>('dine-in');

  const allItems = useMemo(() => {
    return Object.entries(menu).flatMap(([catId, items]) => 
      items.map(item => ({ ...item, categoryId: catId as CategoryId }))
    );
  }, [menu]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allItems.filter((i) => {
      if (activeCategory !== 'all' && i.categoryId !== activeCategory) return false;
      if (vegOnly && !i.veg) return false;
      if (!q) return true;
      return (
        i.name.toLowerCase().includes(q) ||
        (i.description?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [allItems, activeCategory, query, vegOnly]);

  const grouped = useMemo(() => {
    const byCat = new Map<CategoryId, (MenuItem & { categoryId: CategoryId })[]>();
    for (const item of filtered) {
      if (!byCat.has(item.categoryId)) byCat.set(item.categoryId, []);
      byCat.get(item.categoryId)!.push(item);
    }
    return categories
      .map((cat) => ({ cat, rows: byCat.get(cat.id) ?? [] }))
      .filter((g) => g.rows.length);
  }, [filtered, categories]);

  return (
    <section id="menu" className="py-14" style={{ backgroundColor: '#F5EBE1' }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center mb-10">
            <p className="uppercase text-xs tracking-[0.35em]" style={{ color: COLORS.gold }}>
                Our menu
            </p>
            <h2 className="vb-display text-3xl md:text-4xl mt-2" style={{ color: COLORS.umber }}>
                Something for every mood
            </h2>
            <p className="mt-2 text-sm max-w-lg mx-auto" style={{ color: COLORS.clay }}>
                Every drink is customisable — pick your milk, your sweetness and your extras.
            </p>
        </div>

        {/* ---------------- controls ---------------- */}
        <div className="sticky top-[70px] z-40 -mx-4 mt-8 px-4 py-3 backdrop-blur-lg sm:-mx-6 sm:px-6 shadow-sm" style={{ backgroundColor: 'rgba(253,251,247,0.9)', borderBottom: `1px solid ${COLORS.line}` }}>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center max-w-5xl mx-auto">

            {/* search */}
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: COLORS.clay }} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search lattes, shakes, fries…"
                className="h-11 w-full rounded-2xl pl-11 pr-4 text-sm focus:outline-none focus:ring-2"
                style={{ backgroundColor: '#fff', border: '1px solid #E5E5E5', color: COLORS.espresso, outlineColor: COLORS.gold }}
              />
            </div>
          </div>

          {/* categories */}
          <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-2 max-w-5xl mx-auto md:justify-center">
            <button
                onClick={() => setActiveCategory('all')}
                className="flex shrink-0 items-center gap-2 rounded-2xl border px-4 py-2.5 text-[13px] font-semibold transition-all cursor-pointer"
                style={{
                    backgroundColor: activeCategory === 'all' ? COLORS.espresso : '#fff',
                    color: activeCategory === 'all' ? COLORS.cream : COLORS.clay,
                    borderColor: activeCategory === 'all' ? COLORS.espresso : '#E5E5E5',
                }}
            >
                <Sparkles size={16} color={activeCategory === 'all' ? COLORS.gold : COLORS.clay} />
                All
                <span className="rounded-full px-1.5 py-0.5 text-[10px] font-bold" style={{ backgroundColor: activeCategory === 'all' ? 'rgba(255,255,255,0.15)' : '#F5F5F5', color: activeCategory === 'all' ? COLORS.goldLt : COLORS.clay }}>
                    {allItems.length}
                </span>
            </button>
            {categories.map((c) => {
                const count = allItems.filter(i => i.categoryId === c.id).length;
                const isActive = activeCategory === c.id;
                return (
                    <button
                        key={c.id}
                        onClick={() => setActiveCategory(c.id)}
                        className="flex shrink-0 items-center gap-2 rounded-2xl border px-4 py-2.5 text-[13px] font-semibold transition-all cursor-pointer"
                        style={{
                            backgroundColor: isActive ? COLORS.espresso : '#fff',
                            color: isActive ? COLORS.cream : COLORS.clay,
                            borderColor: isActive ? COLORS.espresso : '#E5E5E5',
                        }}
                    >
                        <CategoryIcon src={c.image} alt={c.label} icon={c.icon} size={20} />
                        {c.label}
                        <span className="rounded-full px-1.5 py-0.5 text-[10px] font-bold" style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.15)' : '#F5F5F5', color: isActive ? COLORS.goldLt : COLORS.clay }}>
                            {count}
                        </span>
                    </button>
                )
            })}
          </div>
        </div>

        {/* ---------------- grid ---------------- */}
        <div className="max-w-5xl mx-auto mt-10">
            {loading ? (
                <div className="py-20 text-center text-sm" style={{ color: COLORS.clay }}>
                    Loading menu...
                </div>
            ) : error ? (
                <div className="py-20 text-center flex flex-col items-center">
                    <p className="text-sm mb-4" style={{ color: COLORS.danger }}>{error}</p>
                    <button onClick={onRetry} className="px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider cursor-pointer" style={{ background: COLORS.gold, color: COLORS.espresso }}>
                        Retry
                    </button>
                </div>
            ) : grouped.length === 0 ? (
            <div className="py-20 text-center">
                <p className="vb-display text-lg" style={{ color: COLORS.umber }}>Nothing matched “{query}”</p>
                <p className="mt-1 text-sm" style={{ color: COLORS.clay }}>
                Try “latte”, “fries” or clear the filters.
                </p>
            </div>
            ) : (
            grouped.map(({ cat, rows }) => (
                <div key={cat.id} className="mt-10">
                <div className="mb-5 flex items-end justify-between gap-4">
                    <div>
                    <h3 className="vb-display flex items-center gap-2.5 text-xl" style={{ color: COLORS.umber }}>
                        <CategoryIcon src={cat.image} alt={cat.label} icon={cat.icon} size={32} />
                        {cat.label}
                    </h3>
                    </div>
                    <span className="shrink-0 text-xs font-semibold uppercase tracking-wider" style={{ color: COLORS.clay }}>
                    {rows.length} items
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {rows.map((item) => (
                        <MenuCard
                            key={item.id}
                            item={item}
                            category={item.categoryId}
                            promoPrice={promoPrice}
                            qtyInCart={cart[item.id]?.qty ?? 0}
                            onAdd={addToCart}
                            onDecrease={(id) => changeQty(id, -1)}
                        />
                    ))}
                </div>
                </div>
            ))
            )}
        </div>
      </div>
    </section>
  );
}
