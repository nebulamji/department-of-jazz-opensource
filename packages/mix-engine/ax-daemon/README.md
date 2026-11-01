# AX Daemon — macOS Accessibility API

Real-time UI state observation for Logic Pro.

## What It Captures

- `AXValueChangedNotification` — exact numerical values for every knob, fader, slider
- `AXFocusedUIElementChangedNotification` — focus changes (which plugin, which parameter)
- `AXWindowMovedNotification` / `AXWindowResizedNotification` — window state
- `AXSelectedTextChangedNotification` — selection state

## Why Not Screenshots

| Approach | Resolution | Latency | Cost | Accuracy |
|----------|-----------|---------|------|----------|
| Screenshots (v1) | Visual guess | 5s poll | $10-12/session | ~70% |
| AX API (v2) | Exact numeric | Real-time | $0.00 | 100% |

## Architecture

```
Logic Pro UI
    │
    ├── AXObserver (per-window)
    │   ├── AXValueChanged → event stream
    │   ├── AXFocusedUIElementChanged → event stream
    │   └── AXSelectedTextChanged → event stream
    │
    └── Element tree traversal
        └── Snapshot on demand → state dump
```

## Output Format

```json
{
  "timestamp": "2026-04-18T19:00:00.000Z",
  "source": "ax-daemon",
  "event": "value_changed",
  "element": {
    "role": "AXSlider",
    "title": "Q",
    "parent": "Channel EQ",
    "track": "Drum Bus"
  },
  "value": {
    "old": 1.2,
    "new": 2.8
  }
}
```

## Status

- [ ] AX daemon scaffold (Swift/Node.js)
- [ ] Logic Pro element tree mapping
- [ ] Event stream → SSE bridge (port 3002)
- [ ] Integration with agent-activity-stream