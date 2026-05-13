/**
 * Floating Action Button — Save in Edit-Mode.
 *
 * Mounts a fixed bottom-right button that:
 *  - Only appears when state.editMode === true AND state.dirty.size > 0
 *  - Shows the dirty count as badge
 *  - Pulses when there are unsaved changes
 *  - On click triggers `saveAllDirty()`
 *
 * The component is "reactive" via render() being called from header.js
 * (which is the existing reflow trigger after editmode changes / markDirty).
 */

import { state } from '../core/state.js';

const FAB_ID = 'fraime-save-fab';

function fabHTML() {
  const count = state.dirty.size;
  const saving = state.saving;
  const icon = saving ? 'loader' : 'save';
  return `
    <button id="${FAB_ID}"
      class="fixed z-[300] right-md bottom-[calc(72px+env(safe-area-inset-bottom)+16px)] md:bottom-md
             flex items-center gap-sm pl-md pr-lg py-md rounded-full
             bg-purple text-white text-sm font-bold shadow-lg cursor-pointer border-none
             hover:brightness-110 active:scale-[.96] transition-all duration-base
             ${count > 0 ? 'animate-pulse-glow' : ''}
             ${saving ? 'opacity-70 cursor-not-allowed' : ''}"
      data-action="save-changes"
      ${saving ? 'disabled' : ''}
      aria-label="${count} ungespeicherte Änderungen speichern">
      <i data-lucide="${icon}" class="w-5 h-5"></i>
      <span>Speichern</span>
      ${count > 0 ? `<span class="ml-xs min-w-[22px] h-[22px] px-xs rounded-full bg-white/25 text-[11px] font-extrabold flex items-center justify-center">${count}</span>` : ''}
    </button>
  `;
}

export function renderSaveFab() {
  const existing = document.getElementById(FAB_ID);

  // Visible only in edit-mode with unsaved changes (or while saving)
  const shouldShow = state.editMode && (state.dirty.size > 0 || state.saving);

  if (!shouldShow) {
    existing?.remove();
    return;
  }

  if (!existing) {
    const wrap = document.createElement('div');
    wrap.innerHTML = fabHTML().trim();
    document.body.appendChild(wrap.firstElementChild);
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  // Update in place
  existing.outerHTML = fabHTML().trim();
  if (window.lucide) window.lucide.createIcons();
}