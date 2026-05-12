"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  logServerEvent,
  reportServerError,
} from "@/lib/monitoring/server";
import type { ActionResult } from "@/features/actions/action-result";
import { isOrderStatus } from "@/features/orders/lib/order-status";

export async function updateOrderItemStatusAction(
  orderItemId: string,
  status: string
): Promise<ActionResult> {
  if (!isOrderStatus(status)) {
    return {
      success: false,
      error: "Invalid order status",
    };
  }

  const supabase =
    await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "Unauthorized",
    };
  }

  const { data: updated, error } = await supabase.rpc(
    "update_seller_order_item_status",
    {
      p_order_item_id: orderItemId,
      p_status: status,
    },
  );

  if (error) {
    await reportServerError(error, {
      action: "updateOrderItemStatusAction",
      userId: user.id,
      orderItemId,
      status,
    });

    return {
      success: false,
      error: error.message,
    };
  }

  if (!updated) {
    logServerEvent("seller order item status update rejected", {
      action: "updateOrderItemStatusAction",
      userId: user.id,
      orderItemId,
      status,
    });

    return {
      success: false,
      error: "Order not found",
    };
  }

  revalidatePath("/seller/orders");

  revalidatePath("/orders");

  logServerEvent("seller order item status updated", {
    action: "updateOrderItemStatusAction",
    userId: user.id,
    orderItemId,
    status,
  });

  return {
    success: true,
  };
}
