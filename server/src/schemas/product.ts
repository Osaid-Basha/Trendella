import { z } from "zod";

const stores = ["amazon", "aliexpress", "shein", "ebay", "etsy", "bestbuy"] as const;
const sortOptions = ["relevance", "price_low_high", "price_high_low"] as const;

export const PriceSchema = z.object({
  value: z.number().min(0),
  currency: z.string().min(1)
});

export const ProductPriceRangeSchema = z.object({
  min: z.number().min(0),
  max: z.number().min(0),
  currency: z.string().min(1)
});

export const RatingSchema = z.object({
  value: z.number().min(0).max(5),
  count: z.number().min(0)
});

export const ProductQuerySpecSchema = z.object({
  keywords: z.array(z.string().min(1)).default([]),
  categories: z.array(z.string().min(1)).default([]),
  price: ProductPriceRangeSchema,
  brands_preferred: z.array(z.string().min(1)).default([]),
  colors_preferred: z.array(z.string().min(1)).default([]),
  store_priority: z.array(z.enum(stores)).default([...stores]),
  limit: z.number().int().positive().max(50).default(24),
  sort: z.enum(sortOptions).default("relevance")
});

export const NormalizedProductSchema = z.object({
  id: z.string().min(1),
  store: z.enum(stores),
  title: z.string().min(1),
  description_short: z.string().min(1),
  image: z.string().url(),
  price: PriceSchema,
  rating: RatingSchema,
  badges: z.array(z.string()),
  affiliate_url: z.string().url(),
  raw: z.record(z.string(), z.any())
});

export const GeminiLinkSuggestionSchema = z.object({
  store: z.enum(stores),
  query: z.string().min(1),
  url: z.string().url()
});

export const RenderingContractSchema = z.object({
  meta: z.object({
    profile_filled: z.boolean(),
    next_action: z.string(),
    gemini_links: z.array(GeminiLinkSuggestionSchema).default([])
  }),
  explanations: z.array(
    z.object({
      product_id: z.string().min(1),
      why: z.string().min(1)
    })
  ),
  follow_up_suggestions: z.array(z.string().min(1)),
  products_ranked: z.array(z.string().min(1))
});

export type ProductQuerySpec = z.infer<typeof ProductQuerySpecSchema>;
export type NormalizedProduct = z.infer<typeof NormalizedProductSchema>;
export type RenderingContract = z.infer<typeof RenderingContractSchema>;
export type GeminiLinkSuggestion = z.infer<typeof GeminiLinkSuggestionSchema>;
