/**
 * Shared application state.
 *
 * The dirty-set is the source of truth for "are there unsaved changes?".
 * markDirty() is called on every keystroke in contenteditable fields, so it
 * must be CHEAP. We only re-render the header (which shows the save badge)
 * when the SIZE of the dirty set actually changes — not on every keystroke
 * that touches a file already in the set.
 */

export const state = {
  config: null, locations: null, schedule: null, contacts: null,
  team: null, equipment: null, budget: null, timeline: null, kanban: null,
  activeFilter: 'all', teamFilter: 'all', editMode: false, dirty: new Set(), saving: false, loaded: false,
  searchQuery: '', user: null,
};

let lastDirtySize = 0;
let renderHeader = null; // lazy-cached, avoids re-importing on every call

export function markDirty(file) {
  const prevHas = state.dirty.has(file);
  state.dirty.add(file);
  // Only trigger header re-render when the visual count changes
  if (!prevHas && state.dirty.size !== lastDirtySize) {
    lastDirtySize = state.dirty.size;
    scheduleHeaderRender();
  }
}

export function clearDirtyTracker() {
  lastDirtySize = state.dirty.size;
}

function scheduleHeaderRender() {
  if (renderHeader) {
    queueMicrotask(renderHeader);
    return;
  }
  import('../components/header.js').then(m => {
    renderHeader = m.renderHeaderControls;
    renderHeader();
  });
}