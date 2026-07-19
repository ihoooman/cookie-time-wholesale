export type ProductCategory = "cookie" | "jar" | "cake";

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  category: ProductCategory;
  weightLabel: string;
  imageUrl: string;
  imageKey: string | null;
  stockQty: number;
  active: boolean;
  featured: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type OrderItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  lineTotal: number;
  wholesaleDiscountEligible?: boolean;
};

export type Order = {
  id: string;
  orderNumber: string;
  businessName: string;
  businessType: string;
  area: string;
  customerName: string;
  customerPhone: string;
  note: string;
  items: OrderItem[];
  subtotal: number;
  discountCode: string | null;
  discountAmount: number;
  total: number;
  createdAt: string;
};

export type Discount = {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  minOrder: number;
  active: boolean;
  usageCount: number;
  createdAt: string;
};
