import type { NormalizedProduct, ProductQuerySpec } from "../../schemas/product";
import { env } from "../../utils/env";
import { sanitizeAffiliateUrl, isHttpsUrl } from "../../utils/url";
import { getCachedProducts, setCachedProducts } from "../cache";
import { amazonCatalog } from "./catalog";
import { searchAmazonProducts } from "../rapidapi-amazon";

const FALLBACK_TAG = "trendella-20";

const matchesSpec = (product: typeof amazonCatalog[number], spec: ProductQuerySpec) => {
  const { price, categories, brands_preferred, colors_preferred, keywords } = spec;
  const withinBudget =
    (!price.min || product.price.value >= price.min * 0.9) &&
    (!price.max || price.max === 0 || product.price.value <= price.max * 1.1);

  const categoryMatch =
    categories.length === 0 ||
    categories.some((category) => product.categories.includes(category.toLowerCase()));

  const colorMatch =
    colors_preferred.length === 0 ||
    (product.colors ?? []).some((color) =>
      colors_preferred.some((preferred) => color.toLowerCase().includes(preferred.toLowerCase()))
    );

  const keywordMatch = keywords.some((keyword) => {
    const normalised = keyword.toLowerCase();
    return (
      product.title.toLowerCase().includes(normalised) ||
      product.description_short.toLowerCase().includes(normalised) ||
      product.interests.some((interest) => interest.includes(normalised))
    );
  });

  const baseMatch = withinBudget && categoryMatch && colorMatch;
  if (!baseMatch) return false;

  // If the spec has preferred brands but none match, allow the product to pass so ranking can
  // handle boosting matches instead of filtering everything out.
  if (brands_preferred.length > 0) {
    const matchesBrand = (product.brands ?? []).some((brand) =>
      brands_preferred.some((preferred) => brand.toLowerCase().includes(preferred.toLowerCase()))
    );
    if (matchesBrand) {
      return true;
    }
  }

  if (keywordMatch) {
    (product as any).keyword_match = true;
  }

  return baseMatch;
};

const buildAffiliateUrl = (baseUrl: string) => {
  const tag = env.AFFILIATE_AMAZON_TAG || FALLBACK_TAG;
  const url = new URL(baseUrl);
  url.searchParams.set("tag", tag);
  return sanitizeAffiliateUrl(url.toString());
};

export const fetchAmazonProducts = async (
  spec: ProductQuerySpec
): Promise<NormalizedProduct[]> => {
  const cached = getCachedProducts(spec, "amazon");
  if (cached) {
    return cached;
  }

  // Try RapidAPI first if configured
  if (env.RAPIDAPI_KEY && env.RAPIDAPI_AMAZON_HOST) {
    console.log("[Amazon Fetcher] Using RapidAPI for real product search");
    const apiProducts = await searchAmazonProducts(spec);

    if (apiProducts.length > 0) {
      // Add affiliate tags to API results
      const productsWithAffiliateUrls = apiProducts.map(product => {
        // If the product URL doesn't have affiliate tag, add it
        let affiliateUrl = product.affiliate_url;
        try {
          const url = new URL(affiliateUrl);
          if (!url.searchParams.has('tag')) {
            url.searchParams.set('tag', env.AFFILIATE_AMAZON_TAG || FALLBACK_TAG);
            affiliateUrl = sanitizeAffiliateUrl(url.toString());
          }
        } catch (e) {
          console.warn(`[Amazon Fetcher] Invalid URL for product ${product.id}`);
        }

        return {
          ...product,
          affiliate_url: affiliateUrl
        };
      });

      setCachedProducts(spec, "amazon", productsWithAffiliateUrls);
      return productsWithAffiliateUrls;
    }

    console.log("[Amazon Fetcher] No products from API, falling back to static catalog");
  } else {
    console.log("[Amazon Fetcher] RapidAPI not configured, using static catalog");
  }

  // Fallback to static catalog
  const products = amazonCatalog
    .filter((product) => matchesSpec(product, spec))
    .map<NormalizedProduct>((product) => {
      const affiliate_url = buildAffiliateUrl(product.affiliate_base);
      if (!isHttpsUrl(product.image)) {
        throw new Error(`Invalid image URL for product ${product.id}`);
      }
      return {
        ...product,
        affiliate_url
      };
    })
    .slice(0, spec.limit);

  setCachedProducts(spec, "amazon", products);
  return products;
};
