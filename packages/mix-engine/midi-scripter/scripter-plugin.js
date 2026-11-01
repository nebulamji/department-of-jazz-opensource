/**
 * MIDI Scripter Bridge — Plugin Parameter Streaming
 * 
 * Template for Logic Pro MIDI Scripter plugins.
 * Captures deep plugin parameters that AX API doesn't expose.
 * Streams CC values → JSON → activity stream SSE (port 3002).
 * 
 * Usage: Load this script in Logic Pro's MIDI Scripter plugin.
 * It maps parameter changes to MIDI CCs, which the bridge
 * captures and forwards to the activity stream.
 */

// ============================================================
// MIDI SCRIPTER PLUGIN — Runs inside Logic Pro's Scripter
// ============================================================

var ParameterHistory = {};
var lastEventTime = 0;
var MIN_EVENT_INTERVAL = 50; // ms between events to avoid flooding

function HandleMIDI(event) {
    // Only process CC messages (parameter changes)
    if (event instanceof ControlChange) {
        var now = Date.now();
        if (now - lastEventTime < MIN_EVENT_INTERVAL) return;
        
        var ccNumber = event.number;
        var ccValue = event.value; // 0-127
        var channel = event.channel;
        
        // Map CC to parameter name
        var paramName = CC_MAP[ccNumber] || "cc" + ccNumber;
        var prevValue = ParameterHistory[ccNumber];
        
        // Only emit on change
        if (prevValue !== undefined && prevValue !== ccValue) {
            var eventObj = {
                timestamp: new Date().toISOString(),
                source: "midi-scripter",
                event: "parameter_changed",
                cc: ccNumber,
                channel: channel,
                parameter: paramName,
                value: {
                    raw: ccValue,
                    normalized: ccValue / 127,
                    previous: prevValue / 127
                }
            };
            
            // Log to Scripter console (captured by bridge)
            Trace(JSON.stringify(eventObj));
        }
        
        ParameterHistory[ccNumber] = ccValue;
        lastEventTime = now;
    }
    
    // Pass through all MIDI
    event.send();
}

// ============================================================
// CC MAP — Common plugin parameter mappings
// ============================================================

var CC_MAP = {
    // Channel EQ
    1: "eq_band1_gain",
    2: "eq_band1_freq",
    3: "eq_band1_q",
    4: "eq_band2_gain",
    5: "eq_band2_freq",
    6: "eq_band2_q",
    7: "eq_band3_gain",
    8: "eq_band3_freq",
    9: "eq_band3_q",
    10: "eq_band4_gain",
    11: "eq_band4_freq",
    12: "eq_band4_q",
    
    // Compressor
    20: "comp_threshold",
    21: "comp_ratio",
    22: "comp_attack",
    23: "comp_release",
    24: "comp_makeup_gain",
    25: "comp_knee",
    
    // Reverb
    30: "reverb_predelay",
    31: "reverb_decay",
    32: "reverb_wet",
    33: "reverb_dry",
    34: "reverb_damping",
    
    // Limiter
    40: "limiter_ceiling",
    41: "limiter_threshold",
    42: "limiter_release",
    43: "limiter_lookahead",
    
    // General
    50: "volume",
    51: "pan",
    52: "send_a",
    53: "send_b",
    54: "mute",
    55: "solo"
};

// ============================================================
// PLUGIN-SPECIFIC TEMPLATES
// ============================================================

/**
 * Load these as separate Scripter instances per plugin type.
 * Each template extends the base CC_MAP with plugin-specific mappings.
 */

var CHANNEL_EQ_TEMPLATE = {
    1: "band1_gain_+-24dB",
    2: "band1_freq_20-20kHz",
    3: "band1_q_0.1-100",
    4: "band2_gain",
    5: "band2_freq",
    6: "band2_q",
    7: "band3_gain",
    8: "band3_freq",
    9: "band3_q",
    10: "band4_gain",
    11: "band4_freq",
    12: "band4_q",
    70: "band1_type_off_peak_shelv",
    71: "band2_type",
    72: "band3_type",
    73: "band4_type"
};

var COMPRESSOR_TEMPLATE = {
    20: "threshold_-60to0dB",
    21: "ratio_1to20",
    22: "attack_0.1to400ms",
    23: "release_5to3000ms",
    24: "makeup_0to24dB",
    25: "knee_0to30dB",
    26: "sidechain_filter",
    27: "mix_0to100pct"
};

var SPACE_DESIGNER_TEMPLATE = {
    30: "predelay_0to500ms",
    31: "decay_0.1to30s",
    32: "wet_0to100pct",
    33: "dry_0to100pct",
    34: "damping_low_20to20kHz",
    35: "damping_high_20to20kHz",
    36: "early_reflections_level",
    37: "late_reverb_level"
};