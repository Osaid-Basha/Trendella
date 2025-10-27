import type { RecipientProfile } from "../schemas/profile";
import type { NormalizedProduct } from "../schemas/product";

const getCategories = (product: NormalizedProduct): string[] => {
  return Array.isArray((product as any).categories) ? (product as any).categories : [];
};

const getInterests = (product: NormalizedProduct): string[] => {
  return Array.isArray((product as any).interests) ? (product as any).interests : [];
};

const scoreProduct = (profile: RecipientProfile, product: NormalizedProduct): number => {
  const categories = getCategories(product);
  const interests = getInterests(product);

  let score = 0;

  // Profile match based on interests and brands
  const interestOverlap = interests.filter((interest) =>
    profile.interests.some(
      (profileInterest) => profileInterest.toLowerCase() === interest.toLowerCase()
    )
  );
  score += interestOverlap.length > 0 ? 1 : 0;

  const productBrands = Array.isArray((product as any).brands)
    ? ((product as any).brands as string[]).map((brand) => brand.toLowerCase())
    : [];
  productBrands.push(product.title.toLowerCase());

  const brandMatches = profile.favorite_brands.filter((brand) =>
    productBrands.some((candidate) => candidate.includes(brand.toLowerCase()))
  );
  score += brandMatches.length > 0 ? 0.5 : 0;

  // Price fitness
  if (profile.budget.max > 0) {
    const target = (profile.budget.min + profile.budget.max) / 2 || profile.budget.max;
    const delta = Math.abs(product.price.value - target);
    const tolerance = Math.max(target * 0.3, 20);
    const priceFit = Math.max(0, 1 - delta / tolerance);
    score += priceFit;
  } else {
    score += 0.5;
  }

  // Ratings weight
  const ratingWeight = product.rating.value / 5;
  score += ratingWeight;

  // Shipping / badges
  if (product.badges.includes("fast_shipping") && profile.constraints.shipping_days_max) {
    score += 0.4;
  }
  if (product.badges.includes("eco_friendly") && profile.constraints.category_excludes.includes("plastic")) {
    score += 0.3;
  }

  if ((product as any).keyword_match) {
    score += 0.4;
  }

  return score;
};

export const rankProducts = (
  profile: RecipientProfile,
  products: NormalizedProduct[]
): NormalizedProduct[] => {
  const filtered = products.filter((product) => {
    const categories = getCategories(product);

    if (
      profile.constraints.category_excludes?.some((excluded) =>
        categories.includes(excluded.toLowerCase())
      )
    ) {
      return false;
    }

    if (profile.constraints.category_includes?.length) {
      const matches = profile.constraints.category_includes.some((required) =>
        categories.includes(required.toLowerCase())
      );
      if (!matches) return false;
    }

    if (profile.budget.max > 0 && product.price.value > profile.budget.max * 1.1) {
      return false;
    }

    if (profile.budget.min > 0 && product.price.value < profile.budget.min * 0.9) {
      return false;
    }

    return true;
  });

  const scored = filtered.map((product) => ({
    product,
    score: scoreProduct(profile, product)
  }));

  scored.sort((a, b) => b.score - a.score);

  // Diversity adjustment after initial ranking
  const categoryUsage = new Map<string, number>();
  const adjusted = scored.map((entry) => {
    const categories = getCategories(entry.product);
    const diversityPenalty = categories.reduce((penalty, category) => {
      const usage = categoryUsage.get(category) ?? 0;
      return penalty + usage * 0.15;
    }, 0);

    categories.forEach((category) => {
      categoryUsage.set(category, (categoryUsage.get(category) ?? 0) + 1);
    });

    return {
      product: entry.product,
      score: entry.score - diversityPenalty
    };
  });

  adjusted.sort((a, b) => b.score - a.score);

  return adjusted.slice(0, 12).map((entry) => entry.product);
};
