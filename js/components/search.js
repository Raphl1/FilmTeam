import { state } from '../core/state.js';

let mobileSearchOpen = false;

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

/**
 * Returns HTML for the mobile search button (shown in header on mobile)
 */
export function renderMobileSearchButton() {
  return `<button class="hidden max-md:flex items-center justify-center w-9 h-9 rounded-sm text-muted hover:text-violet hover:bg-violet/10 transition-all" id="mobile-search-btn" aria-label="Suche öffnen"><i data-lucide="search" class="w-5 h-5"></i></button>`;
}

/**
 * Opens full-screen search overlay on mobile
 */
export function openMobileSearch() {
  if (mobileSearchOpen) return;
  mobileSearchOpen = true;

  const overlay = document.createElement('div');
  overlay.id = 'mobile-search-overlay';
  overlay.className = 'fixed inset-0 z-[400] bg-bg flex flex-col animate-fadeIn';

  const header = document.createElement('div');
  header.className = 'flex items-center gap-sm px-md py-sm border-b border-border';

  const searchIcon = document.createElement('i');
  searchIcon.dataset.lucide = 'search';
  searchIcon.className = 'w-5 h-5 text-muted shrink-0';

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Locations, Tasks, Kontakte...';
  input.className = 'flex-1 bg-transparent border-none outline-none text-base text-txt placeholder:text-muted';
  input.id = 'mobile-search-input';
  input.autocomplete = 'off';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'p-xs text-muted hover:text-txt transition-colors';
  closeBtn.setAttribute('aria-label', 'Suche schließen');
  closeBtn.textContent = 'Abbrechen';
  closeBtn.addEventListener('click', closeMobileSearch);

  header.appendChild(searchIcon);
  header.appendChild(input);
  header.appendChild(closeBtn);

  const results = document.createElement('div');
  results.id = 'mobile-search-results';
  results.className = 'flex-1 overflow-y-auto px-sm py-sm';

  overlay.appendChild(header);
  overlay.appendChild(results);
  document.body.appendChild(overlay);

  if (window.lucide) window.lucide.createIcons();
  input.focus();

  // Search on input
  input.addEventListener('input', () => {
    const query = input.value.trim();
    const searchResults = getSearchResults(query);
    renderMobileSearchResults(searchResults, results);
  });

  // Close on Escape
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMobileSearch();
  });
}

export function closeMobileSearch() {
  const overlay = document.getElementById('mobile-search-overlay');
  if (overlay) {
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 150ms ease';
    setTimeout(() => overlay.remove(), 150);
  }
  mobileSearchOpen = false;
}

function renderMobileSearchResults(results, container) {
  if (!container) return;
  container.textContent = '';

  if (results.length === 0) {
    if (document.getElementById('mobile-search-input')?.value.length >= 2) {
      const empty = document.createElement('div');
      empty.className = 'text-center text-muted text-sm py-xl';
      empty.textContent = 'Keine Ergebnisse';
      container.appendChild(empty);
    }
    return;
  }

  const icons = { location: 'map-pin', team: 'users', kanban: 'kanban', contact: 'phone' };
  results.forEach(r => {
    const a = document.createElement('a');
    a.href = `#${r.route}`;
    a.className = 'flex items-center gap-md px-md py-md no-underline rounded-sm hover:bg-card transition-colors';
    a.addEventListener('click', closeMobileSearch);

    const iconWrapper = document.createElement('div');
    iconWrapper.className = 'w-9 h-9 rounded-full bg-violet/10 flex items-center justify-center shrink-0';
    const icon = document.createElement('i');
    icon.dataset.lucide = icons[r.type] || 'circle';
    icon.className = 'w-4 h-4 text-violet';
    iconWrapper.appendChild(icon);

    const textWrapper = document.createElement('div');
    textWrapper.className = 'flex flex-col min-w-0 flex-1';
    const label = document.createElement('span');
    label.className = 'text-sm text-txt font-medium truncate';
    label.textContent = r.label;
    const sub = document.createElement('span');
    sub.className = 'text-xs text-muted truncate';
    sub.textContent = r.sub || '';
    textWrapper.appendChild(label);
    textWrapper.appendChild(sub);

    const badge = document.createElement('span');
    badge.className = 'text-[10px] text-muted px-xs py-[1px] rounded-full bg-card border border-border shrink-0';
    badge.textContent = r.type;

    a.appendChild(iconWrapper);
    a.appendChild(textWrapper);
    a.appendChild(badge);
    container.appendChild(a);
  });

  if (window.lucide) window.lucide.createIcons();
}

export function getSearchResults(query) {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();
  const results = [];

  if (state.locations) {
    state.locations.forEach(loc => {
      if (loc.name.toLowerCase().includes(q) || (loc.concrete && loc.concrete.toLowerCase().includes(q))) {
        results.push({ type: 'location', label: loc.name, sub: loc.concrete, route: 'locations' });
      }
    });
  }

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

  if (state.kanban && state.kanban.tasks) {
    state.kanban.tasks.forEach(task => {
      if (task.title.toLowerCase().includes(q) || (task.description && task.description.toLowerCase().includes(q))) {
        results.push({ type: 'kanban', label: task.title, sub: task.status, route: 'kanban' });
      }
    });
  }

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
  container.textContent = '';

  if (results.length === 0) {
    container.classList.add('hidden');
    return;
  }

  const icons = { location: 'map-pin', team: 'users', kanban: 'kanban', contact: 'phone' };
  results.forEach(r => {
    const a = document.createElement('a');
    a.href = `#${r.route}`;
    a.className = 'flex items-center gap-sm px-md py-sm no-underline hover:bg-card2 transition-colors duration-base border-b border-border last:border-b-0 search-result-item';
    a.dataset.searchRoute = r.route;

    const icon = document.createElement('i');
    icon.dataset.lucide = icons[r.type] || 'circle';
    icon.className = 'w-4 h-4 text-violet shrink-0';

    const textDiv = document.createElement('div');
    textDiv.className = 'flex flex-col min-w-0';
    const labelSpan = document.createElement('span');
    labelSpan.className = 'text-sm text-txt font-medium truncate';
    labelSpan.textContent = r.label;
    const subSpan = document.createElement('span');
    subSpan.className = 'text-xs text-muted truncate';
    subSpan.textContent = r.sub || '';
    textDiv.appendChild(labelSpan);
    textDiv.appendChild(subSpan);

    const badge = document.createElement('span');
    badge.className = 'text-[10px] text-muted ml-auto px-xs py-[1px] rounded-full bg-bg border border-border shrink-0';
    badge.textContent = r.type;

    a.appendChild(icon);
    a.appendChild(textDiv);
    a.appendChild(badge);
    container.appendChild(a);
  });

  container.classList.remove('hidden');
  if (window.lucide) window.lucide.createIcons();
}
