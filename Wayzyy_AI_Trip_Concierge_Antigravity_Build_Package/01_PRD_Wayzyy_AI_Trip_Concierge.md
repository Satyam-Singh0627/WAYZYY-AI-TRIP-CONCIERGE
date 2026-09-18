# Product Requirements Document (PRD)
## Wayzyy AI Trip Concierge — PS2

**Purpose:** Build a hackathon-ready post-booking AI Trip Concierge for Wayzyy.

---

## 1. Product Overview

Wayzyy AI Trip Concierge is an AI-powered post-booking companion for guests who have already booked a short-term rental. Instead of treating the booking as the end of the relationship, the product continues assisting the guest throughout the trip.

The core product loop is:

**Book → Plan → Adapt → Experience**

The concierge inherits booking context such as property, dates and guest count instead of asking the guest to re-enter information. It then:
1. Generates a personalized itinerary.
2. Monitors relevant trip conditions such as weather and milestones.
3. Proactively sends useful notifications.
4. Answers local questions conversationally.

The MVP is Goa-first, using a curated local knowledge base and real-time weather data.

---

## 2. Problem Statement

The source project discussion identifies a gap after a stay is booked: the booking platform can become disconnected from the actual trip experience.

Guest pain points:
- No continuity between booking and the trip experience.
- Support is primarily reactive.
- Information may be generic instead of specific to the guest's stay.
- Weather can disrupt plans without automatic adaptation.
- Human support does not scale efficiently with guest volume.

The product should address this gap without attempting to replace a full-service travel organizer.

---

## 3. Product Vision

Turn Wayzyy from a platform that helps a guest book a stay into a platform that continues helping the guest experience that stay.

The concierge should feel like a **booking-aware local companion**, not a generic trip-planning chatbot.

---

## 4. Target User

### Primary user
A guest who has already booked a Wayzyy short-term rental.

### Example
A guest books a villa in Candolim for four nights.

The system already knows:
- Guest identity/context available from the booking.
- Property.
- Destination/area.
- Check-in date.
- Check-out date.
- Guest count.

The system should not ask again for information already available from the booking.

---

## 5. Goals

### MVP goals
- Trigger the concierge automatically after booking confirmation.
- Generate a day-by-day itinerary.
- Use curated Goa data rather than allowing the LLM to invent local facts.
- Provide a conversational concierge.
- Provide proactive weather/trip notifications.
- Demonstrate automatic itinerary adaptation.
- Deliver the experience through Telegram for the hackathon MVP.
- Provide a simple booking simulator to demonstrate the booking-trigger flow.

### Non-goals for the hackathon
- Building a full Wayzyy booking platform.
- Building a full production mobile application.
- Replacing Wayzyy's existing booking infrastructure.
- Building a worldwide travel database.
- Building a complex recommendation marketplace.
- Building payment, booking modification, or cancellation systems.
- Building WhatsApp Business production integration.
- Generating PDF/PPT/poster trip outputs.
- Training a custom AI model.

---

## 6. Core Features

### F1 — Booking Context Ingestion
When a booking is confirmed, create the concierge context.

Minimum context:
- Booking ID.
- Guest identifier.
- Guest name where permitted.
- Property name.
- Area/location.
- Check-in.
- Check-out.
- Number of guests.
- Optional preferences.

Acceptance criteria:
- A booking event can trigger the itinerary workflow.
- The itinerary workflow can retrieve the relevant local dataset.
- The generated response is associated with the correct guest/booking.

---

### F2 — AI Itinerary Generator

Input:
- Booking context.
- Trip dates.
- Guest count.
- Guest preferences if available.
- Curated Goa dataset.
- Relevant weather information when available.

Output:
- Day-by-day itinerary.
- Activities/restaurants/places selected from available curated data.
- Reasonable timing and geographic grouping.
- Adaptation to trip dates.

Rules:
- Do not invent places that are not present in the trusted dataset.
- Respect check-in/check-out dates.
- Avoid unrealistic schedules.
- Avoid unnecessary travel between distant areas.
- Keep output concise enough for chat.
- Clearly distinguish known data from suggestions.

Optional quality-control pass:
- Review the generated itinerary for date errors, duplicated activities, unrealistic timing and excessive travel.
- Correct issues before delivery.

---

### F3 — Proactive Notification Agent

The concierge should be able to message the guest without waiting for a question.

Trigger examples:
- Check-in reminder.
- Weather change.
- Rain affecting a planned outdoor activity.
- Local event/relevant update.

Core demo:
**Weather changes → system evaluates itinerary → alternative is selected → guest receives proactive message.**

The notification should be:
- Short.
- Specific.
- Context-aware.
- Non-alarmist.
- Actionable.

---

### F4 — Conversational Concierge

Guest can ask questions such as:
- “Where should I have dinner nearby?”
- “What can I do if it rains tomorrow?”
- “What is close to my villa?”
- “What should I do on day 3?”

The assistant should use:
- Booking context.
- Conversation memory.
- Curated local data.
- Current weather data when relevant.

It should behave as Wayzyy's local concierge rather than a general-purpose assistant.

---

### F5 — Local Goa Knowledge Base

The MVP should use a curated dataset stored in Google Sheets.

Suggested data categories:
- Beaches.
- Restaurants/food.
- Nightlife.
- Activities.
- Water activities.
- Indoor alternatives.
- Local events.
- Transport options.
- Neighborhood/area information.

Suggested areas:
- Baga.
- Anjuna.
- Vagator.
- Candolim.
- Panjim.
- Assagao.
- Palolem.

Suggested fields:
- Name.
- Area.
- Category.
- Tags/vibe.
- Description.
- Approximate distance/area relationship.
- Indoor/outdoor.
- Suitable weather.
- Family/friends/couple suitability where appropriate.
- Notes.

---

### F6 — Booking Simulator

A small web page may be used for the hackathon demo.

Purpose:
- Simulate a booking confirmation.
- Collect only enough information to trigger the workflow.
- POST booking data to the n8n webhook.

Suggested fields:
- Guest name.
- Property.
- Area.
- Check-in.
- Check-out.
- Guest count.
- Telegram/chat identifier if needed for the demo.

The simulator is not intended to replace Wayzyy's real booking platform.

---

## 7. Concierge Lifecycle

Recommended MVP lifecycle:

**Booking confirmed → active preparation → stay → checkout → short wrap-up → dormant**

The discussion recommends keeping proactive concierge activity around the trip window rather than permanently sending travel nudges.

For the hackathon, implement the trip lifecycle simply. Production lifecycle rules should be configurable.

Conversation history/preferences may be retained separately for future repeat bookings, subject to production privacy requirements.

---

## 8. Main User Journey

### Journey A — Booking to itinerary
1. Guest completes a booking.
2. Booking confirmation event reaches n8n.
3. System builds booking context.
4. Local dataset is loaded.
5. AI generates itinerary.
6. Optional quality-control step reviews it.
7. Itinerary is delivered to Telegram.

### Journey B — Weather adaptation
1. Scheduled workflow checks weather.
2. System associates weather with the guest's trip/property.
3. Weather condition is relevant to an outdoor plan.
4. Agent selects suitable alternatives from trusted local data.
5. Itinerary is adapted.
6. Guest receives a proactive Telegram notification.

### Journey C — Conversational assistance
1. Guest sends a Telegram message.
2. Workflow retrieves conversation/booking context.
3. Agent uses local data and relevant tools.
4. Agent generates response.
5. Response is sent back through Telegram.

---

## 9. Worked Demo Scenario

**Booking:** Candolim villa, four nights.

Expected demo:
1. Simulate booking confirmation.
2. Concierge already knows the property and dates.
3. Itinerary is generated and delivered.
4. Guest asks a local question in Telegram.
5. Weather changes/demonstration condition is detected.
6. System adapts an affected outdoor plan.
7. Guest receives an unsolicited proactive message.
8. Guest asks a follow-up question.

This demonstrates all three core modules in one story.

---

## 10. Functional Requirements

| ID | Requirement |
|---|---|
| FR-01 | Accept a booking event through a webhook. |
| FR-02 | Store/use booking context for the active concierge session. |
| FR-03 | Retrieve curated local information. |
| FR-04 | Generate a date-aware itinerary. |
| FR-05 | Deliver itinerary through Telegram. |
| FR-06 | Receive Telegram guest messages. |
| FR-07 | Maintain conversation context. |
| FR-08 | Answer using booking context and trusted local data. |
| FR-09 | Retrieve current weather data. |
| FR-10 | Detect relevant weather/trip conditions. |
| FR-11 | Generate proactive notification text. |
| FR-12 | Send proactive Telegram notifications. |
| FR-13 | Adapt affected itinerary items where sufficient trusted alternatives exist. |
| FR-14 | Log workflow outcomes and errors. |
| FR-15 | Prevent unsupported local recommendations from being presented as verified facts. |

---

## 11. Non-Functional Requirements

- Reliability suitable for a live hackathon demo.
- Simple setup and debugging.
- Low infrastructure complexity.
- Clear separation between trusted data and generated text.
- Reasonable response latency.
- Graceful error handling.
- No secrets in frontend code or source control.
- Workflow components should be independently testable.

---

## 12. Success Criteria for MVP

A successful demo should prove:

1. Booking context flows automatically.
2. The user does not need to re-enter known booking information.
3. A useful itinerary is generated.
4. The itinerary is grounded in curated local data.
5. The guest can converse with the concierge.
6. A proactive notification can occur without a guest message.
7. Weather can cause a relevant plan adjustment.
8. The complete experience works end-to-end.

---

## 13. Future Scope

- Replace simulator with real Wayzyy booking integration.
- Add additional destinations beyond Goa.
- Integrate maps/routing.
- Add richer local-event feeds.
- Add production messaging channels.
- Add stronger preference learning across repeat trips.
- Add analytics for post-booking engagement.
- Add human handoff for complex support cases.
- Add production-grade data governance and consent management.
