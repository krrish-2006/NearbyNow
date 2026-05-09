"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

import {
  uploadProductImage,
  getProductImageUrl,
} from "@/lib/storage/product-image";

import {
  createProductService,
} from "@/services/product.service";

import {
  productSchema,
} from "@/features/products/schemas/product.schema";

import {
  getShopBySellerId,
} from "@/repositories/shop.repository";

export async function createProductAction(
  formData: FormData
) {
  const supabase: any = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "Unauthorized",
    };
  }

  const parsed = productSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    price: formData.get("price"),
    stockQuantity: formData.get("stockQuantity"),
    categoryId: formData.get("categoryId"),
    image:
    formData.get("image") instanceof File
    ? formData.get("image")
    : undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      error:
        parsed.error.issues[0]?.message ??
        "Invalid form data",
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

  let imageUrl: string | null = null;

  const imageFile =
  parsed.data.image as File | undefined;

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

  const result =
    await createProductService(
      supabase,
      {
        shop_id: sellerShop.id,
        title: parsed.data.title,
        description:
          parsed.data.description,
        price: parsed.data.price,
        stock_quantity:
          parsed.data.stockQuantity,
        category_id:
          parsed.data.categoryId,
        image_url: imageUrl,
      }
    );

  if (!result.success) {
    return result;
  }

  revalidatePath("/seller/products");

  return result;
}
