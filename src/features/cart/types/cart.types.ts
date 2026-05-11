import type { Tables } from "@/types/database";

export type CartProductSummary = Pick<
  Tables<"products">,
  "id" | "title" | "price" | "image_url" | "stock_quantity" | "is_active"
>;

export type CartItemWithProduct = Pick<
  Tables<"cart_items">,
  "id" | "quantity"
> & {
  products: CartProductSummary;
};
