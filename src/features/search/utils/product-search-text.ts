type ProductSearchTextInput = {
  title: string;
  description: string | null;
  price: number;
};

export function buildProductSearchText(product: ProductSearchTextInput): string {
  return [
    product.title,
    product.description,
    `price ${product.price}`,
    `₹${product.price}`,
  ]
    .filter((part): part is string => Boolean(part?.trim()))
    .join("\n");
}
