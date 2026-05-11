"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { updateOrderItemStatusAction } from "@/features/orders/actions/update-order-status.action";
import {
  formatOrderStatus,
  ORDER_STATUSES,
  type OrderStatus,
} from "@/features/orders/lib/order-status";

type SellerOrderStatusControlsProps = {
  currentStatus: string;
  orderItemId: string;
};

export function SellerOrderStatusControls({
  currentStatus,
  orderItemId,
}: SellerOrderStatusControlsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function updateStatus(status: OrderStatus) {
    startTransition(async () => {
      const result = await updateOrderItemStatusAction(orderItemId, status);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(`Order marked ${formatOrderStatus(status)}`);
      router.refresh();
    });
  }

  return (
    <div className="mt-6 flex flex-wrap gap-3">
      {ORDER_STATUSES.map((status) => (
        <button
          key={status}
          type="button"
          disabled={isPending}
          onClick={() => updateStatus(status)}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition disabled:opacity-50 ${
            currentStatus === status
              ? "bg-black text-white"
              : "border hover:bg-neutral-100"
          }`}
        >
          {formatOrderStatus(status)}
        </button>
      ))}
    </div>
  );
}
