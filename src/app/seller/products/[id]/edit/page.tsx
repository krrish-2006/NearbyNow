import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { ProductForm } from "@/features/products/components/product-form";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = await params;

  const supabase: any = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (!product) {
    redirect("/seller/products");
  }

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .order("name");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Product</h1>

        <p className="text-sm text-muted-foreground">
          Update your product listing.
        </p>
      </div>

      <ProductForm
        categories={categories ?? []}
        initialValues={{
          title: product.title,
          description: product.description,
          price: product.price,
          stockQuantity: product.stock_quantity,
          categoryId: product.category_id,
        }}
        productId={product.id}
        mode="edit"
      />
    </div>
  );
}
