import crypto from "node:crypto";
import { LRUCache } from "lru-cache";
import type { NormalizedProduct, ProductQuerySpec } from "../schemas/product";

type CacheValue = {
  products: NormalizedProduct[];
  timestamp: number;
};

const cache = new LRUCache<string, CacheValue>({
  max: 128,
  ttl: 1000 * 60 * 20 // 20 minutes
});

const hashSpec = (spec: ProductQuerySpec, namespace: string): string => {
  const hash = crypto.createHash("sha256");
  hash.update(namespace);
  hash.update(JSON.stringify(spec));
  return hash.digest("hex");
};

export const getCachedProducts = (spec: ProductQuerySpec, namespace: string) => {
  const key = hashSpec(spec, namespace);
  return cache.get(key)?.products ?? null;
};

export const setCachedProducts = (
  spec: ProductQuerySpec,
  namespace: string,
  products: NormalizedProduct[]
) => {
  const key = hashSpec(spec, namespace);
  cache.set(key, { products, timestamp: Date.now() });
};

export const cacheSize = () => cache.size;
