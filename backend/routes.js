const express = require('express');
const router = express.Router();
const store = require('./store');
const placesService = require('./services/placesService');
const searchService = require('./services/searchService');
const locationService = require('./services/locationService');
const itineraryService = require('./services/itineraryService');
const conciergeService = require('./services/conciergeService');
const weatherService = require('./services/weatherService');
const adaptationService = require('./services/adaptationService');
const recommendationService = require('./services/recommendationService');
const notificationService = require('./services/notificationService');
const telegramAdapter = require('./services/telegramAdapter');

/**
 * System Status & Integration Health
 */
router.get('/status', async (req, res) => {
  try {
    const currentWeather = await weatherService.getCurrentWeather();
    res.json({
      app: 'Wayzyy AI Trip Concierge',
      version: '1.0.0',
      mode: {
        claude: conciergeService.getMode(),
        weather: weatherService.getMode(),
        telegram: telegramAdapter.getMode(),
        knowledge_base: 'CURATED_LOCAL_GOA'
      },
      integrations: {
        claude_configured: conciergeService.isLive(),
        weather_configured: weatherService.isLive(),
        telegram_configured: telegramAdapter.isLive(),
        curated_places_count: placesService.getAllPlaces().length,
        areas_count: placesService.getAllAreas().length
      },
      current_weather: currentWeather
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve system status' });
  }
});

/**
 * GET /api/places - Retrieve Curated Goa Places
 */
router.get('/places', (req, res) => {
  try {
    const { area, category, q } = req.query;
    let places = placesService.getAllPlaces();
    if (area) places = placesService.getPlacesByArea(area);
    if (category) places = placesService.getPlacesByCategory(category);
    if (q) places = placesService.search(q);
    res.json({ count: places.length, places });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve places' });
  }
});

/**
 * GET /api/places/search - Semantic multi-criteria search
 */
router.get('/places/search', (req, res) => {
  try {
    const { q, area, category, indoor_only, limit } = req.query;
    const booking = req.query.booking_id ? store.getBooking(req.query.booking_id) : null;
    const weather = store.getWeather();
    const results = searchService.query(q || '', booking, weather, parseInt(limit, 10) || 12);
    res.json({ count: results.length, results, places: results });
  } catch (err) {
    res.status(500).json({ error: 'Search failed' });
  }
});

/**
 * GET /api/places/nearby - Geospatial search
 */
router.get('/places/nearby', (req, res) => {
  try {
    const lat = parseFloat(req.query.lat) || 15.5178;
    const lng = parseFloat(req.query.lng) || 73.7634;
    const radius = parseFloat(req.query.radius) || 10;
    const type = req.query.type || null;

    const all = placesService.getAllPlaces();
    const nearby = locationService.findNearby(all, lat, lng, radius, { type });
    res.json({ count: nearby.length, radius_km: radius, places: nearby });
  } catch (err) {
    res.status(500).json({ error: 'Geospatial search failed' });
  }
});

/**
 * GET /api/places/:id - Single place lookup
 */
router.get('/places/:id', (req, res) => {
  const place = placesService.getPlaceById(req.params.id);
  if (!place) {
    return res.status(404).json({ error: 'Place not found' });
  }
  res.json(place);
});

/**
 * GET /api/areas - All registered Goa travel areas
 */
router.get('/areas', (req, res) => {
  res.json({ count: placesService.getAllAreas().length, areas: placesService.getAllAreas() });
});

/**
 * GET /api/areas/:id - Area details
 */
router.get('/areas/:id', (req, res) => {
  const area = placesService.getAreaById(req.params.id);
  if (!area) {
    return res.status(404).json({ error: 'Area not found' });
  }
  res.json(area);
});

/**
 * GET /api/recommendations - Personalized Recommendations
 */
router.get('/recommendations', (req, res) => {
  try {
    const { area, category, time_of_day, pace, indoor_only, limit } = req.query;
    const recommendations = recommendationService.getRecommendations({
      area: area || 'Candolim',
      category,
      timeOfDay: time_of_day || 'afternoon',
      pace: pace || 'relaxed',
      indoorOnly: indoor_only === 'true',
      limit: parseInt(limit, 10) || 6
    });
    res.json({ success: true, count: recommendations.length, recommendations });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

/**
 * POST /api/bookings - Ingest and process a booking
 */
router.post('/bookings', async (req, res) => {
  try {
    const payload = req.body;

    if (!payload.guest_name || typeof payload.guest_name !== 'string' || !payload.guest_name.trim()) {
      return res.status(400).json({ success: false, error: 'Missing or invalid guest_name' });
    }

    const property = payload.property || {};
    if (!property.name || !property.area) {
      return res.status(400).json({ success: false, error: 'Property name and area are required' });
    }

    const trip = payload.trip || {};
    if (!trip.check_in || !trip.check_out) {
      return res.status(400).json({ success: false, error: 'check_in and check_out dates are required' });
    }

    const inDate = new Date(trip.check_in);
    const outDate = new Date(trip.check_out);
    if (isNaN(inDate.getTime()) || isNaN(outDate.getTime())) {
      return res.status(400).json({ success: false, error: 'Invalid check_in or check_out date format' });
    }
    if (outDate <= inDate) {
      return res.status(400).json({ success: false, error: 'check_out date must be after check_in date' });
    }

    const guestCount = parseInt(trip.guest_count, 10);
    if (isNaN(guestCount) || guestCount < 1) {
      return res.status(400).json({ success: false, error: 'guest_count must be a positive integer' });
    }

    const diffTime = Math.abs(outDate - inDate);
    const calculatedNights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    trip.nights = calculatedNights || 4;

    const bookingContext = {
      booking_id: payload.booking_id || `BK-WAYZ-${Math.floor(1000 + Math.random() * 9000)}`,
      guest_id: payload.guest_id || `GST-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      guest_name: payload.guest_name.trim(),
      telegram_chat_id: payload.telegram_chat_id || '987654321',
      property: {
        name: property.name.trim(),
        area: property.area.trim()
      },
      trip: {
        destination: trip.destination || 'Goa',
        check_in: trip.check_in,
        check_out: trip.check_out,
        nights: trip.nights,
        guest_count: guestCount
      },
      preferences: payload.preferences || {
        vibe: ['beach', 'food', 'nightlife', 'relaxed'],
        activity_level: 'moderate',
        pace: 'relaxed'
      }
    };

    const savedBooking = store.createBooking(bookingContext);
    const itinerary = itineraryService.generateItinerary(savedBooking);
    store.saveItinerary(savedBooking.booking_id, itinerary);

    const welcomeMsg = 
`🌴 **Welcome to Wayzyy, ${savedBooking.guest_name}!**

Your stay at **${savedBooking.property.name}** in **${savedBooking.property.area}** is confirmed for **${savedBooking.trip.nights} nights** (${savedBooking.trip.check_in} to ${savedBooking.trip.check_out}).

I’ve prepared your personalized Goa itinerary! You can ask me anytime for recommendations, area tips, or plan adjustments throughout your stay.`;

    store.addMessage(savedBooking.booking_id, {
      sender: 'concierge',
      message: welcomeMsg,
      type: 'welcome'
    });

    await telegramAdapter.sendMessage(savedBooking.telegram_chat_id, welcomeMsg, {
      booking_id: savedBooking.booking_id,
      type: 'itinerary_welcome'
    });

    store.addNotification(savedBooking.booking_id, {
      type: 'BOOKING_CONFIRMATION',
      title: 'Booking Confirmed & Concierge Ready',
      message: `Your reservation at ${savedBooking.property.name} is confirmed. Your 4-day itinerary has been personalized.`,
      created_at: new Date().toISOString()
    });

    res.status(201).json({
      success: true,
      message: 'Booking confirmed and AI Concierge activated',
      booking: savedBooking,
      itinerary: itinerary
    });
  } catch (err) {
    console.error('[Routes] Error processing booking:', err);
    res.status(500).json({ success: false, error: 'Internal server error while processing booking' });
  }
});

/**
 * GET /api/bookings/:id - Retrieve booking details with session isolation
 */
router.get('/bookings/:id', (req, res) => {
  const bookingId = req.params.id;
  const booking = store.getBooking(bookingId);

  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  const requestingGuestId = req.headers['x-guest-id'] || req.query.guest_id;
  if (requestingGuestId && requestingGuestId !== booking.guest_id) {
    return res.status(403).json({ error: 'Access denied: cannot access another guest booking' });
  }

  const itinerary = store.getItinerary(bookingId);
  const conversation = store.getConversation(bookingId);
  const notifications = store.getNotifications(bookingId);

  res.json({ booking, itinerary, conversation, notifications });
});

/**
 * GET /api/itineraries/:bookingId - Direct Itinerary Retrieval
 */
router.get('/itineraries/:bookingId', (req, res) => {
  const { bookingId } = req.params;
  const itinerary = store.getItinerary(bookingId);
  if (!itinerary) {
    return res.status(404).json({ error: `Itinerary for booking ${bookingId} not found` });
  }
  res.json({ success: true, itinerary });
});

/**
 * POST /api/itineraries/:bookingId/adapt - Adapt Itinerary for Weather
 */
router.post('/itineraries/:bookingId/adapt', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { day_number = 2 } = req.body;
    const result = await adaptationService.evaluateAndAdapt(bookingId, day_number);
    res.json(result);
  } catch (err) {
    console.error('[Routes] Error adapting itinerary:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/adapt - Manually trigger weather adaptation (Preserved contract)
 */
router.post('/adapt', async (req, res) => {
  try {
    const { booking_id, day_number = 2 } = req.body;
    if (!booking_id) {
      return res.status(400).json({ error: 'booking_id is required' });
    }
    const result = await adaptationService.evaluateAndAdapt(booking_id, day_number);
    res.json(result);
  } catch (err) {
    console.error('[Routes] Error adapting itinerary:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/concierge/chat - Guest interaction endpoint
 */
router.post('/concierge/chat', async (req, res) => {
  try {
    const { booking_id, message, sender = 'guest' } = req.body;

    if (!booking_id) {
      return res.status(400).json({ error: 'booking_id is required' });
    }
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'message string is required' });
    }

    const booking = store.getBooking(booking_id);
    if (!booking) {
      return res.status(404).json({ error: 'Active booking not found for this session' });
    }

    store.addMessage(booking_id, {
      sender: 'guest',
      message: message.trim(),
      type: 'user_query'
    });

    const conversationHistory = store.getConversation(booking_id);
    const itinerary = store.getItinerary(booking_id);

    const aiResult = await conciergeService.generateResponse(
      message.trim(),
      booking,
      conversationHistory,
      itinerary
    );

    const savedReply = store.addMessage(booking_id, {
      sender: 'concierge',
      message: aiResult.reply,
      type: 'concierge_reply',
      grounded_places: aiResult.grounded_places || [],
      suggested_actions: aiResult.suggested_actions || []
    });

    await telegramAdapter.sendMessage(booking.telegram_chat_id, aiResult.reply, {
      booking_id,
      type: 'chat_response'
    });

    res.json({
      success: true,
      reply: aiResult.reply,
      message_record: savedReply,
      grounded_places: aiResult.grounded_places || [],
      suggested_actions: aiResult.suggested_actions || []
    });
  } catch (err) {
    console.error('[Routes] Error in concierge chat:', err);
    res.status(500).json({ error: 'Error processing concierge conversation' });
  }
});

/**
 * POST /api/concierge/action - Execute Conversational Actions
 */
router.post('/concierge/action', async (req, res) => {
  try {
    const { booking_id, action, params = {} } = req.body;
    if (!booking_id || !action) {
      return res.status(400).json({ error: 'booking_id and action are required' });
    }

    const result = await conciergeService.executeAction(action, params, booking_id);
    res.json(result);
  } catch (err) {
    console.error('[Routes] Error executing concierge action:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/weather & POST /api/weather/check
 */
router.get('/weather', async (req, res) => {
  try {
    const weather = await weatherService.getCurrentWeather();
    res.json(weather);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve weather' });
  }
});

router.post('/weather/check', async (req, res) => {
  try {
    const weather = await weatherService.getCurrentWeather();
    res.json({ success: true, weather });
  } catch (err) {
    res.status(500).json({ error: 'Failed to check weather' });
  }
});

/**
 * POST /api/weather/refresh - Refresh weather provider
 */
router.post('/weather/refresh', async (req, res) => {
  try {
    const lat = parseFloat(req.body.lat) || 15.5178;
    const lon = parseFloat(req.body.lon) || 73.7634;
    const weather = await weatherService.getCurrentWeather(lat, lon);
    res.json({ success: true, weather });
  } catch (err) {
    res.status(500).json({ error: 'Failed to refresh weather' });
  }
});

/**
 * GET /api/weather/forecast/:bookingId - Weather Forecast & Conflict Analysis
 */
router.get('/weather/forecast/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = store.getBooking(bookingId);
    const area = booking?.property?.area || 'Candolim, Goa';

    const current = await weatherService.getCurrentWeather(15.5178, 73.7634, area);
    const hourly = await weatherService.getHourlyForecast(area);
    const daily = await weatherService.getDailyForecast(area);

    const itinerary = store.getItinerary(bookingId);
    const conflicts = weatherService.detectWeatherRisk(itinerary, current);

    res.json({
      success: true,
      current,
      hourly,
      daily,
      conflicts,
      has_conflict: conflicts.length > 0
    });
  } catch (err) {
    console.error('[Routes] Error retrieving weather forecast:', err);
    res.status(500).json({ error: 'Failed to retrieve forecast' });
  }
});

/**
 * POST /api/weather/simulate - Simulate Weather Scenario
 */
router.post('/weather/simulate', async (req, res) => {
  try {
    const { scenario = 'rain', booking_id = null } = req.body;
    const simulated = weatherService.simulateCondition(scenario);

    let adaptationResult = null;
    if (booking_id && (scenario === 'rain' || scenario === 'heavy_rain' || scenario === 'storm')) {
      adaptationResult = await adaptationService.evaluateAndAdapt(booking_id, 2, simulated);
    }

    res.json({
      success: true,
      weather: simulated,
      adaptation: adaptationResult
    });
  } catch (err) {
    console.error('[Routes] Error simulating weather:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/notifications/:bookingId - Retrieve Notifications Feed
 */
router.get('/notifications/:bookingId', (req, res) => {
  try {
    const { bookingId } = req.params;
    const notifications = notificationService.getNotifications(bookingId);
    res.json({ success: true, count: notifications.length, notifications });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve notifications' });
  }
});

/**
 * GET /api/tutorial - Onboarding Tutorial Content
 */
router.get('/tutorial', (req, res) => {
  res.json({
    title: "Welcome to WAYZYY",
    subtitle: "Your intelligent travel concierge that stays with you before and during your trip."
  });
});

module.exports = router;
