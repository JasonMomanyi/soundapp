import { engine } from '../audio/engine.js';
import { DEMO_SONGS, getScaleKeyLayout, getDurationDisplay } from '../audio/demos.js';

/**
 * Demo Player panel — showcases 3 pre-built ~3-min demo songs.
 * Shows:
 *  - Song cards with key, BPM, description
 *  - Key/scale display (mini piano with highlighted notes)
 *  - Section timeline & live progress bar
 *  - Track note reference table (for learning & mimicking)
 *  - Per-step note display in the sequencer while playing
 */
export function createDemoPlayer() {
    const el = document.createElement('div');
    el.className = 'flex flex-col h-full overflow-hidden';

    el.innerHTML = `
    <div class="flex flex-col gap-4 p-4 overflow-y-auto flex-1">
      <!-- Header -->
      <div class="flex items-center justify-between mb-1">
        <div>
          <h2 class="text-sm font-semibold tracking-wider uppercase"
              style="color:rgba(255,255,255,0.35); letter-spacing:0.1em">Demo Songs</h2>
          <p class="text-xs mt-0.5" style="color:rgba(255,255,255,0.2)">
            Full ~3-minute arrangements. Study the key configs and mimic them in the Sequencer.
          </p>
        </div>
      </div>

      <!-- Song Cards -->
      <div id="song-cards" class="grid gap-3" style="grid-template-columns: repeat(auto-fill, minmax(220px,1fr))"></div>

      <!-- Detail panel (shown when a song is selected) -->
      <div id="song-detail" class="hidden flex flex-col gap-4"></div>
    </div>
  `;

    const cardsEl = el.querySelector('#song-cards');
    const detailEl = el.querySelector('#song-detail');

    let activeSong = null;
    let activeSongIdx = null;
    let progressTimer = null;
    let currentSection = { idx: 0, name: '', bars: 0 };

    // ── Song Cards ─────────────────────────────────────────────────────────
    DEMO_SONGS.forEach((song, idx) => {
        const dur = getDurationDisplay(song);
        const card = document.createElement('div');
        card.className = 'glass-panel p-4 cursor-pointer flex flex-col gap-2 transition-all';
        card.style.cssText += `border-color: ${activeSongIdx === idx ? song.color : 'rgba(255,255,255,0.06)'};`;
        card.dataset.songIdx = idx;

        const totalBars = song.sections.reduce((s, sc) => s + sc.bars, 0);

        card.innerHTML = `
      <!-- Color accent bar -->
      <div class="w-full h-0.5 rounded-full mb-1" style="background:${song.color}; box-shadow: 0 0 8px ${song.color}66"></div>

      <div class="flex items-start justify-between gap-2">
        <h3 class="font-bold text-sm leading-tight" style="color:rgba(255,255,255,0.9)">${song.name}</h3>
        <span class="font-mono text-xs flex-shrink-0" style="color:${song.color}">${dur.display}</span>
      </div>

      <p class="text-xs leading-relaxed" style="color:rgba(255,255,255,0.4)">${song.description}</p>

      <div class="flex gap-3 text-xs mt-1">
        <div class="flex flex-col gap-0.5">
          <span style="color:rgba(255,255,255,0.25); font-size:0.6rem; letter-spacing:0.1em; text-transform:uppercase">Key</span>
          <span class="font-mono font-bold" style="color:${song.color}">${song.key} ${song.mode}</span>
        </div>
        <div class="flex flex-col gap-0.5">
          <span style="color:rgba(255,255,255,0.25); font-size:0.6rem; letter-spacing:0.1em; text-transform:uppercase">BPM</span>
          <span class="font-mono font-bold" style="color:${song.color}">${song.bpm}</span>
        </div>
        <div class="flex flex-col gap-0.5">
          <span style="color:rgba(255,255,255,0.25); font-size:0.6rem; letter-spacing:0.1em; text-transform:uppercase">Sections</span>
          <span class="font-mono font-bold" style="color:${song.color}">${song.sections.length}</span>
        </div>
      </div>

      <!-- Scale pills -->
      <div class="flex gap-1 flex-wrap mt-1">
        ${song.scaleNotes.map(n => `
          <span class="px-1.5 py-0.5 rounded font-mono font-bold"
            style="font-size:0.6rem; background:${song.color}15; border:1px solid ${song.color}30; color:${song.color}">
            ${n}
          </span>
        `).join('')}
      </div>

      <!-- CTA -->
      <button class="btn-song-select w-full mt-2 py-2 rounded-lg font-semibold text-xs transition-all"
        data-song-idx="${idx}"
        style="background:${song.color}15; border:1px solid ${song.color}33; color:${song.color}">
        View & Play →
      </button>
    `;

        cardsEl.appendChild(card);
    });

    cardsEl.addEventListener('click', e => {
        const btn = e.target.closest('.btn-song-select');
        if (!btn) return;
        const idx = parseInt(btn.dataset.songIdx);
        showDetail(idx);
    });

    // ── Detail View ──────────────────────────────────────────────────────
    function showDetail(idx) {
        activeSongIdx = idx;
        activeSong = DEMO_SONGS[idx];
        const song = activeSong;
        const dur = getDurationDisplay(song);
        const keyLayout = getScaleKeyLayout(song.scaleNotes);

        detailEl.classList.remove('hidden');
        detailEl.innerHTML = `
      <!-- Back + now playing header -->
      <div class="flex items-center gap-3 flex-wrap">
        <button id="back-btn" class="btn-icon" style="width:28px;height:28px;font-size:0.9rem">←</button>
        <div class="flex items-center gap-2 flex-1">
          <div class="w-2.5 h-2.5 rounded-full" style="background:${song.color}; box-shadow:0 0 8px ${song.color}"></div>
          <span class="font-bold text-sm" style="color:rgba(255,255,255,0.9)">${song.name}</span>
          <span class="font-mono text-xs" style="color:${song.color}">${song.key} ${song.mode} · ${song.bpm} BPM · ${dur.display}</span>
        </div>

        <!-- Play / Stop -->
        <button id="demo-play-btn" class="btn-neon flex items-center gap-2"
          style="border-color:${song.color}44; color:${song.color}; background:${song.color}10; font-size:0.75rem; padding:8px 18px">
          <span id="demo-play-icon">▶</span>
          <span id="demo-play-label">Play Demo</span>
        </button>
      </div>

      <!-- Progress bar + section name -->
      <div class="flex flex-col gap-1.5">
        <div class="flex items-center justify-between text-xs" style="color:rgba(255,255,255,0.3)">
          <span id="section-label" class="font-semibold" style="color:${song.color}">─</span>
          <span id="progress-time">0:00 / ${dur.display}</span>
        </div>
        <!-- Progress track -->
        <div class="w-full h-2 rounded-full overflow-hidden" style="background:rgba(255,255,255,0.05)">
          <div id="progress-fill" class="h-full rounded-full transition-none"
            style="width:0%; background:linear-gradient(90deg, ${song.color}, ${song.color}aa)"></div>
        </div>
        <!-- Section blocks -->
        <div class="flex gap-0.5 w-full mt-0.5" id="section-blocks">
          ${song.sections.map((sec, si) => {
            const pct = (sec.bars / dur.totalBars * 100).toFixed(1);
            return `
              <div class="section-block relative overflow-hidden rounded-sm cursor-default"
                style="flex:${sec.bars}; height:14px; background:${song.color}15; border:1px solid ${song.color}22"
                title="${sec.name} (${sec.bars} bars)" data-sec-idx="${si}">
                <div class="absolute inset-0 flex items-center justify-center"
                  style="font-size:0.5rem; color:${song.color}88; font-family:monospace; white-space:nowrap; overflow:hidden">
                  ${sec.name}
                </div>
              </div>
            `;
        }).join('')}
        </div>
      </div>

      <!-- Two column layout: Key display + Track Tips -->
      <div class="grid gap-4" style="grid-template-columns: 1fr 1fr">

        <!-- Key / Scale Display -->
        <div class="glass-panel-sm p-4 flex flex-col gap-3">
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold uppercase tracking-wider" style="color:${song.color}; letter-spacing:0.08em">Scale</span>
            <span class="text-xs" style="color:rgba(255,255,255,0.5)">${song.key} ${song.mode}</span>
          </div>

          <!-- Mini Piano keyboard -->
          <div class="relative" style="height:56px; background:rgba(0,0,0,0.3); border-radius:8px; overflow:hidden; padding:4px">
            <div id="mini-piano" class="relative h-full flex"></div>
          </div>

          <!-- Note pills with octave info -->
          <div>
            <p class="text-xs mb-1.5" style="color:rgba(255,255,255,0.2); font-size:0.6rem; letter-spacing:0.08em; text-transform:uppercase">Scale notes</p>
            <div class="flex gap-1 flex-wrap">
              ${song.scaleNotes.map(n => `
                <div class="flex flex-col items-center px-1.5 py-1 rounded"
                  style="background:${song.color}15; border:1px solid ${song.color}30; min-width:24px">
                  <span class="font-mono font-bold" style="font-size:0.7rem; color:${song.color}">${n}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="text-xs" style="color:rgba(255,255,255,0.35)">
            <span class="font-mono font-semibold" style="color:${song.color}">Chord: </span>${song.chordName}
          </div>
        </div>

        <!-- Track note reference -->
        <div class="glass-panel-sm p-4 flex flex-col gap-3">
          <span class="text-xs font-bold uppercase tracking-wider" style="color:${song.color}; letter-spacing:0.08em">Track Notes</span>
          <div class="flex flex-col gap-2">
            ${song.trackTips.map(tip => `
              <div class="flex flex-col gap-1 pb-2" style="border-bottom:1px solid rgba(255,255,255,0.04)">
                <div class="flex items-center gap-2">
                  <span class="font-semibold text-xs" style="color:rgba(255,255,255,0.7); min-width:40px">${tip.track}</span>
                  <div class="flex gap-1 flex-wrap">
                    ${tip.notes.map(n => `
                      <span class="px-1 py-0.5 rounded font-mono"
                        style="font-size:0.6rem; background:${song.color}12; border:1px solid ${song.color}25; color:${song.color}cc">
                        ${n}
                      </span>
                    `).join('')}
                  </div>
                </div>
                <p style="font-size:0.6rem; color:rgba(255,255,255,0.25); line-height:1.4">${tip.tip}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Section reference table -->
      <div class="glass-panel-sm p-4">
        <span class="text-xs font-bold uppercase tracking-wider mb-3 block" style="color:${song.color}; letter-spacing:0.08em">Song Arrangement</span>
        <div class="grid gap-1.5" style="grid-template-columns: auto 1fr auto">
          <span style="font-size:0.6rem; color:rgba(255,255,255,0.2); letter-spacing:0.1em; text-transform:uppercase">Section</span>
          <span style="font-size:0.6rem; color:rgba(255,255,255,0.2); letter-spacing:0.1em; text-transform:uppercase">Description</span>
          <span style="font-size:0.6rem; color:rgba(255,255,255,0.2); letter-spacing:0.1em; text-transform:uppercase">Bars</span>
          ${song.sections.map((sec, si) => `
            <span class="font-mono font-semibold section-row" data-sec="${si}"
              style="font-size:0.75rem; color:rgba(255,255,255,0.6); padding:2px 0">${sec.name}</span>
            <span style="font-size:0.7rem; color:rgba(255,255,255,0.3); padding:2px 0">${sec.description}</span>
            <span class="font-mono text-right" style="font-size:0.7rem; color:${song.color}aa; padding:2px 0">${sec.bars}</span>
          `).join('')}
        </div>
      </div>
    `;

        // Build mini piano
        _buildMiniPiano(detailEl.querySelector('#mini-piano'), keyLayout, song.color);

        // Back button
        detailEl.querySelector('#back-btn').addEventListener('click', () => {
            stopDemo();
            detailEl.classList.add('hidden');
            detailEl.innerHTML = '';
            activeSong = null;
        });

        // Demo play button
        detailEl.querySelector('#demo-play-btn').addEventListener('click', async () => {
            if (engine._songMode && engine._initialized && engine._instruments) {
                stopDemo();
            } else {
                await startDemo(song, detailEl, dur);
            }
        });
    }

    // ── Demo Playback ────────────────────────────────────────────────────
    async function startDemo(song, det, dur) {
        const playBtn = det.querySelector('#demo-play-btn');
        const playIcon = det.querySelector('#demo-play-icon');
        const playLabel = det.querySelector('#demo-play-label');

        playIcon.textContent = '■';
        playLabel.textContent = 'Stop Demo';
        playBtn.style.borderColor = '#ff444488';
        playBtn.style.color = '#ff4444';

        // Section change callback
        const onSection = (sIdx, name, bars, totalBars) => {
            currentSection = { idx: sIdx, name, bars };
            const sLabel = det.querySelector('#section-label');
            if (sLabel) sLabel.textContent = `▶ ${name}`;

            // Highlight active section block
            det.querySelectorAll('.section-block').forEach((b, bi) => {
                b.style.background = bi === sIdx ? `${song.color}33` : `${song.color}15`;
                b.style.borderColor = bi === sIdx ? song.color : `${song.color}22`;
            });
            det.querySelectorAll('.section-row').forEach((r, ri) => {
                r.style.color = ri === sIdx ? song.color : 'rgba(255,255,255,0.6)';
            });
        };

        // Song end callback
        const onEnd = () => {
            resetPlayBtn(det, song);
            clearInterval(progressTimer);
        };

        await engine.playSong(song, onSection, onEnd);

        // Progress update loop
        progressTimer = setInterval(() => {
            if (!det.isConnected) { clearInterval(progressTimer); return; }
            const prog = engine.getSongProgress(song);
            const fill = det.querySelector('#progress-fill');
            const timeEl = det.querySelector('#progress-time');
            if (!prog || !fill) return;

            fill.style.width = `${prog.pct * 100}%`;

            const elapsed = Math.floor(prog.elapsed);
            const em = Math.floor(elapsed / 60);
            const es = (elapsed % 60).toString().padStart(2, '0');
            if (timeEl) timeEl.textContent = `${em}:${es} / ${dur.display}`;
        }, 200);
    }

    function stopDemo() {
        engine.stop();
        clearInterval(progressTimer);
        if (detailEl.children.length) resetPlayBtn(detailEl, activeSong);
    }

    function resetPlayBtn(det, song) {
        const playBtn = det.querySelector('#demo-play-btn');
        const playIcon = det.querySelector('#demo-play-icon');
        const playLabel = det.querySelector('#demo-play-label');
        if (!playBtn) return;
        playIcon.textContent = '▶';
        playLabel.textContent = 'Play Demo';
        playBtn.style.borderColor = song ? `${song.color}44` : '';
        playBtn.style.color = song ? song.color : '';

        const fill = det.querySelector('#progress-fill');
        if (fill) fill.style.width = '0%';
        const sLabel = det.querySelector('#section-label');
        if (sLabel) sLabel.textContent = '─';
        det.querySelectorAll('.section-block').forEach(b => {
            b.style.background = `${activeSong?.color || '#fff'}15`;
            b.style.borderColor = `${activeSong?.color || '#fff'}22`;
        });
        det.querySelectorAll('.section-row').forEach(r => {
            r.style.color = 'rgba(255,255,255,0.6)';
        });
    }

    return el;
}

// ─── Mini Piano Keyboard ─────────────────────────────────────────────────────
function _buildMiniPiano(container, keyLayout, accentColor) {
    const whites = keyLayout.filter(k => !k.isBlack);
    const whiteCount = whites.length;
    const keyW = 100 / whiteCount; // %

    // White keys
    whites.forEach((k, i) => {
        const key = document.createElement('div');
        key.style.cssText = `
      position: absolute;
      left: ${i * keyW}%;
      width: calc(${keyW}% - 1px);
      height: 100%;
      border-radius: 0 0 3px 3px;
      border: 1px solid rgba(0,0,0,0.2);
      background: ${k.inScale
                ? `linear-gradient(180deg, ${accentColor}55, ${accentColor}22)`
                : 'linear-gradient(180deg, rgba(240,240,240,0.9), rgba(200,200,200,0.9))'};
      ${k.inScale ? `box-shadow: 0 0 6px ${accentColor}44;` : ''}
      display: flex; align-items: flex-end; justify-content: center;
      padding-bottom: 3px;
    `;
        key.innerHTML = `<span style="font-size:0.45rem; font-family:monospace; color:${k.inScale ? accentColor : 'rgba(0,0,0,0.35)'}; font-weight:${k.inScale ? '700' : '400'}">${k.note}</span>`;
        container.appendChild(key);
    });

    // Black keys
    const blackOffsets = { 'C#': 0, 'D#': 1, 'F#': 3, 'G#': 4, 'A#': 5 };
    keyLayout.filter(k => k.isBlack).forEach(k => {
        const naturalName = k.note.replace('#', '');
        const naturalIdx = whites.findIndex(w => w.note === naturalName);
        if (naturalIdx < 0) return;

        const key = document.createElement('div');
        key.style.cssText = `
      position: absolute;
      left: calc(${(naturalIdx + 0.65) * keyW}%);
      width: calc(${keyW * 0.65}%);
      height: 62%;
      border-radius: 0 0 2px 2px;
      z-index: 2;
      background: ${k.inScale
                ? `linear-gradient(180deg, ${accentColor}, ${accentColor}88)`
                : 'linear-gradient(180deg, #222, #111)'};
      ${k.inScale ? `box-shadow: 0 0 8px ${accentColor}66;` : ''}
      display: flex; align-items: flex-end; justify-content: center;
      padding-bottom: 2px;
    `;
        key.innerHTML = `<span style="font-size:0.4rem; font-family:monospace; color:${k.inScale ? '#fff' : 'rgba(255,255,255,0.2)'}; font-weight:700">${k.inScale ? k.note : ''}</span>`;
        container.appendChild(key);
    });
}
