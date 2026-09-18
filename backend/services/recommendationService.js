/**
 * ============================================================
 * SERVICE: recommendationService.js
 * Multi-criteria ranking and recommendation engine
 * - Considers distance, weather fit, traveler type, budget
 * - Avoids repeat categories (e.g. 3rd beach)
 * - Excludes previously rejected recommendations
 * ============================================================
 */

const placesService = require('./placesService');
const locationService = require('./locationService');
const store = require('../store');

class RecommendationService {
  /**
   * Get personalized, ranked recommendations
   */
  getRecommendations({
    guestInterests = [],
    area = 'Candolim',
    refLat = 15.5178,
    refLng = 73.7634,
    timeOfDay = 'afternoon',
    weather = null,
    pace = 'relaxed',
    travelerType = null,
    category = null,
    indoorOnly = false,
    limit = 6,
    excludePlaceIds = [],
    itineraryHistory = []
  } = {}) {
    const allPlaces = placesService.getAllPlaces();
    const activeWeather = weather || store.getWeather();
    const isRain = activeWeather.is_raining || (activeWeather.rain_probability && activeWeather.rain_probability >= 60);

    // Count categories already in the itinerary to enforce diversity (e.g. avoid 3rd beach)
    const categoryCounts = {};
    if (Array.isArray(itineraryHistory)) {
      itineraryHistory.forEach(item => {
        const cat = item.type || item.category || 'other';
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      });
    }

    const scored = allPlaces
      .filter(place => !excludePlaceIds.includes(place.id))
      .map(place => {
        let score = 50; // base score
        const reasons = [];

        // 1. Proximity / Distance
        if (place.coordinates?.lat && place.coordinates?.lng) {
          const dist = locationService.calculateDistance(refLat, refLng, place.coordinates.lat, place.coordinates.lng);
          if (dist !== null) {
            place.distance_km = dist;
            if (dist <= 3) {
              score += 30;
              reasons.push(`Just ${dist} km from your villa in ${area}`);
            } else if (dist <= 8) {
              score += 20;
              reasons.push(`${dist} km away`);
            } else if (dist <= 15) {
              score += 10;
            } else {
              score -= 10; // farther away
            }
          }
        }

        // 2. Weather fitness
        if (isRain || indoorOnly) {
          if (place.indoor_outdoor === 'indoor') {
            score += 35;
            reasons.push('Sheltered indoor comfort, completely rain-safe');
          } else if (place.indoor_outdoor === 'covered') {
            score += 25;
            reasons.push('Covered setting protected from weather');
          } else {
            score -= 40; // Penalty for outdoor during rain
          }
        } else {
          // Clear weather
          if (place.indoor_outdoor === 'outdoor') {
            score += 15;
            reasons.push('Great open-air coastal atmosphere');
          }
        }

        // 3. Guest interests match
        const vibes = Array.isArray(guestInterests) ? guestInterests.map(i => i.toLowerCase()) : [];
        if (place.tags && vibes.length > 0) {
          const matchCount = place.tags.filter(t => vibes.some(v => t.includes(v) || v.includes(t))).length;
          if (matchCount > 0) {
            score += matchCount * 12;
            reasons.push(`Matches your interest in ${place.tags.slice(0, 2).join(' & ')}`);
          }
        }

        // 4. Traveler type match
        if (travelerType === 'family' && place.family_friendly) {
          score += 20;
          reasons.push('Family-friendly setting');
        }
        if (travelerType === 'couple' && place.couple_friendly) {
          score += 20;
          reasons.push('Romantic atmosphere');
        }

        // 5. Category diversity penalty (avoid 3rd beach)
        if (place.type === 'beach' && (categoryCounts['beach'] || 0) >= 2) {
          score -= 30; // Deprioritize additional beach if user already has 2
        }

        // 6. Category filter if explicitly asked
        if (category && (place.type === category || (place.categories && place.categories.includes(category)))) {
          score += 30;
        }

        // 7. Time of day fitness
        if (timeOfDay === 'night' || timeOfDay === 'dinner') {
          if (place.type === 'restaurant' || place.type === 'nightlife') {
            score += 25;
          }
        }

        return {
          ...place,
          recommendation_score: Math.round(score),
          why_matches: reasons.slice(0, 2).join(' · ') || 'Curated Goan destination'
        };
      });

    scored.sort((a, b) => b.recommendation_score - a.recommendation_score);
    return scored.slice(0, limit);
  }
}

module.exports = new RecommendationService();
