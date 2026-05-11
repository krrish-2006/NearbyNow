"use server";

import { revalidatePath } from "next/cache";

import type { ActionResult } from "@/features/actions/action-result";
import { createClient } from "@/lib/supabase/server";
import {
  addWishlistItem,
  getWishlistItemId,
  removeWishlistItem,
} from "@/repositories/wishlist.repository";

type ToggleWishlistResult = {
  wishlisted: boolean;
};

export async function toggleWishlistAction(
  productId: string,
): Promise<ActionResult<ToggleWishlistResult>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "Please login first",
    };
  }

  const existingWishlistItemId = await getWishlistItemId(
    supabase,
    user.id,
    productId,
  );

  if (existingWishlistItemId) {
    const removed = await removeWishlistItem(supabase, {
      userId: user.id,
      productId,
    });

    if (!removed) {
      return {
        success: false,
        error: "Could not remove wishlist item",
      };
    }

    revalidatePath(`/products/${productId}`);

    return {
      success: true,
      data: {
        wishlisted: false,
      },
    };
  }

  const added = await addWishlistItem(supabase, {
    userId: user.id,
    productId,
  });

  if (!added) {
    return {
      success: false,
      error: "Could not wishlist product",
    };
  }

  revalidatePath(`/products/${productId}`);

  return {
    success: true,
    data: {
      wishlisted: true,
    },
  };
}
