
/**
 * LRU (Least Recently Used) Cache implementation.
 * 
 * Automatically evicts least recently used items when capacity is reached.
 * Useful for bounded caches like intent parsing cache.
 */

export class LRUCache<K, V> {
  private capacity: number;
  private cache: Map<K, V>;
  private accessOrder: K[];

  constructor(capacity: number = 100) {
    this.capacity = capacity;
    this.cache = new Map();
    this.accessOrder = [];
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) {
      return undefined;
    }

    // Move to end (most recently used)
    this.moveToEnd(key);
    return this.cache.get(key);
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      // Update existing
      this.cache.set(key, value);
      this.moveToEnd(key);
      return;
    }

    // Add new item
    if (this.cache.size >= this.capacity) {
      // Evict least recently used (first in accessOrder)
      const lruKey = this.accessOrder.shift();
      if (lruKey !== undefined) {
        this.cache.delete(lruKey);
      }
    }

    this.cache.set(key, value);
    this.accessOrder.push(key);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  delete(key: K): void {
    this.cache.delete(key);
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  size(): number {
    return this.cache.size;
  }

  private moveToEnd(key: K): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
      this.accessOrder.push(key);
    }
  }
}
