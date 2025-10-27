import type { NormalizedProduct, ProductQuerySpec } from "../../schemas/product";
import { getCachedProducts, setCachedProducts } from "../cache";
import { searchBestBuyProducts } from "../bestbuy-api";

export const fetchBestBuyProducts = async (
  spec: ProductQuerySpec
): Promise<NormalizedProduct[]> => {
  const cached = getCachedProducts(spec, "bestbuy");
  if (cached) {
    return cached;
  }

  console.log("[Best Buy Fetcher] Fetching products from Best Buy Product API");
  const apiProducts = await searchBestBuyProducts(spec);

  if (apiProducts.length === 0) {
    console.log("[Best Buy Fetcher] No products found");
    return [];
  }

  // Best Buy URLs are already product links, no additional affiliate processing needed
  // User can add their affiliate program links later if they join Best Buy Affiliate Network

  setCachedProducts(spec, "bestbuy", apiProducts);
  return apiProducts;
};
