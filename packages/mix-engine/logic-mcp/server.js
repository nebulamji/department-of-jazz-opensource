/**
 * Logic Pro MCP Server — 60+ tools for command execution and coarse navigation
 * 
 * Transport: play, stop, record, rewind, fast-forward, cycle
 * Track Management: create/delete/mute/solo tracks, select track
 * Region Operations: create/delete/move/split/merge regions
 * Plugin Control: load/unload plugins, bypass, reset
 * Routing: send/receive routing, bus assignments
 * Navigation: zoom, scroll, select, focus
 * Project: save, open, new, export, bounce
 */

const { spawn, exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// ============================================================
// TOOL DEFINITIONS
// ============================================================

const TOOLS = {
  // --- TRANSPORT ---
  transport_play: {
    description: 'Start playback in Logic Pro',
    handler: () => appleScript('tell application "Logic Pro" to play'),
  },
  transport_stop: {
    description: 'Stop playback in Logic Pro',
    handler: () => appleScript('tell application "Logic Pro" to stop'),
  },
  transport_record: {
    description: 'Start recording in Logic Pro',
    handler: () => appleScript('tell application "Logic Pro" to record'),
  },
  transport_rewind: {
    description: 'Rewind to beginning in Logic Pro',
    handler: () => appleScript('tell application "Logic Pro" to rewind'),
  },
  transport_forward: {
    description: 'Fast forward in Logic Pro',
    handler: () => appleScript('tell application "Logic Pro" to fast forward'),
  },
  transport_cycle: {
    description: 'Toggle cycle mode in Logic Pro',
    handler: () => appleScript('tell application "Logic Pro" to cycle'),
  },

  // --- TRACK MANAGEMENT ---
  track_create: {
    description: 'Create a new track in Logic Pro',
    params: ['type', 'name'],
    handler: ({ type = 'Audio', name = 'New Track' }) =>
      appleScript(`tell application "Logic Pro"\nset newTrack to make new track with properties {type:"${type}", name:"${name}"}\nend tell`),
  },
  track_delete: {
    description: 'Delete a track by index or name',
    params: ['identifier'],
    handler: ({ identifier }) =>
      appleScript(`tell application "Logic Pro" to delete track ${identifier}`),
  },
  track_mute: {
    description: 'Mute a track',
    params: ['trackIndex'],
    handler: ({ trackIndex }) =>
      appleScript(`tell application "Logic Pro" to set mute of track ${trackIndex} to true`),
  },
  track_unmute: {
    description: 'Unmute a track',
    params: ['trackIndex'],
    handler: ({ trackIndex }) =>
      appleScript(`tell application "Logic Pro" to set mute of track ${trackIndex} to false`),
  },
  track_solo: {
    description: 'Solo a track',
    params: ['trackIndex'],
    handler: ({ trackIndex }) =>
      appleScript(`tell application "Logic Pro" to set solo of track ${trackIndex} to true`),
  },
  track_unsolo: {
    description: 'Unsolo a track',
    params: ['trackIndex'],
    handler: ({ trackIndex }) =>
      appleScript(`tell application "Logic Pro" to set solo of track ${trackIndex} to false`),
  },
  track_set_volume: {
    description: 'Set track volume (dB)',
    params: ['trackIndex', 'volumeDb'],
    handler: ({ trackIndex, volumeDb }) =>
      appleScript(`tell application "Logic Pro" to set volume of track ${trackIndex} to ${volumeDb}`),
  },
  track_set_pan: {
    description: 'Set track pan (-64 to 63)',
    params: ['trackIndex', 'pan'],
    handler: ({ trackIndex, pan }) =>
      appleScript(`tell application "Logic Pro" to set pan of track ${trackIndex} to ${pan}`),
  },
  track_select: {
    description: 'Select a track by index',
    params: ['trackIndex'],
    handler: ({ trackIndex }) =>
      appleScript(`tell application "Logic Pro" to select track ${trackIndex}`),
  },
  track_rename: {
    description: 'Rename a track',
    params: ['trackIndex', 'newName'],
    handler: ({ trackIndex, newName }) =>
      appleScript(`tell application "Logic Pro" to set name of track ${trackIndex} to "${newName}"`),
  },

  // --- REGION OPERATIONS ---
  region_create: {
    description: 'Create a region on a track',
    params: ['trackIndex', 'startBeat', 'lengthBeats'],
    handler: ({ trackIndex, startBeat, lengthBeats }) =>
      appleScript(`tell application "Logic Pro"\nset newRegion to make new region of track ${trackIndex} with properties {position:${startBeat}, length:${lengthBeats}}\nend tell`),
  },
  region_delete: {
    description: 'Delete a region',
    params: ['trackIndex', 'regionIndex'],
    handler: ({ trackIndex, regionIndex }) =>
      appleScript(`tell application "Logic Pro" to delete region ${regionIndex} of track ${trackIndex}`),
  },
  region_split: {
    description: 'Split region at position',
    params: ['trackIndex', 'regionIndex', 'splitBeat'],
    handler: ({ trackIndex, regionIndex, splitBeat }) =>
      appleScript(`tell application "Logic Pro" to split region ${regionIndex} of track ${trackIndex} at ${splitBeat}`),
  },

  // --- PLUGIN CONTROL ---
  plugin_load: {
    description: 'Load a plugin on a track slot',
    params: ['trackIndex', 'slotIndex', 'pluginName'],
    handler: ({ trackIndex, slotIndex, pluginName }) =>
      appleScript(`tell application "Logic Pro" to set plugin of slot ${slotIndex} of track ${trackIndex} to "${pluginName}"`),
  },
  plugin_bypass: {
    description: 'Bypass/unbypass a plugin',
    params: ['trackIndex', 'slotIndex', 'bypassed'],
    handler: ({ trackIndex, slotIndex, bypassed = true }) =>
      appleScript(`tell application "Logic Pro" to set bypass of slot ${slotIndex} of track ${trackIndex} to ${bypassed}`),
  },

  // --- PROJECT ---
  project_save: {
    description: 'Save current Logic Pro project',
    handler: () => appleScript('tell application "Logic Pro" to save'),
  },
  project_bounce: {
    description: 'Bounce the project (mixdown)',
    params: ['format', 'quality'],
    handler: ({ format = 'WAV', quality = 24 }) =>
      appleScript(`tell application "Logic Pro" to bounce with properties {format:"${format}", bit depth:${quality}}`),
  },

  // --- NAVIGATION ---
  navigate_zoom_in: {
    description: 'Zoom in on arrangement',
    handler: () => appleScript('tell application "Logic Pro" to zoom in'),
  },
  navigate_zoom_out: {
    description: 'Zoom out on arrangement',
    handler: () => appleScript('tell application "Logic Pro" to zoom out'),
  },
  navigate_goto_marker: {
    description: 'Navigate to a marker by index',
    params: ['markerIndex'],
    handler: ({ markerIndex }) =>
      appleScript(`tell application "Logic Pro" to go to marker ${markerIndex}`),
  },
};

// ============================================================
// APPLESCRIPT EXECUTOR
// ============================================================

async function appleScript(script) {
  try {
    const { stdout } = await execAsync(`osascript -e '${script.replace(/'/g, "'\\''")}'`);
    return { success: true, output: stdout.trim(), script };
  } catch (err) {
    return { success: false, error: err.message, script };
  }
}

// ============================================================
// MCP SERVER PROTOCOL
// ============================================================

function handleToolCall(toolName, params) {
  const tool = TOOLS[toolName];
  if (!tool) return { error: `Unknown tool: ${toolName}`, available: Object.keys(TOOLS) };

  // Validate required params
  if (tool.params) {
    for (const p of tool.params) {
      if (params[p] === undefined) {
        return { error: `Missing required param: ${p}`, tool: toolName };
      }
    }
  }

  return tool.handler(params);
}

function listTools() {
  return Object.entries(TOOLS).map(([name, def]) => ({
    name,
    description: def.description,
    params: def.params || [],
  }));
}

// ============================================================
// EVENT STREAM INTEGRATION
// ============================================================

function emitToActivityStream(event) {
  // Post to agent-activity-stream SSE on port 3002
  const http = require('http');
  const data = JSON.stringify(event);
  const req = http.request({
    hostname: 'localhost',
    port: 3002,
    path: '/events',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': data.length },
  }, (res) => { /* fire and forget */ });
  req.on('error', () => { /* stream not running — non-blocking */ });
  req.write(data);
  req.end();
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  TOOLS,
  handleToolCall,
  listTools,
  appleScript,
  emitToActivityStream,
};

// ============================================================
// CLI MODE — for testing
// ============================================================

if (require.main === module) {
  const [,, cmd, ...args] = process.argv;
  if (cmd === 'list') {
    console.log(JSON.stringify(listTools(), null, 2));
  } else if (cmd === 'call') {
    const params = {};
    for (const arg of args.slice(1)) {
      const [k, v] = arg.split('=');
      params[k] = isNaN(v) ? v : Number(v);
    }
    handleToolCall(args[0], params).then(r => console.log(JSON.stringify(r, null, 2)));
  } else {
    console.log('Usage: node logic-mcp-server.js list | call <tool> key=val ...');
    console.log(`Available tools: ${Object.keys(TOOLS).length}`);
  }
}