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
    images?: {
      id: string;
      imageUrl: string;
    }[];
    price: number;
    stockQuantity: number;
    categoryId: string;
  };

  mode?: "create" | "edit";

  productId?: string;
};

type SelectedImage = {
  id: string;
  file: File;
  previewUrl: string;
};

type ExistingImage = {
  id: string;
  imageUrl: string;
};

const MAX_CLIENT_IMAGE_BYTES = 1_200_000;
const MAX_IMAGE_DIMENSION = 1600;
const IMAGE_COMPRESSION_QUALITY = 0.82;

function getJpegFileName(fileName: string): string {
  return fileName.replace(/\.[^/.]+$/, "") + ".jpg";
}

async function compressProductImage(file: File): Promise<File> {
  if (file.size <= MAX_CLIENT_IMAGE_BYTES || !file.type.startsWith("image/")) {
    return file;
  }

  const imageBitmap = await createImageBitmap(file).catch(() => null);

  if (!imageBitmap) {
    return file;
  }

  const scale = Math.min(
    1,
    MAX_IMAGE_DIMENSION / Math.max(imageBitmap.width, imageBitmap.height),
  );
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(imageBitmap.width * scale));
  canvas.height = Math.max(1, Math.round(imageBitmap.height * scale));

  const context = canvas.getContext("2d");

  if (!context) {
    imageBitmap.close();

    return file;
  }

  context.drawImage(imageBitmap, 0, 0, canvas.width, canvas.height);
  imageBitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", IMAGE_COMPRESSION_QUALITY);
  });

  if (!blob || blob.size >= file.size) {
    return file;
  }

  return new File([blob], getJpegFileName(file.name), {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

export function ProductForm({
  categories,
  initialValues,
  mode = "create",
  productId,
}: ProductFormProps) {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();

  const [existingImages, setExistingImages] = useState<ExistingImage[]>(
    initialValues?.images ?? [],
  );
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isPreparingImages, setIsPreparingImages] = useState(false);
  const selectedImagesRef = useRef<SelectedImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const totalImageCount = existingImages.length + selectedImages.length;
  const canAddImages =
    totalImageCount < MAX_PRODUCT_IMAGES && !isPreparingImages;

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
    selectedImagesRef.current = selectedImages;
  }, [selectedImages]);

  useEffect(() => {
    return () => {
      selectedImagesRef.current.forEach((image) =>
        URL.revokeObjectURL(image.previewUrl),
      );
    };
  }, []);

  function resetFileInput() {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function removeExistingImage(imageId: string) {
    setExistingImages((images) =>
      images.filter((image) => image.id !== imageId),
    );
    setImageError(null);
  }

  function removeSelectedImage(imageId: string) {
    setSelectedImages((images) => {
      const imageToRemove = images.find((image) => image.id === imageId);

      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.previewUrl);
      }

      return images.filter((image) => image.id !== imageId);
    });
    setImageError(null);
    resetFileInput();
  }

  async function handleImageChange(files: FileList | null) {
    const nextFiles = Array.from(files ?? []);
    const remainingSlots = MAX_PRODUCT_IMAGES - totalImageCount;

    if (nextFiles.length === 0) {
      return;
    }

    if (nextFiles.length > remainingSlots) {
      setImageError(`You can upload up to ${MAX_PRODUCT_IMAGES} images`);
      resetFileInput();

      return;
    }

    setImageError(null);
    setIsPreparingImages(true);

    const preparedFiles = await Promise.all(
      nextFiles.map((file) => compressProductImage(file)),
    );

    const oversizedFile = preparedFiles.find(
      (file) => file.size > MAX_CLIENT_IMAGE_BYTES,
    );

    if (oversizedFile) {
      setImageError(
        "One image is too large. Please choose a smaller product image.",
      );
      setIsPreparingImages(false);
      resetFileInput();

      return;
    }

    setSelectedImages((images) => [
      ...images,
      ...preparedFiles.map((file) => ({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
      })),
    ]);
    setIsPreparingImages(false);
    resetFileInput();
  }

  async function onSubmit(values: ProductSchemaValues) {
    const formData = new FormData();

    formData.append("title", values.title);

    formData.append("description", values.description ?? "");

    formData.append("price", values.price.toString());

    formData.append("stockQuantity", values.stockQuantity.toString());

    formData.append("categoryId", values.categoryId);

    for (const image of existingImages) {
      formData.append("existingImageId", image.id);
    }

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
        <label className="text-sm font-medium">Description optional</label>

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
          disabled={!canAddImages}
          className="sr-only"
          id="product-image-input"
        />

        <div className="rounded-2xl border border-dashed p-4">
          <div className="space-y-4">
            {totalImageCount > 0 && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {existingImages.map((image, index) => (
                  <div
                    key={image.id}
                    className="relative overflow-hidden rounded-xl border bg-neutral-50"
                  >
                    <Image
                      src={image.imageUrl}
                      alt={`Current product image ${index + 1}`}
                      width={320}
                      height={128}
                      className="h-32 w-full object-cover"
                    />

                    <button
                      type="button"
                      onClick={() => removeExistingImage(image.id)}
                      className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-bold text-red-600 shadow transition hover:bg-red-600 hover:text-white"
                      aria-label={`Remove current image ${index + 1}`}
                      title="Remove image"
                    >
                      X
                    </button>

                    <p className="truncate px-3 py-2 text-xs font-medium text-neutral-600">
                      {index === 0
                        ? "Current primary image"
                        : `Current image ${index + 1}`}
                    </p>
                  </div>
                ))}

                {selectedImages.map((image, index) => (
                  <div
                    key={image.id}
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

                    <button
                      type="button"
                      onClick={() => removeSelectedImage(image.id)}
                      className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-bold text-red-600 shadow transition hover:bg-red-600 hover:text-white"
                      aria-label={`Remove selected image ${index + 1}`}
                      title="Remove image"
                    >
                      X
                    </button>

                    <p className="truncate px-3 py-2 text-xs font-medium text-neutral-600">
                      {image.file.name}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {totalImageCount === 0 &&
              initialValues?.imageUrl &&
              !initialValues.images?.length && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="overflow-hidden rounded-xl border bg-neutral-50">
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
              </div>
            )}

            <label
              htmlFor="product-image-input"
              className={`inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold transition ${
                canAddImages
                  ? "cursor-pointer bg-black text-white hover:opacity-90"
                  : "cursor-not-allowed bg-neutral-200 text-neutral-500"
              }`}
              aria-disabled={!canAddImages}
            >
              {isPreparingImages
                ? "Preparing..."
                : mode === "edit"
                  ? "Add Images"
                  : "Choose Files"}
            </label>
          </div>

          <p className="mt-3 text-xs text-neutral-500">
            Up to {MAX_PRODUCT_IMAGES} images can be uploaded. The first
            selected image becomes the primary image.
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
