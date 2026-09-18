# Technical Architecture Document
## Wayzyy AI Trip Concierge — PS2

---

## 1. Architecture Goal

Build the MVP with minimal custom backend infrastructure and maximum hackathon reliability.

The proposed architecture uses:

- **n8n Cloud** — workflow orchestration and automation.
- **Claude API** — LLM reasoning and response generation.
- **Telegram Bot API** — guest-facing conversational channel.
- **Google Sheets** — curated Goa knowledge base for MVP.
- **OpenWeatherMap API** — live weather input.
- **Lightweight HTML/JS booking simulator** — demo booking trigger.

No custom backend server is required for the MVP unless a later implementation needs one.

---

## 2. High-Level Architecture

```text
                    ┌──────────────────────┐
                    │ Booking Simulator /  │
                    │ Future Wayzyy Booking│
                    └──────────┬───────────┘
                               │ Booking Webhook
                               ▼
                     ┌───────────────────┐
                     │     n8n Cloud     │
                     │ Orchestration     │
                     └─────────┬─────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
       Itinerary WF      Notification WF   Conversation WF
              │                │                │
              │                ▼                ▼
              │          OpenWeatherMap      Telegram
              │                │                │
              └───────┬────────┴───────┬────────┘
                      ▼                ▼
                Claude API       Google Sheets
                      │          Goa Knowledge Base
                      ▼
                  Telegram
```

---

## 3. Architecture Layers

### Layer 1 — Presentation / Interaction
- Telegram chat.
- Booking simulator.
- Optional notification feed/UI.

### Layer 2 — Orchestration
n8n Cloud coordinates triggers, API calls, data retrieval, conditions and message delivery.

### Layer 3 — AI Core
Claude is responsible for:
- Itinerary generation.
- Conversational responses.
- Notification wording.
- Optional itinerary evaluation/refinement.

### Layer 4 — Data
- Booking context.
- Curated Goa dataset.
- Conversation/session context.
- Weather API response.

### Layer 5 — External Services
- Telegram Bot API.
- OpenWeatherMap.
- Claude API.
- Google Sheets API through n8n integration.

---

## 4. Workflow 1 — AI Itinerary Generator

### Flow

```text
Booking Webhook
      ↓
Validate booking payload
      ↓
Build concierge context
      ↓
Read Goa dataset
      ↓
Claude itinerary generation
      ↓
Optional itinerary evaluator
      ↓
Format Telegram message
      ↓
Send Telegram message
      ↓
Log result
```

### Inputs
- booking_id
- guest_id/chat_id
- property
- area
- check_in
- check_out
- guest_count
- preferences

### Data retrieval
Use Google Sheets as the trusted source for local recommendations.

### AI constraints
The model must:
- Use only supplied trusted local records for factual place recommendations.
- Respect dates.
- Group geographically sensible activities.
- Avoid duplicate/repetitive plans.
- Avoid overpacking each day.
- Prefer weather-compatible activities.

### Output
A structured itinerary should be produced internally before converting it to Telegram-friendly text.

Suggested internal shape:

```json
{
  "booking_id": "BK-001",
  "days": [
    {
      "date": "YYYY-MM-DD",
      "theme": "North Goa / Relaxed Beach Day",
      "items": [
        {
          "time": "09:00",
          "place": "Dataset place name",
          "reason": "Why it fits"
        }
      ]
    }
  ]
}
```

---

## 5. Workflow 2 — Proactive Notification Agent

### Flow

```text
Schedule Trigger
      ↓
Find active bookings
      ↓
Fetch weather for relevant area
      ↓
Evaluate trip condition
      ↓
IF condition is relevant
      ↓
Find affected itinerary item
      ↓
Find trusted alternative
      ↓
Claude generates concise notification
      ↓
Telegram sends message
      ↓
Log notification
```

### Initial triggers
- Check-in approaching.
- Rain/bad-weather condition.
- Other configurable trip milestones.

### Weather adaptation
Do not simply tell the guest that it may rain.

The preferred behavior is:

```text
Weather signal
      ↓
Is an outdoor plan affected?
      ↓ yes
Find suitable indoor/alternative activity
      ↓
Generate explanation
      ↓
Proactively message guest
```

### Demo requirement
The team must be able to trigger the weather-adaptation path predictably during judging. The production design should use real weather data, but the workflow should also provide a safe demo/test mechanism so the live demo does not depend on an unpredictable forecast.

---

## 6. Workflow 3 — Conversational Concierge

### Flow

```text
Telegram Trigger
      ↓
Identify guest/session
      ↓
Retrieve booking context
      ↓
Retrieve conversation context
      ↓
Retrieve relevant local data
      ↓
Claude
      ↓
Validate/format response
      ↓
Telegram
```

### Example

Guest:
> What should I do tomorrow if it rains?

Agent:
- Reads active booking.
- Reads tomorrow's itinerary.
- Reads weather.
- Searches trusted alternatives.
- Produces a concise answer.

---

## 7. Agent Responsibilities

### Itinerary Agent
Responsible for planning.

### Notification Agent
Responsible for deciding whether a proactive message is useful and wording it.

### Conversation Agent
Responsible for answering guest questions.

Do not use one giant prompt for every function. Each workflow should have a focused system prompt and explicit input context.

---

## 8. Knowledge/Data Strategy

### Trusted data hierarchy

1. Booking data — highest priority for guest-specific context.
2. Curated Goa dataset — source for local place facts.
3. Weather API — source for current/forecast weather.
4. LLM — reasoning, transformation and language generation.

The LLM should not be treated as the authoritative database for local facts.

---

## 9. Recommended Google Sheet Structure

### Sheet: places

Columns:

```text
id
name
area
category
description
tags
indoor_outdoor
weather_fit
family_fit
nightlife
approx_distance_area
notes
```

### Sheet: events
```text
id
name
area
date_start
date_end
category
description
source
```

### Sheet: alternatives
```text
outdoor_category
weather_condition
recommended_category
```

The MVP can begin with one `places` sheet and expand only if time permits.

---

## 10. Booking Context Object

Recommended canonical object:

```json
{
  "booking_id": "BK-001",
  "guest_id": "G-001",
  "telegram_chat_id": "123456789",
  "property": {
    "name": "Example Villa",
    "area": "Candolim"
  },
  "trip": {
    "check_in": "YYYY-MM-DD",
    "check_out": "YYYY-MM-DD",
    "guest_count": 2
  },
  "preferences": {
    "vibe": ["relaxed", "food"],
    "activity_level": "moderate"
  }
}
```

Use one consistent schema across all workflows.

---

## 11. Error Handling

Every external dependency can fail.

### If Claude fails
- Do not expose raw API errors.
- Retry where safe.
- Fall back to a clear temporary message.

### If weather API fails
- Do not invent weather.
- Continue normal itinerary/chat behavior.
- Tell the user weather-based adaptation is temporarily unavailable if relevant.

### If Google Sheets fails
- Do not fabricate local recommendations.
- Return a controlled fallback.

### If Telegram fails
- Log the failed delivery.
- Preserve the generated message for retry.

### If booking payload is invalid
- Reject the request with a clear validation error.
- Do not start an incomplete concierge session.

---

## 12. Observability

For each workflow, log:
- Timestamp.
- Workflow name.
- Booking ID.
- Guest/session ID where appropriate.
- Trigger type.
- Success/failure.
- External API status.
- Error category.
- Notification type.

Never log secrets or unnecessary sensitive guest data.

---

## 13. Deployment

### MVP deployment
- n8n Cloud.
- Telegram bot.
- Google Sheet.
- Claude API credentials.
- OpenWeatherMap API key.
- Static booking simulator.

### Source control
Store:
- Workflow exports without secrets.
- Prompt files.
- Dataset structure/sample data.
- Frontend source.
- Documentation.

Never store:
- Telegram bot token.
- Claude API key.
- OpenWeatherMap API key.
- OAuth secrets.
- Personal access tokens.

---

## 14. Scalability Direction

The MVP's Google Sheet can later be replaced by:
- Database.
- Vector/semantic search layer.
- Curated content service.
- Wayzyy internal APIs.

The n8n orchestration layer can later be supplemented or replaced by a custom backend if traffic, latency or maintainability requires it.

---

## 15. Technical Decision Summary

| Decision | MVP Choice | Reason |
|---|---|---|
| Orchestration | n8n Cloud | Fast visual workflow development |
| LLM | Claude API | AI generation/reasoning |
| Guest channel | Telegram | Fast hackathon setup |
| Local data | Google Sheets | Easy editing/integration |
| Weather | OpenWeatherMap | Live weather input |
| Booking UI | HTML/JS | Minimal demo trigger |
| Database | None required for MVP | Reduce infrastructure |
| Custom backend | Not required | Reduce build/debug time |
