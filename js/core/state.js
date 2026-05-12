export const state = {
  config: null, locations: null, schedule: null, contacts: null,
  team: null, equipment: null, budget: null, timeline: null, kanban: null,
  activeFilter: 'all', teamFilter: 'all', editMode: false, dirty: new Set(), saving: false, loaded: false,
  searchQuery: '', user: null,
};

export function markDirty(file) {
  state.dirty.add(file);
  import('../components/header.js').then(m => m.renderHeaderControls());
}
