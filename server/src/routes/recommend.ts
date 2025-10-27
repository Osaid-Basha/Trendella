import { Router } from "express";
import { RecipientProfileSchema, type RecipientProfile } from "../schemas/profile";
import {
  buildQuerySpecFromProfile,
  buildExplanations,
  buildFollowUpSuggestions,
  isProfileComplete
} from "../services/llm";
import { fetchAmazonProducts } from "../services/fetchers/amazon";
import { fetchAliExpressProducts } from "../services/fetchers/aliexpress";
import { fetchSheinProducts } from "../services/fetchers/shein";
import { fetchEbayProducts } from "../services/fetchers/ebay";
import { fetchEtsyProducts } from "../services/fetchers/etsy";
import { fetchBestBuyProducts } from "../services/fetchers/bestbuy";
import { dedupeProducts } from "../utils/dedupe";
import { rankProducts } from "../services/ranking";
import type { NormalizedProduct, ProductQuerySpec, GeminiLinkSuggestion } from "../schemas/product";
import { rememberProducts } from "../services/session";
import { getSessionId } from "../utils/session";
import { generateProductSearchQueries } from "../services/gemini-search";

const router = Router();

const storeFetchers: Record<
  ProductQuerySpec["store_priority"][number],
  (spec: ProductQuerySpec) => Promise<NormalizedProduct[]>
> = {
  amazon: fetchAmazonProducts,
  aliexpress: fetchAliExpressProducts,
  shein: fetchSheinProducts,
  ebay: fetchEbayProducts,
  etsy: fetchEtsyProducts,
  bestbuy: fetchBestBuyProducts
};

const collectProducts = async (spec: ProductQuerySpec) => {
  const results: NormalizedProduct[][] = await Promise.all(
    spec.store_priority.map((store) => storeFetchers[store](spec))
  );

  return dedupeProducts(results.flat());
};

const buildStoreSearchUrl = (
  store: ProductQuerySpec["store_priority"][number],
  query: string
): string | null => {
  const encoded = encodeURIComponent(query);
  switch (store) {
    case "amazon":
      return `https://www.amazon.com/s?k=${encoded}`;
    case "aliexpress":
      return `https://www.aliexpress.com/w/wholesale-${encoded}.html`;
    case "shein":
      return `https://www.shein.com/pse/${encoded}.html`;
    case "ebay":
      return `https://www.ebay.com/sch/i.html?_nkw=${encoded}`;
    case "etsy":
      return `https://www.etsy.com/search?q=${encoded}`;
    case "bestbuy":
      return `https://www.bestbuy.com/site/searchpage.jsp?st=${encoded}`;
    default:
      return null;
  }
};

const collectProductsWithGemini = async (
  profile: RecipientProfile,
  spec: ProductQuerySpec
): Promise<{ products: NormalizedProduct[]; geminiLinks: GeminiLinkSuggestion[] }> => {
  console.log("[Recommend] Using Gemini AI for intelligent product search");

  // Use Gemini to generate smart search queries
  const searchQueries = await generateProductSearchQueries(profile);

  if (searchQueries.length === 0) {
    console.warn("[Recommend] No search queries from Gemini, falling back to standard search");
    const fallbackProducts = await collectProducts(spec);
    return {
      products: fallbackProducts,
      geminiLinks: []
    };
  }

  console.log(`[Recommend] Gemini generated ${searchQueries.length} search queries`);

  const geminiLinks: GeminiLinkSuggestion[] = [];
  const seenLinks = new Set<string>();

  const registerLinksForQuery = (query: string) => {
    for (const store of spec.store_priority) {
      const url = buildStoreSearchUrl(store, query);
      if (!url) continue;
      const key = `${store}::${url}`;
      if (seenLinks.has(key)) continue;
      seenLinks.add(key);
      geminiLinks.push({ store, query, url });
    }
  };

  // Search for products using each query across all configured stores
  const allProducts: NormalizedProduct[] = [];

  for (const query of searchQueries) {
    console.log(`[Recommend] Searching all stores for: "${query}"`);
    registerLinksForQuery(query);

    // Create a spec for this specific search query
    const querySpec: ProductQuerySpec = {
      ...spec,
      keywords: query.split(" ")
    };

    // Search across all stores in parallel
    const results = await Promise.allSettled(
      spec.store_priority.map(store => storeFetchers[store](querySpec))
    );

    // Collect all successful results
    results.forEach((result, index) => {
      const store = spec.store_priority[index];
      if (result.status === "fulfilled" && result.value.length > 0) {
        console.log(`[Recommend] Found ${result.value.length} products from ${store} for "${query}"`);
        allProducts.push(...result.value);
      } else if (result.status === "rejected") {
        console.warn(`[Recommend] ${store} search failed for "${query}":`, result.reason);
      }
    });
  }

  // Deduplicate products
  const uniqueProducts = dedupeProducts(allProducts);
  console.log(`[Recommend] Total unique products across all stores: ${uniqueProducts.length}`);

  // If we didn't find enough products, try the fallback search
  if (uniqueProducts.length < 6) {
    console.log("[Recommend] Not enough products from Gemini search, adding from fallback sources");
    const otherProducts = await collectProducts(spec);
    return {
      products: dedupeProducts([...uniqueProducts, ...otherProducts]),
      geminiLinks
    };
  }

  return {
    products: uniqueProducts,
    geminiLinks
  };
};

const handleProfileParsing = (payload: unknown): RecipientProfile => {
  const profile = RecipientProfileSchema.parse(payload);
  if (profile.budget.max === 0 && profile.budget.min > 0) {
    profile.budget = {
      ...profile.budget,
      max: Math.max(profile.budget.min * 1.5, profile.budget.min + 50)
    };
  }
  return profile;
};

router.post("/", async (req, res, next) => {
  try {
    const profile = handleProfileParsing(req.body);
    const spec = await buildQuerySpecFromProfile(profile);
    const sessionId = getSessionId(req);

    // Use Gemini-powered search for better results
    const { products: combinedProducts, geminiLinks } = await collectProductsWithGemini(
      profile,
      spec
    );
    const rankedProducts = rankProducts(profile, combinedProducts);

    rememberProducts(sessionId, rankedProducts);

    const explanations = buildExplanations(profile, rankedProducts);
    const followUps = buildFollowUpSuggestions(profile, rankedProducts);

    res.json({
      meta: {
        profile_filled: isProfileComplete(profile),
        next_action: isProfileComplete(profile) ? "offer_refinements" : "collect_missing_profile",
        gemini_links: geminiLinks
      },
      explanations,
      follow_up_suggestions: followUps,
      products_ranked: rankedProducts.map((product) => product.id),
      products: rankedProducts
    });
  } catch (error) {
    next(error);
  }
});

export default router;
