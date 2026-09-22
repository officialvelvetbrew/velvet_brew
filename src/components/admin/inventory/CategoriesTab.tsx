import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { getCategories, createCategory, updateCategory, deleteCategory } from "../../../api/inventory";
import type { InventoryCategory } from "../../../types";
import { useAlert } from "../../../contexts/AlertContext";

export default function CategoriesTab() {
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<InventoryCategory | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [submitting, setSubmitting] = useState(false);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCategories();
      setCategories(data);
    } catch (err: any) {
      setError(err.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openAddModal = () => {
    setEditingCategory(null);
    setFormData({ name: "", description: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (cat: InventoryCategory) => {
    setEditingCategory(cat);
    setFormData({ name: cat.name, description: cat.description });
    setIsModalOpen(true);
  };

  const { showAlert, showConfirm } = useAlert();

  const handleDelete = (id: number) => {
    showConfirm(
      "Are you sure you want to delete this category?",
      async () => {
        try {
          setLoading(true);
          await deleteCategory(id);
          await loadCategories();
        } catch (err: any) {
          showAlert(err.message || "Failed to delete", true);
          setLoading(false);
        }
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (editingCategory) {
        await updateCategory(editingCategory.id, { description: formData.description });
      } else {
        await createCategory(formData);
      }
      setIsModalOpen(false);
      await loadCategories();
    } catch (err: any) {
      showAlert(err.message || "Failed to save category", true);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && categories.length === 0) {
    return <div className="text-[#8B7355]">Loading categories...</div>;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-[#2C1810]">Categories</h3>
          <p className="text-sm text-[#8B7355]">Manage inventory item categories</p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-[#2C1810] text-[#D4AF37] px-4 py-2 rounded-xl font-semibold hover:bg-[#1a0f0a] transition-colors flex items-center gap-2"
        >
          <Plus size={18} />
          New Category
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-200">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto vb-scrollbar bg-white rounded-2xl shadow-sm border border-[#e8dfd5]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#e8dfd5]">
              <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-[#8B7355]">Name</th>
              <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-[#8B7355]">Description</th>
              <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-[#8B7355] text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-8 text-center text-[#8B7355]">
                  No categories found. Create one to get started.
                </td>
              </tr>
            ) : (
              categories.map((cat) => (
                <tr key={cat.id} className="border-b border-[#e8dfd5]/50 hover:bg-[#FDFBF7] transition-colors">
                  <td className="p-4 font-semibold text-[#2C1810]">{cat.name}</td>
                  <td className="p-4 text-sm text-[#8B7355]">{cat.description}</td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(cat)}
                        className="p-2 text-[#8B7355] hover:text-[#2C1810] hover:bg-[#e8dfd5]/50 rounded-lg transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[#FDFBF7] rounded-3xl p-6 w-full max-w-md shadow-xl border border-[#e8dfd5]">
            <h2 className="text-xl font-bold text-[#2C1810] mb-6">
              {editingCategory ? "Edit Category" : "New Category"}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-2">
                  Name
                </label>
                <input
                  type="text"
                  required
                  disabled={!!editingCategory} // API only supports patching description
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-[#e8dfd5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 text-[#2C1810] disabled:bg-gray-100 disabled:text-gray-500"
                  placeholder="e.g. Vegetables"
                />
                {editingCategory && <p className="text-[10px] text-gray-500 mt-1">Name cannot be changed</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-2">
                  Description
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-[#e8dfd5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 text-[#2C1810] resize-none h-24"
                  placeholder="e.g. Fresh vegetables used in restaurant"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-white border border-[#e8dfd5] text-[#2C1810] rounded-xl font-bold hover:bg-[#f5ebd9] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-3 bg-[#D4AF37] text-[#2C1810] rounded-xl font-bold hover:bg-[#C5A028] transition-colors disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
