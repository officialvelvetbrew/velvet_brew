import { useState, useEffect, useMemo, useRef } from "react";
import { 
  getMenu, 
  getCategories, 
  createMenuItem, 
  updateMenuItem, 
  createCategory, 
  updateCategory, 
  uploadMenuImage, 
  replaceMenuItemImage, 
  getPublicImageUrl, 
  ApiMenuItem, 
  ApiCategory 
} from "../../api/menu";
import { Search, Plus, Edit2, Package, Tag, Check, X, Upload, Camera, Loader2, Trash2 } from "lucide-react";

type Tab = "items" | "categories";

export default function MenuPricingView() {
  const [tab, setTab] = useState<Tab>("items");
  const [items, setItems] = useState<ApiMenuItem[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [query, setQuery] = useState("");
  const [filterCat, setFilterCat] = useState<string>("all");
  const [uploadingItemId, setUploadingItemId] = useState<number | null>(null);

  // Modals state
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ApiMenuItem | null>(null);
  
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<ApiCategory | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [fetchedItems, fetchedCats] = await Promise.all([getMenu(), getCategories()]);
      setItems(fetchedItems);
      setCategories(fetchedCats);
    } catch (err) {
      console.error("Failed to load menu data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDirectImageUpload = async (itemId: number, file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size exceeds 5 MB. Please choose a smaller file.");
      return;
    }
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(jpe?g|png|webp)$/i)) {
      alert("Invalid format. Please select JPEG, PNG, or WebP.");
      return;
    }

    setUploadingItemId(itemId);
    try {
      await replaceMenuItemImage(itemId, file);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to upload image");
    } finally {
      setUploadingItemId(null);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(query.toLowerCase());
      const matchesCat = filterCat === "all" || item.categoryId.toString() === filterCat;
      return matchesSearch && matchesCat;
    });
  }, [items, query, filterCat]);

  return (
    <div className="flex-1 p-4 md:p-6 h-full overflow-y-auto bg-[#FDFBF7] vb-scrollbar pb-24 md:pb-6 relative">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header & Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex gap-2 p-1 bg-white border border-[#e8dfd5] rounded-xl self-start">
            <button
              onClick={() => setTab("items")}
              className={`px-4 py-2 rounded-lg text-[13px] font-bold transition-all ${
                tab === "items" ? "bg-[#2C1810] text-[#FDFBF7]" : "text-[#8B7355] hover:bg-[#e8dfd5]"
              }`}
            >
              Menu Items
            </button>
            <button
              onClick={() => setTab("categories")}
              className={`px-4 py-2 rounded-lg text-[13px] font-bold transition-all ${
                tab === "categories" ? "bg-[#2C1810] text-[#FDFBF7]" : "text-[#8B7355] hover:bg-[#e8dfd5]"
              }`}
            >
              Categories
            </button>
          </div>
          
          {tab === "items" ? (
            <button
              onClick={() => { setEditingItem(null); setIsItemModalOpen(true); }}
              className="flex items-center justify-center gap-2 bg-[#D4AF37] text-[#2C1810] px-4 py-2 rounded-xl text-[13px] font-bold shadow-sm hover:bg-[#c4a130] transition-colors"
            >
              <Plus size={16} /> New Item
            </button>
          ) : (
            <button
              onClick={() => { setEditingCat(null); setIsCatModalOpen(true); }}
              className="flex items-center justify-center gap-2 bg-[#D4AF37] text-[#2C1810] px-4 py-2 rounded-xl text-[13px] font-bold shadow-sm hover:bg-[#c4a130] transition-colors"
            >
              <Plus size={16} /> New Category
            </button>
          )}
        </div>

        {loading ? (
          <div className="py-20 text-center text-[#8B7355] font-semibold">Loading data...</div>
        ) : (
          <>
            {/* ITEMS TAB */}
            {tab === "items" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B7355]" />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search items..."
                      className="w-full bg-white border border-[#e8dfd5] pl-10 pr-4 py-2.5 rounded-xl text-[14px] text-[#2C1810] focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                    />
                  </div>
                  <select
                    value={filterCat}
                    onChange={(e) => setFilterCat(e.target.value)}
                    className="bg-white border border-[#e8dfd5] px-4 py-2.5 rounded-xl text-[14px] text-[#2C1810] font-medium focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id.toString()}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredItems.map(item => (
                    <div key={item.id} className="bg-white border border-[#e8dfd5] rounded-3xl overflow-hidden flex flex-col shadow-sm">
                      <div className="h-32 bg-[#2C1810] relative group overflow-hidden">
                        {item.imageUrl ? (
                          <img 
                            src={getPublicImageUrl(item.imageUrl)} 
                            alt={item.name} 
                            className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-3xl opacity-50">☕</div>
                        )}
                        {!item.available && (
                          <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest shadow-sm z-10">
                            Unavailable
                          </div>
                        )}
                        {/* Quick S3 Image Upload Overlay */}
                        <label 
                          title="Click to replace image directly"
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white gap-1 z-10"
                        >
                          {uploadingItemId === item.id ? (
                            <>
                              <Loader2 size={20} className="animate-spin text-[#D4AF37]" />
                              <span className="text-[11px] font-bold">Uploading to S3...</span>
                            </>
                          ) : (
                            <>
                              <Camera size={20} className="text-[#D4AF37]" />
                              <span className="text-[11px] font-bold">Change Image</span>
                              <span className="text-[9px] text-[#e8dfd5]">Max 5 MB (S3)</span>
                            </>
                          )}
                          <input 
                            type="file" 
                            accept="image/jpeg,image/png,image/webp" 
                            className="hidden" 
                            disabled={uploadingItemId === item.id}
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleDirectImageUpload(item.id, f);
                              e.target.value = "";
                            }}
                          />
                        </label>
                      </div>
                      <div className="p-4 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-bold text-[15px] text-[#2C1810] leading-tight flex-1 pr-2">{item.name}</h3>
                          <span className="text-[10px] font-semibold bg-[#fdfbf7] border border-[#e8dfd5] px-2 py-0.5 rounded-lg text-[#8B7355] shrink-0">
                            {categories.find(c => c.id === item.categoryId)?.name || item.categoryName || "Unknown"}
                          </span>
                        </div>
                        <p className="text-[12px] text-[#8B7355] line-clamp-2 mb-3 flex-1">{item.description || "No description."}</p>
                        
                        <div className="flex items-center justify-between border-t border-[#e8dfd5] pt-3 mt-auto">
                          <div>
                            <span className="font-display font-bold text-[16px] text-[#2C1810]">
                              ₹{item.offerPrice !== null && item.offerPrice !== undefined ? item.offerPrice : item.price}
                            </span>
                            {item.offerPrice !== null && item.offerPrice !== undefined && item.offerPrice < item.price && (
                              <span className="ml-1.5 text-[11px] text-[#8B7355] line-through">₹{item.price}</span>
                            )}
                          </div>
                          <button
                            onClick={() => { setEditingItem(item); setIsItemModalOpen(true); }}
                            className="p-1.5 text-[#8B7355] hover:text-[#2C1810] hover:bg-[#e8dfd5] rounded-lg transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredItems.length === 0 && (
                    <div className="col-span-full py-10 text-center text-[#8B7355] border-2 border-dashed border-[#e8dfd5] rounded-3xl">
                      No items found.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CATEGORIES TAB */}
            {tab === "categories" && (
              <div className="bg-white border border-[#e8dfd5] rounded-3xl overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead className="bg-[#fdfbf7] border-b border-[#e8dfd5]">
                    <tr>
                      <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-[#8B7355]">Category Name</th>
                      <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-[#8B7355]">Description</th>
                      <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-[#8B7355]">Status</th>
                      <th className="px-5 py-4 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e8dfd5]">
                    {categories.map((c) => (
                      <tr key={c.id} className="hover:bg-[#fdfbf7]/50 transition-colors">
                        <td className="px-5 py-4 text-[14px] font-bold text-[#2C1810]">{c.name}</td>
                        <td className="px-5 py-4 text-[13px] text-[#8B7355]">{c.description || "-"}</td>
                        <td className="px-5 py-4">
                          {c.active ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                              <Check size={12} /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                              <X size={12} /> Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => { setEditingCat(c); setIsCatModalOpen(true); }}
                            className="inline-flex items-center justify-center p-2 text-[#8B7355] hover:text-[#2C1810] hover:bg-[#e8dfd5] rounded-xl transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {categories.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-5 py-10 text-center text-[#8B7355]">No categories found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      <ItemModal 
        isOpen={isItemModalOpen} 
        onClose={() => setIsItemModalOpen(false)} 
        item={editingItem} 
        categories={categories}
        onSave={loadData}
      />

      <CategoryModal 
        isOpen={isCatModalOpen} 
        onClose={() => setIsCatModalOpen(false)} 
        category={editingCat} 
        onSave={loadData}
      />
    </div>
  );
}

// ------------------------------------------------------------
// MODALS
// ------------------------------------------------------------

function ItemModal({ isOpen, onClose, item, categories, onSave }: { isOpen: boolean; onClose: () => void; item: ApiMenuItem | null; categories: ApiCategory[]; onSave: () => void; }) {
  const [formData, setFormData] = useState<Partial<ApiMenuItem>>({
    categoryId: categories.length > 0 ? categories[0].id : 0,
    name: "",
    description: "",
    price: 0,
    offerPrice: null,
    imageUrl: "",
    veg: true,
    available: true,
    featured: false,
    displayOrder: 1,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [showManualUrl, setShowManualUrl] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (item) {
        setFormData({ ...item });
        setPreviewUrl(getPublicImageUrl(item.imageUrl));
        setShowManualUrl(Boolean(item.imageUrl && !item.imageUrl.includes("amazonaws.com") && !item.imageUrl.startsWith("s3://")));
      } else {
        setFormData({
          categoryId: categories.length > 0 ? categories[0].id : 0,
          name: "",
          description: "",
          price: 0,
          offerPrice: null,
          imageUrl: "",
          veg: true,
          available: true,
          featured: false,
          displayOrder: 1,
        });
        setPreviewUrl("");
        setShowManualUrl(false);
      }
      setSelectedFile(null);
      setError(null);
    }
  }, [isOpen, item, categories]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size exceeds 5 MB. Please select a smaller image.");
      return;
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(jpe?g|png|webp)$/i)) {
      setError("Invalid file format. Please upload JPEG, PNG, or WebP.");
      return;
    }

    setError(null);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) return setError("Name is required");
    if (!formData.categoryId) return setError("Category is required");
    
    setSubmitting(true);
    setError(null);
    try {
      let finalImageUrl = formData.imageUrl || "";

      // Upload image to S3 if a new file was chosen
      if (selectedFile) {
        if (item?.id) {
          // Replaces image in S3, attaches to item, and removes old S3 image
          const updatedWithImg = await replaceMenuItemImage(item.id, selectedFile);
          finalImageUrl = updatedWithImg.imageUrl || finalImageUrl;
        } else {
          // Upload to S3 and get public URL for new item
          finalImageUrl = await uploadMenuImage(selectedFile);
        }
      }

      const payload = {
        ...formData,
        imageUrl: finalImageUrl,
        displayOrder: formData.displayOrder ?? item?.displayOrder ?? 0,
      };
      
      console.log("Submitting Menu Item Payload:", payload);
      
      if (item) {
        await updateMenuItem({ ...payload, id: item.id } as any);
      } else {
        await createMenuItem(payload as any);
      }
      onSave();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save item");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-full">
        <div className="px-6 py-4 border-b border-[#e8dfd5] flex justify-between items-center bg-[#FDFBF7]">
          <h2 className="font-display text-[18px] font-bold text-[#2C1810]">
            {item ? "Edit Menu Item" : "New Menu Item"}
          </h2>
          <button onClick={onClose} className="p-1 text-[#8B7355] hover:bg-[#e8dfd5] rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 vb-scrollbar">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-[13px] font-medium">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block text-[12px] font-bold uppercase tracking-wider text-[#8B7355] mb-1.5">Name</label>
              <input 
                type="text" required
                value={formData.name || ""} 
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full bg-white border border-[#e8dfd5] px-4 py-2.5 rounded-xl text-[14px] text-[#2C1810] focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-bold uppercase tracking-wider text-[#8B7355] mb-1.5">Category</label>
                <select 
                  required
                  value={formData.categoryId || ""}
                  onChange={(e) => setFormData({...formData, categoryId: Number(e.target.value)})}
                  className="w-full bg-white border border-[#e8dfd5] px-4 py-2.5 rounded-xl text-[14px] text-[#2C1810] focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="" disabled>Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-bold uppercase tracking-wider text-[#8B7355] mb-1.5">Display Order</label>
                <input 
                  type="number" required min="1"
                  value={formData.displayOrder || 1} 
                  onChange={(e) => setFormData({...formData, displayOrder: Number(e.target.value)})}
                  className="w-full bg-white border border-[#e8dfd5] px-4 py-2.5 rounded-xl text-[14px] text-[#2C1810] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-bold uppercase tracking-wider text-[#8B7355] mb-1.5">Description</label>
              <textarea 
                rows={2}
                value={formData.description || ""} 
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full bg-white border border-[#e8dfd5] px-4 py-2.5 rounded-xl text-[14px] text-[#2C1810] focus:outline-none focus:border-[#D4AF37] resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-bold uppercase tracking-wider text-[#8B7355] mb-1.5">Regular Price (₹)</label>
                <input 
                  type="number" required min="0" step="0.01"
                  value={formData.price || 0} 
                  onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                  className="w-full bg-white border border-[#e8dfd5] px-4 py-2.5 rounded-xl text-[14px] text-[#2C1810] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="block text-[12px] font-bold uppercase tracking-wider text-[#8B7355] mb-1.5">Offer Price (₹)</label>
                <input 
                  type="number" min="0" step="0.01"
                  value={formData.offerPrice === null ? "" : formData.offerPrice} 
                  onChange={(e) => setFormData({...formData, offerPrice: e.target.value ? Number(e.target.value) : null})}
                  placeholder="Optional"
                  className="w-full bg-white border border-[#e8dfd5] px-4 py-2.5 rounded-xl text-[14px] text-[#2C1810] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>

            {/* S3 Image Upload Area */}
            <div>
              <label className="block text-[12px] font-bold uppercase tracking-wider text-[#8B7355] mb-1.5 flex items-center justify-between">
                <span>Item Photo</span>
                <span className="text-[10px] text-[#8B7355]/80 font-normal">JPEG, PNG, WebP · Max 5 MB</span>
              </label>

              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/jpeg,image/png,image/webp" 
                className="hidden" 
                onChange={handleFileChange}
              />

              {previewUrl ? (
                <div className="relative border border-[#e8dfd5] rounded-2xl overflow-hidden bg-[#2C1810] flex items-center gap-4 p-3 shadow-sm">
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-black/40 shrink-0 border border-white/10">
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                      onError={() => setPreviewUrl("")}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-white truncate">
                      {selectedFile ? selectedFile.name : (item?.name || "Current item photo")}
                    </p>
                    <p className="text-[11px] text-[#e8dfd5]/70 mt-0.5">
                      {selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB · Ready to upload to S3` : "Stored on Velvet Brew S3"}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1 bg-[#D4AF37] hover:bg-[#c4a130] text-[#2C1810] text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Camera size={13} /> Change
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null);
                          setPreviewUrl("");
                          setFormData({ ...formData, imageUrl: "" });
                        }}
                        className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-[#e8dfd5] text-[11px] font-medium rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 size={12} /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#e8dfd5] hover:border-[#D4AF37] rounded-2xl p-5 text-center cursor-pointer transition-all bg-[#fdfbf7] hover:bg-white flex flex-col items-center justify-center gap-2 group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#f4ede4] group-hover:bg-[#D4AF37]/20 flex items-center justify-center text-[#8B7355] group-hover:text-[#2C1810] transition-colors">
                    <Upload size={18} />
                  </div>
                  <div>
                    <span className="text-[13px] font-bold text-[#2C1810] block">Click to upload photo</span>
                    <span className="text-[11px] text-[#8B7355]">Uploads directly to Velvet Brew S3 (JPEG, PNG, WebP)</span>
                  </div>
                </div>
              )}

              {/* Optional manual URL toggle */}
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowManualUrl(!showManualUrl)}
                  className="text-[11px] text-[#8B7355] hover:text-[#2C1810] underline cursor-pointer"
                >
                  {showManualUrl ? "Hide manual URL input" : "Or enter image URL manually"}
                </button>
              </div>

              {showManualUrl && (
                <input 
                  type="text"
                  value={formData.imageUrl || ""} 
                  onChange={(e) => {
                    setFormData({...formData, imageUrl: e.target.value});
                    setPreviewUrl(e.target.value);
                  }}
                  placeholder="https://example.com/image.jpg"
                  className="mt-1.5 w-full bg-white border border-[#e8dfd5] px-3.5 py-2 rounded-xl text-[13px] text-[#2C1810] focus:outline-none focus:border-[#D4AF37]"
                />
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <label className="flex items-center gap-2 cursor-pointer bg-[#fdfbf7] border border-[#e8dfd5] p-3 rounded-xl hover:border-[#D4AF37] transition-colors">
                <input 
                  type="checkbox" 
                  checked={formData.available ?? true}
                  onChange={(e) => setFormData({...formData, available: e.target.checked})}
                  className="w-4 h-4 text-[#D4AF37] rounded focus:ring-[#D4AF37]"
                />
                <span className="text-[13px] font-bold text-[#2C1810]">Available</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer bg-[#fdfbf7] border border-[#e8dfd5] p-3 rounded-xl hover:border-[#D4AF37] transition-colors">
                <input 
                  type="checkbox" 
                  checked={formData.veg ?? true}
                  onChange={(e) => setFormData({...formData, veg: e.target.checked})}
                  className="w-4 h-4 text-[#D4AF37] rounded focus:ring-[#D4AF37]"
                />
                <span className="text-[13px] font-bold text-[#2C1810]">Veg</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer bg-[#fdfbf7] border border-[#e8dfd5] p-3 rounded-xl hover:border-[#D4AF37] transition-colors">
                <input 
                  type="checkbox" 
                  checked={formData.featured ?? false}
                  onChange={(e) => setFormData({...formData, featured: e.target.checked})}
                  className="w-4 h-4 text-[#D4AF37] rounded focus:ring-[#D4AF37]"
                />
                <span className="text-[13px] font-bold text-[#2C1810]">Featured</span>
              </label>
            </div>
          </div>
          
          <div className="pt-4 border-t border-[#e8dfd5] flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl font-bold text-[14px] text-[#8B7355] hover:bg-[#e8dfd5] transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="px-5 py-2.5 rounded-xl font-bold text-[14px] bg-[#D4AF37] text-[#2C1810] hover:bg-[#c4a130] shadow-sm transition-colors disabled:opacity-50">
              {submitting ? "Saving..." : "Save Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CategoryModal({ isOpen, onClose, category, onSave }: { isOpen: boolean; onClose: () => void; category: ApiCategory | null; onSave: () => void; }) {
  const [formData, setFormData] = useState<Partial<ApiCategory>>({
    name: "",
    description: "",
    active: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (category) {
        setFormData({ ...category });
      } else {
        setFormData({
          name: "",
          description: "",
          active: true,
        });
      }
      setError(null);
    }
  }, [isOpen, category]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) return setError("Name is required");
    
    setSubmitting(true);
    setError(null);
    try {
      if (category) {
        await updateCategory({ ...formData, id: category.id } as any);
      } else {
        await createCategory(formData as any);
      }
      onSave();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save category");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-[#e8dfd5] flex justify-between items-center bg-[#FDFBF7]">
          <h2 className="font-display text-[18px] font-bold text-[#2C1810]">
            {category ? "Edit Category" : "New Category"}
          </h2>
          <button onClick={onClose} className="p-1 text-[#8B7355] hover:bg-[#e8dfd5] rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-[13px] font-medium">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block text-[12px] font-bold uppercase tracking-wider text-[#8B7355] mb-1.5">Name</label>
              <input 
                type="text" required
                value={formData.name || ""} 
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full bg-white border border-[#e8dfd5] px-4 py-2.5 rounded-xl text-[14px] text-[#2C1810] focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label className="block text-[12px] font-bold uppercase tracking-wider text-[#8B7355] mb-1.5">Description</label>
              <textarea 
                rows={2}
                value={formData.description || ""} 
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full bg-white border border-[#e8dfd5] px-4 py-2.5 rounded-xl text-[14px] text-[#2C1810] focus:outline-none focus:border-[#D4AF37] resize-none"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer bg-[#fdfbf7] border border-[#e8dfd5] p-3 rounded-xl hover:border-[#D4AF37] transition-colors">
              <input 
                type="checkbox" 
                checked={formData.active ?? true}
                onChange={(e) => setFormData({...formData, active: e.target.checked})}
                className="w-4 h-4 text-[#D4AF37] rounded focus:ring-[#D4AF37]"
              />
              <span className="text-[13px] font-bold text-[#2C1810]">Active</span>
            </label>
          </div>
          
          <div className="pt-4 border-t border-[#e8dfd5] flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl font-bold text-[14px] text-[#8B7355] hover:bg-[#e8dfd5] transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="px-5 py-2.5 rounded-xl font-bold text-[14px] bg-[#D4AF37] text-[#2C1810] hover:bg-[#c4a130] shadow-sm transition-colors disabled:opacity-50">
              {submitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
