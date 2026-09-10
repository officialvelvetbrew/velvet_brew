import { useState, useEffect } from "react";
import { Tag, ArrowRight, Play, Pause, ChevronLeft, ChevronRight } from "lucide-react";
import { getActiveOffers, PublicOffer } from "../api/offers";

interface OfferStripProps {
  promoPrice?: number;
}

const DEFAULT_OFFERS: PublicOffer[] = [
  {
    code: "VELVET10",
    name: "Flat 10% off everything",
    description: "No minimum spend. Applied automatically at checkout for the first seven days.",
    discountType: "PERCENTAGE",
    discountValue: 10,
    minOrderAmount: 0,
  },
];

export default function OfferStrip({ promoPrice }: OfferStripProps) {
  const [offers, setOffers] = useState<PublicOffer[]>(DEFAULT_OFFERS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadOffers() {
      try {
        const fetched = await getActiveOffers();
        if (active && fetched && fetched.length > 0) {
          setOffers(fetched);
        }
      } catch (err) {
        console.warn("Failed to fetch active offers for strip, using default fallback:", err);
      }
    }
    loadOffers();
    return () => {
      active = false;
    };
  }, []);

  // Auto-play carousel
  useEffect(() => {
    if (!isPlaying || offers.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % offers.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPlaying, offers.length]);

  const currentOffer = offers[currentIndex] || offers[0] || DEFAULT_OFFERS[0];

  const nextOffer = () => {
    setCurrentIndex((prev) => (prev + 1) % offers.length);
  };

  const prevOffer = () => {
    setCurrentIndex((prev) => (prev - 1 + offers.length) % offers.length);
  };

  const scrollToMenu = () => {
    const el = document.getElementById("menu");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Helper to format heading title
  const getOfferHeadline = (off: PublicOffer) => {
    if (off.name && (off.name.toLowerCase().includes("off") || off.name.toLowerCase().includes("flat"))) {
      return off.name;
    }
    if (off.discountType === "PERCENTAGE") {
      return `Flat ${off.discountValue}% off ${off.name || "everything"}`;
    }
    return `Flat ₹${off.discountValue} off ${off.name || "your order"}`;
  };

  // Helper to format subtitle description
  const getOfferSubtitle = (off: PublicOffer) => {
    if (off.description && off.description.trim()) {
      return off.description;
    }
    if (off.minOrderAmount > 0) {
      return `Valid on minimum order of ₹${off.minOrderAmount}. Use code ${off.code} at checkout.`;
    }
    return `No minimum spend. Use coupon code ${off.code} at checkout to claim!`;
  };

  return (
    <section id="offer" className="px-4 sm:px-6 md:px-10 py-4">
      <div className="max-w-5xl mx-auto relative rounded-3xl p-6 sm:p-8 overflow-hidden shadow-2xl transition-all duration-300 border border-[#332219]"
        style={{
          background: "radial-gradient(135% 100% at 50% 0%, #2A1A12 0%, #150C08 100%)",
        }}
      >
        {/* Subtle Coffee Bean / Pattern Overlay */}
        <div 
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#D4AF37 1px, transparent 1px)`,
            backgroundSize: "20px 20px",
          }}
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6">
          
          {/* Left Content Area: Icon + Badges + Headline + Description */}
          <div className="flex items-start gap-4 sm:gap-6 flex-1">
            {/* Party Popper Icon */}
            <div className="text-4xl sm:text-5xl shrink-0 select-none animate-bounce duration-1000">
              🎉
            </div>

            <div className="space-y-2">
              {/* Badges Row */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-white/10 backdrop-blur-md text-[#E5D7C5] font-extrabold text-[10px] sm:text-[11px] uppercase tracking-widest px-3 py-1 rounded-full border border-white/10">
                  OPENING OFFER
                </span>

                <span className="bg-[#2A1C14] text-[#E8C575] font-extrabold text-[10px] sm:text-[11px] uppercase tracking-wider px-3 py-1 rounded-full border border-[#D4AF37]/30 flex items-center gap-1.5 shadow-sm">
                  <Tag size={12} className="text-[#D4AF37]" />
                  {currentOffer.code}
                </span>
              </div>

              {/* Title */}
              <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#FDFBF7] tracking-tight leading-tight">
                {getOfferHeadline(currentOffer)}
              </h2>

              {/* Description */}
              <p className="text-xs sm:text-sm text-[#C4B5A5] font-medium leading-relaxed max-w-2xl">
                {getOfferSubtitle(currentOffer)}
              </p>
            </div>
          </div>

          {/* Right Action Button */}
          <div className="shrink-0 flex items-center">
            <button
              onClick={scrollToMenu}
              className="w-full sm:w-auto bg-[#F4E5D3] hover:bg-white text-[#2C1810] font-extrabold text-sm px-6 py-3.5 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>Browse the menu</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Bottom Bar: Indicators & Controls */}
        <div className="relative z-10 flex items-center justify-between pt-4 border-t border-white/10 text-xs">
          
          {/* Indicators */}
          <div className="flex items-center gap-1.5">
            {offers.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  idx === currentIndex
                    ? "w-6 h-1.5 bg-[#E8C575]"
                    : "w-1.5 h-1.5 bg-white/20 hover:bg-white/50"
                }`}
              />
            ))}
          </div>

          {/* Controls (Play/Pause, Prev, Next) */}
          <div className="flex items-center gap-3 text-white/50">
            {offers.length > 1 && (
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="hover:text-white transition-colors p-1 rounded-full cursor-pointer"
                title={isPlaying ? "Pause auto-slide" : "Play auto-slide"}
              >
                {isPlaying ? <Pause size={13} /> : <Play size={13} />}
              </button>
            )}

            <div className="flex items-center gap-1">
              <button
                onClick={prevOffer}
                disabled={offers.length <= 1}
                className="hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors p-1 cursor-pointer"
                aria-label="Previous offer"
              >
                <ChevronLeft size={16} />
              </button>

              <button
                onClick={nextOffer}
                disabled={offers.length <= 1}
                className="hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors p-1 cursor-pointer"
                aria-label="Next offer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}