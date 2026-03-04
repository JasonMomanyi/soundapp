import { state } from '../state/state.js';
import { engine } from '../audio/engine.js';

const PLAY_ICON = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>`;
const STOP_ICON = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16"/></svg>`;
const PAUSE_ICON = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="4" width="4" height="16"/><rect x="15" y="4" width="4" height="16"/></svg>`;
const REC_ICON = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="8"/></svg>`;
const SKIP_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,4 15,12 5,20"/><rect x="15" y="4" width="2" height="16"/></svg>`;

export function createTransport() {
  const el = document.createElement('div');
  el.className = 'transport-bar flex items-center gap-3 px-4 py-2 z-30';
  el.style.cssText = 'height:64px; flex-shrink:0;';

  el.innerHTML = `
    <!-- LOGO -->
    <div class="flex items-center gap-2 mr-2 select-none">
      <div class="w-8 h-8 rounded-lg flex items-center justify-center"
           style="background: linear-gradient(135deg, #00FFFF 0%, #FF00FF 100%);">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
          <path d="M9 18V5l12-2v13M9 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm12 0c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2-.9 2 2z"/>
        </svg>
      </div>
      <span class="font-bold text-sm tracking-wider" style="color:#00FFFF; text-shadow: 0 0 10px rgba(0,255,255,0.5)">
        SOUND<span style="color:#FF00FF">APP</span>
      </span>
    </div>

    <!-- Transport buttons -->
    <div class="flex items-center gap-2">
      <button id="btn-stop"  class="transport-btn" title="Stop (Space)">
        ${STOP_ICON}
      </button>
      <button id="btn-play"  class="transport-btn" title="Play (Space)">
        ${PLAY_ICON}
      </button>
      <button id="btn-rec"   class="transport-btn record" title="Record">
        ${REC_ICON}
      </button>
    </div>

    <!-- BPM -->
    <div class="flex items-center gap-2 ml-1">
      <div class="flex flex-col items-center">
        <label class="text-xs font-mono mb-1" style="color: rgba(255,255,255,0.3); font-size:0.6rem; letter-spacing:0.1em">BPM</label>
        <div class="flex items-center gap-1">
          <button id="bpm-dec" class="btn-icon" style="width:20px;height:20px;font-size:1rem">−</button>
          <input id="bpm-input" type="number" min="40" max="240" value="120"
            class="transport-bpm-input font-mono text-center font-bold focus:outline-none rounded-md px-2 py-1"
            style="width:58px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08);
                   color:#00FFFF; font-size:1.1rem; -moz-appearance:textfield; appearance:textfield"/>
          <button id="bpm-inc" class="btn-icon" style="width:20px;height:20px;font-size:1rem">+</button>
        </div>
      </div>
      <button id="tap-btn" class="btn-neon transport-full-row" style="font-size:0.65rem; padding:6px 10px" title="Tap for BPM">TAP</button>
    </div>

    <!-- Separator (desktop only) -->
    <div class="transport-full-row" style="width:1px; height:36px; background:rgba(255,255,255,0.06)"></div>

    <!-- Swing (desktop only) -->
    <div class="transport-full-row flex flex-col items-center" style="min-width: 96px">
      <label class="text-xs mb-1" style="color:rgba(255,255,255,0.3); font-size:0.6rem; letter-spacing:0.1em">SWING</label>
      <input id="swing-slider" type="range" min="0" max="100" value="0" style="width:88px"/>
    </div>

    <!-- Separator (desktop only) -->
    <div class="transport-full-row" style="width:1px; height:36px; background:rgba(255,255,255,0.06)"></div>

    <!-- Master Volume -->
    <div class="flex flex-col items-center" style="min-width: 100px">
      <label class="text-xs mb-1" style="color:rgba(255,255,255,0.3); font-size:0.6rem; letter-spacing:0.1em">MASTER</label>
      <input id="master-vol" type="range" min="0" max="100" value="80" style="width:90px"/>
    </div>

    <!-- Step indicator (desktop only) -->
    <div class="transport-full-row ml-auto flex items-center gap-2">
      <div id="step-indicators" class="flex gap-1">
        ${[...Array(16)].map((_, i) => `
          <div class="step-indicator rounded-sm transition-all"
               style="width:10px;height:10px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06)"
               data-step="${i}"></div>`).join('')}
      </div>
    </div>

    <!-- Mobile only: spacer to push Vol to right -->
    <div class="transport-mobile-row flex-1" style="display:none"></div>
  `;

  // swing-slider may not exist on mobile (it's visible but wrapped)
  // Ensure we also handle its absence gracefully in _bindTransportEvents

  _bindTransportEvents(el);
  _bindStateTransport(el);
  return el;
}

function _bindTransportEvents(el) {
  const playBtn = el.querySelector('#btn-play');
  const stopBtn = el.querySelector('#btn-stop');
  const bpmInput = el.querySelector('#bpm-input');
  const bpmDec = el.querySelector('#bpm-dec');
  const bpmInc = el.querySelector('#bpm-inc');
  const tapBtn = el.querySelector('#tap-btn');
  const swingSlider = el.querySelector('#swing-slider');
  const masterVol = el.querySelector('#master-vol');

  playBtn.addEventListener('click', async () => {
    const s = state.get();
    if (s.isPlaying) {
      engine.stop();
    } else {
      await engine.start();
    }
  });

  stopBtn.addEventListener('click', () => engine.stop());

  bpmInput.addEventListener('change', () => {
    const v = parseInt(bpmInput.value, 10);
    if (!isNaN(v)) state.setBpm(v);
  });
  bpmDec.addEventListener('click', () => state.setBpm(state.get().bpm - 1));
  bpmInc.addEventListener('click', () => state.setBpm(state.get().bpm + 1));

  // Tap tempo
  let tapTimes = [];
  tapBtn.addEventListener('click', () => {
    const now = performance.now();
    tapTimes.push(now);
    if (tapTimes.length > 8) tapTimes.shift();
    if (tapTimes.length >= 2) {
      const intervals = tapTimes.slice(1).map((t, i) => t - tapTimes[i]);
      const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const bpm = Math.round(60000 / avg);
      state.setBpm(bpm);
    }
    // Reset tap buffer after 3s idle
    clearTimeout(tapBtn._resetTimer);
    tapBtn._resetTimer = setTimeout(() => { tapTimes = []; }, 3000);
  });

  swingSlider.addEventListener('input', () => {
    state.setSwing(parseInt(swingSlider.value) / 100);
  });

  masterVol.addEventListener('input', () => {
    state.setMasterVolume(parseInt(masterVol.value) / 100);
  });

  // Space = play/stop
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT') return;
    if (e.code === 'Space') {
      e.preventDefault();
      if (state.get().isPlaying) engine.stop();
      else engine.start();
    }
  });
}

function _bindStateTransport(el) {
  const playBtn = el.querySelector('#btn-play');
  const bpmInput = el.querySelector('#bpm-input');
  const dots = el.querySelectorAll('.step-indicator');

  state.on('playing', playing => {
    if (playing) {
      playBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="4" width="4" height="16"/><rect x="15" y="4" width="4" height="16"/></svg>`;
      playBtn.classList.add('active');
    } else {
      playBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>`;
      playBtn.classList.remove('active');
    }
  });

  state.on('bpm', bpm => { bpmInput.value = bpm; });

  let prevStep = -1;
  state.on('step', step => {
    if (prevStep >= 0 && dots[prevStep]) {
      dots[prevStep].style.background = 'rgba(255,255,255,0.04)';
      dots[prevStep].style.boxShadow = '';
    }
    if (step >= 0 && dots[step]) {
      dots[step].style.background = 'var(--neon-cyan)';
      dots[step].style.boxShadow = '0 0 6px rgba(0,255,255,0.5)';
    }
    prevStep = step;
  });
}
