/**
 * ============================================================
 * PROVIDER: openStreetMapProvider.js
 * OpenStreetMap & Overpass API client with local caching & rate-limiting
 * Documentation: https://wiki.openstreetmap.org/wiki/Overpass_API
 * ============================================================
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

class OpenStreetMapProvider {
  constructor() {
    this.endpoint = process.env.OVERPASS_ENDPOINT || 'https://overpass-api.de/api/interpreter';
    this.cacheDir = path.join(__dirname, '..', '..', 'data', 'goa', 'cache');
    this.memoryCache = new Map();
    this.cacheTTL = 24 * 60 * 60 * 1000; // 24 hours

    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  /**
   * Safe cached query runner
   */
  async queryFeatures(query, cacheKey = 'osm_query') {
    const memCached = this.memoryCache.get(cacheKey);
    if (memCached && Date.now() - memCached.timestamp < this.cacheTTL) {
      return memCached.data;
    }

    const diskCacheFile = path.join(this.cacheDir, `${cacheKey}.json`);
    if (fs.existsSync(diskCacheFile)) {
      try {
        const stat = fs.statSync(diskCacheFile);
        if (Date.now() - stat.mtimeMs < this.cacheTTL) {
          const data = JSON.parse(fs.readFileSync(diskCacheFile, 'utf8'));
          this.memoryCache.set(cacheKey, { timestamp: Date.now(), data });
          return data;
        }
      } catch (err) {
        // Disk read failure - continue to live call
      }
    }

    try {
      console.log(`[OSMProvider] Querying Overpass for ${cacheKey}...`);
      const response = await axios.post(
        this.endpoint,
        `data=${encodeURIComponent(query)}`,
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          timeout: 10000
        }
      );

      const data = response.data;
      fs.writeFileSync(diskCacheFile, JSON.stringify(data, null, 2), 'utf8');
      this.memoryCache.set(cacheKey, { timestamp: Date.now(), data });
      return data;
    } catch (err) {
      console.warn(`[OSMProvider] Overpass query failed (${err.message}). Returning empty dataset gracefully.`);
      if (fs.existsSync(diskCacheFile)) {
        return JSON.parse(fs.readFileSync(diskCacheFile, 'utf8'));
      }
      return { elements: [] };
    }
  }

  async queryOverpass(query, cacheKey) {
    return this.queryFeatures(query, cacheKey);
  }
}

module.exports = new OpenStreetMapProvider();
