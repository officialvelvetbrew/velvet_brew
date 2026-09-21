import { useState, useMemo } from "react";
import { X, Plus } from "lucide-react";
import type { InventoryItem } from "../../../types";
import type { Recipe, RecipeItem } from "../../../types/inventory";

interface EditRecipeModalProps {
  menuItem: {
    id: string;
    name: string;
    price: number;
  };
  initialRecipe: Recipe | null;
  inventoryItems: InventoryItem[];
  onClose: () => void;
  onSave: (recipe: Recipe) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export default function EditRecipeModal({
  menuItem,
  initialRecipe,
  inventoryItems,
  onClose,
  onSave,
  onDelete,
}: EditRecipeModalProps) {
  const [ingredients, setIngredients] = useState<RecipeItem[]>(
    initialRecipe ? initialRecipe.items || [] : []
  );
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const availableItems = useMemo(() => {
    const usedIds = new Set(ingredients.map((i) => i.inventoryItemId));
    return inventoryItems.filter((item) => !usedIds.has(item.id));
  }, [inventoryItems, ingredients]);

  const handleAddIngredient = () => {
    if (!selectedItemId) return;
    const itemId = Number(selectedItemId);
    const item = inventoryItems.find((i) => i.id === itemId);
    if (item) {
      setIngredients([...ingredients, { inventoryItemId: itemId, quantity: 1 }]);
      setSelectedItemId("");
    }
  };

  const handleRemoveIngredient = (itemId: number) => {
    setIngredients(ingredients.filter((i) => i.inventoryItemId !== itemId));
  };

  const handleQuantityChange = (itemId: number, qty: number) => {
    setIngredients(
      ingredients.map((i) =>
        i.inventoryItemId === itemId ? { ...i, quantity: qty } : i
      )
    );
  };

  const ingredientCost = useMemo(() => {
    return ingredients.reduce((total, ing) => {
      const item = inventoryItems.find((i) => i.id === ing.inventoryItemId);
      if (item) {
        return total + item.unitCost * ing.quantity;
      }
      return total;
    }, 0);
  }, [ingredients, inventoryItems]);

  const handleSave = async () => {
    setSubmitting(true);
    try {
      await onSave({
        id: initialRecipe?.id,
        menuItemId: menuItem.id,
        name: menuItem.name,
        items: ingredients,
      });
      onClose();
    } catch (err) {
      console.error(err);
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!initialRecipe?.id) return;
    if (confirm("Are you sure you want to delete this recipe?")) {
      setSubmitting(true);
      try {
        await onDelete(initialRecipe.id);
        onClose();
      } catch (err) {
        console.error(err);
        setSubmitting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[24px] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-bold text-[#2C1810]">
                Recipe • {menuItem.name}
              </h2>
              <p className="text-sm text-[#8B7355] mt-1">
                Quantities deducted from stock for every single unit sold
              </p>
            </div>
            <div className="flex items-center gap-2">
              {initialRecipe?.id && (
                <button
                  onClick={handleDelete}
                  disabled={submitting}
                  className="px-3 py-1.5 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                >
                  Delete
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-[#FDFBF7] rounded-full transition-colors text-[#8B7355] hover:text-[#2C1810]"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Ingredients List */}
          <div className="space-y-3 mb-6 max-h-[40vh] overflow-y-auto vb-scrollbar pr-2">
            {ingredients.map((ing) => {
              const item = inventoryItems.find((i) => i.id === ing.inventoryItemId);
              if (!item) return null;
              
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-[#e8dfd5] bg-[#FDFBF7]"
                >
                  <div>
                    <p className="font-semibold text-[#2C1810]">{item.name}</p>
                    <p className="text-xs text-[#8B7355]">
                      {item.currentStock}{item.unit} on hand • ₹{item.unitCost.toFixed(2)}/{item.unit}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={ing.quantity || ""}
                        onChange={(e) =>
                          handleQuantityChange(item.id, parseFloat(e.target.value) || 0)
                        }
                        className="w-24 px-3 py-1.5 text-right font-medium text-[#2C1810] bg-white border border-[#e8dfd5] rounded-lg focus:outline-none focus:border-[#D4AF37]"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B7355] text-sm pointer-events-none">
                        {item.unit}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveIngredient(item.id)}
                      className="p-2 text-[#8B7355] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
            {ingredients.length === 0 && (
              <p className="text-center text-[#8B7355] py-4">No ingredients added yet.</p>
            )}
          </div>

          {/* Add Ingredient Dropdown */}
          <div className="flex gap-2 mb-6">
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="flex-1 px-4 py-2 bg-white border border-[#D4AF37] text-[#2C1810] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 font-medium"
            >
              <option value="">Add an ingredient...</option>
              {availableItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.unit})
                </option>
              ))}
            </select>
            <button
              onClick={handleAddIngredient}
              disabled={!selectedItemId}
              className="px-4 py-2 bg-[#2C1810] text-white rounded-xl font-bold flex items-center gap-2 disabled:opacity-50 transition-opacity"
            >
              <Plus size={18} />
              Add
            </button>
          </div>

          {/* Cost Summary */}
          <div className="flex justify-between items-center py-4 border-t border-[#e8dfd5] mb-6">
            <span className="text-[#8B7355] font-medium">Ingredient cost per unit</span>
            <span className="text-xl font-bold text-[#2C1810]">
              ₹{ingredientCost.toFixed(2)}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-[#e8dfd5] text-[#8B7355] font-bold rounded-xl hover:bg-[#FDFBF7] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={submitting}
              className="flex-1 py-3 px-4 bg-[#D4AF37] text-[#2C1810] font-bold rounded-xl hover:bg-[#C5A030] transition-colors disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Save recipe"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
