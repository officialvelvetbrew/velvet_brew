export interface InventoryCategory {
  id: number;
  name: string;
  description: string;
}

export interface Supplier {
  id: number;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  taxNumber: string;
  enabled: boolean;
}

export interface InventoryItem {
  id: number;
  categoryId: number;
  categoryName?: string;
  supplierId: number;
  supplierName?: string;
  name: string;
  sku: string;
  unit: string;
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
  reorderLevel: number;
  unitCost: number;
  lowStock?: boolean;
  outOfStock?: boolean;
  enabled?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface StockMovement {
  id?: number;
  itemId?: number;
  type?: string; 
  quantity?: number;
  unitCost?: number;
  reason?: string;
  createdAt?: string;
  date?: string;
  // This structure is a safe type to contain raw data since it wasn't provided,
}

export interface RecipeItem {
  inventoryItemId: number;
  inventoryItemName?: string;
  unit?: string;
  quantity: number;
}

export interface Recipe {
  id?: number;
  menuItemId: number | string;
  menuItemName?: string;
  name: string;
  description?: string;
  enabled?: boolean;
  items: RecipeItem[];
}
