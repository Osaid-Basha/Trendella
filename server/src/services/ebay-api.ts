import axios from "axios";
import { env } from "../utils/env";
import type { NormalizedProduct, ProductQuerySpec } from "../schemas/product";

interface EbaySearchItem {
  itemId?: string[];
  title?: string[];
  viewItemURL?: string[];
  galleryURL?: string[];
  sellingStatus?: Array<{
    currentPrice?: Array<{
      "@currencyId"?: string;
      __value__?: string;
    }>;
  }>;
  condition?: Array<{
    conditionDisplayName?: string[];
  }>;
  shippingInfo?: Array<{
    shippingServiceCost?: Array<{
      "@currencyId"?: string;
      __value__?: string;
    }>;
  }>;
  primaryCategory?: Array<{
    categoryName?: string[];
  }>;
}

interface EbayFindItemsResponse {
  findItemsByKeywordsResponse?: Array<{
    ack?: string[];
    searchResult?: Array<{
      "@count"?: string;
      item?: EbaySearchItem[];
    }>;
  }>;
}

const EBAY_FINDING_API_URL = "https://svcs.ebay.com/services/search/FindingService/v1";

const buildSearchUrl = (keywords: string, maxResults: number = 24): string => {
  const params = new URLSearchParams({
    "OPERATION-NAME": "findItemsByKeywords",
    "SERVICE-VERSION": "1.0.0",
    "SECURITY-APPNAME": env.EBAY_APP_ID || "",
    "RESPONSE-DATA-FORMAT": "JSON",
    "REST-PAYLOAD": "true",
    keywords: keywords,
    "paginationInput.entriesPerPage": Math.min(maxResults, 100).toString(),
    "sortOrder": "BestMatch"
  });

  return `${EBAY_FINDING_API_URL}?${params.toString()}`;
};

const parsePrice = (priceStr?: string): number => {
  if (!priceStr) return 0;
  const parsed = parseFloat(priceStr);
  return isNaN(parsed) ? 0 : parsed;
};

const extractArrayValue = <T>(arr?: T[]): T | undefined => {
  return arr && arr.length > 0 ? arr[0] : undefined;
};

const convertToNormalizedProduct = (item: EbaySearchItem): NormalizedProduct | null => {
  const itemId = extractArrayValue(item.itemId);
  const title = extractArrayValue(item.title);
  const viewItemURL = extractArrayValue(item.viewItemURL);
  const galleryURL = extractArrayValue(item.galleryURL);

  if (!itemId || !title || !viewItemURL) {
    return null;
  }

  const sellingStatus = extractArrayValue(item.sellingStatus);
  const priceObj = extractArrayValue(sellingStatus?.currentPrice);
  const price = parsePrice(priceObj?.__value__);
  const currency = priceObj?.["@currencyId"] || "USD";

  const condition = extractArrayValue(item.condition);
  const conditionName = extractArrayValue(condition?.conditionDisplayName);

  const badges: string[] = [];
  if (conditionName === "New") badges.push("brand_new");
  if (price > 0 && price < 50) badges.push("budget_friendly");

  return {
    id: `ebay_${itemId}`,
    store: "ebay",
    title,
    description_short: title,
    image: galleryURL || "https://via.placeholder.com/300x300?text=No+Image",
    price: {
      value: price,
      currency
    },
    rating: {
      value: 0, // eBay Finding API doesn't provide ratings
      count: 0
    },
    badges,
    affiliate_url: viewItemURL,
    raw: {
      itemId,
      condition: conditionName
    }
  };
};

export const searchEbayProducts = async (
  spec: ProductQuerySpec
): Promise<NormalizedProduct[]> => {
  if (!env.EBAY_APP_ID) {
    console.warn("[eBay] API credentials not configured, skipping search");
    return [];
  }

  try {
    const searchQuery = spec.keywords.join(" ");
    if (!searchQuery.trim()) {
      console.warn("[eBay] No search keywords provided");
      return [];
    }

    const url = buildSearchUrl(searchQuery, spec.limit || 24);

    console.log(`[eBay] Searching for: "${searchQuery}"`);

    const response = await axios.get<EbayFindItemsResponse>(url, {
      timeout: 10000
    });

    const findResponse = extractArrayValue(response.data.findItemsByKeywordsResponse);

    if (!findResponse) {
      console.warn("[eBay] Invalid response structure");
      return [];
    }

    const ack = extractArrayValue(findResponse.ack);
    if (ack !== "Success") {
      console.warn(`[eBay] API returned ack: ${ack}`);
      return [];
    }

    const searchResult = extractArrayValue(findResponse.searchResult);
    const items = searchResult?.item || [];

    console.log(`[eBay] Found ${items.length} items`);

    const normalizedProducts = items
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

    console.log(`[eBay] Returning ${normalizedProducts.length} filtered products`);

    return normalizedProducts.slice(0, spec.limit || 24);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("[eBay] Search failed:", error.response?.data || error.message);
    } else {
      console.error("[eBay] Unexpected error:", error);
    }
    return [];
  }
};
