import { z } from "zod";

export const productSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(120, "Title is too long"),

  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description is too long"),

  price: z.coerce.number().min(0, "Price cannot be negative"),

  stockQuantity: z.coerce.number().int().min(0, "Stock cannot be negative"),

  categoryId: z.string().uuid(),

  image: z.unknown().optional(),
});

export type ProductSchemaValues = z.infer<typeof productSchema>;
export type ProductSchemaInput = z.input<typeof productSchema>;
