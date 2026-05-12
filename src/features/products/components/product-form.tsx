"use client";

import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type ChangeEvent,
} from "react";

import Image from "next/image";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import {
  countWords,
  MAX_DESCRIPTION_WORDS,
  MAX_PRODUCT_IMAGES,
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
    imageUrl: string | null;
    price: number;
    stockQuantity: number;
    categoryId: string;
  };

  mode?: "create" | "edit";

  productId?: string;
};

type SelectedImage = {
  file: File;
  previewUrl: string;
};

export function ProductForm({
  categories,
  initialValues,
  mode = "create",
  productId,
}: ProductFormProps) {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();

  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const [descriptionWordCount, setDescriptionWordCount] = useState(
    countWords(initialValues?.description ?? ""),
  );

  const descriptionRegister = register("description", {
    onChange: (event: ChangeEvent<HTMLTextAreaElement>) => {
      setDescriptionWordCount(countWords(event.target.value));
    },
  });

  useEffect(() => {
    return () => {
      selectedImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    };
  }, [selectedImages]);

  function clearSelectedImages() {
    selectedImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    setSelectedImages([]);
    setImageError(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleImageChange(files: FileList | null) {
    const nextFiles = Array.from(files ?? []);

    selectedImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));

    if (nextFiles.length > MAX_PRODUCT_IMAGES) {
      setSelectedImages([]);
      setImageError(`You can upload up to ${MAX_PRODUCT_IMAGES} images`);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      return;
    }

    setImageError(null);
    setSelectedImages(
      nextFiles.map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
      })),
    );
  }

  async function onSubmit(values: ProductSchemaValues) {
    const formData = new FormData();

    formData.append("title", values.title);

    formData.append("description", values.description);

    formData.append("price", values.price.toString());

    formData.append("stockQuantity", values.stockQuantity.toString());

    formData.append("categoryId", values.categoryId);

    for (const image of selectedImages) {
      formData.append("image", image.file);
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

      router.push("/seller/products");
      router.refresh();
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
          {...descriptionRegister}
          className="min-h-[120px] w-full rounded-xl border px-4 py-3"
        />

        {errors.description && (
          <p className="text-sm text-red-500">{errors.description.message}</p>
        )}

        <p
          className={`text-xs ${
            descriptionWordCount > MAX_DESCRIPTION_WORDS
              ? "text-red-500"
              : "text-neutral-500"
          }`}
        >
          {descriptionWordCount}/{MAX_DESCRIPTION_WORDS} words
        </p>
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
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(event) => handleImageChange(event.target.files)}
          className="sr-only"
          id="product-image-input"
        />

        <div className="rounded-2xl border border-dashed p-4">
          {selectedImages.length === 0 ? (
            <div className="space-y-4">
              {initialValues?.imageUrl && (
                <div className="max-w-sm overflow-hidden rounded-xl border bg-neutral-50">
                  <Image
                    src={initialValues.imageUrl}
                    alt="Current product image"
                    width={320}
                    height={128}
                    className="h-32 w-full object-cover"
                  />

                  <p className="truncate px-3 py-2 text-xs font-medium text-neutral-600">
                    Current primary image
                  </p>
                </div>
              )}

              <label
                htmlFor="product-image-input"
                className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl bg-black px-5 text-sm font-semibold text-white transition hover:opacity-90"
              >
                {initialValues?.imageUrl ? "Replace Image" : "Choose File"}
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {selectedImages.map((image) => (
                  <div
                    key={`${image.file.name}-${image.previewUrl}`}
                    className="relative overflow-hidden rounded-xl border bg-neutral-50"
                  >
                    <Image
                      src={image.previewUrl}
                      alt={image.file.name}
                      width={320}
                      height={128}
                      unoptimized
                      className="h-32 w-full object-cover"
                    />

                    <p className="truncate px-3 py-2 text-xs font-medium text-neutral-600">
                      {image.file.name}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label
                  htmlFor="product-image-input"
                  className="inline-flex h-10 cursor-pointer items-center justify-center rounded-xl border px-4 text-sm font-semibold transition hover:bg-neutral-100"
                >
                  Choose File
                </label>

                <button
                  type="button"
                  onClick={clearSelectedImages}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-red-200 bg-red-50 text-lg font-bold text-red-600 transition hover:bg-red-600 hover:text-white"
                  aria-label="Remove selected images"
                  title="Remove selected images"
                >
                  X
                </button>
              </div>
            </div>
          )}

          <p className="mt-3 text-xs text-neutral-500">
            Up to {MAX_PRODUCT_IMAGES} images can be selected. Current product
            storage saves the first selected image as the primary image.
          </p>
        </div>

        {imageError && <p className="text-sm text-red-500">{imageError}</p>}

        {errors.image && (
          <p className="text-sm text-red-500">{String(errors.image.message)}</p>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-12 items-center justify-center rounded-xl bg-black px-6 text-sm font-semibold text-white disabled:opacity-50"
        >
          {isPending
            ? mode === "edit"
              ? "Updating..."
              : "Creating..."
            : mode === "edit"
              ? "Update Product"
              : "Create Product"}
        </button>

        {mode === "edit" ? (
          <Link
            href="/seller/products"
            className="inline-flex h-12 items-center justify-center rounded-xl border px-6 text-sm font-semibold transition hover:bg-neutral-100"
          >
            Cancel Update
          </Link>
        ) : (
          <Link
            href="/seller/products"
            className="inline-flex h-12 items-center justify-center rounded-xl border px-6 text-sm font-semibold transition hover:bg-neutral-100"
          >
            Cancel
          </Link>
        )}
      </div>
    </form>
  );
}
