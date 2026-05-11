import type { ActionResult } from "@/features/actions/action-result";

export type ProductStockState = {
  stockQuantity: number | null | undefined;
  isActive: boolean | null | undefined;
};

export function validateProductCanBeAddedToCart(
  product: ProductStockState | null | undefined,
  currentQuantity = 0,
): ActionResult {
  if (!product?.isActive) {
    return {
      success: false,
      error: "This product is unavailable",
    };
  }

  const stockQuantity = product.stockQuantity ?? 0;

  if (stockQuantity <= 0) {
    return {
      success: false,
      error: "This product is out of stock",
    };
  }

  if (currentQuantity >= stockQuantity) {
    return {
      success: false,
      error: `Only ${stockQuantity} in stock`,
    };
  }

  return {
    success: true,
  };
}

export function validateCartQuantityUpdate(
  product: ProductStockState | null | undefined,
  quantity: number,
): ActionResult {
  if (quantity <= 0) {
    return {
      success: true,
    };
  }

  if (!product?.isActive) {
    return {
      success: false,
      error: "This product is unavailable",
    };
  }

  const stockQuantity = product.stockQuantity ?? 0;

  if (quantity > stockQuantity) {
    return {
      success: false,
      error: `Only ${stockQuantity} in stock`,
    };
  }

  return {
    success: true,
  };
}
