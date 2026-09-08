import { X, Plus, Minus, Tag, Trash2, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { COLORS } from "../data/colors";
import { rupee } from "../utils/currency";

import type {
    CartItem,
    CategoryId,
    MenuItem,
} from "../types";

interface CartDrawerProps {
    open: boolean;
    cart: Record<string, CartItem>;
    total: number;
    savings: number;
    onClose: () => void;
    changeQty: (id: string, delta: number) => void;
    priceFor: (category: CategoryId, item: MenuItem) => number;
    onCheckout: () => void;
    appliedOffer?: any;
    promoError?: string | null;
    validatingPromo?: boolean;
    onApplyPromo?: (code: string) => void;
    onRemovePromo?: () => void;
}

const CHANNELS = [
    { id: 'dine_in', label: 'Dine-in' },
    { id: 'takeaway', label: 'Takeaway' },
];

export default function CartDrawer({
    open,
    cart,
    total,
    savings,
    onClose,
    changeQty,
    priceFor,
    onCheckout,
    appliedOffer,
    promoError,
    validatingPromo,
    onApplyPromo,
    onRemovePromo,
}: CartDrawerProps) {
    const [channel, setChannel] = useState('dine_in');
    const [promoCode, setPromoCode] = useState('');

    if (!open) return null;

    const cartLines = Object.values(cart);
    const itemCount = cartLines.reduce((acc, line) => acc + line.qty, 0);

    const handleApplyPromo = () => {
        if (onApplyPromo && promoCode.trim()) {
            onApplyPromo(promoCode);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex justify-end">
            <div
                className="absolute inset-0"
                style={{ background: "rgba(0,0,0,0.6)" }}
                onClick={onClose}
            />

            <div
                className="relative w-full max-w-[440px] h-full flex flex-col bg-[#fdfbf7]"
            >
                {/* Header */}
                <div className="flex justify-between items-start p-5 shrink-0 border-b border-[#f3eee7]">
                    <div>
                        <h2 className="text-xl font-bold text-[#2C1810]">Your order</h2>
                        <p className="text-[#8B7355] text-[13px]">
                            {itemCount} item{itemCount === 1 ? '' : 's'} · {CHANNELS.find(c => c.id === channel)?.label}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-[#8B7355] hover:text-[#2C1810] transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Cart Body */}
                <div className="flex-1 overflow-y-auto vb-scrollbar p-5 space-y-6">
                    {cartLines.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                            <div className="h-14 w-14 rounded-full bg-[#f3eee7] flex items-center justify-center text-[#8B7355]">
                                <ShoppingBag size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-[#2C1810] text-[15px]">Your cart is empty</h3>
                                <p className="text-[#8B7355] text-[13px] mt-1 max-w-[200px] mx-auto">
                                    Add a cup — or three — and your order summary will appear here.
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    onClose();
                                    document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="mt-2 rounded-xl px-5 py-2.5 text-[13px] font-semibold text-[#2C1810] border border-[#e8dfd5] transition-colors hover:bg-[#f3eee7]"
                            >
                                Browse the menu
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Channel Selection */}
                            <div>
                                <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#8B7355]">
                                    How would you like it?
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                    {CHANNELS.map((c) => (
                                        <button
                                            key={c.id}
                                            onClick={() => setChannel(c.id)}
                                            className={`rounded-xl border px-2 py-2.5 text-[12.5px] font-semibold transition-all ${
                                                channel === c.id
                                                    ? 'border-[#2C1810] bg-[#2C1810] text-[#fdfbf7]'
                                                    : 'border-[#e8dfd5] bg-white text-[#8B7355] hover:border-[#d4c5b0]'
                                            }`}
                                        >
                                            {c.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Lines */}
                            <div className="space-y-3">
                                {cartLines.map((line) => {
                                    const unitPrice = priceFor(line.category, line.item);
                                    return (
                                        <div
                                            key={line.item.id}
                                            className="flex gap-3 overflow-hidden rounded-2xl border border-[#e8dfd5] bg-white p-3 shadow-sm"
                                        >
                                            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#fdfbf7] text-xl border border-[#f3eee7]">
                                                ☕
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-start justify-between gap-2">
                                                    <h4 className="truncate text-[14px] font-bold text-[#2C1810]">
                                                        {line.item.name}
                                                    </h4>
                                                    <button
                                                        onClick={() => changeQty(line.item.id, -line.qty)}
                                                        className="-mr-1 -mt-0.5 shrink-0 rounded-lg p-1 text-[#8B7355] transition-colors hover:bg-red-50 hover:text-red-500"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>

                                                <div className="mt-3 flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-3 rounded-full border border-[#e8dfd5] px-2 py-1">
                                                        <button
                                                            onClick={() => changeQty(line.item.id, -1)}
                                                            className="text-[#8B7355] hover:text-[#2C1810]"
                                                        >
                                                            <Minus size={12} />
                                                        </button>
                                                        <span className="text-[13px] font-bold w-4 text-center text-[#2C1810]">
                                                            {line.qty}
                                                        </span>
                                                        <button
                                                            onClick={() => changeQty(line.item.id, 1)}
                                                            className="text-[#8B7355] hover:text-[#2C1810]"
                                                        >
                                                            <Plus size={12} />
                                                        </button>
                                                    </div>
                                                    <span className="font-display text-[15px] font-bold text-[#2C1810]">
                                                        {rupee(unitPrice * line.qty)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Promo */}
                            <div className="rounded-2xl border border-[#e8dfd5] bg-white p-3.5 shadow-sm">
                                <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#8B7355]">
                                    <Tag size={14} /> Promo code
                                </p>
                                {appliedOffer ? (
                                    <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-[#10b981]/40 bg-[#10b981]/10 px-3 py-2.5">
                                        <div className="min-w-0">
                                            <p className="text-[13px] font-bold text-[#10b981]">{appliedOffer.code}</p>
                                            <p className="text-[11.5px] text-[#8B7355]">
                                                You saved {rupee(appliedOffer.discountAmount)}
                                            </p>
                                        </div>
                                        <button 
                                            onClick={onRemovePromo}
                                            className="p-1.5 text-[#10b981] hover:bg-[#10b981]/20 rounded-lg transition-colors shrink-0"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <input
                                            value={promoCode}
                                            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                            placeholder="Enter code"
                                            className="h-10 flex-1 rounded-xl border border-[#e8dfd5] px-3 text-[13px] outline-none focus:border-[#d4c5b0] uppercase tracking-wider text-[#2C1810]"
                                        />
                                        <button 
                                            onClick={handleApplyPromo}
                                            disabled={validatingPromo || !promoCode.trim()}
                                            className="h-10 shrink-0 rounded-xl bg-[#2C1810] px-4 text-[13px] font-semibold text-[#fdfbf7] hover:bg-[#1a0f0a] transition-colors disabled:opacity-70"
                                        >
                                            {validatingPromo ? "..." : "Apply"}
                                        </button>
                                    </div>
                                )}
                                {promoError && !appliedOffer && (
                                    <p className="text-red-500 text-xs mt-2 font-medium px-1">{promoError}</p>
                                )}
                            </div>

                            {/* Bill Summary */}
                            <div className="rounded-2xl border border-[#e8dfd5] bg-white p-4 shadow-sm space-y-2 text-[13px]">
                                <div className="flex justify-between text-[#2C1810]">
                                    <span>Item total</span>
                                    <span className="font-medium">{rupee(total + savings)}</span>
                                </div>
                                {appliedOffer && (
                                    <div className="flex justify-between text-[#10b981]">
                                        <span>Offer applied <span className="text-[10px] uppercase ml-1 opacity-70">{appliedOffer.code}</span></span>
                                        <span className="font-medium">- {rupee(appliedOffer.discountAmount)}</span>
                                    </div>
                                )}
                                <div className="border-t border-dashed border-[#e8dfd5] my-2 pt-2 flex justify-between font-bold text-[16px] text-[#2C1810]">
                                    <span>TO PAY</span>
                                    <span>{rupee(total)}</span>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                {cartLines.length > 0 && (
                    <div className="p-5 border-t border-[#f3eee7] bg-white shrink-0 space-y-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                        <div className="flex items-center justify-between">
                            <span className="text-[13px] text-[#8B7355]">Total payable</span>
                            <span className="font-display text-xl font-bold text-[#2C1810]">
                                {rupee(total)}
                            </span>
                        </div>
                        <button
                            onClick={onCheckout}
                            className="w-full rounded-xl py-3.5 text-[14px] font-bold tracking-wide transition-colors"
                            style={{
                                background: COLORS.gold,
                                color: COLORS.espresso,
                            }}
                        >
                            Proceed to checkout
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}