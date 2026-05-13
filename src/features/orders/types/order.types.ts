import type { Tables } from "@/types/database";

export type OrderItemWithProduct = Pick<
  Tables<"order_items">,
  "id" | "quantity" | "price" | "status" | "status_updated_at" | "shop_id"
> & {
  products: Pick<Tables<"products">, "title"> | null;
  shops: Pick<Tables<"shops">, "id" | "name"> | null;
  pickup_location: Pick<
    Tables<"shop_pickup_locations">,
    | "address"
    | "latitude"
    | "longitude"
    | "pickup_window"
    | "pickup_instructions"
  > | null;
};

export type OrderWithItems = Tables<"orders"> & {
  order_items: OrderItemWithProduct[];
};
