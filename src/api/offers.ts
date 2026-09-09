import { getAuthToken, logout } from "../services/adminAuth";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? "https://api.velvetbrew.in/api/v1" : "/api/v1");

export interface ApiOffer {
  id: number;
  code: string;
  name: string;
  description?: string;
  discountType: "PERCENTAGE" | "FLAT";
  discountValue: number;
  maxDiscountAmount?: number | null;
  minOrderAmount: number;
  startsAt?: string | null;
  endsAt?: string | null;
  maxUsesTotal?: number | null;
  maxUsesPerCustomer?: number | null;
  currentUses: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// Optional fields for creation
export type CreateOfferRequest = Omit<ApiOffer, "id" | "currentUses" | "active" | "createdAt" | "updatedAt">;
export type UpdateOfferRequest = Partial<CreateOfferRequest> & { active?: boolean };

// Admin Endpoints
export async function getAdminOffers(): Promise<ApiOffer[]> {
  const token = getAuthToken();
  const headers: HeadersInit = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(`${BASE_URL}/admin/offers`, { headers });
  if (response.status === 401 || response.status === 403) {
    logout();
    throw new Error("Session expired. Please log in again.");
  }
  if (!response.ok) throw new Error("Failed to fetch admin offers");
  
  // No ApiResponse wrapper
  return await response.json();
}

export async function createOffer(offer: CreateOfferRequest): Promise<ApiOffer> {
  const token = getAuthToken();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(`${BASE_URL}/admin/offers`, {
    method: "POST",
    headers,
    body: JSON.stringify(offer),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || "Failed to create offer");
  }
  
  return await response.json();
}

export async function updateOffer(id: number, offer: UpdateOfferRequest): Promise<ApiOffer> {
  const token = getAuthToken();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(`${BASE_URL}/admin/offers/${id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(offer),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || "Failed to update offer");
  }

  return await response.json();
}

export async function deleteOffer(id: number): Promise<void> {
  const token = getAuthToken();
  const headers: HeadersInit = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(`${BASE_URL}/admin/offers/${id}`, {
    method: "DELETE",
    headers,
  });
  
  if (!response.ok) throw new Error("Failed to delete offer");
}

// Customer Endpoints
export interface PublicOffer {
  code: string;
  name: string;
  description?: string;
  discountType: "PERCENTAGE" | "FLAT";
  discountValue: number;
  maxDiscountAmount?: number | null;
  minOrderAmount: number;
  endsAt?: string | null;
}

export async function getActiveOffers(): Promise<PublicOffer[]> {
  const response = await fetch(`${BASE_URL}/customer/offers`);
  if (!response.ok) throw new Error("Failed to fetch active offers");
  return await response.json();
}

export interface ValidateOfferRequest {
  code: string;
  mobile?: string;
  items: Array<{ menuId: number; quantity: number }>;
}

export interface ValidateOfferResponse {
  code: string;
  subtotal: number;
  discountAmount: number;
  finalAmount: number;
}

export async function validateOffer(req: ValidateOfferRequest): Promise<ValidateOfferResponse> {
  const response = await fetch(`${BASE_URL}/customer/offers/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || "Failed to validate offer");
  }
  
  return result;
}
