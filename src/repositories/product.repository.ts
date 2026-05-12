import { SupabaseClient } from "@supabase/supabase-js";

import { Database, Tables } from "@/types/database";
import type {
  MarketplaceProduct,
  ProductDetails,
  ProductFilters,
} from "@/features/products/types/product.types";
import type {
  SellerEditableProduct,
  SellerProductCard,
} from "@/features/seller/types/seller.types";
import {
  generateTextEmbedding,
  toPgVectorLiteral,
} from "@/lib/ai/huggingface-embeddings";
import {
  parseMarketplaceSearchQuery,
} from "@/features/search/utils/marketplace-query";
import {
  filterRelevantSemanticResults,
} from "@/features/search/utils/semantic-results";

type Product = Tables<"products">;
type ProductSearchRow =
  Database["public"]["Functions"]["search_marketplace_products"]["Returns"][number];

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

function toMarketplaceProductsFromSearchRows(
  data: ProductSearchRow[] | null
): MarketplaceProduct[] {
  if (!data) {
    return [];
  }

  return data.map((product) => ({
    id: product.id,
    title: product.title,
    description: product.description,
    price: product.price,
    image_url: product.image_url,
    stock_quantity: product.stock_quantity,
    shops: {
      name: product.shop_name,
    },
  }));
}

async function getSemanticMarketplaceProducts(
  supabase: SupabaseClient<Database>,
  filters: ProductFilters
): Promise<MarketplaceProduct[]> {
  if (!filters.search?.trim()) {
    return [];
  }

  const parsedSearch = parseMarketplaceSearchQuery(filters.search);
  const embedding = await generateTextEmbedding(
    parsedSearch.cleanedSearch,
    "query",
  );

  if (!embedding) {
    return [];
  }

  const { data, error } = await supabase.rpc("search_marketplace_products", {
    p_query_embedding: toPgVectorLiteral(embedding),
    p_category_id: filters.categoryId ?? null,
    p_max_price: parsedSearch.maxPrice,
    p_prefer_cheap: parsedSearch.preferCheap,
    p_match_count: 32,
  });

  if (error) {
    return [];
  }

  return toMarketplaceProductsFromSearchRows(
    filterRelevantSemanticResults(data ?? []),
  );
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

export async function getSellerProductCardsByShopId(
  supabase: SupabaseClient<Database>,
  shopId: string
): Promise<SellerProductCard[]> {
  const { data, error } = await supabase
    .from("products")
    .select(
      `
        id,
        title,
        price,
        stock_quantity,
        image_url
      `,
    )
    .eq("shop_id", shopId)
    .order("created_at", {
      ascending: false,
    });

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

export async function getSellerEditableProductById(
  supabase: SupabaseClient<Database>,
  productId: string,
  shopId: string
): Promise<SellerEditableProduct | null> {
  const { data, error } = await supabase
    .from("products")
    .select(
      `
        id,
        title,
        description,
        image_url,
        price,
        stock_quantity,
        category_id
      `,
    )
    .eq("id", productId)
    .eq("shop_id", shopId)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

export async function getMarketplaceProducts(
  supabase: SupabaseClient<Database>,
  filters: ProductFilters = {}
): Promise<MarketplaceProduct[]> {
  const parsedSearch = filters.search
    ? parseMarketplaceSearchQuery(filters.search)
    : null;

  if (filters.search) {
    const semanticProducts = await getSemanticMarketplaceProducts(
      supabase,
      filters,
    );

    if (semanticProducts.length > 0) {
      return semanticProducts;
    }
  }

  let query = supabase.from("products").select(PRODUCT_CARD_SELECT);

  if (filters.search) {
    query = query.ilike("title", `%${filters.search}%`);
  }

  if (filters.categoryId) {
    query = query.eq("category_id", filters.categoryId);
  }

  if (parsedSearch?.maxPrice !== null && parsedSearch?.maxPrice !== undefined) {
    query = query.lte("price", parsedSearch.maxPrice);
  }

  const { data, error } = await query.order(
    parsedSearch?.preferCheap ? "price" : "created_at",
    {
      ascending: Boolean(parsedSearch?.preferCheap),
    },
  );

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
