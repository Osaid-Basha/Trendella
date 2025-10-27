import type { NormalizedProduct } from "../schemas/product";

export const dedupeProducts = (products: NormalizedProduct[]): NormalizedProduct[] => {
  const seen = new Map<string, NormalizedProduct>();
  for (const product of products) {
    if (!seen.has(product.id)) {
      seen.set(product.id, product);
    }
  }
  return Array.from(seen.values());
};
