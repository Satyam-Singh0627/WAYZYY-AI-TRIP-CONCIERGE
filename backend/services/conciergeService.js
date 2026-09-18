/**
 * ============================================================
 * SERVICE: conciergeService.js
 * Master Destination-Intelligence AI Concierge Architecture:
 * 1. Structured Intent Parsing
 * 2. Multi-turn Session Memory
 * 3. Structured Database Retrieval (Search & Location Services)
 * 4. Ranking (Recommendation Service)
 * 5. Prompt Construction with Top 5-15 Candidates
 * 6. Claude Execution or High-Quality Deterministic Engine
 * 7. Action Execution & State Persistence
 * ============================================================
 */

const axios = require('axios');
const store = require('../store');
const searchService = require('./searchService');
const locationService = require('./locationService');
const recommendationService = require('./recommendationService');
const adaptationService = require('./adaptationService');
const placesService = require('./placesService');

class ConciergeService {
  constructor() {
    this.apiKey = process.env.CLAUDE_API_KEY || '';
    this.model = process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022';
    this.apiUrl = 'https://api.anthropic.com/v1/messages';

    // Session memory per bookingId
    this.sessionMemory = new Map();
  }

  isLive() {
    return Boolean(this.apiKey && this.apiKey.trim().length > 10);
  }

  getMode() {
    return this.isLive() ? 'LIVE' : 'DEMO';
  }

  classifyIntent(message) {
    const q = (message || '').toLowerCase().trim();
    if (q.includes('rain') || q.includes('weather') || q.includes('cloud') || q.includes('forecast') || q.includes('storm') || q.includes('indoor plan') || q.includes('beach?') || q.includes('good for the beach')) {
      return 'WEATHER';
    }
    if (q.includes('itinerary') || q.includes('schedule') || q.includes('day 1') || q.includes('day 2') || q.includes('tomorrow') || q.includes('plan')) {
      return 'ITINERARY';
    }
    if (q.includes('restaurant') || q.includes('dinner') || q.includes('lunch') || q.includes('food') || q.includes('eat') || q.includes('cafe')) {
      return 'FOOD';
    }
    if (q.includes('recommend') || q.includes('where to go') || q.includes('places') || q.includes('what to see')) {
      return 'RECOMMENDATION';
    }
    if (q.includes('booking') || q.includes('reservation') || q.includes('hotel') || q.includes('villa') || q.includes('check-in')) {
      return 'BOOKING';
    }
    return 'GENERAL';
  }

  getOrCreateMemory(bookingId) {
    if (!this.sessionMemory.has(bookingId)) {
      this.sessionMemory.set(bookingId, {
        intent: 'general',
        traveler_type: null,
        vibePreferences: new Set(),
        constraints: new Set(),
        excludeTypes: new Set(),
        indoor_outdoor: null,
        maxDistanceKm: 25,
        timeOfDay: null,
        lastQuery: '',
        lastCandidates: [],
        rejectedPlaceIds: new Set(),
        avoid_crowds: false,
        indoor_only: false,
        family_friendly: false,
        couple_friendly: false,
        exclude_beach: false
      });
    }
    return this.sessionMemory.get(bookingId);
  }

  /**
   * Parse message into structured intent & update multi-turn memory
   */
  updateSessionMemory(message, memory) {
    const q = message.toLowerCase().trim();

    // Guardrail against prompt injection
    if (q.includes('ignore previous') || q.includes('system prompt') || q.includes('secret key') || q.includes('developer mode')) {
      return { is_guardrail: true };
    }

    // 1. Contextual follow-up modifications
    if (q === 'closer' || q.includes('closer to my hotel') || q.includes('closer')) {
      memory.maxDistanceKm = Math.max(3, memory.maxDistanceKm - 5);
      memory.constraints.add('closer_proximity');
    }
    if (q === 'indoor' || q.includes('something inside') || q.includes('indoor') || q.includes('inside')) {
      memory.indoor_outdoor = 'indoor';
      memory.constraints.add('indoor_only');
      memory.indoor_only = true;
    }
    if (q === 'outdoor' || q.includes('outdoor')) {
      memory.indoor_outdoor = 'outdoor';
    }
    if (q.includes('for tonight') || q.includes('tonight')) {
      memory.timeOfDay = 'night';
    }
    if (q.includes('kids') || q.includes('with kids') || q.includes('children') || q.includes('family')) {
      memory.traveler_type = 'family';
      memory.constraints.add('family_friendly');
      memory.family_friendly = true;
    }
    if (q.includes('couple') || q.includes('romantic') || q.includes('for two')) {
      memory.traveler_type = 'couple';
      memory.constraints.add('couple_friendly');
      memory.couple_friendly = true;
    }
    if (q.includes('quiet') || q.includes('peaceful') || q.includes('somewhere quiet') || q.includes('less crowded') || q.includes('crowd') || q.includes('crowded')) {
      memory.vibePreferences.add('quiet');
      memory.constraints.add('avoid_crowds');
      memory.avoid_crowds = true;
    }
    if (q.includes('not another beach') || q.includes('no beach') || q.includes('done with the beach')) {
      memory.excludeTypes.add('beach');
      memory.constraints.add('exclude_beach');
      memory.exclude_beach = true;
    }
    if (q.includes('relaxed') || q.includes('not too tiring') || q.includes('easier')) {
      memory.vibePreferences.add('relaxed');
      memory.constraints.add('relaxed_pace');
    }
    if (q.includes('cultural') || q.includes('heritage') || q.includes('history') || q.includes('more local')) {
      memory.vibePreferences.add('cultural');
      memory.constraints.add('cultural_depth');
    }

    memory.lastQuery = q;
    return { is_guardrail: false };
  }

  /**
   * Main AI Concierge Pipeline
   */
  async generateResponse(userMessage, booking, conversationHistory = [], itinerary = null) {
    const bookingId = booking.booking_id;
    const memory = this.getOrCreateMemory(bookingId);

    // 1. Update memory
    const { is_guardrail } = this.updateSessionMemory(userMessage, memory);
    if (is_guardrail) {
      return {
        reply: "I am Wayzyy's local AI Trip Concierge for Goa. I provide personalized recommendations, weather updates, and itinerary adaptations grounded in verified Goa destinations. How can I assist with your stay today?",
        grounded_places: [],
        suggested_actions: []
      };
    }

    // 2. Structured retrieval from SearchService
    const weather = store.getWeather();
    const isRain = weather?.is_raining || (weather?.rain_probability && weather.rain_probability >= 60);

    // Criteria building combining user query with memory
    const criteria = searchService.parseQueryToCriteria(userMessage, booking, weather);

    // Merge memory constraints
    if (memory.indoor_outdoor) criteria.indoor_outdoor = memory.indoor_outdoor;
    if (memory.maxDistanceKm < criteria.maxDistanceKm) criteria.maxDistanceKm = memory.maxDistanceKm;
    if (memory.timeOfDay && !criteria.timeOfDay) criteria.timeOfDay = memory.timeOfDay;
    if (memory.traveler_type && !criteria.travelerType) criteria.travelerType = memory.traveler_type;
    memory.excludeTypes.forEach(t => {
      if (!criteria.excludeTypes.includes(t)) criteria.excludeTypes.push(t);
    });
    memory.vibePreferences.forEach(v => {
      if (!criteria.vibePreferences.includes(v)) criteria.vibePreferences.push(v);
    });

    // 3. Search real places (NEVER send the entire database to AI!)
    const candidatePlaces = searchService.searchPlaces(criteria, 8);
    memory.lastCandidates = candidatePlaces;

    // 4. If Claude is configured, prompt Claude with candidate places
    if (this.isLive()) {
      try {
        console.log(`[ConciergeService] Calling Live Claude with ${candidatePlaces.length} real candidates...`);
        const systemPrompt = `You are WAYZYY's Local AI Travel Concierge for Goa.
Guest Context:
- Guest Name: ${booking.guest_name}
- Property: ${booking.property?.name} (${booking.property?.area || 'Candolim'})
- Check-in: ${booking.trip?.check_in} to ${booking.trip?.check_out} (${booking.trip?.guest_count} guests)
- Active Memory Constraints: ${Array.from(memory.constraints).join(', ') || 'None'}

Current Weather:
${weather.condition} (${weather.temp}°C, Rain Risk: ${weather.rain_probability}%)

Retrieved Real Verified Places:
${JSON.stringify(candidatePlaces.map(p => ({
  name: p.name,
  area: p.area,
  type: p.type,
  distance: p.distance_str,
  indoor_outdoor: p.indoor_outdoor,
  why: p.why_matches
})), null, 2)}

Strict Instructions:
1. YOU ARE NOT ALLOWED TO INVENT PLACE ENTITIES. Only recommend places provided in the context above.
2. DO NOT CHANGE A PLACE NAME, CATEGORY, AREA, OR COORDINATES.
3. DO NOT ASSIGN A DESCRIPTION FROM ONE PLACE TO ANOTHER.
4. If insufficient information exists, say that the information is unavailable rather than inventing it.
5. Be concise, warm, natural, and helpful (under 120 words).
6. Directly answer the user's intent, explaining proximity and fit.
7. If adverse weather is discussed, explain why indoor/covered alternatives were picked.
8. Respond in English unless the user explicitly requests another language.`;

        const messages = conversationHistory.slice(-6).map(m => ({
          role: m.sender === 'guest' ? 'user' : 'assistant',
          content: m.message
        }));
        messages.push({ role: 'user', content: userMessage });

        const response = await axios.post(
          this.apiUrl,
          {
            model: this.model,
            max_tokens: 500,
            system: systemPrompt,
            messages
          },
          {
            headers: {
              'x-api-key': this.apiKey,
              'anthropic-version': '2023-06-01',
              'content-type': 'application/json'
            },
            timeout: 8000
          }
        );

        const reply = response.data?.content?.[0]?.text;
        if (reply) {
          return {
            reply,
            grounded_places: candidatePlaces.map(p => p.name),
            suggested_actions: this.buildActions(candidatePlaces, criteria)
          };
        }
      } catch (err) {
        console.warn(`[ConciergeService] Live API failed (${err.message}). Using deterministic destination engine.`);
      }
    }

    // 5. Deterministic Real-Data Engine (Fallback & Demo Mode)
    return this.generateDeterministicResponse(userMessage, candidatePlaces, criteria, booking, itinerary, memory, weather);
  }

  generateDeterministicResponse(userMessage, candidates, criteria, booking, itinerary, memory, weather) {
    const area = booking.property?.area || 'Candolim';
    const isRaining = weather?.is_raining || (weather?.rain_probability && weather.rain_probability >= 60);
    const day2 = itinerary?.days?.[1] || itinerary?.days?.[0];

    // Build bullet list of top 3 real retrieved places
    const top3 = candidates.slice(0, 3);
    const placeList = top3.map(p =>
      `• **${p.name}** (${p.area} · ${p.distance_str || p.approx_distance_area || 'Nearby'}): ${p.description || p.why_matches}`
    ).join('\n');

    let reply = '';
    const q = userMessage.toLowerCase();

    if (q.includes('rain') || q.includes('weather') || q.includes('instead') || isRaining) {
      reply = `Because rain is forecasted around **${area}** (${weather.rain_probability || 95}% risk), I’ve filtered our real Goa knowledge base for verified sheltered options:\n\n${placeList}\n\nI can update your schedule right now to substitute outdoor plans with one of these!`;
    } else if (q.includes('quiet') || memory.constraints.has('avoid_crowds')) {
      reply = `Keeping things quiet and relaxed near **${area}**, here are top uncrowded spots from our verified Goa directory:\n\n${placeList}\n\nWould you like me to book transport or slot this into tomorrow's plan?`;
    } else if (q.includes('dinner') || q.includes('eat') || criteria.timeOfDay === 'night') {
      reply = `For dining near your villa in **${area}**, here are verified culinary favorites:\n\n${placeList}\n\nWould you like me to reserve a table for tonight?`;
    } else if (q.includes('tomorrow') || q.includes('day 2')) {
      const day2Items = day2?.items || [];
      const schedule = day2Items.map(it => `• **${it.time} (${it.slot_name})**: ${it.place_name} — _${it.why_match || it.activity}_`).join('\n');
      reply = `For tomorrow (**Day 2 — ${day2?.theme || 'Coastal Exploration'}**), here is your schedule:\n\n${schedule}\n\n💡 **Concierge Tip**: ${day2?.concierge_tip || 'Keep your booking ID handy for express villa assistance.'}`;
    } else {
      reply = `Based on your stay at **${booking.property?.name || 'Candolim Villa'}**, here are verified recommendations matching your preferences:\n\n${placeList}\n\nLet me know if you want me to add any of these to your itinerary!`;
    }

    return {
      reply,
      grounded_places: top3.map(p => p.name),
      suggested_actions: this.buildActions(top3, criteria)
    };
  }

  buildActions(candidates, criteria) {
    const actions = [];
    if (candidates.length > 0) {
      actions.push({
        label: `Add ${candidates[0].name.split(' ')[0]} to Itinerary`,
        action: 'add_activity',
        place_id: candidates[0].id,
        day: 2
      });
    }
    actions.push({ label: 'Make Tomorrow More Relaxed', action: 'make_relaxed', day: 2 });
    actions.push({ label: 'View Weather Forecast', action: 'navigate_weather' });
    actions.push({ label: 'Open Itinerary', action: 'navigate_itinerary' });
    return actions;
  }

  /**
   * Execute Concierge Actions
   */
  async executeAction(actionType, params, bookingId) {
    const itinerary = store.getItinerary(bookingId);
    if (!itinerary) throw new Error(`Itinerary for booking ${bookingId} not found`);

    if (actionType === 'replace_activity' || actionType === 'apply_adaptation') {
      if (params.place_id) {
        const place = placesService.getPlaceById(params.place_id);
        const dayNum = params.day || 1;
        const day = itinerary.days.find(d => d.day_number === dayNum) || itinerary.days[0];
        const slotIdx = params.slot_index !== undefined ? params.slot_index : 0;
        if (place && day && day.items[slotIdx]) {
          const oldName = day.items[slotIdx].place_name;
          day.items[slotIdx] = {
            ...day.items[slotIdx],
            place_id: place.id,
            place_name: place.name,
            area: place.area,
            category: place.categories?.[0] || place.type,
            activity: place.description || place.name,
            indoor_outdoor: place.indoor_outdoor,
            weather_fit: place.weather_fit?.rain >= 0.7 ? 'rain_safe' : 'dry_only',
            why_match: `Replaced ${oldName} with ${place.name}.`,
            is_adapted: true
          };
          store.saveItinerary(bookingId, itinerary);
          return {
            success: true,
            message: `Replaced ${oldName} with ${place.name} on Day ${dayNum}.`,
            itinerary
          };
        }
      }
      const result = await adaptationService.evaluateAndAdapt(bookingId, params.day || 2);
      return {
        success: true,
        message: 'Outdoor activity replaced with rain-safe indoor experience.',
        itinerary: result.updated_itinerary,
        adaptation: result
      };
    }

    if (actionType === 'move_activity') {
      const fromDayNum = params.from_day || params.day || 1;
      const toDayNum = params.to_day || 2;
      const fromDay = itinerary.days.find(d => d.day_number === fromDayNum);
      const toDay = itinerary.days.find(d => d.day_number === toDayNum);
      if (fromDay && toDay && fromDay.items.length > 0) {
        let itemIndex = 0;
        if (params.place_id) {
          const idx = fromDay.items.findIndex(it => it.place_id === params.place_id);
          if (idx !== -1) itemIndex = idx;
        }
        const [movedItem] = fromDay.items.splice(itemIndex, 1);
        toDay.items.push(movedItem);
        store.saveItinerary(bookingId, itinerary);
        return {
          success: true,
          message: `Moved ${movedItem.place_name} from Day ${fromDayNum} to Day ${toDayNum}.`,
          itinerary
        };
      }
      return { success: false, message: 'Could not move activity between days' };
    }

    if (actionType === 'add_activity') {
      const place = placesService.getPlaceById(params.place_id);
      if (place) {
        const day = itinerary.days[1] || itinerary.days[0];
        day.items.push({
          time: params.time || '15:30',
          slot_name: 'AFTERNOON',
          place_id: place.id,
          place_name: place.name,
          area: place.area,
          category: place.categories?.[0] || place.type,
          activity: place.description || place.name,
          indoor_outdoor: place.indoor_outdoor,
          weather_fit: place.weather_fit?.rain >= 0.7 ? 'rain_safe' : 'dry_only',
          approx_distance_area: place.address || `${place.area}, Goa`,
          why_match: `Added from concierge recommendation: ${place.name}.`,
          is_adapted: false
        });
        store.saveItinerary(bookingId, itinerary);
        return {
          success: true,
          message: `Added ${place.name} to Day ${day.day_number} schedule.`,
          itinerary
        };
      }
    }

    if (actionType === 'remove_activity') {
      const dayNum = params.day || 1;
      const day = itinerary.days.find(d => d.day_number === dayNum) || itinerary.days[0];
      if (day && day.items.length > 0) {
        let removed;
        if (params.place_id) {
          const idx = day.items.findIndex(it => it.place_id === params.place_id);
          if (idx !== -1) {
            removed = day.items.splice(idx, 1)[0];
          }
        }
        if (!removed) {
          removed = day.items.pop();
        }
        store.saveItinerary(bookingId, itinerary);
        return {
          success: true,
          message: `Removed ${removed.place_name} from Day ${day.day_number}.`,
          itinerary
        };
      }
      return { success: false, message: 'No activity found to remove' };
    }

    if (actionType === 'make_relaxed') {
      const dayNum = params.day || 2;
      const targetDay = itinerary.days.find(d => d.day_number === dayNum) || itinerary.days[0];
      if (targetDay) {
        targetDay.theme = `${targetDay.theme} (Relaxed Pace)`;
        store.saveItinerary(bookingId, itinerary);
      }
      return {
        success: true,
        message: `Day ${dayNum} adjusted to a relaxed pace.`,
        itinerary
      };
    }

    return { success: false, message: 'Unrecognized action type' };
  }
}

module.exports = new ConciergeService();
