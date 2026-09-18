/**
 * ============================================================
 * PROVIDER: goaTourismProvider.js
 * Official Goa Tourism Development Corporation (GTDC) Provider
 * Source: https://goa-tourism.com/
 * ============================================================
 */

const fs = require('fs');
const path = require('path');

class GoaTourismProvider {
  constructor() {
    this.normalizedPath = path.join(__dirname, '..', '..', 'data', 'goa', 'normalized', 'places.json');
    this.areasPath = path.join(__dirname, '..', '..', 'data', 'goa', 'normalized', 'areas.json');
    this.streetsPath = path.join(__dirname, '..', '..', 'data', 'goa', 'normalized', 'streets.json');
    this.places = [];
    this.areas = [];
    this.streets = [];
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
      console.log(`[GoaTourismProvider] Loaded ${this.places.length} places, ${this.areas.length} areas.`);
    } catch (err) {
      console.error('[GoaTourismProvider] Failed to load data:', err.message);
    }
  }

  getAllPlaces() {
    return this.places;
  }

  getPlaceById(id) {
    if (!id) return null;
    return this.places.find(p => p.id.toLowerCase() === id.toLowerCase()) || null;
  }

  getAllAreas() {
    return this.areas;
  }

  getAreaByName(name) {
    if (!name) return null;
    const clean = name.toLowerCase().trim();
    return this.areas.find(a => a.name.toLowerCase() === clean || a.id.toLowerCase() === clean) || null;
  }

  getAllStreets() {
    return this.streets;
  }
}

module.exports = new GoaTourismProvider();
