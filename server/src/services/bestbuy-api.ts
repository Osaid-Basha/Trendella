import axios from "axios";
import { env } from "../utils/env";
import type { NormalizedProduct, ProductQuerySpec } from "../schemas/product";

interface BestBuyProduct {
  sku: number;
  name: string;
  salePrice?: number;
  regularPrice?: number;
  onSale?: boolean;
  url?: string;
  image?: string;
  largeImage?: string;
  customerReviewAverage?: number;
  customerReviewCount?: number;
  description?: string;
  shortDescription?: string;
  manufacturer?: string;
  modelNumber?: string;
  categoryPath?: Array<{
    name?: string;
  }>;
}

interface BestBuySearchResponse {
  from: number;
  to: number;
  total: number;
  currentPage: number;
  totalPages: number;
  queryTime: string;
  totalTime: string;
  partial: boolean;
  canonicalUrl?: string;
  products: BestBuyProduct[];
}

const BESTBUY_API_URL = "https://api.bestbuy.com/v1/products";

const buildSearchUrl = (keywords: string, pageSize: number = 24): string => {
  const params = new URLSearchParams({
    apiKey: env.BESTBUY_API_KEY || "",
    format: "json",
    show: "sku,name,salePrice,regularPrice,onSale,url,image,largeImage,customerReviewAverage,customerReviewCount,description,shortDescription,manufacturer",
    pageSize: Math.min(pageSize, 100).toString(),
    page: "1"
  });

  // Build search query - Best Buy uses (search=keyword) syntax
  const searchQuery = `(search=${encodeURIComponent(keywords)})`;

  return `${BESTBUY_API_URL}${searchQuery}?${params.toString()}`;
};

const convertToNormalizedProduct = (product: BestBuyProduct): NormalizedProduct | null => {
  if (!product.sku || !product.name || !product.url) {
    return null;
  }

  const price = product.salePrice ?? product.regularPrice ?? 0;
  const rating = product.customerReviewAverage ?? 0;
  const reviewCount = product.customerReviewCount ?? 0;

  const badges: string[] = [];
  if (product.onSale) badges.push("on_sale");
  if (rating >= 4.5) badges.push("highly_rated");
  if (price > 0 && price < 50) badges.push("budget_friendly");

  return {
    id: `bestbuy_${product.sku}`,
    store: "bestbuy",
    title: product.name,
    description_short: product.shortDescription || product.name,
    image: product.largeImage || product.image || "https://via.placeholder.com/300x300?text=No+Image",
    price: {
      value: price,
      currency: "USD"
    },
    rating: {
      value: rating,
      count: reviewCount
    },
    badges,
    affiliate_url: product.url,
    raw: {
      sku: product.sku,
      manufacturer: product.manufacturer,
      modelNumber: product.modelNumber,
      onSale: product.onSale
    }
  };
};

export const searchBestBuyProducts = async (
  spec: ProductQuerySpec
): Promise<NormalizedProduct[]> => {
  if (!env.BESTBUY_API_KEY) {
    console.warn("[Best Buy] API key not configured, skipping search");
    return [];
  }

  try {
    const searchQuery = spec.keywords.join(" ");
    if (!searchQuery.trim()) {
      console.warn("[Best Buy] No search keywords provided");
      return [];
    }

    const url = buildSearchUrl(searchQuery, spec.limit || 24);

    console.log(`[Best Buy] Searching for: "${searchQuery}"`);

    const response = await axios.get<BestBuySearchResponse>(url, {
      timeout: 10000
    });

    const products = response.data.products || [];

    console.log(`[Best Buy] Found ${products.length} products`);

    const normalizedProducts = products
      .map(convertToNormalizedProduct)
      .filter((product): product is NormalizedProduct => {
        if (!product) return false;
        if (product.price.value === 0) return false;

        // Budget filter
        const { min, max } = spec.price;
        if (min > 0 && product.price.value < min * 0.9) return false;
        if (max > 0 && product.price.value > max * 1.1) return false;

        return true;
      });

    console.log(`[Best Buy] Returning ${normalizedProducts.length} filtered products`);

    return normalizedProducts.slice(0, spec.limit || 24);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("[Best Buy] Search failed:", error.response?.data || error.message);
      if (error.response?.status === 403) {
        console.error("[Best Buy] API key may be invalid or inactive");
      }
    } else {
      console.error("[Best Buy] Unexpected error:", error);
    }
    return [];
  }
};
