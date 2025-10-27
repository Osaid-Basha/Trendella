import type { NormalizedProduct, ProductQuerySpec } from "../../schemas/product";
import { getCachedProducts, setCachedProducts } from "../cache";
import { searchEtsyProducts } from "../etsy-api";

export const fetchEtsyProducts = async (
  spec: ProductQuerySpec
): Promise<NormalizedProduct[]> => {
  const cached = getCachedProducts(spec, "etsy");
  if (cached) {
    return cached;
  }

  console.log("[Etsy Fetcher] Fetching products from Etsy Open API");
  const apiProducts = await searchEtsyProducts(spec);

  if (apiProducts.length === 0) {
    console.log("[Etsy Fetcher] No products found");
    return [];
  }

  // Etsy URLs are already product links
  // For affiliate links, user would need to join Etsy Affiliate Program and modify URLs
  // This can be added later with AFFILIATE_ETSY_ID in env

  setCachedProducts(spec, "etsy", apiProducts);
  return apiProducts;
};
