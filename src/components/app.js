import { state } from '../state/state.js';
import { createTransport } from './transport.js';
import { createSequencer } from './sequencer.js';
import { createMixer } from './mixer.js';
import { createEffectsPanel } from './effects-panel.js';
import { createVisualizer } from './visualizer.js';
import { createKeyboard } from './keyboard.js';
import { createPresetsPanel } from './presets-panel.js';
import { createDemoPlayer } from './demo-player.js';

const PANELS = [
    { key: 'sequencer', label: '⊞ Sequencer', create: createSequencer },
    { key: 'keyboard', label: '♪ Keyboard', create: createKeyboard },
    { key: 'mixer', label: '⇅ Mixer', create: createMixer },
    { key: 'effects', label: '✦ Effects', create: createEffectsPanel },
    { key: 'presets', label: '◈ Presets', create: createPresetsPanel },
    { key: 'songs', label: '🎵 Songs', create: createDemoPlayer },
];

// Cache rendered panels so we don't re-create them on every tab switch
const panelCache = {};

export function createApp() {
    const root = document.createElement('div');
    root.id = 'app-shell';
    root.className = 'flex flex-col h-full';
    root.style.height = '100vh';

    // ── Header ───────────────────────────────────────
    const header = document.createElement('header');
    header.className = 'app-header flex items-center px-4 z-20 flex-shrink-0';
    header.style.height = '48px';

    const navTabs = PANELS.map(p => {
        const btn = document.createElement('button');
        btn.className = `nav-tab${p.key === state.get().activePanel ? ' active' : ''}`;
        btn.dataset.panel = p.key;
        btn.textContent = p.label;
        return btn;
    });

    const keyboardHint = document.createElement('div');
    keyboardHint.style.cssText = 'margin-left:auto; font-size:0.65rem; color:rgba(255,255,255,0.2); display:flex; align-items:center; gap:6px';
    keyboardHint.innerHTML = `
    <kbd style="padding:2px 6px; border-radius:4px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08); font-family:monospace">Space</kbd>
    Play / Stop
    <kbd style="padding:2px 6px; border-radius:4px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08); font-family:monospace">Ctrl+S</kbd>
    Save Preset
  `;

    navTabs.forEach(btn => header.appendChild(btn));
    header.appendChild(keyboardHint);

    // ── Main content area ─────────────────────────────
    const main = document.createElement('main');
    main.className = 'flex flex-1 overflow-hidden gap-0';
    main.style.minHeight = '0';

    // Left: panels (all but visualizer)
    const panelArea = document.createElement('div');
    panelArea.className = 'flex-1 overflow-hidden relative';
    panelArea.style.minWidth = '0';

    // Right: always-visible visualizer sidebar
    const vizSidebar = document.createElement('aside');
    vizSidebar.style.cssText = `
    width: 260px;
    flex-shrink: 0;
    border-left: 1px solid rgba(255,255,255,0.04);
    background: rgba(15,13,26,0.5);
    display: flex;
    flex-direction: column;
  `;
    const vizComponent = createVisualizer();
    vizComponent.style.flex = '1';
    vizSidebar.appendChild(vizComponent);

    // ── Transport ─────────────────────────────────────
    const transport = createTransport();

    // ── Assembly ──────────────────────────────────────
    root.appendChild(header);
    main.appendChild(panelArea);
    main.appendChild(vizSidebar);
    root.appendChild(main);
    root.appendChild(transport);

    // ── Panel switching ───────────────────────────────
    function showPanel(key) {
        if (!panelCache[key]) {
            const def = PANELS.find(p => p.key === key);
            if (!def) return;
            const panel = def.create();
            panel.style.cssText = 'height:100%; overflow:auto';
            panelCache[key] = panel;
        }

        // Remove current
        while (panelArea.firstChild) panelArea.removeChild(panelArea.firstChild);
        panelArea.appendChild(panelCache[key]);

        navTabs.forEach(btn => btn.classList.toggle('active', btn.dataset.panel === key));
        state.setActivePanel(key);
    }

    navTabs.forEach(btn => {
        btn.addEventListener('click', () => showPanel(btn.dataset.panel));
    });

    // Show initial panel
    showPanel(state.get().activePanel);

    // Keyboard shortcut: Tab to cycle panels
    document.addEventListener('keydown', e => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
        if (e.key === 'Tab') {
            e.preventDefault();
            const current = PANELS.findIndex(p => p.key === state.get().activePanel);
            const next = (current + (e.shiftKey ? -1 : 1) + PANELS.length) % PANELS.length;
            showPanel(PANELS[next].key);
        }
        // Number keys 1-6 to switch panels
        const num = parseInt(e.key);
        if (num >= 1 && num <= PANELS.length && !e.ctrlKey && !e.metaKey) {
            if (e.target.tagName !== 'INPUT') showPanel(PANELS[num - 1].key);
        }
    });

    return root;
}
