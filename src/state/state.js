/**
 * Lightweight reactive state manager (pub/sub pattern)
 * Replaces Redux — no external deps required.
 */

const TRACKS = [
    { id: 0, name: 'Kick', color: '#ff6b6b', instrument: 'kick' },
    { id: 1, name: 'Snare', color: '#ffa94d', instrument: 'snare' },
    { id: 2, name: 'Hi-Hat', color: '#ffd43b', instrument: 'hihat' },
    { id: 3, name: 'Clap', color: '#69db7c', instrument: 'clap' },
    { id: 4, name: 'Bass', color: '#74c0fc', instrument: 'bass' },
    { id: 5, name: 'Lead', color: '#b197fc', instrument: 'lead' },
    { id: 6, name: 'Pad', color: '#f783ac', instrument: 'pad' },
    { id: 7, name: 'Synth', color: '#00FFFF', instrument: 'synth' },
];

const STEP_COUNT = 16;

function createInitialGrid() {
    return TRACKS.map(() => Array(STEP_COUNT).fill(false));
}

function createInitialMixer() {
    return TRACKS.map(() => ({ volume: 0.8, pan: 0, muted: false, soloed: false }));
}

const initialState = {
    // Transport
    bpm: 120,
    isPlaying: false,
    currentStep: -1,
    swing: 0,

    // Sequencer
    grid: createInitialGrid(),
    stepCount: STEP_COUNT,
    tracks: TRACKS,

    // Mixer
    mixer: createInitialMixer(),
    masterVolume: 0.8,

    // Effects per track
    effects: {
        reverb: { enabled: false, wet: 0.3, decay: 2.0 },
        delay: { enabled: false, wet: 0.3, time: '8n', feedback: 0.4 },
        distortion: { enabled: false, wet: 0.5, amount: 0.4 },
        filter: { enabled: false, frequency: 2000, type: 'lowpass', Q: 1 },
        chorus: { enabled: false, wet: 0.5, frequency: 1.5, depth: 0.7 },
    },

    // UI state
    activePanel: 'sequencer',   // 'sequencer' | 'mixer' | 'effects' | 'keyboard' | 'presets'
    visualizerMode: 'waveform', // 'waveform' | 'spectrum'
    activePreset: null,
    selectedTrack: 0,
};

class StateManager {
    constructor(initial) {
        this._state = structuredClone(initial);
        this._listeners = {};
    }

    /** Get a snapshot of the current state */
    get() {
        return this._state;
    }

    /** Subscribe to state changes. Returns unsubscribe fn. */
    on(event, fn) {
        if (!this._listeners[event]) this._listeners[event] = new Set();
        this._listeners[event].add(fn);
        return () => this._listeners[event].delete(fn);
    }

    /** Emit an event with optional data */
    _emit(event, data) {
        (this._listeners[event] || new Set()).forEach(fn => fn(data));
        (this._listeners['*'] || new Set()).forEach(fn => fn({ event, data }));
    }

    // ── Transport ────────────────────────────────────
    setBpm(bpm) {
        this._state.bpm = Math.max(40, Math.min(240, bpm));
        this._emit('bpm', this._state.bpm);
    }

    setPlaying(playing) {
        this._state.isPlaying = playing;
        this._emit('playing', playing);
    }

    setCurrentStep(step) {
        this._state.currentStep = step;
        this._emit('step', step);
    }

    setSwing(swing) {
        this._state.swing = Math.max(0, Math.min(1, swing));
        this._emit('swing', this._state.swing);
    }

    // ── Sequencer ────────────────────────────────────
    toggleStep(trackIdx, stepIdx) {
        this._state.grid[trackIdx][stepIdx] = !this._state.grid[trackIdx][stepIdx];
        this._emit('grid', { trackIdx, stepIdx, value: this._state.grid[trackIdx][stepIdx] });
    }

    setGrid(grid) {
        this._state.grid = grid;
        this._emit('grid-full', grid);
    }

    clearTrack(trackIdx) {
        this._state.grid[trackIdx] = Array(this._state.stepCount).fill(false);
        this._emit('grid-full', this._state.grid);
    }

    clearAll() {
        this._state.grid = createInitialGrid();
        this._emit('grid-full', this._state.grid);
    }

    randomizeTrack(trackIdx) {
        this._state.grid[trackIdx] = Array(this._state.stepCount)
            .fill(false)
            .map(() => Math.random() > 0.7);
        this._emit('grid-full', this._state.grid);
    }

    // ── Mixer ─────────────────────────────────────────
    setTrackVolume(trackIdx, volume) {
        this._state.mixer[trackIdx].volume = Math.max(0, Math.min(1, volume));
        this._emit('mixer', { trackIdx, prop: 'volume', value: this._state.mixer[trackIdx].volume });
    }

    setTrackPan(trackIdx, pan) {
        this._state.mixer[trackIdx].pan = Math.max(-1, Math.min(1, pan));
        this._emit('mixer', { trackIdx, prop: 'pan', value: this._state.mixer[trackIdx].pan });
    }

    toggleMute(trackIdx) {
        this._state.mixer[trackIdx].muted = !this._state.mixer[trackIdx].muted;
        this._emit('mixer', { trackIdx, prop: 'muted', value: this._state.mixer[trackIdx].muted });
    }

    toggleSolo(trackIdx) {
        const track = this._state.mixer[trackIdx];
        track.soloed = !track.soloed;
        this._emit('mixer', { trackIdx, prop: 'soloed', value: track.soloed });
    }

    setMasterVolume(vol) {
        this._state.masterVolume = Math.max(0, Math.min(1, vol));
        this._emit('masterVolume', this._state.masterVolume);
    }

    // ── Effects ─────────────────────────────────────
    setEffect(effect, key, value) {
        if (this._state.effects[effect]) {
            this._state.effects[effect][key] = value;
            this._emit('effect', { effect, key, value });
        }
    }

    toggleEffect(effect) {
        if (this._state.effects[effect]) {
            this._state.effects[effect].enabled = !this._state.effects[effect].enabled;
            this._emit('effect', { effect, key: 'enabled', value: this._state.effects[effect].enabled });
        }
    }

    // ── UI ────────────────────────────────────────────
    setActivePanel(panel) {
        this._state.activePanel = panel;
        this._emit('panel', panel);
    }

    setVisualizerMode(mode) {
        this._state.visualizerMode = mode;
        this._emit('visualizer-mode', mode);
    }

    setActivePreset(preset) {
        this._state.activePreset = preset;
        this._emit('preset', preset);
    }

    setSelectedTrack(idx) {
        this._state.selectedTrack = idx;
        this._emit('selected-track', idx);
    }

    // ── Preset I/O ────────────────────────────────────
    exportState() {
        return JSON.stringify({
            bpm: this._state.bpm,
            grid: this._state.grid,
            mixer: this._state.mixer,
            effects: this._state.effects,
        });
    }

    importState(json) {
        try {
            const data = JSON.parse(json);
            if (data.bpm) this._state.bpm = data.bpm;
            if (data.grid) this._state.grid = data.grid;
            if (data.mixer) this._state.mixer = data.mixer;
            if (data.effects) this._state.effects = data.effects;
            this._emit('import', null);
            return true;
        } catch {
            return false;
        }
    }
}

export const state = new StateManager(initialState);
export { TRACKS, STEP_COUNT };
