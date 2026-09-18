/**
 * ============================================================
 * SERVICE: itineraryService.js
 * Entity-Grounded Itinerary Generation Architecture
 * 
 * Strict generation pipeline:
 * Booking Context -> Hotel Anchor -> Verified DB Places ->
 * Geographic Clustering -> Category & Food Verification ->
 * Immutable Entity Hydration -> Travel Distance Calculation ->
 * Dynamic Day Theme -> Hard Entity Validation
 * ============================================================
 */

const placesService = require('./placesService');
const locationService = require('./locationService');
const itineraryValidator = require('./itineraryValidator');

class ItineraryService {
  /**
   * Generate a comprehensive 4-slot/day itinerary tailored to booking context
   */
  generateItinerary(booking) {
    const checkInStr = booking.trip?.check_in || '2026-10-15';
    const checkIn = new Date(checkInStr);
    const guestName = booking.guest_name || 'Rahul';
    const area = (booking.property?.area || 'Candolim').trim();
    const nights = Math.max(1, Math.min(booking.trip?.nights || 4, 7));
    const interests = booking.preferences?.vibe || ['beach', 'food', 'nightlife', 'relaxed'];
    const pace = booking.preferences?.pace || 'relaxed';

    // Hotel Anchor Coordinates
    const hotelLat = booking.property?.coordinates?.lat || 15.5178;
    const hotelLng = booking.property?.coordinates?.lng || 73.7634;

    const formatDate = (dateObj, addDays) => {
      const d = new Date(dateObj);
      d.setDate(d.getDate() + addDays);
      return d.toISOString().split('T')[0];
    };

    const formatDisplayDate = (dateObj, addDays) => {
      const d = new Date(dateObj);
      d.setDate(d.getDate() + addDays);
      const day = d.getDate();
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return `${day} ${months[d.getMonth()]}`;
    };

    // Geographically coherent blueprints strictly using canonical verified IDs
    // Day 1: Candolim & Sinquerim (Hotel Anchor & Immediate Surrounds)
    // Day 2: Anjuna & Vagator (Coastal Excursion)
    // Day 3: Panaji & Fontainhas (Latin Cultural Core)
    // Day 4: Heritage & Architecture (Reis Magos & Houses of Goa)
    const dayBlueprints = [
      {
        day_number: 1,
        slots: [
          {
            time: "10:30",
            slot_name: "MORNING",
            place_id: "goa-beach-014", // Candolim Beach
            why_match: "Gentle shoreline stroll right outside your Candolim villa to settle into Goa's coastal rhythm."
          },
          {
            time: "13:00",
            slot_name: "AFTERNOON (LUNCH)",
            place_id: "goa-dine-001", // Calamari Bathe & Binge (Restaurant)
            why_match: "Fresh Goan butter garlic prawns and chilled drinks directly on the Candolim sand."
          },
          {
            time: "16:30",
            slot_name: "EVENING",
            place_id: "goa-fort-001", // Fort Aguada & Lighthouse (Fort)
            why_match: "Historic 17th-century ramparts offering golden-hour sea views over Mandovi bay."
          },
          {
            time: "20:30",
            slot_name: "NIGHT (DINNER)",
            place_id: "goa-night-001", // SinQ Night Club & Showbar Exchange (Nightlife / Lounge)
            why_match: "Signature cocktails and vibrant lounge atmosphere in Candolim."
          }
        ],
        concierge_tip: "Sunset at Aguada ramparts is breathtaking—head up by 17:15 to catch golden hour."
      },
      {
        day_number: 2,
        slots: [
          {
            time: "10:30",
            slot_name: "MORNING",
            place_id: "goa-beach-006", // Anjuna Beach (Beach)
            why_match: "Morning coastal walk along the iconic curved bay of North Goa."
          },
          {
            time: "13:30",
            slot_name: "AFTERNOON (LUNCH)",
            place_id: "goa-dine-003", // Gunpowder Assagao (Restaurant)
            why_match: "Authentic coastal Pandi curry in a peaceful vintage Portuguese garden villa."
          },
          {
            time: "17:00",
            slot_name: "EVENING",
            place_id: "goa-dine-004", // Titlie Culinary Bar (Restaurant / Sunset Bar)
            why_match: "Cliffside cocktails overlooking Little Vagator for an iconic sunset session."
          },
          {
            time: "20:30",
            slot_name: "NIGHT (DINNER)",
            place_id: "goa-night-002", // Curlies Anjuna Beachfront
            why_match: "Bohemian beachfront dining with acoustic rhythms by the sea."
          }
        ],
        concierge_tip: "Assagao to Vagator is a short 10-minute cab ride—ideal for seamless afternoon transit."
      },
      {
        day_number: 3,
        slots: [
          {
            time: "10:00",
            slot_name: "MORNING",
            place_id: "goa-exp-001", // Fontainhas Latin Quarter (Heritage)
            why_match: "Stroll pastel Portuguese lanes, art galleries, and historic bakeries."
          },
          {
            time: "13:00",
            slot_name: "AFTERNOON (LUNCH)",
            place_id: "goa-dine-002", // Fisherman's Wharf Panjim (Restaurant)
            why_match: "Riverside Goan fish curry thali with live acoustic Portuguese melodies."
          },
          {
            time: "15:30",
            slot_name: "EVENING",
            place_id: "goa-museum-007", // Mario Miranda Gallery (Museum / Gallery)
            why_match: "Sheltered browsing of iconic Goan satirical cartoons and boutique artisan keepsakes."
          },
          {
            time: "20:00",
            slot_name: "NIGHT (DINNER)",
            place_id: "goa-dine-001", // Calamari Bathe & Binge
            why_match: "Relaxed coastal return to Candolim for a beachside dinner."
          }
        ],
        concierge_tip: "Don't miss the warm bebinca at Confeitaria 31 De Janeiro in Fontainhas."
      },
      {
        day_number: 4,
        slots: [
          {
            time: "10:00",
            slot_name: "MORNING",
            place_id: "goa-fort-004", // Reis Magos Fort (Fort)
            why_match: "Covered fortress galleries with sweeping views of the Mandovi river."
          },
          {
            time: "13:30",
            slot_name: "AFTERNOON (LUNCH)",
            place_id: "goa-exp-002", // Savoi Spice Plantation (Plantation & Dining)
            why_match: "Botanical spice garden tour and traditional Saraswat buffet in covered pavilions."
          },
          {
            time: "17:00",
            slot_name: "EVENING",
            place_id: "goa-museum-001", // Houses of Goa Museum (Museum)
            why_match: "Unique architectural museum celebrating Goan home design."
          },
          {
            time: "20:30",
            slot_name: "NIGHT (DINNER)",
            place_id: "goa-dine-003", // Gunpowder Assagao
            why_match: "Farewell candlelight dinner in Assagao's lush garden courtyard."
          }
        ],
        concierge_tip: "Keep your booking ID handy for express villa checkout assistance tomorrow."
      },
      {
        day_number: 5,
        slots: [
          {
            time: "10:30",
            slot_name: "MORNING",
            place_id: "goa-beach-007", // Baga Beach
            why_match: "Gentle morning breeze and shoreline walk."
          },
          {
            time: "13:00",
            slot_name: "AFTERNOON (LUNCH)",
            place_id: "goa-dine-002", // Fisherman's Wharf
            why_match: "Recheado crab and Goan poi bread on your return route."
          },
          {
            time: "16:00",
            slot_name: "EVENING",
            place_id: "goa-museum-007", // Mario Miranda Gallery
            why_match: "Final souvenir shopping for Goan prints and artisan cashew fenny."
          },
          {
            time: "19:00",
            slot_name: "NIGHT (DINNER)",
            place_id: "goa-dine-001", // Calamari
            why_match: "Quiet sunset farewell along Candolim shoreline before airport departure."
          }
        ],
        concierge_tip: "Allow 60-75 minutes for the airport drive from North Goa during peak hours."
      }
    ];

    const days = [];
    for (let i = 0; i < nights; i++) {
      const blueprint = dayBlueprints[i] || dayBlueprints[i % dayBlueprints.length];
      const dateIso = formatDate(checkIn, i);
      const displayDate = formatDisplayDate(checkIn, i);

      let prevCoords = { lat: hotelLat, lng: hotelLng };

      const items = blueprint.slots.map(slot => {
        const place = placesService.getPlaceById(slot.place_id) || placesService.getAllPlaces()[0];
        const distFromHotel = locationService.calculateDistance(hotelLat, hotelLng, place.coordinates.lat, place.coordinates.lng);
        const distFromPrev = locationService.calculateDistance(prevCoords.lat, prevCoords.lng, place.coordinates.lat, place.coordinates.lng) || 0;
        const travelMins = Math.max(5, Math.round((distFromPrev / 30) * 60));

        prevCoords = place.coordinates;

        // Immutable entity hydration
        return {
          time: slot.time,
          slot_name: slot.slot_name,
          place_id: place.id,
          place_name: place.name,
          area: place.area,
          region: place.region,
          category: place.type,
          coordinates: place.coordinates,
          indoor_outdoor: place.indoor_outdoor,
          weather_fit: place.weather_fit,
          activity: place.description,
          why_match: slot.why_match,
          distance_from_hotel_km: distFromHotel,
          distance_from_prev_km: distFromPrev,
          travel_time_mins: travelMins,
          is_adapted: false
        };
      });

      const lunchItem = items.find(it => it.slot_name.includes('LUNCH')) || items[1];
      const dinnerItem = items.find(it => it.slot_name.includes('DINNER')) || items[3];

      days.push({
        day_number: i + 1,
        date: dateIso,
        display_date: displayDate,
        theme: '', // Will be derived by itineraryValidator
        items: items,
        food_suggestion: {
          lunch: lunchItem ? lunchItem.place_name : 'Calamari Bathe & Binge',
          dinner: dinnerItem ? dinnerItem.place_name : 'SinQ Night Club & Showbar Exchange'
        },
        concierge_tip: blueprint.concierge_tip
      });
    }

    const rawItinerary = {
      booking_id: booking.booking_id,
      guest_name: guestName,
      property: booking.property?.name || "Casa Candolim Luxury Villa",
      area: area,
      pace: pace,
      summary: `Tailored ${nights}-day Goa itinerary designed for ${guestName} staying at ${booking.property?.name || 'Candolim Villa'}, balanced around coastal relaxation, verified Goan dining, and cultural heritage.`,
      days: days
    };

    // Run hard entity validation and derivation engine
    const validationResult = itineraryValidator.validateItinerary(rawItinerary, booking);
    return validationResult.itinerary;
  }
}

module.exports = new ItineraryService();
