/**
 * ============================================================
 * KNOWLEDGE BASE WRAPPER
 * Provides backward compatibility by wrapping PlacesService
 * ============================================================
 */

const placesService = require('./services/placesService');

class KnowledgeBase {
  getAllPlaces() {
    return placesService.getAllPlaces();
  }

  getPlaceById(id) {
    return placesService.getPlaceById(id);
  }

  getPlacesByArea(area) {
    return placesService.getPlacesByArea(area);
  }

  getPlacesByCategory(category) {
    return placesService.getPlacesByCategory(category);
  }

  findIndoorAlternatives(preferredArea = 'Candolim') {
    return placesService.findIndoorAlternatives(preferredArea);
  }

  search(query) {
    return placesService.search(query);
  }
}

module.exports = new KnowledgeBase();
