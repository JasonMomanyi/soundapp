import { state } from '../state/state.js';
import { createTransport } from './transport.js';
import { createSequencer } from './sequencer.js';
import { createMixer } from './mixer.js';
import { createEffectsPanel } from './effects-panel.js';
import { createVisualizer } from './visualizer.js';
import { createKeyboard } from './keyboard.js';
import { createPresetsPanel } from './presets-panel.js';
import { createDemoPlayer } from './demo-player.js';
import { createSampleBrowser } from './sample-browser.js';

const PANELS = [
    { key: 'sequencer', label: '⊞ Seq', create: createSequencer },
    { key: 'keyboard', label: '♪ Keys', create: createKeyboard },
    { key: 'mixer', label: '⇅ Mix', create: createMixer },
    { key: 'effects', label: '✦ FX', create: createEffectsPanel },
    { key: 'presets', label: '◈ Presets', create: createPresetsPanel },
    { key: 'songs', label: '🎵 Songs', create: createDemoPlayer },
    { key: 'samples', label: '🥁 Samples', create: createSampleBrowser },
];

const panelCache = {};

export function createApp() {
    const root = document.createElement('div');
    root.id = 'app-shell';
    root.className = 'flex flex-col h-full';
    root.style.height = '100dvh';

    // ── Header ─────────────────────────────────────────────────────────────────
    const header = document.createElement('header');
    header.className = 'app-header flex items-center z-20 flex-shrink-0';
    header.style.height = '48px';

    // Logo (hidden on ultra-small screens via CSS)
    const logo = document.createElement('div');
    logo.className = 'app-header-logo-text flex items-center gap-2 px-3 flex-shrink-0';
    logo.innerHTML = `
    <div style="width:8px;height:8px;border-radius:50%;background:var(--neon-cyan);box-shadow:0 0 8px var(--neon-cyan)"></div>
    <span style="font-size:0.75rem;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.5)">Studio</span>
  `;

    // Nav tabs row (scrollable on mobile)
    const tabsRow = document.createElement('nav');
    tabsRow.className = 'nav-tabs-row flex items-center flex-1 overflow-x-auto';
    tabsRow.style.gap = '1px';

    const navTabs = PANELS.map(p => {
        const btn = document.createElement('button');
        btn.className = `nav-tab${p.key === state.get().activePanel ? ' active' : ''}`;
        btn.dataset.panel = p.key;
        btn.textContent = p.label;
        return btn;
    });
    navTabs.forEach(btn => tabsRow.appendChild(btn));

    // Keyboard hint (desktop only — hidden on mobile via inline media)
    const keyboardHint = document.createElement('div');
    keyboardHint.className = 'app-header-logo-text'; // reuse hide-on-mobile class
    keyboardHint.style.cssText = 'flex-shrink:0; font-size:0.6rem; color:rgba(255,255,255,0.18); display:flex; align-items:center; gap:5px; padding-right:12px; white-space:nowrap';
    keyboardHint.innerHTML = `
    <kbd style="padding:1px 5px;border-radius:3px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.07);font-family:monospace">Space</kbd>Play
    <kbd style="padding:1px 5px;border-radius:3px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.07);font-family:monospace">1-7</kbd>Panels
  `;

    header.appendChild(logo);
    header.appendChild(tabsRow);
    header.appendChild(keyboardHint);

    // ── Main content area ───────────────────────────────────────────────────────
    const main = document.createElement('main');
    main.className = 'app-main flex flex-1 overflow-hidden';
    main.style.minHeight = '0';

    // Panel content area (full width on mobile, shares row with viz on desktop)
    const panelArea = document.createElement('div');
    panelArea.className = 'flex-1 overflow-hidden relative flex flex-col';
    panelArea.style.minWidth = '0';

    // Mini visualizer strip (mobile only, sits above panel content)
    let mobileVizComp = null;
    const mobileVizStrip = document.createElement('div');
    mobileVizStrip.className = 'mobile-viz-strip';
    mobileVizStrip.style.display = 'none'; // shown via CSS @media
    mobileVizComp = createVisualizer({ height: 56, showControls: false });
    mobileVizStrip.appendChild(mobileVizComp);
    panelArea.appendChild(mobileVizStrip);

    // The scrollable panel slot
    const panelSlot = document.createElement('div');
    panelSlot.style.cssText = 'flex:1; overflow:auto; min-height:0;';
    panelArea.appendChild(panelSlot);

    // Desktop visualizer sidebar (hidden on mobile via CSS)
    const vizSidebar = document.createElement('aside');
    vizSidebar.className = 'app-viz-sidebar';
    vizSidebar.style.cssText = `
    width: 240px;
    flex-shrink: 0;
    border-left: 1px solid rgba(255,255,255,0.04);
    background: rgba(15,13,26,0.5);
    display: flex;
    flex-direction: column;
  `;
    const vizComponent = createVisualizer();
    vizComponent.style.flex = '1';
    vizSidebar.appendChild(vizComponent);

    main.appendChild(panelArea);
    main.appendChild(vizSidebar);

    // ── Transport ──────────────────────────────────────────────────────────────
    const transport = createTransport();

    // ── Assembly ──────────────────────────────────────────────────────────────
    root.appendChild(header);
    root.appendChild(main);
    root.appendChild(transport);

    // ── Panel switching ────────────────────────────────────────────────────────
    function showPanel(key) {
        if (!panelCache[key]) {
            const def = PANELS.find(p => p.key === key);
            if (!def) return;
            const panel = def.create();
            panel.style.cssText = 'height:100%; overflow:auto; -webkit-overflow-scrolling:touch';
            panelCache[key] = panel;
        }

        while (panelSlot.firstChild) panelSlot.removeChild(panelSlot.firstChild);
        panelSlot.appendChild(panelCache[key]);

        navTabs.forEach(btn => btn.classList.toggle('active', btn.dataset.panel === key));
        state.setActivePanel(key);

        // Scroll active tab into view on mobile
        const activeTab = navTabs.find(b => b.dataset.panel === key);
        if (activeTab) activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }

    navTabs.forEach(btn => btn.addEventListener('click', () => showPanel(btn.dataset.panel)));
    showPanel(state.get().activePanel);

    // ── Keyboard shortcuts ─────────────────────────────────────────────────────
    document.addEventListener('keydown', e => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
        if (e.key === 'Tab') {
            e.preventDefault();
            const current = PANELS.findIndex(p => p.key === state.get().activePanel);
            const next = (current + (e.shiftKey ? -1 : 1) + PANELS.length) % PANELS.length;
            showPanel(PANELS[next].key);
        }
        const num = parseInt(e.key);
        if (num >= 1 && num <= PANELS.length && !e.ctrlKey && !e.metaKey) {
            if (e.target.tagName !== 'INPUT') showPanel(PANELS[num - 1].key);
        }
    });

    // ── Show mobile viz strip at ≤768px ───────────────────────────────────────
    const mq = window.matchMedia('(max-width: 768px)');
    function applyMobileLayout(matches) {
        mobileVizStrip.style.display = matches ? 'block' : 'none';
    }
    applyMobileLayout(mq.matches);
    mq.addEventListener('change', e => applyMobileLayout(e.matches));

    return root;
}
