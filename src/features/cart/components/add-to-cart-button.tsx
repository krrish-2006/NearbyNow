"use client";

import Link from "next/link";

import { useEffect } from "react";

import { useState } from "react";

import { useTransition } from "react";

import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";

import { addToCartAction } from "@/features/cart/actions/add-to-cart.action";

import Button from "@/components/ui/button";

export default function AddToCartButton({ productId }: { productId: string }) {
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

      setIsInCart(!!data);
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

  if (isInCart) {
    return (
      <Link
        href="/cart"
        className="inline-flex w-full items-center justify-center rounded-2xl bg-black px-8 py-4 text-lg font-semibold text-white shadow-md transition-all duration-200 hover:scale-[1.03] hover:shadow-xl active:scale-[0.98] sm:w-auto"
      >
        View Cart
      </Link>
    );
  }

  return (
    <Button
      onClick={handleAddToCart}
      disabled={isPending}
      className="w-full px-8 py-4 text-lg sm:w-auto"
    >
      {isPending ? "Adding..." : "Add to Cart"}
    </Button>
  );
}
