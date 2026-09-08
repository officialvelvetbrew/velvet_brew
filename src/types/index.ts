import type { LucideIcon } from "lucide-react";

export type CategoryId = "hot" | "cold" | "shakes" | "bites";

export type PaymentMethod = "upi" | "card" | "cod";

export type OrderStatus =
    | "Pending" | "Accepted" | "Preparing" | "Ready" | "Completed" | "Rejected";

export interface OrderItemRecord {
    id: string;
    name: string;
    category: CategoryId;
    price: number;
    qty: number;
}

export interface Order {
    id: string;
    customerName: string;
    phone: string;
    email?: string;
    mode: Details["mode"];
    note: string;
    items: OrderItemRecord[];
    subtotal: number;
    savings: number;
    total: number;
    paymentMethod: PaymentMethod;
    paid: boolean;
    status: OrderStatus;
    offerCode?: string;
    createdAt: string;
}

export type CheckoutStep =
    | null
    | "details"
    | "payment"
    | "success";

export interface MenuItem {
    id: string;
    name: string;
    price: number;
    description?: string;
    imageUrl?: string;
    veg?: boolean;
    available?: boolean;
    featured?: boolean;
    offerPrice?: number | null;
}

export interface Category {
    id: CategoryId;
    label: string;
    icon: LucideIcon;
    image?: string;
}

export interface CartItem {
    item: MenuItem;
    category: CategoryId;
    qty: number;
}

export interface Details {
    name: string;
    phone: string;
    email: string;
    mode: "Takeaway" | "Dine-in";
    note: string;
}

export interface FieldProps {
    icon: LucideIcon;
    placeholder: string;
    value: string;
    onChange: (value: string) => void;
}

export interface PayOptionProps {
    icon: LucideIcon;
    label: string;
    id: PaymentMethod;
    selected: PaymentMethod;
    onSelect: (id: PaymentMethod) => void;
}
export * from './inventory';
