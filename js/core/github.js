/**
 * Save orchestrator — pushes all dirty files to Firebase RTDB in parallel,
 * keeps the UI responsive, and avoids double re-renders.
 *
 * Smoothness wins:
 *  - Parallel saves (Promise.allSettled) instead of sequential await loop
 *  - Optimistic UI: immediate header update + spinner FAB, no blocking toast
 *  - Single re-render at the end (via exitEditMode), no intermediate flickers
 *  - Conflict prompt becomes inline banner (already implemented), here we
 *    just check the pending-buffer and surface it as a one-shot confirm only
 *    when the user explicitly forces save.
 */

import { state } from './state.js';
import { showToast } from '../components/toast.js';
import { saveData } from './data.js';
import { renderHeaderControls } from '../components/header.js';
import { getPendingUpdates, clearPendingUpdates } from './realtime.js';

let saveInflight = null;

export async function saveAllDirty() {
  // Coalesce concurrent calls (e.g. user mashes Cmd+S)
  if (saveInflight) return saveInflight;

  if (state.dirty.size === 0) {
    showToast('Bereits gespeichert', 'info');
    return;
  }

  // Conflict pre-check — only blocks if user has dirty changes that overlap
  // with pending external updates. The realtime listener already shows a
  // conflict banner; this is the last-line safety net.
  const pending = getPendingUpdates();
  const conflicts = [...state.dirty].filter(f => f in pending);
  if (conflicts.length > 0) {
    const ok = confirm(`"${conflicts.join(', ')}" wurde(n) extern geändert. Trotzdem speichern?`);
    if (!ok) return;
  }

  saveInflight = doSave();
  try { return await saveInflight; }
  finally { saveInflight = null; }
}

async function doSave() {
  const filesToSave = [...state.dirty];
  state.saving = true;
  renderHeaderControls();

  // Parallel save — Firebase RTDB handles concurrent writes fine.
  const results = await Promise.allSettled(
    filesToSave.map(file => saveData(file, state[file]).then(
      () => ({ file, ok: true }),
      err => ({ file, ok: false, error: err?.message || String(err) })
    ))
  );

  // Mark only successful files as clean
  const errors = [];
  results.forEach(r => {
    if (r.status === 'fulfilled' && r.value.ok) {
      state.dirty.delete(r.value.file);
    } else if (r.status === 'fulfilled' && !r.value.ok) {
      errors.push(`${r.value.file}: ${r.value.error}`);
    } else {
      // promise rejected (shouldn't happen because we map errors above, but defensive)
      errors.push(`unknown: ${r.reason?.message || r.reason}`);
    }
  });

  state.saving = false;

  if (errors.length === 0) {
    // Single concise toast, no second re-render — exitEditMode handles cleanup.
    showToast('Gespeichert ✓', 'success');
    clearPendingUpdates();
    const { exitEditMode } = await import('./editmode.js');
    exitEditMode();
  } else {
    // Show toast with error count, keep edit-mode active so the user can retry
    const head = errors.length === 1 ? errors[0] : `${errors.length} Fehler beim Speichern`;
    showToast(head, 'error');
    renderHeaderControls();
  }
}