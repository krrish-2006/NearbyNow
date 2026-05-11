import assert from "node:assert/strict";
import test from "node:test";

import { mapCheckoutRpcError } from "../src/features/checkout/services/checkout.service.ts";

test("maps RPC stock failures to user-facing checkout errors", () => {
  assert.equal(
    mapCheckoutRpcError("insufficient_stock"),
    "Some items are unavailable or out of stock",
  );

  assert.equal(
    mapCheckoutRpcError("cart_item_unavailable"),
    "Some items are unavailable or out of stock",
  );
});

test("maps RPC auth and quantity failures", () => {
  assert.equal(mapCheckoutRpcError("auth_required"), "Please login first");
  assert.equal(mapCheckoutRpcError("invalid_quantity"), "Choose a valid quantity");
});
