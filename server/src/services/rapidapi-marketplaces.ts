import axios, { type AxiosRequestConfig } from "axios";
import { env } from "../utils/env";

const RAPIDAPI_TIMEOUT_MS = 12000;

type RapidApiHostSetting =
  | "RAPIDAPI_AMAZON_HOST"
  | "RAPIDAPI_EBAY_HOST"
  | "RAPIDAPI_ALIEXPRESS_HOST"
  | "RAPIDAPI_WALMART_HOST"
  | "RAPIDAPI_ETSY_HOST";

const resolveHost = (setting: RapidApiHostSetting): string | null => {
  switch (setting) {
    case "RAPIDAPI_AMAZON_HOST":
      return env.RAPIDAPI_AMAZON_HOST ?? null;
    case "RAPIDAPI_EBAY_HOST":
      return env.RAPIDAPI_EBAY_HOST ?? null;
    case "RAPIDAPI_ALIEXPRESS_HOST":
      return env.RAPIDAPI_ALIEXPRESS_HOST ?? null;
    case "RAPIDAPI_WALMART_HOST":
      return env.RAPIDAPI_WALMART_HOST ?? null;
    case "RAPIDAPI_ETSY_HOST":
      return env.RAPIDAPI_ETSY_HOST ?? null;
    default:
      return null;
  }
};

const rapidApiRequest = async <T>(
  hostSetting: RapidApiHostSetting,
  config: AxiosRequestConfig
): Promise<T | null> => {
  if (!env.RAPIDAPI_KEY) {
    console.warn(`[RapidAPI] Missing RAPIDAPI_KEY for host ${hostSetting}`);
    return null;
  }

  const host = resolveHost(hostSetting);
  if (!host) {
    console.warn(`[RapidAPI] Missing host configuration for ${hostSetting}`);
    return null;
  }

  try {
    const response = await axios.request<T>({
      baseURL: `https://${host}`,
      timeout: RAPIDAPI_TIMEOUT_MS,
      ...config,
      headers: {
        "x-rapidapi-key": env.RAPIDAPI_KEY,
        "x-rapidapi-host": host,
        ...(config.headers ?? {})
      }
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(
        `[RapidAPI] Request failed for ${hostSetting}:`,
        error.response?.data ?? error.message
      );
    } else {
      console.error(`[RapidAPI] Unexpected error for ${hostSetting}:`, error);
    }
    return null;
  }
};

export interface RapidApiEbayProductPayload {
  title?: string;
  image?: string;
  url?: string;
  price?: string | number;
  price_currency?: string;
  description?: string;
  seller?: Record<string, unknown>;
  shipping_price?: string | number;
  [key: string]: unknown;
}

export interface RapidApiEbayProductResponse {
  status?: string;
  message?: string;
  data?: RapidApiEbayProductPayload;
  product?: RapidApiEbayProductPayload;
  [key: string]: unknown;
}

export const fetchRapidApiEbayProduct = async (
  productUrl: string
): Promise<RapidApiEbayProductResponse | null> => {
  if (!productUrl) {
    console.warn("[RapidAPI][eBay] Missing product URL");
    return null;
  }

  return rapidApiRequest<RapidApiEbayProductResponse>("RAPIDAPI_EBAY_HOST", {
    method: "POST",
    url: "/product.php",
    headers: {
      "Content-Type": "application/json"
    },
    data: {
      url: productUrl
    }
  });
};

export interface RapidApiAliExpressSimilarResponse {
  status?: string;
  message?: string;
  data?: {
    total?: number;
    products?: Array<Record<string, unknown>>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export const fetchRapidApiAliExpressSimilar = async (params: {
  productId: string;
  page?: number;
  pageSize?: number;
  country?: string;
  currency?: string;
}): Promise<RapidApiAliExpressSimilarResponse | null> => {
  const { productId, page = 1, pageSize = 20, country = "us", currency = "USD" } = params;

  if (!productId) {
    console.warn("[RapidAPI][AliExpress] Missing productId");
    return null;
  }

  return rapidApiRequest<RapidApiAliExpressSimilarResponse>("RAPIDAPI_ALIEXPRESS_HOST", {
    method: "GET",
    url: "/product/similar/v2",
    params: {
      productId,
      page,
      pageSize,
      country,
      currency
    }
  });
};

export interface RapidApiWalmartCategoryResponse {
  status?: string;
  message?: string;
  data?: {
    category_name?: string;
    products?: Array<Record<string, unknown>>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export const fetchRapidApiWalmartCategory = async (
  categoryUrl: string
): Promise<RapidApiWalmartCategoryResponse | null> => {
  if (!categoryUrl) {
    console.warn("[RapidAPI][Walmart] Missing category URL");
    return null;
  }

  return rapidApiRequest<RapidApiWalmartCategoryResponse>("RAPIDAPI_WALMART_HOST", {
    method: "GET",
    url: "/walmart-category.php",
    params: {
      url: categoryUrl
    }
  });
};

export interface RapidApiEtsyDetailsResponse {
  status?: string;
  message?: string;
  data?: Record<string, unknown>;
  listing?: Record<string, unknown>;
  [key: string]: unknown;
}

export const fetchRapidApiEtsyDetails = async (
  listingUrl: string
): Promise<RapidApiEtsyDetailsResponse | null> => {
  if (!listingUrl) {
    console.warn("[RapidAPI][Etsy] Missing listing URL");
    return null;
  }

  return rapidApiRequest<RapidApiEtsyDetailsResponse>("RAPIDAPI_ETSY_HOST", {
    method: "GET",
    url: "/details",
    params: {
      url: listingUrl
    }
  });
};
