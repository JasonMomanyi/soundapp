/**
 * generate-samples.mjs
 * Generates drum sample WAV files using mathematical synthesis.
 * Produces realistic kick, snare, hi-hat, clap, open-hat, tom, rim, cowbell.
 * Run: node scripts/generate-samples.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', 'public', 'samples');
fs.mkdirSync(OUT_DIR, { recursive: true });

const SAMPLE_RATE = 44100;
const PI2 = Math.PI * 2;

// ── WAV writer ───────────────────────────────────────────────────────────────
function writeWav(filename, samples) {
    const numChannels = 1;
    const bitDepth = 16;
    const byteRate = SAMPLE_RATE * numChannels * (bitDepth / 8);
    const blockAlign = numChannels * (bitDepth / 8);
    const dataSize = samples.length * 2;
    const buf = Buffer.alloc(44 + dataSize);

    buf.write('RIFF', 0);
    buf.writeUInt32LE(36 + dataSize, 4);
    buf.write('WAVE', 8);
    buf.write('fmt ', 12);
    buf.writeUInt32LE(16, 16);
    buf.writeUInt16LE(1, 20);
    buf.writeUInt16LE(numChannels, 22);
    buf.writeUInt32LE(SAMPLE_RATE, 24);
    buf.writeUInt32LE(byteRate, 28);
    buf.writeUInt16LE(blockAlign, 32);
    buf.writeUInt16LE(bitDepth, 34);
    buf.write('data', 36);
    buf.writeUInt32LE(dataSize, 40);

    for (let i = 0; i < samples.length; i++) {
        const clamped = Math.max(-1, Math.min(1, samples[i]));
        buf.writeInt16LE(Math.round(clamped * 32767), 44 + i * 2);
    }

    fs.writeFileSync(path.join(OUT_DIR, filename), buf);
    console.log(`  ✓ ${filename} (${samples.length} samples, ${(dataSize / 1024).toFixed(1)} kB)`);
}

// ── Envelope: Attack-Decay-Sustain-Release ───────────────────────────────────
function envelope(t, attack, decay, sustain, release, totalLen) {
    if (t < attack) return t / attack;
    if (t < attack + decay) return 1 - (1 - sustain) * ((t - attack) / decay);
    const holdEnd = totalLen - release;
    if (t < holdEnd) return sustain;
    return sustain * Math.max(0, 1 - (t - holdEnd) / release);
}

function seconds(n) { return Math.round(n * SAMPLE_RATE); }

// ─────────────────────────────────────────────────────────────────────────────
//  KICK DRUM — pitch-bent sine + sub boom
// ─────────────────────────────────────────────────────────────────────────────
function generateKick() {
    const len = seconds(0.55);
    const out = new Float32Array(len);
    const startFreq = 180, endFreq = 40;
    for (let i = 0; i < len; i++) {
        const t = i / SAMPLE_RATE;
        const bend = Math.exp(-t * 16);
        const freq = endFreq + (startFreq - endFreq) * bend;
        const sine = Math.sin(PI2 * freq * t);
        const click = Math.sin(PI2 * 800 * t) * Math.exp(-t * 60);
        const env = Math.exp(-t * 5) * 0.9 + Math.exp(-t * 25) * 0.1;
        out[i] = (sine * 0.85 + click * 0.15) * env;
    }
    return out;
}

// ─────────────────────────────────────────────────────────────────────────────
//  SNARE — filtered noise + resonant tone
// ─────────────────────────────────────────────────────────────────────────────
function generateSnare() {
    const len = seconds(0.25);
    const out = new Float32Array(len);
    // Simple 1-pole highpass for noise colouring
    let hp = 0;
    const hpCoef = 1 - (2 * Math.PI * 1200 / SAMPLE_RATE);
    for (let i = 0; i < len; i++) {
        const t = i / SAMPLE_RATE;
        const noise = (Math.random() * 2 - 1);
        hp = hpCoef * hp + (1 - hpCoef) * noise;
        const hpNoise = noise - hp;
        const tone = Math.sin(PI2 * 200 * t) * Math.exp(-t * 30);
        const noiseEnv = Math.exp(-t * 12);
        out[i] = (hpNoise * 0.65 * noiseEnv + tone * 0.35);
        out[i] = Math.max(-1, Math.min(1, out[i] * 1.2));
    }
    return out;
}

// ─────────────────────────────────────────────────────────────────────────────
//  CLOSED HI-HAT — band-pass metallic noise
// ─────────────────────────────────────────────────────────────────────────────
function generateHihat() {
    const len = seconds(0.08);
    const out = new Float32Array(len);
    const freqs = [6000, 8000, 10000, 12000];
    for (let i = 0; i < len; i++) {
        const t = i / SAMPLE_RATE;
        let s = 0;
        for (const f of freqs) s += Math.sin(PI2 * f * t);
        s /= freqs.length;
        const noise = Math.random() * 2 - 1;
        const mix = s * 0.5 + noise * 0.5;
        out[i] = mix * Math.exp(-t * 35);
    }
    return out;
}

// ─────────────────────────────────────────────────────────────────────────────
//  OPEN HI-HAT — same but longer + shimmer
// ─────────────────────────────────────────────────────────────────────────────
function generateOpenHat() {
    const len = seconds(0.45);
    const out = new Float32Array(len);
    for (let i = 0; i < len; i++) {
        const t = i / SAMPLE_RATE;
        const noise = Math.random() * 2 - 1;
        const metal = Math.sin(PI2 * 8000 * t) * 0.4 +
            Math.sin(PI2 * 11200 * t) * 0.3 +
            Math.sin(PI2 * 14100 * t) * 0.3;
        const mix = noise * 0.55 + metal * 0.45;
        out[i] = mix * Math.exp(-t * 5) * 0.85;
    }
    return out;
}

// ─────────────────────────────────────────────────────────────────────────────
//  CLAP — burst of noise pops
// ─────────────────────────────────────────────────────────────────────────────
function generateClap() {
    const len = seconds(0.22);
    const out = new Float32Array(len);
    const pops = [0, 0.006, 0.012, 0.018];
    for (let i = 0; i < len; i++) {
        const t = i / SAMPLE_RATE;
        let val = 0;
        for (const p of pops) {
            const dt = t - p;
            if (dt >= 0) val += (Math.random() * 2 - 1) * Math.exp(-dt * 70);
        }
        // Bandpass-like: mix with medium-freq noise
        const noise = (Math.random() * 2 - 1) * Math.exp(-t * 18);
        out[i] = (val * 0.6 + noise * 0.4) * 0.8;
        out[i] = Math.max(-1, Math.min(1, out[i]));
    }
    return out;
}

// ─────────────────────────────────────────────────────────────────────────────
//  TOM — pitched membrane hit
// ─────────────────────────────────────────────────────────────────────────────
function generateTom(freq = 120) {
    const len = seconds(0.5);
    const out = new Float32Array(len);
    for (let i = 0; i < len; i++) {
        const t = i / SAMPLE_RATE;
        const bend = Math.exp(-t * 8);
        const f = freq * (1 + bend * 0.8);
        const tone = Math.sin(PI2 * f * t);
        const noise = (Math.random() * 2 - 1) * Math.exp(-t * 40);
        out[i] = (tone * 0.8 + noise * 0.2) * Math.exp(-t * 6);
    }
    return out;
}

// ─────────────────────────────────────────────────────────────────────────────
//  RIM SHOT — short metallic click
// ─────────────────────────────────────────────────────────────────────────────
function generateRim() {
    const len = seconds(0.12);
    const out = new Float32Array(len);
    for (let i = 0; i < len; i++) {
        const t = i / SAMPLE_RATE;
        const click = Math.sin(PI2 * 900 * t) * Math.exp(-t * 60);
        const wood = Math.sin(PI2 * 1700 * t) * Math.exp(-t * 80);
        out[i] = (click * 0.6 + wood * 0.4) * 0.9;
    }
    return out;
}

// ─────────────────────────────────────────────────────────────────────────────
//  COWBELL — classic 808-style two-tone metallic
// ─────────────────────────────────────────────────────────────────────────────
function generateCowbell() {
    const len = seconds(0.5);
    const out = new Float32Array(len);
    const f1 = 562, f2 = 845;
    for (let i = 0; i < len; i++) {
        const t = i / SAMPLE_RATE;
        const s1 = Math.sin(PI2 * f1 * t);
        const s2 = Math.sin(PI2 * f2 * t);
        const env1 = Math.exp(-t * 15);
        const env2 = Math.exp(-t * 22);
        out[i] = (s1 * env1 + s2 * env2) * 0.5;
    }
    return out;
}

// ─────────────────────────────────────────────────────────────────────────────
//  BASS HIT — short sub-bass pluck for rhythm
// ─────────────────────────────────────────────────────────────────────────────
function generateBassHit(freq = 80) {
    const len = seconds(0.5);
    const out = new Float32Array(len);
    for (let i = 0; i < len; i++) {
        const t = i / SAMPLE_RATE;
        const pitch = freq * (1 + Math.exp(-t * 20) * 0.5);
        const s = Math.sin(PI2 * pitch * t) * 0.7
            + Math.sin(PI2 * pitch * 2 * t) * 0.2
            + Math.sin(PI2 * pitch * 3 * t) * 0.1;
        out[i] = s * Math.exp(-t * 7) * 0.9;
    }
    return out;
}

// ─────────────────────────────────────────────────────────────────────────────
//  CRASH CYMBAL
// ─────────────────────────────────────────────────────────────────────────────
function generateCrash() {
    const len = seconds(1.5);
    const out = new Float32Array(len);
    for (let i = 0; i < len; i++) {
        const t = i / SAMPLE_RATE;
        const hf = (Math.random() * 2 - 1);
        const metal = Math.sin(PI2 * 3000 * t) * 0.2 +
            Math.sin(PI2 * 5500 * t) * 0.2 +
            Math.sin(PI2 * 9000 * t) * 0.15;
        out[i] = (hf * 0.5 + metal * 0.5) * Math.exp(-t * 3.5) * 0.7;
    }
    return out;
}

// ─────────────────────────────────────────────────────────────────────────────
//  SHAKER — rattling noise
// ─────────────────────────────────────────────────────────────────────────────
function generateShaker() {
    const len = seconds(0.12);
    const out = new Float32Array(len);
    for (let i = 0; i < len; i++) {
        const t = i / SAMPLE_RATE;
        const noise = Math.random() * 2 - 1;
        // Band-limited using a crude approximation
        out[i] = noise * Math.exp(-t * 25) * 0.6;
    }
    return out;
}

// ── Generate all ─────────────────────────────────────────────────────────────
console.log('\n🥁  Generating drum samples to public/samples/\n');

writeWav('kick.wav', generateKick());
writeWav('kick2.wav', generateKick());   // slightly different tuning reuse
writeWav('snare.wav', generateSnare());
writeWav('snare2.wav', generateSnare());
writeWav('hihat.wav', generateHihat());
writeWav('open_hat.wav', generateOpenHat());
writeWav('clap.wav', generateClap());
writeWav('tom_high.wav', generateTom(200));
writeWav('tom_mid.wav', generateTom(140));
writeWav('tom_low.wav', generateTom(90));
writeWav('rim.wav', generateRim());
writeWav('cowbell.wav', generateCowbell());
writeWav('bass_hit.wav', generateBassHit(80));
writeWav('bass_hit2.wav', generateBassHit(60));
writeWav('crash.wav', generateCrash());
writeWav('shaker.wav', generateShaker());

console.log('\n✅  Done — all samples written to public/samples/\n');
