/**
 * ============================================================
 * SERVICE: locationService.js
 * Geospatial operations using Haversine distance
 * ============================================================
 */

class LocationService {
  /**
   * Calculate distance between two coordinate pairs in kilometers using Haversine formula
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    if (lat1 === null || lon1 === null || lat2 === null || lon2 === null) {
      return null;
    }

    const R = 6371; // Earth's radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return Math.round(d * 10) / 10; // 1 decimal place
  }

  deg2rad(deg) {
    return deg * (Math.PI / 180);
  }

  /**
   * Filter and sort places by distance from a reference point
   */
  findNearby(places, refLat = 15.5178, refLng = 73.7634, radiusKm = 15, options = {}) {
    const results = [];

    for (const p of places) {
      if (!p.coordinates || p.coordinates.lat === null || p.coordinates.lng === null) {
        continue;
      }

      const dist = this.calculateDistance(refLat, refLng, p.coordinates.lat, p.coordinates.lng);
      if (dist !== null && dist <= radiusKm) {
        // Optional filters
        if (options.type && p.type !== options.type) continue;
        if (options.indoor_outdoor && p.indoor_outdoor !== options.indoor_outdoor) continue;
        if (options.family_friendly && !p.family_friendly) continue;
        if (options.couple_friendly && !p.couple_friendly) continue;

        results.push({
          ...p,
          distance_km: dist,
          distance_str: dist < 1 ? `${Math.round(dist * 1000)}m away` : `${dist} km away`
        });
      }
    }

    // Sort ascending by distance
    results.sort((a, b) => a.distance_km - b.distance_km);
    return results;
  }

  findWithinRadius(places, refLat, refLng, radiusKm = 10, type = null) {
    return this.findNearby(places, refLat, refLng, radiusKm, { type });
  }

  findByArea(places, areaName) {
    if (!areaName) return places;
    const clean = areaName.toLowerCase().trim();
    return places.filter(p => p.area.toLowerCase() === clean || p.area.toLowerCase().includes(clean));
  }

  findNearbyHotels(places, refLat, refLng, radiusKm = 15) {
    return this.findNearby(places, refLat, refLng, radiusKm, { type: 'hotel' });
  }

  findNearbyRestaurants(places, refLat, refLng, radiusKm = 10) {
    return this.findNearby(places, refLat, refLng, radiusKm, { type: 'restaurant' });
  }

  findNearbyActivities(places, refLat, refLng, radiusKm = 15) {
    return this.findNearby(places, refLat, refLng, radiusKm).filter(p => p.type === 'activity' || p.type === 'beach' || p.type === 'fort' || p.type === 'museum');
  }

  findNearbyBeaches(places, refLat, refLng, radiusKm = 15) {
    return this.findNearby(places, refLat, refLng, radiusKm, { type: 'beach' });
  }

  findNearbyIndoorPlaces(places, refLat, refLng, radiusKm = 20) {
    return this.findNearby(places, refLat, refLng, radiusKm).filter(p => p.indoor_outdoor === 'indoor' || p.indoor_outdoor === 'covered');
  }

  findNearbyOutdoorPlaces(places, refLat, refLng, radiusKm = 20) {
    return this.findNearby(places, refLat, refLng, radiusKm, { indoor_outdoor: 'outdoor' });
  }

  findNearbyFamilyActivities(places, refLat, refLng, radiusKm = 15) {
    return this.findNearby(places, refLat, refLng, radiusKm, { family_friendly: true });
  }

  findNearbyRomanticActivities(places, refLat, refLng, radiusKm = 15) {
    return this.findNearby(places, refLat, refLng, radiusKm, { couple_friendly: true });
  }

  findRouteContext(fromArea, toArea) {
    return {
      from: fromArea,
      to: toArea,
      estimated_drive_minutes: fromArea.toLowerCase() === toArea.toLowerCase() ? 10 : 25,
      transport_mode: 'taxi / self-drive scooter'
    };
  }
}

module.exports = new LocationService();
