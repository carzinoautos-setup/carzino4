import { useCallback, useRef, useEffect, useMemo, useState } from "react";

/**
 * Debounce hook for API calls and search
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Throttle hook for scroll events and frequent updates
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
): T {
  const lastRun = useRef(Date.now());

  return useCallback(
    ((...args) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = Date.now();
      }
    }) as T,
    [callback, delay],
  );
}

/**
 * Virtual scrolling hook for large lists
 */
export function useVirtualScrolling(
  itemCount: number,
  itemHeight: number,
  containerHeight: number,
) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    itemCount - 1,
    Math.floor((scrollTop + containerHeight) / itemHeight),
  );

  const visibleItems = useMemo(() => {
    const items = [];
    for (let i = visibleStart; i <= visibleEnd; i++) {
      items.push(i);
    }
    return items;
  }, [visibleStart, visibleEnd]);

  const totalHeight = itemCount * itemHeight;
  const offsetY = visibleStart * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop,
  };
}

/**
 * Intersection Observer hook for lazy loading
 */
export function useIntersectionObserver(
  ref: React.RefObject<Element>,
  options: IntersectionObserverInit = {},
) {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [ref, options]);

  return isIntersecting;
}

/**
 * Cache management for API responses
 */
class ApiCache {
  private cache = new Map<
    string,
    { data: any; timestamp: number; ttl: number }
  >();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  set(key: string, data: any, ttl: number = this.DEFAULT_TTL) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);

    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear() {
    this.cache.clear();
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }
}

export const apiCache = new ApiCache();

/**
 * Enhanced API client with caching and retry logic
 */
export class OptimizedApiClient {
  private retryAttempts = 3;
  private retryDelay = 1000;

  async request<T>(
    url: string,
    options: RequestInit = {},
    useCache: boolean = true,
    cacheTtl?: number,
  ): Promise<T> {
    const cacheKey = `${url}_${JSON.stringify(options)}`;

    // Check cache first
    if (useCache && apiCache.has(cacheKey)) {
      return apiCache.get(cacheKey);
    }

    let lastError: Error;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            "Content-Type": "application/json",
            ...options.headers,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // Cache successful responses
        if (useCache) {
          apiCache.set(cacheKey, data, cacheTtl);
        }

        return data;
      } catch (error) {
        lastError = error as Error;

        if (attempt < this.retryAttempts) {
          await new Promise((resolve) =>
            setTimeout(resolve, this.retryDelay * attempt),
          );
        }
      }
    }

    throw lastError!;
  }
}

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  private static measurements = new Map<string, number>();

  static startMeasure(name: string) {
    this.measurements.set(name, performance.now());
  }

  static endMeasure(name: string): number {
    const start = this.measurements.get(name);
    if (!start) {
      console.warn(`No start measurement found for "${name}"`);
      return 0;
    }

    const duration = performance.now() - start;
    this.measurements.delete(name);

    if (import.meta.env.DEV) {
      console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
    }

    return duration;
  }
}

/**
 * Utility functions for performance optimization
 */
export const performanceUtils = {
  // Batch DOM updates
  batchUpdates: (callback: () => void) => {
    requestAnimationFrame(callback);
  },

  // Optimize image loading
  preloadImage: (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = src;
    });
  },

  // Memory usage monitoring
  getMemoryUsage: (): MemoryInfo | null => {
    return (performance as any).memory || null;
  },

  // Network connection info
  getConnectionInfo: (): any => {
    return (navigator as any).connection || null;
  },
};
