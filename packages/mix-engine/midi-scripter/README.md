# MIDI Scripter Bridge — Plugin Parameter Streaming

Deep parameter access for Logic Pro plugins via MIDI Scripter.

## What It Captures

- EQ frequency, gain, Q per band
- Compressor threshold, ratio, attack, release, makeup gain
- Reverb pre-delay, decay, wet/dry
- Limiter ceiling, threshold, release
- Any plugin parameter exposed via MIDI CC mapping

## Why AX + MIDI Scripter

AX API captures UI-level state. MIDI Scripter captures deep plugin internals that AX doesn't expose:
- Plugin parameters not visible in UI
- Automation curve data
- Signal chain routing
- Bypass states hidden from accessibility tree

## Architecture

```
Logic Pro Plugins
    │
    ├── MIDI Scripter (per-plugin)
    │   ├── Parameter change → MIDI CC → event stream
    │   └── Automation data → MIDI CC → event stream
    │
    └── Bridge Script
        └── CC → JSON → SSE (port 3002)
```

## Output Format

```json
{
  "timestamp": "2026-04-18T19:00:00.000Z",
  "source": "midi-scripter",
  "plugin": "Channel EQ",
  "track": "Drum Bus",
  "parameter": "Q",
  "band": 3,
  "value": 2.8,
  "cc": 74
}
```

## Status

- [ ] MIDI Scripter template for common plugins
- [ ] CC → JSON bridge
- [ ] Plugin parameter mapping database
- [ ] Integration with agent-activity-stream