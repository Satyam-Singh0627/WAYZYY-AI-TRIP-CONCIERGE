/**
 * ============================================================
 * SERVICE: placesService.js
 * In-memory index of normalized Goa destination data
 * ============================================================
 */

const fs = require('fs');
const path = require('path');
const locationService = require('./locationService');

class PlacesService {
  constructor() {
    this.normalizedPath = path.join(__dirname, '..', '..', 'data', 'goa', 'normalized', 'places.json');
    this.areasPath = path.join(__dirname, '..', '..', 'data', 'goa', 'normalized', 'areas.json');
    this.streetsPath = path.join(__dirname, '..', '..', 'data', 'goa', 'normalized', 'streets.json');

    this.places = [];
    this.areas = [];
    this.streets = [];

    // Indices for fast lookup
    this.byId = new Map();
    this.byArea = new Map();
    this.byType = new Map();
    this.byCategory = new Map();

    this.loadData();
  }

  loadData() {
    try {
      if (fs.existsSync(this.normalizedPath)) {
        this.places = JSON.parse(fs.readFileSync(this.normalizedPath, 'utf8'));
      }
      if (fs.existsSync(this.areasPath)) {
        this.areas = JSON.parse(fs.readFileSync(this.areasPath, 'utf8'));
      }
      if (fs.existsSync(this.streetsPath)) {
        this.streets = JSON.parse(fs.readFileSync(this.streetsPath, 'utf8'));
      }

      this.rebuildIndices();
      console.log(`[PlacesService] Indexed ${this.places.length} canonical Goa places.`);
    } catch (err) {
      console.error('[PlacesService] Failed to load normalized data:', err.message);
    }
  }

  rebuildIndices() {
    this.byId.clear();
    this.byArea.clear();
    this.byType.clear();
    this.byCategory.clear();

    for (const p of this.places) {
      this.byId.set(p.id.toLowerCase(), p);

      // Area index
      const areaKey = p.area.toLowerCase();
      if (!this.byArea.has(areaKey)) this.byArea.set(areaKey, []);
      this.byArea.get(areaKey).push(p);

      // Type index
      const typeKey = (p.type || 'other').toLowerCase();
      if (!this.byType.has(typeKey)) this.byType.set(typeKey, []);
      this.byType.get(typeKey).push(p);

      // Category index
      if (Array.isArray(p.categories)) {
        p.categories.forEach(cat => {
          const catKey = cat.toLowerCase();
          if (!this.byCategory.has(catKey)) this.byCategory.set(catKey, []);
          this.byCategory.get(catKey).push(p);
        });
      }
    }

    // Register legacy ID aliases for backward compatibility
    const legacyAliases = {
      'goa-001': 'goa-beach-014',
      'goa-002': 'goa-fort-001',
      'goa-003': 'goa-museum-001',
      'goa-004': 'goa-museum-007',
      'goa-005': 'goa-fort-004',
      'goa-006': 'goa-dine-001',
      'goa-007': 'goa-dine-002',
      'goa-008': 'goa-exp-001',
      'goa-009': 'goa-night-001',
      'goa-010': 'goa-dine-004',
      'goa-011': 'goa-dine-003',
      'goa-012': 'goa-night-002',
      'goa-013': 'goa-beach-006',
      'goa-014': 'goa-exp-002',
      'goa-015': 'goa-beach-020'
    };
    for (const [legacyId, canonId] of Object.entries(legacyAliases)) {
      const canonPlace = this.byId.get(canonId);
      if (canonPlace && !this.byId.has(legacyId)) {
        this.byId.set(legacyId, canonPlace);
      }
    }
  }

  getAllPlaces() {
    return this.places;
  }

  getPlaceById(id) {
    if (!id) return null;
    return this.byId.get(id.toLowerCase()) || null;
  }

  getPlacesByArea(areaName) {
    if (!areaName) return this.places;
    const clean = areaName.toLowerCase().trim();
    return this.places.filter(p => p.area.toLowerCase().includes(clean));
  }

  getPlacesByCategory(category) {
    if (!category) return this.places;
    const clean = category.toLowerCase().trim();
    return this.places.filter(p =>
      p.type.toLowerCase() === clean ||
      (p.categories && p.categories.some(c => c.toLowerCase().includes(clean))) ||
      (p.tags && p.tags.some(t => t.toLowerCase().includes(clean)))
    );
  }

  findPlaces(filter = {}) {
    return this.places.filter(p => {
      if (filter.type && p.type.toLowerCase() !== filter.type.toLowerCase()) return false;
      if (filter.region && p.region.toLowerCase() !== filter.region.toLowerCase()) return false;
      if (filter.area && !p.area.toLowerCase().includes(filter.area.toLowerCase())) return false;
      if (filter.indoor_outdoor && p.indoor_outdoor !== filter.indoor_outdoor) return false;
      return true;
    });
  }

  findIndoorAlternatives(preferredArea = 'Candolim', refLat = 15.5178, refLng = 73.7634) {
    const indoorCandidates = this.places.filter(p =>
      p.indoor_outdoor === 'indoor' || p.indoor_outdoor === 'covered' || p.weather_fit?.rain >= 0.7
    );

    return locationService.findNearby(indoorCandidates, refLat, refLng, 25);
  }

  getAllAreas() {
    return this.areas;
  }

  getAreaById(id) {
    if (!id) return null;
    const clean = id.toLowerCase().trim();
    return this.areas.find(a => a.id.toLowerCase() === clean || a.name.toLowerCase() === clean) || null;
  }

  getAllStreets() {
    return this.streets;
  }

  search(query) {
    if (!query) return this.places;
    const q = query.toLowerCase().trim();
    return this.places.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.area.toLowerCase().includes(q) ||
      p.type.toLowerCase().includes(q) ||
      (p.tags && p.tags.some(t => t.toLowerCase().includes(q))) ||
      (p.categories && p.categories.some(c => c.toLowerCase().includes(q)))
    );
  }
}

module.exports = new PlacesService();
