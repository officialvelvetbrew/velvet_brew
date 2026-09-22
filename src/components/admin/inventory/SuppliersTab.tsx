import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Power, PowerOff } from "lucide-react";
import { getSuppliers, createSupplier, updateSupplier, toggleSupplier, deleteSupplier } from "../../../api/inventory";
import type { Supplier } from "../../../types";
import { useAlert } from "../../../contexts/AlertContext";

export default function SuppliersTab() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    taxNumber: ""
  });
  
  const [submitting, setSubmitting] = useState(false);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSuppliers();
      setSuppliers(data);
    } catch (err: any) {
      setError(err.message || "Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const openAddModal = () => {
    setEditingSupplier(null);
    setFormData({
      name: "",
      contactPerson: "",
      phone: "",
      email: "",
      address: "",
      taxNumber: ""
    });
    setIsModalOpen(true);
  };

  const openEditModal = (sup: Supplier) => {
    setEditingSupplier(sup);
    setFormData({
      name: sup.name,
      contactPerson: sup.contactPerson,
      phone: sup.phone,
      email: sup.email,
      address: sup.address,
      taxNumber: sup.taxNumber
    });
    setIsModalOpen(true);
  };

  const { showAlert, showConfirm } = useAlert();

  const handleDelete = (id: number) => {
    showConfirm(
      "Are you sure you want to delete this supplier?",
      async () => {
        try {
          setLoading(true);
          await deleteSupplier(id);
          await loadSuppliers();
        } catch (err: any) {
          showAlert(err.message || "Failed to delete", true);
          setLoading(false);
        }
      }
    );
  };

  const handleToggle = async (id: number, enabled: boolean) => {
    try {
      setLoading(true);
      await toggleSupplier(id, enabled);
      await loadSuppliers();
    } catch (err: any) {
      showAlert(err.message || "Failed to toggle supplier status", true);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (editingSupplier) {
        // Only patch fields based on instructions
        await updateSupplier(editingSupplier.id, {
          phone: formData.phone,
          address: formData.address
        });
      } else {
        await createSupplier(formData);
      }
      setIsModalOpen(false);
      await loadSuppliers();
    } catch (err: any) {
      showAlert(err.message || "Failed to save supplier", true);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && suppliers.length === 0) {
    return <div className="text-[#8B7355]">Loading suppliers...</div>;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-[#2C1810]">Suppliers</h3>
          <p className="text-sm text-[#8B7355]">Manage your inventory vendors and suppliers</p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-[#2C1810] text-[#D4AF37] px-4 py-2 rounded-xl font-semibold hover:bg-[#1a0f0a] transition-colors flex items-center gap-2"
        >
          <Plus size={18} />
          New Supplier
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-200">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto vb-scrollbar grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
        {suppliers.length === 0 ? (
          <div className="col-span-full p-8 text-center text-[#8B7355] bg-white rounded-2xl border border-[#e8dfd5]">
            No suppliers found. Create one to get started.
          </div>
        ) : (
          suppliers.map((sup) => (
            <div key={sup.id} className="bg-white rounded-2xl shadow-sm border border-[#e8dfd5] p-5 flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="font-bold text-[#2C1810] text-lg">{sup.name}</h4>
                  <p className="text-[#8B7355] text-xs font-semibold">{sup.contactPerson}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${sup.enabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {sup.enabled ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <div className="space-y-2 mb-6 flex-1 text-sm text-[#2C1810]">
                <p className="flex items-center gap-2"><span className="text-[#8B7355] w-12 text-xs uppercase font-bold tracking-wider">Phone</span> {sup.phone}</p>
                <p className="flex items-center gap-2 truncate"><span className="text-[#8B7355] w-12 text-xs uppercase font-bold tracking-wider">Email</span> {sup.email}</p>
                <p className="flex items-center gap-2"><span className="text-[#8B7355] w-12 text-xs uppercase font-bold tracking-wider">Tax</span> {sup.taxNumber}</p>
                <p className="flex items-start gap-2 mt-2"><span className="text-[#8B7355] w-12 text-xs uppercase font-bold tracking-wider mt-0.5">Addr</span> <span className="flex-1 leading-tight">{sup.address}</span></p>
              </div>

              <div className="flex items-center justify-between border-t border-[#e8dfd5] pt-4 mt-auto">
                <button
                  onClick={() => handleToggle(sup.id, !sup.enabled)}
                  className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${sup.enabled ? 'text-red-500 hover:text-red-700' : 'text-green-500 hover:text-green-700'}`}
                >
                  {sup.enabled ? <PowerOff size={14} /> : <Power size={14} />}
                  {sup.enabled ? "Disable" : "Enable"}
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(sup)}
                    className="p-1.5 text-[#8B7355] hover:text-[#2C1810] hover:bg-[#e8dfd5]/50 rounded-lg transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(sup.id)}
                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[#FDFBF7] rounded-3xl p-6 w-full max-w-xl shadow-xl border border-[#e8dfd5] max-h-[90vh] flex flex-col">
            <h2 className="text-xl font-bold text-[#2C1810] mb-6 shrink-0">
              {editingSupplier ? "Edit Supplier" : "New Supplier"}
            </h2>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto vb-scrollbar pr-2 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-2">Company Name</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingSupplier}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-[#e8dfd5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 text-[#2C1810] disabled:bg-gray-100 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-2">Contact Person</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingSupplier}
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-[#e8dfd5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 text-[#2C1810] disabled:bg-gray-100 disabled:text-gray-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-2">Phone</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-[#e8dfd5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 text-[#2C1810]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-2">Email</label>
                  <input
                    type="email"
                    required
                    disabled={!!editingSupplier}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-[#e8dfd5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 text-[#2C1810] disabled:bg-gray-100 disabled:text-gray-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-2">Address</label>
                <textarea
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-[#e8dfd5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 text-[#2C1810] resize-none h-24"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-2">Tax Number</label>
                <input
                  type="text"
                  required
                  disabled={!!editingSupplier}
                  value={formData.taxNumber}
                  onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-[#e8dfd5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 text-[#2C1810] disabled:bg-gray-100 disabled:text-gray-500"
                />
              </div>

              {editingSupplier && (
                <p className="text-[10px] text-[#8B7355] italic">Note: Only Phone and Address can be updated for an existing supplier.</p>
              )}

              <div className="flex gap-3 pt-4 shrink-0 border-t border-[#e8dfd5] mt-6">
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
                  {submitting ? "Saving..." : "Save Supplier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
