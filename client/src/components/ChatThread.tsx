import { useEffect, useMemo, useRef } from "react";
import type { GeminiLinkSuggestion, NormalizedProduct } from "../lib/api";
import { ProductCard } from "./ProductCard";
import { SkeletonCard } from "./SkeletonCard";

export type ChatAuthor = "assistant" | "user" | "system";

export interface ChatMessage {
  id: string;
  sender: ChatAuthor;
  content: string;
  variant?: "default" | "info" | "error";
}

interface ChatThreadProps {
  messages: ChatMessage[];
  products: NormalizedProduct[];
  geminiLinks: GeminiLinkSuggestion[];
  explanations: Record<string, string>;
  followUps: string[];
  isLoading: boolean;
  onQuickReply: (text: string) => void;
}

export const ChatThread = ({
  messages,
  products,
  geminiLinks,
  explanations,
  followUps,
  isLoading,
  onQuickReply
}: ChatThreadProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, products, geminiLinks, isLoading]);

  const messageItems = useMemo(
    () =>
      messages.map((message) => {
        const isUser = message.sender === "user";
        const alignment = isUser ? "items-end" : "items-start";
        const bubbleStyle = isUser
          ? "bg-brand text-white"
          : "bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100";
        const infoStyle =
          message.variant === "info"
            ? "border border-brand/30 bg-brand/5 text-brand dark:border-brand/40 dark:bg-brand/10"
            : "";
        const errorStyle =
          message.variant === "error"
            ? "border border-rose-400 bg-rose-50 text-rose-700 dark:border-rose-600 dark:bg-rose-500/10 dark:text-rose-200"
            : "";

        return (
          <li key={message.id} className={`flex ${alignment}`}>
            <div className={`chat-bubble max-w-[90%] sm:max-w-[70%] ${bubbleStyle} ${infoStyle} ${errorStyle}`}>
              {message.content}
            </div>
          </li>
        );
      }),
    [messages]
  );

  return (
    <section className="flex h-full flex-col gap-6 overflow-y-auto rounded-2xl border border-slate-200 bg-gradient-to-b from-white/90 to-white p-6 shadow-inner dark:border-slate-800 dark:from-slate-900/90 dark:to-slate-900">
      <ul className="flex flex-1 flex-col gap-4">{messageItems}</ul>

      {isLoading ? (
        <div className="flex flex-col gap-4">
          <div className="chat-bubble max-w-sm bg-white text-slate-600 dark:bg-slate-900 dark:text-slate-300">
            Trendella is pulling in fresh products...
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      ) : null}

      {products.length > 0 && !isLoading ? (
        <div className="space-y-4">
          <div className="chat-bubble bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-200">
            Here are the top matches based on what you shared.
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                explanation={explanations[product.id]}
              />
            ))}
          </div>
        </div>
      ) : null}

      {geminiLinks.length > 0 && !isLoading ? (
        <div className="space-y-3">
          <div className="chat-bubble bg-white text-slate-700 dark:bg-slate-900 dark:text-slate-200">
            Gemini also pulled search links you can explore directly:
          </div>
          <div className="flex flex-wrap gap-2">
            {geminiLinks.map((link) => (
              <a
                key={`${link.store}-${link.url}`}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-brand/40 bg-brand/5 px-4 py-2 text-sm font-medium text-brand transition hover:bg-brand/10 dark:border-brand/50 dark:bg-brand/10 dark:text-brand-light"
              >
                {link.store.toUpperCase()}: {link.query}
              </a>
            ))}
          </div>
        </div>
      ) : null}

      {followUps.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {followUps.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition hover:border-brand hover:text-brand dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              onClick={() => onQuickReply(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      ) : null}

      <div ref={bottomRef} />
    </section>
  );
};
