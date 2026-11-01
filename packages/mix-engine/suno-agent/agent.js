/**
 * Suno Agent — Browser-Use / CDP Monitoring
 * 
 * Monitors Suno music generation via structured DOM + network capture.
 * Not screenshots. Real DOM state, real API calls.
 * 
 * Uses Playwright (CDP) for browser automation and event capture.
 */

const { chromium } = require('playwright');

// ============================================================
// SUNO SELECTORS (DOM mapping)
// ============================================================

const SELECTORS = {
  // Generation state
  generateButton: 'button[data-testid="generate-btn"], button:has-text("Create")',
  promptInput: 'textarea[data-testid="prompt-input"], textarea[placeholder*="Describe"]',
  styleInput: 'input[data-testid="style-input"], input[placeholder*="Style"]',
  
  // Generation status
  queued: '.generation-status.queued, [data-state="queued"]',
  generating: '.generation-status.generating, [data-state="generating"]',
  complete: '.generation-status.complete, [data-state="complete"]',
  failed: '.generation-status.failed, [data-state="failed"]',
  
  // Output
  audioPlayer: 'audio source, audio[src]',
  trackTitle: '.track-title, [data-testid="track-title"]',
  trackDuration: '.track-duration, [data-testid="duration"]',
  
  // Metadata
  instrumentalToggle: 'input[type="checkbox"][data-testid="instrumental"]',
  versionSelect: 'select[data-testid="model-version"]',
};

// ============================================================
// NETWORK INTERCEPTOR
// ============================================================

class SunoNetworkCapture {
  constructor() {
    this.apiCalls = [];
    this.generations = [];
  }

  intercept(route) {
    const url = new URL(route.request().url());
    
    // Capture Suno API calls
    if (url.hostname.includes('suno') || url.hostname.includes('sunoapi')) {
      this.apiCalls.push({
        timestamp: new Date().toISOString(),
        method: route.request().method(),
        url: route.request().url(),
        headers: route.request().headers(),
      });
    }
    
    // Capture generation completion via API response
    if (url.pathname.includes('/generate') || url.pathname.includes('/clip')) {
      route.request().response().then(response => {
        if (response.status() === 200) {
          try {
            response.json().then(body => {
              this.generations.push({
                timestamp: new Date().toISOString(),
                source: 'suno-agent',
                event: 'generation_complete',
                data: {
                  id: body.id || body.clip_id,
                  prompt: body.prompt || body.metadata?.prompt,
                  style: body.style || body.metadata?.style,
                  duration_sec: body.duration || body.metadata?.duration,
                  instrumental: body.instrumental || body.metadata?.instrumental,
                  audio_url: body.audio_url || body.url,
                  quality_rating: null, // To be filled by engineer or automated rating
                },
              });
            });
          } catch (e) { /* non-JSON response */ }
        }
      }).catch(() => {});
    }
    
    route.continue();
  }
}

// ============================================================
// DOM OBSERVER
// ============================================================

class SunoDOMObserver {
  constructor(page) {
    this.page = page;
    this.lastState = null;
  }

  async captureState() {
    const state = await this.page.evaluate((selectors) => {
      const getElementText = (sel) => {
        const el = document.querySelector(sel);
        return el ? el.textContent?.trim() || el.value || null : null;
      };
      
      const getGenerationStatus = () => {
        for (const [status, sel] of Object.entries({
          queued: selectors.queued,
          generating: selectors.generating,
          complete: selectors.complete,
          failed: selectors.failed,
        })) {
          if (document.querySelector(sel)) return status;
        }
        return 'idle';
      };

      return {
        prompt: getElementText(selectors.promptInput),
        style: getElementText(selectors.styleInput),
        status: getGenerationStatus(),
        trackTitle: getElementText(selectors.trackTitle),
        duration: getElementText(selectors.trackDuration),
        instrumental: document.querySelector(selectors.instrumentalToggle)?.checked || false,
      };
    }, SELECTORS);

    return state;
  }

  async watch(intervalMs = 2000) {
    setInterval(async () => {
      try {
        const state = await this.captureState();
        if (JSON.stringify(state) !== JSON.stringify(this.lastState)) {
          this.emitStateChange(this.lastState, state);
          this.lastState = state;
        }
      } catch (e) {
        // Page might have navigated or closed
      }
    }, intervalMs);
  }

  emitStateChange(oldState, newState) {
    const event = {
      source: 'suno-agent',
      timestamp: new Date().toISOString(),
      event: 'state_changed',
      old: oldState,
      new: newState,
    };
    
    this.emitToActivityStream(event);
  }

  emitToActivityStream(event) {
    const data = JSON.stringify(event);
    const req = require('http').request({
      hostname: 'localhost',
      port: 3002,
      path: '/events',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
    }, () => {});
    req.on('error', () => {});
    req.write(data);
    req.end();
  }
}

// ============================================================
// MAIN — Launch browser and start monitoring
// ============================================================

async function startSunoAgent(headless = false) {
  const browser = await chromium.launch({ headless });
  const context = await browser.newContext();
  
  // Set up network capture
  const networkCapture = new SunoNetworkCapture();
  await context.route('**/*', (route) => networkCapture.intercept(route));
  
  // Navigate to Suno
  const page = await context.newPage();
  await page.goto('https://suno.com/create');
  
  // Start DOM observer
  const domObserver = new SunoDOMObserver(page);
  await domObserver.watch();
  
  console.log('Suno Agent started. Monitoring DOM + network.');
  console.log(`Network API calls captured: ${networkCapture.apiCalls.length}`);
  
  return { browser, page, networkCapture, domObserver };
}

// ============================================================
// CLI
// ============================================================

if (require.main === module) {
  startSunoAgent(process.argv.includes('--headless')).then(() => {
    console.log('Suno Agent running. Press Ctrl+C to stop.');
  }).catch(err => {
    console.error('Failed to start Suno Agent:', err.message);
    console.log('\nMake sure Playwright is installed: npm install playwright && npx playwright install chromium');
    process.exit(1);
  });
}

module.exports = { SunoNetworkCapture, SunoDOMObserver, startSunoAgent };