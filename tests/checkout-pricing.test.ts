import assert from "node:assert/strict";
import test from "node:test";

import { calculateCheckoutPricing } from "../src/features/checkout/lib/calculate-checkout-pricing.ts";

test("calculates checkout totals with the current free platform fee", () => {
  const pricing = calculateCheckoutPricing({
    price: 199,
    quantity: 3,
  });

  assert.deepEqual(pricing, {
    subtotal: 597,
    platformFee: 0,
    total: 597,
  });
});
