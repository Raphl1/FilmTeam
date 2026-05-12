import { state } from '../core/state.js';
import { escapeHtml } from '../core/events.js';

export function renderSearch() {
  return `
    <div class="relative" id="search-wrapper">
      <div class="flex items-center gap-xs px-sm py-xs bg-bg border border-border rounded-sm w-[180px] md:w-[240px] transition-all duration-base focus-within:border-violet/50 focus-within:w-[260px] md:focus-within:w-[300px]">
        <i data-lucide="search" class="w-4 h-4 text-muted shrink-0"></i>
        <input type="text" placeholder="Suchen..." class="bg-transparent border-none outline-none text-sm text-txt w-full placeholder:text-muted" data-action="search-input" id="global-search-input" autocomplete="off" />
      </div>
      <div class="absolute top-full left-0 right-0 mt-xs bg-card border border-border rounded shadow-md max-h-[320px] overflow-y-auto z-[500] hidden" id="search-results"></div>
    </div>
  `;
}

export function getSearchResults(query) {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();
  const results = [];

  // Search locations
  if (state.locations) {
    state.locations.forEach(loc => {
      if (loc.name.toLowerCase().includes(q) || (loc.concrete && loc.concrete.toLowerCase().includes(q))) {
        results.push({ type: 'location', label: loc.name, sub: loc.concrete, route: 'locations' });
      }
    });
  }

  // Search team members / casting
  if (state.team) {
    if (state.team.roles) {
      state.team.roles.forEach(role => {
        if ((role.assigned && role.assigned.toLowerCase().includes(q)) || role.title.toLowerCase().includes(q)) {
          results.push({ type: 'team', label: role.title, sub: role.assigned || 'Unbesetzt', route: 'team' });
        }
      });
    }
    if (state.team.filmrollen) {
      state.team.filmrollen.forEach(role => {
        if ((role.assigned && role.assigned.toLowerCase().includes(q)) || role.title.toLowerCase().includes(q)) {
          results.push({ type: 'team', label: role.title, sub: role.assigned || 'Unbesetzt', route: 'team' });
        }
      });
    }
  }

  // Search kanban tasks
  if (state.kanban && state.kanban.tasks) {
    state.kanban.tasks.forEach(task => {
      if (task.title.toLowerCase().includes(q) || (task.description && task.description.toLowerCase().includes(q))) {
        results.push({ type: 'kanban', label: task.title, sub: task.status, route: 'kanban' });
      }
    });
  }

  // Search contacts
  if (state.contacts && state.contacts.contacts) {
    state.contacts.contacts.forEach(c => {
      if (c.name.toLowerCase().includes(q) || (c.role && c.role.toLowerCase().includes(q))) {
        results.push({ type: 'contact', label: c.name, sub: c.role, route: 'contacts' });
      }
    });
  }

  return results.slice(0, 12);
}

export function renderSearchResults(results) {
  const container = document.getElementById('search-results');
  if (!container) return;
  if (results.length === 0) {
    container.classList.add('hidden');
    container.innerHTML = '';
    return;
  }
  const icons = { location: 'map-pin', team: 'users', kanban: 'kanban', contact: 'phone' };
  container.innerHTML = results.map(r => `
    <a href="#${r.route}" class="flex items-center gap-sm px-md py-sm no-underline hover:bg-card2 transition-colors duration-base border-b border-border last:border-b-0 search-result-item" data-search-route="${r.route}">
      <i data-lucide="${icons[r.type] || 'circle'}" class="w-4 h-4 text-violet shrink-0"></i>
      <div class="flex flex-col min-w-0">
        <span class="text-sm text-txt font-medium truncate">${escapeHtml(r.label)}</span>
        <span class="text-xs text-muted truncate">${escapeHtml(r.sub || '')}</span>
      </div>
      <span class="text-[10px] text-muted ml-auto px-xs py-[1px] rounded-full bg-bg border border-border shrink-0">${r.type}</span>
    </a>
  `).join('');
  container.classList.remove('hidden');
  if (window.lucide) window.lucide.createIcons();
}
