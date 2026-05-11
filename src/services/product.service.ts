import { SupabaseClient } from "@supabase/supabase-js";

import {
  createProduct,
  deleteProduct,
  getProductById,
  updateProduct,
} from "@/repositories/product.repository";

import { Database } from "@/types/database";
import type { ActionResult } from "@/features/actions/action-result";

type ProductInsert =
  Database["public"]["Tables"]["products"]["Insert"];

type ProductUpdate =
  Database["public"]["Tables"]["products"]["Update"];

export async function createProductService(
  supabase: SupabaseClient<Database>,
  values: ProductInsert
): Promise<ActionResult<{ id: string }>> {
  const product = await createProduct(supabase, values);

  if (!product) {
    return {
      success: false,
      error: "Failed to create product",
    };
  }

  return {
    success: true,
    data: {
      id: product.id,
    },
  };
}

export async function updateProductService(
  supabase: SupabaseClient<Database>,
  productId: string,
  values: ProductUpdate
): Promise<ActionResult<{ id: string }>> {
  const existingProduct = await getProductById(
    supabase,
    productId
  );

  if (!existingProduct) {
    return {
      success: false,
      error: "Product not found",
    };
  }

  const updatedProduct = await updateProduct(
    supabase,
    productId,
    values
  );

  if (!updatedProduct) {
    return {
      success: false,
      error: "Failed to update product",
    };
  }

  return {
    success: true,
    data: {
      id: updatedProduct.id,
    },
  };
}

export async function deleteProductService(
  supabase: SupabaseClient<Database>,
  productId: string
): Promise<ActionResult<null>> {
  const existingProduct = await getProductById(
    supabase,
    productId
  );

  if (!existingProduct) {
    return {
      success: false,
      error: "Product not found",
    };
  }

  const deleted = await deleteProduct(
    supabase,
    productId
  );

  if (!deleted) {
    return {
      success: false,
      error: "Failed to delete product",
    };
  }

  return {
    success: true,
    data: null,
  };
}
