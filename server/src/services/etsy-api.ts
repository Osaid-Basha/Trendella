import axios from "axios";
import { env } from "../utils/env";
import type { NormalizedProduct, ProductQuerySpec } from "../schemas/product";

interface EtsyListingImage {
  url_570xN?: string;
  url_fullxfull?: string;
}

interface EtsyPrice {
  amount: number;
  divisor: number;
  currency_code: string;
}

interface EtsyListing {
  listing_id: number;
  title: string;
  description?: string;
  price?: EtsyPrice;
  url?: string;
  images?: EtsyListingImage[];
  tags?: string[];
  quantity?: number;
  num_favorers?: number;
  state?: string;
  shop_section_id?: number;
}

interface EtsySearchResponse {
  count: number;
  results: EtsyListing[];
}

const ETSY_API_URL = "https://openapi.etsy.com/v3/application/listings/active";

const buildSearchUrl = (keywords: string, limit: number = 24): string => {
  const params = new URLSearchParams({
    keywords,
    limit: Math.min(limit, 100).toString(),
    offset: "0",
    sort_on: "relevancy"
  });

  return `${ETSY_API_URL}?${params.toString()}`;
};

const calculatePrice = (priceObj?: EtsyPrice): number => {
  if (!priceObj) return 0;
  return priceObj.amount / priceObj.divisor;
};

const convertToNormalizedProduct = (listing: EtsyListing): NormalizedProduct | null => {
  if (!listing.listing_id || !listing.title || !listing.url) {
    return null;
  }

  const price = calculatePrice(listing.price);
  const currency = listing.price?.currency_code || "USD";

  // Get the best quality image available
  const image = listing.images?.[0]?.url_fullxfull ||
                listing.images?.[0]?.url_570xN ||
                "https://via.placeholder.com/300x300?text=No+Image";

  const badges: string[] = [];
  if (listing.num_favorers && listing.num_favorers > 100) badges.push("popular");
  if (price > 0 && price < 30) badges.push("budget_friendly");

  return {
    id: `etsy_${listing.listing_id}`,
    store: "etsy",
    title: listing.title,
    description_short: listing.description?.substring(0, 150) || listing.title,
    image,
    price: {
      value: price,
      currency
    },
    rating: {
      value: 0, // Etsy API doesn't provide ratings in public search
      count: 0
    },
    badges,
    affiliate_url: listing.url,
    raw: {
      listing_id: listing.listing_id,
      tags: listing.tags,
      num_favorers: listing.num_favorers,
      quantity: listing.quantity
    }
  };
};

export const searchEtsyProducts = async (
  spec: ProductQuerySpec
): Promise<NormalizedProduct[]> => {
  if (!env.ETSY_API_KEY) {
    console.warn("[Etsy] API key not configured, skipping search");
    return [];
  }

  try {
    const searchQuery = spec.keywords.join(" ");
    if (!searchQuery.trim()) {
      console.warn("[Etsy] No search keywords provided");
      return [];
    }

    const url = buildSearchUrl(searchQuery, spec.limit || 24);

    console.log(`[Etsy] Searching for: "${searchQuery}"`);

    const response = await axios.get<EtsySearchResponse>(url, {
      headers: {
        "x-api-key": env.ETSY_API_KEY
      },
      timeout: 10000
    });

    const listings = response.data.results || [];

    console.log(`[Etsy] Found ${listings.length} listings`);

    const normalizedProducts = listings
      .map(convertToNormalizedProduct)
      .filter((product): product is NormalizedProduct => {
        if (!product) return false;
        if (product.price.value === 0) return false;

        // Budget filter - convert to USD if needed for comparison
        const { min, max } = spec.price;
        if (product.price.currency === spec.price.currency || product.price.currency === "USD") {
          if (min > 0 && product.price.value < min * 0.9) return false;
          if (max > 0 && product.price.value > max * 1.1) return false;
        }

        return true;
      });

    console.log(`[Etsy] Returning ${normalizedProducts.length} filtered products`);

    return normalizedProducts.slice(0, spec.limit || 24);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("[Etsy] Search failed:", error.response?.data || error.message);
      if (error.response?.status === 403) {
        console.error("[Etsy] API key may be invalid or not authorized");
      }
    } else {
      console.error("[Etsy] Unexpected error:", error);
    }
    return [];
  }
};
