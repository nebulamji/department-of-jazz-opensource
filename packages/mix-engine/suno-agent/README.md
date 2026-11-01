# Suno Agent — Browser-Use / CDP Monitoring

Structured DOM + network observation for Suno music generation.

## What It Captures

- Generation state (queued, generating, complete, failed)
- Prompt/caption text
- Audio URL on generation complete
- Style/genre metadata
- Duration, instrumental flag
- Network requests (API calls, WebSocket messages)

## Why Browser-Use / CDP (Not Screenshots)

| Approach | Data | Latency | Cost |
|----------|------|---------|------|
| Screenshots (v1) | Visual guess of state | 5s poll | $10-12/session |
| Browser-Use CDP (v2) | Exact DOM state + network | Real-time | ~$0.10/session |

## Architecture

```
Suno Web App
    │
    ├── Browser-Use Agent (CDP)
    │   ├── DOM mutation observer → generation state
    │   ├── Network interceptor → API calls
    │   └── WebSocket monitor → real-time events
    │
    └── Event extraction
        └── Structured JSON → SSE (port 3002)
```

## Output Format

```json
{
  "timestamp": "2026-04-18T19:00:00.000Z",
  "source": "suno-agent",
  "event": "generation_complete",
  "data": {
    "id": "suno-abc123",
    "prompt": "Jazz quartet, modal, Coltrane-inspired",
    "style": "Jazz",
    "duration_sec": 180,
    "instrumental": true,
    "audio_url": "https://cdn.suno.ai/...",
    "quality_rating": null
  }
}
```

## Status

- [ ] Browser-Use agent scaffold
- [ ] Suno DOM selectors mapped
- [ ] Network interceptor for API calls
- [ ] Event stream → SSE bridge (port 3002)
- [ ] Quality rating input (manual or automated)