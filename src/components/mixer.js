import { state, TRACKS } from '../state/state.js';

export function createMixer() {
    const el = document.createElement('div');
    el.className = 'flex flex-col gap-3 p-4';
    el.style.overflowY = 'auto';

    const header = document.createElement('div');
    header.innerHTML = `<h2 class="text-sm font-semibold tracking-wider uppercase mb-3"
    style="color:rgba(255,255,255,0.35); letter-spacing:0.1em">Mixer</h2>`;
    el.appendChild(header);

    const strip = document.createElement('div');
    strip.className = 'flex gap-3 overflow-x-auto pb-2';

    const { mixer } = state.get();

    TRACKS.forEach((track, i) => {
        const ch = document.createElement('div');
        ch.className = 'flex flex-col items-center gap-2 p-3 glass-panel-sm';
        ch.style.minWidth = '72px';
        ch.dataset.mixerTrack = i;

        ch.innerHTML = `
      <!-- Track color bar -->
      <div class="w-full h-1 rounded-full" style="background:${track.color}; box-shadow: 0 0 6px ${track.color}55"></div>

      <!-- Track name -->
      <span class="font-medium text-center w-full truncate" style="font-size:0.65rem; color:rgba(255,255,255,0.55)">${track.name}</span>

      <!-- VU Meter + Fader -->
      <div class="flex gap-2 items-end" style="height:120px">
        <!-- VU meter -->
        <div class="vu-meter" data-vu="${i}">
          <div class="vu-meter-fill" style="height: 0%"></div>
        </div>
        <!-- Fader -->
        <div class="relative flex items-center justify-center" style="writing-mode:vertical-lr; height:120px">
          <input type="range" class="mixer-fader" data-fader="${i}"
            min="0" max="100" value="${Math.round(mixer[i].volume * 100)}"
            style="width:6px; height:120px; writing-mode:vertical-lr; direction:rtl; cursor:pointer"
            title="Volume"/>
        </div>
      </div>

      <!-- Value readout -->
      <span class="font-mono text-center" data-vol-label="${i}"
        style="font-size:0.6rem; color:rgba(255,255,255,0.3)">${Math.round(mixer[i].volume * 100)}</span>

      <!-- Pan -->
      <div class="flex flex-col items-center w-full gap-1">
        <label style="font-size:0.55rem; color:rgba(255,255,255,0.25); letter-spacing:0.1em">PAN</label>
        <input type="range" class="pan-slider w-full" data-pan="${i}"
          min="-100" max="100" value="${Math.round(mixer[i].pan * 100)}"
          style="width:56px"/>
      </div>

      <!-- Mute / Solo -->
      <div class="flex gap-1">
        <button class="btn-mute ${mixer[i].muted ? 'active' : ''}" data-mute="${i}" title="Mute">M</button>
        <button class="btn-solo ${mixer[i].soloed ? 'active' : ''}" data-solo="${i}" title="Solo">S</button>
      </div>
    `;

        strip.appendChild(ch);
    });

    el.appendChild(strip);

    // ── Events ────────────────────────────────────────
    strip.addEventListener('input', e => {
        const fader = e.target.closest('.mixer-fader');
        const pan = e.target.closest('.pan-slider');
        if (fader) {
            const idx = parseInt(fader.dataset.fader);
            const vol = parseInt(fader.value) / 100;
            state.setTrackVolume(idx, vol);
        }
        if (pan) {
            const idx = parseInt(pan.dataset.pan);
            state.setTrackPan(idx, parseInt(pan.value) / 100);
        }
    });

    strip.addEventListener('click', e => {
        const muteBtn = e.target.closest('.btn-mute');
        const soloBtn = e.target.closest('.btn-solo');
        if (muteBtn) {
            const idx = parseInt(muteBtn.dataset.mute);
            state.toggleMute(idx);
        }
        if (soloBtn) {
            const idx = parseInt(soloBtn.dataset.solo);
            state.toggleSolo(idx);
        }
    });

    // ── State sync ────────────────────────────────────
    state.on('mixer', ({ trackIdx, prop, value }) => {
        const strip = el.querySelector(`[data-mixer-track="${trackIdx}"]`);
        if (!strip) return;
        if (prop === 'volume') {
            const fader = strip.querySelector('.mixer-fader');
            const label = strip.querySelector(`[data-vol-label="${trackIdx}"]`);
            if (fader) fader.value = Math.round(value * 100);
            if (label) label.textContent = Math.round(value * 100);
        }
        if (prop === 'muted') {
            strip.querySelector('.btn-mute')?.classList.toggle('active', value);
        }
        if (prop === 'soloed') {
            strip.querySelector('.btn-solo')?.classList.toggle('active', value);
        }
    });

    // ── VU meter animation ────────────────────────────
    // Fake VU metering: random bounce during playback for visual feedback
    function animateVU() {
        const playing = state.get().isPlaying;
        const { grid, currentStep, mixer } = state.get();
        TRACKS.forEach((_, i) => {
            const vuFill = el.querySelector(`[data-vu="${i}"] .vu-meter-fill`);
            if (!vuFill) return;
            const isMuted = mixer[i].muted;
            const anySoloed = mixer.some(m => m.soloed);
            const isSilent = isMuted || (anySoloed && !mixer[i].soloed);

            let level = 0;
            if (playing && !isSilent) {
                const stepOn = currentStep >= 0 && grid[i][currentStep];
                level = stepOn
                    ? 0.4 + Math.random() * 0.6
                    : Math.max(0, (parseFloat(vuFill.style.height) / 100) - 0.08);
            }
            vuFill.style.height = `${Math.round(level * 100)}%`;
        });
        requestAnimationFrame(animateVU);
    }
    animateVU();

    return el;
}
