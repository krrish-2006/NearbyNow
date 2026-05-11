"use client";

import { useTransition } from "react";

import { toast } from "sonner";

import { removeCartItemAction } from "@/features/cart/actions/remove-cart-item.action";

import { updateCartQuantityAction } from "@/features/cart/actions/update-cart-quantity.action";

export default function CartActions({
  itemId,
  quantity,
  stockQuantity,
  isActive,
}: {
  itemId: string;
  quantity: number;
  stockQuantity: number;
  isActive: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function updateQuantity(nextQuantity: number) {
    if (nextQuantity < 1) {
      return;
    }

    if (!isActive) {
      toast.error("This product is unavailable");

      return;
    }

    if (nextQuantity > stockQuantity) {
      toast.error(`Only ${stockQuantity} in stock`);

      return;
    }

    startTransition(async () => {
      const result = await updateCartQuantityAction(itemId, nextQuantity);

      if (!result?.success) {
        toast.error(result?.error || "Could not update quantity");
      }
    });
  }

  function removeItem() {
    startTransition(async () => {
      await removeCartItemAction(itemId);

      toast.success("Item removed");
    });
  }

  return (
    <div className="mt-4 flex items-center gap-3">
      <button
        disabled={isPending}
        onClick={() => updateQuantity(quantity - 1)}
        className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border-2 border-black bg-white text-2xl font-black shadow-md transition-all duration-200 hover:scale-125 hover:bg-black hover:text-white hover:shadow-2xl active:scale-90 disabled:opacity-50"
      >
        −
      </button>

      <span className="min-w-[30px] text-center text-lg font-bold">
        {quantity}
      </span>

      <button
        disabled={isPending || !isActive || quantity >= stockQuantity}
        onClick={() => updateQuantity(quantity + 1)}
        className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border-2 border-black bg-white text-2xl font-black shadow-md transition-all duration-200 hover:scale-125 hover:bg-black hover:text-white hover:shadow-2xl active:scale-90 disabled:opacity-50"
      >
        +
      </button>

      <button
        disabled={isPending}
        onClick={removeItem}
        className="ml-3 rounded-full border-2 border-red-500 bg-red-100 px-5 py-2 text-sm font-bold text-red-600 shadow-md transition-all duration-200 hover:scale-110 hover:bg-red-600 hover:text-white hover:shadow-2xl active:scale-95 disabled:opacity-50"
      >
        Remove
      </button>
    </div>
  );
}
