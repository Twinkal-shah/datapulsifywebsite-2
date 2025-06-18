interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export class CacheManager {
  private cache: Map<string, CacheEntry<any>>;
  private readonly TTL = 3600000; // 1 hour in milliseconds

  constructor() {
    this.cache = new Map();
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if cache entry has expired
    if (Date.now() - entry.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  async set<T>(key: string, data: T): Promise<void> {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clear(prefix?: string): void {
    if (prefix) {
      // Clear entries with matching prefix
      for (const key of this.cache.keys()) {
        if (key.startsWith(prefix)) {
          this.cache.delete(key);
        }
      }
    } else {
      // Clear all entries
      this.cache.clear();
    }
  }
} 