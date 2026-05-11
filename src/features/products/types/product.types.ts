import type { Tables } from "@/types/database";

export type ProductRow = Tables<"products">;

export type ProductShopSummary = {
  name: string;
} | null;

export type ProductCategorySummary = {
  name: string;
} | null;

export type ProductCardProduct = Pick<
  ProductRow,
  | "id"
  | "title"
  | "description"
  | "price"
  | "image_url"
  | "stock_quantity"
> & {
  shops?: ProductShopSummary | ProductShopSummary[];
};

export type MarketplaceProduct = ProductCardProduct & {
  categories?: ProductCategorySummary;
};

export type ProductDetails = ProductRow & {
  shops?: ProductShopSummary;
  categories?: ProductCategorySummary;
};

export type ProductFilters = {
  search?: string;
  categoryId?: string;
};
