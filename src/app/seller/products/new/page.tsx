import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getCategories } from "@/repositories/category.repository";

import { ProductForm } from "@/features/products/components/product-form";

export default async function NewProductPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const categories = await getCategories(supabase);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create Product</h1>

        <p className="text-sm text-muted-foreground">
          Add a new product to your shop.
        </p>
      </div>

      <ProductForm categories={categories} />
    </div>
  );
}
