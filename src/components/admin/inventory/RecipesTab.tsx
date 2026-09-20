import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { getItems, getRecipes, saveRecipe } from "../../../api/inventory";
import { getMenu } from "../../../api/menu";
import type { InventoryItem, MenuItem } from "../../../types";
import type { Recipe } from "../../../types/inventory";
import EditRecipeModal from "./EditRecipeModal";

export default function RecipesTab() {
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [editingRecipe, setEditingRecipe] = useState<{
    menuItem: any;
    recipe: Recipe | null;
  } | null>(null);

  useEffect(() => {
    Promise.all([
      getMenu(),
      getItems(),
      getRecipes()
    ]).then(([menuData, invData, recipeData]) => {
      setMenuItems(menuData);
      setInventoryItems(invData);
      setRecipes(recipeData);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const handleSaveRecipe = async (recipe: Recipe) => {
    const saved = await saveRecipe(recipe);
    setRecipes(prev => {
      const idx = prev.findIndex(r => String(r.menuItemId) === String(recipe.menuItemId));
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [...prev, saved];
    });
  };

  const filteredMenu = menuItems.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="p-8 text-center text-[#8B7355]">Loading recipes...</div>;
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl shadow-sm border border-[#e8dfd5] overflow-hidden">
      {/* Header/Search */}
      <div className="p-4 border-b border-[#e8dfd5] flex items-center justify-between bg-[#FDFBF7]">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B7355]" size={18} />
          <input
            type="text"
            placeholder="Search menu items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-[#e8dfd5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 text-[#2C1810]"
          />
        </div>
        <div className="text-sm font-bold text-[#8B7355]">
          {menuItems.length} Menu Items
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto vb-scrollbar p-0">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#FDFBF7] sticky top-0 z-10 border-b border-[#e8dfd5]">
            <tr>
              <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-[#8B7355]">Menu Item</th>
              <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-[#8B7355]">Deducts Per Unit Sold</th>
              <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-[#8B7355] text-right">Ingredient Cost</th>
              <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-[#8B7355] text-right">Margin</th>
              <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-[#8B7355] text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e8dfd5]">
            {filteredMenu.map(item => {
              const recipe = recipes.find(r => String(r.menuItemId) === String(item.id)) || null;
              
              let cost = 0;
              let ingredientsDisplay: React.ReactNode[] = [];
              
              if (recipe && recipe.items && recipe.items.length > 0) {
                ingredientsDisplay = recipe.items.map(ing => {
                  const invItem = inventoryItems.find(i => i.id === ing.inventoryItemId);
                  if (invItem) {
                    cost += invItem.unitCost * ing.quantity;
                    return (
                      <span key={ing.inventoryItemId} className="inline-block bg-[#FDFBF7] border border-[#e8dfd5] text-[#2C1810] text-xs px-2 py-1 rounded-md mr-2 mb-1">
                        {ing.quantity}{invItem.unit} {invItem.name}
                      </span>
                    );
                  }
                  return null;
                }).filter(Boolean);
              }

              const marginPct = item.price > 0 
                ? Math.round(((item.price - cost) / item.price) * 100) 
                : 0;

              return (
                <tr key={item.id} className="hover:bg-[#FDFBF7]/50 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#f3eee7] flex items-center justify-center shrink-0 overflow-hidden">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-lg">☕</span>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-[#2C1810]">{item.name}</p>
                        <p className="text-xs text-[#8B7355]">₹{item.price} sell price</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 max-w-[300px]">
                    {ingredientsDisplay.length > 0 ? (
                      <div className="flex flex-wrap">{ingredientsDisplay}</div>
                    ) : (
                      <span className="text-[#8B7355] italic text-sm">No recipe set</span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-right font-medium text-[#2C1810]">
                    {cost > 0 ? `₹${cost.toFixed(2)}` : "-"}
                  </td>
                  <td className="py-4 px-4 text-right">
                    {cost > 0 ? (
                      <span className={`font-bold ${marginPct < 30 ? 'text-red-500' : marginPct < 50 ? 'text-orange-500' : 'text-green-600'}`}>
                        {marginPct}%
                      </span>
                    ) : (
                      <span className="text-[#8B7355]">-</span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <button
                      onClick={() => setEditingRecipe({ menuItem: item, recipe })}
                      className="px-4 py-2 bg-white border border-[#e8dfd5] text-[#2C1810] text-sm font-bold rounded-xl hover:border-[#D4AF37] transition-colors"
                    >
                      Edit recipe
                    </button>
                  </td>
                </tr>
              );
            })}
            
            {filteredMenu.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-[#8B7355]">
                  No menu items found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editingRecipe && (
        <EditRecipeModal
          menuItem={editingRecipe.menuItem}
          initialRecipe={editingRecipe.recipe}
          inventoryItems={inventoryItems}
          onClose={() => setEditingRecipe(null)}
          onSave={handleSaveRecipe}
        />
      )}
    </div>
  );
}
