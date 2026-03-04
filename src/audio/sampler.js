import * as Tone from 'tone';

/**
 * SamplePlayer — loads local WAV drum samples and plays them via Tone.Player.
 * Falls back to the existing synthesized instruments if audio context hasn't
 * started or a sample fails to load.
 */

const BASE_URL = '/samples/';

// Maps instrument names to sample filenames
const SAMPLE_MAP = {
    kick: 'kick.wav',
    kick2: 'kick2.wav',
    snare: 'snare.wav',
    snare2: 'snare2.wav',
    hihat: 'hihat.wav',
    open_hat: 'open_hat.wav',
    clap: 'clap.wav',
    tom_high: 'tom_high.wav',
    tom_mid: 'tom_mid.wav',
    tom_low: 'tom_low.wav',
    rim: 'rim.wav',
    cowbell: 'cowbell.wav',
    bass_hit: 'bass_hit.wav',
    bass_hit2: 'bass_hit2.wav',
    crash: 'crash.wav',
    shaker: 'shaker.wav',
};

export const DRUM_KITS = [
    {
        id: 'standard',
        name: 'Standard Kit',
        description: 'Classic drum machine sounds',
        tracks: {
            kick: 'kick',
            snare: 'snare',
            hihat: 'hihat',
            clap: 'clap',
            openhat: 'open_hat',
            tom1: 'tom_high',
            tom2: 'tom_mid',
            tom3: 'tom_low',
        },
    },
    {
        id: 'trap',
        name: 'Trap Kit',
        description: '808-style punchy kit',
        tracks: {
            kick: 'kick2',
            snare: 'snare2',
            hihat: 'hihat',
            clap: 'clap',
            openhat: 'open_hat',
            rim: 'rim',
            cowbell: 'cowbell',
            crash: 'crash',
        },
    },
    {
        id: 'percussion',
        name: 'Percussion',
        description: 'World / Afro percussion flavour',
        tracks: {
            kick: 'bass_hit',
            snare: 'rim',
            hihat: 'shaker',
            clap: 'clap',
            openhat: 'open_hat',
            tom1: 'tom_high',
            tom2: 'tom_mid',
            cowbell: 'cowbell',
        },
    },
];

class SamplePlayer {
    constructor() {
        this._players = {};   // name → Tone.Player
        this._loaded = false;
        this._loading = false;
        this._masterChannel = null;
    }

    async init(masterChannel) {
        if (this._loading || this._loaded) return;
        this._loading = true;
        this._masterChannel = masterChannel;

        const loadPromises = Object.entries(SAMPLE_MAP).map(async ([name, file]) => {
            try {
                const player = new Tone.Player({
                    url: BASE_URL + file,
                    autostart: false,
                });
                if (masterChannel) player.connect(masterChannel);
                else player.toDestination();

                await Tone.loaded(); // wait for ALL pending loads
                this._players[name] = player;
            } catch (e) {
                console.warn(`[SamplePlayer] Failed to load ${file}:`, e.message);
            }
        });

        await Promise.allSettled(loadPromises);
        this._loaded = true;
        this._loading = false;
        console.log(`[SamplePlayer] Loaded ${Object.keys(this._players).length} samples`);
    }

    /**
     * Trigger a named sample. Returns true if played via sample, false if not found.
     * @param {string} name  - e.g. 'kick', 'snare', 'hihat'
     * @param {number} [time] - Tone.js time, or undefined for 'now'
     * @param {number} [velocity] - 0-1 volume
     */
    trigger(name, time = Tone.now(), velocity = 0.9) {
        const player = this._players[name];
        if (!player) return false;
        try {
            player.volume.value = Tone.gainToDb(velocity);
            if (time !== undefined) player.start(time);
            else player.start();
            return true;
        } catch (e) {
            return false;
        }
    }

    isLoaded() { return this._loaded; }
    hasPlayer(name) { return !!this._players[name]; }

    /** Set volume for all samples */
    setVolume(db) {
        Object.values(this._players).forEach(p => { p.volume.value = db; });
    }
}

export const samplePlayer = new SamplePlayer();
