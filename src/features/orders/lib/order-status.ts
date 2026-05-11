import type { ActionResult } from "@/features/actions/action-result";

export const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type SellerOrderStatusMetrics = {
  inProgressCount: number;
  completedCount: number;
};

export type OrderStatusCounts = Record<OrderStatus, number>;

export function createEmptyOrderStatusCounts(): OrderStatusCounts {
  return {
    PENDING: 0,
    CONFIRMED: 0,
    COMPLETED: 0,
    CANCELLED: 0,
  };
}

export function countOrderStatuses(statuses: string[]): OrderStatusCounts {
  return statuses.reduce<OrderStatusCounts>((counts, status) => {
    if (isOrderStatus(status)) {
      counts[status] += 1;
    }

    return counts;
  }, createEmptyOrderStatusCounts());
}

export function isOrderStatus(status: string): status is OrderStatus {
  return ORDER_STATUSES.includes(status as OrderStatus);
}

export function validateSellerOrderStatusUpdate({
  status,
  sellerOwnsOrderItem,
}: {
  status: string;
  sellerOwnsOrderItem: boolean;
}): ActionResult {
  if (!isOrderStatus(status)) {
    return {
      success: false,
      error: "Invalid order status",
    };
  }

  if (!sellerOwnsOrderItem) {
    return {
      success: false,
      error: "Order not found",
    };
  }

  return {
    success: true,
  };
}

export function deriveOrderStatusFromItems(statuses: string[]): OrderStatus {
  if (statuses.length === 0) {
    return "PENDING";
  }

  if (statuses.every((status) => status === "CANCELLED")) {
    return "CANCELLED";
  }

  if (statuses.every((status) => status === "COMPLETED")) {
    return "COMPLETED";
  }

  if (statuses.some((status) => status === "CONFIRMED")) {
    return "CONFIRMED";
  }

  return "PENDING";
}

export function formatOrderStatus(status: string): string {
  if (!isOrderStatus(status)) {
    return status;
  }

  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function isCompletedOrderStatus(status: string): boolean {
  return status === "COMPLETED";
}

export function isCancelledOrderStatus(status: string): boolean {
  return status === "CANCELLED";
}

export function isOrderItemInProgress(status: string): boolean {
  return !isCompletedOrderStatus(status) && !isCancelledOrderStatus(status);
}

export function countSellerOrderStatusMetrics(
  statuses: string[],
): SellerOrderStatusMetrics {
  return statuses.reduce<SellerOrderStatusMetrics>(
    (metrics, status) => {
      if (isCompletedOrderStatus(status)) {
        metrics.completedCount += 1;
      } else if (isOrderItemInProgress(status)) {
        metrics.inProgressCount += 1;
      }

      return metrics;
    },
    {
      inProgressCount: 0,
      completedCount: 0,
    },
  );
}
