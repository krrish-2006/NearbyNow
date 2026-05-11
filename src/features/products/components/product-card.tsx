import Image from "next/image";

import Link from "next/link";

import { formatInr } from "@/lib/formatters/currency";
import type { ProductCardProduct } from "@/features/products/types/product.types";

export default function ProductCard({
  product,
}: {
  product: ProductCardProduct;
}) {
  const stock =
    product.stock_quantity ?? 0;

  const isSoldOut =
    stock <= 0;

  const shop =
    Array.isArray(product.shops)
      ? product.shops[0]
      : product.shops;

  return (
    <Link
      href={`/products/${product.id}`}
      className="group overflow-hidden rounded-3xl border bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative aspect-square overflow-hidden bg-neutral-100">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.title}
            fill
            sizes="400px"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-neutral-400">
            No Image
          </div>
        )}

        {isSoldOut && (
          <div className="absolute left-4 top-4 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white shadow-lg">
            Sold Out
          </div>
        )}
      </div>

      <div className="space-y-3 p-4">
        {shop?.name && (
          <p className="text-sm text-neutral-500">{shop.name}</p>
        )}

        <h3 className="line-clamp-2 text-lg font-bold leading-snug">
          {product.title}
        </h3>

        <p className="line-clamp-2 text-sm text-neutral-500">
          {product.description}
        </p>

        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-2xl font-black">{formatInr(product.price)}</p>

            {!isSoldOut && (
              <p className="mt-1 text-xs text-neutral-500">
                In stock: {stock}
              </p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
