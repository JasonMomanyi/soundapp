import { state } from '../state/state.js';
import { DRUM_PATTERNS } from '../audio/presets.js';

export function createPresetsPanel() {
    const el = document.createElement('div');
    el.className = 'flex flex-col gap-4 p-4';
    el.style.overflowY = 'auto';

    const savedPresets = _loadSavedPresets();

    el.innerHTML = `
    <div class="flex items-center justify-between mb-1">
      <h2 class="text-sm font-semibold tracking-wider uppercase"
          style="color:rgba(255,255,255,0.35); letter-spacing:0.1em">Presets</h2>
      <button id="save-preset-btn" class="btn-neon" style="font-size:0.65rem; padding:5px 12px">
        💾 Save Current
      </button>
    </div>

    <!-- Factory presets -->
    <div>
      <p class="text-xs mb-2 font-semibold" style="color:rgba(255,255,255,0.25); letter-spacing:0.08em; text-transform:uppercase">Factory Patterns</p>
      <div id="factory-presets" class="grid gap-2" style="grid-template-columns: repeat(auto-fill, minmax(160px, 1fr))"></div>
    </div>

    <!-- User presets -->
    <div id="user-presets-section" style="${savedPresets.length ? '' : 'display:none'}">
      <p class="text-xs mb-2 font-semibold" style="color:rgba(255,255,255,0.25); letter-spacing:0.08em; text-transform:uppercase">My Presets</p>
      <div id="user-presets" class="grid gap-2" style="grid-template-columns: repeat(auto-fill, minmax(160px, 1fr))"></div>
    </div>

    <!-- Save modal overlay -->
    <div id="save-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center" style="background:rgba(0,0,0,0.7); backdrop-filter:blur(4px)">
      <div class="glass-panel p-6 flex flex-col gap-4" style="width:320px">
        <h3 class="font-semibold text-base">Save Preset</h3>
        <input id="preset-name-input" type="text" placeholder="Preset name..."
          class="w-full px-3 py-2 rounded-lg font-medium focus:outline-none"
          style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:#fff; font-size:0.875rem"/>
        <div class="flex gap-2 justify-end">
          <button id="save-cancel" class="btn-icon" style="width:auto; padding:0 16px; height:36px; font-size:0.8rem">Cancel</button>
          <button id="save-confirm" class="btn-neon" style="font-size:0.8rem; padding:8px 16px">Save</button>
        </div>
      </div>
    </div>
  `;

    const factoryGrid = el.querySelector('#factory-presets');
    const userGrid = el.querySelector('#user-presets');
    const userSection = el.querySelector('#user-presets-section');
    const saveModal = el.querySelector('#save-modal');
    const nameInput = el.querySelector('#preset-name-input');

    // ── Factory presets ───────────────────────────────
    DRUM_PATTERNS.forEach(preset => {
        const card = _createPresetCard(preset.name, preset.category, 'factory');
        card.addEventListener('click', () => {
            _applyPreset(preset);
            el.querySelectorAll('.preset-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
        });
        factoryGrid.appendChild(card);
    });

    // ── User presets ──────────────────────────────────
    savedPresets.forEach(p => _addUserPresetCard(p, userGrid, userSection, el));

    // ── Save preset ───────────────────────────────────
    el.querySelector('#save-preset-btn').addEventListener('click', () => {
        saveModal.classList.remove('hidden');
        nameInput.value = '';
        nameInput.focus();
    });

    el.querySelector('#save-cancel').addEventListener('click', () => {
        saveModal.classList.add('hidden');
    });

    el.querySelector('#save-confirm').addEventListener('click', () => {
        const name = nameInput.value.trim();
        if (!name) return;
        const newPreset = {
            id: Date.now().toString(),
            name,
            category: 'Custom',
            bpm: state.get().bpm,
            grid: state.get().grid,
        };
        _savePreset(newPreset);
        _addUserPresetCard(newPreset, userGrid, userSection, el);
        saveModal.classList.add('hidden');
    });

    // Close modal on overlay click
    saveModal.addEventListener('click', e => {
        if (e.target === saveModal) saveModal.classList.add('hidden');
    });

    // Keyboard shortcut to save
    document.addEventListener('keydown', e => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            el.querySelector('#save-preset-btn').click();
        }
    });

    return el;
}

function _createPresetCard(name, category, type) {
    const card = document.createElement('div');
    card.className = `preset-card ${type}-preset`;
    const catColor = {
        'Drums': '#ffa94d', 'Electronic': '#74c0fc',
        'Hip-Hop': '#b197fc', 'Custom': '#69db7c',
    }[category] || '#00FFFF';

    card.innerHTML = `
    <div class="flex items-center gap-2 mb-1">
      <div class="w-1.5 h-1.5 rounded-full" style="background:${catColor}"></div>
      <span style="font-size:0.6rem; color:rgba(255,255,255,0.3); text-transform:uppercase; letter-spacing:0.08em">${category}</span>
    </div>
    <p class="font-semibold text-sm" style="color:rgba(255,255,255,0.85)">${name}</p>
  `;
    return card;
}

function _addUserPresetCard(preset, grid, section, rootEl) {
    section.style.display = '';
    const card = _createPresetCard(preset.name, preset.category, 'user');
    card.style.position = 'relative';

    // Delete button
    const del = document.createElement('button');
    del.className = 'btn-icon';
    del.style.cssText = 'position:absolute; top:6px; right:6px; width:20px; height:20px; font-size:0.7rem';
    del.textContent = '×';
    del.title = 'Delete preset';
    del.addEventListener('click', e => {
        e.stopPropagation();
        _deletePreset(preset.id);
        card.remove();
        if (grid.children.length === 0) section.style.display = 'none';
    });

    card.appendChild(del);
    card.addEventListener('click', () => {
        _applyPreset(preset);
        rootEl.querySelectorAll('.preset-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
    });
    grid.appendChild(card);
}

function _applyPreset(preset) {
    if (preset.bpm) state.setBpm(preset.bpm);
    if (preset.grid) state.setGrid(preset.grid);
    state.setActivePreset(preset.id);
}

// ── LocalStorage helpers ──────────────────────────
function _loadSavedPresets() {
    try { return JSON.parse(localStorage.getItem('soundapp_presets') || '[]'); }
    catch { return []; }
}

function _savePreset(preset) {
    const presets = _loadSavedPresets();
    presets.push(preset);
    localStorage.setItem('soundapp_presets', JSON.stringify(presets));
}

function _deletePreset(id) {
    const presets = _loadSavedPresets().filter(p => p.id !== id);
    localStorage.setItem('soundapp_presets', JSON.stringify(presets));
}
