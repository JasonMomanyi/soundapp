/**
 * Demo Songs — 3 full ~3-minute tracks with section arrangements.
 * Each song defines:
 *   - Metadata (name, key, scale, BPM, description)
 *   - scaleNotes: the pitch classes used (for key display)
 *   - noteConfig: which notes each melodic track cycles through per step
 *   - sections: ordered list of {name, bars, grid} played sequentially
 *
 * Grid layout: 8 rows × 16 columns (8 tracks × 16 steps)
 * Tracks: [0]=Kick [1]=Snare [2]=Hi-Hat [3]=Clap [4]=Bass [5]=Lead [6]=Pad [7]=Synth
 */

// ─── Helper: shorthand for grids ───────────────────────────────────────────
function G(rows) {
    return rows.map(r => [...r].map(c => c === '1'));
}

// ─── Song 1: Chill Lo-Fi Vibes ─────────────────────────────────────────────
// Key: A Minor Pentatonic  |  BPM: 85  |  72 bars ≈ 3:24
// Scale: A  C  D  E  G
const LOFI = {
    id: 'chill_lofi',
    name: 'Chill Lo-Fi Vibes',
    bpm: 85,
    key: 'A',
    mode: 'Minor Pentatonic',
    description: 'Laid-back hip-hop groove with vinyl warmth. Jazzy bass lines over a swinging kit.',
    color: '#b197fc',
    scaleNotes: ['A', 'C', 'D', 'E', 'G'],
    chordName: 'Am (A - C - E)',
    noteConfig: {
        // melodic tracks: arrays of notes cycled per triggered step (one note per trigger)
        bass: ['A2', 'E2', 'A2', 'G2', 'D2', 'E2', 'C2', 'E2'],
        lead: ['E4', 'G4', 'A4', 'G4', 'E4', 'D4', 'E4', 'C4'],
        pad: ['A3', 'C4', 'E4'],      // chord tones, cycles / pads
        synth: ['A5', 'G5', 'E5', 'D5'],
    },
    // Track tips shown in UI
    trackTips: [
        { track: 'Bass', notes: ['A2', 'E2', 'G2', 'D2', 'C2'], tip: 'Root & 5th walk, off-beat A2 anchor' },
        { track: 'Lead', notes: ['E4', 'G4', 'A4', 'D4', 'C4'], tip: 'Am pentatonic melody, call & response' },
        { track: 'Pad', notes: ['A3', 'C4', 'E4'], tip: 'Am chord — strum Strings or EP' },
        { track: 'Synth', notes: ['A5', 'G5', 'E5', 'D5'], tip: 'High end sparkle, sparse hits' },
        { track: 'Drums', notes: ['Kick', 'Snare', 'HH', 'Clap'], tip: 'Swing hi-hats, 2&4 snare, ghost kick on 3+' },
    ],
    sections: [
        {
            name: 'Intro',
            bars: 8,
            description: 'Drums + bass only, setting the vibe',
            grid: G([
                '1000000010000000', // Kick
                '0000100000001000', // Snare
                '1010101010101010', // Hi-Hat
                '0000000000000000', // Clap
                '1000000010000001', // Bass
                '0000000000000000', // Lead (silent)
                '0000000000000000', // Pad  (silent)
                '0000000000000000', // Synth(silent)
            ]),
        },
        {
            name: 'Verse',
            bars: 16,
            description: 'Pad layer enters, adding harmonic warmth',
            grid: G([
                '1000100010001000', // Kick
                '0000100000001000', // Snare
                '1010110110101101', // Hi-Hat
                '0000000000000000', // Clap
                '1000001010000010', // Bass
                '0000000000000000', // Lead
                '1000000010000000', // Pad (long hits on 1 & 3)
                '0000000000000000', // Synth
            ]),
        },
        {
            name: 'Chorus',
            bars: 16,
            description: 'Lead melody comes in over the full arrangement',
            grid: G([
                '1000100010001000', // Kick
                '0000100000001000', // Snare
                '1110111011101110', // Hi-Hat (denser)
                '0000100000001000', // Clap (doubles snare)
                '1000001010000010', // Bass
                '0001000100010010', // Lead (syncopated)
                '1000000010000000', // Pad
                '0000000100000001', // Synth (sparse accents)
            ]),
        },
        {
            name: 'Bridge',
            bars: 8,
            description: 'Stripped back — only bass and pad breathe',
            grid: G([
                '1000000000000000', // Kick (only beat 1)
                '0000000000000000', // Snare (silent)
                '0100010001000100', // Hi-Hat (sparse)
                '0000000000000000', // Clap
                '1000100000001000', // Bass
                '0000000000000000', // Lead
                '1000100010001000', // Pad (all 4 beats)
                '0000000000000000', // Synth
            ]),
        },
        {
            name: 'Chorus 2',
            bars: 16,
            description: 'Full energy return with synth sparkle',
            grid: G([
                '1001000110001001', // Kick (extra ghost)
                '0000100000001000', // Snare
                '1110111011101110', // Hi-Hat
                '0000100000001000', // Clap
                '1001001010000110', // Bass (busier)
                '0001001000010010', // Lead
                '1000000010000000', // Pad
                '0000000100100001', // Synth
            ]),
        },
        {
            name: 'Outro',
            bars: 8,
            description: 'Gradual fade — instruments drop out one by one',
            grid: G([
                '1000000010000000', // Kick
                '0000100000001000', // Snare
                '1010101010100000', // Hi-Hat (trail off)
                '0000000000000000', // Clap
                '1000000010000000', // Bass
                '0000000000000000', // Lead
                '1000000000000000', // Pad (only beat 1 stays)
                '0000000000000000', // Synth
            ]),
        },
    ],
};

// ─── Song 2: Electric Sunrise ──────────────────────────────────────────────
// Key: D Major  |  BPM: 128  |  96 bars = 3:00 exactly
// Scale: D  E  F#  G  A  B  C#
const SUNRISE = {
    id: 'electric_sunrise',
    name: 'Electric Sunrise',
    bpm: 128,
    key: 'D',
    mode: 'Major',
    description: 'Euphoric progressive house. Four-on-the-floor kick, glistening leads and lush D major chords.',
    color: '#ffd43b',
    scaleNotes: ['D', 'E', 'F#', 'G', 'A', 'B', 'C#'],
    chordName: 'Dmaj (D - F# - A)',
    noteConfig: {
        bass: ['D2', 'A2', 'G2', 'D2', 'F#2', 'A2', 'G2', 'A2'],
        lead: ['D5', 'F#5', 'A5', 'B5', 'A5', 'G5', 'F#5', 'E5'],
        pad: ['D3', 'F#3', 'A3'],
        synth: ['D5', 'F#5', 'G5', 'A5'],
    },
    trackTips: [
        { track: 'Bass', notes: ['D2', 'A2', 'G2', 'F#2'], tip: 'Root-fifth movement, pumping eighth notes on the drop' },
        { track: 'Lead', notes: ['D5', 'F#5', 'A5', 'B5', 'G5', 'E5'], tip: 'D major arpeggio with chromatic passing tones' },
        { track: 'Pad', notes: ['D3', 'F#3', 'A3'], tip: 'Dmaj chord — wide stereo with reverb' },
        { track: 'Synth', notes: ['D5', 'F#5', 'G5', 'A5'], tip: 'Pluck or lead synth stabs on off-beats' },
        { track: 'Drums', notes: ['Kick', 'Snare', 'HH', 'Clap'], tip: 'Four-on-floor kick, clap on 2&4, 16th hi-hats on build' },
    ],
    sections: [
        {
            name: 'Intro',
            bars: 8,
            description: 'Pad swell only, no drums — anticipation builds',
            grid: G([
                '0000000000000000', // Kick
                '0000000000000000', // Snare
                '0000000000000000', // Hi-Hat
                '0000000000000000', // Clap
                '1000100010001000', // Bass (root pulse)
                '0000000000000000', // Lead
                '1000000010000000', // Pad
                '0000000000000000', // Synth
            ]),
        },
        {
            name: 'Build',
            bars: 16,
            description: 'Drums filter in, hi-hats rise to 16ths',
            grid: G([
                '1000100010001000', // Kick (4 on the floor)
                '0000100000001000', // Snare
                '1010101010101010', // Hi-Hat (8ths)
                '0000000000000000', // Clap
                '1000100010001000', // Bass
                '0000000000000000', // Lead
                '1000000010000000', // Pad
                '0000100000001000', // Synth (sparse stabs)
            ]),
        },
        {
            name: 'Pre-Drop',
            bars: 8,
            description: 'Full 16th hi-hats, rising anticipation before the drop',
            grid: G([
                '1000100010001000', // Kick
                '0000100000001000', // Snare
                '1111111111111111', // Hi-Hat (all 16ths)
                '0000100000001000', // Clap
                '1000100010001000', // Bass
                '0000000000000000', // Lead
                '1000100010001000', // Pad (all 4 beats)
                '0001000100010001', // Synth (16th stabs)
            ]),
        },
        {
            name: 'Drop',
            bars: 24,
            description: 'The main drop — punchy kick, soaring lead melody',
            grid: G([
                '1000100010001000', // Kick
                '0000100000001000', // Snare
                '0101010101010101', // Hi-Hat (offbeat 8ths)
                '0000100000001000', // Clap
                '1100100010001001', // Bass (pumping)
                '0010000100100001', // Lead (melody hits)
                '1000000010000000', // Pad
                '0000000100000001', // Synth
            ]),
        },
        {
            name: 'Break',
            bars: 8,
            description: 'Stripped — only pads and bass, emotional moment',
            grid: G([
                '0000000000000000', // Kick
                '0000000000000000', // Snare
                '0000000000000000', // Hi-Hat
                '0000000000000000', // Clap
                '1000100010001000', // Bass
                '0010001000100010', // Lead (exposed)
                '1000100010001000', // Pad
                '0000000000000000', // Synth
            ]),
        },
        {
            name: 'Drop 2',
            bars: 24,
            description: 'Bigger drop — extra bass and synth layers',
            grid: G([
                '1000100010001000', // Kick
                '0000100000001000', // Snare
                '1010101010101010', // Hi-Hat
                '0000100000001000', // Clap
                '1100100011001001', // Bass (extra 16ths)
                '0010001000100010', // Lead
                '1001000110010001', // Pad (busier)
                '0010001000100010', // Synth (matches lead)
            ]),
        },
        {
            name: 'Outro',
            bars: 8,
            description: 'Elements peel away, pads fade into silence',
            grid: G([
                '1000100010000000', // Kick (trailing off)
                '0000100000000000', // Snare
                '1010101000000000', // Hi-Hat
                '0000000000000000', // Clap
                '1000100000000000', // Bass
                '0000000000000000', // Lead
                '1000100010001000', // Pad (stays longest)
                '0000000000000000', // Synth
            ]),
        },
    ],
};

// ─── Song 3: Midnight Drive ────────────────────────────────────────────────
// Key: E Natural Minor (Aeolian)  |  BPM: 100  |  80 bars ≈ 3:12
// Scale: E  F#  G  A  B  C  D
const MIDNIGHT = {
    id: 'midnight_drive',
    name: 'Midnight Drive',
    bpm: 100,
    key: 'E',
    mode: 'Natural Minor',
    description: 'Dark synth-wave / techno. Pulsing minor bass lines, brooding leads and a driving 100 BPM grid.',
    color: '#74c0fc',
    scaleNotes: ['E', 'F#', 'G', 'A', 'B', 'C', 'D'],
    chordName: 'Em (E - G - B)',
    noteConfig: {
        bass: ['E2', 'B2', 'G2', 'D2', 'E2', 'A2', 'G2', 'B2'],
        lead: ['B4', 'D5', 'E5', 'G5', 'A5', 'B5', 'D5', 'E5'],
        pad: ['E3', 'G3', 'B3'],
        synth: ['E5', 'D5', 'B4', 'G4'],
    },
    trackTips: [
        { track: 'Bass', notes: ['E2', 'B2', 'G2', 'D2', 'A2'], tip: 'Minor root-fifth with passing D2 (♭7) for tension' },
        { track: 'Lead', notes: ['B4', 'D5', 'E5', 'G5', 'A5', 'B5'], tip: 'E natural minor scale — sustained, with legato modulation' },
        { track: 'Pad', notes: ['E3', 'G3', 'B3'], tip: 'Em chord — use long attack (0.5s) for slow swell' },
        { track: 'Synth', notes: ['E5', 'D5', 'B4', 'G4'], tip: 'Short pluck stabs on off-beats for rhythmic interest' },
        { track: 'Drums', notes: ['Kick', 'Snare', 'HH', 'Clap'], tip: 'Straight techno kick, rolling hi-hats, snare on 3' },
    ],
    sections: [
        {
            name: 'Cold Open',
            bars: 8,
            description: 'Bass pulse alone in the dark. No percussion.',
            grid: G([
                '0000000000000000', // Kick
                '0000000000000000', // Snare
                '0000000000000000', // Hi-Hat
                '0000000000000000', // Clap
                '1000100010001000', // Bass (4-beat pulse)
                '0000000000000000', // Lead
                '0000000000000000', // Pad
                '0000000000000000', // Synth
            ]),
        },
        {
            name: 'Tension Build',
            bars: 16,
            description: 'Pad swells in. Hi-hats and kick enter halfway.',
            grid: G([
                '1000000010000000', // Kick (beat 1 & 3)
                '0000000000000000', // Snare
                '1010101010101010', // Hi-Hat (8ths)
                '0000000000000000', // Clap
                '1000100010001001', // Bass
                '0000000000000000', // Lead
                '1000000010000000', // Pad (enters here)
                '0000000000000000', // Synth
            ]),
        },
        {
            name: 'Main Groove',
            bars: 16,
            description: 'Full drum kit locked in. Lead starts haunting melody.',
            grid: G([
                '1000100010001000', // Kick (4-on-floor)
                '0000100000001000', // Snare (2 & 4) — WAIT: snare on beat 3 for minor feel
                '1010101010101010', // Hi-Hat
                '0000000100000001', // Clap (offbeat accents)
                '1001000110000010', // Bass (tight groove)
                '0000000100000001', // Lead (sparse, eerie)
                '1000000010000000', // Pad
                '0000000000000000', // Synth
            ]),
        },
        {
            name: 'Synth Layer',
            bars: 12,
            description: 'Synth stabs join, adding rhythmic texture over the groove',
            grid: G([
                '1000100010001000', // Kick
                '0000100000001000', // Snare
                '1111101111011110', // Hi-Hat (mostly 16ths)
                '0000000100000001', // Clap
                '1001000110000011', // Bass
                '0000001000000010', // Lead
                '1000000010000000', // Pad
                '0010001000100010', // Synth (16th stabs)
            ]),
        },
        {
            name: 'Peak',
            bars: 20,
            description: 'Maximum energy — everything locked in, lead soaring',
            grid: G([
                '1001000110010001', // Kick (extra hits)
                '0000100000001000', // Snare
                '1111111111111111', // Hi-Hat (all 16ths)
                '0000100000000100', // Clap
                '1001001010010010', // Bass (busiest)
                '0010001000100001', // Lead (answering phrase)
                '1001000110010001', // Pad (synced to kick)
                '0010001000100010', // Synth
            ]),
        },
        {
            name: 'Cooldown',
            bars: 8,
            description: 'Drums thin out, bass and pad carry the resolution',
            grid: G([
                '1000000010000000', // Kick (1 & 3)
                '0000100000001000', // Snare
                '1010000010100000', // Hi-Hat (sparse)
                '0000000000000000', // Clap
                '1000100010001000', // Bass
                '0000000100000001', // Lead (trailing echo)
                '1000100010001000', // Pad
                '0000000000000000', // Synth
            ]),
        },
    ],
};

export const DEMO_SONGS = [LOFI, SUNRISE, MIDNIGHT];

// Piano key layout helpers for the UI
const ALL_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const BLACK_SET = new Set(['C#', 'D#', 'F#', 'G#', 'A#']);

export function getScaleKeyLayout(scaleNotes) {
    return ALL_NOTES.map(n => ({
        note: n,
        isBlack: BLACK_SET.has(n),
        inScale: scaleNotes.includes(n),
    }));
}

export function getDurationDisplay(song) {
    const totalBars = song.sections.reduce((s, sec) => s + sec.bars, 0);
    const beatsPerBar = 4;
    const secondsPerBeat = 60 / song.bpm;
    const totalSeconds = totalBars * beatsPerBar * secondsPerBeat;
    const m = Math.floor(totalSeconds / 60);
    const s = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
    return { display: `${m}:${s}`, totalSeconds, totalBars };
}
