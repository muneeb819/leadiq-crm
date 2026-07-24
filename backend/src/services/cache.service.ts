import { redis } from '../config/redis';

export const cacheGet = async <T>(key: string): Promise<T | null> => {
  const val = await redis.get(key);
  return val ? JSON.parse(val) : null;
};

export const cacheSet = async (key: string, value: any, ttlSeconds = 300) => {
  await redis.setex(key, ttlSeconds, JSON.stringify(value));
};

export const cacheDel = async (key: string) => redis.del(key);

export const cacheOrFetch = async <T>(key: string, fn: () => Promise<T>, ttl = 300): Promise<T> => {
  const cached = await cacheGet<T>(key);
  if (cached) return cached;
  const fresh = await fn();
  await cacheSet(key, fresh, ttl);
  return fresh;
};
