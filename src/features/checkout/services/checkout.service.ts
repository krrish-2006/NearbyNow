import type { SupabaseClient } from "@supabase/supabase-js";

import type { ActionResult } from "@/features/actions/action-result";
import type { Database } from "@/types/database";

type OrderResult = {
  orderId: string;
};

export function mapCheckoutRpcError(message: string | undefined): string {
  if (!message) {
    return "Unable to place order";
  }

  if (message.includes("auth_required")) {
    return "Please login first";
  }

  if (message.includes("invalid_quantity")) {
    return "Choose a valid quantity";
  }

  if (message.includes("empty_cart")) {
    return "Your cart is empty";
  }

  if (
    message.includes("insufficient_stock") ||
    message.includes("cart_item_unavailable")
  ) {
    return "Some items are unavailable or out of stock";
  }

  if (message.includes("product_unavailable")) {
    return "This product is unavailable";
  }

  return "Unable to place order";
}

export async function placeCartCodOrder(
  supabase: SupabaseClient<Database>,
): Promise<ActionResult<OrderResult>> {
  const { data, error } = await supabase.rpc("place_cart_cod_order");

  if (error) {
    return {
      success: false,
      error: mapCheckoutRpcError(error.message),
    };
  }

  return {
    success: true,
    data: {
      orderId: data,
    },
  };
}

export async function placeDirectCodOrder(
  supabase: SupabaseClient<Database>,
  input: {
    productId: string;
    quantity: number;
  },
): Promise<ActionResult<OrderResult>> {
  const { data, error } = await supabase.rpc("place_direct_cod_order", {
    p_product_id: input.productId,
    p_quantity: input.quantity,
  });

  if (error) {
    return {
      success: false,
      error: mapCheckoutRpcError(error.message),
    };
  }

  return {
    success: true,
    data: {
      orderId: data,
    },
  };
}
