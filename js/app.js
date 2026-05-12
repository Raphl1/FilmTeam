import { fetchAllData } from './core/data.js';
import { state } from './core/state.js';
import { renderShell } from './components/shell.js';
import { renderHeaderControls } from './components/header.js';
import { navigate } from './core/router.js';
import './core/events.js';

async function init() {
  document.getElementById('app').innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;gap:16px;color:var(--muted)">
      <div class="skeleton" style="width:200px;height:32px;border-radius:8px"></div>
      <div class="skeleton" style="width:120px;height:16px;border-radius:6px;margin-top:8px"></div>
    </div>`;

  await fetchAllData();
  state.loaded = true;

  const route = window.location.hash.slice(1) || 'hub';
  renderShell(route);
  renderHeaderControls();
  await navigate(route);
}

init();
