# Logic Pro MCP Server

60+ tools for Logic Pro command execution and coarse navigation.

## Architecture

- **Transport**: play, stop, record, rewind, fast-forward, cycle
- **Track Management**: create/delete/mute/solo tracks, select track
- **Region Operations**: create/delete/move/split/merge regions
- **Plugin Control**: load/unload plugins, bypass, reset
- **Routing**: send/receive routing, bus assignments
- **Navigation**: zoom, scroll, select, focus
- **Project**: save, open, new, export, bounce

## Implementation

Built as MCP (Model Context Protocol) server. Agent sends tool calls, MCP server translates to Logic Pro commands via:
1. AppleScript for transport/track/region operations
2. AX API for UI interactions not scriptable via AppleScript
3. MIDI Scripter for deep plugin parameter access

## Status

- [ ] MCP server scaffold
- [ ] AppleScript command layer
- [ ] Tool definitions (60+)
- [ ] Integration with AX daemon for state verification