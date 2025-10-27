import type { NormalizedProduct, ProductQuerySpec } from "../../schemas/product";
import { env } from "../../utils/env";
import { sanitizeAffiliateUrl, isHttpsUrl } from "../../utils/url";
import { getCachedProducts, setCachedProducts } from "../cache";
import { sheinCatalog } from "./catalog";

const FALLBACK_SITE_ID = "trendella";

const matchesSpec = (product: typeof sheinCatalog[number], spec: ProductQuerySpec) => {
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
  const siteId = env.AFFILIATE_SHEIN_SITE_ID || FALLBACK_SITE_ID;
  const url = new URL(baseUrl);
  url.searchParams.set("aff_id", siteId);
  url.searchParams.set("utm_source", "affiliate");
  return sanitizeAffiliateUrl(url.toString());
};

export const fetchSheinProducts = async (
  spec: ProductQuerySpec
): Promise<NormalizedProduct[]> => {
  const cached = getCachedProducts(spec, "shein");
  if (cached) {
    return cached;
  }

  const products = sheinCatalog
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

  setCachedProducts(spec, "shein", products);
  return products;
};
