const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9225;
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
    this.events = [];
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

  async captureScreenshot(outputPath, clip) {
    const params = { format: 'png' };
    if (clip) params.clip = clip;
    const res = await this.send('Page.captureScreenshot', params);
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

async function runAudit() {
  console.log('=== STARTING CHROME BROWSER AUDIT FOR WAYZYY ===');
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

  await sleep(2000);

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

    console.log('Connected to CDP. Waiting for page ready...');
    await sleep(1500);

    // 1. Audit Desktop 1440x900
    await client.setViewport(1440, 900, false);
    await sleep(500);

    const desktopComputed = await client.eval(`(() => {
      const topBar = document.getElementById('mobileTopBar');
      const bottomNav = document.getElementById('mobileBottomNav');
      const bottomSheet = document.getElementById('mobileBottomSheet');
      const mapModal = document.getElementById('mobileMapModal');
      const globalHeader = document.querySelector('.global-header');
      const mainApp = document.getElementById('mainAppContent');
      const viewHome = document.getElementById('viewHome');

      function getStyles(el) {
        if (!el) return null;
        const cs = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return {
          display: cs.display,
          position: cs.position,
          visibility: cs.visibility,
          opacity: cs.opacity,
          height: rect.height,
          width: rect.width,
          top: rect.top,
          bottom: rect.bottom
        };
      }

      return {
        mobileTopBar: getStyles(topBar),
        mobileBottomNav: getStyles(bottomNav),
        mobileBottomSheet: getStyles(bottomSheet),
        mobileMapModal: getStyles(mapModal),
        globalHeader: getStyles(globalHeader),
        viewHome: getStyles(viewHome),
        pageTitle: document.title,
        bodyHeight: document.body.scrollHeight
      };
    })()`);

    console.log('\n--- DESKTOP COMPUTED STYLES (1440x900) ---');
    console.log(JSON.stringify(desktopComputed, null, 2));

    const ssDesktop = path.join(ARTIFACT_DIR, 'desktop_audit_1440.png');
    await client.captureScreenshot(ssDesktop);

    // 2. Audit Mobile 390x844
    await client.setViewport(390, 844, true);
    await sleep(500);

    const mobileComputed = await client.eval(`(() => {
      const topBar = document.getElementById('mobileTopBar');
      const bottomNav = document.getElementById('mobileBottomNav');
      const globalHeader = document.querySelector('.global-header');
      const appSidebar = document.querySelector('.app-sidebar');

      function getStyles(el) {
        if (!el) return null;
        const cs = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return {
          display: cs.display,
          position: cs.position,
          height: rect.height,
          width: rect.width
        };
      }

      return {
        mobileTopBar: getStyles(topBar),
        mobileBottomNav: getStyles(bottomNav),
        globalHeader: getStyles(globalHeader),
        appSidebar: getStyles(appSidebar)
      };
    })()`);

    console.log('\n--- MOBILE COMPUTED STYLES (390x844) ---');
    console.log(JSON.stringify(mobileComputed, null, 2));

    const ssMobile = path.join(ARTIFACT_DIR, 'mobile_audit_390.png');
    await client.captureScreenshot(ssMobile);

    console.log('\n--- CONSOLE LOGS & ERRORS ---');
    console.log(client.consoleLogs);

    console.log('\n--- FAILED NETWORK REQUESTS (4xx / 5xx) ---');
    console.log(client.networkErrors);

  } finally {
    if (client) client.close();
    chromeProc.kill('SIGKILL');
  }
}

if (require.main === module) {
  runAudit().catch(e => {
    console.error('Audit failed:', e);
    process.exit(1);
  });
}

module.exports = { CDPClient, runAudit };
