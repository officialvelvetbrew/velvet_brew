import { useState, useEffect } from "react";
import { getItems, getMovements } from "../../../api/inventory";
import type { InventoryItem, StockMovement } from "../../../types";
import { format } from "date-fns";
import { rupee } from "../../../utils/currency";

export default function MovementsTab() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<number | "">("");
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [loadingMovements, setLoadingMovements] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const data = await getItems();
        setItems(data);
      } catch (err: any) {
        setError(err.message || "Failed to load items");
      } finally {
        setLoadingItems(false);
      }
    };
    fetchItems();
  }, []);

  useEffect(() => {
    if (!selectedItemId) {
      setMovements([]);
      return;
    }
    const fetchItemMovements = async () => {
      setLoadingMovements(true);
      setError(null);
      try {
        const data = await getMovements(Number(selectedItemId));
        // Sort descending by date if available, or just use as-is
        setMovements(data);
      } catch (err: any) {
        setError(err.message || "Failed to load movements");
      } finally {
        setLoadingMovements(false);
      }
    };
    fetchItemMovements();
  }, [selectedItemId]);

  const getTypeBadge = (type: string = "") => {
    switch (type.toUpperCase()) {
      case "STOCK_IN":
      case "ADJUSTMENT_IN":
      case "RETURN_FROM_CUSTOMER":
        return <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">{type}</span>;
      case "CONSUMPTION":
      case "WASTAGE":
      case "ADJUSTMENT_OUT":
      case "RETURN_TO_SUPPLIER":
        return <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">{type}</span>;
      default:
        return <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-700">{type}</span>;
    }
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl shadow-sm border border-[#e8dfd5] p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-[#2C1810] mb-2">Item Movements</h3>
        <p className="text-[#8B7355] text-sm mb-4">
          View stock in/out history for a specific inventory item.
        </p>

        <div className="max-w-md">
          <label className="block text-sm font-bold text-[#2C1810] mb-1">
            Select Item
          </label>
          <select
            value={selectedItemId}
            onChange={(e) => setSelectedItemId(e.target.value ? Number(e.target.value) : "")}
            disabled={loadingItems}
            className="w-full rounded-xl border border-[#e8dfd5] bg-[#fdfbf7] px-4 py-2.5 text-[14px] outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
          >
            <option value="">-- Choose an item --</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.sku})
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-600 border border-red-100">
          {error}
        </div>
      )}

      {selectedItemId ? (
        <div className="flex-1 overflow-auto rounded-xl border border-[#e8dfd5] bg-white">
          <table className="w-full text-left text-[14px]">
            <thead className="sticky top-0 bg-[#fdfbf7] shadow-sm">
              <tr>
                <th className="px-5 py-3 font-bold text-[#8B7355]">Date</th>
                <th className="px-5 py-3 font-bold text-[#8B7355]">Type</th>
                <th className="px-5 py-3 font-bold text-[#8B7355]">Quantity</th>
                <th className="px-5 py-3 font-bold text-[#8B7355]">Unit Cost</th>
                <th className="px-5 py-3 font-bold text-[#8B7355]">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e8dfd5]">
              {loadingMovements ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-[#8B7355]">
                    Loading movements...
                  </td>
                </tr>
              ) : movements.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-[#8B7355]">
                    No movements found for this item.
                  </td>
                </tr>
              ) : (
                movements.map((movement, i) => (
                  <tr key={movement.id || i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 text-[#2C1810] whitespace-nowrap">
                      {movement.createdAt ? format(new Date(movement.createdAt), "MMM d, yyyy HH:mm") : (movement.date || "-")}
                    </td>
                    <td className="px-5 py-3">
                      {getTypeBadge(movement.type)}
                    </td>
                    <td className="px-5 py-3 font-medium text-[#2C1810]">
                      {movement.quantity}
                    </td>
                    <td className="px-5 py-3 text-[#8B7355]">
                      {movement.unitCost ? rupee(movement.unitCost) : "-"}
                    </td>
                    <td className="px-5 py-3 text-[#8B7355] truncate max-w-[200px]" title={movement.reason}>
                      {movement.reason || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center border-2 border-dashed border-[#e8dfd5] rounded-xl bg-gray-50/50">
          <p className="text-[#8B7355]">Please select an item to view its movements.</p>
        </div>
      )}
    </div>
  );
}
