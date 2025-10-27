import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChatInput } from "../components/ChatInput";
import { ChatThread, type ChatMessage } from "../components/ChatThread";
import {
  requestRecommendations,
  fetchWishlist,
  type RecommendResponse,
  type NormalizedProduct
} from "../lib/api";
import { useLocation, useNavigate } from "react-router-dom";
import { useProfile, type RecipientProfile } from "../state/profile";

type Question = {
  key: keyof RecipientProfile | "budget" | "interests" | "favorite_brands";
  prompt: string;
  reprompt: string;
  parser: (input: string, profile: RecipientProfile) => Partial<RecipientProfile> | null;
  confirmation: (profile: RecipientProfile, parsed: Partial<RecipientProfile>) => string;
};

const makeId = () =>
  (typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 9)) ?? `${Date.now()}`;

const parseNumber = (input: string): number | null => {
  const match = input.match(/(\d{1,3})/);
  if (!match) return null;
  const value = Number(match[1]);
  if (!Number.isFinite(value)) return null;
  return value;
};

const parseCommaSeparated = (input: string): string[] => {
  return input
    .split(/[,/]| and /i)
    .map((value) => value.trim())
    .filter(Boolean);
};

const clampBudget = (min: number, max: number): [number, number] => {
  if (min > max && max > 0) {
    return [max, min];
  }
  if (max === 0) {
    return [min, min];
  }
  return [min, max];
};

const extractBudget = (input: string, current: RecipientProfile["budget"]) => {
  const matches = input.match(/\d+(?:\.\d{1,2})?/g);
  if (!matches || matches.length === 0) return null;
  const numbers = matches.map((num) => Number(num)).filter((num) => Number.isFinite(num));
  if (numbers.length === 0) return null;
  const currencyMatch = input.match(/(?<=\s|^)(usd|dollars|\$)/i);
  const currency = currencyMatch ? "USD" : current.currency;
  if (numbers.length === 1) {
    const value = numbers[0];
    return { budget: { min: value * 0.8, max: value, currency } };
  }
  const sorted = numbers.sort((a, b) => a - b);
  const [min, max] = clampBudget(sorted[0] ?? 0, sorted[sorted.length - 1] ?? 0);
  return { budget: { min, max, currency } };
};

const questionFlow: Question[] = [
  {
    key: "age",
    prompt: "First up, how old is the recipient?",
    reprompt: "Could you share their age with a number?",
    parser: (input) => {
      const age = parseNumber(input);
      if (!age) return null;
      return { age };
    },
    confirmation: (_profile, parsed) => `Got it — ${parsed.age} years young.`
  },
  {
    key: "gender",
    prompt: "What gender do they identify with? (feel free to write freely)",
    reprompt: "Any hints on how they identify? You can also say skip.",
    parser: (input) => {
      if (input.trim().toLowerCase() === "skip") return { gender: "Unspecified" };
      const gender = input.trim();
      if (!gender) return null;
      return { gender };
    },
    confirmation: (_profile, parsed) =>
      parsed.gender ? `Noted — ${parsed.gender} vibes.` : "Skipping gender preference."
  },
  {
    key: "relationship",
    prompt: "What's your relationship to them? (e.g., partner, sibling, coworker)",
    reprompt: "Let me know how you're connected so I can match the tone.",
    parser: (input) => {
      if (!input.trim()) return null;
      return { relationship: input.trim() };
    },
    confirmation: (_profile, parsed) => `Perfect — relationship set to ${parsed.relationship}.`
  },
  {
    key: "occasion",
    prompt: "What are you celebrating? Birthday, anniversary, graduation…",
    reprompt: "Any special occasion details to share?",
    parser: (input) => {
      if (!input.trim()) return null;
      return { occasion: input.trim() };
    },
    confirmation: (_profile, parsed) => `Occasion logged: ${parsed.occasion}.`
  },
  {
    key: "budget",
    prompt: "What's your budget range in USD? (e.g., 40-80 or up to 120)",
    reprompt: "Try sharing a range like 30-60 USD so I can match price points.",
    parser: (input, profile) => extractBudget(input, profile.budget),
    confirmation: (_profile, parsed) =>
      `Budget locked: $${Math.round(parsed.budget?.min ?? 0)} to $${Math.round(
        parsed.budget?.max ?? 0
      )}.`
  },
  {
    key: "interests",
    prompt: "List a few of their core interests or hobbies (comma separated works!).",
    reprompt: "Drop a few interests separated by commas.",
    parser: (input) => {
      const values = parseCommaSeparated(input.toLowerCase());
      if (values.length === 0) return null;
      return { interests: values };
    },
    confirmation: (_profile, parsed) =>
      `Love it — focusing on ${parsed.interests?.join(", ")}.`
  },
  {
    key: "favorite_color",
    prompt: "Any favorite colors they gravitate toward?",
    reprompt: "Mention a color family so I can match the palette.",
    parser: (input) => {
      if (!input.trim()) return null;
      return { favorite_color: input.trim() };
    },
    confirmation: (_profile, parsed) => `Color preference saved: ${parsed.favorite_color}.`
  },
  {
    key: "favorite_brands",
    prompt: "Finally, any must-include brands or labels they adore?",
    reprompt: "Name any brands they love (comma separated works).",
    parser: (input) => {
      const values = parseCommaSeparated(input);
      if (values.length === 0) return null;
      return { favorite_brands: values };
    },
    confirmation: (_profile, parsed) =>
      `Brand affinity noted: ${parsed.favorite_brands?.join(", ")}.`
  }
];

const deriveConstraints = (input: string, profile: RecipientProfile) => {
  const constraints = { ...profile.constraints };
  const lowered = input.toLowerCase();

  const shippingMatch = lowered.match(/(\d+)\s*(?:day|days)/);
  if (shippingMatch) {
    constraints.shipping_days_max = Number(shippingMatch[1]);
  }

  if (/eco|sustain|planet/.test(lowered)) {
    if (!constraints.category_includes.includes("eco_friendly")) {
      constraints.category_includes = [...constraints.category_includes, "eco_friendly"];
    }
  }

  const categoryHints: Array<[RegExp, string]> = [
    [/tech|gadget|device/, "tech"],
    [/fitness|gym|workout/, "fitness"],
    [/beauty|skincare|makeup/, "beauty"],
    [/fashion|outfit|style/, "fashion"],
    [/home|decor|apartment|kitchen/, "home"],
    [/travel|trip|adventure/, "travel"],
    [/jewelry|ring|necklace|earring/, "accessories"],
    [/plant|green|garden|terrarium/, "plants"]
  ];

  categoryHints.forEach(([regex, category]) => {
    if (regex.test(lowered) && !constraints.category_includes.includes(category)) {
      constraints.category_includes = [...constraints.category_includes, category];
    }
  });

  if (/no\s+jewelry|avoid\s+jewelry/.test(lowered)) {
    constraints.category_excludes = [...constraints.category_excludes, "accessories"];
  }

  constraints.category_includes = Array.from(new Set(constraints.category_includes));
  constraints.category_excludes = Array.from(new Set(constraints.category_excludes));

  return constraints;
};

export const ChatPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: makeId(),
      sender: "assistant",
      content: "Hi! I’m Trendella. Let’s curate the perfect gift together."
    },
    {
      id: makeId(),
      sender: "assistant",
      content: questionFlow[0].prompt
    }
  ]);
  const [currentStep, setCurrentStep] = useState(0);
  const [recommendation, setRecommendation] = useState<RecommendResponse | null>(null);

  const { profile, updateProfile, isComplete } = useProfile();

  useQuery<NormalizedProduct[]>({
    queryKey: ["wishlist"],
    queryFn: fetchWishlist,
    initialData: [] as NormalizedProduct[],
    refetchOnMount: false
  });

  useEffect(() => {
    if (recommendation?.products) {
      queryClient.setQueryData(["wishlist"], (existing: unknown) => existing ?? []);
    }
  }, [queryClient, recommendation]);

  const recommendMutation = useMutation({
    mutationFn: requestRecommendations,
    onSuccess: (data) => {
      setRecommendation(data);
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "The recommendation service is unavailable.";
      setMessages((prev) => [
        ...prev,
        {
          id: makeId(),
          sender: "assistant",
          content: `Something went wrong fetching products: ${message}`,
          variant: "error"
        }
      ]);
    }
  });

  const askNextQuestion = useCallback((nextIndex: number) => {
    const nextQuestion = questionFlow[nextIndex];
    if (!nextQuestion) return;
    setMessages((prev) => [
      ...prev,
      {
        id: makeId(),
        sender: "assistant",
        content: nextQuestion.prompt
      }
    ]);
  }, []);

  const finalizeProfile = useCallback(
    (nextProfile: RecipientProfile) => {
      setMessages((prev) => [
        ...prev,
        {
          id: makeId(),
          sender: "assistant",
          content:
            "Amazing — we have a full profile. Add more details for higher specificity like delivery windows, aesthetics, or must-have categories while I pull curated ideas."
        }
      ]);
      recommendMutation.mutate(nextProfile);
    },
    [recommendMutation]
  );

  const handleQuestionFlow = useCallback(
    (input: string) => {
      const question = questionFlow[currentStep];
      if (!question) return;

      const parsed = question.parser(input, profile);
      if (!parsed) {
        setMessages((prev) => [
          ...prev,
          {
            id: makeId(),
            sender: "assistant",
            content: question.reprompt,
            variant: "info"
          }
        ]);
        return;
      }

      updateProfile(parsed);
      const nextProfile = { ...profile, ...parsed };
      if (parsed.budget) {
        nextProfile.budget = { ...profile.budget, ...parsed.budget };
      }
      if (parsed.interests) {
        nextProfile.interests = parsed.interests;
      }
      if (parsed.favorite_brands) {
        nextProfile.favorite_brands = parsed.favorite_brands;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: makeId(),
          sender: "assistant",
          content: question.confirmation(nextProfile, parsed),
          variant: "info"
        }
      ]);

      const nextIndex = currentStep + 1;
      setCurrentStep(nextIndex);

      if (nextIndex >= questionFlow.length) {
        finalizeProfile(nextProfile);
      } else {
        askNextQuestion(nextIndex);
      }
    },
    [askNextQuestion, currentStep, finalizeProfile, profile, updateProfile]
  );

  const handleRefine = useCallback(
    (input: string) => {
      const constraints = deriveConstraints(input, profile);
      const refinedProfile = { ...profile, constraints };
      updateProfile({ constraints });
      setMessages((prev) => [
        ...prev,
        {
          id: makeId(),
          sender: "assistant",
          content: "Refining the list with that detail..."
        }
      ]);
      recommendMutation.mutate(refinedProfile);
    },
    [profile, recommendMutation, updateProfile]
  );

  const handleSend = useCallback(
    (input: string) => {
      setMessages((prev) => [
        ...prev,
        { id: makeId(), sender: "user", content: input }
      ]);
      if (!isComplete) {
        handleQuestionFlow(input);
      } else {
        handleRefine(input);
      }
    },
    [handleQuestionFlow, handleRefine, isComplete]
  );

  const handleQuickReply = useCallback(
    (content: string) => {
      handleSend(content);
    },
    [handleSend]
  );

  useEffect(() => {
    if ((location.state as { reaskFromWishlist?: boolean } | null)?.reaskFromWishlist) {
      navigate(".", { replace: true, state: {} });
      if (isComplete) {
        handleRefine("Please focus on the items saved to my wish list.");
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: makeId(),
            sender: "assistant",
            content:
              "Once we finish the profile I’ll happily rework ideas around your wish list favorites."
          }
        ]);
      }
    }
  }, [handleRefine, isComplete, location.state, navigate]);

  const explanationMap = useMemo(() => {
    if (!recommendation) return {};
    return recommendation.explanations.reduce<Record<string, string>>((acc, item) => {
      acc[item.product_id] = item.why;
      return acc;
    }, {});
  }, [recommendation]);

  return (
    <div className="flex h-[calc(100vh-160px)] flex-col gap-4">
      <ChatThread
        messages={messages}
        products={recommendation?.products ?? []}
        geminiLinks={recommendation?.meta.gemini_links ?? []}
        explanations={explanationMap}
        followUps={recommendation?.follow_up_suggestions ?? []}
        isLoading={recommendMutation.isPending}
        onQuickReply={handleQuickReply}
      />
      <ChatInput
        onSend={handleSend}
        isDisabled={recommendMutation.isPending}
        placeholder="Share more context or ask for tweaks…"
      />
    </div>
  );
};
