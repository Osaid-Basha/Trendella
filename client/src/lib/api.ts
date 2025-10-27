import axios from "axios";
import type { RecipientProfile } from "../state/profile";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

export interface NormalizedProduct {
  id: string;
  store: "amazon" | "aliexpress" | "shein" | "ebay" | "etsy" | "bestbuy";
  title: string;
  description_short: string;
  image: string;
  price: { value: number; currency: string };
  rating: { value: number; count: number };
  badges: string[];
  affiliate_url: string;
  raw: Record<string, unknown>;
}

export interface GeminiLinkSuggestion {
  store: NormalizedProduct["store"];
  query: string;
  url: string;
}

export interface RenderingContract {
  meta: {
    profile_filled: boolean;
    next_action: string;
    gemini_links: GeminiLinkSuggestion[];
  };
  explanations: Array<{ product_id: string; why: string }>;
  follow_up_suggestions: string[];
  products_ranked: string[];
}

export interface RecommendResponse extends RenderingContract {
  products: NormalizedProduct[];
}

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json"
  },
  withCredentials: false
});

export const requestRecommendations = async (profile: RecipientProfile) => {
  const { data } = await apiClient.post<RecommendResponse>("/api/recommend", profile);
  return data;
};

export const fetchWishlist = async () => {
  const { data } = await apiClient.get<{ products: NormalizedProduct[] }>("/api/wishlist");
  return data.products;
};

export const addWishlistItem = async (productId: string) => {
  await apiClient.post("/api/wishlist/add", { productId });
};

export const removeWishlistItem = async (productId: string) => {
  await apiClient.post("/api/wishlist/remove", { productId });
};
