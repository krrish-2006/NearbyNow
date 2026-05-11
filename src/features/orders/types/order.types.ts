import type { Tables } from "@/types/database";

export type OrderItemWithProduct = Pick<
  Tables<"order_items">,
  "id" | "quantity" | "price"
> & {
  products: Pick<Tables<"products">, "title"> | null;
};

export type OrderWithItems = Tables<"orders"> & {
  order_items: OrderItemWithProduct[];
};
