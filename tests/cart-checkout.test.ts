import assert from "node:assert/strict";
import test from "node:test";

import { validateCartHasItems } from "../src/features/checkout/lib/cart-checkout.ts";
import type { CartItemWithProduct } from "../src/features/cart/types/cart.types.ts";

function cartItem(shopId: string): CartItemWithProduct {
  return {
    id: crypto.randomUUID(),
    quantity: 1,
    products: {
      id: crypto.randomUUID(),
      title: "Product",
      price: 100,
      image_url: null,
      stock_quantity: 10,
      is_active: true,
      shop_id: shopId,
    },
  };
}

test("allows checkout when cart has one shop", () => {
  assert.deepEqual(
    validateCartHasItems([cartItem("shop-1"), cartItem("shop-1")]),
    {
      success: true,
    },
  );
});

test("allows checkout when cart items span multiple shops", () => {
  assert.deepEqual(
    validateCartHasItems([cartItem("shop-1"), cartItem("shop-2")]),
    {
      success: true,
    },
  );
});

test("blocks checkout when cart is empty", () => {
  assert.deepEqual(validateCartHasItems([]), {
    success: false,
    error: "Your cart is empty",
  });
});
