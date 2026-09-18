/**
 * ============================================================
 * PROVIDER: googlePlacesProvider.js
 * Optional Google Places API provider (Server-side only)
 * ============================================================
 */

const axios = require('axios');

class GooglePlacesProvider {
  constructor() {
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY || '';
    this.baseUrl = 'https://maps.googleapis.com/maps/api/place';
  }

  isConfigured() {
    return Boolean(this.apiKey && this.apiKey.trim().length > 10);
  }

  async searchNearby(lat, lng, radius = 5000, type = 'tourist_attraction') {
    if (!this.isConfigured()) {
      return [];
    }

    try {
      const response = await axios.get(`${this.baseUrl}/nearbysearch/json`, {
        params: {
          location: `${lat},${lng}`,
          radius,
          type,
          key: this.apiKey
        },
        timeout: 6000
      });

      if (response.data?.status === 'OK') {
        return response.data.results.map(r => ({
          id: `GOOGLE-${r.place_id}`,
          name: r.name,
          coordinates: {
            lat: r.geometry?.location?.lat || null,
            lng: r.geometry?.location?.lng || null
          },
          address: r.vicinity || null,
          source: 'Google Places API',
          source_type: 'google',
          source_url: `https://www.google.com/maps/place/?q=place_id:${r.place_id}`,
          last_verified: new Date().toISOString().split('T')[0]
        }));
      }
      return [];
    } catch (err) {
      console.warn(`[GooglePlacesProvider] Request failed (${err.message}). Using fallback data.`);
      return [];
    }
  }

  async searchPlaces(query) {
    if (!this.isConfigured()) {
      return { results: [], source: 'disabled' };
    }
    return { results: [], source: 'google' };
  }
}

module.exports = new GooglePlacesProvider();
