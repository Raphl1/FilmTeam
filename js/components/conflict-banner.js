/**
 * Conflict Banner — replaces the Toast warning when the realtime listener
 * detects an external change while the user is in Edit-Mode and has the
 * same file dirty.
 *
 * UX:
 *  - Sticky banner at the top of the view container
 *  - Two clear actions: "Übernehmen" (apply remote) or "Behalten" (keep local)
 *  - Stays until the user decides — does not block input elsewhere
 */

import { state } from '../core/state.js';
import { getPendingUpdates, clearPendingUpdates, applyPendingUpdates } from '../core/realtime.js';
import { showToast } from './toast.js';

const BANNER_ID = 'fraime-conflict-banner';

function bannerHTML(files) {
  const list = files.map(f => `<code class="px-xs rounded-xs bg-white/15">${f}</code>`).join(' ');
  return `
    <div id="${BANNER_ID}" role="alert"
      class="sticky top-0 z-[150] mb-md p-md rounded-sm
             bg-gold/15 border border-gold/40 text-txt
             flex flex-col md:flex-row md:items-center gap-sm animate-slideUp">
      <div class="flex-1 flex items-start gap-sm">
        <i data-lucide="alert-triangle" class="w-5 h-5 text-gold shrink-0 mt-[2px]"></i>
        <div class="text-sm leading-snug">
          <strong class="text-gold">Konflikt:</strong>
          Während du bearbeitest, hat jemand anders ${list} geändert.
          Du musst entscheiden, welche Version gilt.
        </div>
      </div>
      <div class="flex gap-sm shrink-0">
        <button class="px-md py-xs rounded-sm bg-card border border-border text-txt text-xs font-semibold cursor-pointer hover:border-violet/40 hover:text-violet" data-conflict="keep">Lokal behalten</button>
        <button class="px-md py-xs rounded-sm bg-gold text-bg text-xs font-extrabold cursor-pointer hover:brightness-110" data-conflict="apply">Externe übernehmen</button>
      </div>
    </div>
  `;
}

export function showConflictBanner() {
  const pending = getPendingUpdates();
  const files = Object.keys(pending);
  if (files.length === 0) return;

  // Existing banner? update it (file list might have grown)
  const existing = document.getElementById(BANNER_ID);
  if (existing) existing.remove();

  const container = document.getElementById('view-container');
  if (!container) {
    showToast(`Externe Änderung in ${files.join(', ')}`, 'warning');
    return;
  }

  const wrap = document.createElement('div');
  wrap.innerHTML = bannerHTML(files).trim();
  container.insertBefore(wrap.firstElementChild, container.firstChild);
  if (window.lucide) window.lucide.createIcons();

  const banner = document.getElementById(BANNER_ID);
  banner.querySelector('[data-conflict="keep"]').addEventListener('click', () => {
    clearPendingUpdates();
    banner.remove();
    showToast('Externe Änderungen verworfen — deine Version wird beim Speichern überschrieben', 'info');
  });
  banner.querySelector('[data-conflict="apply"]').addEventListener('click', async () => {
    applyPendingUpdates();
    banner.remove();
    // Drop dirty markers for files we just overwrote, exit edit-mode for clarity
    files.forEach(f => state.dirty.delete(f));
    const { exitEditMode } = await import('../core/editmode.js');
    exitEditMode();
    showToast('Externe Version übernommen', 'success');
  });
}

export function hideConflictBanner() {
  document.getElementById(BANNER_ID)?.remove();
}