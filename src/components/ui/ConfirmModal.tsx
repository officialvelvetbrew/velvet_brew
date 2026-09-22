import { X } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}

export default function ConfirmModal({
  isOpen,
  title = "Confirm Action",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  isDestructive = true,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold text-[#2C1810]">
              {title}
            </h2>
            <button
              onClick={onCancel}
              className="p-1 hover:bg-[#FDFBF7] rounded-full transition-colors text-[#8B7355] hover:text-[#2C1810]"
            >
              <X size={20} />
            </button>
          </div>
          
          <p className="text-[#8B7355] mb-6 whitespace-pre-wrap">
            {message}
          </p>
          
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 px-4 border border-[#e8dfd5] text-[#8B7355] font-bold rounded-xl hover:bg-[#FDFBF7] transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 py-2.5 px-4 font-bold rounded-xl transition-colors ${
                isDestructive 
                  ? "bg-red-600 text-white hover:bg-red-700" 
                  : "bg-[#D4AF37] text-[#2C1810] hover:bg-[#C5A030]"
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
