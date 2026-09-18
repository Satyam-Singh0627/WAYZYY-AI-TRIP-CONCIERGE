const store = require('../store');
const knowledgeBase = require('../knowledgeBase');
const telegramAdapter = require('./telegramAdapter');
const weatherService = require('./weatherService');
const itineraryValidator = require('./itineraryValidator');

class AdaptationService {
  /**
   * Evaluate active bookings and adapt itinerary if weather is disruptive
   */
  async evaluateAndAdapt(bookingId, targetDayNumber = 2, forcedCondition = null) {
    const booking = store.getBooking(bookingId);
    if (!booking) {
      throw new Error(`Booking ${bookingId} not found`);
    }

    const itinerary = store.getItinerary(bookingId);
    if (!itinerary || !itinerary.days) {
      throw new Error(`Itinerary for booking ${bookingId} not found`);
    }

    const weather = forcedCondition || store.getWeather();
    const isAdverse = weather.is_raining || ['Rain', 'Drizzle', 'Thunderstorm'].includes(weather.condition) || weather.rain_probability >= 60;

    if (!isAdverse) {
      return {
        adapted: false,
        reason: 'Weather is clear; no outdoor plan disruption detected.',
        weather
      };
    }

    // Target the requested day (default Day 2: "tomorrow")
    const dayIndex = targetDayNumber - 1;
    const targetDay = itinerary.days[dayIndex] || itinerary.days[0];
    if (!targetDay) {
      return { adapted: false, reason: 'Target day not found in itinerary', weather };
    }

    // Find outdoor activity
    const outdoorItemIndex = targetDay.items.findIndex(
      item => item.indoor_outdoor === 'outdoor' || item.weather_fit === 'dry_only'
    );

    if (outdoorItemIndex === -1) {
      return {
        adapted: false,
        reason: 'All activities for this day are already weather-safe.',
        weather
      };
    }

    const originalItem = targetDay.items[outdoorItemIndex];
    const guestArea = booking.property?.area || 'Candolim';

    // Find curated indoor alternatives
    const indoorCandidates = knowledgeBase.findIndoorAlternatives(guestArea);
    // Pick an alternative not already in the day's itinerary
    const existingPlaceIds = targetDay.items.map(i => i.place_id);
    const chosenAlternative = indoorCandidates.find(c => !existingPlaceIds.includes(c.id)) || indoorCandidates[0];

    if (!chosenAlternative) {
      return { adapted: false, reason: 'No indoor alternative available in knowledge base', weather };
    }

    // Adapt the itinerary item
    const explanation = `Because heavy rain (${weather.rain_probability || 95}% risk) is expected tomorrow, I've moved your outdoor beach time and suggested a sheltered Goan cultural experience nearby.`;

    const distFromHotel = chosenAlternative.distance_km || 4.2;

    const updatedItem = {
      time: originalItem.time,
      slot_name: originalItem.slot_name || "MORNING",
      place_id: chosenAlternative.id,
      place_name: chosenAlternative.name,
      area: chosenAlternative.area,
      region: chosenAlternative.region || 'North Goa',
      category: chosenAlternative.type || 'museum',
      coordinates: chosenAlternative.coordinates,
      activity: `[ADAPTED FOR WEATHER] Sheltered visit to ${chosenAlternative.name}. ${chosenAlternative.description || itineraryValidator.getCanonicalPlaceDescription(chosenAlternative)}`,
      indoor_outdoor: chosenAlternative.indoor_outdoor || 'indoor',
      weather_fit: chosenAlternative.weather_fit,
      approx_distance_area: chosenAlternative.approx_distance_area || `${distFromHotel} km away`,
      distance_from_hotel_km: distFromHotel,
      distance_from_prev_km: distFromHotel,
      travel_time_mins: Math.max(5, Math.round((distFromHotel / 30) * 60)),
      why_match: `Rain-safe indoor alternative ensuring zero disruption to your Day ${targetDay.day_number} schedule.`,
      original_activity: originalItem.place_name,
      is_adapted: true,
      adaptation_reason: `Adapted due to forecasted rain (${weather.description || 'Monsoon Showers'})`,
      explanation: explanation
    };

    // Replace in itinerary
    targetDay.items[outdoorItemIndex] = updatedItem;
    targetDay.theme = `${targetDay.theme} (Weather-Adapted)`;
    store.saveItinerary(bookingId, itinerary);

    // Generate Proactive Notification Text
    const proactiveMessage = 
`🌧 **Weather update for tomorrow**

Rain and gusty sea winds are expected around **${guestArea}** tomorrow (${weather.rain_probability || 95}% rain risk), so I’ve proactively adjusted your outdoor plan.

**Instead of:**
• ${originalItem.place_name} (Outdoor beach / water sports)

**Try:**
• **${chosenAlternative.name}** (${chosenAlternative.approx_distance_area})
_${chosenAlternative.description}_

Your updated plan is ready in your concierge context. Let me know if you'd prefer another recommendation!`;

    // Dispatch to Telegram
    await telegramAdapter.sendMessage(booking.telegram_chat_id, proactiveMessage, {
      booking_id: bookingId,
      type: 'weather_alert'
    });

    // Record notification in store
    const notificationRecord = store.addNotification(bookingId, {
      type: 'WEATHER_ADAPTATION',
      title: 'Weather Update & Plan Adjusted',
      message: proactiveMessage,
      weather_condition: weather.condition,
      original_plan: originalItem.place_name,
      replacement_plan: chosenAlternative.name,
      day_number: targetDay.day_number,
      created_at: new Date().toISOString()
    });

    // Save in chat history for conversation memory
    store.addMessage(bookingId, {
      sender: 'concierge',
      message: proactiveMessage,
      type: 'proactive_notification'
    });

    console.log(`[AdaptationService] Successfully adapted Day ${targetDay.day_number} for booking ${bookingId}`);

    return {
      adapted: true,
      booking_id: bookingId,
      day_number: targetDay.day_number,
      weather,
      original_activity: originalItem.place_name,
      replacement_activity: chosenAlternative.name,
      explanation: explanation,
      notification: notificationRecord,
      proactive_message: proactiveMessage,
      updated_itinerary: itinerary
    };
  }
}

module.exports = new AdaptationService();
