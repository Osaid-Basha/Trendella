import axios from "axios";
import { z } from "zod";
import type { RecipientProfile } from "../schemas/profile";
import { ProductQuerySpecSchema, type NormalizedProduct, type ProductQuerySpec } from "../schemas/product";
import { env } from "../utils/env";

type Explanation = { product_id: string; why: string };

const interestCategoryMap: Record<string, string[]> = {
  fitness: ["fitness", "health", "recovery"],
  wellness: ["wellness", "health"],
  travel: ["travel", "bags", "accessories"],
  tech: ["electronics", "tech", "gadgets"],
  technology: ["electronics", "tech", "gadgets"],
  electronics: ["electronics", "tech", "gadgets"],
  gadgets: ["electronics", "tech", "gadgets"],
  photography: ["electronics", "cameras", "creative"],
  plants: ["home", "decor", "plants"],
  decor: ["home", "decor"],
  fashion: ["fashion"],
  beauty: ["beauty", "self_care"],
  gaming: ["electronics", "gaming"],
  cooking: ["kitchen"],
  coffee: ["kitchen", "tech"]
};

const sanitizeBudget = (profile: RecipientProfile) => {
  const min = Math.max(0, profile.budget.min ?? 0);
  const maxCandidate = profile.budget.max ?? 0;
  const max = maxCandidate >= min ? maxCandidate : min * 1.5;

  if (min === 0 && max === 0) {
    return { min: 25, max: 150, currency: profile.budget.currency ?? "USD" };
  }

  return {
    min: min || Math.min(25, max * 0.5),
    max: max || Math.max(min * 2, 75),
    currency: profile.budget.currency ?? "USD"
  };
};

const inferCategoriesFromProfile = (profile: RecipientProfile): string[] => {
  const derived = new Set<string>();
  profile.interests.forEach((interestRaw) => {
    const interest = interestRaw.toLowerCase();
    const mapped = interestCategoryMap[interest];
    if (mapped) {
      mapped.forEach((entry) => derived.add(entry));
    } else {
      derived.add(interest);
    }
  });

  if (profile.occasion) {
    derived.add(profile.occasion.toLowerCase());
  }

  if (profile.relationship) {
    derived.add(profile.relationship.toLowerCase());
  }

  return Array.from(derived);
};

const inferKeywords = (profile: RecipientProfile): string[] => {
  const keywords = new Set<string>();
  // Only include interests and brands for product search
  // Occasion, relationship, and color are too specific for Amazon search
  profile.interests.forEach((interest) => keywords.add(interest.toLowerCase()));
  profile.favorite_brands.forEach((brand) => keywords.add(brand.toLowerCase()));
  return Array.from(keywords).filter(Boolean);
};

const llmQuerySchema = z.object({
  spec: ProductQuerySpecSchema
});

const buildPrompt = (profile: RecipientProfile) => {
  return [
    "You are Trendella's gift planning orchestrator.",
    "Given the following recipient profile (JSON), emit only valid JSON that matches this TypeScript shape:",
    "",
    `type ProductQuerySpec = ${JSON.stringify(
      {
        keywords: ["string"],
        categories: ["string"],
        price: { min: 0, max: 0, currency: "USD" },
        brands_preferred: ["string"],
        colors_preferred: ["string"],
        store_priority: ["amazon", "aliexpress", "shein"],
        limit: 24,
        sort: "relevance"
      },
      null,
      2
    )}`,
    "",
    "Respond strictly with JSON in the form { \"spec\": ProductQuerySpec } so it can be parsed without additional text.",
    "Respect the profile budget currency and stores. Never invent fields outside the schema.",
    "",
    "Recipient profile:",
    JSON.stringify(profile, null, 2)
  ].join("\n");
};

const extractGeminiText = (data: unknown): string => {
  const candidates = (data as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }).candidates;
  if (!candidates || candidates.length === 0) {
    return "";
  }
  const parts = candidates[0]?.content?.parts ?? [];
  return parts
    .map((part) => part?.text ?? "")
    .join("")
    .trim();
};

const stripCodeFences = (payload: string): string => {
  const trimmed = payload.trim();
  if (trimmed.startsWith("```")) {
    return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim();
  }
  return trimmed;
};

const maybeCallLLM = async (profile: RecipientProfile): Promise<ProductQuerySpec | null> => {
  if (!env.LLM_API_KEY || !env.LLM_API_URL) {
    return null;
  }

  try {
    const url = new URL(env.LLM_API_URL);
    url.searchParams.set("key", env.LLM_API_KEY);

    const response = await axios.post(
      url.toString(),
      {
        contents: [
          {
            role: "user",
            parts: [{ text: buildPrompt(profile) }]
          }
        ]
      },
      {
        headers: {
          "Content-Type": "application/json"
        },
        timeout: 8000
      }
    );

    const text = stripCodeFences(extractGeminiText(response.data));
    if (!text) {
      console.warn("[llm] Gemini response missing text, falling back.");
      return null;
    }

    const parsedJson = JSON.parse(text);
    const parsed = llmQuerySchema.parse(parsedJson);
    return parsed.spec;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown LLM error";
    console.warn(`[llm] Failed to fetch spec from LLM, falling back. ${message}`);
    return null;
  }
};

export const buildQuerySpecFromProfile = async (
  profile: RecipientProfile
): Promise<ProductQuerySpec> => {
  const llmResult = await maybeCallLLM(profile);
  if (llmResult) {
    return ProductQuerySpecSchema.parse(llmResult);
  }

  const budget = sanitizeBudget(profile);
  const keywords = inferKeywords(profile);
  const categories = inferCategoriesFromProfile(profile);
  const store_priority: ProductQuerySpec["store_priority"] = ["amazon", "aliexpress", "shein"];

  if (budget.max <= 60) {
    store_priority.sort((a, b) => {
      if (a === "shein" || a === "aliexpress") return -1;
      if (b === "shein" || b === "aliexpress") return 1;
      return 0;
    });
  }

  const spec = ProductQuerySpecSchema.parse({
    keywords,
    categories,
    price: budget,
    brands_preferred: profile.favorite_brands.map((brand) => brand.toLowerCase()),
    colors_preferred: profile.favorite_color ? [profile.favorite_color.toLowerCase()] : [],
    store_priority,
    limit: 24,
    sort: "relevance"
  });

  return spec;
};

export const isProfileComplete = (profile: RecipientProfile): boolean => {
  return Boolean(
    profile.age &&
      profile.gender &&
      profile.occasion &&
      profile.relationship &&
      profile.favorite_color &&
      profile.interests.length > 0 &&
      profile.favorite_brands.length > 0 &&
      profile.budget.max > 0
  );
};

const reasonForProduct = (profile: RecipientProfile, product: NormalizedProduct): string => {
  const reasons: string[] = [];

  const sharedInterests = product.raw.interests ?? product.raw.tags;
  const productInterestMatches = (product as any).interests as string[] | undefined;

  if (productInterestMatches && productInterestMatches.length) {
    const overlap = productInterestMatches.filter((interest) =>
      profile.interests.some(
        (profileInterest) =>
          profileInterest.toLowerCase().trim() === interest.toLowerCase().trim()
      )
    );
    if (overlap.length) {
      reasons.push(`matches their interest in ${overlap.join(", ")}`);
    }
  }

  const normalizedBrands = [
    ...(Array.isArray((product as any).brands) ? ((product as any).brands as string[]) : []),
    product.title
  ].map((value) => value.toLowerCase());

  const brandMatches = profile.favorite_brands.filter((brand) =>
    normalizedBrands.some((candidate) => candidate.includes(brand.toLowerCase()))
  );
  if (brandMatches.length) {
    reasons.push(`features favorite brand ${brandMatches[0]}`);
  }

  if (profile.favorite_color) {
    const productColors = ((product as any).colors as string[] | undefined) ?? [];
    if (
      productColors.some(
        (color) =>
          color.toLowerCase() === profile.favorite_color?.toLowerCase().trim()
      )
    ) {
      reasons.push(`comes in their preferred ${profile.favorite_color} hue`);
    }
  }

  if (profile.budget.max && product.price.value <= profile.budget.max * 1.05) {
    reasons.push("stays within budget");
  }

  if (product.badges.includes("fast_shipping") && profile.constraints.shipping_days_max) {
    reasons.push("offers quick shipping");
  }

  if (reasons.length === 0) {
    reasons.push("is a well-reviewed crowd pleaser");
  }

  return reasons.join(", ");
};

export const buildExplanations = (
  profile: RecipientProfile,
  products: NormalizedProduct[]
): Explanation[] => {
  return products.map((product) => ({
    product_id: product.id,
    why: `Selected because it ${reasonForProduct(profile, product)}.`
  }));
};

export const buildFollowUpSuggestions = (
  profile: RecipientProfile,
  products: NormalizedProduct[]
): string[] => {
  const suggestions = new Set<string>();

  if (profile.budget.max) {
    suggestions.add(`Tighten the budget to under $${Math.round(profile.budget.max * 0.8)}?`);
    suggestions.add(`Explore splurge options up to $${Math.round(profile.budget.max * 1.2)}?`);
  } else {
    suggestions.add("Share a budget range so I can tailor picks.");
  }

  if (profile.favorite_color) {
    suggestions.add(`Prefer everything in ${profile.favorite_color}?`);
  } else {
    suggestions.add("Call out a favorite color to refine the palette.");
  }

  const hasEco = products.some((product) => product.badges.includes("eco_friendly"));
  if (!hasEco) {
    suggestions.add("Want sustainable or eco-conscious picks only?");
  }

  suggestions.add("Need faster shipping or a specific delivery window?");

  return Array.from(suggestions).slice(0, 3);
};

export type { Explanation };
