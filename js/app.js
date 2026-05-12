import { fetchAllData } from './core/data.js';
import { state } from './core/state.js';
import { renderShell } from './components/shell.js';
import { renderHeaderControls } from './components/header.js';
import { navigate } from './core/router.js';
import './core/events.js';

async function init() {
  const app = document.getElementById('app');
  app.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;gap:16px;color:#8892a4;font-family:system-ui,sans-serif"><div style="font-size:2rem">🎬</div><div>Lade FR(AI)ME...</div></div>`;

  try {
    await fetchAllData();
  } catch (err) {
    app.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;gap:16px;color:#f72585;font-family:system-ui,sans-serif;padding:24px;text-align:center"><div style="font-size:2rem">⚠️</div><div style="font-size:1.1rem;font-weight:700">Daten konnten nicht geladen werden</div><div style="color:#8892a4;font-size:.85rem;max-width:400px">${err.message}</div><button onclick="location.reload()" style="margin-top:16px;padding:8px 24px;border-radius:8px;border:1px solid #f72585;color:#f72585;background:transparent;cursor:pointer;font-size:.85rem">Neu laden</button></div>`;
    console.error('FR(AI)ME init failed:', err);
    return;
  }

  state.loaded = true;
  const route = window.location.hash.slice(1) || 'hub';

  try {
    renderShell(route);
    renderHeaderControls();
    await navigate(route);
  } catch (err) {
    app.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;gap:16px;color:#f72585;font-family:system-ui,sans-serif;padding:24px;text-align:center"><div style="font-size:2rem">⚠️</div><div style="font-size:1.1rem;font-weight:700">Rendering-Fehler</div><div style="color:#8892a4;font-size:.85rem;max-width:400px">${err.message}</div><button onclick="location.reload()" style="margin-top:16px;padding:8px 24px;border-radius:8px;border:1px solid #f72585;color:#f72585;background:transparent;cursor:pointer;font-size:.85rem">Neu laden</button></div>`;
    console.error('FR(AI)ME render failed:', err);
  }
}

init();
