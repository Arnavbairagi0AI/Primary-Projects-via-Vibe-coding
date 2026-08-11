// Utility for caching mountain data and 3D terrain specs locally for offline access

export interface CacheStatus {
  isSupported: boolean;
  isCached: boolean;
  cachedCount: number;
  totalCount: number;
  lastUpdated: string | null;
  isSimulatedOffline: boolean;
}

const CACHE_STORAGE_KEY = 'mountainverse_offline_cache_v1';
const SIMULATED_OFFLINE_KEY = 'mountainverse_simulated_offline';

export const getStoredCacheStatus = (): CacheStatus => {
  try {
    const isSimulatedOffline = localStorage.getItem(SIMULATED_OFFLINE_KEY) === 'true';
    const raw = localStorage.getItem(CACHE_STORAGE_KEY);
    if (!raw) {
      return {
        isSupported: 'caches' in window || 'localStorage' in window,
        isCached: false,
        cachedCount: 0,
        totalCount: 10,
        lastUpdated: null,
        isSimulatedOffline,
      };
    }
    const data = JSON.parse(raw);
    return {
      ...data,
      isSupported: 'caches' in window || 'localStorage' in window,
      isSimulatedOffline,
    };
  } catch {
    return {
      isSupported: true,
      isCached: false,
      cachedCount: 0,
      totalCount: 10,
      lastUpdated: null,
      isSimulatedOffline: false,
    };
  }
};

export const cacheMountainDataLocally = async (mountains: any[]): Promise<CacheStatus> => {
  try {
    // Save full JSON dataset in LocalStorage / IndexedDB fallback
    localStorage.setItem(CACHE_STORAGE_KEY + '_data', JSON.stringify(mountains));

    // If Cache Storage API is available, pre-cache hero images & assets
    if ('caches' in window) {
      const cache = await caches.open('mountainverse-v1');
      const urlsToCache: string[] = [];
      mountains.forEach((m) => {
        if (m.heroImage) urlsToCache.push(m.heroImage);
        if (m.galleryImages) urlsToCache.push(...m.galleryImages);
      });

      // Try caching images in background non-blockingly
      urlsToCache.forEach(async (url) => {
        try {
          await cache.add(new Request(url, { mode: 'no-cors' }));
        } catch (e) {
          // Ignore CORS or cross-origin failures
        }
      });
    }

    const status: CacheStatus = {
      isSupported: true,
      isCached: true,
      cachedCount: mountains.length,
      totalCount: mountains.length,
      lastUpdated: new Date().toISOString(),
      isSimulatedOffline: localStorage.getItem(SIMULATED_OFFLINE_KEY) === 'true',
    };

    localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(status));
    return status;
  } catch (err) {
    console.warn('Cache writing failed:', err);
    return getStoredCacheStatus();
  }
};

export const setSimulatedOfflineMode = (offline: boolean): void => {
  localStorage.setItem(SIMULATED_OFFLINE_KEY, offline ? 'true' : 'false');
};
