import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getCategories } from "@/repositories/category.repository";
import { getSellerEditableProductById } from "@/repositories/product.repository";
import { getShopBySellerId } from "@/repositories/shop.repository";

import { ProductForm } from "@/features/products/components/product-form";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const sellerShop = await getShopBySellerId(supabase, user.id);

  if (!sellerShop) {
    redirect("/seller/products");
  }

  const product = await getSellerEditableProductById(
    supabase,
    id,
    sellerShop.id,
  );

  if (!product) {
    redirect("/seller/products");
  }

  const categories = await getCategories(supabase);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Product</h1>

        <p className="text-sm text-muted-foreground">
          Update your product listing.
        </p>
      </div>

      <ProductForm
        categories={categories}
        initialValues={{
          title: product.title,
          description: product.description ?? "",
          imageUrl: product.image_url,
          price: product.price,
          stockQuantity: product.stock_quantity,
          categoryId: product.category_id ?? "",
        }}
        productId={product.id}
        mode="edit"
      />
    </div>
  );
}
