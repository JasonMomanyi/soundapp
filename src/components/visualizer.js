import { engine } from '../audio/engine.js';
import { state } from '../state/state.js';

export function createVisualizer() {
    const el = document.createElement('div');
    el.className = 'flex flex-col gap-3 p-4 h-full';

    el.innerHTML = `
    <div class="flex items-center justify-between mb-1">
      <h2 class="text-sm font-semibold tracking-wider uppercase"
          style="color:rgba(255,255,255,0.35); letter-spacing:0.1em">Visualizer</h2>
      <div class="flex gap-1" id="viz-tabs">
        <button class="tab-btn active" data-mode="waveform">Waveform</button>
        <button class="tab-btn" data-mode="spectrum">Spectrum</button>
        <button class="tab-btn" data-mode="circular">Circular</button>
      </div>
    </div>
    <div class="flex-1 glass-panel relative overflow-hidden" style="min-height: 160px">
      <canvas id="viz-canvas" class="visualizer-canvas" style="position:absolute;inset:0;width:100%;height:100%"></canvas>
    </div>
  `;

    const canvas = el.querySelector('#viz-canvas');
    const ctx = canvas.getContext('2d');
    const tabs = el.querySelectorAll('.tab-btn');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            state.setVisualizerMode(tab.dataset.mode);
        });
    });

    let mode = state.get().visualizerMode;
    state.on('visualizer-mode', m => { mode = m; });

    // Resize canvas to match display size
    const observer = new ResizeObserver(() => {
        canvas.width = canvas.offsetWidth * window.devicePixelRatio;
        canvas.height = canvas.offsetHeight * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    });
    observer.observe(canvas);

    // Draw loop
    let animId;
    function draw() {
        const W = canvas.offsetWidth;
        const H = canvas.offsetHeight;
        if (!W || !H) { animId = requestAnimationFrame(draw); return; }

        ctx.clearRect(0, 0, W, H);

        if (mode === 'waveform') drawWaveform(ctx, W, H);
        else if (mode === 'spectrum') drawSpectrum(ctx, W, H);
        else if (mode === 'circular') drawCircular(ctx, W, H);

        animId = requestAnimationFrame(draw);
    }
    draw();

    return el;
}

function drawWaveform(ctx, W, H) {
    const data = engine.getWaveform();
    const len = data.length;

    ctx.lineWidth = 2;
    const grad = ctx.createLinearGradient(0, 0, W, 0);
    grad.addColorStop(0, '#00FFFF');
    grad.addColorStop(0.5, '#FF00FF');
    grad.addColorStop(1, '#00FFFF');
    ctx.strokeStyle = grad;

    // Glow
    ctx.shadowColor = '#00FFFF';
    ctx.shadowBlur = 12;

    ctx.beginPath();
    for (let i = 0; i < len; i++) {
        const x = (i / len) * W;
        const y = H / 2 + (data[i] || 0) * (H / 2) * 0.9;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Center line
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.beginPath();
    ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2);
    ctx.stroke();
}

function drawSpectrum(ctx, W, H) {
    const data = engine.getFFT();
    const len = Math.min(data.length, 64);
    const barW = W / len - 1;

    for (let i = 0; i < len; i++) {
        // FFT values are in dB (-Infinity to 0)
        const normalized = Math.max(0, (data[i] + 140) / 140);
        const barH = normalized * H;

        const hue = (i / len) * 280;
        const grad = ctx.createLinearGradient(0, H, 0, H - barH);
        grad.addColorStop(0, `hsla(${hue}, 100%, 60%, 0.9)`);
        grad.addColorStop(1, `hsla(${hue}, 100%, 80%, 0.6)`);

        ctx.shadowColor = `hsl(${hue}, 100%, 60%)`;
        ctx.shadowBlur = 8;
        ctx.fillStyle = grad;
        ctx.fillRect(i * (barW + 1), H - barH, barW, barH);
    }
    ctx.shadowBlur = 0;
}

function drawCircular(ctx, W, H) {
    const data = engine.getWaveform();
    const len = data.length;
    const cx = W / 2;
    const cy = H / 2;
    const radius = Math.min(W, H) * 0.3;

    ctx.strokeStyle = '#00FFFF';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = '#00FFFF';
    ctx.shadowBlur = 10;

    ctx.beginPath();
    for (let i = 0; i < len; i++) {
        const angle = (i / len) * Math.PI * 2 - Math.PI / 2;
        const amp = (data[i] || 0) * radius * 0.6;
        const r = radius + amp;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Inner ring
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();
}
