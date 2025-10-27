import sanitizeHtml from "sanitize-html";

export const isHttpsUrl = (value: string | null | undefined): boolean => {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && Boolean(url.hostname);
  } catch {
    return false;
  }
};

export const sanitizeAffiliateUrl = (value: string): string => {
  const cleaned = sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} });
  return cleaned;
};
