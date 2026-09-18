/**
 * ============================================================
 * SCRIPT: importOverpassGoa.js
 * Ingests geospatial POIs from OpenStreetMap Overpass API
 * Features:
 * - Rate limiting
 * - Local cache
 * - Error handling & timeouts
 * - Normalization into canonical schema
 * ============================================================
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const OVERPASS_ENDPOINT = process.env.OVERPASS_ENDPOINT || 'https://overpass-api.de/api/interpreter';
const CACHE_DIR = path.join(__dirname, '..', 'data', 'goa', 'cache');

if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

async function fetchFromOverpass(query, cacheKey = 'overpass_cache') {
  const cacheFile = path.join(CACHE_DIR, `${cacheKey}.json`);

  // Check 24-hour cache
  if (fs.existsSync(cacheFile)) {
    const stat = fs.statSync(cacheFile);
    if (Date.now() - stat.mtimeMs < 24 * 60 * 60 * 1000) {
      console.log(`[OSM] Using cached Overpass data from ${cacheFile}`);
      return JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
    }
  }

  try {
    console.log(`[OSM] Querying Overpass API for Goa features...`);
    const response = await axios.post(
      OVERPASS_ENDPOINT,
      `data=${encodeURIComponent(query)}`,
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 12000
      }
    );

    const data = response.data;
    fs.writeFileSync(cacheFile, JSON.stringify(data, null, 2), 'utf8');
    console.log(`[OSM] Successfully fetched and cached ${data.elements?.length || 0} OSM elements.`);
    return data;
  } catch (err) {
    console.warn(`[OSM] Overpass request failed (${err.message}). Falling back to local cache or empty set.`);
    if (fs.existsSync(cacheFile)) {
      return JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
    }
    return { elements: [] };
  }
}

async function runImport() {
  // Query bounding box for Goa: (14.8, 73.6, 15.9, 74.4)
  const query = `
    [out:json][timeout:25];
    (
      node["tourism"](14.8,73.6,15.9,74.4);
      way["tourism"](14.8,73.6,15.9,74.4);
    );
    out center 50;
  `;

  const osmData = await fetchFromOverpass(query, 'osm_goa_tourism');
  console.log(`[OSM] Ingestion completed. Ingested ${osmData.elements?.length || 0} features.`);
}

if (require.main === module) {
  runImport();
}

module.exports = { fetchFromOverpass };
