import { useState } from "react";
import { ChevronDown, ChevronUp, Phone, MapPin, Smartphone, CreditCard, Wallet, CheckCircle2, XCircle } from "lucide-react";
import { COLORS } from "../../data/colors";
import { rupee } from "../../utils/currency";
import StatusBadge from "./StatusBadge";
import type { Order, OrderStatus, PaymentMethod } from "../../types";

const PAY_ICON: Record<PaymentMethod, typeof Smartphone> = {
  upi: Smartphone,
  card: CreditCard,
  cod: Wallet,
};

const PAY_LABEL: Record<PaymentMethod, string> = {
  upi: "UPI",
  card: "Card",
  cod: "Cash on pickup",
};

const NEXT_STEP: Partial<Record<OrderStatus, { label: string; next: OrderStatus }>> = {
  Pending: { label: "Accept", next: "Accepted" },
  Accepted: { label: "Start Preparing", next: "Preparing" },
  Preparing: { label: "Mark Ready", next: "Ready" },
  Ready: { label: "Complete", next: "Completed" },
};

function timeAgo(iso: string): string {
  if (!iso) return "just now";
  const cleanIso = iso.endsWith("Z") || iso.includes("+") || (iso.includes("-") && iso.lastIndexOf("-") > 7)
    ? iso
    : iso + "Z";
  const diffMs = Date.now() - new Date(cleanIso).getTime();
  const mins = Math.max(0, Math.round(diffMs / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  return `${hrs} hr ago`;
}

interface OrderCardProps {
  order: Order;
  onStatusChange: (id: string, status: OrderStatus) => void;
}

export default function OrderCard({ order, onStatusChange }: OrderCardProps) {
  const [expanded, setExpanded] = useState(false);
  const PayIcon = PAY_ICON[order.paymentMethod];
  const nextStep = NEXT_STEP[order.status];
  const isTerminal = order.status === "Completed" || order.status === "Rejected";

  return (
    <div className="rounded-xl p-5 vb-ring" style={{ background: COLORS.umber }}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="vb-display text-lg" style={{ color: COLORS.cream }}>{order.customerName || "Guest"}</p>
            <span className="text-xs" style={{ color: COLORS.muted }}>#{order.id}</span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: COLORS.muted }}>
            <span className="flex items-center gap-1"><Phone size={12} /> {order.phone}</span>
            <span>{order.mode}</span>
            <span>{timeAgo(order.createdAt)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          <StatusBadge status={order.status} />
          <span
            className="text-[11px] uppercase tracking-wide rounded-full px-2.5 py-1 flex items-center gap-1.5"
            style={{
              color: COLORS.success,
              border: `1px solid ${COLORS.success}`,
            }}
          >
            {order.paymentMethod === "upi" || order.paymentMethod === "card" ? <CheckCircle2 size={12} /> : <Wallet size={12} />}
            {order.paymentMethod === "upi" || order.paymentMethod === "card" ? "UPI/CARD" : "CASH"}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4">
        <button
          onClick={() => setExpanded((e) => !e)}
          className="flex items-center gap-1 text-xs"
          style={{ color: COLORS.gold }}
        >
          {order.items.reduce((s, i) => s + i.qty, 0)} item(s) · {rupee(order.total)}
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        <span className="flex items-center gap-1 text-xs" style={{ color: COLORS.muted }}>
          <PayIcon size={13} />{" "}
          {order.paid
            ? "Paid"
            : order.paymentMethod === "cod"
              ? "Cash on Delivery"
              : PAY_LABEL[order.paymentMethod]}
        </span>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 space-y-1.5" style={{ borderTop: `1px solid ${COLORS.line}` }}>
          {order.items.map((it) => (
            <div key={it.id} className="flex justify-between text-sm">
              <span style={{ color: COLORS.cream }}>{it.name} × {it.qty}</span>
              <span style={{ color: COLORS.gold }}>{rupee(it.price * it.qty)}</span>
            </div>
          ))}
          {order.savings > 0 && (
            <div className="flex justify-between text-xs" style={{ color: COLORS.gold }}>
              <span>Offer savings</span>
              <span>-{rupee(order.savings)}</span>
            </div>
          )}
          {order.note && (
            <p className="flex items-center gap-1.5 text-xs mt-2" style={{ color: COLORS.muted }}>
              <MapPin size={12} /> {order.note}
            </p>
          )}
        </div>
      )}

      {!isTerminal && (
        <div className="flex items-center gap-2 mt-4">
          {nextStep && (
            <button
              onClick={() => onStatusChange(order.id, nextStep.next)}
              className="flex-1 rounded-full py-2 text-sm tracking-wide"
              style={{ background: COLORS.gold, color: COLORS.espresso }}
            >
              {nextStep.label}
            </button>
          )}
          {order.status === "Pending" && (
            <button
              onClick={() => onStatusChange(order.id, "Rejected")}
              className="rounded-full py-2 px-4 text-sm"
              style={{ border: `1px solid ${COLORS.danger}`, color: COLORS.danger }}
            >
              Reject
            </button>
          )}
        </div>
      )}
    </div>
  );
}
