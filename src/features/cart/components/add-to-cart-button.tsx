"use client";

import { useEffect, useState, useTransition } from "react";

import { toast } from "sonner";

import Button from "@/components/ui/button";

import { createClient } from "@/lib/supabase/client";

import { addToCartAction } from "@/features/cart/actions/add-to-cart.action";

interface AddToCartButtonProps {
  productId: string;
  stockQuantity?: number;
  isActive?: boolean;
  className?: string;
}

export default function AddToCartButton({
  productId,
  stockQuantity,
  isActive = true,
  className,
}: AddToCartButtonProps) {
  const [isPending, startTransition] = useTransition();

  const [isInCart, setIsInCart] = useState(false);

  useEffect(() => {
    async function checkCart() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return;
      }

      const { data } = await supabase
        .from("cart_items")
        .select("id")
        .eq("user_id", user.id)
        .eq("product_id", productId)
        .maybeSingle();

      setIsInCart(Boolean(data));
    }

    checkCart();
  }, [productId]);

  async function handleAddToCart() {
    startTransition(async () => {
      const result = await addToCartAction(productId);

      if (result?.success) {
        toast.success("Added to cart");

        setIsInCart(true);
      } else {
        toast.error(result?.error || "Something went wrong");
      }
    });
  }

  const isOutOfStock =
    typeof stockQuantity === "number" && stockQuantity <= 0;

  const isDisabled =
    isPending ||
    isInCart ||
    isOutOfStock ||
    !isActive;

  return (
    <Button
      onClick={handleAddToCart}
      disabled={isDisabled}
      className={className}
    >
      {isOutOfStock
        ? "Out of Stock"
        : !isActive
          ? "Unavailable"
          : isInCart
            ? "Added to Cart"
            : isPending
              ? "Adding..."
              : "Add to Cart"}
    </Button>
  );
}
