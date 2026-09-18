/**
 * ============================================================
 * SERVICE: itineraryValidator.js
 * Hard Entity Validation Engine for Wayzyy Itineraries
 * Strict validation of placeId existence, category consistency,
 * geographic clustering, travel distance, food entity types,
 * and duplicate place suppression.
 * ============================================================
 */

const placesService = require('./placesService');
const locationService = require('./locationService');

// Incompatible description keyword rules by place category
const CATEGORY_DISALLOWED_KEYWORDS = {
  beach: ['museum gallery', 'fort ramparts', '17th-century fortress', 'exhibits', 'azulejo ceramic'],
  fort: ['beach swimming', 'swim in the sea', 'parasailing', 'beach shack dining', 'museum gallery exhibits'],
  museum: ['beach swimming', 'parasailing', 'water sports', 'clifftop sunset bar', 'beach shack'],
  church: ['swimming', 'nightclub', 'rave', 'parasailing', 'cocktail bar'],
  temple: ['swimming', 'nightclub', 'cocktail lounge', 'beach shack']
};

class ItineraryValidator {
  /**
   * Validate and enforce entity consistency on an itinerary
   * If any slot fails validation, it is regenerated with a valid local candidate.
   */
  validateItinerary(itinerary, booking = {}) {
    const errors = [];
    if (!itinerary || !Array.isArray(itinerary.days)) {
      return { isValid: false, errors: ['Itinerary has no valid days array'], itinerary };
    }

    const hotelArea = (booking.property?.area || itinerary.area || 'Candolim').trim();
    const hotelLat = booking.property?.coordinates?.lat || 15.5178; // Candolim default
    const hotelLng = booking.property?.coordinates?.lng || 73.7634;
    const allowsSouthGoa = (booking.preferences?.vibe || []).some(v => v.toLowerCase().includes('south')) ||
                           (booking.preferences?.region || '').toLowerCase().includes('south');

    const seenPlaceIdsOverall = new Set();

    itinerary.days.forEach((day, dayIndex) => {
      const seenPlaceIdsDay = new Set();
      let prevCoords = { lat: hotelLat, lng: hotelLng };

      if (!Array.isArray(day.items)) day.items = [];

      day.items = day.items.map((slot, slotIndex) => {
        let place = placesService.getPlaceById(slot.place_id || slot.placeId);

        // Rule 1 & 2: placeId must exist in the verified database
        if (!place) {
          errors.push(`Day ${day.day_number} Slot ${slot.slot_name || slotIndex}: Invalid or missing place_id "${slot.place_id}". Auto-regenerating.`);
          place = this.findFallbackPlace(slot, hotelArea, hotelLat, hotelLng, seenPlaceIdsOverall);
        }

        // Rule 3: Geographic Sanity
        // If stay is in North Goa, do not silently teleport to South Goa unless requested
        const distFromHotel = locationService.calculateDistance(hotelLat, hotelLng, place.coordinates.lat, place.coordinates.lng);
        if (!allowsSouthGoa && place.region === 'South Goa' && distFromHotel > 35) {
          errors.push(`Day ${day.day_number} Slot ${slot.slot_name}: Place "${place.name}" (${place.area}, ${place.region}) is ${distFromHotel}km from ${hotelArea}. Geographic mismatch for North Goa stay. Auto-regenerating.`);
          place = this.findFallbackPlace(slot, hotelArea, hotelLat, hotelLng, seenPlaceIdsOverall, 'North Goa');
        }

        // Rule 4: Duplicate place suppression within same day
        if (seenPlaceIdsDay.has(place.id)) {
          errors.push(`Day ${day.day_number} Slot ${slot.slot_name}: Duplicate place "${place.name}" on same day. Auto-regenerating.`);
          place = this.findFallbackPlace(slot, hotelArea, hotelLat, hotelLng, seenPlaceIdsOverall);
        }

        // Rule 5: Category & Food Entity Correctness
        const isLunchSlot = (slot.slot_name || '').toUpperCase().includes('LUNCH');
        const isDinnerSlot = (slot.slot_name || '').toUpperCase().includes('DINNER');
        if (isLunchSlot && place.type !== 'restaurant' && place.type !== 'cafe' && !place.categories?.includes('food') && !place.tags?.includes('dining')) {
          errors.push(`Day ${day.day_number} Slot ${slot.slot_name}: Non-food entity "${place.name}" (category: ${place.type}) in lunch slot. Auto-regenerating with verified dining venue.`);
          place = this.findFallbackFoodVenue(hotelArea, hotelLat, hotelLng, seenPlaceIdsOverall);
        } else if (isDinnerSlot && place.type !== 'restaurant' && place.type !== 'cafe' && place.type !== 'nightlife' && !place.categories?.includes('food') && !place.tags?.includes('dining')) {
          errors.push(`Day ${day.day_number} Slot ${slot.slot_name}: Non-dining entity "${place.name}" (category: ${place.type}) in dinner slot. Auto-regenerating with verified dining venue.`);
          place = this.findFallbackFoodVenue(hotelArea, hotelLat, hotelLng, seenPlaceIdsOverall);
        }

        // Rule 6: Description Semantic Compatibility
        const catKey = (place.type || 'other').toLowerCase();
        const disallowed = CATEGORY_DISALLOWED_KEYWORDS[catKey] || [];
        const combinedText = `${slot.activity || ''} ${slot.why_match || ''}`.toLowerCase();
        for (const badKeyword of disallowed) {
          if (combinedText.includes(badKeyword)) {
            errors.push(`Day ${day.day_number} Slot ${slot.slot_name}: Description contradiction. "${place.name}" (${place.type}) contains disallowed phrase "${badKeyword}". Resetting description to canonical place metadata.`);
            slot.activity = this.getCanonicalPlaceDescription(place);
            slot.why_match = `Verified ${place.type} in ${place.area}, perfectly timed for your day.`;
            break;
          }
        }

        // Rule 7: Travel distance and duration calculation
        const distFromPrev = locationService.calculateDistance(prevCoords.lat, prevCoords.lng, place.coordinates.lat, place.coordinates.lng) || 0;
        const travelMins = Math.max(5, Math.round((distFromPrev / 30) * 60)); // Avg 30 km/h in Goa traffic

        seenPlaceIdsDay.add(place.id);
        seenPlaceIdsOverall.add(place.id);
        prevCoords = place.coordinates;

        const resolvedActivity = (slot.activity && !slot.activity.includes('Agonda Beach'))
          ? slot.activity
          : this.getCanonicalPlaceDescription(place);

        // Strict entity hydration: immutable fields MUST match the verified DB entity
        return {
          time: slot.time || '10:30',
          slot_name: slot.slot_name || 'ACTIVITY',
          place_id: place.id,
          place_name: place.name,
          area: place.area,
          region: place.region,
          category: place.type,
          coordinates: place.coordinates,
          indoor_outdoor: place.indoor_outdoor,
          weather_fit: place.weather_fit,
          activity: resolvedActivity,
          why_match: slot.why_match && !slot.why_match.includes('Agonda Beach') ? slot.why_match : `Curated ${place.type} in ${place.area}, tailored to your travel vibe.`,
          distance_from_hotel_km: distFromHotel,
          distance_from_prev_km: distFromPrev,
          travel_time_mins: travelMins,
          is_adapted: slot.is_adapted || false
        };
      });

      // Rule 8: Food Suggestion Entity Check
      const lunchItem = day.items.find(it => (it.slot_name || '').toUpperCase().includes('LUNCH')) ||
                        placesService.findPlaces({ type: 'restaurant', region: 'North Goa' })[0];
      const dinnerItem = day.items.find(it => (it.slot_name || '').toUpperCase().includes('DINNER')) ||
                         placesService.findPlaces({ type: 'restaurant', region: 'North Goa' })[1];

      let lunchVenue = placesService.getPlaceById(lunchItem?.place_id);
      let dinnerVenue = placesService.getPlaceById(dinnerItem?.place_id);

      if (!lunchVenue || (lunchVenue.type !== 'restaurant' && lunchVenue.type !== 'cafe')) {
        lunchVenue = this.findFallbackFoodVenue(hotelArea, hotelLat, hotelLng, seenPlaceIdsOverall);
      }
      if (!dinnerVenue || (dinnerVenue.type !== 'restaurant' && dinnerVenue.type !== 'cafe')) {
        dinnerVenue = this.findFallbackFoodVenue(hotelArea, hotelLat, hotelLng, seenPlaceIdsOverall);
      }

      day.food_suggestion = {
        lunch: lunchVenue.name,
        lunch_entity: {
          id: lunchVenue.id,
          name: lunchVenue.name,
          area: lunchVenue.area,
          cuisine: lunchVenue.tags?.find(t => t.includes('food') || t.includes('curry') || t.includes('seafood')) || 'Authentic Goan',
          distance_km: locationService.calculateDistance(hotelLat, hotelLng, lunchVenue.coordinates.lat, lunchVenue.coordinates.lng)
        },
        dinner: dinnerVenue.name,
        dinner_entity: {
          id: dinnerVenue.id,
          name: dinnerVenue.name,
          area: dinnerVenue.area,
          cuisine: dinnerVenue.tags?.find(t => t.includes('dining') || t.includes('cocktails') || t.includes('seafood')) || 'Coastal Dining',
          distance_km: locationService.calculateDistance(hotelLat, hotelLng, dinnerVenue.coordinates.lat, dinnerVenue.coordinates.lng)
        }
      };

      // Rule 9: Dynamic Day Theme Coherence
      day.theme = this.deriveDayTheme(day);
    });

    if (errors.length > 0) {
      console.log(`[ItineraryValidator] Validated and auto-corrected ${errors.length} entity issues:`);
      errors.slice(0, 5).forEach(err => console.log(` - ${err}`));
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
      itinerary: itinerary
    };
  }

  /**
   * Derive day theme directly from the actual selected place entities
   */
  deriveDayTheme(day) {
    const daytimeItems = (day.items || []).slice(0, 3);
    const daytimeAreas = [...new Set(daytimeItems.map(it => it.area).filter(Boolean))];
    const allAreas = [...new Set((day.items || []).map(it => it.area).filter(Boolean))];

    if (daytimeAreas.includes('Anjuna') || daytimeAreas.includes('Vagator') || daytimeAreas.includes('Assagao')) {
      return `Anjuna, Vagator & Assagao Coastal Energy`;
    }
    if (daytimeAreas.includes('Panaji') || daytimeAreas.includes('Fontainhas')) {
      return `Panaji & Fontainhas Latin Heritage`;
    }
    if (daytimeAreas.includes('Reis Magos') || daytimeAreas.includes('Porvorim') || daytimeAreas.includes('Ponda') || daytimeAreas.includes('Old Goa')) {
      return `Goan Architecture, Forts & Restful Heritage`;
    }
    if (daytimeAreas.includes('Candolim') || daytimeAreas.includes('Sinquerim')) {
      return `Arrival & Coastal Candolim Orientation`;
    }
    if (allAreas.length > 0) {
      return `${allAreas.slice(0, 2).join(' & ')} Curated Journey`;
    }
    return `Curated Goa Highlights (Day ${day.day_number})`;
  }

  findFallbackPlace(slot, hotelArea, refLat, refLng, excludeSet, preferredRegion = 'North Goa') {
    const all = placesService.getAllPlaces();
    const isMealSlot = (slot.slot_name || '').toUpperCase().includes('LUNCH') || (slot.slot_name || '').toUpperCase().includes('DINNER');

    const candidates = all.filter(p => {
      if (excludeSet.has(p.id)) return false;
      if (preferredRegion && p.region !== preferredRegion) return false;
      if (isMealSlot) {
        return p.type === 'restaurant' || p.type === 'cafe' || p.categories?.includes('food');
      }
      return true;
    });

    if (candidates.length === 0) {
      return all[0];
    }

    // Rank by proximity to hotel
    candidates.sort((a, b) => {
      const distA = locationService.calculateDistance(refLat, refLng, a.coordinates.lat, a.coordinates.lng) || 999;
      const distB = locationService.calculateDistance(refLat, refLng, b.coordinates.lat, b.coordinates.lng) || 999;
      return distA - distB;
    });

    return candidates[0];
  }

  findFallbackFoodVenue(hotelArea, refLat, refLng, excludeSet) {
    const restaurants = placesService.findPlaces({ type: 'restaurant', region: 'North Goa' });
    const available = restaurants.filter(r => !excludeSet.has(r.id));
    if (available.length > 0) {
      available.sort((a, b) => {
        const distA = locationService.calculateDistance(refLat, refLng, a.coordinates.lat, a.coordinates.lng) || 999;
        const distB = locationService.calculateDistance(refLat, refLng, b.coordinates.lat, b.coordinates.lng) || 999;
        return distA - distB;
      });
      return available[0];
    }
    return restaurants[0] || placesService.getAllPlaces()[0];
  }

  getCanonicalPlaceDescription(place) {
    if (!place) return 'Explore scenic Goa attractions and coastal heritage.';
    if (place.description) return place.description;
    const typeName = place.type ? place.type.charAt(0).toUpperCase() + place.type.slice(1) : 'Destination';
    if (place.type === 'beach') {
      return `Relax and soak in the coastal scenery along ${place.name} in ${place.area}.`;
    } else if (place.type === 'fort') {
      return `Discover historic ramparts, bastions, and panoramic ocean vistas at ${place.name}.`;
    } else if (place.type === 'restaurant' || place.type === 'cafe') {
      return `Savor authentic coastal flavors and curated culinary specialties at ${place.name} in ${place.area}.`;
    } else if (place.type === 'museum') {
      return `Explore cultural artifacts, heritage exhibits, and historical treasures at ${place.name}.`;
    } else if (place.type === 'church' || place.type === 'temple') {
      return `Admire historic architecture and peaceful sacred heritage at ${place.name}.`;
    } else if (place.type === 'nightlife') {
      return `Experience energetic evening nightlife, signature cocktails, and vibrant music at ${place.name}.`;
    }
    return `Explore ${place.name}, a premier ${typeName} in ${place.area}, Goa.`;
  }
}

module.exports = new ItineraryValidator();
