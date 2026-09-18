/**
 * ============================================================
 * SCRIPT: normalizeGoaData.js
 * Normalizes, de-duplicates, and indexes Goa destination data
 * Output: data/goa/normalized/places.json, areas.json, streets.json
 * ============================================================
 */

const fs = require('fs');
const path = require('path');

const GOA_DIR = path.join(__dirname, '..', 'data', 'goa');
const NORM_DIR = path.join(GOA_DIR, 'normalized');

if (!fs.existsSync(NORM_DIR)) {
  fs.mkdirSync(NORM_DIR, { recursive: true });
}

function loadJson(filename) {
  const p = path.join(GOA_DIR, filename);
  if (fs.existsSync(p)) {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  }
  return [];
}

const places = loadJson('places.json');
const areas = loadJson('areas.json');
const streets = loadJson('streets.json');

console.log(`[Normalize] Starting normalization on ${places.length} places, ${areas.length} areas, ${streets.length} streets...`);

// 1. Deduplication by ID & Normalized Name
const seenIds = new Set();
const seenNames = new Set();
const normalizedPlaces = [];

for (const p of places) {
  const normName = p.name.trim().toLowerCase();
  if (seenIds.has(p.id)) {
    console.warn(`[Normalize] Skipping duplicate ID: ${p.id} (${p.name})`);
    continue;
  }
  if (seenNames.has(normName)) {
    console.warn(`[Normalize] Skipping duplicate place name: ${p.name}`);
    continue;
  }

  seenIds.add(p.id);
  seenNames.add(normName);

  // Canonical schema normalization
  normalizedPlaces.push({
    id: p.id,
    name: p.name.trim(),
    type: p.type || "attraction",
    region: p.region || "North Goa",
    area: p.area || "Goa",
    coordinates: {
      lat: typeof p.coordinates?.lat === 'number' ? p.coordinates.lat : null,
      lng: typeof p.coordinates?.lng === 'number' ? p.coordinates.lng : null
    },
    address: p.address || null,
    tags: Array.isArray(p.tags) ? p.tags : [],
    categories: Array.isArray(p.categories) ? p.categories : [],
    indoor_outdoor: p.indoor_outdoor || "outdoor",
    weather_fit: p.weather_fit || { clear: 1.0, cloudy: 0.8, rain: 0.2 },
    best_time: Array.isArray(p.best_time) ? p.best_time : ["any"],
    estimated_duration_minutes: p.estimated_duration_minutes || null,
    price_level: p.price_level || null,
    family_friendly: typeof p.family_friendly === 'boolean' ? p.family_friendly : null,
    couple_friendly: typeof p.couple_friendly === 'boolean' ? p.couple_friendly : null,
    solo_friendly: typeof p.solo_friendly === 'boolean' ? p.solo_friendly : null,
    quiet_score: typeof p.quiet_score === 'number' ? p.quiet_score : null,
    adventure_score: typeof p.adventure_score === 'number' ? p.adventure_score : null,
    relaxed_score: typeof p.relaxed_score === 'number' ? p.relaxed_score : null,
    cultural_score: typeof p.cultural_score === 'number' ? p.cultural_score : null,
    food_score: typeof p.food_score === 'number' ? p.food_score : null,
    opening_hours: p.opening_hours || null,
    website: p.website || null,
    phone: p.phone || null,
    source: p.source || "Goa Tourism",
    source_type: p.source_type || "official",
    source_url: p.source_url || "https://goa-tourism.com/",
    last_verified: p.last_verified || "2026-09-18"
  });
}

// 2. Write normalized files
fs.writeFileSync(path.join(NORM_DIR, 'places.json'), JSON.stringify(normalizedPlaces, null, 2), 'utf8');
fs.writeFileSync(path.join(NORM_DIR, 'areas.json'), JSON.stringify(areas, null, 2), 'utf8');
fs.writeFileSync(path.join(NORM_DIR, 'streets.json'), JSON.stringify(streets, null, 2), 'utf8');

console.log(`[Normalize] Successfully normalized ${normalizedPlaces.length} places into data/goa/normalized/`);
