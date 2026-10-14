import { getAuthToken } from "../services/adminAuth";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? "https://api.velvetbrew.in/api/v1" : "/api/v1");
export interface ApiCategory {
    id: number;
    name: string;
    description: string;
    active: boolean;
}

export interface ApiMenuItem {
    id: number;
    categoryId: number;
    categoryName: string;
    name: string;
    description: string;
    price: number;
    offerPrice: number | null;
    imageUrl: string;
    veg: boolean;
    available: boolean;
    featured: boolean;
    displayOrder: number;
}

export async function getMenu(): Promise<ApiMenuItem[]> {
    const response = await fetch(`${BASE_URL}/customer/menu`);

    if (!response.ok) {
        throw new Error("Failed to fetch menu");
    }

    const result = await response.json();

    return result.data;
}

export async function getCategories(): Promise<ApiCategory[]> {
    const response = await fetch(`${BASE_URL}/category`);

    if (!response.ok) {
        throw new Error("Failed to fetch categories");
    }

    const result = await response.json();

    return result.data;
}

export async function createMenuItem(item: Omit<ApiMenuItem, "id" | "categoryName">): Promise<ApiMenuItem> {
    const token = getAuthToken();
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(`${BASE_URL}/admin/menu`, {
        method: "POST",
        headers,
        body: JSON.stringify(item),
    });
    if (!response.ok) throw new Error("Failed to create menu item");
    const result = await response.json();
    return result.data;
}

export async function updateMenuItem(item: Partial<ApiMenuItem> & { id: number }): Promise<ApiMenuItem> {
    const token = getAuthToken();
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(`${BASE_URL}/admin/menu/${item.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(item),
    });
    if (!response.ok) throw new Error("Failed to update menu item");
    const result = await response.json();
    return result.data;
}

export async function createCategory(category: Omit<ApiCategory, "id">): Promise<ApiCategory> {
    const token = getAuthToken();
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(`${BASE_URL}/category`, {
        method: "POST",
        headers,
        body: JSON.stringify(category),
    });
    if (!response.ok) throw new Error("Failed to create category");
    const result = await response.json();
    return result.data;
}

export async function updateCategory(category: Partial<ApiCategory> & { id: number }): Promise<ApiCategory> {
    const token = getAuthToken();
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(`${BASE_URL}/category`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(category),
    });
    if (!response.ok) throw new Error("Failed to update category");
    const result = await response.json();
    return result.data;
}

export function getPublicImageUrl(url?: string | null): string {
    if (!url) return "";
    if (url.startsWith("s3://velvetbrew/")) {
        return url.replace("s3://velvetbrew/", "https://velvetbrew.s3.ap-south-1.amazonaws.com/");
    }
    return url;
}

export async function uploadMenuImage(file: File): Promise<string> {
    const token = getAuthToken();
    const headers: HeadersInit = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${BASE_URL}/admin/menu/image`, {
        method: "POST",
        headers,
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Image upload failed (HTTP ${response.status})`);
    }

    const result = await response.json();
    return result.data?.imageUrl || (typeof result.data === "string" ? result.data : "");
}

export async function replaceMenuItemImage(id: number, file: File): Promise<ApiMenuItem> {
    const token = getAuthToken();
    const headers: HeadersInit = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${BASE_URL}/admin/menu/${id}/image`, {
        method: "POST",
        headers,
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Failed to update image (HTTP ${response.status})`);
    }

    const result = await response.json();
    return result.data;
}