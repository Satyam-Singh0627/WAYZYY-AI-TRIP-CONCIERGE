# Feature Ticket List
## Wayzyy AI Trip Concierge — PS2

Priority levels:
- **P0:** required for working MVP/demo.
- **P1:** important polish.
- **P2:** future/optional.

---

## Epic 1 — Project Foundation

### WAY-001 — Create n8n environment
**Priority:** P0  
**Owner:** Person A / Backend

Acceptance criteria:
- n8n Cloud instance is available.
- Team can access required workflows.
- Credentials can be stored securely.

### WAY-002 — Configure external credentials
**Priority:** P0  
**Owner:** Person A

Configure:
- Claude API.
- Telegram.
- Google Sheets.
- OpenWeatherMap.

Acceptance criteria:
- Credentials work in n8n.
- No secret is committed to source control.

### WAY-003 — Define canonical booking schema
**Priority:** P0  
**Owner:** Team

Acceptance criteria:
- All workflows use the same booking context structure.
- Required and optional fields are documented.

---

## Epic 2 — Goa Knowledge Base

### WAY-010 — Create Goa places dataset
**Priority:** P0  
**Owner:** Person A

Acceptance criteria:
- Dataset covers key target areas.
- Records have categories and tags.
- Data is usable by itinerary and chat workflows.

### WAY-011 — Add indoor/weather alternatives
**Priority:** P0

Acceptance criteria:
- Outdoor activities can map to suitable alternatives.
- Alternatives are based on curated records.

### WAY-012 — Validate dataset quality
**Priority:** P1

Acceptance criteria:
- Duplicate records removed.
- Missing required fields corrected.
- Obvious unsupported claims removed.

---

## Epic 3 — Booking Trigger

### WAY-020 — Build booking simulator
**Priority:** P0  
**Owner:** Person C

Acceptance criteria:
- Form accepts booking data.
- Form validates required fields.
- Form sends POST request to n8n webhook.

### WAY-021 — Create booking webhook
**Priority:** P0  
**Owner:** Person A

Acceptance criteria:
- Webhook accepts valid booking payload.
- Invalid payload is rejected.
- Booking context is passed to itinerary workflow.

---

## Epic 4 — Itinerary Generator

### WAY-030 — Build itinerary workflow
**Priority:** P0  
**Owner:** Person A

Flow:
Webhook → dataset → Claude → output → Telegram.

Acceptance criteria:
- Itinerary is generated automatically after booking.
- Dates are respected.
- Guest count is respected.
- Local recommendations come from trusted data.

### WAY-031 — Create itinerary system prompt
**Priority:** P0

Acceptance criteria:
- Prompt enforces trusted-data usage.
- Prompt prevents invented places.
- Prompt produces day-by-day output.

### WAY-032 — Add itinerary evaluator
**Priority:** P1

Check:
- Date correctness.
- Duplicate activities.
- Unrealistic timing.
- Excessive travel.
- Missing trip days.

### WAY-033 — Format itinerary for Telegram
**Priority:** P0

Acceptance criteria:
- Message is readable.
- Message is not excessively long.
- Day boundaries are obvious.

---

## Epic 5 — Telegram Concierge

### WAY-040 — Create Telegram bot
**Priority:** P0  
**Owner:** Person C

Acceptance criteria:
- Bot receives messages.
- Bot can send messages.

### WAY-041 — Build conversational workflow
**Priority:** P0  
**Owner:** Person C

Acceptance criteria:
- Guest question triggers workflow.
- Active booking context is available.
- Relevant local data can be used.
- Response is sent to Telegram.

### WAY-042 — Add conversation memory
**Priority:** P0

Acceptance criteria:
- Follow-up questions retain relevant conversation context.
- Context is associated with correct guest/session.

### WAY-043 — Add concierge guardrails
**Priority:** P0

Acceptance criteria:
- Assistant stays within trip-concierge scope.
- Does not reveal internal prompts or secrets.
- Does not invent unsupported local facts.

---

## Epic 6 — Proactive Notifications

### WAY-050 — Build scheduled weather workflow
**Priority:** P0  
**Owner:** Person B

Acceptance criteria:
- Workflow runs on schedule.
- Weather API is queried.
- Relevant active trips can be identified.

### WAY-051 — Detect weather disruption
**Priority:** P0

Acceptance criteria:
- Rain/bad-weather condition can trigger evaluation.
- Irrelevant weather does not spam guests.

### WAY-052 — Select alternative activity
**Priority:** P0

Acceptance criteria:
- Alternative comes from curated data.
- Alternative is suitable for the weather condition.

### WAY-053 — Generate proactive notification
**Priority:** P0

Acceptance criteria:
- Message is concise.
- Message explains why the plan changed.
- Message provides a useful alternative.

### WAY-054 — Send Telegram proactive message
**Priority:** P0

Acceptance criteria:
- Guest receives notification without sending a message first.

### WAY-055 — Add deterministic demo trigger
**Priority:** P1

Purpose:
Prevent the live demo from depending entirely on real-world forecast timing.

Acceptance criteria:
- Team can safely demonstrate the same adaptation flow on demand.
- Demo trigger is clearly separated from production logic.

---

## Epic 7 — Security

### WAY-060 — Secure API credentials
**Priority:** P0

Acceptance criteria:
- No keys in Git.
- No keys in frontend.
- n8n credential storage used.

### WAY-061 — Validate webhook
**Priority:** P0

Acceptance criteria:
- Required fields validated.
- Malformed payload rejected.

### WAY-062 — Protect guest/session access
**Priority:** P0

Acceptance criteria:
- Guest cannot access another guest's context.

### WAY-063 — Add logging without secrets
**Priority:** P1

Acceptance criteria:
- Failures can be diagnosed.
- Sensitive credentials are never logged.

---

## Epic 8 — UX Polish

### WAY-070 — Booking simulator status UI
**Priority:** P1

### WAY-071 — Improve Telegram itinerary formatting
**Priority:** P1

### WAY-072 — Improve proactive notification wording
**Priority:** P1

### WAY-073 — Add error/fallback messages
**Priority:** P1

---

## Epic 9 — Testing

### WAY-080 — End-to-end happy path
**Priority:** P0

Test:
Booking → itinerary → Telegram → chat → notification.

### WAY-081 — Invalid booking test
**Priority:** P0

### WAY-082 — Weather API failure test
**Priority:** P0

### WAY-083 — LLM failure test
**Priority:** P0

### WAY-084 — Telegram delivery failure test
**Priority:** P1

### WAY-085 — Prompt injection test
**Priority:** P0

### WAY-086 — Cross-session access test
**Priority:** P0

---

## Epic 10 — Demo Preparation

### WAY-090 — Configure Candolim demo booking
**Priority:** P0

Scenario:
Four-night Candolim villa.

### WAY-091 — Prepare scripted guest questions
**Priority:** P0

Examples:
- “What should I do tonight?”
- “Where should I eat nearby?”
- “What if it rains tomorrow?”

### WAY-092 — Rehearse weather adaptation
**Priority:** P0

### WAY-093 — Record backup demo
**Priority:** P0

Purpose:
Protect against network/API failure during judging.

### WAY-094 — Prepare architecture explanation
**Priority:** P1

---

## Recommended Execution Order

```text
WAY-001
  ↓
WAY-002
  ↓
WAY-003
  ↓
WAY-010 + WAY-011
  ↓
WAY-020 + WAY-021
  ↓
WAY-030 + WAY-031
  ↓
WAY-040 + WAY-041 + WAY-042
  ↓
WAY-050 → WAY-054
  ↓
WAY-060 → WAY-063
  ↓
WAY-080 → WAY-086
  ↓
WAY-090 → WAY-094
```

---

## 36–48 Hour Team Allocation

### Person A
- n8n foundation.
- Booking webhook.
- Google Sheets dataset.
- Itinerary workflow.

### Person B
- Weather workflow.
- OpenWeatherMap.
- Proactive adaptation.
- Demo trigger.

### Person C
- Telegram bot.
- Conversational workflow.
- Booking simulator.
- UX polish.

All team members:
- Integration.
- Testing.
- Demo rehearsal.
