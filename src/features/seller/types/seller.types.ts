import type { Tables } from "@/types/database";

export type SellerProductCard = Pick<
  Tables<"products">,
  "id" | "title" | "price" | "stock_quantity" | "image_url"
>;

export type SellerEditableProduct = Pick<
  Tables<"products">,
  | "id"
  | "title"
  | "description"
  | "image_url"
  | "price"
  | "stock_quantity"
  | "category_id"
>;

export type SellerOrderItem = Pick<
  Tables<"order_items">,
  | "id"
  | "quantity"
  | "price"
  | "status"
  | "shop_id"
  | "status_updated_at"
  | "confirmed_at"
  | "completed_at"
  | "cancelled_at"
> & {
  products: Pick<Tables<"products">, "id" | "title"> | null;
  shops: Pick<Tables<"shops">, "id" | "name"> | null;
  orders: Pick<
    Tables<"orders">,
    | "id"
    | "user_id"
    | "payment_method"
    | "payment_status"
    | "status"
    | "created_at"
    | "total_amount"
  > | null;
};
