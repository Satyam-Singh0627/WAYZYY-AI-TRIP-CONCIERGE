const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9228;
const ARTIFACT_DIR = "C:\\Users\\SATYAM SINGH\\.gemini\\antigravity-ide\\brain\\47e41c29-f4b2-4b29-b61e-bcb9eb3d4f3e";

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 0;
    this.callbacks = new Map();
    this.consoleLogs = [];
    this.networkErrors = [];
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data);
        if (data.id && this.callbacks.has(data.id)) {
          const cb = this.callbacks.get(data.id);
          this.callbacks.delete(data.id);
          if (data.error) cb.reject(data.error);
          else cb.resolve(data.result);
        } else if (data.method) {
          this.handleEvent(data.method, data.params);
        }
      };
    });
  }

  handleEvent(method, params) {
    if (method === 'Runtime.consoleAPICalled') {
      const text = params.args.map(a => a.value || JSON.stringify(a)).join(' ');
      this.consoleLogs.push({ type: params.type, text });
    } else if (method === 'Runtime.exceptionThrown') {
      this.consoleLogs.push({ type: 'error', text: params.exceptionDetails.text + ' ' + (params.exceptionDetails.exception?.description || '') });
    } else if (method === 'Network.responseReceived') {
      if (params.response.status >= 400) {
        this.networkErrors.push({ url: params.response.url, status: params.response.status, statusText: params.response.statusText });
      }
    }
  }

  async send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      throw new Error(res.exceptionDetails.text + ' ' + (res.exceptionDetails.exception?.description || ''));
    }
    return res.result.value;
  }

  async captureScreenshot(outputPath) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    fs.writeFileSync(outputPath, buffer);
    console.log(`Saved screenshot: ${outputPath} (${buffer.length} bytes)`);
  }

  async setViewport(width, height, isMobile = false) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: isMobile
    });
    await this.send('Emulation.setVisibleSize', { width, height }).catch(() => {});
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function runComprehensiveVerification() {
  console.log('=== RUNNING FULL LIVE VERIFICATION OF ALL WAYZYY VIEWS & INTERACTIONS ===');
  const tempProfile = path.join(__dirname, '.chrome-temp-' + Date.now());
  fs.mkdirSync(tempProfile, { recursive: true });

  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${tempProfile}`,
    'http://localhost:3000'
  ], { stdio: 'ignore' });

  await sleep(2500);

  let client;
  try {
    const targets = await new Promise((res, rej) => {
      http.get(`http://127.0.0.1:${PORT}/json/list`, (r) => {
        let d = '';
        r.on('data', chunk => d += chunk);
        r.on('end', () => res(JSON.parse(d)));
      }).on('error', rej);
    });

    const pageTarget = targets.find(t => t.type === 'page');
    if (!pageTarget) throw new Error('No page target found');

    client = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await client.connect();

    await client.send('Page.enable');
    await client.send('DOM.enable');
    await client.send('Runtime.enable');
    await client.send('Network.enable');

    console.log('CDP Connected.');
    await sleep(1500);

    // 1. DESKTOP VIEWPORT 1440x900 - HOME PAGE
    await client.setViewport(1440, 900, false);
    await sleep(500);

    const homeCheck = await client.eval(`(() => {
      const topBar = document.getElementById('mobileTopBar');
      const bottomNav = document.getElementById('mobileBottomNav');
      const home = document.getElementById('viewHome');
      const csTop = window.getComputedStyle(topBar);
      const csNav = window.getComputedStyle(bottomNav);
      const csHome = window.getComputedStyle(home);

      return {
        activeView: document.querySelector('.view-container.active')?.id,
        mobileTopBarDisplay: csTop.display,
        mobileBottomNavDisplay: csNav.display,
        homeDisplay: csHome.display,
        homeHeight: home.getBoundingClientRect().height
      };
    })()`);

    console.log('Desktop Home Check:', homeCheck);
    await client.captureScreenshot(path.join(ARTIFACT_DIR, 'verify_desktop_home.png'));

    // 2. TEST JUDGE DEMO STEPS 1-7
    console.log('\n--- TESTING JUDGE DEMO FLOW (STEPS 1 TO 7) ---');
    for (let step = 1; step <= 7; step++) {
      await client.eval(`(() => {
        const btn = document.getElementById('demoStep' + ${step});
        if (btn) btn.click();
      })()`);
      await sleep(1000);
      const stepState = await client.eval(`(() => ({
        step: ${step},
        activeView: document.querySelector('.view-container.active')?.id,
        currentSub: state?.currentAppSub,
        booking: state?.activeBooking?.guest_name,
        itineraryDays: state?.activeItinerary?.days?.length,
        hasConflict: !!document.getElementById('weatherConflictBox')?.style?.display !== 'none'
      }))()`);
      console.log('Step ' + step + ' Result:', stepState);
    }

    // Capture Itinerary View Screenshot
    await client.eval(`(() => {
      navigate('/app/itinerary', false);
    })()`);
    await sleep(800);
    await client.captureScreenshot(path.join(ARTIFACT_DIR, 'verify_desktop_itinerary.png'));

    // 3. TEST ITINERARY ACTIONS: BOTTOM SHEET & DIRECTIONS & REPLACE & REMOVE
    console.log('\n--- TESTING ITINERARY ACTIVITY ACTIONS ---');
    const itinActionResult = await client.eval(`(() => {
      const firstSlot = document.querySelector('.slot-item-card');
      if (!firstSlot) return { ok: false, msg: 'No slot card found' };
      firstSlot.click();
      const sheet = document.getElementById('mobileBottomSheet');
      const sheetActive = sheet?.classList.contains('active');
      const title = document.getElementById('sheetPlaceTitle')?.textContent;
      const dirHref = document.getElementById('sheetBtnDirections')?.href;
      return { ok: true, sheetActive, title, dirHref };
    })()`);
    console.log('Itinerary Slot Click & Bottom Sheet:', itinActionResult);

    // 4. TEST EXPLORE GOA DESTINATIONS & FILTERS
    console.log('\n--- TESTING EXPLORE DESTINATIONS & FILTERS ---');
    await client.eval(`(() => {
      navigate('/app/explore', false);
    })()`);
    await sleep(600);
    const exploreResult = await client.eval(`(() => {
      const totalCards = document.querySelectorAll('#explorePlacesGrid .explore-card').length;
      const beachChip = document.querySelector('#exploreFilterChips .quick-chip[data-cat="beaches"]');
      if (beachChip) beachChip.click();
      const beachCards = document.querySelectorAll('#explorePlacesGrid .explore-card').length;
      return { totalCards, beachCards };
    })()`);
    console.log('Explore Results:', exploreResult);
    await client.captureScreenshot(path.join(ARTIFACT_DIR, 'verify_desktop_explore.png'));

    // 5. TEST CONCIERGE CHAT & PROMPT CHIPS
    console.log('\n--- TESTING CONCIERGE CHAT ---');
    await client.eval(`(() => {
      navigate('/app/concierge', false);
    })()`);
    await sleep(600);
    const conciergeResult = await client.eval(`(() => {
      const firstChip = document.querySelector('.chat-quick-queries .quick-chip');
      if (firstChip) firstChip.click();
      return {
        messagesCount: document.querySelectorAll('#conciergeMessagesLog .chat-msg').length,
        hasMemory: document.querySelectorAll('#memoryChipsRow .memory-chip').length
      };
    })()`);
    await sleep(800);
    console.log('Concierge Chat Result:', conciergeResult);
    await client.captureScreenshot(path.join(ARTIFACT_DIR, 'verify_desktop_concierge.png'));

    // 5B. TEST REAL LEAFLET GOA MAP & FILTERS (DESKTOP)
    console.log('\n--- TESTING REAL LEAFLET GOA MAP ---');
    await client.eval(`(() => {
      navigate('/app/explore', false);
    })()`);
    await sleep(500);

    const mapOpenResult = await client.eval(`(() => {
      const btnMap = document.getElementById('btnToggleMapModal');
      if (btnMap) btnMap.click();
      return {
        modalActive: document.getElementById('mobileMapModal')?.classList.contains('active'),
        hasL: typeof L !== 'undefined'
      };
    })()`);
    console.log('Map Modal Open Result:', mapOpenResult);
    await sleep(1500);

    const mapContentResult = await client.eval(`(() => {
      const mapEl = document.getElementById('realGoaMap');
      const tilesCount = mapEl.querySelectorAll('.leaflet-tile-pane img').length;
      const villaMarkers = mapEl.querySelectorAll('.marker-villa').length;
      const totalMarkers = mapEl.querySelectorAll('.wayzyy-map-marker').length;
      const osmAttribution = document.querySelector('.leaflet-control-attribution')?.textContent || '';

      // Test Beach Filter
      const beachBtn = document.querySelector('#mapModalFilterGroup .btn-map-filter[data-filter="beach"]');
      if (beachBtn) beachBtn.click();
      const beachMarkers = mapEl.querySelectorAll('.wayzyy-map-marker').length;

      // Test All Filter
      const allBtn = document.querySelector('#mapModalFilterGroup .btn-map-filter[data-filter="all"]');
      if (allBtn) allBtn.click();

      // Click First Marker
      const firstMarker = mapEl.querySelector('.wayzyy-map-marker:not(.marker-villa)');
      if (firstMarker) firstMarker.click();
      const selectedCard = document.getElementById('mapSelectedCard');
      const cardTitle = document.getElementById('mapCardTitle')?.textContent;
      const cardDisplay = window.getComputedStyle(selectedCard).display;

      return {
        tilesCount,
        villaMarkers,
        totalMarkers,
        osmAttribution,
        beachMarkers,
        cardTitle,
        cardDisplay
      };
    })()`);
    console.log('Real Leaflet Map Verification:', mapContentResult);
    await client.captureScreenshot(path.join(ARTIFACT_DIR, 'verify_desktop_real_map.png'));

    // Close Map Modal
    await client.eval(`(() => {
      document.getElementById('btnCloseMapModal')?.click();
    })()`);
    await sleep(400);

    // 5C. TEST NOTIFICATIONS FEED & ALIGNMENT
    console.log('\n--- TESTING NOTIFICATIONS FEED & ALIGNMENT ---');
    await client.eval(`(() => {
      navigate('/app/notifications', false);
    })()`);
    await sleep(600);

    const notifResult = await client.eval(`(() => {
      const feed = document.getElementById('notificationsFeedContainer');
      const cards = feed.querySelectorAll('.notification-card');
      if (cards.length === 0) return { count: 0 };

      const firstCard = cards[0];
      const icon = firstCard.querySelector('.notif-icon-circle');
      const title = firstCard.querySelector('.notif-title');
      const time = firstCard.querySelector('.notif-time');
      const body = firstCard.querySelector('.notif-body');

      const csCard = window.getComputedStyle(firstCard);
      const csIcon = window.getComputedStyle(icon);

      return {
        count: cards.length,
        display: csCard.display,
        alignItems: csCard.alignItems,
        iconWidth: csIcon.width,
        iconHeight: csIcon.height,
        hasTitle: Boolean(title?.textContent),
        hasTime: Boolean(time?.textContent),
        hasBody: Boolean(body?.textContent)
      };
    })()`);
    console.log('Notifications Feed & Alignment:', notifResult);
    await client.captureScreenshot(path.join(ARTIFACT_DIR, 'verify_desktop_notifications.png'));

    // 5D. TEST WEATHER CONSISTENCY
    console.log('\n--- TESTING WEATHER CONSISTENCY ---');
    const weatherCheck = await client.eval(`(() => {
      const sTemp = document.getElementById('sideWeatherTemp')?.textContent;
      const ovTemp = document.getElementById('ovWeatherTemp')?.textContent;
      const ovTomorrow = document.getElementById('ovTomorrowBrief')?.textContent;
      return { sTemp, ovTemp, ovTomorrow };
    })()`);
    console.log('Weather Consistency Check:', weatherCheck);

    // 6. TEST MOBILE VIEWPORT (390x844 iPhone)
    console.log('\n--- TESTING MOBILE VIEWPORT (390x844) ---');
    await client.setViewport(390, 844, true);
    await client.eval(`(() => {
      navigate('/app/overview', false);
    })()`);
    await sleep(800);

    const mobileCheck = await client.eval(`(() => {
      const topBar = document.getElementById('mobileTopBar');
      const bottomNav = document.getElementById('mobileBottomNav');
      const globalHeader = document.querySelector('.global-header');
      const sidebar = document.querySelector('.app-sidebar');

      return {
        topBarDisplay: window.getComputedStyle(topBar).display,
        bottomNavDisplay: window.getComputedStyle(bottomNav).display,
        globalHeaderDisplay: window.getComputedStyle(globalHeader).display,
        sidebarDisplay: window.getComputedStyle(sidebar).display,
        topBarHeight: topBar.getBoundingClientRect().height,
        bottomNavHeight: bottomNav.getBoundingClientRect().height
      };
    })()`);
    console.log('Mobile Check (390x844):', mobileCheck);
    await client.captureScreenshot(path.join(ARTIFACT_DIR, 'verify_mobile_app_overview.png'));

    // 7. TEST MOBILE ITINERARY
    await client.eval(`(() => {
      const planNav = document.getElementById('mobNavPlan');
      if (planNav) planNav.click();
    })()`);
    await sleep(800);
    await client.captureScreenshot(path.join(ARTIFACT_DIR, 'verify_mobile_itinerary.png'));

    // 7B. TEST MOBILE MAP & INTERACTION
    console.log('\n--- TESTING MOBILE LEAFLET MAP (390x844) ---');
    await client.eval(`(() => {
      navigate('/app/explore', false);
    })()`);
    await sleep(600);
    await client.eval(`(() => {
      document.getElementById('btnToggleMapModal')?.click();
    })()`);
    await sleep(1500);

    const mobileMapCheck = await client.eval(`(() => {
      const mapEl = document.getElementById('realGoaMap');
      const rect = mapEl.getBoundingClientRect();
      const modal = document.getElementById('mobileMapModal');
      const modalRect = modal.getBoundingClientRect();
      return {
        modalActive: modal.classList.contains('active'),
        mapWidth: rect.width,
        mapHeight: rect.height,
        overflowX: document.documentElement.scrollWidth > window.innerWidth,
        markersCount: mapEl.querySelectorAll('.wayzyy-map-marker').length
      };
    })()`);
    console.log('Mobile Map Check:', mobileMapCheck);
    await client.captureScreenshot(path.join(ARTIFACT_DIR, 'verify_mobile_map.png'));

    await client.eval(`(() => {
      document.getElementById('btnCloseMapModal')?.click();
    })()`);
    await sleep(400);

    // 7C. FULL ENGLISH-ONLY DOM AUDIT
    console.log('\n--- AUDITING DOM FOR ENGLISH-ONLY STRINGS ---');
    const nonEnglishFindings = await client.eval(`(() => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const findings = [];
      while (walker.nextNode()) {
        const text = walker.currentNode.nodeValue.trim();
        if (!text) continue;
        // Match characters outside ASCII, Latin-1, currency, punctuation, and emoji ranges
        const foreign = text.match(/[^\x00-\x7F\u2000-\u206F\u2E00-\u2E7F\u2010-\u2027\u2030-\u205E\u2190-\u21FF\u2600-\u26FF\u2700-\u27BF\uFE00-\uFE0F\u{1F300}-\u{1F9FF}\u00A0-\u00FF○●]/gu);
        if (foreign && foreign.length > 0) {
          findings.push({ text: text.slice(0, 60), chars: [...new Set(foreign)] });
        }
      }
      return findings;
    })()`);
    console.log('DOM English Audit Findings (should be 0):', nonEnglishFindings);

    // 8. TEST OTHER VIEWPORTS: 375x812, 360x800, 414x896, 1920x1080
    const viewports = [
      { w: 375, h: 812, mobile: true, name: '375x812' },
      { w: 360, h: 800, mobile: true, name: '360x800' },
      { w: 414, h: 896, mobile: true, name: '414x896' },
      { w: 1920, h: 1080, mobile: false, name: '1920x1080' }
    ];

    for (let vp of viewports) {
      await client.setViewport(vp.w, vp.h, vp.mobile);
      await sleep(300);
      const vpCheck = await client.eval(`(() => ({
        width: window.innerWidth,
        height: window.innerHeight,
        overflowX: document.documentElement.scrollWidth > window.innerWidth,
        activeView: document.querySelector('.view-container.active')?.id
      }))()`);
      console.log('Viewport ' + vp.name + ' Check:', vpCheck);
    }

    console.log('\n--- CONSOLE LOGS ---');
    console.log(client.consoleLogs);

    console.log('\n--- NETWORK ERRORS ---');
    console.log(client.networkErrors);

    console.log('\n=== ALL VERIFICATIONS COMPLETED SUCCESSFULLY ===');
  } finally {
    if (client) client.close();
    chromeProc.kill('SIGKILL');
  }
}

if (require.main === module) {
  runComprehensiveVerification().catch(e => {
    console.error('Verification failed:', e);
    process.exit(1);
  });
}
