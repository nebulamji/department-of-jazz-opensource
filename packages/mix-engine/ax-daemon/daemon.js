/**
 * AX Daemon — macOS Accessibility API Observer for Logic Pro
 * 
 * Captures AXValueChangedNotification, AXFocusedUIElementChangedNotification
 * and other accessibility events in real time.
 * 
 * Requires macOS. Runs as a background daemon.
 * Outputs events to agent-activity-stream SSE (port 3002).
 */

const { exec } = require('child_process');
const http = require('http');

const ACTIVITY_STREAM_PORT = 3002;
const AX_POLL_INTERVAL_MS = 100; // How often to poll AX state

// ============================================================
// AX TREE INSPECTION — Swift bridge via osascript
// ============================================================

const AX_INSPECT_SCRIPT = `
use framework "Accessibility"
use framework "Foundation"

on run argv
    set appName to item 1 of argv
    set frontmost to (current application's NSWorkspace's sharedWorkspace()'s frontmostApplication()'s bundleIdentifier()) as text
    
    if frontmost is not equal to appName then
        return "NOT_FRONTMOST"
    end if
    
    -- Get the focused element
    tell application "System Events"
        set focusedElement to focused of process "Logic Pro"
        set elementInfo to {role:role of focusedElement, name:name of focusedElement, value:value of focusedElement}
        return (role of elementInfo) & "|" & (name of elementInfo) & "|" & ((value of elementInfo) as text)
    end tell
end run
`;

// ============================================================
// EVENT EMITTER
// ============================================================

function emitAXEvent(event) {
  const data = JSON.stringify({
    ...event,
    source: 'ax-daemon',
    timestamp: new Date().toISOString(),
  });

  const req = http.request({
    hostname: 'localhost',
    port: ACTIVITY_STREAM_PORT,
    path: '/events',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
  }, () => {});
  req.on('error', () => { /* stream not running — non-blocking */ });
  req.write(data);
  req.end();
}

// ============================================================
// AX OBSERVER — Polling mode (Swift daemon preferred for production)
// ============================================================

let lastState = {};

async function pollAXState() {
  return new Promise((resolve) => {
    exec(`osascript -e 'tell application "System Events"\nset f to focused of process "Logic Pro"\ntry\nset r to role of f\nset n to name of f\nset v to value of f\nreturn r & "|" & n & "|" & v\non error\nreturn "NO_ACCESS"\nend try\nend tell'`, 
    { timeout: 5000 }, (err, stdout, stderr) => {
      if (err || !stdout.trim() || stdout.trim() === 'NO_ACCESS') {
        resolve(null);
        return;
      }
      const [role, name, value] = stdout.trim().split('|');
      resolve({ role, name, value });
    });
  });
}

// ============================================================
// MAIN LOOP
// ============================================================

async function startDaemon() {
  console.log(`AX Daemon started. Polling Logic Pro accessibility tree every ${AX_POLL_INTERVAL_MS}ms`);
  console.log(`Emitting events to activity stream on port ${ACTIVITY_STREAM_PORT}`);

  const stateKey = (s) => `${s.role}|${s.name}|${s.value}`;

  setInterval(async () => {
    const state = await pollAXState();
    if (!state) return;

    const key = stateKey(state);
    if (lastState.key && lastState.key !== key) {
      // State changed — emit event
      emitAXEvent({
        event: 'value_changed',
        element: {
          role: state.role,
          title: state.name,
        },
        value: {
          old: lastState.value,
          new: state.value,
        },
      });
    }
    lastState = { ...state, key };
  }, AX_POLL_INTERVAL_MS);
}

// ============================================================
// SWIFT DAEMON TEMPLATE (for production — real-time notifications)
// ============================================================

const SWIFT_DAEMON_TEMPLATE = `
import Cocoa
import ApplicationServices

class LogicProObserver {
    var observer: AXObserver?
    var processID: pid_t = 0
    
    func start() {
        guard let app = NSRunningApplication(processIdentifier: processID) else { return }
        let pid = app.processIdentifier
        
        let callback: AXObserverCallback = { _, element, notification, _ in
            let notifName = notification.takeRetainedValue() as String
            var value: AnyObject?
            AXUIElementCopyAttributeValue(element, kAXValueAttribute as CFString, &value)
            
            let event: [String: Any] = [
                "source": "ax-daemon",
                "event": notifName,
                "element": String(describing: element),
                "value": String(describing: value),
                "timestamp": ISO8601DateFormatter().string(from: Date())
            ]
            
            if let jsonData = try? JSONSerialization.data(withJSONObject: event),
               let jsonString = String(data: jsonData, encoding: .utf8) {
                // Post to activity stream
                var request = URLRequest(url: URL(string: "http://localhost:3002/events")!)
                request.httpMethod = "POST"
                request.setValue("application/json", forHTTPHeaderField: "Content-Type")
                request.httpBody = jsonData
                URLSession.shared.uploadTask(with: request, from: jsonData).resume()
            }
        }
        
        AXObserverCreate(pid, callback, &observer)
        
        if let obs = observer {
            AXObserverAddNotification(obs, app.axUIElement, kAXValueChangedNotification as CFString, nil)
            AXObserverAddNotification(obs, app.axUIElement, kAXFocusedUIElementChangedNotification as CFString, nil)
            CFRunLoopAddSource(CFRunLoopGetCurrent(), AXObserverGetRunLoopSource(obs), .defaultMode)
        }
        
        CFRunLoopRun()
    }
}

let observer = LogicProObserver()
observer.start()
`;

// ============================================================
// CLI
// ============================================================

if (require.main === module) {
  const [,, cmd] = process.argv;
  
  if (cmd === 'template') {
    console.log(SWIFT_DAEMON_TEMPLATE);
  } else if (cmd === 'swift') {
    console.log('# Compile and run the Swift daemon:');
    console.log('# 1. Save SWIFT_DAEMON_TEMPLATE to ax-observer.swift');
    console.log('# 2. swiftc ax-observer.swift -o ax-observer -framework Cocoa -framework ApplicationServices');
    console.log('# 3. ./ax-observer');
    console.log('\n# Requires Accessibility permissions in System Preferences > Security & Privacy');
  } else {
    startDaemon();
  }
}

module.exports = { startDaemon, emitAXEvent, pollAXState };