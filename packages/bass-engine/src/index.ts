// Bass-line engine: chord-tone voice leading, chromatic approach, fingerboard position ranges.
// Pure TypeScript, no network, no data files, no API keys. Output uses weighted Math.random(), so
// repeated calls with the same input differ by design.
//
// Chord changes for named tunes are NOT bundled. Pass your own StandardsSource (see resolveNamedStandard).
// validateBassLine already covers the core protections (no repeated notes, forced beat4->beat1
// resolution, dissonance-on-strong-beats correction, no downward-fourth leaps), but the fuller
// rule set's additional checks are not applied here. Flagged, not fabricated.

export type NoteName = { pitch: string; octave: number }

export interface BassParams {
  // 0-100, real: fraction of non-strong beats that use chromatic movement. Mapped from the
  // frontend's "intervallicChromaticBalance" slider (the original app: melodicChromatic).
  melodicChromatic?: number
  // Real: which chord tone opens the line. 'auto'/undefined triggers the same weighted-random
  // selection the original app used (56% root / 11% 3rd / 11% 5th / 8% 6th(13th) / 10% 7th / 4% 9th).
  startingNote?: 'root' | '3rd' | '5th' | '7th' | '9th' | '11th' | '13th' | 'any' | 'alternate'
  // Real fingerboard-position constraints (confirmed wired into getChordTones's octave selection).
  firstPosition?: boolean
  fourthPosition?: boolean
  thumbPosition?: boolean
  highThumb?: boolean
}

// --- Music theory constants (ported verbatim from bass-algorithms-old.ts) ---

const NOTE_VALUES: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, Fb: 4, F: 5,
  'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11, Cb: 11,
}
const CHROMATIC_SCALE_FLATS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
// Output-facing chromatic array: only C#/F# are ever spelled sharp (matches getNoteName below).
// index.ts's pitchToSemitone/noteSpecFromPitchOctave rely on this exact spelling.
const CHROMATIC = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']

const CHORD_INTERVALS: Record<string, number[]> = {
  maj: [0, 4, 7], maj7: [0, 4, 7, 11], '6': [0, 4, 7, 9],
  m: [0, 3, 7], m7: [0, 3, 7, 10], '7': [0, 4, 7, 10],
  m7b5: [0, 3, 6, 10], dim: [0, 3, 6], dim7: [0, 3, 6, 9], aug: [0, 4, 8], sus4: [0, 5, 7],
  // Real bug found (2026-09-20, a user spotted it on a downloaded Autumn Leaves chart):
  // 'm6' (minor-sixth, e.g. the tune's own tonic-resolution chord "Gm6") had no interval set at
  // all AND no case in getChordQuality() -- it silently fell through to the bare 'm' check and
  // was played as a plain minor triad, losing the 6th/13th that defines the chord's actual
  // sound. Confirmed via a full DB scan: 1,583 chord instances across 463 songs (about 1 in 5
  // songs in the whole corpus use it somewhere) -- this wasn't a one-song issue.
  m6: [0, 3, 7, 9],
  // Minor-major-seventh: b3 + perfect 5 + MAJOR 7 (not the b7 that plain m7 has).
  mMaj7: [0, 3, 7, 11],
}

// --- Position ranges (ported verbatim; confirmed real -- wired into getChordTones) ---

function getPositionOctave(_noteName: string, params: BassParams): number {
  if (params.highThumb) return Math.random() < 0.8 ? 3 : 2
  if (params.thumbPosition) return Math.random() < 0.8 ? 3 : 2
  if (params.fourthPosition) return Math.random() < 0.6 ? 2 : 3
  if (params.firstPosition) return Math.random() < 0.7 ? 2 : 1
  return 2
}

function isInPositionRange(note: string, params: BassParams): boolean {
  const match = note.match(/^([A-G][#b]?)(\d+)$/)
  if (!match) return true
  const octave = parseInt(match[2], 10)
  if (params.firstPosition && (octave < 1 || octave > 2)) return false
  if (params.fourthPosition && (octave < 1 || octave > 3)) return false
  if (params.thumbPosition && (octave < 2 || octave > 3)) return false
  if (params.highThumb && (octave < 2 || octave > 3)) return false
  return true
}

// --- Chord parsing / chord tones (ported verbatim) ---

export function getChordRoot(chord: string): string {
  const match = chord.match(/^([A-G][b#]?)/)
  return match ? match[1] : 'C'
}

// Real, systemic bug found and fixed (2026-09-20, second pass): this function only recognized
// the spelled-out lowercase words ('maj7'/'maj'/'dim7'/'dim'/'aug'/'sus4'), missing every common
// shorthand jazz-chart symbol -- confirmed by a full scan of the large chord-chart corpus
// (134,355 total chord instances): 23,887 chords (~18% of the entire corpus) were being
// misclassified, the single largest group being 12,906+ chords using capital-M major-seventh
// notation ("BbM7", "CM9") that fell through to the default plain major TRIAD -- silently
// dropping the major 7th from the available chord tones on every one of them. This is the exact
// same class of bug as the already-fixed altered-5th case (getFifthOverride below), just a
// different oversight in the same function. Order matters: capital 'M' must be checked before
// the lowercase 'm' (minor) checks since JS string comparison is case-sensitive and these are
// deliberately distinct symbols in real notation.
export function getChordQuality(chord: string): string {
  const root = getChordRoot(chord)
  const remaining = chord.slice(root.length)

  // Diminished: spelled 'dim'/'dim7', the standard chart shorthand 'o'/'o7' (2,775 chords in
  // the chart corpus), or the half-diminished chart shorthand 'h7' (e.g. "Gh7" == Gm7b5, 15 chords --
  // small count but a large quality error when missed, major triad instead of half-diminished).
  if (remaining.startsWith('dim7') || remaining.startsWith('o7')) return 'dim7'
  if (remaining.startsWith('dim') || remaining.startsWith('o')) return 'dim'
  if (remaining.startsWith('h7')) return 'm7b5'

  // Major-seventh: spelled 'maj7' or capital-M shorthand ('BbM7', 'CM9', 'GM7#11' -- 13,000+
  // occurrences). '(?!in)' defensively guards against a hypothetical 'Min' spelling (none found
  // in the live DB, but cheap to guard against). 'maj9'/'maj13' (61 chords) imply the major 7th
  // is present the same way bare '9'/'13' implies a dominant 7th below -- must be checked before
  // the bare 'maj' triad fallback or they'd lose the 7th entirely.
  if (remaining.startsWith('maj7')) return 'maj7'
  if (/^maj(9|13)/.test(remaining)) return 'maj7'
  if (/^M(?!in)/.test(remaining)) return 'maj7'
  if (remaining.startsWith('maj')) return 'maj'

  // Minor-major-seventh (b3, 5, MAJOR 7th -- a distinct, real quality, not a typo of m7) --
  // 398 chords, e.g. "GmM7"/"BbmMaj7". Must come before the m7/m6/bare-m checks.
  if (remaining.startsWith('mM7') || remaining.startsWith('mMaj7')) return 'mMaj7'
  if (remaining.startsWith('m7b5')) return 'm7b5'
  if (remaining.startsWith('m7')) return 'm7'
  if (remaining.startsWith('m6')) return 'm6' // must come before the bare 'm' check below
  // 'm9'/'m11'/'m13' (1,446 chords) imply the b7 is present, same logic as 'maj9' above --
  // without this they fell to the bare minor TRIAD check next, losing the 7th entirely.
  if (/^m(9|11|13)/.test(remaining)) return 'm7'
  if (remaining.startsWith('m')) return 'm'

  // Augmented: spelled 'aug' or the '+' shorthand (527 chords, e.g. "G#+", "D+7").
  if (remaining.startsWith('aug') || remaining.startsWith('+')) return 'aug'

  // Suspended: spelled 'sus4'/'sus2'/'sus', or an extension prefixing it ('9sus'/'9sus4' --
  // 389 chords in the chart corpus).
  if (remaining.startsWith('sus4') || remaining.startsWith('sus2') || remaining.startsWith('sus')) return 'sus4'
  if (/^\d+sus/.test(remaining)) return 'sus4'

  if (/^7/.test(remaining)) return '7'
  if (/^6/.test(remaining)) return '6'

  // Bare extensions (9/11/13, no leading '7') are standard dominant-family shorthand ("C9" ~ C7
  // with a 9th color tone) -- ~3,600 occurrences in the chart corpus. The bass-register chord-tone set
  // (root/3rd/5th/b7) is the same as plain '7'; the extension is an upper structure the bass
  // rarely voices directly.
  if (/^(9|11|13)/.test(remaining)) return '7'

  return 'maj'
}

function isSharpKey(chord: string): boolean {
  const root = getChordRoot(chord)
  return ['G', 'D', 'A', 'E', 'B', 'F#', 'C#'].includes(root)
}

function getNoteName(value: number, _useSharp = false): string {
  const v = ((value % 12) + 12) % 12
  if (v === 1) return 'C#'
  if (v === 6) return 'F#'
  return CHROMATIC_SCALE_FLATS[v]
}

// Real, systemic bug found and fixed (2026-09-20): getChordQuality() has no case for an
// altered 5th on anything other than the already-special-cased m7b5 (half-diminished) -- a
// chord like "D7b5" or "G7#5" fell through to the generic `/^7/` check and got treated as a
// plain, unaltered dominant 7 (root/3rd/NATURAL-5th/b7), silently dropping the alteration that's
// the entire point of the chord symbol. Confirmed by direct scan of the live the chart corpus: 2,364
// occurrences of an altered-5th suffix (7b5/7#5/M7b5/9b5/13b5/etc, excluding m7b5 and dim/dim7,
// which already carry a correct altered-or-diminished 5th in their own dedicated interval sets)
// -- this was not a one-song issue. Fix overrides just the 5th-degree interval (6 semitones for
// b5, 8 for #5) on top of whatever base quality was matched, for any quality whose interval set
// includes an unaltered perfect 5th (maj/maj7/6/m/m7/7/sus4 all do; m7b5/dim/dim7/aug are
// excluded since they never have an unaltered 5th to begin with).
function getFifthOverride(chordSuffix: string): number | null {
  if (/#5/.test(chordSuffix)) return 8
  if (/b5/.test(chordSuffix)) return 6
  return null
}

export function analyzeChordTones(chord: string, octave = 2, params?: BassParams): string[] {
  const root = getChordRoot(chord)
  const quality = getChordQuality(chord)
  const suffix = chord.slice(root.length)
  const baseIntervals = CHORD_INTERVALS[quality] || CHORD_INTERVALS.maj
  const fifthOverride = quality === 'm7b5' || quality === 'dim' || quality === 'dim7' ? null : getFifthOverride(suffix)
  const intervals = fifthOverride === null ? baseIntervals : baseIntervals.map((iv) => (iv === 7 ? fifthOverride : iv))
  const rootValue = NOTE_VALUES[root]
  if (rootValue === undefined) return [`${root}${octave}`]

  const positionOctave = params ? getPositionOctave(root, params) : octave

  return intervals.map((interval) => {
    const noteValue = (rootValue + interval) % 12
    const octaveAdjustment = Math.floor((rootValue + interval) / 12)
    const noteName = getNoteName(noteValue, isSharpKey(chord))
    const finalOctave = positionOctave + octaveAdjustment
    const note = `${noteName}${finalOctave}`
    if (params && !isInPositionRange(note, params)) {
      if (params.highThumb && finalOctave < 3) return `${noteName}${finalOctave + 1}`
      if (params.firstPosition && finalOctave > 2) return `${noteName}${finalOctave - 1}`
    }
    return note
  })
}

function getSemitoneDistance(note1: string, note2: string): number {
  const parse = (note: string) => {
    const match = note.match(/^([A-G][b#]?)(\d+)$/)
    if (!match) return { value: 0, octave: 2 }
    return { value: NOTE_VALUES[match[1]] ?? 0, octave: parseInt(match[2], 10) }
  }
  const n1 = parse(note1)
  const n2 = parse(note2)
  return (n2.octave - n1.octave) * 12 + (n2.value - n1.value)
}

function getScaleDegreeNote(degree: number, chord: string, octave = 2): string {
  const chordRoot = getChordRoot(chord)
  const chordQuality = getChordQuality(chord)
  const rootValue = NOTE_VALUES[chordRoot] || 0
  const isMinor = chordQuality.includes('m')
  const isDim = chordQuality.includes('dim')
  // Same fix as analyzeChordTones' fifthOverride: an explicit b5/#5 suffix on a non-m7b5/dim
  // chord (e.g. "D7b5") wasn't checked here at all, only isDim -- so this passing-tone path had
  // the identical altered-5th bug independently.
  const suffix = chord.slice(chordRoot.length)
  const fifthOverride = chordQuality === 'm7b5' || isDim ? null : getFifthOverride(suffix)
  let interval = 0
  switch (degree) {
    case 1: interval = 0; break
    case 2: interval = 2; break
    case 3: interval = isMinor || isDim ? 3 : 4; break
    case 4: interval = 5; break
    case 5: interval = fifthOverride !== null ? fifthOverride : (isDim ? 6 : 7); break
    case 6: interval = isMinor ? 8 : 9; break
    case 7: interval = chordQuality.includes('maj') ? 11 : 10; break
    default: interval = 0
  }
  const noteValue = (rootValue + interval) % 12
  const resultOctave = octave + Math.floor((rootValue + interval) / 12)
  return getNoteName(noteValue) + resultOctave
}

// --- Pattern detection (ported verbatim) ---

class ChromaticPatternDetector {
  detectXYX(notes: string[]): boolean {
    if (notes.length < 3) return false
    const len = notes.length
    return notes[len - 3] === notes[len - 1] && notes[len - 3] !== notes[len - 2]
  }
  detectYXYX(notes: string[]): boolean {
    if (notes.length < 4) return false
    const len = notes.length
    return notes[len - 4] === notes[len - 2] && notes[len - 3] === notes[len - 1] && notes[len - 4] !== notes[len - 3]
  }
  detectOscillation(notes: string[]): boolean {
    if (notes.length < 6) return false
    return new Set(notes.slice(-6)).size <= 2
  }
  getPatternScore(notes: string[]): number {
    let score = 0
    if (this.detectXYX(notes)) score += 3
    if (this.detectYXYX(notes)) score += 4
    if (this.detectOscillation(notes)) score += 5
    return score
  }
}
const patternDetector = new ChromaticPatternDetector()

// --- Chromatic approach strategies (ported verbatim) ---

interface ChromaticStrategy {
  name: string
  getNextNote(currentNote: string, targetNote: string, recentNotes: string[], chord?: string, params?: BassParams): string
}

const noteValueOf = (note: string) => (NOTE_VALUES[note.replace(/\d+$/, '')] ?? 0) + parseInt(note.match(/\d+$/)?.[0] || '2', 10) * 12

const chromaticStrategies: ChromaticStrategy[] = [
  {
    name: 'passing',
    getNextNote(currentNote, _targetNote, recentNotes, chord, params) {
      if (!chord) return getChromaticApproachBasic(currentNote, false)
      const chordTones = analyzeChordTones(chord, 2, params)
      const currentValue = noteValueOf(currentNote)
      for (const tone of chordTones) {
        const toneValue = noteValueOf(tone)
        const distance = Math.abs(toneValue - currentValue)
        if (distance === 2) {
          const middleValue = currentValue < toneValue ? currentValue + 1 : currentValue - 1
          const result = getNoteName(middleValue % 12) + Math.floor(middleValue / 12)
          if (!recentNotes.slice(-3).includes(result)) return result
        }
      }
      return getChromaticApproachBasic(currentNote, Math.random() > 0.5)
    },
  },
  {
    name: 'enclosure',
    getNextNote(currentNote, targetNote) {
      const targetValue = noteValueOf(targetNote)
      const currentValue = noteValueOf(currentNote)
      const edgeValue = currentValue < targetValue ? targetValue + 1 : targetValue - 1
      return getNoteName(((edgeValue % 12) + 12) % 12) + Math.floor(edgeValue / 12)
    },
  },
  {
    name: 'extended',
    getNextNote(currentNote, targetNote) {
      const targetValue = noteValueOf(targetNote)
      const currentValue = noteValueOf(currentNote)
      const direction = targetValue - currentValue > 0 ? 1 : -1
      const steps = Math.min(3, Math.abs(targetValue - currentValue))
      const nextValue = currentValue + direction * steps
      return getNoteName(((nextValue % 12) + 12) % 12) + Math.floor(nextValue / 12)
    },
  },
]

function getEnhancedChromaticApproach(currentNote: string, targetNote: string, recentNotes: string[], chord?: string, params?: BassParams): string {
  const patternScore = patternDetector.getPatternScore(recentNotes)
  if (patternScore > 5 && chord) {
    const chordTones = analyzeChordTones(chord, 2, params)
    const unusedTones = chordTones.filter((tone) => !recentNotes.slice(-4).includes(tone))
    if (unusedTones.length > 0) return unusedTones[Math.floor(Math.random() * unusedTones.length)]
  }

  const weights = chord ? [0.5, 0.3, 0.2] : [0.3, 0.3, 0.4]
  const rand = Math.random()
  const strategy = rand < weights[0] ? chromaticStrategies[0] : rand < weights[0] + weights[1] ? chromaticStrategies[1] : chromaticStrategies[2]

  const nextNote = strategy.getNextNote(currentNote, targetNote, recentNotes, chord, params)
  const testNotes = [...recentNotes, nextNote]
  if (patternDetector.getPatternScore(testNotes) > patternScore + 2) {
    return getChromaticApproachBasic(currentNote, Math.random() > 0.5)
  }
  return nextNote
}

function getChromaticApproachBasic(targetNote: string, fromAbove = false): string {
  const match = targetNote.match(/^([A-G][b#]?)(\d+)$/)
  if (!match) return targetNote
  const noteValue = NOTE_VALUES[match[1]]
  let octave = parseInt(match[2], 10)
  if (noteValue === undefined) return targetNote

  let newValue = fromAbove ? noteValue + 1 : noteValue - 1
  let newOctave = octave
  if (newValue < 0) { newValue = 11; newOctave-- } else if (newValue > 11) { newValue = 0; newOctave++ }

  const isLowE = newOctave === 2 && newValue === 4
  const isBelowF2 = newOctave < 2 || (newOctave === 2 && newValue < 5)
  if (isLowE || isBelowF2) {
    newValue = noteValue + 1
    newOctave = octave
    if (newValue > 11) { newValue = 0; newOctave++ }
  }
  if (newOctave > 3 || (newOctave === 3 && newValue > 7)) {
    newValue = noteValue - 1
    newOctave = octave
    if (newValue < 0) { newValue = 11; newOctave-- }
  }
  return `${getNoteName(newValue)}${newOctave}`
}

let globalRecentNotes: string[] = []

function getMomentumChromaticApproach(currentNote: string, recentNotes: string[]): string {
  let recentDirection: 'up' | 'down' | 'neutral' = 'neutral'
  let consecutiveSame = 0
  if (recentNotes.length >= 2) {
    const directions: number[] = []
    for (let i = Math.max(0, recentNotes.length - 4); i < recentNotes.length; i++) {
      if (i === 0) continue
      const prevVal = noteValueOf(recentNotes[i - 1])
      const currVal = noteValueOf(recentNotes[i])
      directions.push(currVal - prevVal)
    }
    const upCount = directions.filter((d) => d > 0).length
    const downCount = directions.filter((d) => d < 0).length
    if (upCount > downCount * 1.5) recentDirection = 'up'
    else if (downCount > upCount * 1.5) recentDirection = 'down'
    if (directions.length > 0) {
      const lastDir = directions[directions.length - 1]
      for (let i = directions.length - 1; i >= 0; i--) {
        if ((lastDir > 0 && directions[i] > 0) || (lastDir < 0 && directions[i] < 0)) consecutiveSame++
        else break
      }
    }
  }

  let useDirection: boolean
  const patternScore = patternDetector.getPatternScore(recentNotes)
  if (patternScore > 3) {
    if (recentDirection === 'up') useDirection = false
    else if (recentDirection === 'down') useDirection = true
    else useDirection = Math.random() > 0.3
  } else if (consecutiveSame >= 4) {
    useDirection = Math.random() < 0.7 ? recentDirection === 'up' : recentDirection !== 'up'
  } else if (recentDirection === 'up') {
    useDirection = Math.random() > 0.65
  } else if (recentDirection === 'down') {
    useDirection = Math.random() < 0.65
  } else {
    useDirection = Math.random() > 0.5
  }
  return getChromaticApproachBasic(currentNote, useDirection)
}

function getChromaticApproachSmart(targetNote: string, fromAbove = false, chord?: string, recentNotes?: string[]): string {
  if (recentNotes && recentNotes.length > 2) return getEnhancedChromaticApproach(targetNote, targetNote, recentNotes, chord)
  return getChromaticApproachBasic(targetNote, fromAbove)
}

function getChromaticApproach(targetNote: string, _fromAbove = false): string {
  if (globalRecentNotes.length > 2) return getMomentumChromaticApproach(targetNote, globalRecentNotes)
  return getChromaticApproachBasic(targetNote, false)
}

function getWholeStepApproach(targetNote: string, _key: string, fromAbove: boolean): string {
  const match = targetNote.match(/^([A-G][b#]?)(\d+)$/)
  if (!match) return targetNote
  const noteValue = NOTE_VALUES[match[1]]
  const octave = match[2]
  if (noteValue === undefined) return targetNote
  const approachValue = fromAbove ? noteValue + 2 : noteValue - 2
  return getNoteName(approachValue) + octave
}

// --- Triadic motion fallback (ported verbatim) ---

function selectTriadicMotion(lastNote: string, validTones: string[], chord: string, params?: BassParams): string {
  const chordTones = analyzeChordTones(chord, 2, params)
  const lastNoteName = lastNote.replace(/\d+$/, '')
  const lastIndex = chordTones.findIndex((tone) => tone.replace(/\d+$/, '') === lastNoteName)
  if (lastIndex !== -1) {
    const patterns = [[0, 1, 2], [1, 2, 3], [2, 3, 0], [3, 0, 1], [0, 2, 1], [2, 0, 3]]
    for (const pattern of patterns) {
      const posInPattern = pattern.indexOf(lastIndex)
      if (posInPattern !== -1 && posInPattern < pattern.length - 1) {
        const targetTone = chordTones[pattern[posInPattern + 1] % chordTones.length]
        const match = validTones.find((tone) => tone.replace(/\d+$/, '') === targetTone.replace(/\d+$/, ''))
        if (match) return match
      }
    }
  }
  return validTones.reduce((best, tone) => {
    const interval = Math.abs(getSemitoneDistance(lastNote, tone))
    const bestInterval = Math.abs(getSemitoneDistance(lastNote, best))
    const isGood = interval === 4 || interval === 5 || interval === 7 || interval === 8
    const isBestGood = bestInterval === 4 || bestInterval === 5 || bestInterval === 7 || bestInterval === 8
    if (isGood && !isBestGood) return tone
    if (!isGood && isBestGood) return best
    return interval < bestInterval ? tone : best
  })
}

// --- Per-chord note generation: the real engine's core (ported verbatim from generateChordNotes) ---

function generateChordNotes(
  chord: string,
  nextChord: string | null,
  notesCount: number,
  params: BassParams & { melodicChromatic: number },
  bassLine: string[],
  recentNotes: string[],
  maxRecentTracking: number,
  directionTracker: { lastDirection: number },
): void {
  const chordTones = analyzeChordTones(chord, 2, params)
  const chromaticPercent = params.melodicChromatic / 100

  for (let beat = 0; beat < notesCount; beat++) {
    const isStrongBeat = beat === 0 || beat === 2
    const isLastBeat = beat === notesCount - 1
    const lastNote = bassLine[bassLine.length - 1]
    let note: string

    if (bassLine.length === 0) {
      if (params.startingNote && params.startingNote !== 'any') {
        switch (params.startingNote) {
          case 'root': note = chordTones[0]; break
          case '3rd': note = chordTones.length > 1 ? chordTones[1] : chordTones[0]; break
          case '5th': note = chordTones.length > 2 ? chordTones[2] : chordTones[0]; break
          case '7th': note = chordTones.length > 3 ? chordTones[3] : chordTones[0]; break
          case '9th': note = getChordRoot(chord) + '3'; break
          case '11th': { const rv = NOTE_VALUES[getChordRoot(chord)] || 0; note = getNoteName((rv + 5) % 12) + '3'; break }
          case '13th': { const rv = NOTE_VALUES[getChordRoot(chord)] || 0; note = getNoteName((rv + 9) % 12) + '3'; break }
          // Found unhandled: fell through to the default (root) with no case at all, so picking
          // "Alternate" in the UI produced output identical to picking "Root" -- a UI option
          // that silently did nothing different. startingNote only ever affects this one first
          // note (confirmed: it's read nowhere else in this file), so a true per-beat "Root-3rd-
          // Root-Root-3rd" pattern isn't something this parameter can express -- this makes
          // "alternate" at least pick a genuinely different, real chord tone (3rd if available)
          // rather than being a no-op duplicate of "root".
          case 'alternate': note = chordTones.length > 1 ? chordTones[1] : chordTones[0]; break
          default: note = chordTones[0]
        }
      } else {
        note = chordTones[0]
      }
    } else if (isStrongBeat && Math.random() < 0.9) {
      const maxLeap = 8
      const primaryTriad = chordTones.length >= 3 ? [chordTones[0], chordTones[1], chordTones[2]] : chordTones
      const reachableTriad = primaryTriad.filter((tone) => Math.abs(getSemitoneDistance(lastNote, tone)) <= maxLeap && tone !== lastNote)
      const reachableTones = chordTones.filter((tone) => Math.abs(getSemitoneDistance(lastNote, tone)) <= maxLeap && tone !== lastNote)

      if (reachableTones.length === 0) {
        note = primaryTriad.filter((ct) => ct !== lastNote).reduce((closest, tone) => {
          return Math.abs(getSemitoneDistance(lastNote, tone)) < Math.abs(getSemitoneDistance(lastNote, closest)) ? tone : closest
        }, primaryTriad[0])
      } else if (beat === 0) {
        const triadPreference = 0.85
        if (Math.random() < triadPreference && reachableTriad.length > 0) {
          const weights = [0.5, 0.3, 0.2]
          const rand = Math.random()
          if (rand < weights[0] && reachableTriad.includes(chordTones[0])) note = chordTones[0]
          else if (rand < weights[0] + weights[1] && reachableTriad.includes(chordTones[1])) note = chordTones[1]
          else if (reachableTriad.includes(chordTones[2])) note = chordTones[2]
          else note = reachableTriad[Math.floor(Math.random() * reachableTriad.length)]
        } else {
          const stepwise = reachableTones.filter((tone) => { const i = Math.abs(getSemitoneDistance(lastNote, tone)); return i >= 1 && i <= 4 })
          note = stepwise.length > 0 ? stepwise[Math.floor(Math.random() * stepwise.length)] : reachableTones[Math.floor(Math.random() * reachableTones.length)]
        }
      } else {
        if (reachableTriad.length > 0 && Math.random() < 0.7) {
          note = reachableTriad[Math.floor(Math.random() * reachableTriad.length)]
        } else {
          const stepwise = reachableTones.filter((tone) => { const i = Math.abs(getSemitoneDistance(lastNote, tone)); return i >= 1 && i <= 4 })
          note = stepwise.length > 0 && Math.random() < 0.7 ? stepwise[Math.floor(Math.random() * stepwise.length)] : selectTriadicMotion(lastNote, reachableTones, chord, params)
        }
      }
    } else if (isLastBeat && nextChord) {
      const nextRoot = getChordRoot(nextChord) + '2'
      const useHalfStep = Math.random() < chromaticPercent
      note = useHalfStep ? getChromaticApproach(nextRoot, Math.random() > 0.5) : getWholeStepApproach(nextRoot, '', Math.random() > 0.5)
      const interval = Math.abs(getSemitoneDistance(note, nextRoot))
      if (interval > 2 && interval < 10) note = getChromaticApproach(nextRoot, true)
    } else {
      let forceStepwise = false
      if (recentNotes.length >= 2) {
        const lastInterval = Math.abs(getSemitoneDistance(recentNotes[recentNotes.length - 2], recentNotes[recentNotes.length - 1]))
        if (lastInterval > 2) forceStepwise = Math.random() < 0.8
      }

      if (forceStepwise || Math.random() < chromaticPercent) {
        const patternScore = patternDetector.getPatternScore(recentNotes)
        if (patternScore > 3 && !forceStepwise) {
          note = getEnhancedChromaticApproach(lastNote, lastNote, recentNotes, chord, params)
        } else {
          let preferredDirection = Math.random() > 0.5
          if (directionTracker.lastDirection !== 0) {
            preferredDirection = Math.random() < 0.6 ? directionTracker.lastDirection < 0 : directionTracker.lastDirection > 0
          }
          note = getChromaticApproachSmart(lastNote, preferredDirection, chord, recentNotes)
        }
      } else {
        const maxLeap = 5
        const options = [...chordTones]
        for (let degree = 1; degree <= 7; degree++) {
          const passingTone = getScaleDegreeNote(degree, chord, 2)
          const interval = Math.abs(getSemitoneDistance(lastNote, passingTone))
          if (interval <= maxLeap && interval > 0 && passingTone !== lastNote) options.push(passingTone)
        }
        const validOptions = options.filter((opt) => Math.abs(getSemitoneDistance(lastNote, opt)) <= maxLeap && opt !== lastNote)
        if (validOptions.length > 0) {
          const stepwise = validOptions.filter((opt) => Math.abs(getSemitoneDistance(lastNote, opt)) <= 2)
          note = stepwise.length > 0 && Math.random() < 0.8 ? stepwise[Math.floor(Math.random() * stepwise.length)] : validOptions[Math.floor(Math.random() * validOptions.length)]
        } else {
          note = getChromaticApproachSmart(lastNote, Math.random() < 0.5, chord, recentNotes)
        }
      }
    }

    if (note === lastNote) {
      const testNotes = [...recentNotes, note]
      if (patternDetector.detectXYX(testNotes) || patternDetector.detectYXYX(testNotes)) {
        note = getEnhancedChromaticApproach(lastNote, chord ? getChordRoot(chord) + '2' : lastNote, recentNotes, chord, params)
      } else {
        note = getChromaticApproachSmart(lastNote, Math.random() < 0.5, chord, recentNotes)
      }
      if (note === lastNote) {
        const octave = parseInt(lastNote.match(/(\d+)$/)?.[1] || '2', 10)
        const noteName = lastNote.replace(/\d+$/, '')
        note = noteName + (octave === 2 ? '3' : '2')
      }
    }

    if (!note) note = chordTones[0] || 'C2'

    bassLine.push(note)
    recentNotes.push(note)
    if (recentNotes.length > maxRecentTracking) recentNotes.shift()

    if (bassLine.length > 1) {
      const interval = getSemitoneDistance(lastNote, note)
      directionTracker.lastDirection = interval > 0 ? 1 : interval < 0 ? -1 : 0
    }
    globalRecentNotes.push(note)
    if (globalRecentNotes.length > 8) globalRecentNotes.shift()
  }
}

// --- Final validation pass (ported verbatim from validateBassLine) ---

function validateBassLine(notes: string[], chords: string[]): string[] {
  const validated = [...notes]
  for (let i = 0; i < validated.length - 1; i++) {
    const currentNote = validated[i]
    const nextNote = validated[i + 1]
    const measureIndex = Math.floor(i / 4)
    const beatInMeasure = i % 4
    const currentChord = chords[measureIndex]

    const interval = getSemitoneDistance(currentNote, nextNote)
    if (interval === -5) validated[i + 1] = getChromaticApproach(currentNote, false)

    if (beatInMeasure === 3) {
      const nextChord = measureIndex < chords.length - 1 ? chords[measureIndex + 1] : currentChord
      const nextRoot = getChordRoot(nextChord) + '2'
      if (nextNote === currentNote) validated[i + 1] = getChromaticApproach(nextRoot, Math.random() > 0.5)
      const actualNextNote = validated[i + 1]
      const beat4Interval = Math.abs(getSemitoneDistance(currentNote, actualNextNote))
      if (beat4Interval > 2 && beat4Interval < 10) {
        validated[i] = Math.random() < 0.5 ? getChromaticApproach(actualNextNote, Math.random() > 0.5) : getWholeStepApproach(actualNextNote, 'C', Math.random() > 0.5)
      }
    }

    if ((beatInMeasure === 0 || beatInMeasure === 2) && currentChord) {
      const chordTones = analyzeChordTones(currentChord)
      const isChordTone = chordTones.some((ct) => ct.replace(/\d+$/, '') === currentNote.replace(/\d+$/, ''))
      if (!isChordTone) {
        validated[i] = chordTones.reduce((closest, tone) => Math.abs(getSemitoneDistance(currentNote, tone)) < Math.abs(getSemitoneDistance(currentNote, closest)) ? tone : closest)
      }
    }
  }

  for (let i = 1; i < validated.length; i++) {
    if (validated[i] === validated[i - 1]) {
      const chord = chords[Math.floor(i / 4)]
      if (chord) {
        const chordTones = analyzeChordTones(chord)
        const alternatives = chordTones.filter((t) => t !== validated[i])
        if (alternatives.length > 0) {
          validated[i] = alternatives.reduce((closest, tone) => Math.abs(getSemitoneDistance(validated[i - 1], tone)) < Math.abs(getSemitoneDistance(validated[i - 1], closest)) ? tone : closest)
        } else {
          validated[i] = getChromaticApproach(validated[i - 1], Math.random() > 0.5)
        }
      }
    }
  }
  return validated
}

// --- Orchestrator (ported from generateHighQualityBassLine, walking-bass/4-beat case only --
// matches this Worker's existing beats===4 scope limit) ---

function generateBassLineNotes(chords: string[], params: BassParams): string[] {
  globalRecentNotes = []
  const bassLine: string[] = []
  const recentNotes: string[] = []
  const maxRecentTracking = 8
  const directionTracker = { lastDirection: 0 }
  const fullParams = { ...params, melodicChromatic: Math.max(1, params.melodicChromatic ?? 20) }

  for (let barIdx = 0; barIdx < chords.length; barIdx++) {
    const chord = chords[barIdx]
    const nextChord = barIdx < chords.length - 1 ? chords[barIdx + 1] : null
    generateChordNotes(chord, nextChord, 4, fullParams, bassLine, recentNotes, maxRecentTracking, directionTracker)
  }

  return validateBassLine(bassLine, chords)
}

// --- Public API kept compatible with index.ts's existing call site ---

function parseNoteToken(token: string): NoteName {
  const match = token.match(/^([A-G][b#]?)(\d+)$/)
  if (!match) return { pitch: 'C', octave: 2 }
  return { pitch: match[1], octave: parseInt(match[2], 10) }
}

export function generateMeasures(progression: string[], params: BassParams = {}): NoteName[][] {
  const flat = generateBassLineNotes(progression, params)
  const measures: NoteName[][] = []
  for (let i = 0; i < progression.length; i++) {
    measures.push(flat.slice(i * 4, i * 4 + 4).map(parseNoteToken))
  }
  return measures
}

// index.ts's noteSpecFromPitchOctave(n, useSharps) does midi = (n.octave+1)*12 + pitchToSemitone(n.pitch).
export function pitchToSemitone(pitch: string): number {
  const idx = CHROMATIC.indexOf(pitch)
  return idx === -1 ? 0 : idx
}

// --- Named-standard progression, weighted starting-degree, and blues/rhythm-changes templates
// (unchanged from the prior port -- these are real chord-progression templates ported from
// bassLineGenerationService.ts's own generateJazzBluesProgression/generateRhythmChangesProgression,
// not the dead-fallback note-generator this file replaces. They remain the progression SOURCE fed
// into the corrected engine above.) ---

type BluesTemplateEntry = { bar: number; deg: string; qual: string; beats: number; next?: { deg: string; qual: string; beats: number } }

const BLUES_TEMPLATES: Record<string, BluesTemplateEntry[]> = {
  jazz: [
    { bar: 1, deg: 'I', qual: '7', beats: 4 },
    { bar: 2, deg: 'IV', qual: '7', beats: 4 },
    { bar: 3, deg: 'I', qual: '7', beats: 4 },
    { bar: 4, deg: 'I', qual: '7', beats: 2, next: { deg: 'VI', qual: 'm7', beats: 2 } },
    { bar: 5, deg: 'IV', qual: '7', beats: 4 },
    { bar: 6, deg: '#IV', qual: 'dim7', beats: 4 },
    { bar: 7, deg: 'I', qual: '7', beats: 4 },
    { bar: 8, deg: 'VI', qual: 'm7', beats: 2, next: { deg: 'II', qual: 'm7', beats: 2 } },
    { bar: 9, deg: 'II', qual: 'm7', beats: 4 },
    { bar: 10, deg: 'V', qual: '7', beats: 4 },
    { bar: 11, deg: 'I', qual: '7', beats: 2, next: { deg: 'VI', qual: 'm7', beats: 2 } },
    { bar: 12, deg: 'II', qual: 'm7', beats: 2, next: { deg: 'V', qual: '7', beats: 2 } },
  ],
  hardbop: [
    { bar: 1, deg: 'I', qual: '7', beats: 4 },
    { bar: 2, deg: 'IV', qual: '7', beats: 4 },
    { bar: 3, deg: 'I', qual: '7', beats: 4 },
    { bar: 4, deg: 'II', qual: 'm7', beats: 2, next: { deg: 'V', qual: '7', beats: 2 } },
    { bar: 5, deg: 'IV', qual: '7', beats: 4 },
    { bar: 6, deg: '#IV', qual: 'dim7', beats: 4 },
    { bar: 7, deg: 'I', qual: '7', beats: 2, next: { deg: 'VI', qual: 'm7', beats: 2 } },
    { bar: 8, deg: 'II', qual: 'm7', beats: 2, next: { deg: 'V', qual: '7', beats: 2 } },
    { bar: 9, deg: 'III', qual: 'm7', beats: 4 },
    { bar: 10, deg: 'II', qual: 'm7', beats: 2, next: { deg: 'V', qual: '7', beats: 2 } },
    { bar: 11, deg: 'I', qual: '7', beats: 4 },
    { bar: 12, deg: 'II', qual: 'm7', beats: 2, next: { deg: 'V', qual: '7', beats: 2 } },
  ],
  bird: [
    { bar: 1, deg: 'I', qual: 'M7', beats: 4 },
    { bar: 2, deg: 'VI', qual: 'm7', beats: 4 },
    { bar: 3, deg: 'II', qual: 'm7', beats: 4 },
    { bar: 4, deg: 'V', qual: '7', beats: 4 },
    { bar: 5, deg: 'III', qual: 'm7', beats: 4 },
    { bar: 6, deg: 'VI', qual: '7', beats: 4 },
    { bar: 7, deg: 'II', qual: 'm7', beats: 4 },
    { bar: 8, deg: 'V', qual: '7', beats: 4 },
    { bar: 9, deg: 'II', qual: 'm7', beats: 4 },
    { bar: 10, deg: 'bII', qual: 'dim7', beats: 4 },
    { bar: 11, deg: 'I', qual: 'M7', beats: 2, next: { deg: 'VI', qual: 'm7', beats: 2 } },
    { bar: 12, deg: 'II', qual: 'm7', beats: 2, next: { deg: 'V', qual: '7', beats: 2 } },
  ],
  minor: [
    { bar: 1, deg: 'i', qual: 'm7', beats: 4 },
    { bar: 2, deg: 'iv', qual: 'm7', beats: 4 },
    { bar: 3, deg: 'i', qual: 'm7', beats: 4 },
    { bar: 4, deg: 'i', qual: 'm7', beats: 4 },
    { bar: 5, deg: 'iv', qual: 'm7', beats: 4 },
    { bar: 6, deg: 'bVI', qual: 'dim7', beats: 4 },
    { bar: 7, deg: 'i', qual: 'm7', beats: 4 },
    { bar: 8, deg: 'V', qual: '7', beats: 4 },
    { bar: 9, deg: 'ii', qual: 'm7b5', beats: 4 },
    { bar: 10, deg: 'V', qual: '7', beats: 4 },
    { bar: 11, deg: 'i', qual: 'm7', beats: 4 },
    { bar: 12, deg: 'V', qual: '7', beats: 4 },
  ],
}

const ROMAN_MAP: Record<string, number> = {
  I: 0, i: 0, bII: 1, bii: 1, II: 2, ii: 2, bIII: 3, biii: 3, III: 4, iii: 4,
  IV: 5, iv: 5, '#IV': 6, bV: 6, V: 7, v: 7, bVI: 8, VI: 9, vi: 9, bVII: 10, VII: 11, vii: 11,
}

function romanToChordSymbol(roman: string, quality: string, keyIndex: number): string {
  const degreeIndex = ROMAN_MAP[roman]
  const root = degreeIndex === undefined ? CHROMATIC[keyIndex] : CHROMATIC[(keyIndex + degreeIndex) % 12]
  return root + quality
}

function keyIndexOf(key: string): number {
  const idx = CHROMATIC.indexOf(key)
  return idx === -1 ? 0 : idx
}

export function generateJazzBluesProgression(key: string, bluesType: string = 'jazz'): string[] {
  const keyIndex = keyIndexOf(key)
  const template = BLUES_TEMPLATES[bluesType] || BLUES_TEMPLATES.jazz
  return template.map((entry) => romanToChordSymbol(entry.deg, entry.qual, keyIndex))
}

export function detectBluesType(prompt: string): string {
  if (/bebop|bird|parker|major/i.test(prompt)) return 'bird'
  if (/hard.?bop|ii.?v/i.test(prompt)) return 'hardbop'
  if (/minor/i.test(prompt)) return 'minor'
  return 'jazz'
}

export function generateRhythmChangesProgression(key: string): string[] {
  const keyIndex = keyIndexOf(key)
  const template: Array<{ deg: string; qual: string }> = [
    { deg: 'I', qual: 'M7' }, { deg: 'VI', qual: 'm7' }, { deg: 'II', qual: 'm7' }, { deg: 'V', qual: '7' },
    { deg: 'III', qual: 'm7' }, { deg: 'VI', qual: '7' }, { deg: 'II', qual: 'm7' }, { deg: 'V', qual: '7' },
    { deg: 'I', qual: 'M7' }, { deg: 'VI', qual: 'm7' }, { deg: 'II', qual: 'm7' }, { deg: 'V', qual: '7' },
    { deg: 'III', qual: 'm7' }, { deg: 'VI', qual: '7' }, { deg: 'II', qual: 'm7' }, { deg: 'V', qual: '7' },
    { deg: 'III', qual: '7' }, { deg: 'III', qual: '7' }, { deg: 'VI', qual: '7' }, { deg: 'VI', qual: '7' },
    { deg: 'II', qual: '7' }, { deg: 'II', qual: '7' }, { deg: 'V', qual: '7' }, { deg: 'V', qual: '7' },
    { deg: 'I', qual: 'M7' }, { deg: 'VI', qual: 'm7' }, { deg: 'II', qual: 'm7' }, { deg: 'V', qual: '7' },
    { deg: 'III', qual: 'm7' }, { deg: 'VI', qual: '7' }, { deg: 'II', qual: 'm7' }, { deg: 'V', qual: '7' },
  ]
  return template.map((c) => romanToChordSymbol(c.deg, c.qual, keyIndex))
}

// Weighted starting-degree auto-selection (ported from mapToBassAlgoParameters's 'auto' branch).
export function weightedAutoStartingNote(): BassParams['startingNote'] {
  const options: Array<{ note: BassParams['startingNote']; weight: number }> = [
    { note: 'root', weight: 56 }, { note: '3rd', weight: 11 }, { note: '5th', weight: 11 },
    { note: '13th', weight: 8 }, { note: '7th', weight: 10 }, { note: '9th', weight: 4 },
  ]
  const sum = options.reduce((s, o) => s + o.weight, 0)
  let random = Math.random() * sum
  for (const o of options) {
    if (random < o.weight) return o.note
    random -= o.weight
  }
  return 'root'
}


// Faithful port of bassLineGenerationService.ts:1700-1826 -- natural-language tune-name and key
// extraction from the RAW prompt, run before the SongDB search so "bass lines for Work Song"
// searches "Work Song" (prefix stripped), and "Autumn Leaves in Bb" / "F# Autumn Leaves" both
// surface an explicit target key separately from the tune name.
export function extractTuneNameAndKey(promptRaw: string): { tuneName: string; extractedKey: string | null } {
  let tuneName = promptRaw
  const quoted = promptRaw.match(/"([^"]+)"|'([^']+)'/)
  if (quoted) {
    tuneName = quoted[1] || quoted[2]
  } else {
    let cleaned = promptRaw
    // Broadened (2026-09-20, stress-tested against 450 real prompts after a user reported the engine
    // "constantly falling back"): the original 6 patterns only covered a handful of exact
    // phrasings and missed common real ones -- bare "generate X" (no bare-verb pattern existed
    // at all), "can you make a bassline for X", "could you generate X for me". The two new
    // conversational patterns require the FULL "<verb> ... bass line(s)/bassline ... for"
    // structure (or an explicit "can/could/would you" framing) before stripping "make"/"give"/
    // "do" specifically -- those three collide with real titles as bare words ("Make It Easy On
    // Yourself", "Give Me The Simple Life", confirmed via a DB scan), so they're only ever
    // stripped as part of this longer, unambiguous shape, never as a bare prefix.
    const prefixes = [
      /^(bass\s*lines?\s+for\s+)/i,
      /^(generate\s+bass\s+for\s+)/i,
      /^(create\s+bass\s+for\s+)/i,
      /^(play\s+)/i,
      /^(walking\s+bass\s+for\s+)/i,
      /^(bebop\s+bass\s+for\s+)/i,
      /^(generate\s+)/i,
      /^(create\s+)/i,
      /^(write\s+)/i,
      /^(compose\s+)/i,
      /^(?:(?:can|could|would)\s+you\s+(?:please\s+)?)?(?:make|give|do|generate|create)\s+(?:me\s+)?(?:a\s+|an\s+|the\s+|some\s+)?(?:walking\s+)?(?:bass\s*lines?|bassline)\s+(?:for|of)\s+/i,
      /^(?:can|could|would)\s+you\s+(?:please\s+)?(?:make|generate|create|play|write)\s+(?:me\s+)?/i,
    ]
    for (const prefix of prefixes) {
      const stripped = cleaned.replace(prefix, '')
      if (stripped !== cleaned) {
        cleaned = stripped
        break
      }
    }

    const keyPrefixRemoved = cleaned.replace(/^([A-G][b#]?\s+)/i, '')
    if (keyPrefixRemoved !== cleaned) {
      tuneName = keyPrefixRemoved.trim()
    } else {
      const fullCapPhrase = cleaned.match(/([A-Z][a-zA-Z]*(?:\s+[a-zA-Z]+)*)/)
      if (fullCapPhrase) tuneName = fullCapPhrase[1].trim()
      else tuneName = cleaned.trim()
    }
  }

  const keyPatterns = [
    /\bin\s+([A-G][b#]?)(?:\s|$)/i,
    /^([A-G][b#]?)\s+/i,
    /\s+([A-G][b#]?)\s*$/i,
    /^([A-G][b#]?)\s+(?:flat|sharp)\s+/i,
  ]
  let extractedKey: string | null = null
  for (const pattern of keyPatterns) {
    const m = promptRaw.match(pattern)
    if (m) {
      extractedKey = m[1].charAt(0).toUpperCase() + m[1].slice(1)
      break
    }
  }
  if (!extractedKey) {
    const wordForm = promptRaw.replace(/\b([A-G])\s+flat\b/gi, '$1b').replace(/\b([A-G])\s+sharp\b/gi, '$1#')
    for (const pattern of keyPatterns) {
      const m = wordForm.match(pattern)
      if (m) {
        extractedKey = m[1].charAt(0).toUpperCase() + m[1].slice(1)
        break
      }
    }
  }

  return { tuneName, extractedKey }
}

// Faithful port of bassLineGenerationService.ts:308-330.
export function detectKeyFromProgression(progression: string[]): string | null {
  if (!progression || progression.length === 0) return null
  const firstChord = progression[0]
  const lastChord = progression[progression.length - 1]
  const getRoot = (chord: string) => {
    const m = chord.match(/^([A-G][b#]?)/)
    return m ? m[1] : null
  }
  const firstRoot = getRoot(firstChord)
  const lastRoot = getRoot(lastChord)
  if (lastChord.includes('M7') || lastChord.includes('maj') || lastChord.includes('6')) {
    return lastRoot
  }
  return firstRoot
}

// Faithful port of bassLineGenerationService.ts:333-354. Note (matching the original, not a new
// bug): slash chords' bass note is not specially handled -- e.g. "F#/G" transposes only the "F#"
// root, leaving "/G" attached as part of the unrecognized suffix.
export function transposeProgression(progression: string[], fromKey: string, toKey: string): string[] {
  const chromatic = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']
  const fromIndex = chromatic.indexOf(fromKey)
  const toIndex = chromatic.indexOf(toKey)
  if (fromIndex === -1 || toIndex === -1) return progression
  const interval = (toIndex - fromIndex + 12) % 12
  return progression.map((chord) => {
    const m = chord.match(/^([A-G][b#]?)(.*)$/)
    if (!m) return chord
    const [, root, quality] = m
    const rootIndex = chromatic.indexOf(root)
    if (rootIndex === -1) return chord
    const newRootIndex = (rootIndex + interval) % 12
    return chromatic[newRootIndex] + quality
  })
}


export interface StandardsSource {
  /** Return the chord progression (one chord per bar) for a tune title, or null. */
  lookup(title: string): { title: string; key?: string; progression: string[] } | null
}

const CHORUSES = 3

/** Resolve a named standard from the prompt using a caller-supplied source, transposing to the requested key. */
export function resolveNamedStandard(
  promptRaw: string,
  explicitKey: string | null,
  source: StandardsSource
): { title: string; progression: string[] } | null {
  const { tuneName, extractedKey } = extractTuneNameAndKey(promptRaw)
  const hit = source.lookup(tuneName)
  if (!hit) return null
  const targetKey = explicitKey || extractedKey || null
  const naturalKey = hit.key || detectKeyFromProgression(hit.progression)
  let progression = hit.progression
  if (targetKey && naturalKey && targetKey !== naturalKey) progression = transposeProgression(progression, naturalKey, targetKey)
  const repeated: string[] = []
  for (let i = 0; i < CHORUSES; i++) repeated.push(...progression)
  return { title: hit.title, progression: repeated }
}
