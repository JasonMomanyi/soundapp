import { engine } from '../audio/engine.js';
import { KEYBOARD_NOTES, KEY_MAP } from '../audio/presets.js';
import { state } from '../state/state.js';

// Which notes are black keys
const BLACK_KEYS = new Set(['C#', 'D#', 'F#', 'G#', 'A#']);
function isBlack(note) { return BLACK_KEYS.has(note.replace(/\d/g, '')); }

export function createKeyboard() {
    const el = document.createElement('div');
    el.className = 'flex flex-col gap-4 p-4';

    el.innerHTML = `
    <div class="flex items-center justify-between mb-1">
      <h2 class="text-sm font-semibold tracking-wider uppercase"
          style="color:rgba(255,255,255,0.35); letter-spacing:0.1em">Keyboard</h2>
      <div class="flex items-center gap-3">
        <label style="font-size:0.7rem; color:rgba(255,255,255,0.3)">Instrument</label>
        <select id="kb-instrument" class="font-mono text-sm focus:outline-none rounded-md px-2 py-1"
          style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); color:#00FFFF; font-size:0.75rem">
          <option value="lead">Lead Synth</option>
          <option value="pad">Pad</option>
          <option value="bass">Bass</option>
          <option value="synth">Synth</option>
        </select>
        <label style="font-size:0.7rem; color:rgba(255,255,255,0.3)">Octave</label>
        <div class="flex items-center gap-1">
          <button id="oct-down" class="btn-icon" style="width:24px;height:24px">−</button>
          <span id="octave-display" class="font-mono" style="font-size:0.8rem; color:#00FFFF; min-width:12px; text-align:center">4</span>
          <button id="oct-up"   class="btn-icon" style="width:24px;height:24px">+</button>
        </div>
      </div>
    </div>

    <!-- Keyboard hint -->
    <div class="flex items-center gap-2 mb-2" style="font-size:0.65rem; color:rgba(255,255,255,0.25)">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-4 0v2M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01"/>
      </svg>
      Computer keys: A W S E D F T G Y H U J K O L P
    </div>

    <!-- Piano keys container -->
    <div class="glass-panel p-4 flex-1" style="overflow-x:auto">
      <div id="piano-wrap" class="relative flex" style="height:140px; min-width: 600px; user-select:none"></div>
    </div>

    <!-- Active notes display -->
    <div id="note-display" class="flex gap-2 flex-wrap mt-1" style="min-height:28px"></div>
  `;

    const piano = el.querySelector('#piano-wrap');
    const noteDisp = el.querySelector('#note-display');
    const kbSel = el.querySelector('#kb-instrument');
    const octDown = el.querySelector('#oct-down');
    const octUp = el.querySelector('#oct-up');
    const octDisp = el.querySelector('#octave-display');

    let octave = 4;
    let activeInstrument = 'lead';
    const activeNotes = new Set();

    // Build piano keys
    const WHITE_NOTES = KEYBOARD_NOTES.filter(n => !isBlack(n));
    const whiteW = 100 / WHITE_NOTES.length;  // percent

    // Map note name (without octave) to black key offset
    const BLACK_OFFSETS = { 'C#': 0.65, 'D#': 1.65, 'F#': 3.65, 'G#': 4.65, 'A#': 5.65 };

    // White keys
    WHITE_NOTES.forEach((note, i) => {
        const key = document.createElement('div');
        key.className = 'piano-key white';
        key.dataset.note = note;
        key.style.cssText = `
      position: absolute;
      left: ${i * whiteW}%;
      width: calc(${whiteW}% - 2px);
      height: 100%;
      margin-right: 2px;
    `;
        const noteName = note.replace(/\d/, '');
        const label = document.createElement('div');
        label.style.cssText = 'position:absolute; bottom:8px; left:0; right:0; text-align:center; font-size:0.6rem; color:rgba(0,0,0,0.3); font-family:monospace';
        label.textContent = noteName;
        key.appendChild(label);
        piano.appendChild(key);
    });

    // Black keys overlay
    // Group by octave
    const octaves = [4, 5];
    octaves.forEach((oct, oi) => {
        ['C#', 'D#', 'F#', 'G#', 'A#'].forEach(name => {
            const note = `${name}${oct}`;
            if (!KEYBOARD_NOTES.includes(note)) return;
            const baseNote = name.replace('#', '');
            const baseWhiteIdx = WHITE_NOTES.findIndex(n => n.startsWith(baseNote) && parseInt(n.slice(-1)) === oct);
            if (baseWhiteIdx < 0) return;
            const key = document.createElement('div');
            key.className = 'piano-key black';
            key.dataset.note = note;
            key.style.cssText = `
        width: calc(${whiteW * 0.6}% - 2px);
        height: 60%;
        left: calc(${(baseWhiteIdx + 0.7) * whiteW}% );
        top: 0;
      `;
            piano.appendChild(key);
        });
    });

    // Add computer key labels to matching keys
    Object.entries(KEY_MAP).forEach(([k, note]) => {
        const el2 = piano.querySelector(`[data-note="${note}"]`);
        if (!el2) return;
        const lbl = document.createElement('div');
        lbl.style.cssText = `
      position:absolute; top:8px; left:0; right:0; text-align:center;
      font-size:0.55rem; font-family:monospace; font-weight:700;
      color:${el2.classList.contains('black') ? 'rgba(0,255,255,0.6)' : 'rgba(0,0,0,0.35)'};
      pointer-events:none;
    `;
        lbl.textContent = k.toUpperCase();
        el2.appendChild(lbl);
    });

    // ── Interaction ────────────────────────────────────
    function noteOn(note) {
        if (activeNotes.has(note)) return;
        activeNotes.add(note);
        piano.querySelector(`[data-note="${note}"]`)?.classList.add('pressed');
        engine.playNote(note, activeInstrument);
        updateNoteDisplay();
    }

    function noteOff(note) {
        activeNotes.delete(note);
        piano.querySelector(`[data-note="${note}"]`)?.classList.remove('pressed');
        engine.releaseNote(note, activeInstrument);
        updateNoteDisplay();
    }

    function updateNoteDisplay() {
        noteDisp.innerHTML = [...activeNotes].map(n => `
      <span class="px-2 py-1 rounded font-mono font-bold text-xs"
            style="background:rgba(0,255,255,0.1); border:1px solid rgba(0,255,255,0.2); color:#00FFFF">
        ${n}
      </span>
    `).join('') || '';
    }

    // Mouse / touch events
    piano.addEventListener('mousedown', e => {
        const key = e.target.closest('.piano-key');
        if (key) noteOn(key.dataset.note);
    });
    piano.addEventListener('mouseenter', e => {
        if (e.buttons !== 1) return;
        const key = e.target.closest('.piano-key');
        if (key) noteOn(key.dataset.note);
    }, true);
    document.addEventListener('mouseup', () => {
        [...activeNotes].forEach(n => noteOff(n));
    });

    // Keyboard events
    document.addEventListener('keydown', e => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
        if (e.repeat) return;
        const note = KEY_MAP[e.key.toLowerCase()];
        if (note) {
            const adjustedNote = note.replace(/\d/, String(octave));
            noteOn(adjustedNote);
        }
    });
    document.addEventListener('keyup', e => {
        const note = KEY_MAP[e.key.toLowerCase()];
        if (note) {
            const adjustedNote = note.replace(/\d/, String(octave));
            noteOff(adjustedNote);
        }
    });

    // Instrument selector
    kbSel.addEventListener('change', () => { activeInstrument = kbSel.value; });

    // Octave controls
    octDown.addEventListener('click', () => {
        octave = Math.max(1, octave - 1);
        octDisp.textContent = octave;
    });
    octUp.addEventListener('click', () => {
        octave = Math.min(7, octave + 1);
        octDisp.textContent = octave;
    });

    return el;
}
