import { state } from '../core/state.js';

export function renderHeaderControls() {
  const actions = document.getElementById('header-actions');
  if (!actions) return;
  const theme = localStorage.getItem('theme') || 'dark';
  const header = document.getElementById('site-header');

  if (state.editMode) {
    if (header) header.classList.add('editing');
    actions.innerHTML = `
      <span class="text-xs font-bold text-accent uppercase tracking-wider animate-pulse-glow px-sm py-xs rounded-full border border-accent/30 bg-accent/10">Bearbeiten</span>
      <button class="w-9 h-9 rounded-sm flex items-center justify-center border border-border text-muted hover:bg-green/10 hover:text-green hover:border-green/30 transition-all duration-base cursor-pointer bg-transparent" data-action="save-changes" title="Speichern" ${state.saving ? 'disabled' : ''}>
        <i data-lucide="${state.saving ? 'loader' : 'save'}" class="w-[18px] h-[18px]"></i>
      </button>
      <button class="w-9 h-9 rounded-sm flex items-center justify-center border border-border text-muted hover:bg-accent/10 hover:text-accent hover:border-accent/30 transition-all duration-base cursor-pointer bg-transparent" data-action="cancel-edit" title="Abbrechen">
        <i data-lucide="x" class="w-[18px] h-[18px]"></i>
      </button>
      <button class="w-9 h-9 rounded-sm flex items-center justify-center border border-border text-muted hover:bg-violet/10 hover:text-violet transition-all duration-base cursor-pointer bg-transparent" data-action="toggle-theme" aria-label="Theme wechseln">
        <i data-lucide="${theme === 'dark' ? 'sun' : 'moon'}" class="w-[18px] h-[18px]"></i>
      </button>
    `;
  } else {
    if (header) header.classList.remove('editing');
    const userName = state.user?.displayName?.split(' ')[0] || '';
    actions.innerHTML = `
      ${userName ? `<span class="text-xs text-muted hidden md:inline">${userName}</span>` : ''}
      <button class="w-9 h-9 rounded-sm flex items-center justify-center border border-border text-muted hover:bg-violet/10 hover:text-violet hover:border-violet/30 transition-all duration-base cursor-pointer bg-transparent" data-action="enter-edit" title="Bearbeiten">
        <i data-lucide="pencil" class="w-[18px] h-[18px]"></i>
      </button>
      <button class="w-9 h-9 rounded-sm flex items-center justify-center border border-border text-muted hover:bg-green/10 hover:text-green transition-all duration-base cursor-pointer bg-transparent" data-action="force-refresh" title="Daten neu laden">
        <i data-lucide="refresh-cw" class="w-[18px] h-[18px]"></i>
      </button>
      <button class="w-9 h-9 rounded-sm flex items-center justify-center border border-border text-muted hover:bg-violet/10 hover:text-violet transition-all duration-base cursor-pointer bg-transparent" data-action="toggle-theme" aria-label="Theme wechseln">
        <i data-lucide="${theme === 'dark' ? 'sun' : 'moon'}" class="w-[18px] h-[18px]"></i>
      </button>
      <button class="w-9 h-9 rounded-sm flex items-center justify-center border border-border text-muted hover:bg-accent/10 hover:text-accent transition-all duration-base cursor-pointer bg-transparent" data-action="logout" title="Abmelden">
        <i data-lucide="log-out" class="w-[18px] h-[18px]"></i>
      </button>
    `;
  }
  if (window.lucide) window.lucide.createIcons();
}
