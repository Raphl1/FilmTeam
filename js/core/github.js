import { state } from './state.js';
import { showToast } from '../components/toast.js';
import { fetchAllData, saveData } from './data.js';
import { renderHeaderControls } from '../components/header.js';

// Token no longer needed — Firebase is open
export const getGithubToken = () => 'firebase';
export const setGithubToken = () => {};
export const hasGithubToken = () => true;

export async function saveAllDirty() {
  if (state.dirty.size === 0) { showToast('Keine Änderungen vorhanden', 'info'); return; }
  state.saving = true;
  renderHeaderControls();
  showToast('Speichere...', 'info');
  const errors = [];
  for (const file of state.dirty) {
    try {
      await saveData(file, state[file]);
    } catch (e) {
      errors.push(`${file}: ${e.message}`);
    }
  }
  state.saving = false;
  if (errors.length === 0) {
    showToast('Gespeichert ✓', 'success');
    state.dirty.clear();
    const { exitEditMode } = await import('./editmode.js');
    exitEditMode();
    await fetchAllData(true);
    const { navigate, getRoute } = await import('./router.js');
    navigate(getRoute(), true);
  } else {
    showToast('Fehler: ' + errors.join(', '), 'error');
    renderHeaderControls();
  }
}
