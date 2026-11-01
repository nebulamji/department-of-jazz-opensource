# mix-engine
Four parts: a Logic Pro MCP server (`logic-mcp`), an accessibility-API state daemon (`ax-daemon`), a MIDI Scripter bridge (`midi-scripter`) and a Suno browser agent (`suno-agent`). Each folder has its own README. macOS-only parts are marked. Use your own accounts and keys; nothing is bundled.

## What it touches
Everything runs on the Mac you start it on. `logic-mcp` drives Logic Pro through local AppleScript; the AX daemon reads Logic's on-screen state through macOS Accessibility (you grant that permission); the MIDI Scripter bridge tails a local log file; the Suno agent opens its own Playwright browser. The only network call is an optional fire-and-forget POST to `localhost:3002`. It connects to no other device or remote service, and `logic-mcp` validates every parameter before it reaches AppleScript.
