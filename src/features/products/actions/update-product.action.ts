"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/features/actions/action-result";
import {
  getProductImageUrl,
  uploadProductImage,
} from "@/lib/storage/product-image";

import {
  getShopBySellerId,
} from "@/repositories/shop.repository";

import {
  productSchema,
} from "@/features/products/schemas/product.schema";

export async function updateProductAction(
  productId: string,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "Unauthorized",
    };
  }

  const sellerShop = await getShopBySellerId(
    supabase,
    user.id
  );

  if (!sellerShop) {
    return {
      success: false,
      error: "Seller shop not found",
    };
  }

  const parsed = productSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    price: formData.get("price"),
    stockQuantity: formData.get("stockQuantity"),
    categoryId: formData.get("categoryId"),
    image: formData
      .getAll("image")
      .filter((image): image is File => image instanceof File && image.size > 0),
  });

  if (!parsed.success) {
    return {
      success: false,
      error:
        parsed.error.issues[0]?.message ??
        "Invalid form data",
    };
  }

  let imageUrl: string | null | undefined;

  const imageFiles =
    Array.isArray(parsed.data.image)
      ? (parsed.data.image as File[])
      : [];

  const imageFile = imageFiles[0];

  if (imageFile && imageFile.size > 0) {
    const uploaded = await uploadProductImage(
      supabase,
      imageFile,
      user.id
    );

    if (uploaded.error || !uploaded.path) {
      return {
        success: false,
        error:
          uploaded.error ??
          "Failed to upload image",
      };
    }

    imageUrl = getProductImageUrl(
      supabase,
      uploaded.path
    );
  }

  const { error } = await supabase
    .from("products")
    .update({
      title: parsed.data.title,
      description:
        parsed.data.description,
      price: parsed.data.price,
      stock_quantity:
        parsed.data.stockQuantity,
      category_id:
        parsed.data.categoryId,
      ...(imageUrl
        ? {
            image_url: imageUrl,
          }
        : {}),
    })
    .eq("id", productId)
    .eq("shop_id", sellerShop.id);

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  revalidatePath("/seller/products");

  return {
    success: true,
  };
}
