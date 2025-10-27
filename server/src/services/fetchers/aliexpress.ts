import type { NormalizedProduct, ProductQuerySpec } from "../../schemas/product";
import { env } from "../../utils/env";
import { sanitizeAffiliateUrl, isHttpsUrl } from "../../utils/url";
import { getCachedProducts, setCachedProducts } from "../cache";
import { aliexpressCatalog } from "./catalog";

const FALLBACK_CAMPAIGN = "trendella_campaign";
const FALLBACK_APP = "trendella_app";

const matchesSpec = (product: typeof aliexpressCatalog[number], spec: ProductQuerySpec) => {
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
  const campaign = env.AFFILIATE_ALI_CAMPAIGN_ID || FALLBACK_CAMPAIGN;
  const app = env.AFFILIATE_ALI_APP_ID || FALLBACK_APP;
  const url = new URL(baseUrl);
  url.searchParams.set("aff_fcid", campaign);
  url.searchParams.set("aff_fsk", app);
  url.searchParams.set("aff_platform", "portals-tool");
  url.searchParams.set("aff_trace_key", campaign);
  return sanitizeAffiliateUrl(url.toString());
};

export const fetchAliExpressProducts = async (
  spec: ProductQuerySpec
): Promise<NormalizedProduct[]> => {
  const cached = getCachedProducts(spec, "aliexpress");
  if (cached) {
    return cached;
  }

  const products = aliexpressCatalog
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

  setCachedProducts(spec, "aliexpress", products);
  return products;
};
