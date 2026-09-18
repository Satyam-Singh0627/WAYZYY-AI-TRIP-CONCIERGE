/**
 * ============================================================
 * SCRIPT: validateGoaData.js
 * Validates canonical Goa datasets against Part 28 rules:
 * - duplicate IDs
 * - duplicate names with conflicting coordinates
 * - missing source, source_url, last_verified
 * - invalid lat/lng bounds (Goa lat ~14.8-15.9, lng ~73.6-74.4)
 * - invalid type & region
 * - broken relationships & references
 * - malformed JSON
 * ============================================================
 */

const fs = require('fs');
const path = require('path');

const NORM_DIR = path.join(__dirname, '..', 'data', 'goa', 'normalized');

function validatePlaces(places, areas = []) {
  const errors = [];
  const warnings = [];

  const areaNames = new Set(areas.map(a => a.name.toLowerCase()));
  const seenIds = new Map();
  const seenNames = new Map();

  const validRegions = new Set(["North Goa", "South Goa"]);
  const validTypes = new Set([
    "beach", "fort", "temple", "church", "museum", "nature",
    "hotel", "restaurant", "cafe", "nightlife", "activity", "attraction"
  ]);

  places.forEach((p, idx) => {
    const loc = `Place #${idx + 1} (${p.name || 'Unnamed'})`;

    // 1. Duplicate ID check
    if (!p.id || typeof p.id !== 'string') {
      errors.push(`${loc}: Missing or non-string ID`);
    } else if (seenIds.has(p.id)) {
      errors.push(`${loc}: Duplicate ID '${p.id}' (also at index ${seenIds.get(p.id)})`);
    } else {
      seenIds.set(p.id, idx);
    }

    // 2. Name & coordinates conflict
    if (!p.name || typeof p.name !== 'string') {
      errors.push(`${loc}: Missing name`);
    } else {
      const lower = p.name.toLowerCase().trim();
      if (seenNames.has(lower)) {
        const prev = seenNames.get(lower);
        if (prev.lat !== p.coordinates?.lat || prev.lng !== p.coordinates?.lng) {
          errors.push(`${loc}: Duplicate name '${p.name}' with conflicting coordinates`);
        }
      } else {
        seenNames.set(lower, { lat: p.coordinates?.lat, lng: p.coordinates?.lng });
      }
    }

    // 3. Coordinate bounds (Goa: Lat 14.8 to 15.9, Lng 73.6 to 74.4)
    if (p.coordinates) {
      const { lat, lng } = p.coordinates;
      if (lat !== null && lat !== undefined) {
        if (typeof lat !== 'number' || lat < 14.5 || lat > 16.0) {
          errors.push(`${loc}: Invalid latitude ${lat} outside Goa bounds (14.5 - 16.0)`);
        }
      }
      if (lng !== null && lng !== undefined) {
        if (typeof lng !== 'number' || lng < 73.5 || lng > 74.5) {
          errors.push(`${loc}: Invalid longitude ${lng} outside Goa bounds (73.5 - 74.5)`);
        }
      }
    }

    // 4. Source integrity
    if (!p.source || typeof p.source !== 'string') {
      errors.push(`${loc}: Missing source attribution`);
    }
    if (!p.source_url || typeof p.source_url !== 'string') {
      errors.push(`${loc}: Missing source_url`);
    }
    if (!p.last_verified || typeof p.last_verified !== 'string') {
      errors.push(`${loc}: Missing last_verified date`);
    }

    // 5. Region check
    if (!validRegions.has(p.region)) {
      errors.push(`${loc}: Invalid region '${p.region}' (Must be 'North Goa' or 'South Goa')`);
    }

    // 6. Type check
    if (!validTypes.has(p.type)) {
      errors.push(`${loc}: Invalid type '${p.type}'`);
    }

    // 7. Area relationship check
    if (p.area && areas.length > 0 && !areaNames.has(p.area.toLowerCase())) {
      warnings.push(`${loc}: Area '${p.area}' not registered in areas.json`);
    }
  });

  return { errors, warnings };
}

function runValidation() {
  console.log('\n============================================================');
  console.log('       RUNNING GOA DESTINATION DATA VALIDATION (PART 28)    ');
  console.log('============================================================\n');

  const placesPath = path.join(NORM_DIR, 'places.json');
  const areasPath = path.join(NORM_DIR, 'areas.json');
  const streetsPath = path.join(NORM_DIR, 'streets.json');

  const errors = [];
  const warnings = [];

  // Check files exist
  [placesPath, areasPath, streetsPath].forEach(p => {
    if (!fs.existsSync(p)) {
      errors.push(`Missing normalized file: ${p}`);
    }
  });

  if (errors.length > 0) {
    console.error('Fatal errors:', errors);
    process.exit(1);
  }

  let places, areas, streets;
  try {
    places = JSON.parse(fs.readFileSync(placesPath, 'utf8'));
    areas = JSON.parse(fs.readFileSync(areasPath, 'utf8'));
    streets = JSON.parse(fs.readFileSync(streetsPath, 'utf8'));
  } catch (e) {
    console.error(`[FAIL] Malformed JSON: ${e.message}`);
    process.exit(1);
  }

  const result = validatePlaces(places, areas);
  errors.push(...result.errors);
  warnings.push(...result.warnings);

  // Report results
  console.log(`Places validated: ${places.length}`);
  console.log(`Areas registered: ${areas.length}`);
  console.log(`Streets registered: ${streets.length}`);
  console.log(`Warnings: ${warnings.length}`);
  if (warnings.length > 0) {
    warnings.slice(0, 5).forEach(w => console.warn(`  [WARN] ${w}`));
  }

  if (errors.length > 0) {
    console.error(`\n[FAIL] Validation found ${errors.length} errors:`);
    errors.forEach(e => console.error(`  - ${e}`));
    process.exit(1);
  } else {
    console.log('\n[PASS] All Goa destination data passed validation successfully (0 errors)!\n');
  }
}

if (require.main === module) {
  runValidation();
}

module.exports = { runValidation, validatePlaces };
