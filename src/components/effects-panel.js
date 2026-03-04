import { state } from '../state/state.js';

const EFFECTS = [
    {
        key: 'reverb', label: 'Reverb', color: '#b197fc',
        params: [
            { key: 'wet', label: 'Wet', min: 0, max: 1, step: 0.01, default: 0.3 },
            { key: 'decay', label: 'Decay', min: 0.1, max: 10, step: 0.1, default: 2.0 },
        ]
    },
    {
        key: 'delay', label: 'Delay', color: '#74c0fc',
        params: [
            { key: 'wet', label: 'Wet', min: 0, max: 1, step: 0.01, default: 0.3 },
            { key: 'feedback', label: 'Feedback', min: 0, max: 0.95, step: 0.01, default: 0.4 },
        ]
    },
    {
        key: 'distortion', label: 'Distortion', color: '#ff6b6b',
        params: [
            { key: 'wet', label: 'Wet', min: 0, max: 1, step: 0.01, default: 0.5 },
            { key: 'amount', label: 'Amount', min: 0, max: 1, step: 0.01, default: 0.4 },
        ]
    },
    {
        key: 'filter', label: 'Filter', color: '#69db7c',
        params: [
            { key: 'frequency', label: 'Freq (Hz)', min: 20, max: 20000, step: 10, default: 2000 },
            { key: 'Q', label: 'Q', min: 0.1, max: 20, step: 0.1, default: 1 },
        ]
    },
    {
        key: 'chorus', label: 'Chorus', color: '#ffa94d',
        params: [
            { key: 'wet', label: 'Wet', min: 0, max: 1, step: 0.01, default: 0.5 },
            { key: 'depth', label: 'Depth', min: 0, max: 1, step: 0.01, default: 0.7 },
        ]
    },
];

export function createEffectsPanel() {
    const el = document.createElement('div');
    el.className = 'flex flex-col gap-4 p-4';
    el.style.overflowY = 'auto';

    el.innerHTML = `
    <h2 class="text-sm font-semibold tracking-wider uppercase"
        style="color:rgba(255,255,255,0.35); letter-spacing:0.1em">Effects</h2>
    <div id="effects-grid" class="grid gap-4" style="grid-template-columns: repeat(auto-fill, minmax(200px, 1fr))"></div>
  `;

    const grid = el.querySelector('#effects-grid');
    const { effects } = state.get();

    EFFECTS.forEach(fx => {
        const card = document.createElement('div');
        card.className = 'glass-panel-sm p-4 flex flex-col gap-3';
        card.dataset.effect = fx.key;

        card.innerHTML = `
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 rounded-full" style="background:${fx.color}; box-shadow:0 0 6px ${fx.color}66"></div>
          <span class="text-sm font-semibold" style="color:rgba(255,255,255,0.8)">${fx.label}</span>
        </div>
        <!-- Toggle switch -->
        <label class="toggle-switch" style="position:relative; width:36px; height:20px; cursor:pointer">
          <input type="checkbox" class="effect-toggle sr-only" data-effect-key="${fx.key}"
            ${effects[fx.key].enabled ? 'checked' : ''}/>
          <span class="toggle-track" style="
            position:absolute; inset:0; border-radius:10px;
            background: ${effects[fx.key].enabled ? fx.color : 'rgba(255,255,255,0.08)'};
            transition: background 0.2s ease;
          "></span>
          <span class="toggle-thumb" style="
            position:absolute; top:3px; left:${effects[fx.key].enabled ? '19px' : '3px'};
            width:14px; height:14px; border-radius:50%;
            background:white; transition: left 0.2s ease;
          "></span>
        </label>
      </div>

      <!-- Parameters -->
      <div class="flex flex-col gap-3 effect-params" style="opacity:${effects[fx.key].enabled ? '1' : '0.35'}">
        ${fx.params.map(p => `
          <div class="flex flex-col gap-1">
            <div class="flex justify-between items-center">
              <label style="font-size:0.65rem; color:rgba(255,255,255,0.4); letter-spacing:0.05em">${p.label}</label>
              <span class="font-mono effect-val" data-effect="${fx.key}" data-param="${p.key}"
                style="font-size:0.65rem; color:${fx.color}">
                ${effects[fx.key][p.key] ?? p.default}
              </span>
            </div>
            <input type="range" class="w-full effect-slider"
              data-effect="${fx.key}" data-param="${p.key}"
              min="${p.min}" max="${p.max}" step="${p.step}"
              value="${effects[fx.key][p.key] ?? p.default}"
              style="accent-color: ${fx.color}"/>
          </div>
        `).join('')}
      </div>
    `;

        // Colorize range slider thumb by setting accent-color on input
        card.querySelectorAll('.effect-slider').forEach(input => {
            input.style.setProperty('--thumb-color', fx.color);
        });

        grid.appendChild(card);
    });

    // ── Events ────────────────────────────────────────
    grid.addEventListener('change', e => {
        const toggle = e.target.closest('.effect-toggle');
        if (toggle) {
            const key = toggle.dataset.effectKey;
            state.toggleEffect(key);
        }
    });

    grid.addEventListener('input', e => {
        const slider = e.target.closest('.effect-slider');
        if (slider) {
            const effectKey = slider.dataset.effect;
            const paramKey = slider.dataset.param;
            const value = parseFloat(slider.value);
            state.setEffect(effectKey, paramKey, value);

            // Update label
            const valLabel = grid.querySelector(
                `.effect-val[data-effect="${effectKey}"][data-param="${paramKey}"]`
            );
            if (valLabel) valLabel.textContent = value.toFixed(2);
        }
    });

    // ── State sync ────────────────────────────────────
    state.on('effect', ({ effect, key, value }) => {
        const card = grid.querySelector(`[data-effect="${effect}"]`);
        if (!card) return;
        const fxMeta = EFFECTS.find(f => f.key === effect);

        if (key === 'enabled') {
            const track = card.querySelector('.toggle-track');
            const thumb = card.querySelector('.toggle-thumb');
            const params = card.querySelector('.effect-params');
            const checkbox = card.querySelector('.effect-toggle');
            if (track) track.style.background = value ? fxMeta.color : 'rgba(255,255,255,0.08)';
            if (thumb) thumb.style.left = value ? '19px' : '3px';
            if (params) params.style.opacity = value ? '1' : '0.35';
            if (checkbox) checkbox.checked = value;
        } else {
            const slider = card.querySelector(`.effect-slider[data-param="${key}"]`);
            const label = card.querySelector(`.effect-val[data-param="${key}"]`);
            if (slider) slider.value = value;
            if (label) label.textContent = parseFloat(value).toFixed(2);
        }
    });

    return el;
}
