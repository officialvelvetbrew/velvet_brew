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
    const token = getAuthToken();
    const headers: HeadersInit = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const url = token ? `${BASE_URL}/admin/categories` : `${BASE_URL}/category`;
    let response = await fetch(url, { headers });

    // Fallback to public /category if admin categories fails
    if (!response.ok && token) {
        response = await fetch(`${BASE_URL}/category`);
    }

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

export async function createCategory(category: { name: string; description?: string }): Promise<ApiCategory> {
    const token = getAuthToken();
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(`${BASE_URL}/admin/categories`, {
        method: "POST",
        headers,
        body: JSON.stringify({
            name: category.name.trim(),
            description: category.description || "",
        }),
    });
    if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.message || `Failed to create category (HTTP ${response.status})`);
    }
    const result = await response.json();
    return result.data;
}

export async function updateCategory(category: { id: number; name?: string; description?: string }): Promise<ApiCategory> {
    const token = getAuthToken();
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const body: Record<string, any> = {};
    if (category.name !== undefined) body.name = category.name.trim();
    if (category.description !== undefined) body.description = category.description;

    const response = await fetch(`${BASE_URL}/admin/categories/${category.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(body),
    });
    if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.message || `Failed to update category (HTTP ${response.status})`);
    }
    const result = await response.json();
    return result.data;
}

export async function deleteCategory(id: number): Promise<void> {
    const token = getAuthToken();
    const headers: HeadersInit = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(`${BASE_URL}/admin/categories/${id}`, {
        method: "DELETE",
        headers,
    });
    if (!response.ok) {
        const errData = await response.json().catch(() => null);
        if (response.status === 409) {
            throw new Error(errData?.message || "Cannot delete category: Menu items still belong to it. Please delete or reassign them first.");
        }
        throw new Error(errData?.message || `Failed to delete category (HTTP ${response.status})`);
    }
}

export async function getCategoryById(id: number): Promise<ApiCategory> {
    const token = getAuthToken();
    const headers: HeadersInit = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(`${BASE_URL}/admin/categories/${id}`, {
        headers,
    });
    if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.message || `Failed to fetch category (HTTP ${response.status})`);
    }
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