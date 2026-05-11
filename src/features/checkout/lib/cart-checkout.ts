import type { ActionResult } from "@/features/actions/action-result";
import type { CartItemWithProduct } from "@/features/cart/types/cart.types";

export function validateCartHasItems(
  cartItems: CartItemWithProduct[],
): ActionResult {
  if (cartItems.length === 0) {
    return {
      success: false,
      error: "Your cart is empty",
    };
  }

  return {
    success: true,
  };
}
