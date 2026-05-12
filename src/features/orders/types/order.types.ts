import type { Tables } from "@/types/database";

export type OrderItemWithProduct = Pick<
  Tables<"order_items">,
  "id" | "quantity" | "price" | "status" | "status_updated_at" | "shop_id"
> & {
  products: Pick<Tables<"products">, "title"> | null;
  shops: Pick<Tables<"shops">, "id" | "name"> | null;
};

export type OrderWithItems = Tables<"orders"> & {
  order_items: OrderItemWithProduct[];
};
