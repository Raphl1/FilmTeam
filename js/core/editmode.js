import { state } from './state.js';
import { showToast } from '../components/toast.js';
import { hasGithubToken } from './github.js';
import { renderHeaderControls } from '../components/header.js';
import { fetchAllData } from './data.js';

export function enterEditMode() {
  if (!hasGithubToken()) {
    import('../components/modal.js').then(m => m.showTokenModal());
    return;
  }
  state.editMode = true;
  state.dirty.clear();
  document.body.classList.add('edit-mode-active');
  renderHeaderControls();
  import('./router.js').then(({ navigate, getRoute }) => navigate(getRoute(), true));
  showToast('Bearbeitungsmodus aktiv', 'info');
}

export function exitEditMode() {
  state.editMode = false;
  state.dirty.clear();
  document.body.classList.remove('edit-mode-active');
  renderHeaderControls();
  import('./router.js').then(({ navigate, getRoute }) => navigate(getRoute(), true));
}

export async function cancelEditMode() {
  if (state.dirty.size > 0 && !confirm('Ungespeicherte Änderungen verwerfen?')) return;
  await fetchAllData(true);
  exitEditMode();
  showToast('Änderungen verworfen', 'info');
}
