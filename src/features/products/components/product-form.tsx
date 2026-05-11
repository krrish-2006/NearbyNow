"use client";

import { useTransition } from "react";

import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import {
  productSchema,
  ProductSchemaInput,
  ProductSchemaValues,
} from "@/features/products/schemas/product.schema";

import { createProductAction } from "@/features/products/actions/create-product.action";

import { updateProductAction } from "@/features/products/actions/update-product.action";

type ProductFormProps = {
  categories: {
    id: string;
    name: string;
  }[];

  initialValues?: {
    title: string;
    description: string;
    price: number;
    stockQuantity: number;
    categoryId: string;
  };

  mode?: "create" | "edit";

  productId?: string;
};

export function ProductForm({
  categories,
  initialValues,
  mode = "create",
  productId,
}: ProductFormProps) {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductSchemaInput, unknown, ProductSchemaValues>({
    resolver: zodResolver(productSchema),

    defaultValues: {
      title: initialValues?.title ?? "",

      description: initialValues?.description ?? "",

      price: initialValues?.price ?? 0,

      stockQuantity: initialValues?.stockQuantity ?? 0,

      categoryId: initialValues?.categoryId ?? "",
    },
  });

  async function onSubmit(values: ProductSchemaValues) {
    const formData = new FormData();

    formData.append("title", values.title);

    formData.append("description", values.description);

    formData.append("price", values.price.toString());

    formData.append("stockQuantity", values.stockQuantity.toString());

    formData.append("categoryId", values.categoryId);

    const imageValue = values.image as File | FileList | undefined | null;

    const imageFile =
      imageValue instanceof FileList
        ? (imageValue.item(0) ?? undefined)
        : (imageValue ?? undefined);

    if (imageFile instanceof File) {
      formData.append("image", imageFile);
    }

    startTransition(async () => {
      const result =
        mode === "edit" && productId
          ? await updateProductAction(productId, formData)
          : await createProductAction(formData);

      if (!result.success) {
        alert("error" in result ? result.error : "Something went wrong");

        return;
      }

      alert(
        mode === "edit"
          ? "Product updated successfully"
          : "Product created successfully",
      );
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium">Product Title</label>

        <input
          type="text"
          {...register("title")}
          className="w-full rounded-xl border px-4 py-3"
        />

        {errors.title && (
          <p className="text-sm text-red-500">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>

        <textarea
          {...register("description")}
          className="min-h-[120px] w-full rounded-xl border px-4 py-3"
        />

        {errors.description && (
          <p className="text-sm text-red-500">{errors.description.message}</p>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Price</label>

          <input
            type="number"
            {...register("price")}
            className="w-full rounded-xl border px-4 py-3"
          />

          {errors.price && (
            <p className="text-sm text-red-500">{errors.price.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Stock Quantity</label>

          <input
            type="number"
            {...register("stockQuantity")}
            className="w-full rounded-xl border px-4 py-3"
          />

          {errors.stockQuantity && (
            <p className="text-sm text-red-500">
              {errors.stockQuantity.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Category</label>

        <select
          {...register("categoryId")}
          className="w-full rounded-xl border px-4 py-3"
        >
          <option value="">Select category</option>

          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        {errors.categoryId && (
          <p className="text-sm text-red-500">{errors.categoryId.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Product Image</label>

        <input
          type="file"
          accept="image/*"
          {...register("image")}
          className="w-full rounded-xl border px-4 py-3"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-xl bg-black px-6 py-3 text-white disabled:opacity-50"
      >
        {isPending
          ? mode === "edit"
            ? "Updating..."
            : "Creating..."
          : mode === "edit"
            ? "Update Product"
            : "Create Product"}
      </button>
    </form>
  );
}
