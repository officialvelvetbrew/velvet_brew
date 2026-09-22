import { useState, useEffect } from "react";
import { Plus, Package, Activity, AlertCircle } from "lucide-react";
import { createItem, updateItem, stockIn, consumeStock, wastageStock, adjustStock } from "../../../api/inventory";
import { getCategories, getSuppliers, getItems } from "../../../api/inventory";
import type { InventoryCategory, Supplier, InventoryItem } from "../../../types";
import { useAlert } from "../../../contexts/AlertContext";

export default function ItemsTab() {
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  
  // Modals
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isOpModalOpen, setIsOpModalOpen] = useState(false);
  const [opType, setOpType] = useState<"STOCK_IN" | "CONSUME" | "WASTAGE" | "ADJUST">("STOCK_IN");
  
  const [submitting, setSubmitting] = useState(false);

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const { showAlert } = useAlert();
  
  const loadData = async () => {
    try {
      setLoading(true);
      const [cats, supps, itms] = await Promise.all([
        getCategories(),
        getSuppliers(),
        getItems()
      ]);
      setCategories(cats);
      setSuppliers(supps);
      setItems(itms);
    } catch (err: any) {
      console.error(err);
      showAlert("Failed to load inventory items: " + err.message, true);
    } finally {
      setLoading(false);
    }
  };

  // Load categories and suppliers for the dropdowns
  useEffect(() => {
    loadData();
  }, []);

  // Item Form
  const [itemForm, setItemForm] = useState({
    categoryId: "",
    supplierId: "",
    name: "",
    sku: "",
    unit: "",
    minimumStock: 10,
    maximumStock: 100,
    reorderLevel: 20,
    unitCost: 0
  });

  // Operation Form
  const [opForm, setOpForm] = useState({
    itemId: "", // Manual entry since we don't have a list
    quantity: 0,
    unitCost: 0,
    reason: "",
    adjustmentType: "ADJUSTMENT_IN" as "ADJUSTMENT_IN" | "ADJUSTMENT_OUT"
  });

  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = {
        categoryId: Number(itemForm.categoryId),
        supplierId: Number(itemForm.supplierId),
        name: itemForm.name,
        sku: itemForm.sku,
        unit: itemForm.unit,
        minimumStock: Number(itemForm.minimumStock),
        maximumStock: Number(itemForm.maximumStock),
        minStock: Number(itemForm.minimumStock), // Fallback
        maxStock: Number(itemForm.maximumStock), // Fallback
        reorderLevel: Number(itemForm.reorderLevel),
        unitCost: Number(itemForm.unitCost),
        currentStock: 0,
        stock: 0, // Fallback for some backends
        cost: Number(itemForm.unitCost), // Fallback
        price: Number(itemForm.unitCost), // Fallback
      };
      console.log("Creating item with payload:", payload);
      await createItem(payload as any);
      showAlert("Item created successfully!");
      setIsItemModalOpen(false);
      loadData();
    } catch (err: any) {
      showAlert(err.message || "Failed to create item", true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const itemId = Number(opForm.itemId);
      if (!itemId) throw new Error("Please enter a valid Item ID");

      if (opType === "STOCK_IN") {
        const item = items.find((i) => i.id === itemId);
        const oldQty = item?.currentStock || 0;
        const oldCost = item?.unitCost || 0;
        
        const newQty = Number(opForm.quantity);
        const newCost = Number(opForm.unitCost);
        
        if (newQty > 0 && newCost >= 0) {
          // Calculate Weighted Average Cost (WAC)
          const totalQty = oldQty + newQty;
          const weightedCost = totalQty > 0 ? ((oldQty * oldCost) + (newQty * newCost)) / totalQty : newCost;
          
          try {
            await updateItem(itemId, { unitCost: Number(weightedCost.toFixed(2)) });
          } catch (e) {
            console.error("Failed to update item base unit cost", e);
          }
        }
        await stockIn(itemId, { quantity: newQty, unitCost: newCost, reason: opForm.reason });
      } else if (opType === "CONSUME") {
        await consumeStock(itemId, { quantity: Number(opForm.quantity), reason: opForm.reason });
      } else if (opType === "WASTAGE") {
        await wastageStock(itemId, { quantity: Number(opForm.quantity), reason: opForm.reason });
      } else if (opType === "ADJUST") {
        await adjustStock(itemId, { type: opForm.adjustmentType, quantity: Number(opForm.quantity), reason: opForm.reason });
      }
      
      showAlert(`${opType} operation successful!`);
      setIsOpModalOpen(false);
      loadData();
    } catch (err: any) {
      showAlert(err.message || "Failed to perform operation", true);
    } finally {
      setSubmitting(false);
    }
  };

  const openOperation = (type: "STOCK_IN" | "CONSUME" | "WASTAGE" | "ADJUST", presetItemId?: number) => {
    setOpType(type);
    setOpForm({ itemId: presetItemId ? presetItemId.toString() : "", quantity: 0, unitCost: 0, reason: "", adjustmentType: "ADJUSTMENT_IN" });
    setIsOpModalOpen(true);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-[#2C1810]">Inventory Items</h3>
          <p className="text-sm text-[#8B7355]">Manage items and perform stock operations</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setItemForm({ ...itemForm }); setIsItemModalOpen(true); }}
            className="bg-[#2C1810] text-[#D4AF37] px-4 py-2 rounded-xl font-semibold hover:bg-[#1a0f0a] transition-colors flex items-center gap-2"
          >
            <Plus size={18} />
            New Item
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto vb-scrollbar bg-white rounded-2xl shadow-sm border border-[#e8dfd5]">
        {loading ? (
          <div className="p-8 text-center text-[#8B7355]">Loading items...</div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#FDFBF7] border border-[#e8dfd5] flex items-center justify-center text-[#8B7355] mx-auto mb-4">
              <Package size={32} />
            </div>
            <h3 className="text-lg font-bold text-[#2C1810] mb-2">No Items Found</h3>
            <p className="text-[#8B7355] max-w-sm mx-auto mb-6">
              Create your first inventory item to start tracking stock.
            </p>
            <button
              onClick={() => { setItemForm({ ...itemForm }); setIsItemModalOpen(true); }}
              className="bg-[#2C1810] text-[#D4AF37] px-4 py-2 rounded-xl font-semibold hover:bg-[#1a0f0a] transition-colors"
            >
              Add Item
            </button>
          </div>
        ) : (
          <div className="min-w-max">
            <div className="grid grid-cols-8 gap-4 px-6 py-4 border-b border-[#e8dfd5] bg-[#FDFBF7]/50">
              <div className="text-xs font-bold text-[#8B7355] uppercase tracking-wider col-span-2">Item</div>
              <div className="text-xs font-bold text-[#8B7355] uppercase tracking-wider">SKU</div>
              <div className="text-xs font-bold text-[#8B7355] uppercase tracking-wider">Category</div>
              <div className="text-xs font-bold text-[#8B7355] uppercase tracking-wider text-right">Stock</div>
              <div className="text-xs font-bold text-[#8B7355] uppercase tracking-wider text-right">Unit Cost</div>
              <div className="text-xs font-bold text-[#8B7355] uppercase tracking-wider text-center">Status</div>
              <div className="text-xs font-bold text-[#8B7355] uppercase tracking-wider text-right">Actions</div>
            </div>
            <div className="divide-y divide-[#e8dfd5]">
              {items.map((item) => (
                <div key={item.id} className="grid grid-cols-8 gap-4 px-6 py-4 items-center hover:bg-[#FDFBF7] transition-colors">
                  <div className="col-span-2">
                    <p className="font-bold text-[#2C1810]">{item.name}</p>
                    <p className="text-xs text-[#8B7355]">{item.supplierName || `Supplier #${item.supplierId}`}</p>
                  </div>
                  <div>
                    <span className="text-xs font-medium bg-[#e8dfd5]/50 text-[#8B7355] px-2 py-1 rounded-md">{item.sku}</span>
                  </div>
                  <div className="text-sm text-[#2C1810]">
                    {item.categoryName || `Category #${item.categoryId}`}
                  </div>
                  <div className="text-right">
                    <span className={`font-bold ${item.outOfStock ? 'text-red-600' : item.lowStock ? 'text-orange-500' : 'text-[#2C1810]'}`}>
                      {item.currentStock}
                    </span>
                    <span className="text-xs text-[#8B7355] ml-1">{item.unit}</span>
                  </div>
                  <div className="text-right text-sm text-[#2C1810]">
                    ₹{item.unitCost.toFixed(2)}
                  </div>
                  <div className="text-center">
                    {item.outOfStock ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full">
                        <AlertCircle size={12} /> Out of Stock
                      </span>
                    ) : item.lowStock ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                        <AlertCircle size={12} /> Low Stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                        In Stock
                      </span>
                    )}
                  </div>
                  <div className="text-right flex items-center justify-end gap-2">
                    <button onClick={() => openOperation("STOCK_IN", item.id)} className="text-xs font-bold text-[#2C1810] hover:text-[#D4AF37] border border-[#e8dfd5] px-2 py-1 rounded-md">In</button>
                    <button onClick={() => openOperation("CONSUME", item.id)} className="text-xs font-bold text-[#2C1810] hover:text-[#D4AF37] border border-[#e8dfd5] px-2 py-1 rounded-md">Out</button>
                    <button onClick={() => openOperation("ADJUST", item.id)} className="text-xs font-bold text-[#8B7355] hover:text-[#D4AF37] border border-[#e8dfd5] px-2 py-1 rounded-md">Adj</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Item Modal */}
      {isItemModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[#FDFBF7] rounded-3xl p-6 w-full max-w-2xl shadow-xl border border-[#e8dfd5] max-h-[90vh] flex flex-col">
            <h2 className="text-xl font-bold text-[#2C1810] mb-6 shrink-0">New Inventory Item</h2>
            
            <form onSubmit={handleItemSubmit} className="flex-1 overflow-y-auto vb-scrollbar pr-2 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-2">Name</label>
                  <input type="text" required value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} className="w-full px-4 py-3 bg-white border border-[#e8dfd5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-2">SKU</label>
                  <input type="text" required value={itemForm.sku} onChange={(e) => setItemForm({ ...itemForm, sku: e.target.value })} className="w-full px-4 py-3 bg-white border border-[#e8dfd5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-2">Category</label>
                  <select required value={itemForm.categoryId} onChange={(e) => setItemForm({ ...itemForm, categoryId: e.target.value })} className="w-full px-4 py-3 bg-white border border-[#e8dfd5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50">
                    <option value="">Select Category</option>
                    {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-2">Supplier</label>
                  <select required value={itemForm.supplierId} onChange={(e) => setItemForm({ ...itemForm, supplierId: e.target.value })} className="w-full px-4 py-3 bg-white border border-[#e8dfd5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50">
                    <option value="">Select Supplier</option>
                    {suppliers.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-2">Unit</label>
                  <input type="text" required placeholder="e.g. KG" value={itemForm.unit} onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })} className="w-full px-4 py-3 bg-white border border-[#e8dfd5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-2">Unit Cost</label>
                  <input type="number" step="0.01" required value={itemForm.unitCost} onChange={(e) => setItemForm({ ...itemForm, unitCost: Number(e.target.value) })} className="w-full px-4 py-3 bg-white border border-[#e8dfd5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-2">Min Stock</label>
                  <input type="number" required value={itemForm.minimumStock} onChange={(e) => setItemForm({ ...itemForm, minimumStock: Number(e.target.value) })} className="w-full px-4 py-3 bg-white border border-[#e8dfd5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-2">Max Stock</label>
                  <input type="number" required value={itemForm.maximumStock} onChange={(e) => setItemForm({ ...itemForm, maximumStock: Number(e.target.value) })} className="w-full px-4 py-3 bg-white border border-[#e8dfd5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50" />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-2">Reorder Level</label>
                <input type="number" required value={itemForm.reorderLevel} onChange={(e) => setItemForm({ ...itemForm, reorderLevel: Number(e.target.value) })} className="w-full px-4 py-3 bg-white border border-[#e8dfd5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50" />
              </div>

              <div className="flex gap-3 pt-4 border-t border-[#e8dfd5] mt-4">
                <button type="button" onClick={() => setIsItemModalOpen(false)} className="flex-1 px-4 py-3 bg-white border border-[#e8dfd5] text-[#2C1810] rounded-xl font-bold hover:bg-[#f5ebd9] transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-3 bg-[#D4AF37] text-[#2C1810] rounded-xl font-bold hover:bg-[#C5A028] transition-colors disabled:opacity-50">Save Item</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Operations Modal */}
      {isOpModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[#FDFBF7] rounded-3xl p-6 w-full max-w-md shadow-xl border border-[#e8dfd5]">
            <h2 className="text-xl font-bold text-[#2C1810] mb-6">
              {opType === "STOCK_IN" && "Stock In"}
              {opType === "CONSUME" && "Consume Stock"}
              {opType === "WASTAGE" && "Report Wastage"}
              {opType === "ADJUST" && "Stock Adjustment"}
            </h2>
            
            <form onSubmit={handleOpSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-2">Target Item ID</label>
                <input type="number" required value={opForm.itemId} onChange={(e) => setOpForm({ ...opForm, itemId: e.target.value })} className="w-full px-4 py-3 bg-white border border-[#e8dfd5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50" placeholder="e.g. 1" />
              </div>

              {opType === "ADJUST" && (
                <div>
                  <label className="block text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-2">Adjustment Type</label>
                  <select required value={opForm.adjustmentType} onChange={(e) => setOpForm({ ...opForm, adjustmentType: e.target.value as any })} className="w-full px-4 py-3 bg-white border border-[#e8dfd5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50">
                    <option value="ADJUSTMENT_IN">Adjustment In (+)</option>
                    <option value="ADJUSTMENT_OUT">Adjustment Out (-)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-2">Quantity</label>
                <input type="number" step="0.01" required value={opForm.quantity || ""} onChange={(e) => setOpForm({ ...opForm, quantity: Number(e.target.value) })} className="w-full px-4 py-3 bg-white border border-[#e8dfd5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50" />
              </div>

              {opType === "STOCK_IN" && (
                <div>
                  <label className="block text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-2">Unit Cost</label>
                  <input type="number" step="0.01" required value={opForm.unitCost || ""} onChange={(e) => setOpForm({ ...opForm, unitCost: Number(e.target.value) })} className="w-full px-4 py-3 bg-white border border-[#e8dfd5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50" />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-2">Reason</label>
                <textarea required value={opForm.reason} onChange={(e) => setOpForm({ ...opForm, reason: e.target.value })} className="w-full px-4 py-3 bg-white border border-[#e8dfd5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 h-24 resize-none" placeholder="Enter reason for operation..." />
              </div>

              <div className="flex gap-3 pt-4 border-t border-[#e8dfd5]">
                <button type="button" onClick={() => setIsOpModalOpen(false)} className="flex-1 px-4 py-3 bg-white border border-[#e8dfd5] text-[#2C1810] rounded-xl font-bold hover:bg-[#f5ebd9] transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className={`flex-1 px-4 py-3 rounded-xl font-bold transition-colors disabled:opacity-50 ${opType === "WASTAGE" || (opType === "ADJUST" && opForm.adjustmentType === "ADJUSTMENT_OUT") ? "bg-red-500 hover:bg-red-600 text-white" : "bg-[#2C1810] hover:bg-[#1a0f0a] text-[#D4AF37]"}`}>
                  {submitting ? "Processing..." : "Confirm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
