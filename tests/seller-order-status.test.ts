import assert from "node:assert/strict";
import test from "node:test";

import {
  countOrderStatuses,
  countSellerOrderStatusMetrics,
  deriveCodPaymentStatusFromOrderStatus,
  formatOrderStatus,
  isCompletedOrderStatus,
  isOrderItemInProgress,
  isOrderStatus,
  validateSellerOrderStatusUpdate,
} from "../src/features/orders/lib/order-status.ts";

test("accepts known seller order statuses", () => {
  assert.equal(isOrderStatus("CONFIRMED"), true);
  assert.equal(isOrderStatus("CANCELLED"), true);
});

test("rejects unknown seller order statuses", () => {
  assert.deepEqual(
    validateSellerOrderStatusUpdate({
      status: "REFUNDED",
      sellerOwnsOrderItem: true,
    }),
    {
      success: false,
      error: "Invalid order status",
    },
  );
});

test("rejects status updates when seller does not own an order item", () => {
  assert.deepEqual(
    validateSellerOrderStatusUpdate({
      status: "COMPLETED",
      sellerOwnsOrderItem: false,
    }),
    {
      success: false,
      error: "Order not found",
    },
  );
});

test("derives overall order status from item statuses", async () => {
  const { deriveOrderStatusFromItems } = await import(
    "../src/features/orders/lib/order-status.ts"
  );

  assert.equal(
    deriveOrderStatusFromItems(["PENDING", "CONFIRMED"]),
    "CONFIRMED",
  );
  assert.equal(
    deriveOrderStatusFromItems(["COMPLETED", "COMPLETED"]),
    "COMPLETED",
  );
  assert.equal(
    deriveOrderStatusFromItems(["CANCELLED", "CANCELLED"]),
    "CANCELLED",
  );
});

test("classifies seller order metric statuses", () => {
  assert.equal(isOrderItemInProgress("PENDING"), true);
  assert.equal(isOrderItemInProgress("CONFIRMED"), true);
  assert.equal(isOrderItemInProgress("COMPLETED"), false);
  assert.equal(isOrderItemInProgress("CANCELLED"), false);

  assert.equal(isCompletedOrderStatus("COMPLETED"), true);
  assert.equal(isCompletedOrderStatus("CONFIRMED"), false);
});

test("counts seller order metrics from item statuses", () => {
  assert.deepEqual(
    countSellerOrderStatusMetrics([
      "PENDING",
      "CONFIRMED",
      "COMPLETED",
      "CANCELLED",
    ]),
    {
      inProgressCount: 2,
      completedCount: 1,
    },
  );
});

test("counts current statuses without carrying old status values", () => {
  assert.deepEqual(
    countOrderStatuses([
      "PENDING",
      "CONFIRMED",
      "COMPLETED",
      "COMPLETED",
      "CANCELLED",
      "UNKNOWN",
    ]),
    {
      PENDING: 1,
      CONFIRMED: 1,
      COMPLETED: 2,
      CANCELLED: 1,
    },
  );
});

test("formats order status labels for UI", () => {
  assert.equal(formatOrderStatus("PENDING"), "Pending");
  assert.equal(formatOrderStatus("CONFIRMED"), "Confirmed");
  assert.equal(formatOrderStatus("COMPLETED"), "Completed");
  assert.equal(formatOrderStatus("CANCELLED"), "Cancelled");
  assert.equal(formatOrderStatus("COD_PENDING"), "Cod Pending");
});

test("derives COD payment status from order status", () => {
  assert.equal(deriveCodPaymentStatusFromOrderStatus("PENDING"), "COD_PENDING");
  assert.equal(deriveCodPaymentStatusFromOrderStatus("CONFIRMED"), "COD_PENDING");
  assert.equal(
    deriveCodPaymentStatusFromOrderStatus("COMPLETED"),
    "COD_COLLECTED",
  );
  assert.equal(deriveCodPaymentStatusFromOrderStatus("CANCELLED"), "CANCELLED");
});
