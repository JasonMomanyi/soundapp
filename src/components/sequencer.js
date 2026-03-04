import { state, TRACKS, STEP_COUNT } from '../state/state.js';

const CLEAR_ICON = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6m4-6v6"/></svg>`;
const RAND_ICON = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l5.1 5.1M4 4l5 5"/></svg>`;

export function createSequencer() {
    const el = document.createElement('div');
    el.className = 'flex flex-col gap-2 p-4';
    el.style.overflowY = 'auto';

    // Build header
    const header = document.createElement('div');
    header.className = 'flex items-center justify-between mb-1';
    header.innerHTML = `
    <h2 class="text-sm font-semibold tracking-wider uppercase"
        style="color:rgba(255,255,255,0.35); letter-spacing:0.1em">Step Sequencer</h2>
    <div class="flex gap-2">
      <button id="seq-clear-all" class="btn-neon" style="font-size:0.65rem; padding:5px 12px">Clear All</button>
      <button id="seq-randomize" class="btn-neon" style="font-size:0.65rem; padding:5px 12px; border-color:rgba(255,0,255,0.2); color:#FF00FF; background:rgba(255,0,255,0.04)">Randomize</button>
    </div>
  `;
    el.appendChild(header);

    // Beat marker row
    const markerRow = document.createElement('div');
    markerRow.className = 'flex items-center gap-1 mb-1';
    markerRow.innerHTML = `
    <div style="width: 80px"></div>
    <div class="flex gap-1 flex-1">
      ${[...Array(STEP_COUNT)].map((_, i) => `
        <div class="flex-1 text-center font-mono"
             style="font-size:0.55rem; color:${i % 4 === 0 ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'}">
          ${i % 4 === 0 ? (i / 4 + 1) : '·'}
        </div>
      `).join('')}
    </div>
    <div style="width: 60px"></div>
  `;
    el.appendChild(markerRow);

    // Track rows
    const trackRows = TRACKS.map((track, trackIdx) => {
        const row = document.createElement('div');
        row.className = 'flex items-center gap-1';
        row.dataset.track = trackIdx;

        // Track label
        const label = document.createElement('div');
        label.style.cssText = `width:80px; display:flex; align-items:center; gap:6px; flex-shrink:0`;
        label.innerHTML = `
      <div class="w-2 h-2 rounded-full flex-shrink-0" style="background:${track.color}; box-shadow: 0 0 6px ${track.color}55"></div>
      <span class="text-xs font-medium truncate" style="color:rgba(255,255,255,0.6)">${track.name}</span>
    `;

        // Steps
        const steps = document.createElement('div');
        steps.className = 'flex gap-1 flex-1';
        steps.style.display = 'grid';
        steps.style.gridTemplateColumns = `repeat(${STEP_COUNT}, 1fr)`;
        steps.style.gap = '4px';

        for (let s = 0; s < STEP_COUNT; s++) {
            const btn = document.createElement('button');
            btn.className = `seq-step${s % 4 === 0 ? ' beat-marker' : ''}`;
            btn.dataset.track = trackIdx;
            btn.dataset.step = s;
            btn.title = `${track.name} Step ${s + 1}`;

            btn.addEventListener('click', () => {
                state.toggleStep(trackIdx, s);
            });

            // Right-click to randomize single track
            btn.addEventListener('contextmenu', e => {
                e.preventDefault();
                state.randomizeTrack(trackIdx);
            });

            steps.appendChild(btn);
        }

        // Track action buttons
        const actions = document.createElement('div');
        actions.style.cssText = 'width:60px; display:flex; gap:4px; align-items:center; flex-shrink:0';
        actions.innerHTML = `
      <button class="btn-icon track-clear" data-track="${trackIdx}" title="Clear track">${CLEAR_ICON}</button>
      <button class="btn-icon track-rand"  data-track="${trackIdx}" title="Randomize track">${RAND_ICON}</button>
    `;

        row.appendChild(label);
        row.appendChild(steps);
        row.appendChild(actions);
        return { row, steps };
    });

    trackRows.forEach(({ row }) => el.appendChild(row));

    // Action buttons bindings
    el.querySelector('#seq-clear-all').addEventListener('click', () => state.clearAll());
    el.querySelector('#seq-randomize').addEventListener('click', () => {
        TRACKS.forEach((_, i) => {
            if (Math.random() > 0.4) state.randomizeTrack(i);
        });
    });

    el.addEventListener('click', e => {
        const btn = e.target.closest('.track-clear');
        if (btn) state.clearTrack(parseInt(btn.dataset.track));
        const rbtn = e.target.closest('.track-rand');
        if (rbtn) state.randomizeTrack(parseInt(rbtn.dataset.track));
    });

    // State listeners
    const { grid } = state.get();
    _syncGrid(el, grid);

    state.on('grid', ({ trackIdx, stepIdx, value }) => {
        const btn = el.querySelector(`.seq-step[data-track="${trackIdx}"][data-step="${stepIdx}"]`);
        if (btn) btn.classList.toggle('active', value);
    });

    state.on('grid-full', grid => _syncGrid(el, grid));

    // Highlight current step column during playback
    let prevStep = -1;
    state.on('step', step => {
        // Remove previous highlight
        el.querySelectorAll(`.seq-step[data-step="${prevStep}"]`).forEach(b => b.classList.remove('playing'));
        // Add new highlight
        if (step >= 0) {
            el.querySelectorAll(`.seq-step[data-step="${step}"]`).forEach(b => {
                if (b.classList.contains('active')) b.classList.add('playing');
            });
        }
        prevStep = step;
    });

    return el;
}

function _syncGrid(el, grid) {
    grid.forEach((row, trackIdx) => {
        row.forEach((active, stepIdx) => {
            const btn = el.querySelector(`.seq-step[data-track="${trackIdx}"][data-step="${stepIdx}"]`);
            if (btn) btn.classList.toggle('active', active);
        });
    });
}
