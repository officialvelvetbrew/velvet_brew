import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Tag, Calendar, Percent, Currency, Activity } from "lucide-react";
import { getAdminOffers, createOffer, updateOffer, deleteOffer, ApiOffer, CreateOfferRequest } from "../../api/offers";

export default function OffersView() {
  const [offers, setOffers] = useState<ApiOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<ApiOffer | null>(null);
  
  const initialFormData: CreateOfferRequest & { emoji?: string } = {
    code: "",
    name: "",
    description: "",
    discountType: "PERCENTAGE",
    discountValue: 0,
    maxDiscountAmount: null,
    minOrderAmount: 0,
    startsAt: null,
    endsAt: null,
    maxUsesTotal: null,
    maxUsesPerCustomer: null,
    emoji: "🎉",
  };

  const EMOJI_OPTIONS = ["🎉", "☕", "🔥", "⚡", "🎁", "🏷️", "🥳", "🍩", "🍕", "🍔", "🥤", "🌟", "💥"];
  
  const [formData, setFormData] = useState<CreateOfferRequest>(initialFormData);
  const [isActiveToggle, setIsActiveToggle] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadOffers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAdminOffers();
      setOffers(data);
    } catch (err: any) {
      setError(err.message || "Failed to load offers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOffers();
  }, []);

  const openAddModal = () => {
    setEditingOffer(null);
    setFormData(initialFormData);
    setIsActiveToggle(true);
    setIsModalOpen(true);
  };

  const openEditModal = (off: ApiOffer) => {
    setEditingOffer(off);
    let extractedEmoji = off.emoji || "🎉";
    let cleanDesc = off.description || "";
    const match = cleanDesc.match(/^\[(.+?)\]\s*/);
    if (match) {
      extractedEmoji = match[1];
      cleanDesc = cleanDesc.replace(/^\[.+?\]\s*/, "");
    }
    setFormData({
      code: off.code,
      name: off.name,
      description: cleanDesc,
      discountType: off.discountType,
      discountValue: off.discountValue,
      maxDiscountAmount: off.maxDiscountAmount || null,
      minOrderAmount: off.minOrderAmount,
      startsAt: off.startsAt ? off.startsAt.substring(0, 16) : null,
      endsAt: off.endsAt ? off.endsAt.substring(0, 16) : null,
      maxUsesTotal: off.maxUsesTotal || null,
      maxUsesPerCustomer: off.maxUsesPerCustomer || null,
      emoji: extractedEmoji,
    });
    setIsActiveToggle(off.active);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to deactivate and soft-delete this offer?")) return;
    try {
      setLoading(true);
      await deleteOffer(id);
      await loadOffers();
    } catch (err: any) {
      alert(err.message || "Failed to delete");
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      
      const payload: any = { ...formData };
      
      // Clean up empty numbers
      if (!payload.maxDiscountAmount) payload.maxDiscountAmount = null;
      if (!payload.maxUsesTotal) payload.maxUsesTotal = null;
      if (!payload.maxUsesPerCustomer) payload.maxUsesPerCustomer = null;
      if (!payload.startsAt) payload.startsAt = null; else payload.startsAt += ":00";
      if (!payload.endsAt) payload.endsAt = null; else payload.endsAt += ":00";

      // Encode emoji in description for backward compatibility
      const rawDesc = (formData.description || "").replace(/^\[.+?\]\s*/, "");
      const selectedEmoji = (formData as any).emoji || "🎉";
      payload.description = `[${selectedEmoji}] ${rawDesc}`;
      payload.emoji = selectedEmoji;

      if (editingOffer) {
        await updateOffer(editingOffer.id, { ...payload, active: isActiveToggle });
      } else {
        await createOffer(payload);
      }
      setIsModalOpen(false);
      await loadOffers();
    } catch (err: any) {
      alert(err.message || "Failed to save offer");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "No limit";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  };

  if (loading && offers.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="text-[#8B7355] font-bold">Loading offers...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-display font-bold text-[#2C1810]">Offers &amp; Promotions</h2>
          <p className="text-[#8B7355] mt-1">Manage coupon codes, discounts, and promotional campaigns</p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-[#D4AF37] text-[#2C1810] px-5 py-2.5 rounded-xl font-bold hover:bg-[#c5a030] transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus size={20} />
          Create Offer
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-200">
          {error}
        </div>
      )}

      <div className="grid gap-4">
        {offers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-[#8B7355]/20">
            <Tag size={48} className="mx-auto text-[#8B7355]/30 mb-4" />
            <p className="text-[#8B7355] font-medium">No offers found. Create your first promotion!</p>
          </div>
        ) : (
          offers.map((off) => (
            <div key={off.id} className={`bg-white rounded-2xl p-5 flex items-center justify-between border transition-all ${off.active ? 'border-[#8B7355]/20 shadow-sm' : 'border-gray-200 opacity-60'}`}>
              <div className="flex items-center gap-5">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${off.active ? 'bg-[#FDFBF7] border border-[#8B7355]/30 text-[#8B7355]' : 'bg-gray-100 text-gray-400'}`}>
                  {off.discountType === 'PERCENTAGE' ? <Percent size={24} /> : <span className="font-bold text-xl">₹</span>}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-[#2C1810] text-lg uppercase tracking-wider">{off.code}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${off.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {off.active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>
                  <p className="text-[#8B7355] text-sm mt-0.5">{off.name} • {off.discountType === 'PERCENTAGE' ? `${off.discountValue}% OFF` : `₹${off.discountValue} OFF`}</p>
                  
                  <div className="flex items-center gap-4 mt-3 text-xs text-[#8B7355]/80 font-medium">
                    <span className="flex items-center gap-1.5"><Activity size={14} /> Uses: {off.currentUses} {off.maxUsesTotal ? `/ ${off.maxUsesTotal}` : ''}</span>
                    <span className="flex items-center gap-1.5"><Calendar size={14} /> Ends: {formatDate(off.endsAt)}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditModal(off)}
                  className="p-2 text-[#8B7355] hover:bg-[#FDFBF7] rounded-lg transition-colors"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => handleDelete(off.id)}
                  disabled={!off.active}
                  className={`p-2 rounded-lg transition-colors ${off.active ? 'text-red-500 hover:bg-red-50' : 'text-gray-300 cursor-not-allowed'}`}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-[#FDFBF7] rounded-3xl w-full max-w-2xl overflow-hidden shadow-xl my-8">
            <div className="bg-[#2C1810] p-6 text-[#fdfbf7] flex justify-between items-center">
              <h3 className="font-display font-bold tracking-widest uppercase">
                {editingOffer ? "Edit Offer" : "Create New Offer"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#fdfbf7]/70 hover:text-white">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-2">Offer Code *</label>
                  <input
                    type="text"
                    required
                    maxLength={30}
                    disabled={!!editingOffer} // Code immutable after creation
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                    className="w-full px-4 py-3 rounded-xl border border-[#8B7355]/30 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none bg-white uppercase font-bold text-lg disabled:opacity-60 disabled:bg-gray-100"
                    placeholder="e.g. SUMMER50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-2">Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-[#8B7355]/30 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none bg-white font-medium"
                    placeholder="e.g. Summer Special 50% Off"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-2">Banner Emoji (Custom Icon)</label>
                <div className="flex items-center gap-3 flex-wrap bg-white p-3 rounded-2xl border border-[#8B7355]/30">
                  <input
                    type="text"
                    maxLength={5}
                    value={(formData as any).emoji || "🎉"}
                    onChange={(e) => setFormData({ ...formData, emoji: e.target.value } as any)}
                    className="w-14 h-11 text-center text-2xl rounded-xl border border-[#8B7355]/20 focus:border-[#D4AF37] outline-none font-bold bg-[#FDFBF7]"
                  />
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {EMOJI_OPTIONS.map((emo) => (
                      <button
                        key={emo}
                        type="button"
                        onClick={() => setFormData({ ...formData, emoji: emo } as any)}
                        className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-transform hover:scale-110 ${
                          (formData as any).emoji === emo ? "bg-[#2C1810] text-white shadow-sm" : "bg-[#FDFBF7] border border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        {emo}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-2">Description</label>
                <input
                  type="text"
                  value={formData.description || ""}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-[#8B7355]/30 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none bg-white text-sm"
                  placeholder="e.g. Get 50% off on all hot beverages this summer"
                />
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-white rounded-2xl border border-[#8B7355]/10">
                <div>
                  <label className="block text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-2">Type *</label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({...formData, discountType: e.target.value as any})}
                    className="w-full px-4 py-3 rounded-xl border border-[#8B7355]/30 focus:border-[#D4AF37] outline-none bg-white"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FLAT">Flat Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-2">Value *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={formData.discountValue}
                    onChange={(e) => setFormData({...formData, discountValue: Number(e.target.value)})}
                    className="w-full px-4 py-3 rounded-xl border border-[#8B7355]/30 focus:border-[#D4AF37] outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-2">Max Discount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    disabled={formData.discountType === "FLAT"}
                    value={formData.maxDiscountAmount || ""}
                    onChange={(e) => setFormData({...formData, maxDiscountAmount: e.target.value ? Number(e.target.value) : null})}
                    className="w-full px-4 py-3 rounded-xl border border-[#8B7355]/30 focus:border-[#D4AF37] outline-none bg-white disabled:opacity-50"
                    placeholder="No limit"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-2">Starts At (Optional)</label>
                  <input
                    type="datetime-local"
                    value={formData.startsAt || ""}
                    onChange={(e) => setFormData({...formData, startsAt: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-[#8B7355]/30 focus:border-[#D4AF37] outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-2">Ends At (Optional)</label>
                  <input
                    type="datetime-local"
                    value={formData.endsAt || ""}
                    onChange={(e) => setFormData({...formData, endsAt: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-[#8B7355]/30 focus:border-[#D4AF37] outline-none bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-2">Min Order Val (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.minOrderAmount}
                    onChange={(e) => setFormData({...formData, minOrderAmount: Number(e.target.value)})}
                    className="w-full px-4 py-3 rounded-xl border border-[#8B7355]/30 focus:border-[#D4AF37] outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-2">Max Uses (Total)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxUsesTotal || ""}
                    onChange={(e) => setFormData({...formData, maxUsesTotal: e.target.value ? Number(e.target.value) : null})}
                    className="w-full px-4 py-3 rounded-xl border border-[#8B7355]/30 focus:border-[#D4AF37] outline-none bg-white"
                    placeholder="Unlimited"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-2">Max Uses / User</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxUsesPerCustomer || ""}
                    onChange={(e) => setFormData({...formData, maxUsesPerCustomer: e.target.value ? Number(e.target.value) : null})}
                    className="w-full px-4 py-3 rounded-xl border border-[#8B7355]/30 focus:border-[#D4AF37] outline-none bg-white"
                    placeholder="Unlimited"
                  />
                </div>
              </div>

              {editingOffer && (
                <div className="mb-6 flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={isActiveToggle}
                    onChange={(e) => setIsActiveToggle(e.target.checked)}
                    className="w-5 h-5 accent-[#D4AF37] cursor-pointer"
                  />
                  <label htmlFor="isActive" className="text-sm font-bold text-[#2C1810] cursor-pointer">
                    Offer is Active
                  </label>
                </div>
              )}

              <div className="flex gap-4 pt-4 border-t border-[#8B7355]/20">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3.5 rounded-xl font-bold text-[#8B7355] hover:bg-[#8B7355]/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-[#2C1810] text-[#D4AF37] py-3.5 rounded-xl font-bold hover:bg-[#1a0f0a] transition-colors disabled:opacity-70 shadow-md"
                >
                  {submitting ? "Saving..." : "Save Offer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
