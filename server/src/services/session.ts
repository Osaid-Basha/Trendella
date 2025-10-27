import type { NormalizedProduct } from "../schemas/product";

type ProductMap = Map<string, NormalizedProduct>;

const recommendationMemory = new Map<string, ProductMap>();
const wishlistMemory = new Map<string, ProductMap>();

const getOrCreate = (store: Map<string, ProductMap>, sessionId: string): ProductMap => {
  if (!store.has(sessionId)) {
    store.set(sessionId, new Map());
  }
  return store.get(sessionId)!;
};

export const rememberProducts = (sessionId: string, products: NormalizedProduct[]) => {
  const memory = getOrCreate(recommendationMemory, sessionId);
  products.forEach((product) => {
    memory.set(product.id, product);
  });
};

export const lookupProduct = (sessionId: string, productId: string) => {
  const memory = recommendationMemory.get(sessionId);
  return memory?.get(productId) ?? null;
};

export const getWishlist = (sessionId: string): NormalizedProduct[] => {
  return Array.from(getOrCreate(wishlistMemory, sessionId).values());
};

export const addToWishlist = (sessionId: string, product: NormalizedProduct) => {
  const wishlist = getOrCreate(wishlistMemory, sessionId);
  wishlist.set(product.id, product);
};

export const removeFromWishlist = (sessionId: string, productId: string) => {
  const wishlist = getOrCreate(wishlistMemory, sessionId);
  wishlist.delete(productId);
};
