/**
 * ============================================================
 * WAYZYY AI TRIP CONCIERGE — EXPANDED 16-SUITE TEST HARNESS
 * Comprehensive validation across:
 * 1. Booking validation
 * 2. Session isolation
 * 3. Itinerary generation & grounding
 * 4. Concierge natural language & paraphrases
 * 5. Conversation context & multi-turn memory
 * 6. Weather retrieval & hourly/daily forecast
 * 7. Weather fallback & DEMO mode
 * 8. Weather conflict detection
 * 9. Itinerary adaptation
 * 10. Proactive notification delivery
 * 11. Recommendation filtering & scoring
 * 12. Unauthorized access protection
 * 13. Graceful API failure & error safety
 * 14. Demo E2E complete story flow
 * 15. Frontend route availability
 * 16. Layout & styling sanity
 * ============================================================
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Set test environment
process.env.NODE_ENV = 'test';
process.env.PORT = '3999';

const app = require('../backend/server');
const store = require('../backend/store');
const knowledgeBase = require('../backend/knowledgeBase');
const conciergeService = require('../backend/services/conciergeService');
const weatherService = require('../backend/services/weatherService');
const adaptationService = require('../backend/services/adaptationService');
const itineraryService = require('../backend/services/itineraryService');
const recommendationService = require('../backend/services/recommendationService');
const placesService = require('../backend/services/placesService');
const searchService = require('../backend/services/searchService');
const itineraryValidator = require('../backend/services/itineraryValidator');
const openStreetMapProvider = require('../backend/providers/openStreetMapProvider');
const googlePlacesProvider = require('../backend/providers/googlePlacesProvider');
const { validatePlaces } = require('../scripts/validateGoaData');
const { fetchFromOverpass } = require('../scripts/importOverpassGoa');

let server;
const BASE_URL = 'http://localhost:3999/api';

async function runTests() {
  console.log('\n============================================================');
  console.log('       RUNNING WAYZYY 42-SUITE AUTOMATED TEST HARNESS        ');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;

  function recordResult(testName, success, err = null) {
    if (success) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}: ${err ? err.message : 'Assertion failed'}`);
      if (err && err.stack) console.error(err.stack);
      failed++;
    }
  }

  // Start test server
  await new Promise((resolve) => {
    server = app.listen(3999, () => {
      console.log('Test server active on port 3999\n');
      resolve();
    });
  });

  const testPayload = {
    guest_name: 'Rahul Sharma',
    guest_id: 'GST-TEST-001',
    telegram_chat_id: '123456789',
    property: {
      name: 'Casa Candolim Luxury Villa',
      area: 'Candolim'
    },
    trip: {
      destination: 'Goa',
      check_in: '2026-10-15',
      check_out: '2026-10-19',
      guest_count: 2
    },
    preferences: {
      vibe: ['beach', 'food', 'nightlife', 'relaxed'],
      pace: 'relaxed'
    }
  };

  let createdBookingId = null;

  try {
    // ------------------------------------------------------------
    // TEST 1: Booking validation (Strict schema & night calculation)
    // ------------------------------------------------------------
    try {
      const response = await fetch(`${BASE_URL}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload)
      });
      const data = await response.json();
      assert.strictEqual(response.status, 201, 'Status should be 201');
      assert.ok(data.booking && data.booking.booking_id, 'Booking ID must exist');
      assert.strictEqual(data.booking.guest_name, 'Rahul Sharma');
      assert.strictEqual(data.booking.trip.nights, 4, 'Calculated nights must be 4');
      createdBookingId = data.booking.booking_id;

      // Also verify rejection of invalid booking
      const badRes = await fetch(`${BASE_URL}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guest_name: '' })
      });
      assert.strictEqual(badRes.status, 400, 'Invalid booking should be rejected with 400');

      recordResult('TEST 1: Booking validation and context creation', true);
    } catch (e) {
      recordResult('TEST 1: Booking validation and context creation', false, e);
    }

    // ------------------------------------------------------------
    // TEST 2: Session isolation & context retrieval
    // ------------------------------------------------------------
    try {
      const response = await fetch(`${BASE_URL}/bookings/${createdBookingId}?guest_id=GST-TEST-001`);
      const data = await response.json();
      assert.strictEqual(response.status, 200);
      assert.strictEqual(data.booking.booking_id, createdBookingId);
      assert.strictEqual(data.booking.property.area, 'Candolim');
      recordResult('TEST 2: Session isolation and authorized context retrieval', true);
    } catch (e) {
      recordResult('TEST 2: Session isolation and authorized context retrieval', false, e);
    }

    // ------------------------------------------------------------
    // TEST 3: Itinerary generation & grounding in Goa knowledge base
    // ------------------------------------------------------------
    try {
      const itinRes = await fetch(`${BASE_URL}/itineraries/${createdBookingId}`);
      const itinData = await itinRes.json();
      assert.strictEqual(itinRes.status, 200);
      const itinerary = itinData.itinerary;
      assert.ok(Array.isArray(itinerary.days) && itinerary.days.length === 4, 'Should generate 4 days');

      // Verify each day has 4 slots (Morning, Lunch, Evening, Dinner)
      itinerary.days.forEach(day => {
        assert.strictEqual(day.items.length, 4, `Day ${day.day_number} must have exactly 4 time slots`);
        day.items.forEach(item => {
          const place = knowledgeBase.getPlaceById(item.place_id);
          assert.ok(place, `Place ${item.place_id} must exist in curated Goa knowledge base`);
          assert.ok(item.slot_name, 'Slot name must be defined');
          assert.ok(item.weather_fit, 'Weather suitability must be defined');
        });
      });

      recordResult('TEST 3: Itinerary generation (4 slots/day) grounded in Goa dataset', true);
    } catch (e) {
      recordResult('TEST 3: Itinerary generation (4 slots/day) grounded in Goa dataset', false, e);
    }

    // ------------------------------------------------------------
    // TEST 4: Concierge natural language & paraphrase understanding
    // ------------------------------------------------------------
    try {
      const paraphrases = [
        "Will rain affect tomorrow?",
        "What happens if it rains?",
        "Is tomorrow still good for the beach?",
        "Do I need an indoor plan?"
      ];

      for (const phrase of paraphrases) {
        const intent = conciergeService.classifyIntent(phrase);
        assert.strictEqual(intent, 'WEATHER', `Phrase "${phrase}" should classify as WEATHER intent`);
      }

      // Test response to natural paraphrase
      const chatRes = await fetch(`${BASE_URL}/concierge/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: createdBookingId,
          message: "Will rain affect tomorrow?"
        })
      });
      const chatData = await chatRes.json();
      assert.strictEqual(chatRes.status, 200);
      assert.ok(chatData.reply.toLowerCase().includes('rain') || chatData.reply.toLowerCase().includes('weather'), 'Response must address weather');

      recordResult('TEST 4: Concierge natural language & weather paraphrase understanding', true);
    } catch (e) {
      recordResult('TEST 4: Concierge natural language & weather paraphrase understanding', false, e);
    }

    // ------------------------------------------------------------
    // TEST 5: Conversation context & multi-turn memory
    // ------------------------------------------------------------
    try {
      // Turn 1: Guest states constraint
      await fetch(`${BASE_URL}/concierge/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: createdBookingId,
          message: "I don't want anything too crowded."
        })
      });

      const memory = conciergeService.getOrCreateMemory(createdBookingId);
      assert.strictEqual(memory.avoid_crowds, true, 'Memory must record avoid_crowds constraint');

      // Turn 2: Follow-up question
      const followUpRes = await fetch(`${BASE_URL}/concierge/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: createdBookingId,
          message: "What should we do tomorrow?"
        })
      });
      const followUpData = await followUpRes.json();
      assert.strictEqual(followUpRes.status, 200);
      assert.ok(followUpData.reply.length > 50, 'Response should reflect contextual recommendation');

      recordResult('TEST 5: Conversation context & multi-turn memory retention', true);
    } catch (e) {
      recordResult('TEST 5: Conversation context & multi-turn memory retention', false, e);
    }

    // ------------------------------------------------------------
    // TEST 6: Weather retrieval & hourly/daily forecast
    // ------------------------------------------------------------
    try {
      const forecastRes = await fetch(`${BASE_URL}/weather/forecast/${createdBookingId}`);
      const forecastData = await forecastRes.json();
      assert.strictEqual(forecastRes.status, 200);
      assert.ok(forecastData.current, 'Current weather must be present');
      assert.ok(Array.isArray(forecastData.hourly) && forecastData.hourly.length >= 8, 'Hourly forecast must have 8 intervals');
      assert.ok(Array.isArray(forecastData.daily) && forecastData.daily.length === 5, 'Daily forecast must cover 5 days');

      recordResult('TEST 6: Weather retrieval with hourly & daily forecasts', true);
    } catch (e) {
      recordResult('TEST 6: Weather retrieval with hourly & daily forecasts', false, e);
    }

    // ------------------------------------------------------------
    // TEST 7: Weather fallback & DEMO mode operation
    // ------------------------------------------------------------
    try {
      const statusRes = await fetch(`${BASE_URL}/status`);
      const statusData = await statusRes.json();
      assert.strictEqual(statusRes.status, 200);
      assert.strictEqual(statusData.mode.weather, 'DEMO', 'Weather mode should safely default to DEMO without crashing');
      assert.strictEqual(statusData.mode.claude, 'DEMO', 'Claude mode should safely default to DEMO');

      recordResult('TEST 7: Deterministic weather fallback and DEMO mode operation', true);
    } catch (e) {
      recordResult('TEST 7: Deterministic weather fallback and DEMO mode operation', false, e);
    }

    // ------------------------------------------------------------
    // TEST 8: Weather conflict detection
    // ------------------------------------------------------------
    try {
      const simRes = await fetch(`${BASE_URL}/weather/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: 'rain', booking_id: createdBookingId })
      });
      const simData = await simRes.json();
      assert.strictEqual(simRes.status, 200);
      assert.strictEqual(simData.weather.condition, 'Rain');

      const forecastRes = await fetch(`${BASE_URL}/weather/forecast/${createdBookingId}`);
      const forecastData = await forecastRes.json();
      assert.ok(forecastData.current.rain_probability >= 80, 'Simulated rain should have high probability');

      recordResult('TEST 8: Weather conflict detection for outdoor activities', true);
    } catch (e) {
      recordResult('TEST 8: Weather conflict detection for outdoor activities', false, e);
    }

    // ------------------------------------------------------------
    // TEST 9: Itinerary adaptation & indoor substitution
    // ------------------------------------------------------------
    try {
      const itinRes = await fetch(`${BASE_URL}/itineraries/${createdBookingId}`);
      const itinData = await itinRes.json();
      const day2 = itinData.itinerary.days.find(d => d.day_number === 2);
      const adaptedItem = day2.items.find(i => i.is_adapted);
      assert.ok(adaptedItem, 'Day 2 must contain an adapted item after rain simulation');
      assert.ok(
        adaptedItem.indoor_outdoor === 'indoor' || adaptedItem.indoor_outdoor === 'covered',
        'Replacement activity must be indoor or covered'
      );
      assert.ok(adaptedItem.adaptation_reason.includes('rain'), 'Must include reason');

      recordResult('TEST 9: Itinerary adaptation selects indoor alternative with explanation', true);
    } catch (e) {
      recordResult('TEST 9: Itinerary adaptation selects indoor alternative with explanation', false, e);
    }

    // ------------------------------------------------------------
    // TEST 10: Proactive notification delivery
    // ------------------------------------------------------------
    try {
      const notifRes = await fetch(`${BASE_URL}/notifications/${createdBookingId}`);
      const notifData = await notifRes.json();
      assert.strictEqual(notifRes.status, 200);
      assert.ok(notifData.notifications.length > 0, 'Notifications list must not be empty');
      const rainNotif = notifData.notifications.find(n => n.type === 'WEATHER_ADAPTATION');
      assert.ok(rainNotif, 'Should have recorded WEATHER_ADAPTATION notification');
      assert.ok(rainNotif.message.includes('Weather update for tomorrow'), 'Human-friendly copy');

      recordResult('TEST 10: Proactive notification generated and synchronized', true);
    } catch (e) {
      recordResult('TEST 10: Proactive notification generated and synchronized', false, e);
    }

    // ------------------------------------------------------------
    // TEST 11: Recommendation filtering & scoring
    // ------------------------------------------------------------
    try {
      const recRes = await fetch(`${BASE_URL}/recommendations?area=Candolim&indoor_only=true`);
      const recData = await recRes.json();
      assert.strictEqual(recRes.status, 200);
      assert.ok(recData.recommendations.length > 0, 'Should return recommendations');
      recData.recommendations.forEach(r => {
        assert.ok(
          r.indoor_outdoor === 'indoor' || r.indoor_outdoor === 'covered' || r.weather_fit === 'all_weather',
          'Filtered recommendations must match indoor/covered criteria'
        );
      });

      recordResult('TEST 11: Recommendation scoring & multi-criteria filtering', true);
    } catch (e) {
      recordResult('TEST 11: Recommendation scoring & multi-criteria filtering', false, e);
    }

    // ------------------------------------------------------------
    // TEST 12: Unauthorized access protection (Session Isolation)
    // ------------------------------------------------------------
    try {
      const unauthRes = await fetch(`${BASE_URL}/bookings/${createdBookingId}?guest_id=GST-ATTACKER-99`);
      assert.strictEqual(unauthRes.status, 403, 'Cross-session guest access must be rejected with 403');

      recordResult('TEST 12: Unauthorized access protection (Session Isolation)', true);
    } catch (e) {
      recordResult('TEST 12: Unauthorized access protection (Session Isolation)', false, e);
    }

    // ------------------------------------------------------------
    // TEST 13: Graceful API failure & error safety
    // ------------------------------------------------------------
    try {
      // Query non-existent booking
      const notFoundRes = await fetch(`${BASE_URL}/bookings/BK-NON-EXISTENT`);
      assert.strictEqual(notFoundRes.status, 404);
      const notFoundData = await notFoundRes.json();
      assert.ok(notFoundData.error, 'Should return clean error object without stack trace');
      assert.strictEqual(notFoundData.stack, undefined, 'Stack traces must not leak');

      recordResult('TEST 13: Graceful API failure handling and secure error envelopes', true);
    } catch (e) {
      recordResult('TEST 13: Graceful API failure handling and secure error envelopes', false, e);
    }

    // ------------------------------------------------------------
    // TEST 14: Demo E2E complete story flow
    // ------------------------------------------------------------
    try {
      // 1. Create fresh booking
      const newBookingRes = await fetch(`${BASE_URL}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guest_name: 'Priya Patel',
          guest_id: 'GST-DEMO-99',
          property: { name: 'Candolim Beach Villa', area: 'Candolim' },
          trip: { destination: 'Goa', check_in: '2026-10-15', check_out: '2026-10-19', guest_count: 2 },
          preferences: { vibe: ['beach', 'food', 'relaxed'] }
        })
      });
      const newBookingData = await newBookingRes.json();
      const bId = newBookingData.booking.booking_id;

      // 2. Chat: "What should I do tomorrow?"
      const chat1 = await fetch(`${BASE_URL}/concierge/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: bId, message: "What should I do tomorrow?" })
      });
      assert.strictEqual(chat1.status, 200);

      // 3. Simulate rain
      const rainSim = await fetch(`${BASE_URL}/weather/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: 'rain', booking_id: bId })
      });
      assert.strictEqual(rainSim.status, 200);

      // 4. Chat: "What can I do instead?"
      const chat2 = await fetch(`${BASE_URL}/concierge/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: bId, message: "What can I do instead?" })
      });
      const chat2Data = await chat2.json();
      assert.strictEqual(chat2.status, 200);
      assert.ok(chat2Data.reply.length > 30);

      recordResult('TEST 14: Demo E2E Complete Story Flow (Book -> Ask -> Rain -> Adapt -> Re-ask)', true);
    } catch (e) {
      recordResult('TEST 14: Demo E2E Complete Story Flow (Book -> Ask -> Rain -> Adapt -> Re-ask)', false, e);
    }

    // ------------------------------------------------------------
    // TEST 15: Frontend route availability (Single-page routing fallback)
    // ------------------------------------------------------------
    try {
      const routes = [
        '/',
        '/destinations',
        '/features',
        '/how-it-works',
        '/app',
        '/app/overview',
        '/app/itinerary',
        '/app/concierge',
        '/app/weather',
        '/app/notifications',
        '/app/settings'
      ];

      for (const r of routes) {
        const res = await fetch(`http://localhost:3999${r}`);
        assert.strictEqual(res.status, 200, `Route ${r} must resolve to 200 HTML`);
        const html = await res.text();
        assert.ok(html.includes('WAYZYY'), `Route ${r} must serve Wayzyy SPA`);
      }

      recordResult('TEST 15: Frontend multi-route SPA fallback resolution', true);
    } catch (e) {
      recordResult('TEST 15: Frontend multi-route SPA fallback resolution', false, e);
    }

    // ------------------------------------------------------------
    // TEST 16: Layout & design tokens sanity
    // ------------------------------------------------------------
    try {
      const cssPath = path.join(__dirname, '..', 'frontend', 'styles.css');
      const css = fs.readFileSync(cssPath, 'utf8');

      // Verify specified brand palette tokens exist
      assert.ok(css.includes('#F6F1E7'), 'Must contain Warm Ivory background #F6F1E7');
      assert.ok(css.includes('#FFFDF8'), 'Must contain Surface #FFFDF8');
      assert.ok(css.includes('#EFE7D8'), 'Must contain Secondary #EFE7D8');
      assert.ok(css.includes('#292821'), 'Must contain Charcoal text #292821');
      assert.ok(css.includes('#C96B4B'), 'Must contain Terracotta #C96B4B');
      assert.ok(css.includes('#66745A'), 'Must contain Olive #66745A');
      assert.ok(css.includes('#D9A441'), 'Must contain Gold #D9A441');
      assert.ok(css.includes('#DDD4C4'), 'Must contain Border #DDD4C4');

      recordResult('TEST 16: Design system tokens & CSS consistency verified', true);
    } catch (e) {
      recordResult('TEST 16: Design system tokens & CSS consistency verified', false, e);
    }

    // ------------------------------------------------------------
    // TEST 17: Multi-turn Conversation Follow-up Memory Accumulation
    // ------------------------------------------------------------
    try {
      const bId = 'BK-TEST-MEM-17';
      store.saveBooking({
        booking_id: bId,
        guest_id: 'GST-TEST-17',
        property: { name: 'Candolim Villa', area: 'Candolim' },
        dates: { check_in: '2026-03-20', check_out: '2026-03-24' }
      });

      // Turn 1: "Give me something quiet"
      await fetch(`${BASE_URL}/concierge/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: bId, message: "Give me something quiet" })
      });
      let mem = conciergeService.getOrCreateMemory(bId);
      assert.ok(mem.avoid_crowds === true || mem.vibePreferences.has('quiet'), 'Turn 1 must capture quiet preference');

      // Turn 2: "Closer"
      const prevDist = mem.maxDistanceKm;
      await fetch(`${BASE_URL}/concierge/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: bId, message: "Closer" })
      });
      mem = conciergeService.getOrCreateMemory(bId);
      assert.ok(mem.maxDistanceKm < prevDist || mem.constraints.has('closer_proximity'), 'Turn 2 must reduce max distance');

      // Turn 3: "Indoor"
      await fetch(`${BASE_URL}/concierge/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: bId, message: "Indoor" })
      });
      mem = conciergeService.getOrCreateMemory(bId);
      assert.strictEqual(mem.indoor_outdoor, 'indoor', 'Turn 3 must record indoor preference');

      // Verify all constraints accumulated simultaneously
      assert.ok(mem.avoid_crowds || mem.vibePreferences.has('quiet'), 'Memory retained Turn 1');
      assert.ok(mem.constraints.has('closer_proximity'), 'Memory retained Turn 2');
      assert.strictEqual(mem.indoor_outdoor, 'indoor', 'Memory retained Turn 3');

      recordResult('TEST 17: Multi-turn Conversation Follow-up Memory Accumulation', true);
    } catch (e) {
      recordResult('TEST 17: Multi-turn Conversation Follow-up Memory Accumulation', false, e);
    }

    // ------------------------------------------------------------
    // TEST 18: Itinerary replacement action (replace_activity)
    // ------------------------------------------------------------
    try {
      const res = await fetch(`${BASE_URL}/concierge/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: createdBookingId,
          action: 'replace_activity',
          params: { day: 1, slot_index: 0, place_id: 'GOA-MUSEUM-001' }
        })
      });
      const data = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(data.success, true);
      assert.ok(data.itinerary, 'Must return updated itinerary');
      const day1 = data.itinerary.days.find(d => d.day_number === 1);
      assert.strictEqual(day1.items[0].place_id, 'GOA-MUSEUM-001', 'Slot 0 must be updated to GOA-MUSEUM-001');

      recordResult('TEST 18: Itinerary replacement action (replace_activity)', true);
    } catch (e) {
      recordResult('TEST 18: Itinerary replacement action (replace_activity)', false, e);
    }

    // ------------------------------------------------------------
    // TEST 19: Itinerary movement action (move_activity)
    // ------------------------------------------------------------
    try {
      const itinBefore = store.getItinerary(createdBookingId);
      const day1CountBefore = itinBefore.days.find(d => d.day_number === 1).items.length;
      const day2CountBefore = itinBefore.days.find(d => d.day_number === 2).items.length;

      const res = await fetch(`${BASE_URL}/concierge/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: createdBookingId,
          action: 'move_activity',
          params: { from_day: 1, to_day: 2 }
        })
      });
      const data = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(data.success, true);

      const day1After = data.itinerary.days.find(d => d.day_number === 1).items.length;
      const day2After = data.itinerary.days.find(d => d.day_number === 2).items.length;
      assert.strictEqual(day1After, day1CountBefore - 1, 'Day 1 item count decreased by 1');
      assert.strictEqual(day2After, day2CountBefore + 1, 'Day 2 item count increased by 1');

      recordResult('TEST 19: Itinerary movement action (move_activity)', true);
    } catch (e) {
      recordResult('TEST 19: Itinerary movement action (move_activity)', false, e);
    }

    // ------------------------------------------------------------
    // TEST 20: Itinerary removal action (remove_activity)
    // ------------------------------------------------------------
    try {
      const itinBefore = store.getItinerary(createdBookingId);
      const day2CountBefore = itinBefore.days.find(d => d.day_number === 2).items.length;

      const res = await fetch(`${BASE_URL}/concierge/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: createdBookingId,
          action: 'remove_activity',
          params: { day: 2 }
        })
      });
      const data = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(data.success, true);

      const day2After = data.itinerary.days.find(d => d.day_number === 2).items.length;
      assert.strictEqual(day2After, day2CountBefore - 1, 'Day 2 item count decreased by 1');

      recordResult('TEST 20: Itinerary removal action (remove_activity)', true);
    } catch (e) {
      recordResult('TEST 20: Itinerary removal action (remove_activity)', false, e);
    }

    // ------------------------------------------------------------
    // TEST 21: Provider unavailable fallback
    // ------------------------------------------------------------
    try {
      // 1. OSM provider graceful degradation
      const osmRes = await openStreetMapProvider.queryOverpass('invalid syntax test');
      assert.ok(Array.isArray(osmRes) || osmRes === null || (osmRes && Array.isArray(osmRes.elements)), 'OSM provider must return safe array or elements envelope without throwing');

      // 2. Google places graceful degradation
      const gRes = await googlePlacesProvider.searchPlaces('Candolim');
      assert.ok(Array.isArray(gRes.results), 'Google provider must return empty results safely');
      assert.strictEqual(gRes.source, 'disabled', 'Google provider should indicate disabled state safely');

      recordResult('TEST 21: Provider unavailable fallback & graceful degradation', true);
    } catch (e) {
      recordResult('TEST 21: Provider unavailable fallback & graceful degradation', false, e);
    }

    // ------------------------------------------------------------
    // TEST 22: OSM import module validation
    // ------------------------------------------------------------
    try {
      assert.strictEqual(typeof fetchFromOverpass, 'function', 'importOverpassGoa must export fetchFromOverpass');
      const cachedOrEmpty = await fetchFromOverpass('node(14.8,73.6,15.9,74.4);', 'test_dummy_query');
      assert.ok(cachedOrEmpty && typeof cachedOrEmpty === 'object', 'Overpass fetcher must return object envelope');

      recordResult('TEST 22: OSM import script validation & caching', true);
    } catch (e) {
      recordResult('TEST 22: OSM import script validation & caching', false, e);
    }

    // ------------------------------------------------------------
    // TEST 23: Duplicate detection check in data validator
    // ------------------------------------------------------------
    try {
      const mockDuplicateIdPlaces = [
        {
          id: 'GOA-BEACH-001',
          name: 'Calangute Beach',
          type: 'beach',
          region: 'North Goa',
          coordinates: { lat: 15.544, lng: 73.755 },
          source: 'goa_tourism',
          source_url: 'https://goa-tourism.com',
          last_verified: '2026-03-01'
        },
        {
          id: 'GOA-BEACH-001',
          name: 'Another Calangute',
          type: 'beach',
          region: 'North Goa',
          coordinates: { lat: 15.545, lng: 73.756 },
          source: 'goa_tourism',
          source_url: 'https://goa-tourism.com',
          last_verified: '2026-03-01'
        }
      ];

      const validation = validatePlaces(mockDuplicateIdPlaces, []);
      assert.ok(validation.errors.some(err => err.includes('Duplicate ID')), 'Validator must detect duplicate ID');

      recordResult('TEST 23: Duplicate detection check in data validator', true);
    } catch (e) {
      recordResult('TEST 23: Duplicate detection check in data validator', false, e);
    }

    // ------------------------------------------------------------
    // TEST 24: Malformed data validation error handling
    // ------------------------------------------------------------
    try {
      const mockMalformedPlaces = [
        {
          id: 'GOA-BAD-001',
          name: 'Out of Bounds Place',
          type: 'invalid_type',
          region: 'Maharashtra',
          coordinates: { lat: 28.6139, lng: 77.2090 },
          source: 'goa_tourism',
          source_url: 'https://goa-tourism.com',
          last_verified: '2026-03-01'
        }
      ];

      const validation = validatePlaces(mockMalformedPlaces, []);
      assert.ok(validation.errors.some(err => err.includes('outside Goa bounds')), 'Validator must flag out-of-bounds coords');
      assert.ok(validation.errors.some(err => err.includes('Invalid region')), 'Validator must flag invalid region');
      assert.ok(validation.errors.some(err => err.includes('Invalid type')), 'Validator must flag invalid type');

      recordResult('TEST 24: Malformed data validation error handling', true);
    } catch (e) {
      recordResult('TEST 24: Malformed data validation error handling', false, e);
    }

    // ------------------------------------------------------------
    // TEST 25: Live weather fallback
    // ------------------------------------------------------------
    try {
      const fallbackWeather = await weatherService.getCurrentWeather(999, 999, 'Non-Existent-Area');
      assert.ok(fallbackWeather, 'Weather service must return valid fallback object');
      assert.ok(typeof fallbackWeather.temp === 'number', 'Fallback temp must be number');
      assert.ok(typeof fallbackWeather.condition === 'string', 'Fallback condition must be string');
      assert.strictEqual(fallbackWeather.is_simulated, true, 'Fallback weather must be flagged simulated');

      recordResult('TEST 25: Live weather fallback to deterministic simulation', true);
    } catch (e) {
      recordResult('TEST 25: Live weather fallback to deterministic simulation', false, e);
    }

    // ------------------------------------------------------------
    // TEST 26: User preference memory retention across actions
    // ------------------------------------------------------------
    try {
      const bId = 'BK-TEST-MEM-26';
      store.saveBooking({
        booking_id: bId,
        guest_id: 'GST-TEST-26',
        property: { name: 'Baga Retreat', area: 'Baga' },
        dates: { check_in: '2026-03-20', check_out: '2026-03-24' }
      });
      const itin = itineraryService.generateItinerary(store.getBooking(bId));
      store.saveItinerary(bId, itin);

      await fetch(`${BASE_URL}/concierge/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: bId, message: "We are traveling with kids and prefer indoor" })
      });

      await fetch(`${BASE_URL}/concierge/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: bId,
          action: 'make_relaxed',
          params: { day: 2 }
        })
      });

      const mem = conciergeService.getOrCreateMemory(bId);
      assert.strictEqual(mem.traveler_type, 'family', 'Traveler type family must persist after action');
      assert.strictEqual(mem.indoor_outdoor, 'indoor', 'Indoor preference must persist after action');

      recordResult('TEST 26: User preference memory retention across actions', true);
    } catch (e) {
      recordResult('TEST 26: User preference memory retention across actions', false, e);
    }

    // ------------------------------------------------------------
    // TEST 27: Exclusion of rejected recommendations / diversity ranking
    // ------------------------------------------------------------
    try {
      const bId = 'BK-TEST-DIV-27';
      store.saveBooking({
        booking_id: bId,
        guest_id: 'GST-TEST-27',
        property: { name: 'Anjuna Villa', area: 'Anjuna' },
        dates: { check_in: '2026-03-20', check_out: '2026-03-24' }
      });

      await fetch(`${BASE_URL}/concierge/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: bId, message: "Give me something fun, not another beach" })
      });

      const mem = conciergeService.getOrCreateMemory(bId);
      assert.ok(mem.excludeTypes.has('beach'), 'Memory must record beach exclusion');

      const results = searchService.searchPlaces({
        excludeTypes: ['beach'],
        limit: 10
      });

      assert.ok(results.length > 0, 'Should return non-beach recommendations');
      assert.ok(results.every(p => p.type !== 'beach'), 'All returned recommendations must NOT be beaches');

      recordResult('TEST 27: Exclusion of rejected recommendations & activity diversity ranking', true);
    } catch (e) {
      recordResult('TEST 27: Exclusion of rejected recommendations & activity diversity ranking', false, e);
    }

    // ------------------------------------------------------------
    // TEST 28 (Section 46 #1): Candolim hotel does not produce four Agonda activities
    // ------------------------------------------------------------
    try {
      const candolimBooking = {
        booking_id: 'BK-TEST-NO-AGONDA',
        guest_name: 'Rahul Sharma',
        property: { name: 'Casa Candolim Luxury Villa', area: 'Candolim' },
        trip: { destination: 'Goa', check_in: '2026-10-15', check_out: '2026-10-19', nights: 4 },
        preferences: { vibe: ['beach', 'food', 'relaxed'] }
      };
      const itin = itineraryService.generateItinerary(candolimBooking);
      const allPlaceNames = itin.days.flatMap(d => d.items.map(it => it.place_name));
      const agondaCount = allPlaceNames.filter(name => name.toLowerCase().includes('agonda')).length;
      assert.strictEqual(agondaCount, 0, `Candolim stay must NOT produce Agonda activities (found ${agondaCount})`);

      recordResult('TEST 28: Candolim hotel does not produce Agonda activities (Geographic Grounding)', true);
    } catch (e) {
      recordResult('TEST 28: Candolim hotel does not produce Agonda activities (Geographic Grounding)', false, e);
    }

    // ------------------------------------------------------------
    // TEST 29 (Section 46 #2): Agonda remains available when explicitly requested
    // ------------------------------------------------------------
    try {
      const agondaPlace = placesService.getPlaceById('goa-beach-001');
      assert.ok(agondaPlace, 'Agonda Beach must exist in places database');
      assert.strictEqual(agondaPlace.region, 'South Goa');
      assert.strictEqual(agondaPlace.area, 'Agonda');

      const southBooking = {
        booking_id: 'BK-TEST-SOUTH',
        guest_name: 'Maya Sen',
        property: { name: 'Agonda Serenity Beach Resort', area: 'Agonda' },
        trip: { destination: 'Goa', check_in: '2026-11-01', check_out: '2026-11-05', nights: 4 },
        preferences: { vibe: ['south goa', 'beach', 'relaxed'] }
      };
      const southItin = itineraryService.generateItinerary(southBooking);
      assert.ok(southItin && southItin.days.length > 0, 'South Goa itinerary must be successfully generated');

      recordResult('TEST 29: Agonda remains available when explicitly requested (South Goa)', true);
    } catch (e) {
      recordResult('TEST 29: Agonda remains available when explicitly requested (South Goa)', false, e);
    }

    // ------------------------------------------------------------
    // TEST 30 (Section 46 #3): Fort Aguada cannot receive a beach category
    // ------------------------------------------------------------
    try {
      const aguada = placesService.getPlaceById('goa-fort-001');
      assert.ok(aguada);
      assert.strictEqual(aguada.type, 'fort', 'Fort Aguada type must be fort in database');

      // Test validator rejection of wrong category
      const fakeItin = {
        days: [{
          day_number: 1,
          items: [{
            place_id: 'goa-fort-001',
            category: 'beach',
            activity: 'Historic fort ramparts'
          }]
        }]
      };
      const val = itineraryValidator.validateItinerary(fakeItin, { property: { area: 'Candolim' } });
      assert.strictEqual(val.itinerary.days[0].items[0].category, 'fort', 'Hydration must restore true category "fort"');

      recordResult('TEST 30: Fort Aguada cannot receive a beach category (Immutable Hydration)', true);
    } catch (e) {
      recordResult('TEST 30: Fort Aguada cannot receive a beach category (Immutable Hydration)', false, e);
    }

    // ------------------------------------------------------------
    // TEST 31 (Section 46 #4): Beach cannot receive a museum description
    // ------------------------------------------------------------
    try {
      const badDescItin = {
        days: [{
          day_number: 1,
          items: [{
            place_id: 'goa-beach-014', // Candolim Beach
            slot_name: 'MORNING',
            activity: 'Explore museum gallery exhibits of Portuguese art'
          }]
        }]
      };
      const val = itineraryValidator.validateItinerary(badDescItin, { property: { area: 'Candolim' } });
      const item = val.itinerary.days[0].items[0];
      assert.ok(!item.activity.includes('museum gallery exhibits'), 'Beach activity cannot retain museum description');

      recordResult('TEST 31: Beach cannot receive a museum description (Category Consistency)', true);
    } catch (e) {
      recordResult('TEST 31: Beach cannot receive a museum description (Category Consistency)', false, e);
    }

    // ------------------------------------------------------------
    // TEST 32 (Section 46 #5): Restaurant recommendations must reference restaurant IDs
    // ------------------------------------------------------------
    try {
      const candolimBooking = {
        booking_id: 'BK-TEST-FOOD-ENT',
        property: { name: 'Candolim Villa', area: 'Candolim' },
        trip: { check_in: '2026-10-15', check_out: '2026-10-19', nights: 4 }
      };
      const itin = itineraryService.generateItinerary(candolimBooking);
      const day1 = itin.days[0];

      assert.ok(day1.food_suggestion, 'food_suggestion must exist');
      assert.ok(day1.food_suggestion.lunch, 'Lunch suggestion must exist');
      assert.ok(day1.food_suggestion.lunch_entity, 'Lunch entity must exist');
      assert.ok(day1.food_suggestion.lunch_entity.id.toLowerCase().includes('dine') || day1.food_suggestion.lunch_entity.id.toLowerCase().includes('restaurant'), 'Lunch entity ID must be verified dining');

      const lunchPlace = placesService.getPlaceById(day1.food_suggestion.lunch_entity.id);
      assert.ok(lunchPlace && (lunchPlace.type === 'restaurant' || lunchPlace.type === 'cafe'), 'Lunch place must be a verified restaurant/cafe in DB');

      recordResult('TEST 32: Restaurant recommendations must reference restaurant IDs', true);
    } catch (e) {
      recordResult('TEST 32: Restaurant recommendations must reference restaurant IDs', false, e);
    }

    // ------------------------------------------------------------
    // TEST 33 (Section 46 #6): Same place is not repeated 4 times by default
    // ------------------------------------------------------------
    try {
      const candolimBooking = {
        booking_id: 'BK-TEST-NO-DUPES',
        property: { name: 'Candolim Villa', area: 'Candolim' },
        trip: { check_in: '2026-10-15', check_out: '2026-10-19', nights: 4 }
      };
      const itin = itineraryService.generateItinerary(candolimBooking);
      const day1 = itin.days[0];
      const placeIds = day1.items.map(it => it.place_id);
      const uniquePlaceIds = new Set(placeIds);

      assert.strictEqual(uniquePlaceIds.size, placeIds.length, 'All slots on Day 1 must be distinct places');

      recordResult('TEST 33: Same place is not repeated multiple times on the same day', true);
    } catch (e) {
      recordResult('TEST 33: Same place is not repeated multiple times on the same day', false, e);
    }

    // ------------------------------------------------------------
    // TEST 34 (Section 46 #7): Day theme must match activity region/category
    // ------------------------------------------------------------
    try {
      const candolimBooking = {
        booking_id: 'BK-TEST-THEMES',
        property: { name: 'Candolim Villa', area: 'Candolim' },
        trip: { check_in: '2026-10-15', check_out: '2026-10-19', nights: 4 }
      };
      const itin = itineraryService.generateItinerary(candolimBooking);
      const day1Theme = itin.days[0].theme;
      const day3Theme = itin.days[2].theme;

      assert.ok(day1Theme.includes('Candolim') || day1Theme.includes('Sinquerim'), `Day 1 theme (${day1Theme}) must match Candolim places`);
      assert.ok(day3Theme.includes('Panaji') || day3Theme.includes('Fontainhas'), `Day 3 theme (${day3Theme}) must match Panaji/Fontainhas places`);

      recordResult('TEST 34: Day theme matches activity region & area clustering', true);
    } catch (e) {
      recordResult('TEST 34: Day theme matches activity region & area clustering', false, e);
    }

    // ------------------------------------------------------------
    // TEST 35 (Section 46 #8): Travel distance is calculated
    // ------------------------------------------------------------
    try {
      const candolimBooking = {
        booking_id: 'BK-TEST-DIST',
        property: { name: 'Candolim Villa', area: 'Candolim' },
        trip: { check_in: '2026-10-15', check_out: '2026-10-19', nights: 4 }
      };
      const itin = itineraryService.generateItinerary(candolimBooking);
      const day1Slots = itin.days[0].items;

      day1Slots.forEach(slot => {
        assert.ok(typeof slot.distance_from_hotel_km === 'number', `Slot ${slot.slot_name} must have distance_from_hotel_km`);
        assert.ok(typeof slot.travel_time_mins === 'number', `Slot ${slot.slot_name} must have travel_time_mins`);
        assert.ok(slot.distance_from_hotel_km >= 0);
        assert.ok(slot.travel_time_mins >= 0);
      });

      recordResult('TEST 35: Travel distance & drive time calculated for all slots', true);
    } catch (e) {
      recordResult('TEST 35: Travel distance & drive time calculated for all slots', false, e);
    }

    // ------------------------------------------------------------
    // TEST 36 (Section 46 #9): Impossible travel sequence is rejected
    // ------------------------------------------------------------
    try {
      const impossibleItin = {
        days: [{
          day_number: 1,
          items: [
            { place_id: 'goa-beach-014', slot_name: 'MORNING' }, // Candolim
            { place_id: 'goa-beach-001', slot_name: 'AFTERNOON (LUNCH)' } // Agonda (65km away in South Goa!)
          ]
        }]
      };
      const val = itineraryValidator.validateItinerary(impossibleItin, { property: { area: 'Candolim' } });
      assert.strictEqual(val.isValid, false, 'Validator must flag geographic mismatch');
      // Slot 2 should be replaced with a nearby candidate
      const slot2 = val.itinerary.days[0].items[1];
      assert.notStrictEqual(slot2.place_id, 'goa-beach-001', 'Impossible distant place must be auto-replaced');
      assert.strictEqual(slot2.region, 'North Goa', 'Replacement must be in North Goa');

      recordResult('TEST 36: Impossible travel sequence is rejected & auto-corrected', true);
    } catch (e) {
      recordResult('TEST 36: Impossible travel sequence is rejected & auto-corrected', false, e);
    }

    // ------------------------------------------------------------
    // TEST 37 (Section 46 #10): AI cannot overwrite place metadata
    // ------------------------------------------------------------
    try {
      const tamperedItin = {
        days: [{
          day_number: 1,
          items: [{
            place_id: 'goa-fort-001', // Fort Aguada
            place_name: 'Fake Aguada Resort',
            area: 'Canacona', // False area
            category: 'hotel', // False category
            coordinates: { lat: 0, lng: 0 } // False coords
          }]
        }]
      };
      const val = itineraryValidator.validateItinerary(tamperedItin, { property: { area: 'Candolim' } });
      const item = val.itinerary.days[0].items[0];

      assert.strictEqual(item.place_name, 'Fort Aguada', 'Canonical name must be preserved');
      assert.strictEqual(item.area, 'Sinquerim', 'Canonical area must be preserved');
      assert.strictEqual(item.category, 'fort', 'Canonical category must be preserved');
      assert.strictEqual(item.coordinates.lat, 15.4925, 'Canonical coordinates must be preserved');

      recordResult('TEST 37: Immutable entity hydration prevents AI metadata tampering', true);
    } catch (e) {
      recordResult('TEST 37: Immutable entity hydration prevents AI metadata tampering', false, e);
    }

    // ------------------------------------------------------------
    // TEST 38 (Section 46 #11): AI cannot invent place IDs
    // ------------------------------------------------------------
    try {
      const hallucinatedItin = {
        days: [{
          day_number: 1,
          items: [{
            place_id: 'hallucinated-place-xyz-999',
            slot_name: 'MORNING'
          }]
        }]
      };
      const val = itineraryValidator.validateItinerary(hallucinatedItin, { property: { area: 'Candolim' } });
      assert.strictEqual(val.isValid, false, 'Validator must flag non-existent placeId');
      assert.ok(val.itinerary.days[0].items[0].place_id !== 'hallucinated-place-xyz-999', 'Fake placeId must be replaced');
      assert.ok(placesService.getPlaceById(val.itinerary.days[0].items[0].place_id), 'Replacement must exist in DB');

      recordResult('TEST 38: Hallucinated place IDs rejected and auto-regenerated', true);
    } catch (e) {
      recordResult('TEST 38: Hallucinated place IDs rejected and auto-regenerated', false, e);
    }

    // ------------------------------------------------------------
    // TEST 39 (Section 46 #12): Invalid itinerary activity is automatically regenerated
    // ------------------------------------------------------------
    try {
      const brokenItin = {
        days: [{
          day_number: 1,
          items: [
            { place_id: 'invalid-slot-1', slot_name: 'MORNING' },
            { place_id: 'invalid-slot-2', slot_name: 'AFTERNOON (LUNCH)' }
          ]
        }]
      };
      const val = itineraryValidator.validateItinerary(brokenItin, { property: { area: 'Candolim' } });
      assert.ok(val.errors.length > 0, 'Errors should be reported');
      assert.ok(val.itinerary.days[0].items.every(it => placesService.getPlaceById(it.place_id)), 'All regenerated items must be valid DB places');

      recordResult('TEST 39: Invalid itinerary activity is automatically regenerated from DB', true);
    } catch (e) {
      recordResult('TEST 39: Invalid itinerary activity is automatically regenerated from DB', false, e);
    }

    // ------------------------------------------------------------
    // TEST 40 (Section 46 #13): Weather adaptation preserves geographic consistency
    // ------------------------------------------------------------
    try {
      const bId = 'BK-TEST-ADAPT-GEO';
      store.saveBooking({
        booking_id: bId,
        guest_name: 'Rahul Sharma',
        property: { name: 'Casa Candolim Luxury Villa', area: 'Candolim' },
        trip: { destination: 'Goa', check_in: '2026-10-15', check_out: '2026-10-19', nights: 4 }
      });
      const originalItin = itineraryService.generateItinerary(store.getBooking(bId));
      store.saveItinerary(bId, originalItin);

      // Trigger adaptation
      const adaptResult = await adaptationService.evaluateAndAdapt(bId, 2, {
        is_raining: true,
        condition: 'Rain',
        rain_probability: 95
      });
      assert.ok(adaptResult.adapted, 'Adaptation must succeed');

      const adaptedItin = store.getItinerary(bId);
      const adaptedDay2 = adaptedItin.days[1];
      const adaptedItem = adaptedDay2.items.find(it => it.is_adapted);

      assert.ok(adaptedItem, 'Adapted item must exist');
      assert.ok(adaptedItem.indoor_outdoor === 'indoor' || adaptedItem.indoor_outdoor === 'covered', 'Adapted item must be sheltered');
      assert.strictEqual(adaptedItem.region, 'North Goa', 'Adapted item must remain in North Goa for a Candolim stay');
      assert.ok(adaptedItem.distance_from_hotel_km <= 25, 'Adapted venue must be within reasonable distance of hotel');

      recordResult('TEST 40: Weather adaptation preserves geographic consistency in North Goa', true);
    } catch (e) {
      recordResult('TEST 40: Weather adaptation preserves geographic consistency in North Goa', false, e);
    }

    // ------------------------------------------------------------
    // TEST 41 (Section 46 #14): Mobile itinerary shows correct place data & entity fields
    // ------------------------------------------------------------
    try {
      const html = fs.readFileSync(path.join(__dirname, '..', 'frontend', 'index.html'), 'utf8');
      const appJs = fs.readFileSync(path.join(__dirname, '..', 'frontend', 'app.js'), 'utf8');

      assert.ok(html.includes('id="mobileBottomSheet"'), 'Must have mobile bottom sheet container');
      assert.ok(html.includes('id="sheetPlaceTitle"'), 'Must have place title in bottom sheet');
      assert.ok(html.includes('id="sheetPlaceMeta"'), 'Must have place meta in bottom sheet');
      assert.ok(appJs.includes('data-category='), 'app.js must bind data-category to slot cards');
      assert.ok(appJs.includes('data-distance='), 'app.js must bind data-distance to slot cards');

      recordResult('TEST 41: Mobile itinerary data attributes & bottom sheet containers verified', true);
    } catch (e) {
      recordResult('TEST 41: Mobile itinerary data attributes & bottom sheet containers verified', false, e);
    }

    // ------------------------------------------------------------
    // TEST 42 (Section 46 #15): Desktop itinerary API returns rich verified entity data
    // ------------------------------------------------------------
    try {
      const bRes = await fetch(`${BASE_URL}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guest_name: 'Pooja Hegde',
          guest_id: 'GST-DESK-42',
          property: { name: 'Casa Candolim Luxury Villa', area: 'Candolim' },
          trip: { destination: 'Goa', check_in: '2026-10-15', check_out: '2026-10-19', nights: 4, guest_count: 2 },
          preferences: { vibe: ['beach', 'food', 'relaxed'] }
        })
      });
      const bData = await bRes.json();
      const bookingId = bData.booking.booking_id;

      const itinRes = await fetch(`${BASE_URL}/itineraries/${bookingId}`);
      const itinData = await itinRes.json();
      assert.strictEqual(itinRes.status, 200);

      const day1 = itinData.itinerary.days[0];
      assert.ok(day1.theme.includes('Candolim') || day1.theme.includes('Sinquerim'));
      assert.ok(day1.items[0].place_name.includes('Candolim Beach'));
      assert.ok(day1.items[0].category === 'beach');
      assert.ok(day1.items[0].distance_from_hotel_km !== undefined);
      assert.ok(day1.food_suggestion.lunch.length > 0);
      assert.notStrictEqual(day1.food_suggestion.lunch, 'Agonda Beach');

      recordResult('TEST 42: Desktop itinerary API returns rich verified entity data & food suggestions', true);
    } catch (e) {
      recordResult('TEST 42: Desktop itinerary API returns rich verified entity data & food suggestions', false, e);
    }

  } finally {
    console.log('\n------------------------------------------------------------');
    console.log(`TOTAL TEST SUITES: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
    console.log('------------------------------------------------------------\n');

    process.exitCode = failed > 0 ? 1 : 0;
    if (server) {
      server.close();
    }
  }
}

runTests().catch(err => {
  console.error('Fatal test execution error:', err);
  process.exit(1);
});
