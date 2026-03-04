import { samplePlayer, DRUM_KITS } from '../audio/sampler.js';
import { EQ_BANDS, EQ_PRESETS, createEqualizer } from '../audio/equalizer.js';
import { eq } from '../audio/engine.js';
import * as Tone from 'tone';

const SAMPLE_LABELS = {
  kick: { name: 'Kick', color: '#ff6b6b', icon: '🥁' },
  kick2: { name: 'Kick 2', color: '#ff8c8c', icon: '🥁' },
  snare: { name: 'Snare', color: '#ffa94d', icon: '🎯' },
  snare2: { name: 'Snare 2', color: '#ffc47c', icon: '🎯' },
  hihat: { name: 'Hi-Hat', color: '#ffd43b', icon: '🔔' },
  open_hat: { name: 'Open Hat', color: '#ffe880', icon: '🔔' },
  clap: { name: 'Clap', color: '#69db7c', icon: '👏' },
  tom_high: { name: 'Tom Hi', color: '#74c0fc', icon: '🥁' },
  tom_mid: { name: 'Tom Mid', color: '#5aa8e8', icon: '🥁' },
  tom_low: { name: 'Tom Low', color: '#4090d0', icon: '🥁' },
  rim: { name: 'Rim', color: '#b197fc', icon: '⭕' },
  cowbell: { name: 'Cowbell', color: '#da77f2', icon: '🐄' },
  bass_hit: { name: 'Bass Hit', color: '#f783ac', icon: '🎸' },
  bass_hit2: { name: 'Bass Hit 2', color: '#e864a0', icon: '🎸' },
  crash: { name: 'Crash', color: '#00FFFF', icon: '💥' },
  shaker: { name: 'Shaker', color: '#a9e34b', icon: '🎵' },
};

export function createSampleBrowser() {
  const el = document.createElement('div');
  el.className = 'flex flex-col h-full overflow-hidden';

  el.innerHTML = `
    <div class="flex flex-col gap-4 p-4 overflow-y-auto flex-1">

      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-sm font-semibold tracking-wider uppercase"
              style="color:rgba(255,255,255,0.35); letter-spacing:0.1em">Sample Library</h2>
          <p class="text-xs mt-0.5" style="color:rgba(255,255,255,0.2)">
            16 synthesized drum samples · click any pad to preview
          </p>
        </div>
        <div id="sample-status" class="text-xs font-mono px-3 py-1 rounded-full"
             style="background:rgba(0,255,255,0.08); border:1px solid rgba(0,255,255,0.15); color:#00FFFF">
          Loading…
        </div>
      </div>

      <!-- Drum Kit selector -->
      <div class="flex gap-2">
        ${DRUM_KITS.map((kit, i) => `
          <button class="kit-btn tab-btn ${i === 0 ? 'active' : ''}" data-kit="${i}">
            ${kit.name}
          </button>
        `).join('')}
      </div>

      <!-- Sample Pad Grid -->
      <div id="pad-grid" class="grid gap-3" style="grid-template-columns: repeat(4, 1fr)"></div>

      <!-- All Samples Library -->
      <div>
        <p class="text-xs font-semibold mb-2" style="color:rgba(255,255,255,0.25); letter-spacing:0.08em; text-transform:uppercase">
          Full Sample Library
        </p>
        <div id="sample-grid" class="grid gap-2" style="grid-template-columns: repeat(auto-fill, minmax(130px,1fr))"></div>
      </div>

      <!-- Equalizer section -->
      <div class="mt-2">
        <div class="flex items-center gap-2 mb-3">
          <div class="w-2 h-2 rounded-full" style="background:#00FFFF; box-shadow:0 0 6px #00FFFF"></div>
          <h3 class="text-sm font-semibold tracking-wider uppercase"
              style="color:rgba(255,255,255,0.5); letter-spacing:0.1em">8-Band Equalizer</h3>
        </div>
        <div id="eq-container"></div>
      </div>

    </div>
  `;

  // ── Status indicator ────────────────────────────────────────────────────
  const statusEl = el.querySelector('#sample-status');
  function updateStatus() {
    if (samplePlayer.isLoaded()) {
      statusEl.textContent = '✓ Ready';
      statusEl.style.color = '#69db7c';
      statusEl.style.borderColor = 'rgba(105,219,124,0.3)';
      statusEl.style.background = 'rgba(105,219,124,0.08)';
    } else {
      statusEl.textContent = 'Loading…';
      setTimeout(updateStatus, 500);
    }
  }
  setTimeout(updateStatus, 300);

  // ── Pad grid ────────────────────────────────────────────────────────────
  const padGrid = el.querySelector('#pad-grid');
  let activeKit = DRUM_KITS[0];

  function renderPads(kit) {
    padGrid.innerHTML = '';
    const trackEntries = Object.entries(kit.tracks);
    trackEntries.forEach(([role, sampleName]) => {
      const meta = SAMPLE_LABELS[sampleName] || { name: sampleName, color: '#fff', icon: '♪' };
      const pad = document.createElement('button');
      pad.className = 'pad-btn flex flex-col items-center justify-center gap-1 rounded-xl transition-all';
      pad.dataset.sample = sampleName;
      pad.style.cssText = `
        aspect-ratio:1; width:100%;
        background: ${meta.color}12; 
        border: 1px solid ${meta.color}25;
        color: ${meta.color};
        cursor: pointer;
        position: relative;
        overflow: hidden;
      `;
      pad.innerHTML = `
        <div style="font-size:1.3rem; line-height:1">${meta.icon}</div>
        <div style="font-size:0.65rem; font-weight:600; font-family:monospace">${meta.name}</div>
        <div style="font-size:0.5rem; color:rgba(255,255,255,0.25);">${role}</div>
        <!-- flash overlay -->
        <div class="pad-flash" style="position:absolute;inset:0;background:${meta.color};opacity:0;border-radius:inherit;transition:opacity 0.05s ease;pointer-events:none"></div>
      `;

      pad.addEventListener('mousedown', async () => {
        await Tone.start();
        // Flash animation
        const flash = pad.querySelector('.pad-flash');
        flash.style.opacity = '0.3';
        setTimeout(() => { flash.style.opacity = '0'; }, 100);
        // Trigger sample
        samplePlayer.trigger(sampleName);
      });

      padGrid.appendChild(pad);
    });
  }
  renderPads(activeKit);

  // Kit switcher
  el.querySelectorAll('.kit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      el.querySelectorAll('.kit-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeKit = DRUM_KITS[parseInt(btn.dataset.kit)];
      renderPads(activeKit);
    });
  });

  // ── Full sample library ─────────────────────────────────────────────────
  const sampleGrid = el.querySelector('#sample-grid');
  Object.entries(SAMPLE_LABELS).forEach(([name, meta]) => {
    const chip = document.createElement('button');
    chip.className = 'flex items-center gap-2 px-3 py-2 rounded-lg transition-all';
    chip.style.cssText = `
      background:${meta.color}0d; border:1px solid ${meta.color}20; color:${meta.color};
      cursor:pointer; font-size:0.7rem; font-weight:500; text-align:left;
    `;
    chip.innerHTML = `
      <span>${meta.icon}</span>
      <span>${meta.name}</span>
      <span class="ml-auto" style="font-family:monospace; font-size:0.55rem; color:rgba(255,255,255,0.2)">.wav</span>
    `;
    chip.addEventListener('click', async () => {
      await Tone.start();
      chip.style.background = `${meta.color}25`;
      samplePlayer.trigger(name);
      setTimeout(() => { chip.style.background = `${meta.color}0d`; }, 200);
    });
    sampleGrid.appendChild(chip);
  });

  // ── Equalizer ───────────────────────────────────────────────────────────
  const eqEl = createEqualizer(eq);
  el.querySelector('#eq-container').appendChild(eqEl);

  return el;
}
