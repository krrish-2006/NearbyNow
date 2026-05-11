"use client";

import { useState, useTransition } from "react";

import { toast } from "sonner";

import { toggleWishlistAction } from "@/features/wishlist/actions/toggle-wishlist.action";

type WishlistButtonProps = {
  productId: string;
  initialWishlisted: boolean;
};

export default function WishlistButton({
  productId,
  initialWishlisted,
}: WishlistButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [isWishlisted, setIsWishlisted] = useState(initialWishlisted);

  function handleToggle() {
    startTransition(async () => {
      const result = await toggleWishlistAction(productId);

      if (!result.success) {
        toast.error(result.error);

        return;
      }

      setIsWishlisted(result.data?.wishlisted ?? false);

      toast.success(
        result.data?.wishlisted
          ? "Added to wishlist"
          : "Removed from wishlist",
      );
    });
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      className={`inline-flex h-11 items-center justify-center rounded-2xl border px-5 text-sm font-semibold transition disabled:opacity-50 ${
        isWishlisted
          ? "border-black bg-black text-white"
          : "bg-white text-black hover:bg-neutral-100"
      }`}
    >
      {isPending
        ? "Saving..."
        : isWishlisted
          ? "Wishlisted"
          : "Add to Wishlist"}
    </button>
  );
}
