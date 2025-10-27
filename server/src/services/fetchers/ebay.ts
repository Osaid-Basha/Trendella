import type { NormalizedProduct, ProductQuerySpec } from "../../schemas/product";
import { env } from "../../utils/env";
import { sanitizeAffiliateUrl } from "../../utils/url";
import { getCachedProducts, setCachedProducts } from "../cache";
import { searchEbayProducts } from "../ebay-api";

const buildAffiliateUrl = (baseUrl: string): string => {
  // For now, return the URL as-is
  // eBay Partner Network affiliate links require campid parameter
  // User can add AFFILIATE_EBAY_CAMPAIGN_ID to .env later
  try {
    const url = new URL(baseUrl);

    // Add eBay Partner Network campaign ID if configured
    if (env.AFFILIATE_EBAY_CAMPAIGN_ID) {
      url.searchParams.set("campid", env.AFFILIATE_EBAY_CAMPAIGN_ID);
    }

    return sanitizeAffiliateUrl(url.toString());
  } catch (e) {
    console.warn("[eBay Fetcher] Invalid URL, returning as-is");
    return baseUrl;
  }
};

export const fetchEbayProducts = async (
  spec: ProductQuerySpec
): Promise<NormalizedProduct[]> => {
  const cached = getCachedProducts(spec, "ebay");
  if (cached) {
    return cached;
  }

  console.log("[eBay Fetcher] Fetching products from eBay Finding API");
  const apiProducts = await searchEbayProducts(spec);

  if (apiProducts.length === 0) {
    console.log("[eBay Fetcher] No products found");
    return [];
  }

  // Add affiliate tags to results
  const productsWithAffiliateUrls = apiProducts.map(product => {
    const affiliateUrl = buildAffiliateUrl(product.affiliate_url);
    return {
      ...product,
      affiliate_url: affiliateUrl
    };
  });

  setCachedProducts(spec, "ebay", productsWithAffiliateUrls);
  return productsWithAffiliateUrls;
};
