import { SupabaseClient } from "@supabase/supabase-js";

import { Database } from "@/types/database.types";

const PRODUCT_IMAGE_BUCKET = "product-images";

function getFileExtension(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

function generateProductImagePath(
  sellerId: string,
  extension: string
): string {
  return `products/${sellerId}/${crypto.randomUUID()}-${Date.now()}.${extension}`;
}

export async function uploadProductImage(
  supabase: SupabaseClient<Database>,
  file: File,
  sellerId: string
): Promise<{ path: string | null; error: string | null }> {
  try {
    const extension = getFileExtension(file.name);

    if (!extension) {
      return {
        path: null,
        error: "Invalid file extension",
      };
    }

    const path = generateProductImagePath(sellerId, extension);

    const { error } = await supabase.storage
      .from(PRODUCT_IMAGE_BUCKET)
      .upload(path, file, {
        upsert: false,
      });

    if (error) {
      return {
        path: null,
        error: error.message,
      };
    }

    return {
      path,
      error: null,
    };
  } catch (error) {
    return {
      path: null,
      error: "Failed to upload image",
    };
  }
}

export function getProductImageUrl(
  supabase: SupabaseClient<Database>,
  path: string
): string {
  const { data } = supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .getPublicUrl(path);

  return data.publicUrl;
}

export async function deleteProductImage(
  supabase: SupabaseClient<Database>,
  path: string
): Promise<void> {
  try {
    await supabase.storage
      .from(PRODUCT_IMAGE_BUCKET)
      .remove([path]);
  } catch {
    console.error("Failed to delete product image");
  }
}
