import { z } from "zod";

const MAX_DESCRIPTION_WORDS = 50;
const MAX_PRODUCT_IMAGES = 5;

function countWords(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

export const productSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(120, "Title is too long"),

  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .refine(
      (value) => countWords(value) <= MAX_DESCRIPTION_WORDS,
      `Description must be ${MAX_DESCRIPTION_WORDS} words or less`,
    ),

  price: z.coerce.number().min(0, "Price cannot be negative"),

  stockQuantity: z.coerce.number().int().min(0, "Stock cannot be negative"),

  categoryId: z.string().uuid(),

  image: z
    .unknown()
    .optional()
    .refine((value) => {
      if (!Array.isArray(value)) {
        return true;
      }

      return value.length <= MAX_PRODUCT_IMAGES;
    }, `You can upload up to ${MAX_PRODUCT_IMAGES} images`),
});

export type ProductSchemaValues = z.infer<typeof productSchema>;
export type ProductSchemaInput = z.input<typeof productSchema>;

export { MAX_DESCRIPTION_WORDS, MAX_PRODUCT_IMAGES, countWords };
