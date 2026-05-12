import { state } from './state.js';
import { showToast } from '../components/toast.js';
import { invalidateCache, fetchAllData } from './data.js';
import { renderHeaderControls } from '../components/header.js';

const REPO = 'Raphl1/FilmTeam';
const BRANCH = 'main';
const DATA_PATH = 'data';

export const getGithubToken = () => localStorage.getItem('github_token') || '';
export const setGithubToken = t => localStorage.setItem('github_token', t);
export const hasGithubToken = () => !!getGithubToken();

async function fetchSHA(filePath) {
  const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${filePath}?ref=${BRANCH}`, {
    headers: { 'Authorization': `Bearer ${getGithubToken()}`, 'Accept': 'application/vnd.github.v3+json' }
  });
  return res.ok ? (await res.json()).sha : null;
}

async function saveFile(fileName, data) {
  const token = getGithubToken();
  if (!token) return { ok: false, error: 'Kein Token' };
  const filePath = `${DATA_PATH}/${fileName}.json`;
  try {
    const sha = await fetchSHA(filePath);
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2) + '\n')));
    const body = { message: `Update ${fileName}.json via FR(AI)ME Editor`, content, branch: BRANCH };
    if (sha) body.sha = sha;
    const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${filePath}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (res.ok) return { ok: true };
    const err = await res.json();
    return { ok: false, error: err.message || 'Fehler' };
  } catch(e) { return { ok: false, error: e.message }; }
}

export async function saveAllDirty() {
  if (state.dirty.size === 0) { showToast('Keine Änderungen vorhanden', 'info'); return; }
  state.saving = true;
  renderHeaderControls();
  showToast('Speichere...', 'info');
  const errors = [];
  for (const file of state.dirty) {
    const r = await saveFile(file, state[file]);
    if (!r.ok) errors.push(`${file}: ${r.error}`);
  }
  state.saving = false;
  if (errors.length === 0) {
    showToast('Gespeichert ✓', 'success');
    state.dirty.clear();
    const { exitEditMode } = await import('./editmode.js');
    exitEditMode();
    invalidateCache();
    await fetchAllData(true);
    const { navigate, getRoute } = await import('./router.js');
    navigate(getRoute(), true);
  } else {
    showToast('Fehler: ' + errors.join(', '), 'error');
    renderHeaderControls();
  }
}
