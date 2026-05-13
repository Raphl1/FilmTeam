import { state, clearDirtyTracker } from './state.js';
import { showToast } from '../components/toast.js';
import { renderHeaderControls } from '../components/header.js';
import { fetchAllData } from './data.js';
import { applyPendingUpdates, clearPendingUpdates } from './realtime.js';

export function enterEditMode() {
  state.editMode = true;
  state.dirty.clear();
  clearDirtyTracker();
  document.body.classList.add('edit-mode-active');
  renderHeaderControls();
  import('./router.js').then(({ navigate, getRoute }) => navigate(getRoute(), true));
  showToast('Bearbeitungsmodus aktiv', 'info');
}

/**
 * Called after a successful save. We do NOT re-fetch from server because
 * our local state already represents the saved truth (the realtime
 * own-write-flag suppresses the echo). Only one re-render at the end.
 */
export function exitEditMode() {
  applyPendingUpdates();
  state.editMode = false;
  state.dirty.clear();
  clearDirtyTracker();
  document.body.classList.remove('edit-mode-active');
  renderHeaderControls();
  import('./router.js').then(({ navigate, getRoute }) => navigate(getRoute(), true));
}

export async function cancelEditMode() {
  if (state.dirty.size > 0 && !confirm('Ungespeicherte Änderungen verwerfen?')) return;
  await fetchAllData();
  clearPendingUpdates();
  state.editMode = false;
  state.dirty.clear();
  clearDirtyTracker();
  document.body.classList.remove('edit-mode-active');
  renderHeaderControls();
  import('./router.js').then(({ navigate, getRoute }) => navigate(getRoute(), true));
  showToast('Änderungen verworfen', 'info');
}
