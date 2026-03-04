import './styles/main.css';
import { createApp } from './components/app.js';

// Mount the app
const appEl = document.getElementById('app');
const app = createApp();
appEl.appendChild(app);

// Log keyboard shortcuts to console for dev convenience
console.log(
    '%c🎵 SoundApp Studio\n',
    'color:#00FFFF; font-size:1.2rem; font-weight:bold',
    '\nKeyboard shortcuts:\n',
    '  Space       — Play / Stop\n',
    '  Tab         — Next panel\n',
    '  Shift+Tab   — Previous panel\n',
    '  1-5         — Switch to panel N\n',
    '  Ctrl+S      — Save preset\n',
    '  A S D F G H J K — White piano keys (C4–B4)\n',
    '  W E T Y U O P   — Black piano keys',
);
