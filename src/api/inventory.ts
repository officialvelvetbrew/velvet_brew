import type { InventoryCategory, Supplier, InventoryItem, StockMovement } from "../types";

import { getAuthToken } from "../services/adminAuth";

const API_BASE = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? "https://api.velvetbrew.in/api/v1" : "/api/v1");

// Helper to safely extract JSON data, dealing with wrappers
async function fetchAndUnwrap(url: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API Error ${res.status}: ${text}`);
  }
  const result = await res.json();
  return result?.data !== undefined ? result.data : result;
}

// ----------------------------------------------------
// CATEGORIES
// ----------------------------------------------------

export async function getCategories(): Promise<InventoryCategory[]> {
  const res = await fetchAndUnwrap(`${API_BASE}/inventory/categories`);
  return Array.isArray(res) ? res : [];
}

export async function createCategory(data: { name: string; description: string }): Promise<InventoryCategory> {
  return fetchAndUnwrap(`${API_BASE}/inventory/categories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function updateCategory(id: number, data: { description: string }): Promise<InventoryCategory> {
  return fetchAndUnwrap(`${API_BASE}/inventory/categories/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function deleteCategory(id: number): Promise<void> {
  await fetchAndUnwrap(`${API_BASE}/inventory/categories/${id}`, { method: "DELETE" });
}

// ----------------------------------------------------
// SUPPLIERS
// ----------------------------------------------------

export async function getSuppliers(): Promise<Supplier[]> {
  const res = await fetchAndUnwrap(`${API_BASE}/inventory/suppliers`);
  return Array.isArray(res) ? res : [];
}

export async function getSupplierById(id: number): Promise<Supplier> {
  return fetchAndUnwrap(`${API_BASE}/inventory/suppliers/${id}`);
}

export async function createSupplier(data: Partial<Supplier>): Promise<Supplier> {
  return fetchAndUnwrap(`${API_BASE}/inventory/suppliers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function updateSupplier(id: number, data: Partial<Supplier>): Promise<Supplier> {
  return fetchAndUnwrap(`${API_BASE}/inventory/suppliers/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

// NOTE: The instructions provided `/api/inventory/suppliers/:id` for enable/disable
// Wait, the API_BASE might already have /v1 if PROD... Let's cleanly separate base paths.
const RAW_API_BASE = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL.replace("/v1", "")
  : (import.meta.env.PROD ? "https://api.velvetbrew.in/api" : "/api");

export async function toggleSupplier(id: number, enabled: boolean): Promise<Supplier> {
  return fetchAndUnwrap(`${RAW_API_BASE}/inventory/suppliers/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ enabled }),
  });
}

export async function deleteSupplier(id: number): Promise<void> {
  await fetchAndUnwrap(`${API_BASE}/inventory/suppliers/${id}`, { method: "DELETE" });
}

// ----------------------------------------------------
// ITEMS
// ----------------------------------------------------

export async function getItems(): Promise<InventoryItem[]> {
  const res = await fetchAndUnwrap(`${API_BASE}/inventory/items`);
  return Array.isArray(res) ? res : [];
}

export async function createItem(data: Partial<InventoryItem>): Promise<InventoryItem> {
  return fetchAndUnwrap(`${API_BASE}/inventory/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function updateItem(id: number, data: Partial<InventoryItem>): Promise<InventoryItem> {
  return fetchAndUnwrap(`${API_BASE}/inventory/items/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

// ----------------------------------------------------
// STOCK OPERATIONS
// ----------------------------------------------------

export async function stockIn(id: number, data: { quantity: number; unitCost: number; reason: string }): Promise<any> {
  return fetchAndUnwrap(`${API_BASE}/inventory/items/${id}/stock`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function consumeStock(id: number, data: { quantity: number; reason: string }): Promise<any> {
  return fetchAndUnwrap(`${API_BASE}/inventory/items/${id}/consume`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function wastageStock(id: number, data: { quantity: number; reason: string }): Promise<any> {
  return fetchAndUnwrap(`${API_BASE}/inventory/items/${id}/wastage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function adjustStock(id: number, data: { type: "ADJUSTMENT_IN" | "ADJUSTMENT_OUT"; quantity: number; reason: string }): Promise<any> {
  return fetchAndUnwrap(`${RAW_API_BASE}/inventory/items/${id}/adjustment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function getMovements(id: number): Promise<StockMovement[]> {
  const res = await fetchAndUnwrap(`${RAW_API_BASE}/inventory/items/${id}/movements`);
  return Array.isArray(res) ? res : [];
}
