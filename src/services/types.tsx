// src/types.ts
export interface Product {
  id: string;
  name: string;
  productCode: string;
  salePrice: number | null; // Allow null to match backend
  finalPrice?: number | null; // For discounts
  discountPercent?: number | null;
  discountAmount?: number | null;
  discountCode?: string | null;
  images: string[];
  brandName?: string;
  categoryName?: string;
  description?: string | null;
  quantity?: number;
  specifications?: { [key: string]: string };
  status?: string;
  viewCount?: number;
  isDeleted?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface UserInfo {
  id: string;
  username: string;
  address?: string;
}

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  salePrice: number;
}

export interface Order {
  id: number;
  userId: string;
  userName: string
  orderNumber: string;
  totalAmount: number;
  totalProfit: number;
  status: string;
  shippingAddress: string;
  paymentMethod: string;
  shipmentMethod: string;
  orderNote: string;
  createdDate: string;
  createdBy: string;
  lastModifiedBy: string;
  lastModifiedDate: string;
  isDeleted: boolean;
  orderItems: OrderItem[];
}

export interface StockIn {
  id: number; // Assuming an ID is returned in the response for CRUD
  parcelCode: string | null;
  productName: string;
  productCode: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  createdBy: string | null;
  createdDate: string;
  lastModifiedDate: string | null;
  lastModifiedBy: string | null;
  status?: string; // Optional, for status filter
}