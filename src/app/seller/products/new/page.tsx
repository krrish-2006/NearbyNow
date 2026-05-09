import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { ProductForm } from "@/features/products/components/product-form";

type Category = {
  id: string;
  name: string;
};

export default async function NewProductPage() {
  const supabase: any = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data } = await supabase
    .from("categories")
    .select("id, name")
    .order("name");

  const categories: Category[] = data ?? [];

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
