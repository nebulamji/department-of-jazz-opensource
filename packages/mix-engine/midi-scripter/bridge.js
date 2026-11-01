/**
 * MIDI Scripter Bridge — Captures Scripter Trace output → Activity Stream
 * 
 * Logic Pro's Scripter plugin writes to a trace console.
 * This bridge tails the trace log and forwards events to
 * the agent-activity-stream SSE hub on port 3002.
 * 
 * Run on the same Mac as Logic Pro.
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const readline = require('readline');

const ACTIVITY_STREAM_PORT = 3002;
const ACTIVITY_STREAM_HOST = 'localhost';

// Logic Pro Scripter trace log location (macOS)
const SCRIPTER_LOG_PATHS = [
  '~/Library/Logs/Logic Pro X/Scripter.log',
  '/tmp/logic-scripter-trace.log',
  '~/Library/Application Support/Logic/Scripter/trace.log',
];

// ============================================================
// BRIDGE — Watch Scripter output and forward events
// ============================================================

class MIDIScripterBridge {
  constructor(options = {}) {
    this.port = options.port || ACTIVITY_STREAM_PORT;
    this.host = options.host || ACTIVITY_STREAM_HOST;
    this.logPath = options.logPath || this.findScripterLog();
    this.watcher = null;
    this.lastPosition = 0;
    this.eventCount = 0;
  }

  findScripterLog() {
    for (const p of SCRIPTER_LOG_PATHS) {
      const expanded = p.replace('~', process.env.HOME || '/root');
      if (fs.existsSync(expanded)) return expanded;
    }
    // Default — will be created by Logic Pro
    return SCRIPTER_LOG_PATHS[0].replace('~', process.env.HOME || '/root');
  }

  start() {
    console.log(`MIDI Scripter Bridge starting...`);
    console.log(`Watching: ${this.logPath}`);
    console.log(`Forwarding to: ${this.host}:${this.port}`);

    // Check if log file exists
    if (!fs.existsSync(this.logPath)) {
      console.log('Scripter log not found. Waiting for Logic Pro to create it...');
      this.waitForLog();
      return;
    }

    this.watchLog();
  }

  waitForLog() {
    const checkInterval = setInterval(() => {
      if (fs.existsSync(this.logPath)) {
        clearInterval(checkInterval);
        console.log('Scripter log found. Starting watch...');
        this.watchLog();
      }
    }, 5000);
  }

  watchLog() {
    // Read from current end of file
    this.lastPosition = fs.statSync(this.logPath).size;

    this.watcher = fs.watch(path.dirname(this.logPath), (eventType, filename) => {
      if (filename === path.basename(this.logPath)) {
        this.readNewEvents();
      }
    });

    // Also poll for changes (fs.watch can be unreliable)
    setInterval(() => this.readNewEvents(), 200);
  }

  readNewEvents() {
    try {
      const stat = fs.statSync(this.logPath);
      if (stat.size <= this.lastPosition) return;

      const readStream = fs.createReadStream(this.logPath, {
        start: this.lastPosition,
        end: stat.size,
      });

      let buffer = '';
      readStream.on('data', (chunk) => { buffer += chunk.toString(); });
      readStream.on('end', () => {
        this.lastPosition = stat.size;
        this.processBuffer(buffer);
      });
    } catch (e) {
      // File might be temporarily locked by Logic Pro
    }
  }

  processBuffer(buffer) {
    const lines = buffer.split('\n').filter(l => l.trim());
    for (const line of lines) {
      try {
        const event = JSON.parse(line.trim());
        this.forwardToActivityStream(event);
        this.eventCount++;
      } catch (e) {
        // Not JSON — might be Scripter debug output, skip
      }
    }
  }

  forwardToActivityStream(event) {
    const data = JSON.stringify(event);
    const req = http.request({
      hostname: this.host,
      port: this.port,
      path: '/events',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
    }, () => {});
    req.on('error', () => { /* stream not running — non-blocking */ });
    req.write(data);
    req.end();
  }

  stop() {
    if (this.watcher) this.watcher.close();
    console.log(`Bridge stopped. ${this.eventCount} events forwarded.`);
  }
}

// ============================================================
// CLI
// ============================================================

if (require.main === module) {
  const bridge = new MIDIScripterBridge({
    logPath: process.argv[2], // Optional: pass log path as arg
  });
  
  bridge.start();
  
  process.on('SIGINT', () => {
    bridge.stop();
    process.exit(0);
  });
}

module.exports = { MIDIScripterBridge };