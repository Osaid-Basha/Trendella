import axios from "axios";
import { env } from "../utils/env";
import type { NormalizedProduct, ProductQuerySpec } from "../schemas/product";

interface RapidAPIProduct {
  asin: string;
  product_title: string;
  product_price?: string;
  product_original_price?: string;
  product_star_rating?: string;
  product_num_ratings?: number;
  product_url: string;
  product_photo: string;
  is_prime?: boolean;
  sales_volume?: string;
}

interface RapidAPISearchResponse {
  data: {
    products: RapidAPIProduct[];
  };
}

const buildSearchUrl = (keywords: string, page: number = 1): string => {
  const searchQuery = keywords.replace(/\s+/g, "+");
  return `https://${env.RAPIDAPI_AMAZON_HOST}/search?query=${searchQuery}&page=${page}&country=US&sort_by=RELEVANCE&product_condition=ALL`;
};

const parsePrice = (priceStr?: string): number => {
  if (!priceStr) return 0;
  const cleaned = priceStr.replace(/[$,]/g, "");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

const parseRating = (ratingStr?: string): number => {
  if (!ratingStr) return 0;
  const parsed = parseFloat(ratingStr);
  return isNaN(parsed) ? 0 : Math.min(5, Math.max(0, parsed));
};

const convertToNormalizedProduct = (product: RapidAPIProduct): NormalizedProduct => {
  const price = parsePrice(product.product_price || product.product_original_price);
  const rating = parseRating(product.product_star_rating);
  const reviewCount = product.product_num_ratings || 0;

  const badges: string[] = [];
  if (product.is_prime) badges.push("prime_shipping");
  if (product.sales_volume) badges.push("bestseller");
  if (rating >= 4.5) badges.push("highly_rated");

  return {
    id: `amazon_${product.asin}`,
    store: "amazon",
    title: product.product_title || "Unknown Product",
    description_short: product.product_title || "Amazon product",
    image: product.product_photo || "",
    price: {
      value: price,
      currency: "USD"
    },
    rating: {
      value: rating,
      count: reviewCount
    },
    badges,
    affiliate_url: product.product_url,
    raw: {
      asin: product.asin,
      is_prime: product.is_prime,
      sales_volume: product.sales_volume
    }
  };
};

export const searchAmazonProducts = async (
  spec: ProductQuerySpec
): Promise<NormalizedProduct[]> => {
  if (!env.RAPIDAPI_KEY || !env.RAPIDAPI_AMAZON_HOST) {
    console.warn("[RapidAPI] API credentials not configured, skipping real search");
    return [];
  }

  try {
    // Build search query from keywords
    const searchQuery = spec.keywords.join(" ");
    if (!searchQuery.trim()) {
      console.warn("[RapidAPI] No search keywords provided");
      return [];
    }

    const url = buildSearchUrl(searchQuery, 1);

    console.log(`[RapidAPI] Searching Amazon for: "${searchQuery}"`);

    const response = await axios.get<RapidAPISearchResponse>(url, {
      headers: {
        "x-rapidapi-host": env.RAPIDAPI_AMAZON_HOST,
        "x-rapidapi-key": env.RAPIDAPI_KEY
      },
      timeout: 10000
    });

    console.log(`[RapidAPI] Response status: ${response.status}`);
    console.log(`[RapidAPI] Response keys:`, Object.keys(response.data));

    if (!response.data?.data?.products) {
      console.warn("[RapidAPI] No products found in response");
      console.warn("[RapidAPI] Response data:", JSON.stringify(response.data).substring(0, 200));
      return [];
    }

    const products = response.data.data.products;
    console.log(`[RapidAPI] Found ${products.length} products`);

    // Convert to normalized format
    const normalizedProducts = products
      .map(convertToNormalizedProduct)
      .filter(product => {
        // Basic filtering
        if (!product.image || !product.title) return false;
        if (product.price.value === 0) return false;

        // Budget filter
        const { min, max } = spec.price;
        if (min > 0 && product.price.value < min * 0.9) return false;
        if (max > 0 && product.price.value > max * 1.1) return false;

        return true;
      });

    console.log(`[RapidAPI] Returning ${normalizedProducts.length} filtered products`);

    return normalizedProducts.slice(0, spec.limit || 24);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("[RapidAPI] Search failed:", error.response?.data || error.message);
      if (error.response?.status === 429) {
        console.error("[RapidAPI] Rate limit exceeded");
      }
    } else {
      console.error("[RapidAPI] Unexpected error:", error);
    }
    return [];
  }
};
