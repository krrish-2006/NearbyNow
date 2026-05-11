import { SupabaseClient } from "@supabase/supabase-js";

import { Database, Tables } from "@/types/database";
import type {
  MarketplaceProduct,
  ProductDetails,
  ProductFilters,
} from "@/features/products/types/product.types";

type Product = Tables<"products">;

const PRODUCT_CARD_SELECT = `
  id,
  title,
  description,
  price,
  image_url,
  stock_quantity,
  shops!products_shop_id_fkey (
    name
  )
`;

const PRODUCT_DETAILS_SELECT = `
  *,
  shops!products_shop_id_fkey (
    name
  ),
  categories (
    name
  )
`;

function toMarketplaceProducts(data: unknown): MarketplaceProduct[] {
  return Array.isArray(data) ? (data as MarketplaceProduct[]) : [];
}

export async function getProductsByShopId(
  supabase: SupabaseClient<Database>,
  shopId: string
): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data;
}

export async function getProductById(
  supabase: SupabaseClient<Database>,
  productId: string
): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .single();

  if (error) {
    return null;
  }

  return data;
}

export async function getMarketplaceProducts(
  supabase: SupabaseClient<Database>,
  filters: ProductFilters = {}
): Promise<MarketplaceProduct[]> {
  let query = supabase.from("products").select(PRODUCT_CARD_SELECT);

  if (filters.search) {
    query = query.ilike("title", `%${filters.search}%`);
  }

  if (filters.categoryId) {
    query = query.eq("category_id", filters.categoryId);
  }

  const { data, error } = await query.order("created_at", {
    ascending: false,
  });

  if (error) {
    return [];
  }

  return toMarketplaceProducts(data);
}

export async function getProductDetails(
  supabase: SupabaseClient<Database>,
  productId: string
): Promise<ProductDetails | null> {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_DETAILS_SELECT)
    .eq("id", productId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as ProductDetails;
}

export async function getRelatedProducts(
  supabase: SupabaseClient<Database>,
  product: Pick<Product, "id" | "category_id">
): Promise<MarketplaceProduct[]> {
  if (!product.category_id) {
    return [];
  }

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_CARD_SELECT)
    .eq("category_id", product.category_id)
    .neq("id", product.id)
    .limit(4);

  if (error) {
    return [];
  }

  return toMarketplaceProducts(data);
}

export async function getExistingCartItemId(
  supabase: SupabaseClient<Database>,
  userId: string | undefined,
  productId: string
): Promise<string | null> {
  if (!userId) {
    return null;
  }

  const { data, error } = await supabase
    .from("cart_items")
    .select("id")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data.id;
}

export async function createProduct(
  supabase: SupabaseClient<Database>,
  values: Database["public"]["Tables"]["products"]["Insert"]
): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .insert(values)
    .select()
    .single();

  if (error) {
    return null;
  }

  return data;
}

export async function updateProduct(
  supabase: SupabaseClient<Database>,
  productId: string,
  values: Database["public"]["Tables"]["products"]["Update"]
): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .update(values)
    .eq("id", productId)
    .select()
    .single();

  if (error) {
    return null;
  }

  return data;
}

export async function deleteProduct(
  supabase: SupabaseClient<Database>,
  productId: string
): Promise<boolean> {
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId);

  return !error;
}
