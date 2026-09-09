import type { Order, OrderStatus, CategoryId, PaymentMethod } from "../types";
import { SAMPLE_ORDERS } from "../data/sampleOrders";
import { getAuthToken, logout } from "../services/adminAuth";

/**
 * ---------------------------------------------------------------
 * ORDERS API — single place the whole app talks to for order data.
 *
 * Right now USE_MOCK is true, so everything is read/written to
 * localStorage (so the admin page + checkout flow are fully
 * demoable without a server). Every function already has the real
 * fetch() call written and commented out below the mock branch —
 * once the backend team's endpoints are ready:
 *
 * 
 *   1. Set VITE_API_BASE_URL in your .env (or edit API_BASE below)
 *   2. Flip USE_MOCK to false
 *   3. Confirm the response shapes below match your API and adjust
 *      the `.json()` mapping if needed
 * ---------------------------------------------------------------
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? "https://api.velvetbrew.in/api/v1" : "/api/v1");

console.log("MODE:", import.meta.env.MODE);
console.log("VITE_API_BASE_URL:", import.meta.env.VITE_API_BASE_URL);
console.log("API_BASE:", API_BASE);

// TODO(backend): flip to false once real endpoints are live.
const USE_MOCK = false;

const STORAGE_KEY = "vb_orders";

function readStore(): Order[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as Order[];
    } catch {
      // fall through to reseed on corrupt data
    }
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_ORDERS));
  return SAMPLE_ORDERS;
}

function writeStore(orders: Order[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  // lets other tabs (e.g. an admin tab open alongside the customer tab)
  // know data changed, since the native `storage` event doesn't fire
  // in the same tab that made the write.
  window.dispatchEvent(new CustomEvent("vb-orders-updated"));
}

const PM_STORAGE_KEY = "vb_order_pm_map";

function getLocalPmMap(): Record<string, PaymentMethod> {
  try {
    const raw = localStorage.getItem(PM_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveLocalPm(orderId: string, method: PaymentMethod): void {
  if (!orderId) return;
  try {
    const map = getLocalPmMap();
    map[orderId] = method;
    localStorage.setItem(PM_STORAGE_KEY, JSON.stringify(map));
  } catch (e) {
    console.error("Failed to save local PM", e);
  }
}

function mapBackendOrderToFrontend(o: any): Order {
  const customerName = o.customer?.fullName || o.customerName || o.fullName || "";
  const phone = o.customer?.mobile || o.mobile || o.phone || "";
  const email = o.customer?.email || o.email || "";

  const items = Array.isArray(o.items)
    ? o.items.map((item: any) => {
      const qty = item.quantity !== undefined ? item.quantity : (item.qty !== undefined ? item.qty : 1);
      const name = item.menuName || item.name || `Item #${item.menuId || item.menuItemId}`;

      let category: CategoryId = "hot";
      const lowerName = name.toLowerCase();
      if (lowerName.includes("pasta") || lowerName.includes("sandwich") || lowerName.includes("fries")) {
        category = "bites";
      } else if (lowerName.includes("shake")) {
        category = "shakes";
      } else if (lowerName.includes("cold") || lowerName.includes("frappe")) {
        category = "cold";
      }

      const price = item.unitPrice || item.price || 0;

      return {
        id: String(item.menuId || item.menuItemId || item.id || Math.random()),
        name,
        category,
        price,
        qty,
      };
    })
    : [];

  let status: OrderStatus = "Pending";
  if (o.orderStatus) {
    const s = o.orderStatus.toUpperCase();
    if (s === "ACCEPTED") status = "Accepted";
    else if (s === "PREPARING") status = "Preparing";
    else if (s === "READY") status = "Ready";
    else if (s === "COMPLETED") status = "Completed";
    else if (s === "REJECTED") status = "Rejected";
  }

  const paid = o.paymentStatus ? o.paymentStatus.toUpperCase() === "COMPLETED" || o.paymentStatus.toUpperCase() === "PAID" || o.paymentStatus.toUpperCase() === "SUCCESS" : false;

  const orderId = o.orderNumber || o.id || "";
  const localPmMap = getLocalPmMap();
  const localPm = localPmMap[orderId];

  let paymentMethod: PaymentMethod = localPm || (paid ? "upi" : "cod");

  const rawPm = (
    o.paymentMethod ||
    o.paymentMode ||
    o.paymentType ||
    o.payment_method ||
    o.payment_mode ||
    o.payment ||
    (o.razorpayPaymentId || o.razorpayOrderId || o.razorpay_payment_id || o.razorpay_order_id ? "upi" : "")
  ).toString().toLowerCase();

  if (rawPm.includes("upi") || rawPm.includes("online") || rawPm.includes("razorpay")) {
    paymentMethod = "upi";
  } else if (rawPm.includes("card")) {
    paymentMethod = "card";
  } else if (rawPm.includes("cod") || rawPm.includes("cash")) {
    paymentMethod = "cod";
  }

  return {
    id: orderId,
    customerName,
    phone,
    email,
    mode: o.mode || "Takeaway",
    note: o.specialInstructions || o.note || "",
    items,
    subtotal: o.subtotal || 0,
    savings: o.discount || o.savings || 0,
    total: o.totalAmount || o.total || 0,
    paymentMethod,
    paid,
    status,
    createdAt: o.orderedAt || o.createdAt || new Date().toISOString(),
  };
}

/** Fetch all orders, newest first. */
export async function fetchOrders(): Promise<Order[]> {
  if (USE_MOCK) {
    return [...readStore()].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  const token = getAuthToken();
  const headers: HeadersInit = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/customer/orders`, { headers });
  if (res.status === 401 || res.status === 403) {
    logout();
    throw new Error("Session expired. Please log in again.");
  }
  if (!res.ok) throw new Error("Failed to fetch orders");
  const result = await res.json();

  let rawOrders: any[] = [];
  if (Array.isArray(result)) {
    rawOrders = result;
  } else if (result && Array.isArray(result.data)) {
    rawOrders = result.data;
  } else if (result && Array.isArray(result.orders)) {
    rawOrders = result.orders;
  }

  return rawOrders
    .filter(o => o.paymentStatus?.toUpperCase() !== "FAILED")
    .map(mapBackendOrderToFrontend);
}

/** Fetch all customers from the admin API. */
export async function fetchCustomers(): Promise<any> {
  if (USE_MOCK) {
    return { totalCustomers: 0, lifetimeRevenue: 0, customers: [] };
  }

  const token = getAuthToken();
  const headers: HeadersInit = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/admin/customers`, { headers });
  if (res.status === 401 || res.status === 403) {
    logout();
    throw new Error("Session expired. Please log in again.");
  }
  if (!res.ok) throw new Error("Failed to fetch customers");
  const result = await res.json();
  
  return result.data;
}

/** Create a new order (called from the customer checkout flow). */
export async function createOrder(order: Order): Promise<Order> {
  if (order.id && order.paymentMethod) {
    saveLocalPm(order.id, order.paymentMethod);
  }

  if (USE_MOCK) {
    const orders = readStore();
    orders.push(order);
    writeStore(orders);
    return order;
  }
  console.log("Order Items", order.items);

  console.log(
    "Payload",
    order.items.map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      menuId: Number(item.id) || Number(item.id.replace(/\D/g, "")) || 0,
      quantity: item.qty,
    }))
  );

  const res = await fetch(`${API_BASE}/customer/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer: {
        fullName: order.customerName,
        mobile: order.phone,
        email: order.email || "",
      },
    items: order.items.map((item) => {
      const menuId = Number(item.id) || Number(item.id.replace(/\D/g, "")) || 0;
      return {
        menuId,
        quantity: item.qty,
      };
    }),
      paymentMethod: (order.paymentMethod || "cod").toUpperCase(),
      paymentMode: (order.paymentMethod || "cod").toUpperCase(),
      payment_method: (order.paymentMethod || "cod").toUpperCase(),
      payment_mode: (order.paymentMethod || "cod").toUpperCase(),
      specialInstructions: order.note,
      subtotal: order.subtotal || 0,
      tax: 0.00,
      discount: order.savings || 0,
      totalAmount: order.total || 0,
      total: order.total || 0,
      orderStatus: "PENDING",
      paymentStatus: "PENDING",
      offerCode: order.offerCode || undefined,
    }),
  });
  if (!res.ok) throw new Error("Failed to create order");
  const responseData = await res.json();
  const created = responseData && responseData.data ? responseData.data : responseData;
  const createdId = created?.orderNumber || created?.id || order.id;
  if (createdId && order.paymentMethod) {
    saveLocalPm(createdId, order.paymentMethod);
  }
  return responseData;
}

/** Helper to map a frontend Order object to the backend PATCH payload */
function mapOrderToBackendPayload(order: Order) {
  return {
    customer: {
      fullName: order.customerName,
      mobile: order.phone,
      email: order.email || "",
    },
    items: order.items.map((item) => ({
      menuId: Number(item.id) || Number(item.id.replace(/\D/g, "")) || 0,
      quantity: item.qty,
    })),
    paymentStatus: order.paid ? "SUCCESS" : "PENDING",
    paymentMode: (order.paymentMethod || "cod").toUpperCase(),
    orderStatus: order.status.toUpperCase(),
    specialInstructions: order.note || "",
    offerCode: order.offerCode || undefined,
  };
}

/** Update an order's status (called from the admin dashboard). */
export async function updateOrderStatus(order: Order): Promise<Order | null> {
  if (USE_MOCK) {
    const orders = readStore();
    const idx = orders.findIndex((o) => o.id === order.id);
    if (idx === -1) return null;
    orders[idx] = { ...order };
    writeStore(orders);
    return orders[idx];
  }

  const token = getAuthToken();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(
    `${API_BASE}/admin/orders/${order.id}/status`,
    {
      method: "PATCH",
      headers,
      body: JSON.stringify({ orderStatus: order.status.toUpperCase() }),
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Update order status failed:", res.status, errorText);
    throw new Error("Failed to update order status");
  }

  const result = await res.json();
  return result?.data ? mapBackendOrderToFrontend(result.data) : null;
}

/** Mark an order paid/unpaid — useful once real payment webhooks exist. */
export async function updateOrderPaid(order: Order): Promise<Order | null> {
  if (USE_MOCK) {
    const orders = readStore();
    const idx = orders.findIndex((o) => o.id === order.id);
    if (idx === -1) return null;
    orders[idx] = { ...order };
    writeStore(orders);
    return orders[idx];
  }

  const token = getAuthToken();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/customer/orders?orderNumber=${order.id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(mapOrderToBackendPayload(order)),
  });
  if (!res.ok) throw new Error("Failed to update payment status");
  const result = await res.json();
  return result && result.data ? mapBackendOrderToFrontend(result.data) : null;
}

/** Mark an order's payment as failed (when Razorpay is closed or fails) */
export async function updateOrderPaymentFailed(order: Order, orderId: string): Promise<void> {
  if (USE_MOCK) return;
  try {
    const payload = mapOrderToBackendPayload(order);
    payload.paymentStatus = "FAILED";
    const token = getAuthToken();
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    await fetch(`${API_BASE}/customer/orders?orderNumber=${orderId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("Failed to mark order payment as failed", err);
  }
}


/** Create a payment order on Razorpay via backend */
export async function createPayment(orderNumber: string, amount: number): Promise<any> {
  if (USE_MOCK) {
    return {
      success: true,
      message: "Mock payment order created",
      data: {
        razorpayOrderId: "order_mock_" + Math.floor(Math.random() * 100000),
        amount: amount,
        currency: "INR",
        keyId: "rzp_test_mock",
      },
    };
  }

  const res = await fetch(`${API_BASE}/payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderNumber, amount }),
  });
  if (!res.ok) throw new Error("Failed to initialize payment");
  return res.json();
}

/** Verify a completed Razorpay payment transaction on the backend */
/** Verify a completed Razorpay payment transaction on the backend */
export async function verifyPayment(data: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): Promise<any> {
  if (USE_MOCK) {
    return {
      success: true,
      message: "Mock payment verified successfully",
    };
  }

  console.log("Sending payment verification request:", {
    razorpayOrderId: data.razorpayOrderId,
    razorpayPaymentId: data.razorpayPaymentId,
    razorpaySignaturePresent: Boolean(data.razorpaySignature),
  });

  const res = await fetch(`${API_BASE}/payments/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  // Get the actual backend response even when status is 4xx/5xx
  if (!res.ok) {
    const errorText = await res.text();

    console.error(
      "Payment verification API failed:",
      res.status,
      errorText
    );

    throw new Error(
      `Payment verification failed: ${res.status} ${errorText}`
    );
  }

  const result = await res.json();

  console.log("Payment verification API response:", result);

  return result;
}