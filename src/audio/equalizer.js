import * as Tone from 'tone';
import { state } from '../state/state.js';

/**
 * 8-band parametric/graphic equalizer using Tone.Filter chain.
 * Bands: 32 · 64 · 125 · 250 · 500 · 1k · 4k · 16k Hz
 * Each band: ±12 dB, Q=1.4 (peaking), shelf at extremes.
 */

export const EQ_BANDS = [
    { freq: 32, label: '32', type: 'lowshelf', gain: 0, color: '#ff6b6b' },
    { freq: 64, label: '64', type: 'peaking', gain: 0, color: '#ffa94d' },
    { freq: 125, label: '125', type: 'peaking', gain: 0, color: '#ffd43b' },
    { freq: 250, label: '250', type: 'peaking', gain: 0, color: '#69db7c' },
    { freq: 500, label: '500', type: 'peaking', gain: 0, color: '#74c0fc' },
    { freq: 1000, label: '1k', type: 'peaking', gain: 0, color: '#b197fc' },
    { freq: 4000, label: '4k', type: 'peaking', gain: 0, color: '#f783ac' },
    { freq: 16000, label: '16k', type: 'highshelf', gain: 0, color: '#00FFFF' },
];

export const EQ_PRESETS = [
    { id: 'flat', name: 'Flat', gains: [0, 0, 0, 0, 0, 0, 0, 0] },
    { id: 'bass_boost', name: 'Bass Boost', gains: [8, 6, 3, 0, -1, -1, 0, 1] },
    { id: 'treble', name: 'Treble Boost', gains: [-2, -1, 0, 0, 1, 3, 5, 7] },
    { id: 'vocal', name: 'Vocal', gains: [-3, -2, 0, 2, 4, 3, 2, -1] },
    { id: 'pop', name: 'Pop', gains: [3, 1, 0, -2, -2, 1, 3, 4] },
    { id: 'rock', name: 'Rock', gains: [5, 3, 1, -1, -1, 2, 4, 5] },
    { id: 'jazz', name: 'Jazz', gains: [3, 2, 1, 0, -1, 0, 2, 3] },
    { id: 'electronic', name: 'Electronic', gains: [6, 4, 1, 0, -2, 0, 3, 5] },
    { id: 'hip_hop', name: 'Hip-Hop', gains: [7, 5, 2, -1, -2, -1, 1, 2] },
    { id: 'classical', name: 'Classical', gains: [2, 1, 0, 0, 0, 1, 2, 3] },
    { id: 'lofi', name: 'Lo-Fi', gains: [4, 2, 1, 0, -2, -4, -5, -6] },
    { id: 'club', name: 'Club', gains: [5, 3, 0, -1, -1, 0, 2, 4] },
];

// ── EQ class that wraps Tone.Filter chain ─────────────────────────────────
export class EQ8Band {
    constructor() {
        this.filters = [];
        this.gains = [...EQ_BANDS.map(b => b.gain)];
        this.bypass = false;
    }

    /** Build filter chain. Returns the INPUT node (connect sources here). */
    build(destination) {
        this.filters = EQ_BANDS.map(band => {
            return new Tone.Filter({
                frequency: band.freq,
                type: band.type,
                gain: band.gain,
                Q: 1.4,
            });
        });

        // Chain: f0 → f1 → ... → f7 → destination
        for (let i = 0; i < this.filters.length - 1; i++) {
            this.filters[i].connect(this.filters[i + 1]);
        }
        this.filters[this.filters.length - 1].connect(destination);

        return this.filters[0];
    }

    setBandGain(idx, gain) {
        const clamped = Math.max(-12, Math.min(12, gain));
        this.gains[idx] = clamped;
        if (this.filters[idx]) this.filters[idx].gain.value = clamped;
    }

    applyPreset(preset) {
        preset.gains.forEach((g, i) => this.setBandGain(i, g));
    }

    setBypass(bypass) {
        this.bypass = bypass;
        // Set all gains to 0 if bypassed
        if (bypass) {
            this.filters.forEach(f => { f.gain.value = 0; });
        } else {
            this.gains.forEach((g, i) => { if (this.filters[i]) this.filters[i].gain.value = g; });
        }
    }

    /** Get input node for routing */
    get input() { return this.filters[0]; }
}

// ── EQ UI Component ───────────────────────────────────────────────────────
export function createEqualizer(eqInstance) {
    const el = document.createElement('div');
    el.className = 'flex flex-col gap-4 p-4';
    el.style.overflowY = 'auto';

    el.innerHTML = `
    <div class="flex items-center justify-between flex-wrap gap-2">
      <div>
        <h2 class="text-sm font-semibold tracking-wider uppercase"
            style="color:rgba(255,255,255,0.35); letter-spacing:0.1em">Equalizer</h2>
        <p class="text-xs" style="color:rgba(255,255,255,0.2)">8-band parametric EQ — drag sliders or click a preset</p>
      </div>
      <div class="flex items-center gap-3">
        <label class="flex items-center gap-2 cursor-pointer">
          <span class="text-xs" style="color:rgba(255,255,255,0.35)">Bypass</span>
          <div class="toggle-track-eq relative" style="width:36px;height:20px;background:rgba(255,255,255,0.08);border-radius:10px;cursor:pointer">
            <input type="checkbox" id="eq-bypass" class="sr-only"/>
            <div class="toggle-thumb-eq" style="position:absolute;top:3px;left:3px;width:14px;height:14px;border-radius:50%;background:white;transition:left 0.2s ease"></div>
          </div>
        </label>
        <button id="eq-reset" class="btn-neon" style="font-size:0.65rem; padding:5px 12px">Reset</button>
      </div>
    </div>

    <!-- EQ Curve Canvas -->
    <div class="glass-panel relative overflow-hidden" style="height:140px">
      <canvas id="eq-canvas" style="position:absolute;inset:0;width:100%;height:100%"></canvas>
      <div id="eq-freq-labels" class="absolute bottom-1 left-0 right-0 flex justify-around px-2"
           style="pointer-events:none">
        ${EQ_BANDS.map(b => `
          <span style="font-size:0.5rem; font-family:monospace; color:rgba(255,255,255,0.2)">${b.label}</span>
        `).join('')}
      </div>
    </div>

    <!-- Band Sliders -->
    <div class="flex gap-2 justify-around" id="eq-bands">
      ${EQ_BANDS.map((band, i) => `
        <div class="flex flex-col items-center gap-1" style="flex:1">
          <span class="font-mono" id="eq-gain-${i}" style="font-size:0.6rem; color:${band.color}; min-height:14px">0</span>
          <div style="position:relative; height:140px; display:flex; align-items:center; justify-content:center">
            <input type="range" id="eq-slider-${i}" class="eq-slider"
              min="-12" max="12" step="0.5" value="0"
              orient="vertical"
              style="writing-mode:vertical-lr; direction:rtl; height:130px; width:6px;
                     cursor:pointer; accent-color:${band.color}"
              data-band="${i}"/>
          </div>
          <span style="font-size:0.55rem; font-family:monospace; color:rgba(255,255,255,0.2)">${band.label}</span>
        </div>
      `).join('')}
    </div>

    <!-- Presets -->
    <div>
      <p class="text-xs mb-2 font-semibold" style="color:rgba(255,255,255,0.25); letter-spacing:0.08em; text-transform:uppercase">Presets</p>
      <div class="flex flex-wrap gap-2" id="eq-presets">
        ${EQ_PRESETS.map(p => `
          <button class="eq-preset-btn tab-btn ${p.id === 'flat' ? 'active' : ''}" data-preset="${p.id}">
            ${p.name}
          </button>
        `).join('')}
      </div>
    </div>
  `;

    // ── Canvas EQ curve drawing ───────────────────────────────────────────
    const canvas = el.querySelector('#eq-canvas');
    const ctx = canvas.getContext('2d');

    const observer = new ResizeObserver(() => {
        canvas.width = canvas.offsetWidth * window.devicePixelRatio;
        canvas.height = canvas.offsetHeight * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        drawCurve();
    });
    observer.observe(canvas);

    function drawCurve() {
        const W = canvas.offsetWidth;
        const H = canvas.offsetHeight;
        if (!W || !H) return;

        ctx.clearRect(0, 0, W, H);

        // Grid lines
        ctx.setLineDash([2, 4]);
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 1;
        // 0 dB line
        const midY = H / 2;
        ctx.beginPath(); ctx.moveTo(0, midY); ctx.lineTo(W, midY); ctx.stroke();
        // +6, -6 lines
        [-6, -3, 3, 6].forEach(db => {
            const y = midY - (db / 12) * (H / 2) * 0.85;
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
        });
        ctx.setLineDash([]);

        // EQ curve using band gains mapped to log frequency positions
        const freqMin = Math.log10(20);
        const freqMax = Math.log10(20000);
        const logRange = freqMax - freqMin;

        function freqToX(f) { return ((Math.log10(f) - freqMin) / logRange) * W; }
        function gainToY(g) { return midY - (g / 12) * (midY * 0.85); }

        // Build smooth curve by sampling between band frequencies
        const curGains = eqInstance ? eqInstance.gains : EQ_BANDS.map(b => b.gain);

        const grad = ctx.createLinearGradient(0, 0, W, 0);
        EQ_BANDS.forEach((band, i) => { grad.addColorStop(i / (EQ_BANDS.length - 1), band.color); });
        ctx.strokeStyle = grad;
        ctx.shadowColor = '#00FFFF';
        ctx.shadowBlur = 8;
        ctx.lineWidth = 2;

        ctx.beginPath();
        // Start from 20Hz
        ctx.moveTo(0, gainToY(curGains[0]));

        // Draw curve through band positions
        for (let i = 0; i < EQ_BANDS.length; i++) {
            const x = freqToX(EQ_BANDS[i].freq);
            const y = gainToY(curGains[i]);
            if (i === 0) { ctx.lineTo(x, y); }
            else {
                // Curved step
                const prevX = freqToX(EQ_BANDS[i - 1].freq);
                const prevY = gainToY(curGains[i - 1]);
                const cpX = (prevX + x) / 2;
                ctx.bezierCurveTo(cpX, prevY, cpX, y, x, y);
            }
        }
        // End at 20kHz
        ctx.lineTo(W, gainToY(curGains[curGains.length - 1]));
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Fill area under curve
        ctx.lineTo(W, midY);
        ctx.lineTo(0, midY);
        ctx.closePath();
        const fillGrad = ctx.createLinearGradient(0, 0, 0, H);
        fillGrad.addColorStop(0, 'rgba(0,255,255,0.08)');
        fillGrad.addColorStop(1, 'rgba(0,255,255,0.01)');
        ctx.fillStyle = fillGrad;
        ctx.fill();

        // Band markers
        EQ_BANDS.forEach((band, i) => {
            const x = freqToX(band.freq);
            const y = gainToY(curGains[i]);
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fillStyle = band.color;
            ctx.shadowColor = band.color;
            ctx.shadowBlur = 8;
            ctx.fill();
            ctx.shadowBlur = 0;
        });
    }

    // ── Slider events ─────────────────────────────────────────────────────
    el.querySelector('#eq-bands').addEventListener('input', e => {
        const slider = e.target.closest('.eq-slider');
        if (!slider) return;
        const idx = parseInt(slider.dataset.band);
        const gain = parseFloat(slider.value);
        el.querySelector(`#eq-gain-${idx}`).textContent =
            (gain >= 0 ? '+' : '') + gain.toFixed(1);
        eqInstance?.setBandGain(idx, gain);
        drawCurve();
    });

    // ── Preset buttons ────────────────────────────────────────────────────
    el.querySelector('#eq-presets').addEventListener('click', e => {
        const btn = e.target.closest('.eq-preset-btn');
        if (!btn) return;
        el.querySelectorAll('.eq-preset-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const preset = EQ_PRESETS.find(p => p.id === btn.dataset.preset);
        if (!preset) return;

        preset.gains.forEach((g, i) => {
            const slider = el.querySelector(`#eq-slider-${i}`);
            const label = el.querySelector(`#eq-gain-${i}`);
            if (slider) slider.value = g;
            if (label) label.textContent = (g >= 0 ? '+' : '') + g.toFixed(1);
            eqInstance?.setBandGain(i, g);
        });
        drawCurve();
    });

    // ── Bypass toggle ─────────────────────────────────────────────────────
    const bypassChk = el.querySelector('#eq-bypass');
    const thumbEl = el.querySelector('.toggle-thumb-eq');
    const trackEl = el.querySelector('.toggle-track-eq');

    trackEl.addEventListener('click', () => {
        bypassChk.checked = !bypassChk.checked;
        const on = bypassChk.checked;
        thumbEl.style.left = on ? '19px' : '3px';
        trackEl.style.background = on ? '#ff4444' : 'rgba(255,255,255,0.08)';
        eqInstance?.setBypass(on);
    });

    // ── Reset ─────────────────────────────────────────────────────────────
    el.querySelector('#eq-reset').addEventListener('click', () => {
        EQ_BANDS.forEach((_, i) => {
            const slider = el.querySelector(`#eq-slider-${i}`);
            const label = el.querySelector(`#eq-gain-${i}`);
            if (slider) slider.value = 0;
            if (label) label.textContent = '0';
            eqInstance?.setBandGain(i, 0);
        });
        el.querySelectorAll('.eq-preset-btn').forEach(b =>
            b.classList.toggle('active', b.dataset.preset === 'flat'));
        drawCurve();
    });

    return el;
}
