import axios from "axios";
import { z } from "zod";
import { env } from "../utils/env";
import type { RecipientProfile } from "../schemas/profile";

const ProductSearchSuggestionsSchema = z.object({
  search_queries: z.array(z.string()).min(1).max(5)
});

type ProductSearchSuggestions = z.infer<typeof ProductSearchSuggestionsSchema>;

const buildGeminiPrompt = (profile: RecipientProfile): string => {
  return `You are a product recommendation expert. Based on this gift recipient profile, suggest 3-5 specific product search queries that would find great gift options on Amazon.

Recipient Profile:
- Age: ${profile.age}
- Gender: ${profile.gender || "not specified"}
- Relationship: ${profile.relationship || "not specified"}
- Occasion: ${profile.occasion || "not specified"}
- Budget: $${profile.budget.min}-$${profile.budget.max} ${profile.budget.currency}
- Interests: ${profile.interests.join(", ") || "general"}
- Favorite Color: ${profile.favorite_color || "any"}
- Favorite Brands: ${profile.favorite_brands.join(", ") || "any"}

Requirements:
1. Suggest search queries that are specific and product-focused
2. Consider the age, interests, and budget
3. Each query should be 1-3 words (e.g., "wireless earbuds", "smart watch", "portable speaker")
4. Return ONLY valid JSON in this exact format: {"search_queries": ["query1", "query2", "query3"]}
5. Do NOT include any other text, explanation, or markdown formatting

Example response format:
{"search_queries": ["bluetooth speaker", "portable charger", "wireless earbuds"]}`;
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

export const generateProductSearchQueries = async (
  profile: RecipientProfile
): Promise<string[]> => {
  if (!env.LLM_API_KEY || !env.LLM_API_URL) {
    console.warn("[Gemini] API credentials not configured");
    // Fallback to basic search based on interests
    return profile.interests.length > 0
      ? [profile.interests.join(" ")]
      : ["gift ideas"];
  }

  try {
    const url = new URL(env.LLM_API_URL);
    url.searchParams.set("key", env.LLM_API_KEY);

    const prompt = buildGeminiPrompt(profile);
    console.log("[Gemini] Asking AI for product search suggestions...");

    const response = await axios.post(
      url.toString(),
      {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024
        }
      },
      {
        headers: {
          "Content-Type": "application/json"
        },
        timeout: 10000
      }
    );

    const text = stripCodeFences(extractGeminiText(response.data));
    if (!text) {
      console.warn("[Gemini] Empty response from AI");
      return profile.interests.length > 0
        ? [profile.interests.join(" ")]
        : ["gift ideas"];
    }

    console.log("[Gemini] Raw AI response:", text.substring(0, 200));

    try {
      const parsed = JSON.parse(text);
      const validated = ProductSearchSuggestionsSchema.parse(parsed);

      console.log("[Gemini] AI suggested search queries:", validated.search_queries);
      return validated.search_queries;
    } catch (parseError) {
      console.error("[Gemini] Failed to parse AI response:", parseError);
      console.error("[Gemini] Raw text:", text);

      // Fallback to interests
      return profile.interests.length > 0
        ? [profile.interests.join(" ")]
        : ["gift ideas"];
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("[Gemini] API call failed:", error.response?.data || error.message);
    } else {
      console.error("[Gemini] Unexpected error:", error);
    }

    // Fallback to interests
    return profile.interests.length > 0
      ? [profile.interests.join(" ")]
      : ["gift ideas"];
  }
};
