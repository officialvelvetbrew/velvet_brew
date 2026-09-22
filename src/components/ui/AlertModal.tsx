import { X } from "lucide-react";

interface AlertModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  buttonText?: string;
  onClose: () => void;
  isError?: boolean;
}

export default function AlertModal({
  isOpen,
  title,
  message,
  buttonText = "OK",
  onClose,
  isError = false,
}: AlertModalProps) {
  if (!isOpen) return null;

  const displayTitle = title || (isError ? "Error" : "Notice");

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className={`text-xl font-bold ${isError ? "text-red-600" : "text-[#2C1810]"}`}>
              {displayTitle}
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-[#FDFBF7] rounded-full transition-colors text-[#8B7355] hover:text-[#2C1810]"
            >
              <X size={20} />
            </button>
          </div>
          
          <p className="text-[#8B7355] mb-6 whitespace-pre-wrap">
            {message}
          </p>
          
          <button
            onClick={onClose}
            className={`w-full py-2.5 px-4 font-bold rounded-xl transition-colors ${
              isError 
                ? "bg-red-600 text-white hover:bg-red-700" 
                : "bg-[#D4AF37] text-[#2C1810] hover:bg-[#C5A030]"
            }`}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}
