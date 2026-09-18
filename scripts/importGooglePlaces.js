/**
 * ============================================================
 * SCRIPT: importGooglePlaces.js
 * Optional Google Places API integration (Server-side only)
 * ============================================================
 */

const axios = require('axios');

const API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';

async function searchNearbyPlaces(lat = 15.5178, lng = 73.7634, radius = 5000, type = 'tourist_attraction') {
  if (!API_KEY) {
    console.log('[GooglePlaces] GOOGLE_MAPS_API_KEY not configured. Operating in fallback mode (GTDC + OSM).');
    return [];
  }

  try {
    const url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
    const response = await axios.get(url, {
      params: {
        location: `${lat},${lng}`,
        radius,
        type,
        key: API_KEY
      },
      timeout: 8000
    });

    if (response.data.status === 'OK') {
      return response.data.results.map(r => ({
        id: `GOOGLE-${r.place_id}`,
        name: r.name,
        coordinates: {
          lat: r.geometry?.location?.lat || null,
          lng: r.geometry?.location?.lng || null
        },
        address: r.vicinity || null,
        rating: r.rating || null,
        source: 'Google Places API',
        source_type: 'google',
        source_url: `https://www.google.com/maps/place/?q=place_id:${r.place_id}`,
        last_verified: new Date().toISOString().split('T')[0]
      }));
    }
    return [];
  } catch (err) {
    console.warn(`[GooglePlaces] API request failed (${err.message}). Using fallback data.`);
    return [];
  }
}

if (require.main === module) {
  searchNearbyPlaces().then(res => {
    console.log(`[GooglePlaces] Retrieved ${res.length} places.`);
  });
}

module.exports = { searchNearbyPlaces };
