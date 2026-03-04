import * as Tone from 'tone';
import { state, TRACKS } from '../state/state.js';
import { SYNTH_PRESETS } from './presets.js';

/**
 * Core audio engine — wraps Tone.js
 * Manages instruments, effects chain, sequencer loop, analyzer nodes,
 * and demo song playback with per-section note cycling.
 */
class AudioEngine {
    constructor() {
        this._instruments = {};
        this._channels = [];
        this._masterChannel = null;
        this._analyzer = null;
        this._fft = null;
        this._sequence = null;
        this._effects = {};
        this._initialized = false;

        // Song mode state
        this._songMode = false;
        this._noteConfig = null;   // {bass:[...], lead:[...], pad:[...], synth:[...]}
        this._noteCounters = {};   // per-instrument step counter for cycling
        this._songScheduleIds = []; // Tone.Transport schedule IDs to cancel
        this._onSectionChange = null; // callback(sectionIndex, totalBars)
        this._onSongEnd = null;
        this._songSectionIdx = 0;
    }

    // ── Initialization ──────────────────────────────────────────────────────
    async init() {
        if (this._initialized) return;

        this._masterChannel = new Tone.Channel({ volume: 0 }).toDestination();

        this._analyzer = new Tone.Analyser('waveform', 1024);
        this._fft = new Tone.Analyser('fft', 256);
        this._masterChannel.connect(this._analyzer);
        this._masterChannel.connect(this._fft);

        this._effects = {
            reverb: new Tone.Reverb({ decay: 2.0, wet: 0 }).connect(this._masterChannel),
            delay: new Tone.FeedbackDelay({ delayTime: '8n', feedback: 0.4, wet: 0 }).connect(this._masterChannel),
            distortion: new Tone.Distortion({ distortion: 0.4, wet: 0 }).connect(this._masterChannel),
            filter: new Tone.Filter({ frequency: 2000, type: 'lowpass', Q: 1 }).connect(this._masterChannel),
            chorus: new Tone.Chorus({ frequency: 1.5, depth: 0.7, wet: 0 }).connect(this._masterChannel),
        };

        await this._effects.reverb.ready;

        this._instruments = await this._createInstruments();
        this._buildSequencer();
        this._bindStateListeners();
        this._initialized = true;
    }

    async _createInstruments() {
        const instr = {};

        instr.kick = new Tone.MembraneSynth({
            pitchDecay: 0.05, octaves: 6,
            envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 0.4 },
        });

        instr.snare = new Tone.NoiseSynth({
            noise: { type: 'white' },
            envelope: { attack: 0.001, decay: 0.13, sustain: 0, release: 0.05 },
        });

        instr.hihat = new Tone.MetalSynth({
            frequency: 400, harmonicity: 5.1, modulationIndex: 32,
            resonance: 4000, octaves: 1.5,
            envelope: { attack: 0.001, decay: 0.08, release: 0.05 },
        });

        instr.clap = new Tone.NoiseSynth({
            noise: { type: 'pink' },
            envelope: { attack: 0.005, decay: 0.16, sustain: 0, release: 0.1 },
        });

        instr.bass = new Tone.MonoSynth({
            oscillator: { type: 'square' },
            envelope: { attack: 0.01, decay: 0.3, sustain: 0.4, release: 0.2 },
            filterEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.2, baseFrequency: 80, octaves: 3 },
        });

        instr.lead = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: 'sawtooth' },
            envelope: { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.5 },
        });

        instr.pad = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: 'sine' },
            envelope: { attack: 0.5, decay: 0.5, sustain: 0.8, release: 2.0 },
        });

        instr.synth = new Tone.PolySynth(Tone.Synth, SYNTH_PRESETS.pluck);

        const mixer = state.get().mixer;
        this._channels = TRACKS.map((track, i) => {
            const ch = new Tone.Channel({
                volume: Tone.gainToDb(mixer[i].volume),
                pan: mixer[i].pan,
                mute: mixer[i].muted,
            });
            instr[track.instrument].connect(ch);
            ch.connect(this._effects.filter);
            return ch;
        });

        return instr;
    }

    // ── Sequencer ──────────────────────────────────────────────────────────
    _buildSequencer() {
        const stepCount = state.get().stepCount;

        this._sequence = new Tone.Sequence(
            (time, step) => {
                state.setCurrentStep(step);
                const { grid, mixer } = state.get();

                TRACKS.forEach((track, trackIdx) => {
                    if (grid[trackIdx][step]) {
                        const isMuted = mixer[trackIdx].muted;
                        const anySoloed = mixer.some(m => m.soloed);
                        const isSilent = isMuted || (anySoloed && !mixer[trackIdx].soloed);
                        if (!isSilent) {
                            this._triggerInstrument(track.instrument, time);
                        }
                    }
                });
            },
            [...Array(stepCount).keys()],
            '16n'
        );
    }

    /**
     * Trigger an instrument. In song mode, melodic instruments cycle through
     * the note sequence from the active song's noteConfig.
     */
    _triggerInstrument(name, time) {
        const i = this._instruments;

        const getNote = (key, fallback) => {
            if (!this._songMode || !this._noteConfig?.[key]) return fallback;
            const seq = this._noteConfig[key];
            if (!this._noteCounters[key]) this._noteCounters[key] = 0;
            // pad can be an array of chord notes
            if (Array.isArray(seq[0])) {
                const chord = seq[this._noteCounters[key] % seq.length];
                this._noteCounters[key]++;
                return chord;
            }
            const note = seq[this._noteCounters[key] % seq.length];
            this._noteCounters[key]++;
            return note;
        };

        switch (name) {
            case 'kick':
                i.kick.triggerAttackRelease('C1', '8n', time);
                break;
            case 'snare':
                i.snare.triggerAttackRelease('8n', time);
                break;
            case 'hihat':
                i.hihat.triggerAttackRelease('32n', time);
                break;
            case 'clap':
                i.clap.triggerAttackRelease('8n', time);
                break;
            case 'bass': {
                const note = getNote('bass', 'C2');
                i.bass.triggerAttackRelease(note, '8n', time);
                break;
            }
            case 'lead': {
                const note = getNote('lead', 'C4');
                i.lead.triggerAttackRelease(note, '8n', time, 0.5);
                break;
            }
            case 'pad': {
                const notes = getNote('pad', ['C4', 'E4', 'G4']);
                const chord = Array.isArray(notes) ? notes : [notes];
                i.pad.triggerAttackRelease(chord, '4n', time, 0.4);
                break;
            }
            case 'synth': {
                const note = getNote('synth', 'G4');
                i.synth.triggerAttackRelease(note, '8n', time, 0.6);
                break;
            }
        }
    }

    // ── Transport ──────────────────────────────────────────────────────────
    async start() {
        if (!this._initialized) await this.init();
        await Tone.start();
        Tone.getTransport().bpm.value = state.get().bpm;
        Tone.getTransport().start();
        this._sequence.start(0);
        state.setPlaying(true);
    }

    stop() {
        Tone.getTransport().stop();
        if (this._sequence) this._sequence.stop();
        this._cancelSongSchedule();
        this._songMode = false;
        this._noteConfig = null;
        this._noteCounters = {};
        state.setCurrentStep(-1);
        state.setPlaying(false);
    }

    setBpm(bpm) {
        Tone.getTransport().bpm.value = bpm;
    }

    // ── Song / Demo Playback ───────────────────────────────────────────────
    /**
     * Play a full demo song by scheduling section transitions via Tone.Transport.
     * @param {Object} song - from demos.js
     * @param {Function} onSection - callback(sectionIdx, sectionName, bars, totalBars)
     * @param {Function} onEnd - called when song finishes
     */
    async playSong(song, onSection, onEnd) {
        if (!this._initialized) await this.init();
        await Tone.start();

        // Stop anything playing
        this.stop();

        // Set up song mode
        this._songMode = true;
        this._noteConfig = song.noteConfig;
        this._noteCounters = {};
        this._onSectionChange = onSection;
        this._onSongEnd = onEnd;
        this._songSectionIdx = 0;

        // Set BPM
        state.setBpm(song.bpm);

        // Load first section immediately
        state.setGrid(song.sections[0].grid);
        if (onSection) onSection(0, song.sections[0].name, song.sections[0].bars, this._totalBars(song));

        // Schedule all section transitions
        let barOffset = 0;
        const scheduledIds = [];

        song.sections.forEach((section, idx) => {
            if (idx > 0) {
                // Schedule this section to start at barOffset bars from transport start
                const barTime = `${barOffset}:0:0`;
                const id = Tone.getTransport().schedule(time => {
                    // Switch grid
                    state.setGrid(section.grid);
                    this._noteCounters = {}; // reset note cycling at each section
                    this._songSectionIdx = idx;
                    if (onSection) onSection(idx, section.name, section.bars, this._totalBars(song));
                }, barTime);
                scheduledIds.push(id);
            }
            barOffset += section.bars;
        });

        // Schedule song end
        const endId = Tone.getTransport().schedule(() => {
            this.stop();
            if (onEnd) onEnd();
        }, `${barOffset}:0:0`);
        scheduledIds.push(endId);

        this._songScheduleIds = scheduledIds;

        // Start transport
        Tone.getTransport().start();
        this._sequence.start(0);
        state.setPlaying(true);
    }

    _totalBars(song) {
        return song.sections.reduce((s, sec) => s + sec.bars, 0);
    }

    _cancelSongSchedule() {
        this._songScheduleIds.forEach(id => {
            try { Tone.getTransport().clear(id); } catch { }
        });
        this._songScheduleIds = [];
    }

    /** Get current song progress: {bars, totalBars, seconds, pct} */
    getSongProgress(song) {
        if (!song) return null;
        const pos = Tone.getTransport().position; // "bars:beats:sixteenths"
        const parts = pos.split(':');
        const bars = parseInt(parts[0]) || 0;
        const totalBars = this._totalBars(song);
        const totalSeconds = totalBars * 4 * (60 / song.bpm);
        const elapsed = bars * 4 * (60 / song.bpm);
        return { bars, totalBars, elapsed, totalSeconds, pct: Math.min(1, elapsed / totalSeconds) };
    }

    // ── Live keyboard note playing ─────────────────────────────────────────
    async playNote(note, instrument = 'lead') {
        if (!this._initialized) await this.init();
        await Tone.start();
        const instr = this._instruments[instrument];
        if (!instr) return;
        if (instr instanceof Tone.PolySynth || instr.name === 'MonoSynth') {
            instr.triggerAttack(note);
        }
    }

    async releaseNote(note, instrument = 'lead') {
        const instr = this._instruments[instrument];
        if (!instr) return;
        if (instr instanceof Tone.PolySynth || instr.name === 'MonoSynth') {
            instr.triggerRelease(note);
        }
    }

    // ── Analyzer ──────────────────────────────────────────────────────────
    getWaveform() { return this._analyzer ? this._analyzer.getValue() : new Float32Array(1024); }
    getFFT() { return this._fft ? this._fft.getValue() : new Float32Array(256); }

    // ── State bindings ─────────────────────────────────────────────────────
    _bindStateListeners() {
        state.on('bpm', bpm => this.setBpm(bpm));

        state.on('mixer', ({ trackIdx, prop, value }) => {
            const ch = this._channels[trackIdx];
            if (!ch) return;
            if (prop === 'volume') ch.volume.value = Tone.gainToDb(value);
            if (prop === 'pan') ch.pan.value = value;
            if (prop === 'muted') ch.mute = value;
        });

        state.on('masterVolume', vol => {
            if (this._masterChannel) this._masterChannel.volume.value = Tone.gainToDb(vol);
        });

        state.on('effect', ({ effect, key, value }) => {
            const fx = this._effects[effect];
            if (!fx) return;
            if (key === 'enabled') {
                fx.wet.value = value ? (state.get().effects[effect].wet || 0.5) : 0;
            } else if (key === 'wet' && state.get().effects[effect].enabled) {
                fx.wet.value = value;
            } else if (key === 'decay' && effect === 'reverb') {
                fx.decay = value;
            } else if (key === 'feedback' && effect === 'delay') {
                fx.feedback.value = value;
            } else if (key === 'frequency' && effect === 'filter') {
                fx.frequency.value = value;
            } else if (key === 'amount' && effect === 'distortion') {
                fx.distortion = value;
            }
        });
    }
}

export const engine = new AudioEngine();
