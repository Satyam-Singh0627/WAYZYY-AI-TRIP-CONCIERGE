/**
 * ============================================================
 * SERVICE: searchService.js
 * Multi-criteria search engine for Goa places
 * Understands:
 * - Proximity / "near me" / "near my hotel" / "close to beach"
 * - Categories & types
 * - Indoor / outdoor / weather suitability
 * - Vibe scores (quiet, relaxed, adventurous, romantic, family)
 * - Exclusions ("not another beach")
 * - Time of day & duration
 * ============================================================
 */

const placesService = require('./placesService');
const locationService = require('./locationService');

class SearchService {
  /**
   * Parse a natural language string into a structured query criteria object
   */
  parseQueryToCriteria(queryText, bookingContext = null, weatherContext = null) {
    const q = (queryText || '').toLowerCase().trim();
    const criteria = {
      rawQuery: q,
      types: [],
      categories: [],
      excludeTypes: [],
      indoor_outdoor: null,
      refArea: null,
      refCoords: bookingContext?.property?.area?.toLowerCase() === 'candolim'
        ? { lat: 15.5178, lng: 73.7634 }
        : { lat: 15.5178, lng: 73.7634 },
      maxDistanceKm: 25,
      travelerType: null,
      vibePreferences: [],
      timeOfDay: null,
      durationMinutes: null
    };

    // 1. Proximity detection
    if (q.includes('near my hotel') || q.includes('close by') || q.includes('near me') || q.includes('around us')) {
      criteria.maxDistanceKm = 8;
    } else if (q.includes('closer')) {
      criteria.maxDistanceKm = 5;
    }

    // Check for specific area mentions
    const areas = placesService.getAllAreas();
    for (const a of areas) {
      if (q.includes(a.name.toLowerCase())) {
        criteria.refArea = a.name;
        criteria.refCoords = a.coordinates;
        criteria.maxDistanceKm = 10;
        break;
      }
    }

    // 2. Exclusions (e.g. "not another beach", "no beaches")
    if (q.includes('not another beach') || q.includes('not the beach') || q.includes('no beach') || q.includes('avoid beach') || q.includes('already done the beach')) {
      criteria.excludeTypes.push('beach');
    }

    // 3. Indoor / Outdoor filter
    if (q.includes('indoor') || q.includes('inside') || q.includes('sheltered') || q.includes('rain safe')) {
      criteria.indoor_outdoor = 'indoor';
    } else if (q.includes('outdoor') || q.includes('open air')) {
      criteria.indoor_outdoor = 'outdoor';
    }

    // 4. Vibe preferences
    if (q.includes('quiet') || q.includes('peaceful') || q.includes('calm') || q.includes('less touristy')) {
      criteria.vibePreferences.push('quiet');
    }
    if (q.includes('relaxed') || q.includes('chill') || q.includes('easy') || q.includes('not too tiring') || q.includes('less tiring')) {
      criteria.vibePreferences.push('relaxed');
    }
    if (q.includes('romantic') || q.includes('couple') || q.includes('two people') || q.includes('for two')) {
      criteria.travelerType = 'couple';
      criteria.vibePreferences.push('romantic');
    }
    if (q.includes('kids') || q.includes('family') || q.includes('children')) {
      criteria.travelerType = 'family';
      criteria.vibePreferences.push('family');
    }
    if (q.includes('adventure') || q.includes('adventurous') || q.includes('thrill') || q.includes('trek')) {
      criteria.vibePreferences.push('adventure');
    }
    if (q.includes('cultural') || q.includes('culture') || q.includes('heritage') || q.includes('history') || q.includes('portuguese')) {
      criteria.vibePreferences.push('cultural');
    }

    // 5. Category & Type mapping
    if (q.includes('dinner') || q.includes('eat') || q.includes('food') || q.includes('restaurant') || q.includes('curry') || q.includes('lunch') || q.includes('cafe')) {
      criteria.types.push('restaurant');
      criteria.categories.push('food');
    }
    if (q.includes('nightlife') || q.includes('party') || q.includes('club') || q.includes('bar') || q.includes('drinks') || q.includes('tonight')) {
      criteria.types.push('nightlife');
      criteria.categories.push('nightlife');
    }
    if (q.includes('museum') || q.includes('gallery')) {
      criteria.types.push('museum');
      criteria.categories.push('museums');
    }
    if (q.includes('fort') || q.includes('ramparts')) {
      criteria.types.push('fort');
      criteria.categories.push('forts');
    }
    if (q.includes('temple') || q.includes('church') || q.includes('spiritual')) {
      criteria.categories.push('heritage');
    }

    // 6. Time of day
    if (q.includes('tonight') || q.includes('dinner')) criteria.timeOfDay = 'night';
    if (q.includes('morning')) criteria.timeOfDay = 'morning';
    if (q.includes('after lunch') || q.includes('afternoon')) criteria.timeOfDay = 'afternoon';
    if (q.includes('sunset') || q.includes('evening')) criteria.timeOfDay = 'evening';

    // 7. Duration
    if (q.includes('two hours') || q.includes('2 hours')) criteria.durationMinutes = 120;
    if (q.includes('four hours') || q.includes('4 hours') || q.includes('half day')) criteria.durationMinutes = 240;

    return criteria;
  }

  /**
   * Search and rank places using structured criteria
   */
  searchPlaces(criteria = {}, limit = 10) {
    const allPlaces = placesService.getAllPlaces();
    const scored = [];

    const refLat = criteria.refCoords?.lat || 15.5178;
    const refLng = criteria.refCoords?.lng || 73.7634;
    const maxDist = typeof criteria.maxDistanceKm === 'number' ? criteria.maxDistanceKm : 50;
    const types = Array.isArray(criteria.types) ? criteria.types : [];
    const categories = Array.isArray(criteria.categories) ? criteria.categories : [];
    const excludeTypes = Array.isArray(criteria.excludeTypes) ? criteria.excludeTypes : [];
    const vibePreferences = Array.isArray(criteria.vibePreferences) ? criteria.vibePreferences : [];

    for (const p of allPlaces) {
      let score = 0;
      const reasons = [];

      // 1. Check exclusions
      if (excludeTypes.includes(p.type)) {
        continue;
      }

      // 2. Geospatial distance check
      if (p.coordinates?.lat && p.coordinates?.lng) {
        const dist = locationService.calculateDistance(refLat, refLng, p.coordinates.lat, p.coordinates.lng);
        if (dist !== null) {
          if (dist > maxDist) {
            continue; // Outside radius
          }
          // Closer places get higher proximity score
          const proxScore = Math.max(0, 30 - dist * 1.5);
          score += proxScore;
          reasons.push(dist < 1 ? `Walking distance (${Math.round(dist * 1000)}m)` : `${dist} km from ${criteria.refArea || 'Candolim'}`);
          p.distance_km = dist;
        }
      }

      // 3. Category & type match
      if (types.length > 0) {
        if (types.includes(p.type)) {
          score += 25;
        }
      }
      if (categories.length > 0) {
        if (p.categories && p.categories.some(c => categories.includes(c.toLowerCase()))) {
          score += 20;
        }
      }

      // 4. Indoor / Outdoor preference
      if (criteria.indoor_outdoor === 'indoor') {
        if (p.indoor_outdoor === 'indoor') {
          score += 25;
          reasons.push('Sheltered indoor space');
        } else if (p.indoor_outdoor === 'covered') {
          score += 20;
          reasons.push('Covered veranda');
        } else {
          score -= 30;
        }
      } else if (criteria.indoor_outdoor === 'outdoor') {
        if (p.indoor_outdoor === 'outdoor') {
          score += 15;
          reasons.push('Open-air coastal setting');
        }
      }

      // 5. Vibe scores
      if (vibePreferences.includes('quiet') && typeof p.quiet_score === 'number') {
        score += p.quiet_score * 20;
        if (p.quiet_score >= 0.7) reasons.push('Peaceful and uncrowded');
      }
      if (vibePreferences.includes('relaxed') && typeof p.relaxed_score === 'number') {
        score += p.relaxed_score * 20;
      }
      if (vibePreferences.includes('adventure') && typeof p.adventure_score === 'number') {
        score += p.adventure_score * 20;
      }
      if (vibePreferences.includes('cultural') && typeof p.cultural_score === 'number') {
        score += p.cultural_score * 25;
        if (p.cultural_score >= 0.8) reasons.push('Rich historical & cultural depth');
      }

      // 6. Traveler type match
      if (criteria.travelerType === 'family') {
        if (p.family_friendly) {
          score += 15;
          reasons.push('Family-friendly');
        } else if (p.family_friendly === false) {
          score -= 20;
        }
      }
      if (criteria.travelerType === 'couple') {
        if (p.couple_friendly) {
          score += 15;
          reasons.push('Ideal for couples');
        }
      }

      // 7. Keyword bonus if raw query matches tags
      if (criteria.rawQuery && p.tags) {
        const queryWords = criteria.rawQuery.split(/\s+/).filter(w => w.length > 3);
        const tagMatches = p.tags.filter(t => queryWords.some(w => t.includes(w) || w.includes(t))).length;
        score += tagMatches * 10;
      }

      scored.push({
        ...p,
        match_score: Math.round(score),
        why_matches: reasons.slice(0, 2).join(' · ') || 'Verified Goan destination'
      });
    }

    // Sort descending by score
    scored.sort((a, b) => b.match_score - a.match_score);
    return scored.slice(0, limit);
  }

  /**
   * Main query entry point
   */
  query(queryText, bookingContext = null, weatherContext = null, limit = 10) {
    const criteria = this.parseQueryToCriteria(queryText, bookingContext, weatherContext);
    return this.searchPlaces(criteria, limit);
  }
}

module.exports = new SearchService();
