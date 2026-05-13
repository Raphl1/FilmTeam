import { state } from '../core/state.js';
import { openMobileSearch } from './search.js';

export function renderHeaderControls() {
  const actions = document.getElementById('header-actions');
  if (!actions) return;
  const theme = localStorage.getItem('theme') || 'dark';
  const header = document.getElementById('site-header');

  if (state.editMode) {
    if (header) header.classList.add('editing');
    actions.innerHTML = `
      <span class="text-xs font-bold text-accent uppercase tracking-wider animate-pulse-glow px-sm py-xs rounded-full border border-accent/30 bg-accent/10">Bearbeiten</span>
      <button class="w-9 h-9 rounded-sm flex items-center justify-center border border-border text-muted hover:bg-green/10 hover:text-green hover:border-green/30 cursor-pointer bg-transparent relative" data-action="save-changes" aria-label="Änderungen speichern" ${state.saving ? 'disabled' : ''}>
        <i data-lucide="${state.saving ? 'loader' : 'save'}" class="w-[18px] h-[18px]"></i>
        ${state.dirty.size > 0 ? `<span class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent text-white text-[9px] font-bold flex items-center justify-center">${state.dirty.size}</span>` : ''}
      </button>
      <button class="w-9 h-9 rounded-sm flex items-center justify-center border border-border text-muted hover:bg-accent/10 hover:text-accent hover:border-accent/30 cursor-pointer bg-transparent" data-action="cancel-edit" aria-label="Bearbeiten abbrechen">
        <i data-lucide="x" class="w-[18px] h-[18px]"></i>
      </button>
      <button class="w-9 h-9 rounded-sm flex items-center justify-center border border-border text-muted hover:bg-violet/10 hover:text-violet cursor-pointer bg-transparent" data-action="toggle-theme" aria-label="Theme wechseln">
        <i data-lucide="${theme === 'dark' ? 'sun' : 'moon'}" class="w-[18px] h-[18px]"></i>
      </button>
    `;
  } else {
    if (header) header.classList.remove('editing');
    const userName = state.user?.displayName?.split(' ')[0] || '';

    // Build header buttons using DOM for safety
    actions.textContent = '';

    if (userName) {
      const nameSpan = document.createElement('span');
      nameSpan.className = 'text-xs text-muted hidden md:inline';
      nameSpan.textContent = userName;
      actions.appendChild(nameSpan);
    }

    // Mobile search button
    const searchBtn = document.createElement('button');
    searchBtn.className = 'w-9 h-9 rounded-sm flex items-center justify-center border border-border text-muted hover:bg-violet/10 hover:text-violet hover:border-violet/30 cursor-pointer bg-transparent hidden max-md:flex';
    searchBtn.id = 'mobile-search-btn';
    searchBtn.setAttribute('aria-label', 'Suche öffnen');
    searchBtn.innerHTML = '<i data-lucide="search" class="w-[18px] h-[18px]"></i>';
    searchBtn.addEventListener('click', openMobileSearch);
    actions.appendChild(searchBtn);

    // Edit button
    const editBtn = document.createElement('button');
    editBtn.className = 'w-9 h-9 rounded-sm flex items-center justify-center border border-border text-muted hover:bg-violet/10 hover:text-violet hover:border-violet/30 cursor-pointer bg-transparent';
    editBtn.dataset.action = 'enter-edit';
    editBtn.setAttribute('aria-label', 'Bearbeitungsmodus starten');
    editBtn.innerHTML = '<i data-lucide="pencil" class="w-[18px] h-[18px]"></i>';
    actions.appendChild(editBtn);

    // Refresh button
    const refreshBtn = document.createElement('button');
    refreshBtn.className = 'w-9 h-9 rounded-sm flex items-center justify-center border border-border text-muted hover:bg-green/10 hover:text-green cursor-pointer bg-transparent';
    refreshBtn.dataset.action = 'force-refresh';
    refreshBtn.setAttribute('aria-label', 'Daten neu laden');
    refreshBtn.innerHTML = '<i data-lucide="refresh-cw" class="w-[18px] h-[18px]"></i>';
    actions.appendChild(refreshBtn);

    // Theme toggle
    const themeBtn = document.createElement('button');
    themeBtn.className = 'w-9 h-9 rounded-sm flex items-center justify-center border border-border text-muted hover:bg-violet/10 hover:text-violet cursor-pointer bg-transparent';
    themeBtn.dataset.action = 'toggle-theme';
    themeBtn.setAttribute('aria-label', 'Theme wechseln');
    themeBtn.innerHTML = `<i data-lucide="${theme === 'dark' ? 'sun' : 'moon'}" class="w-[18px] h-[18px]"></i>`;
    actions.appendChild(themeBtn);

    // Logout button
    const logoutBtn = document.createElement('button');
    logoutBtn.className = 'w-9 h-9 rounded-sm flex items-center justify-center border border-border text-muted hover:bg-accent/10 hover:text-accent cursor-pointer bg-transparent';
    logoutBtn.dataset.action = 'logout';
    logoutBtn.setAttribute('aria-label', 'Abmelden');
    logoutBtn.innerHTML = '<i data-lucide="log-out" class="w-[18px] h-[18px]"></i>';
    actions.appendChild(logoutBtn);
  }
  if (window.lucide) window.lucide.createIcons();
}
