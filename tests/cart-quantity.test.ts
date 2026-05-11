import assert from "node:assert/strict";
import test from "node:test";

import {
  validateCartQuantityUpdate,
  validateProductCanBeAddedToCart,
} from "../src/features/cart/lib/cart-quantity.ts";

test("allows adding an active in-stock product to cart", () => {
  assert.deepEqual(
    validateProductCanBeAddedToCart({
      stockQuantity: 2,
      isActive: true,
    }),
    {
      success: true,
    },
  );
});

test("prevents adding beyond available stock", () => {
  assert.deepEqual(
    validateProductCanBeAddedToCart(
      {
        stockQuantity: 2,
        isActive: true,
      },
      2,
    ),
    {
      success: false,
      error: "Only 2 in stock",
    },
  );
});

test("prevents updating cart quantity beyond stock", () => {
  assert.deepEqual(
    validateCartQuantityUpdate(
      {
        stockQuantity: 4,
        isActive: true,
      },
      5,
    ),
    {
      success: false,
      error: "Only 4 in stock",
    },
  );
});

test("allows zero or negative quantity so the action can remove the item", () => {
  assert.deepEqual(
    validateCartQuantityUpdate(
      {
        stockQuantity: 0,
        isActive: false,
      },
      0,
    ),
    {
      success: true,
    },
  );
});
