// ============================================================
// WAYZYY — BOUTIQUE AI TRAVEL CONCIERGE APPLICATION CONTROLLER
// Client-Side Router · Multi-Route Architecture · Demo Flow
// ============================================================

const state = {
  currentRoute: '/',
  currentAppSub: 'overview',
  activeBooking: null,
  activeItinerary: null,
  activeWeather: null,
  activeForecast: null,
  notifications: [],
  selectedDay: 'all',
  currentDemoStep: 0,
  tutorialStep: 0,
  exploreQuery: '',
  exploreCategory: 'all',
  explorePlaces: []
};

// Tutorial Content
const tutorialSteps = [
  {
    icon: "🏨",
    title: "1. Your trip starts with your booking",
    desc: "WAYZYY ingests your property reservation, travel dates, and guest party size to establish your personal travel context."
  },
  {
    icon: "🗓",
    title: "2. Your itinerary is personalized",
    desc: "A bespoke 4-slot daily schedule (Morning, Lunch, Evening, Dinner) is curated specifically for your pace and interests."
  },
  {
    icon: "⛅",
    title: "3. WAYZYY watches the weather",
    desc: "Live forecasts and hourly rain probabilities in North Goa are monitored continuously to anticipate disruptions."
  },
  {
    icon: "🌧",
    title: "4. Your plans adapt automatically",
    desc: "When rain threatens outdoor beach time, sheltered cultural alternatives are substituted and proactive alerts are sent."
  },
  {
    icon: "💬",
    title: "5. Ask your concierge anything",
    desc: "Chat naturally anytime for local dining recommendations, area secrets, or instant schedule changes."
  }
];

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  setupNavigationRouter();
  setupDemoGuideFlow();
  setupBookingForm();
  setupItineraryHandlers();
  setupExploreView();
  setupConciergeChat();
  setupWeatherControls();
  setupTutorialModal();
  setupMobileCompanion();
  setupBottomSheet();
  setupMapModal();

  // Initial Route Resolution from Pathname
  const initialPath = window.location.pathname;
  navigate(initialPath || '/', false);

  // Auto-initialize demo booking in background so App Hub is immediately ready
  initializeDefaultBooking();
});

// ============================================================
// ROUTING & NAVIGATION
// ============================================================
function setupNavigationRouter() {
  // Intercept all links or buttons with data-route
  document.addEventListener('click', (e) => {
    const routeTarget = e.target.closest('[data-route]');
    if (routeTarget) {
      e.preventDefault();
      const targetRoute = routeTarget.getAttribute('data-route');
      navigate(targetRoute, true);
    }

    // App sidebar and mobile sub-navigation
    const subTarget = e.target.closest('[data-sub]');
    if (subTarget) {
      e.preventDefault();
      const sub = subTarget.getAttribute('data-sub');
      if (!state.currentRoute.startsWith('/app')) {
        navigate(`/app/${sub}`, true);
      } else {
        switchAppSubView(sub, true);
      }
    }
  });

  // Handle browser back/forward
  window.addEventListener('popstate', (e) => {
    const route = e.state?.route || window.location.pathname || '/';
    navigate(route, false);
  });
}

function navigate(route, pushState = true) {
  state.currentRoute = route;

  if (pushState && window.location.pathname !== route) {
    history.pushState({ route }, '', route);
  }

  // Update Global Nav link active states
  document.querySelectorAll('.global-nav .nav-link').forEach(link => {
    const linkRoute = link.getAttribute('data-route');
    if (route === '/' && linkRoute === '/') {
      link.classList.add('active');
    } else if (linkRoute !== '/' && route.startsWith(linkRoute)) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Hide all primary view containers
  document.querySelectorAll('.view-container').forEach(v => v.classList.remove('active'));

  // Route matching
  if (route === '/' || route === '') {
    showView('viewHome');
  } else if (route.startsWith('/destinations')) {
    showView('viewDestinations');
  } else if (route.startsWith('/features')) {
    showView('viewFeatures');
  } else if (route.startsWith('/how-it-works')) {
    showView('viewHowItWorks');
  } else if (route.startsWith('/book')) {
    showView('viewBook');
  } else if (route.startsWith('/app')) {
    showView('viewApp');
    // Extract sub-route e.g. /app/itinerary -> itinerary
    const parts = route.split('/').filter(Boolean);
    const sub = parts[1] || 'overview';
    switchAppSubView(sub, false);
  } else {
    showView('viewHome');
  }

  window.scrollTo({ top: 0, behavior: 'instant' });
}

function showView(viewId) {
  const el = document.getElementById(viewId);
  if (el) el.classList.add('active');
}

function switchAppSubView(subName, updateUrl = true) {
  state.currentAppSub = subName;

  if (updateUrl) {
    const targetUrl = `/app/${subName}`;
    if (window.location.pathname !== targetUrl) {
      history.pushState({ route: targetUrl }, '', targetUrl);
    }
  }

  // Update sidebar buttons
  document.querySelectorAll('.app-menu-item').forEach(btn => {
    if (btn.getAttribute('data-sub') === subName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Update mobile bottom nav items
  document.querySelectorAll('.mobile-nav-item').forEach(btn => {
    if (btn.getAttribute('data-sub') === subName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Toggle subviews
  document.querySelectorAll('.app-subview').forEach(v => v.style.display = 'none');

  const subMap = {
    overview: 'subViewOverview',
    itinerary: 'subViewItinerary',
    explore: 'subViewExplore',
    concierge: 'subViewConcierge',
    weather: 'subViewWeather',
    notifications: 'subViewNotifications',
    settings: 'subViewSettings'
  };

  const activeId = subMap[subName] || 'subViewOverview';
  const targetSubView = document.getElementById(activeId);
  if (targetSubView) {
    targetSubView.style.display = 'block';
  }

  // Refresh relevant subview data
  if (subName === 'weather') {
    refreshWeatherView();
  } else if (subName === 'notifications') {
    renderNotifications();
  } else if (subName === 'itinerary') {
    renderItinerary();
  } else if (subName === 'explore') {
    loadExplorePlaces();
  }
}

// ============================================================
// HACKATHON GUIDED DEMO BAR FOR JUDGES (Steps 1–7)
// ============================================================
function setupDemoGuideFlow() {
  document.querySelectorAll('.demo-step-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const step = parseInt(btn.getAttribute('data-step'), 10);
      runDemoStep(step);
    });
  });
}

async function runDemoStep(stepNumber) {
  state.currentDemoStep = stepNumber;
  highlightDemoStep(stepNumber);

  switch (stepNumber) {
    case 1:
      // STEP 1: Load Demo Trip
      navigate('/book', true);
      prefillDemoForm();
      showToast('Step 1: Demo trip loaded into reservation form.');
      break;

    case 2:
      // STEP 2: Confirm Booking
      navigate('/book', true);
      const form = document.getElementById('mainBookingForm');
      if (form) {
        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
      break;

    case 3:
      // STEP 3: View Itinerary
      navigate('/app/itinerary', true);
      filterDay('all');
      showToast('Step 3: Viewing date-aligned 4-day itinerary.');
      break;

    case 4:
      // STEP 4: Ask Concierge
      navigate('/app/concierge', true);
      await sendConciergeMessage("What should I do tomorrow?");
      showToast('Step 4: Concierge answered using Day 2 itinerary context.');
      break;

    case 5:
      // STEP 5: Simulate Rain
      await triggerWeatherScenario('rain');
      navigate('/app/weather', true);
      showToast('Step 5: Simulated heavy tropical rain in Candolim.');
      break;

    case 6:
      // STEP 6: Watch Itinerary Adapt
      navigate('/app/itinerary', true);
      filterDay('2');
      showToast('Step 6: Day 2 beach plan automatically substituted with indoor museum!');
      break;

    case 7:
      // STEP 7: Re-ask Concierge about new plan
      navigate('/app/concierge', true);
      await sendConciergeMessage("What can I do instead?");
      showToast('Step 7: Concierge acknowledges weather adaptation with indoor alternatives.');
      break;
  }
}

function highlightDemoStep(stepNumber) {
  document.querySelectorAll('.demo-step-btn').forEach(b => {
    const s = parseInt(b.getAttribute('data-step'), 10);
    b.classList.remove('current', 'done');
    if (s < stepNumber) {
      b.classList.add('done');
    } else if (s === stepNumber) {
      b.classList.add('current');
    }
  });
}

// ============================================================
// DEFAULT BOOKING & DEMO STATE
// ============================================================
async function initializeDefaultBooking() {
  if (state.activeBooking) return;

  try {
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guest_name: 'Rahul Sharma',
        guest_id: 'GST-RAHUL-44',
        telegram_chat_id: '987654321',
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
      })
    });

    const data = await res.json();
    if (data.success && data.booking) {
      state.activeBooking = data.booking;
      state.activeItinerary = data.itinerary;
      updateBookingHeaderInfo();
      renderItinerary();
      renderTodayPlan();
      fetchWeather();
      loadNotifications();
    }
  } catch (err) {
    console.warn('Could not initialize default booking:', err);
  }
}

function updateBookingHeaderInfo() {
  if (!state.activeBooking) return;
  const b = state.activeBooking;

  // Sidebar
  const sideProp = document.getElementById('sidePropName');
  if (sideProp) sideProp.textContent = b.property?.name || 'Candolim Luxury Villa';

  const sideArea = document.getElementById('sidePropArea');
  if (sideArea) sideArea.textContent = `📍 ${b.property?.area || 'Candolim'}, Goa`;

  const sideDates = document.getElementById('sideTripDates');
  if (sideDates) sideDates.textContent = `🗓 15–19 Oct 2026 (${b.trip?.nights || 4} Nights)`;

  const sideGuest = document.getElementById('sideGuestCount');
  if (sideGuest) sideGuest.textContent = `👤 ${b.guest_name} · ${b.trip?.guest_count || 2} Guests`;

  // Overview
  const ovTitle = document.getElementById('ovGuestTitle');
  if (ovTitle) ovTitle.textContent = b.guest_name;

  const ovStay = document.getElementById('ovStayDetails');
  if (ovStay) ovStay.textContent = `${b.property?.name} · 15–19 October 2026 · ${b.trip?.guest_count || 2} Guests`;

  // Concierge Context Box
  const ctxGuest = document.getElementById('ctxBoxGuest');
  if (ctxGuest) ctxGuest.textContent = b.guest_name;

  const ctxProp = document.getElementById('ctxBoxProp');
  if (ctxProp) ctxProp.textContent = b.property?.name;
}

// ============================================================
// BOOKING FORM SUBMISSION
// ============================================================
function setupBookingForm() {
  const form = document.getElementById('mainBookingForm');
  if (!form) return;

  const prefillBtn = document.getElementById('btnPrefillDemo');
  if (prefillBtn) {
    prefillBtn.addEventListener('click', prefillDemoForm);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const btnSubmit = document.getElementById('btnSubmitBooking');
    if (btnSubmit) btnSubmit.disabled = true;

    const progressBox = document.getElementById('bookingProgressBox');
    if (progressBox) progressBox.style.display = 'block';

    const formData = new FormData(form);
    const guest_name = formData.get('guest_name');
    const property_name = formData.get('property_name');
    const property_area = formData.get('property_area');
    const check_in = formData.get('check_in');
    const check_out = formData.get('check_out');
    const guest_count = parseInt(formData.get('guest_count'), 10) || 2;
    const pace = formData.get('pace') || 'relaxed';
    const vibe = formData.getAll('vibe');

    // Multi-step animated progress simulation
    const setStep = (id, active = true, done = false) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.className = `progress-step-item ${active ? 'active' : ''} ${done ? 'done' : ''}`;
      if (done) el.innerHTML = `<span>✓</span> ${el.textContent.slice(2)}`;
    };

    setStep('pstep1', true);
    await new Promise(r => setTimeout(r, 300));
    setStep('pstep1', false, true);

    setStep('pstep2', true);
    await new Promise(r => setTimeout(r, 350));
    setStep('pstep2', false, true);

    setStep('pstep3', true);
    await new Promise(r => setTimeout(r, 400));
    setStep('pstep3', false, true);

    setStep('pstep4', true);

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guest_name,
          property: { name: property_name, area: property_area },
          trip: { destination: 'Goa', check_in, check_out, guest_count },
          preferences: { vibe, pace }
        })
      });

      const data = await res.json();
      if (data.success && data.booking) {
        state.activeBooking = data.booking;
        state.activeItinerary = data.itinerary;
        setStep('pstep4', false, true);
        setStep('pstep5', false, true);

        updateBookingHeaderInfo();
        renderItinerary();
        renderTodayPlan();

        showToast('Booking confirmed! Redirecting to your concierge hub...');

        setTimeout(() => {
          if (btnSubmit) btnSubmit.disabled = false;
          navigate('/app/overview', true);
        }, 600);
      } else {
        throw new Error(data.error || 'Failed to create booking');
      }
    } catch (err) {
      alert(`Booking error: ${err.message}`);
      if (btnSubmit) btnSubmit.disabled = false;
    }
  });
}

function prefillDemoForm() {
  const gName = document.getElementById('bookGuestName');
  if (gName) gName.value = 'Rahul Sharma';

  const pName = document.getElementById('bookPropertyName');
  if (pName) pName.value = 'Casa Candolim Luxury Villa';

  const pArea = document.getElementById('bookPropertyArea');
  if (pArea) pArea.value = 'Candolim';

  const cIn = document.getElementById('bookCheckIn');
  if (cIn) cIn.value = '2026-10-15';

  const cOut = document.getElementById('bookCheckOut');
  if (cOut) cOut.value = '2026-10-19';

  const gCount = document.getElementById('bookGuestCount');
  if (gCount) gCount.value = '2';

  const pace = document.getElementById('bookPace');
  if (pace) pace.value = 'relaxed';
}

// ============================================================
// ITINERARY RENDERING & NAVIGATION
// ============================================================
function setupItineraryHandlers() {
  const dayTabs = document.getElementById('itinDayTabs');
  if (dayTabs) {
    dayTabs.addEventListener('click', (e) => {
      const tab = e.target.closest('[data-day]');
      if (tab) {
        const day = tab.getAttribute('data-day');
        filterDay(day);
      }
    });
  }

  const btnItinConcierge = document.getElementById('btnItinAskConcierge');
  if (btnItinConcierge) {
    btnItinConcierge.addEventListener('click', () => {
      switchAppSubView('concierge', true);
    });
  }

  const btnOvItin = document.getElementById('btnOvOpenItinerary');
  if (btnOvItin) {
    btnOvItin.addEventListener('click', () => switchAppSubView('itinerary', true));
  }

  const btnOvAdapt = document.getElementById('btnOvViewAdaptation');
  if (btnOvAdapt) {
    btnOvAdapt.addEventListener('click', () => {
      switchAppSubView('itinerary', true);
      filterDay('2');
    });
  }

  const itinTimeline = document.getElementById('itinTimelineContainer');
  if (itinTimeline) {
    itinTimeline.addEventListener('click', (e) => {
      const card = e.target.closest('.slot-item-card');
      if (card) {
        const slotData = {
          day: card.getAttribute('data-day'),
          slot_name: card.getAttribute('data-slot-name'),
          place_name: card.getAttribute('data-place-name'),
          area: card.getAttribute('data-area'),
          category: card.getAttribute('data-category'),
          distance: card.getAttribute('data-distance'),
          time: card.getAttribute('data-time'),
          why_match: card.getAttribute('data-why'),
          indoor_outdoor: card.getAttribute('data-indoor')
        };
        openBottomSheet(slotData);
      }
    });
  }
}

function filterDay(dayStr) {
  state.selectedDay = dayStr;

  document.querySelectorAll('#itinDayTabs .day-nav-tab').forEach(t => {
    if (t.getAttribute('data-day') === dayStr) {
      t.classList.add('active');
    } else {
      t.classList.remove('active');
    }
  });

  renderItinerary();
}

function renderItinerary() {
  const container = document.getElementById('itinTimelineContainer');
  if (!container || !state.activeItinerary || !state.activeItinerary.days) return;

  const daysToRender = state.selectedDay === 'all'
    ? state.activeItinerary.days
    : state.activeItinerary.days.filter(d => d.day_number.toString() === state.selectedDay);

  container.innerHTML = daysToRender.map(day => {
    const isAdaptedDay = day.items.some(it => it.is_adapted);

    const slotCards = day.items.map(slot => {
      const isAdapted = slot.is_adapted;
      const outdoorClass = slot.indoor_outdoor === 'indoor' ? 'indoor' : (slot.indoor_outdoor === 'covered' ? 'covered' : 'outdoor');
      const outdoorLabel = slot.indoor_outdoor === 'indoor' ? 'Indoor Rain-Safe' : (slot.indoor_outdoor === 'covered' ? 'Covered Veranda' : 'Outdoor Setting');
      const categoryLabel = (slot.category || slot.type || 'Activity').toUpperCase();
      const distanceText = slot.distance_from_hotel_km !== undefined
        ? `${slot.distance_from_hotel_km} km from stay`
        : (slot.area || 'Candolim');
      const travelText = slot.travel_time_mins ? ` · 🚗 ${slot.travel_time_mins} min drive` : '';

      return `
        <div class="slot-item-card ${isAdapted ? 'is-adapted' : ''}" 
             data-day="${day.day_number}" 
             data-slot-name="${slot.slot_name || ''}" 
             data-place-name="${slot.place_name}" 
             data-area="${slot.area || 'Candolim'}" 
             data-category="${categoryLabel}"
             data-time="${slot.time}" 
             data-distance="${distanceText}${travelText}"
             data-why="${slot.why_match || ''}" 
             data-indoor="${slot.indoor_outdoor || 'outdoor'}" 
             style="cursor: pointer;" 
             title="Tap for options & directions">
          <div>
            <div class="slot-header">
              <span class="slot-name">${slot.slot_name || 'ACTIVITY'}</span>
              <span class="slot-time">${slot.time}</span>
            </div>
            <h4 class="slot-place">${slot.place_name}</h4>
            <div class="slot-badges-row">
              <span class="slot-badge ${outdoorClass}">${outdoorLabel}</span>
              <span class="slot-badge" style="background: rgba(255, 106, 0, 0.12); color: var(--color-orange); font-weight: 700;">${categoryLabel}</span>
              ${isAdapted ? '<span class="slot-badge adapted">WEATHER ADAPTED</span>' : ''}
              <span class="slot-badge" style="background: var(--bg-secondary); color: var(--text-muted);">📍 ${distanceText}${travelText}</span>
            </div>
            <p class="slot-desc">${slot.activity || slot.description || ''}</p>
          </div>
          <div>
            <div class="slot-why">💡 ${slot.why_match || 'Curated to match your relaxed coastal stay.'}</div>
          </div>
        </div>
      `;
    }).join('');

    const lunchName = typeof day.food_suggestion?.lunch === 'object' ? day.food_suggestion.lunch.name : day.food_suggestion?.lunch;
    const dinnerName = typeof day.food_suggestion?.dinner === 'object' ? day.food_suggestion.dinner.name : day.food_suggestion?.dinner;

    return `
      <div class="day-block-card ${isAdaptedDay ? 'day-adapted' : ''}" id="dayBlock-${day.day_number}">
        <div class="day-block-header">
          <div>
            <h3 class="day-block-title">Day ${day.day_number} · ${day.display_date || day.date}</h3>
            <div class="day-block-theme">${day.theme}</div>
          </div>
          ${isAdaptedDay ? '<span class="status-pill ready">WEATHER ADAPTATION ACTIVE</span>' : ''}
        </div>

        <div class="slots-grid">
          ${slotCards}
        </div>

        <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center; font-size: 12.5px; color: var(--text-secondary); flex-wrap: wrap; gap: 8px;">
          <div>🍽 <strong>Verified Dining:</strong> Lunch: <em>${lunchName || 'Local Goan Shack'}</em> · Dinner: <em>${dinnerName || 'Coastal Courtyard Dining'}</em></div>
          <div>💡 <strong>Concierge Tip:</strong> ${day.concierge_tip || 'Keep some cash handy for beach shacks.'}</div>
        </div>
      </div>
    `;
  }).join('');
}

function renderTodayPlan() {
  const list = document.getElementById('ovTodayPlanList');
  if (!list || !state.activeItinerary || !state.activeItinerary.days) return;

  const day1 = state.activeItinerary.days[0];
  if (!day1) return;

  list.innerHTML = day1.items.map(it => `
    <div class="overview-plan-item">
      <div class="plan-item-time">${it.time}</div>
      <div>
        <div class="plan-item-title">${it.place_name}</div>
        <div class="plan-item-sub">${it.slot_name || ''} · ${it.area || 'Candolim'}</div>
      </div>
    </div>
  `).join('');
}

// ============================================================
// EXPLORE GOA DESTINATIONS (/app/explore)
// Geospatial search · Weather suitability · GTDC & OSM Places
// ============================================================
function setupExploreView() {
  const input = document.getElementById('exploreSearchInput');
  const btnSearch = document.getElementById('btnExploreSearch');
  const chipsContainer = document.getElementById('exploreFilterChips');

  if (input) {
    let debounceTimer;
    input.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        state.exploreQuery = input.value.trim();
        loadExplorePlaces();
      }, 300);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        clearTimeout(debounceTimer);
        state.exploreQuery = input.value.trim();
        loadExplorePlaces();
      }
    });
  }

  if (btnSearch) {
    btnSearch.addEventListener('click', () => {
      if (input) state.exploreQuery = input.value.trim();
      loadExplorePlaces();
    });
  }

  if (chipsContainer) {
    chipsContainer.addEventListener('click', (e) => {
      const chip = e.target.closest('.quick-chip');
      if (!chip) return;
      chipsContainer.querySelectorAll('.quick-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.exploreCategory = chip.getAttribute('data-cat') || 'all';
      loadExplorePlaces();
    });
  }
}

async function loadExplorePlaces() {
  const grid = document.getElementById('explorePlacesGrid');
  const countEl = document.getElementById('exploreResultsCount');
  if (!grid) return;

  grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">Loading destination intelligence...</div>`;

  try {
    let url;
    if (state.exploreCategory === 'near_me') {
      const lat = state.activeBooking?.property?.coordinates?.lat || 15.5178;
      const lon = state.activeBooking?.property?.coordinates?.lng || 73.7634;
      url = `/api/places/nearby?lat=${lat}&lon=${lon}&radius=20&limit=30`;
    } else {
      const params = new URLSearchParams();
      if (state.exploreQuery) params.set('q', state.exploreQuery);
      if (state.exploreCategory && state.exploreCategory !== 'all') {
        params.set('category', state.exploreCategory);
      }
      params.set('limit', '30');
      url = `/api/places/search?${params.toString()}`;
    }

    const res = await fetch(url);
    const data = await res.json();
    const places = data.places || data.results || [];
    state.explorePlaces = places;

    if (countEl) {
      countEl.textContent = `Showing ${places.length} verified destination${places.length === 1 ? '' : 's'}`;
    }

    if (places.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 48px 20px; background: var(--bg-card); border-radius: var(--radius-md); border: 1px dashed var(--border-color);">
          <div style="font-size: 32px; margin-bottom: 12px;">🔍</div>
          <h3 style="font-family: var(--font-serif); font-size: 18px; margin-bottom: 6px;">No destinations matched your search</h3>
          <p style="font-size: 13px; color: var(--text-muted);">Try a broader query or select another category filter.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = places.map(place => {
      const isIndoor = place.indoor_outdoor === 'indoor';
      const weatherFit = place.weather_fit?.rain >= 0.7 ? '🌧 Rain Safe' : '☀️ Dry Preferred';
      const sourceBadge = place.source === 'goa_tourism' ? 'GTDC Official' : (place.source === 'openstreetmap' ? 'OpenStreetMap' : 'Curated');
      const distStr = place.distance_km ? `${place.distance_km} km away` : (place.region === 'north' ? 'North Goa' : 'South Goa');
      const categoryName = Array.isArray(place.categories) && place.categories.length > 0 ? place.categories[0] : (place.type || 'Attraction');

      return `
        <div class="explore-card" data-id="${place.id}">
          <div class="explore-card-top">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 8px;">
              <span class="explore-source-badge">${sourceBadge}</span>
              <span style="font-size: 11px; font-weight: 600; color: var(--text-muted);">${distStr}</span>
            </div>
            <h3 class="explore-title">${place.name}</h3>
            <div class="explore-badges">
              <span class="slot-badge ${isIndoor ? 'indoor' : 'outdoor'}">${isIndoor ? 'Indoor' : 'Outdoor'}</span>
              <span class="slot-badge" style="background: rgba(41,40,33,0.06); color: var(--text-primary); font-size: 10.5px;">${categoryName}</span>
              <span class="slot-badge" style="background: rgba(201,107,75,0.1); color: var(--color-terracotta); font-size: 10.5px;">${weatherFit}</span>
            </div>
            <p class="explore-desc">${place.description || 'Authentic Goa experience curated for your itinerary.'}</p>
            ${place.highlights && place.highlights.length > 0 ? `<div class="explore-highlights">✨ <span>${place.highlights.slice(0, 2).join(' · ')}</span></div>` : ''}
          </div>

          <div class="explore-card-footer">
            <span class="explore-area-tag">📍 ${place.area || 'Goa'}</span>
            <button type="button" class="btn-explore-add" onclick="window.addPlaceToItinerary('${place.id}')">+ Add to Itinerary</button>
          </div>
        </div>
      `;
    }).join('');

  } catch (err) {
    console.error('Failed to load explore places:', err);
    grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: red; padding: 24px;">Failed to load places: ${err.message}</div>`;
  }
}

async function addPlaceToItinerary(placeId) {
  const bookingId = state.activeBooking?.booking_id || 'DEMO-8821';
  try {
    const res = await fetch('/api/concierge/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        booking_id: bookingId,
        action: 'add_activity',
        params: { place_id: placeId, time: '16:00' }
      })
    });
    const data = await res.json();
    if (data.success && data.itinerary) {
      state.activeItinerary = data.itinerary;
      renderItinerary();
      renderTodayPlan();
      showToast(data.message || 'Added to your itinerary! View under Itinerary tab.');
    } else {
      showToast(data.message || 'Could not add to itinerary.');
    }
  } catch (err) {
    showToast('Failed to add activity to itinerary.');
  }
}

window.addPlaceToItinerary = addPlaceToItinerary;

// ============================================================
// CONCIERGE CHAT & CONVERSATIONAL ACTIONS
// ============================================================
function setupConciergeChat() {
  const form = document.getElementById('conciergeChatForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = document.getElementById('conciergeChatInput');
      if (!input || !input.value.trim()) return;
      const text = input.value.trim();
      input.value = '';
      await sendConciergeMessage(text);
    });
  }

  // Quick query chips in chat header
  document.querySelectorAll('.chat-quick-queries .quick-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const q = chip.getAttribute('data-query');
      if (q) sendConciergeMessage(q);
    });
  });

  // Overview quick query buttons
  document.querySelectorAll('.ov-chip-shortcut').forEach(btn => {
    btn.addEventListener('click', () => {
      const msg = btn.getAttribute('data-msg');
      switchAppSubView('concierge', true);
      sendConciergeMessage(msg);
    });
  });

  const btnOvChat = document.getElementById('btnOvOpenChat');
  if (btnOvChat) {
    btnOvChat.addEventListener('click', () => switchAppSubView('concierge', true));
  }

  // Quick action sidebar buttons
  document.querySelectorAll('.quick-action-trigger').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.getAttribute('data-action');
      executeConciergeAction(action, { day: 2 });
    });
  });

  // Delegate action buttons inside chat bubbles
  document.addEventListener('click', (e) => {
    const actBtn = e.target.closest('.chat-action-btn');
    if (actBtn) {
      const action = actBtn.getAttribute('data-action');
      const day = parseInt(actBtn.getAttribute('data-day'), 10) || 2;
      const place_id = actBtn.getAttribute('data-place');

      if (action === 'navigate_weather') {
        switchAppSubView('weather', true);
      } else if (action === 'navigate_itinerary') {
        switchAppSubView('itinerary', true);
        filterDay(day.toString());
      } else {
        executeConciergeAction(action, { day, place_id });
      }
    }
  });

  // Initial Welcome Message
  appendChatMessage({
    sender: 'concierge',
    message: "Warm greetings! I am your Wayzyy Trip Concierge for Goa. Your reservation at **Casa Candolim Luxury Villa** is confirmed. I am monitoring live weather and ready to adapt your schedule or recommend local secrets whenever you need."
  });
}

async function sendConciergeMessage(messageText) {
  if (!state.activeBooking) return;

  // Append user message immediately
  appendChatMessage({ sender: 'guest', message: messageText });

  const bId = state.activeBooking.booking_id;

  try {
    const res = await fetch('/api/concierge/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booking_id: bId, message: messageText })
    });

    const data = await res.json();
    if (data.success) {
      appendChatMessage({
        sender: 'concierge',
        message: data.reply,
        actions: data.suggested_actions || []
      });
    }
  } catch (err) {
    appendChatMessage({
      sender: 'concierge',
      message: "I'm having a brief connection delay checking our local Goa directory. Please ask again in just a moment."
    });
  }
}

function appendChatMessage({ sender, message, actions = [] }) {
  const container = document.getElementById('conciergeMessagesLog');
  if (!container) return;

  const bubble = document.createElement('div');
  bubble.className = `chat-bubble bubble-${sender}`;

  // Simple markdown bold formatting
  const formattedText = message
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');

  let actionsHtml = '';
  if (actions && actions.length > 0) {
    actionsHtml = `
      <div class="chat-action-chips">
        ${actions.map(a => `<button type="button" class="chat-action-btn" data-action="${a.action}" data-day="${a.day || 2}" data-place="${a.place_id || ''}">${a.label}</button>`).join('')}
      </div>
    `;
  }

  bubble.innerHTML = `
    <div class="bubble-sender">${sender === 'guest' ? 'You' : 'Wayzyy Concierge'}</div>
    <div class="bubble-text"><p>${formattedText}</p></div>
    ${actionsHtml}
  `;

  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;
}

async function executeConciergeAction(action, params = {}) {
  if (!state.activeBooking) return;

  try {
    const res = await fetch('/api/concierge/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        booking_id: state.activeBooking.booking_id,
        action,
        params
      })
    });

    const data = await res.json();
    if (data.success) {
      state.activeItinerary = data.itinerary;
      renderItinerary();
      renderTodayPlan();
      showToast(data.message || 'Itinerary updated!');
      appendChatMessage({
        sender: 'concierge',
        message: `✓ **Done!** ${data.message || 'I have updated your schedule.'}`
      });
    }
  } catch (err) {
    console.error('Error executing action:', err);
  }
}

// ============================================================
// WEATHER MONITORING & SCENARIO SIMULATION
// ============================================================
function setupWeatherControls() {
  const btnRain = document.getElementById('btnWeatherSimRain');
  if (btnRain) {
    btnRain.addEventListener('click', () => triggerWeatherScenario('rain'));
  }

  const btnClear = document.getElementById('btnWeatherSimClear');
  if (btnClear) {
    btnClear.addEventListener('click', () => triggerWeatherScenario('clear'));
  }

  const btnAlertView = document.getElementById('btnAlertViewPlan');
  if (btnAlertView) {
    btnAlertView.addEventListener('click', () => {
      navigate('/app/itinerary', true);
      filterDay('2');
    });
  }

  const btnAlertChat = document.getElementById('btnAlertAskConcierge');
  if (btnAlertChat) {
    btnAlertChat.addEventListener('click', () => {
      navigate('/app/concierge', true);
      sendConciergeMessage("What can I do instead?");
    });
  }

  const btnDismissAlert = document.getElementById('btnDismissAlert');
  if (btnDismissAlert) {
    btnDismissAlert.addEventListener('click', () => {
      document.getElementById('proactiveAlertBanner').style.display = 'none';
    });
  }

  const btnOvWeather = document.getElementById('btnOvOpenWeather');
  if (btnOvWeather) {
    btnOvWeather.addEventListener('click', () => switchAppSubView('weather', true));
  }

  const btnWeatherAdapt = document.getElementById('btnApplyAdaptationWeather');
  if (btnWeatherAdapt) {
    btnWeatherAdapt.addEventListener('click', () => {
      switchAppSubView('itinerary', true);
      filterDay('2');
    });
  }

  const btnWeatherAsk = document.getElementById('btnAskConciergeWeather');
  if (btnWeatherAsk) {
    btnWeatherAsk.addEventListener('click', () => {
      switchAppSubView('concierge', true);
      sendConciergeMessage("What should I do instead of the beach?");
    });
  }
}

async function fetchWeather() {
  try {
    const res = await fetch('/api/weather');
    const data = await res.json();
    state.activeWeather = data;
    updateWeatherUI(data);
  } catch (err) {
    console.warn('Could not fetch current weather:', err);
  }
}

function updateWeatherUI(w) {
  const icon = w.is_raining ? '🌧' : '☀️';

  // Sidebar widget
  const sTemp = document.getElementById('sideWeatherTemp');
  if (sTemp) sTemp.textContent = `${w.temp}°C`;
  const sCond = document.getElementById('sideWeatherCond');
  if (sCond) sCond.textContent = w.condition;
  const sIcon = document.getElementById('sideWeatherIcon');
  if (sIcon) sIcon.textContent = icon;

  // Overview widget
  const ovTemp = document.getElementById('ovWeatherTemp');
  if (ovTemp) ovTemp.textContent = `${w.temp}°C`;
  const ovCond = document.getElementById('ovWeatherCond');
  if (ovCond) ovCond.textContent = w.description || w.condition;
  const ovRisk = document.getElementById('ovRainRisk');
  if (ovRisk) ovRisk.textContent = `${w.rain_probability}%`;
  const ovIcon = document.getElementById('ovWeatherIcon');
  if (ovIcon) ovIcon.textContent = icon;
  const ovTomorrow = document.getElementById('ovTomorrowBrief');
  if (ovTomorrow) {
    ovTomorrow.textContent = w.is_raining
      ? `Heavy tropical monsoon showers (rain risk: ${w.rain_probability}%)`
      : `Warm and clear coastal skies (rain risk: ${w.rain_probability}%)`;
  }
}

async function refreshWeatherView() {
  if (!state.activeBooking) return;
  const bId = state.activeBooking.booking_id;

  try {
    const res = await fetch(`/api/weather/forecast/${bId}`);
    const data = await res.json();
    if (data.success) {
      state.activeForecast = data;

      // Update 4 stats
      const sT = document.getElementById('statTemp');
      if (sT) sT.textContent = `${data.current.temp}°C`;
      const sR = document.getElementById('statRain');
      if (sR) sR.textContent = `${data.current.rain_probability}%`;
      const sH = document.getElementById('statHumidity');
      if (sH) sH.textContent = `${data.current.humidity}%`;
      const sW = document.getElementById('statWind');
      if (sW) sW.textContent = `${data.current.wind_speed_kmh} km/h`;

      const condEl = document.getElementById('weatherConditionFull');
      if (condEl) condEl.textContent = data.current.description;
      const bigIcon = document.getElementById('weatherBigIcon');
      if (bigIcon) bigIcon.textContent = data.current.is_raining ? '🌧' : '☀️';

      // Conflict warning box
      const conflictBox = document.getElementById('weatherConflictBox');
      if (conflictBox) {
        if (data.has_conflict) {
          conflictBox.style.display = 'block';
          const details = document.getElementById('weatherConflictDetails');
          if (details && data.conflicts[0]) {
            details.innerHTML = `High rain probability (${data.current.rain_probability}%) forecasted for tomorrow. Scheduled outdoor plan <strong>${data.conflicts[0].activity}</strong> is at risk.`;
          }
        } else {
          conflictBox.style.display = 'none';
        }
      }

      // Render Hourly Strip
      const hourlyStrip = document.getElementById('hourlyStrip');
      if (hourlyStrip && data.hourly) {
        hourlyStrip.innerHTML = data.hourly.map(h => {
          const isRainy = (typeof h.rain_probability === 'number' && h.rain_probability >= 50) || (h.icon && h.icon.includes('🌧'));
          return `
          <div class="hourly-card ${isRainy ? 'is-rainy' : ''}" title="${h.condition || ''}">
            <div class="hourly-time">${h.time}</div>
            <div class="hourly-icon">${h.icon}</div>
            <div class="hourly-temp">${h.temp}°C</div>
            <div class="hourly-rain ${isRainy ? 'rain-alert' : ''}">💧 ${h.rain_probability}%</div>
          </div>
        `;
        }).join('');
      }

      // Render Daily Grid
      const dailyGrid = document.getElementById('dailyForecastGrid');
      if (dailyGrid && data.daily) {
        dailyGrid.innerHTML = data.daily.map(d => `
          <div class="pillar-card" style="padding: 16px;">
            <div class="pillar-step">${d.day}</div>
            <div style="font-size: 24px; margin: 6px 0;">${d.icon}</div>
            <div style="font-weight: 700; font-size: 16px;">${d.temp_max}° / ${d.temp_min}°</div>
            <div style="font-size: 11px; color: var(--color-rain); font-weight: 600; margin: 4px 0;">💧 ${d.rain_probability}% Rain</div>
            <div style="font-size: 11.5px; color: var(--text-secondary); line-height: 1.4;">${d.suitability}</div>
          </div>
        `).join('');
      }
    }
  } catch (err) {
    console.warn('Error fetching weather forecast:', err);
  }
}

async function triggerWeatherScenario(scenario) {
  if (!state.activeBooking) return;
  const bId = state.activeBooking.booking_id;

  try {
    const res = await fetch('/api/weather/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario, booking_id: bId })
    });

    const data = await res.json();
    if (data.success) {
      state.activeWeather = data.weather;
      updateWeatherUI(data.weather);

      if (scenario === 'rain' && data.adaptation) {
        // Adaptation occurred
        state.activeItinerary = data.adaptation.updated_itinerary;
        renderItinerary();
        renderTodayPlan();

        // Show banner
        const banner = document.getElementById('proactiveAlertBanner');
        if (banner) {
          banner.style.display = 'block';
          const bannerText = document.getElementById('alertBannerText');
          if (bannerText) {
            bannerText.innerHTML = `Rain forecasted tomorrow (95% risk). We’ve adjusted your beach plans and slotted the indoor <strong>${data.adaptation.replacement_activity}</strong>.`;
          }
        }

        // Show Overview Alert Card
        const ovCard = document.getElementById('ovAdaptationAlertCard');
        if (ovCard) {
          ovCard.style.display = 'block';
          const ovText = document.getElementById('ovAdaptationText');
          if (ovText) {
            ovText.innerHTML = `Rain forecasted tomorrow. Outdoor beach activity was automatically swapped for <strong>${data.adaptation.replacement_activity}</strong>.`;
          }
        }

        loadNotifications();
        showToast('Weather adaptation triggered: Outdoor beach time swapped for indoor culture!');
      } else {
        // Reset to clear
        const banner = document.getElementById('proactiveAlertBanner');
        if (banner) banner.style.display = 'none';
        const ovCard = document.getElementById('ovAdaptationAlertCard');
        if (ovCard) ovCard.style.display = 'none';
        showToast('Weather reset to clear coastal skies.');
      }

      refreshWeatherView();
    }
  } catch (err) {
    console.error('Error triggering weather simulation:', err);
  }
}

// ============================================================
// NOTIFICATIONS MANAGEMENT
// ============================================================
async function loadNotifications() {
  if (!state.activeBooking) return;

  try {
    const res = await fetch(`/api/notifications/${state.activeBooking.booking_id}`);
    const data = await res.json();
    if (data.success) {
      state.notifications = data.notifications;
      const badge = document.getElementById('menuNotifBadge');
      if (badge) badge.textContent = data.count.toString();
      renderNotifications();
    }
  } catch (err) {
    console.warn('Error loading notifications:', err);
  }

  const btnClearNotifs = document.getElementById('btnClearNotifs');
  if (btnClearNotifs && !btnClearNotifs.dataset.bound) {
    btnClearNotifs.dataset.bound = 'true';
    btnClearNotifs.addEventListener('click', () => {
      state.notifications = [];
      const badge = document.getElementById('menuNotifBadge');
      if (badge) badge.textContent = '0';
      const mobBadge = document.getElementById('mobileTopNotifDot');
      if (mobBadge) mobBadge.textContent = '0';
      renderNotifications();
      showToast('All notifications marked as read');
    });
  }
}

function renderNotifications() {
  const container = document.getElementById('notificationsFeedContainer');
  if (!container) return;

  if (state.notifications.length === 0) {
    container.innerHTML = `<div style="padding: 24px; color: var(--text-muted); background: var(--bg-surface); border-radius: var(--radius-md);">No active alerts or reminders.</div>`;
    return;
  }

  container.innerHTML = state.notifications.map(n => {
    const isWeather = n.type === 'WEATHER_ADAPTATION';
    const icon = isWeather ? '🌧' : '🔔';

    return `
      <div class="notification-card ${isWeather ? 'is-weather' : ''}">
        <div class="notif-icon-circle">${icon}</div>
        <div class="notif-content">
          <div class="notif-header-row">
            <div class="notif-title">${n.title || 'Trip Notification'}</div>
            <div class="notif-time">Just now</div>
          </div>
          <div class="notif-body">${n.message.replace(/\n/g, '<br>')}</div>
        </div>
      </div>
    `;
  }).join('');
}

// ============================================================
// TUTORIAL ONBOARDING MODAL
// ============================================================
function setupTutorialModal() {
  const modal = document.getElementById('tutorialModal');
  const btnOpen = document.getElementById('btnOpenTutorial');
  const btnClose = document.getElementById('btnCloseTutorial');
  const btnSkip = document.getElementById('btnSkipTutorial');
  const btnNext = document.getElementById('btnNextTutorial');

  if (btnOpen) {
    btnOpen.addEventListener('click', () => {
      state.tutorialStep = 0;
      renderTutorialStep();
      if (modal) modal.classList.add('active');
    });
  }

  if (btnClose) btnClose.addEventListener('click', () => modal?.classList.remove('active'));
  if (btnSkip) btnSkip.addEventListener('click', () => modal?.classList.remove('active'));

  if (btnNext) {
    btnNext.addEventListener('click', () => {
      if (state.tutorialStep < tutorialSteps.length - 1) {
        state.tutorialStep++;
        renderTutorialStep();
      } else {
        modal?.classList.remove('active');
        showToast('Tutorial complete! Enjoy your personalized trip concierge.');
      }
    });
  }
}

function renderTutorialStep() {
  const s = tutorialSteps[state.tutorialStep];
  if (!s) return;

  const icon = document.getElementById('tutIcon');
  if (icon) icon.textContent = s.icon;

  const title = document.getElementById('tutTitle');
  if (title) title.textContent = s.title;

  const desc = document.getElementById('tutDesc');
  if (desc) desc.textContent = s.desc;

  document.querySelectorAll('.tutorial-dot').forEach((dot, idx) => {
    if (idx === state.tutorialStep) {
      dot.classList.add('active');
    } else {
      dot.classList.remove('active');
    }
  });

  const nextBtn = document.getElementById('btnNextTutorial');
  if (nextBtn) {
    nextBtn.textContent = state.tutorialStep === tutorialSteps.length - 1 ? 'Get Started' : 'Next';
  }
}

// ============================================================
// MOBILE TRAVEL COMPANION CONTROLLERS
// ============================================================
let activeSheetSlot = null;

function setupMobileCompanion() {
  // Mobile Quick Actions Row
  document.querySelectorAll('[data-mob-act]').forEach(btn => {
    btn.addEventListener('click', () => {
      const act = btn.getAttribute('data-mob-act');
      if (!state.currentRoute.startsWith('/app')) {
        showView('viewApp');
      }
      if (act === 'near_me') {
        switchAppSubView('explore', true);
        const nearChip = document.querySelector('#exploreFilterChips .quick-chip[data-cat="near_me"]');
        if (nearChip) nearChip.click();
      } else if (act === 'weather') {
        switchAppSubView('weather', true);
      } else if (act === 'today') {
        switchAppSubView('itinerary', true);
        filterDay('1');
      } else if (act === 'food') {
        switchAppSubView('explore', true);
        const foodChip = document.querySelector('#exploreFilterChips .quick-chip[data-cat="food"]');
        if (foodChip) foodChip.click();
      } else if (act === 'explore') {
        switchAppSubView('explore', true);
      } else if (act === 'ask_ai') {
        switchAppSubView('concierge', true);
        const input = document.getElementById('conciergeChatInput');
        if (input) input.focus();
      }
    });
  });

  // Mobile Top Bar Notification Bell
  const mobNotifBtn = document.getElementById('mobileTopNotifBtn');
  if (mobNotifBtn) {
    mobNotifBtn.addEventListener('click', () => {
      if (!state.currentRoute.startsWith('/app')) showView('viewApp');
      switchAppSubView('notifications', true);
    });
  }

  // Next Hero Card Buttons
  const btnNextDetails = document.getElementById('ovNextHeroBtnDetails');
  if (btnNextDetails) {
    btnNextDetails.addEventListener('click', () => {
      switchAppSubView('itinerary', true);
    });
  }

  const btnNextReplace = document.getElementById('ovNextHeroBtnReplace');
  if (btnNextReplace) {
    btnNextReplace.addEventListener('click', () => {
      switchAppSubView('concierge', true);
      const input = document.getElementById('conciergeChatInput');
      if (input) {
        input.value = "Can you replace the Fort Aguada activity with something else nearby?";
        const sendBtn = document.getElementById('btnSendConciergeChat');
        if (sendBtn) sendBtn.click();
      }
    });
  }

  // Near You Carousel Cards
  document.querySelectorAll('#nearYouCarousel .carousel-card').forEach(card => {
    card.addEventListener('click', () => {
      const placeName = card.getAttribute('data-place');
      switchAppSubView('explore', true);
      const searchInput = document.getElementById('exploreSearchInput');
      if (searchInput) {
        searchInput.value = placeName;
        state.exploreQuery = placeName;
        loadExplorePlaces();
      }
    });
  });

  const btnViewAllNear = document.getElementById('btnViewAllNear');
  if (btnViewAllNear) {
    btnViewAllNear.addEventListener('click', () => {
      switchAppSubView('explore', true);
      const nearChip = document.querySelector('#exploreFilterChips .quick-chip[data-cat="near_me"]');
      if (nearChip) nearChip.click();
    });
  }

  // Mobile Quick Ask Bar
  const quickAskInput = document.getElementById('mobileQuickAskInput');
  const btnQuickAsk = document.getElementById('btnMobileQuickAsk');
  const handleQuickAsk = () => {
    if (!quickAskInput) return;
    const q = quickAskInput.value.trim();
    if (!q) return;
    quickAskInput.value = '';
    switchAppSubView('concierge', true);
    const chatInput = document.getElementById('conciergeChatInput');
    if (chatInput) {
      chatInput.value = q;
      const sendBtn = document.getElementById('btnSendConciergeChat');
      if (sendBtn) sendBtn.click();
    }
  };

  if (btnQuickAsk) btnQuickAsk.addEventListener('click', handleQuickAsk);
  if (quickAskInput) {
    quickAskInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleQuickAsk();
      }
    });
  }
}

// ============================================================
// MOBILE ITINERARY ACTION BOTTOM SHEET
// ============================================================
function setupBottomSheet() {
  const sheet = document.getElementById('mobileBottomSheet');
  const btnClose = document.getElementById('btnCloseBottomSheet');
  if (btnClose && sheet) {
    btnClose.addEventListener('click', () => closeBottomSheet());
  }

  if (sheet) {
    sheet.addEventListener('click', (e) => {
      if (e.target === sheet) closeBottomSheet();
    });
  }

  // Action: Replace Activity
  const btnReplace = document.getElementById('sheetBtnReplace');
  if (btnReplace) {
    btnReplace.addEventListener('click', () => {
      const place = activeSheetSlot?.place_name || 'this place';
      closeBottomSheet();
      switchAppSubView('concierge', true);
      const input = document.getElementById('conciergeChatInput');
      if (input) {
        input.value = `Can you suggest an alternative for ${place}?`;
        const sendBtn = document.getElementById('btnSendConciergeChat');
        if (sendBtn) sendBtn.click();
      }
    });
  }

  // Action: Move Day
  const btnMove = document.getElementById('sheetBtnMove');
  if (btnMove) {
    btnMove.addEventListener('click', () => {
      const place = activeSheetSlot?.place_name || 'this activity';
      closeBottomSheet();
      switchAppSubView('concierge', true);
      const input = document.getElementById('conciergeChatInput');
      if (input) {
        input.value = `Can we move ${place} to another day?`;
        const sendBtn = document.getElementById('btnSendConciergeChat');
        if (sendBtn) sendBtn.click();
      }
    });
  }

  // Action: Remove Activity
  const btnRemove = document.getElementById('sheetBtnRemove');
  if (btnRemove) {
    btnRemove.addEventListener('click', () => {
      if (!activeSheetSlot || !state.activeItinerary) return;
      const placeName = activeSheetSlot.place_name;
      // Remove from active itinerary in state
      state.activeItinerary.days.forEach(d => {
        d.items = d.items.filter(it => it.place_name !== placeName);
      });
      renderItinerary();
      renderTodayPlan();
      closeBottomSheet();
      showToast(`Removed "${placeName}" from your itinerary.`);
    });
  }
}

function openBottomSheet(slot) {
  activeSheetSlot = slot;
  const sheet = document.getElementById('mobileBottomSheet');
  if (!sheet) return;

  const badge = document.getElementById('sheetSlotBadge');
  const title = document.getElementById('sheetPlaceTitle');
  const meta = document.getElementById('sheetPlaceMeta');
  const why = document.getElementById('sheetWhyText');
  const weatherFit = document.getElementById('sheetWeatherFit');
  const dirLink = document.getElementById('sheetBtnDirections');

  if (badge) badge.textContent = `${slot.day ? `DAY ${slot.day} · ` : ''}${slot.slot_name || 'ACTIVITY'}`;
  if (title) title.textContent = slot.place_name || 'Activity Details';
  if (meta) meta.textContent = `${slot.area || 'Candolim'} · ${slot.category || ''} · ${slot.time || ''}`;
  if (why) why.textContent = slot.why_match || 'Matches your travel pace and preferences.';
  if (weatherFit) {
    const isIndoor = slot.indoor_outdoor === 'indoor';
    weatherFit.innerHTML = isIndoor
      ? '<span>🛡️</span> Weather fit: Indoor sheltered venue — safe in rain or high heat.'
      : '<span>☀️</span> Weather fit: Best during dry, clear weather.';
  }
  if (dirLink) {
    const query = encodeURIComponent(`${slot.place_name} Goa`);
    dirLink.href = `https://maps.google.com/?q=${query}`;
  }

  sheet.classList.add('active');
}

function closeBottomSheet() {
  const sheet = document.getElementById('mobileBottomSheet');
  if (sheet) sheet.classList.remove('active');
  activeSheetSlot = null;
}

// ============================================================
// FULL-SCREEN INTERACTIVE LEAFLET GOA MAP MODAL
// ============================================================
let leafletGoaMap = null;
let leafletMapMarkers = [];
let leafletVillaMarker = null;

function setupMapModal() {
  const mapModal = document.getElementById('mobileMapModal');
  const btnToggle = document.getElementById('btnToggleMapModal');
  const btnClose = document.getElementById('btnCloseMapModal');

  if (btnToggle && mapModal) {
    btnToggle.addEventListener('click', () => {
      openRealGoaMap();
    });
  }

  if (btnClose && mapModal) {
    btnClose.addEventListener('click', () => {
      mapModal.classList.remove('active');
    });
  }

  if (mapModal) {
    mapModal.addEventListener('click', (e) => {
      if (e.target === mapModal) mapModal.classList.remove('active');
    });
  }

  // Filter Buttons in Modal Header
  const filterBtns = document.querySelectorAll('#mapModalFilterGroup .btn-map-filter');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.getAttribute('data-filter') || 'all';
      filterLeafletMarkers(cat);
    });
  });

  // Action on Selected Card
  const btnAction = document.getElementById('btnMapCardAction');
  if (btnAction) {
    btnAction.addEventListener('click', () => {
      const title = document.getElementById('mapCardTitle')?.textContent || 'this venue';
      if (mapModal) mapModal.classList.remove('active');
      switchAppSubView('concierge', true);
      const input = document.getElementById('conciergeChatInput');
      if (input) {
        input.value = `Can you tell me more about ${title} and add it to my plan?`;
        const sendBtn = document.getElementById('btnSendConciergeChat');
        if (sendBtn) sendBtn.click();
      }
    });
  }
}

function openRealGoaMap() {
  const mapModal = document.getElementById('mobileMapModal');
  if (!mapModal) return;
  mapModal.classList.add('active');

  if (!leafletGoaMap) {
    initLeafletGoaMap();
  } else {
    setTimeout(() => {
      leafletGoaMap.invalidateSize();
    }, 150);
  }
}

async function initLeafletGoaMap() {
  const mapContainer = document.getElementById('realGoaMap');
  if (!mapContainer || typeof L === 'undefined') return;

  // Candolim, North Goa center: [15.518, 73.765]
  const candolimCenter = [15.518, 73.765];
  leafletGoaMap = L.map('realGoaMap', {
    center: candolimCenter,
    zoom: 14,
    zoomControl: true,
    attributionControl: true
  });

  // Legitimate OpenStreetMap Tiles & Official Attribution
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
  }).addTo(leafletGoaMap);

  // Invalidate size once rendered in active modal
  setTimeout(() => {
    if (leafletGoaMap) leafletGoaMap.invalidateSize();
  }, 150);

  // Add Stay / Villa Marker
  const villaIcon = L.divIcon({
    className: 'wayzyy-marker-wrap',
    html: '<div class="wayzyy-map-marker marker-villa"><span>🏡</span><span>Your Villa (Candolim)</span></div>',
    iconSize: [165, 32],
    iconAnchor: [82, 16]
  });

  leafletVillaMarker = L.marker(candolimCenter, { icon: villaIcon, zIndexOffset: 1000 }).addTo(leafletGoaMap);
  leafletVillaMarker.bindPopup(`
    <div style="font-family: var(--font-sans); padding: 4px;">
      <span style="font-size: 10px; font-weight: 700; color: var(--color-orange); letter-spacing: 0.5px;">YOUR ACTIVE STAY</span>
      <h4 style="font-family: var(--font-serif); font-size: 15px; margin: 4px 0 2px;">Casa Candolim Luxury Villa</h4>
      <p style="font-size: 12px; color: var(--text-secondary); margin: 0 0 6px;">Candolim, North Goa · 4 Nights Stay</p>
      <div style="font-size: 11px; color: var(--text-muted);">Basecamp for all day trips & concierge adaptations</div>
    </div>
  `);

  // Fetch real Goa places with real coordinates
  try {
    const res = await fetch('/api/places/search?limit=60');
    const data = await res.json();
    const places = data.places || [];

    places.forEach(place => {
      const lat = place.coordinates?.lat || place.lat;
      const lng = place.coordinates?.lng || place.lng;
      if (!lat || !lng) return;

      let markerClass = 'marker-food';
      let iconEmoji = '📍';
      const type = (place.type || '').toLowerCase();
      const cats = (place.categories || []).map(c => c.toLowerCase());

      if (type === 'beach' || cats.includes('beaches')) {
        markerClass = 'marker-beach';
        iconEmoji = '🏖️';
      } else if (type === 'restaurant' || type === 'cafe' || cats.includes('restaurants') || cats.includes('food')) {
        markerClass = 'marker-food';
        iconEmoji = '🍽️';
      } else if (type === 'heritage' || cats.includes('heritage') || cats.includes('culture')) {
        markerClass = 'marker-heritage';
        iconEmoji = '🏛️';
      } else if (type === 'nature' || cats.includes('nature') || cats.includes('outdoors')) {
        markerClass = 'marker-nature';
        iconEmoji = '🌴';
      } else if (place.indoor_outdoor === 'indoor' || cats.includes('indoor')) {
        markerClass = 'marker-indoor';
        iconEmoji = '🏛️';
      }

      const placeIcon = L.divIcon({
        className: 'wayzyy-marker-wrap',
        html: `<div class="wayzyy-map-marker ${markerClass}"><span>${iconEmoji}</span><span>${place.name}</span></div>`,
        iconSize: [140, 28],
        iconAnchor: [70, 14]
      });

      const marker = L.marker([lat, lng], { icon: placeIcon }).addTo(leafletGoaMap);

      const popupHtml = `
        <div style="font-family: var(--font-sans); min-width: 200px;">
          <span style="font-size: 10px; font-weight: 700; color: var(--color-orange); letter-spacing: 0.5px;">${(place.type || 'VENUE').toUpperCase()}</span>
          <h4 style="font-family: var(--font-serif); font-size: 14px; margin: 4px 0 2px;">${place.name}</h4>
          <p style="font-size: 11.5px; color: var(--text-secondary); margin: 0 0 6px;">📍 ${place.area} ${place.distance_km != null ? '· ' + place.distance_km + ' km' : ''}</p>
          <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 8px;">${place.tags ? place.tags.slice(0, 3).join(' · ') : ''}</div>
          <div style="display: flex; gap: 6px;">
            <a href="https://maps.google.com/?q=${encodeURIComponent(place.name + ' Goa')}" target="_blank" rel="noopener" style="display: inline-block; padding: 4px 8px; font-size: 11px; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 4px; color: var(--text-primary); text-decoration: none;">↗ Directions</a>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('click', () => {
        selectPlaceOnMap(place);
      });

      leafletMapMarkers.push({ marker, place });
    });
  } catch (err) {
    console.warn('Failed to load places for Leaflet map:', err);
  }
}

function filterLeafletMarkers(category) {
  if (!leafletGoaMap) return;

  leafletMapMarkers.forEach(({ marker, place }) => {
    const type = (place.type || '').toLowerCase();
    const cats = (place.categories || []).map(c => c.toLowerCase());
    let match = false;

    if (category === 'all') {
      match = true;
    } else if (category === 'beach') {
      match = type === 'beach' || cats.includes('beaches');
    } else if (category === 'food') {
      match = type === 'restaurant' || type === 'cafe' || cats.includes('restaurants') || cats.includes('food');
    } else if (category === 'heritage') {
      match = type === 'heritage' || cats.includes('heritage') || cats.includes('culture');
    } else if (category === 'nature') {
      match = type === 'nature' || cats.includes('nature') || cats.includes('outdoors');
    } else if (category === 'indoor') {
      match = place.indoor_outdoor === 'indoor' || cats.includes('indoor');
    }

    if (match) {
      if (!leafletGoaMap.hasLayer(marker)) leafletGoaMap.addLayer(marker);
    } else {
      if (leafletGoaMap.hasLayer(marker)) leafletGoaMap.removeLayer(marker);
    }
  });
}

function selectPlaceOnMap(place) {
  const card = document.getElementById('mapSelectedCard');
  const tag = document.getElementById('mapCardTag');
  const title = document.getElementById('mapCardTitle');
  const desc = document.getElementById('mapCardDesc');
  const meta = document.getElementById('mapCardMeta');
  const dir = document.getElementById('btnMapCardDirections');
  if (!card) return;

  if (tag) tag.textContent = (place.type || 'VENUE').toUpperCase();
  if (title) title.textContent = place.name;
  if (desc) desc.textContent = place.address || (place.tags ? place.tags.join(' · ') : 'Verified destination in Goa.');
  if (meta) meta.textContent = `📍 ${place.area} · ${place.distance_km != null ? place.distance_km + ' km away' : 'Near Candolim'}`;
  if (dir) dir.href = `https://maps.google.com/?q=${encodeURIComponent(place.name + ' Goa')}`;

  card.style.display = 'flex';
}

// ============================================================
// TOAST HELPER
// ============================================================
function showToast(message) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
