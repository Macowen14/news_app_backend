type CacheEntry<T> = { expiresAt: number; value: T };

export class MemoryCache<T> {
  private store = new Map<string, CacheEntry<T>>();

  constructor(private defaultTtlMs: number = 60_000) {}

  get(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key: string, value: T, ttlMs?: number) {
    const expiresAt = Date.now() + (ttlMs ?? this.defaultTtlMs);
    this.store.set(key, { value, expiresAt });
  }
}

export const cache = new MemoryCache<any>(120_000);


