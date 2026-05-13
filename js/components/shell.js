import { state } from '../core/state.js';
import { renderSearch } from './search.js';

const LUCIDE = {
  'hub':'layout-grid','my-tasks':'user','kanban':'kanban','locations':'map-pin',
  'schedule':'calendar','team':'users','equipment':'camera','budget':'wallet',
  'timeline':'clock','contacts':'phone','calendar':'calendar-days'
};

const NAV_CLS = 'nav-item group relative flex items-center gap-sm px-md py-sm min-h-[44px] rounded-sm text-muted no-underline overflow-hidden whitespace-nowrap transition-all duration-base hover:text-txt hover:bg-violet/[.06]';

export function renderShell(route) {
  const app = document.getElementById('app');
  if (!state.config) {
    app.innerHTML = '<div class="flex items-center justify-center h-screen text-muted">Konfiguration fehlt</div>';
    return;
  }
  const { navigation, project } = state.config;
  const theme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  localStorage.setItem('theme', theme);
  document.body.className = theme;

  const navItems = navigation.map(item => {
    return `<a href="#${item.id}" class="${NAV_CLS}" data-route="${item.id}" data-tooltip="${item.label}">
      <span class="nav-active-bar absolute left-0 top-[20%] bottom-[20%] w-[3px] rounded-full bg-violet opacity-0 transition-opacity duration-base"></span>
      <i data-lucide="${LUCIDE[item.id] || 'circle'}" class="w-5 h-5 shrink-0 transition-transform duration-base group-hover:scale-110"></i>
      <span class="text-sm nav-label transition-all duration-medium">${item.label}</span>
    </a>`;
  }).join('');

  const bottomItems = navigation.map(item => {
    return `<a href="#${item.id}" class="bottom-nav-item flex flex-col items-center justify-center gap-[2px] px-sm py-xs min-w-[56px] min-h-[56px] text-muted no-underline rounded-sm shrink-0 transition-all duration-base" data-route="${item.id}">
      <i data-lucide="${LUCIDE[item.id] || 'circle'}" class="w-[24px] h-[24px] transition-transform duration-base"></i>
      <span class="text-[.6rem] font-semibold whitespace-nowrap">${item.label}</span>
    </a>`;
  }).join('');

  app.innerHTML = `
    <div class="flex min-h-screen min-h-[100dvh] animate-fadeIn">
      <aside class="sidebar w-[220px] min-h-screen bg-card border-r border-border flex flex-col sticky top-0 h-screen overflow-y-auto overflow-x-hidden transition-[width] duration-medium shrink-0 z-50 max-md:hidden" id="sidebar">
        <div class="flex items-center gap-sm px-md py-md border-b border-border min-h-[60px] overflow-hidden">
          <a href="#hub" class="flex items-center gap-sm no-underline">
            <span class="text-[1.4rem] shrink-0">🎬</span>
            <span class="text-base font-extrabold tracking-tight whitespace-nowrap transition-opacity duration-medium sidebar-logo-text text-txt hover:text-lilac">FR<span class="text-lilac">(AI)</span>ME</span>
          </a>
        </div>
        <nav class="flex-1 flex flex-col gap-[2px] p-sm overflow-hidden" id="main-nav">${navItems}</nav>
        <button class="m-sm p-sm bg-transparent border border-border rounded-sm text-muted cursor-pointer flex items-center justify-center transition-all duration-base hover:bg-violet/[.08] hover:text-violet min-h-[36px] sidebar-toggle" id="sidebar-toggle" aria-label="Sidebar umschalten">
          <i data-lucide="chevrons-left"></i>
        </button>
      </aside>
      <div class="flex-1 min-w-0 flex flex-col">
        <header class="header-glow bg-card backdrop-blur-md sticky top-0 z-40" id="site-header">
          <div class="flex items-center justify-between px-lg py-md max-w-main mx-auto w-full">
            <div>
              <div class="text-xs font-semibold uppercase tracking-wider text-muted mb-1">${project.team}</div>
              <h1 class="text-lg font-extrabold tracking-tight text-txt">FR<span class="text-lilac">(AI)</span>ME<span class="text-muted font-normal"> — </span><span class="text-txt2 font-semibold text-base">Night of the Graduates</span></h1>
              <div class="text-sm text-muted mt-[2px]">Vollständige Projektplanung · 2026</div>
            </div>
            <div class="flex items-center gap-sm" id="header-actions"></div>
          </div>
          <div class="px-lg pb-sm max-w-main mx-auto w-full max-md:hidden">${renderSearch()}</div>
        </header>
        <nav class="hidden max-md:flex fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border px-xs z-[200] overflow-x-auto bottom-nav-bar" style="-webkit-overflow-scrolling:touch;scrollbar-width:none;padding-bottom:max(4px,env(safe-area-inset-bottom))" id="bottom-nav">${bottomItems}</nav>
        <main class="flex-1 max-w-main px-lg py-xl pb-2xl max-md:px-md max-md:pb-[calc(24px+72px+env(safe-area-inset-bottom))]">
          <div class="view-container" id="view-container"></div>
        </main>
      </div>
    </div>
  `;

  const collapsed = localStorage.getItem('sidebar_collapsed') === 'true';
  if (collapsed) document.getElementById('sidebar')?.classList.add('collapsed');
  if (window.lucide) window.lucide.createIcons();

  document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
    const s = document.getElementById('sidebar');
    const isCollapsed = s.classList.toggle('collapsed');
    localStorage.setItem('sidebar_collapsed', String(isCollapsed));
    if (isCollapsed) {
      s.style.width = '64px';
      s.querySelectorAll('.nav-label').forEach(l => { l.style.opacity = '0'; l.style.width = '0'; l.style.overflow = 'hidden'; });
      s.querySelector('.sidebar-logo-text').style.opacity = '0';
      s.querySelector('.sidebar-toggle').style.transform = 'rotate(180deg)';
    } else {
      s.style.width = '220px';
      s.querySelectorAll('.nav-label').forEach(l => { l.style.opacity = '1'; l.style.width = 'auto'; l.style.overflow = 'visible'; });
      s.querySelector('.sidebar-logo-text').style.opacity = '1';
      s.querySelector('.sidebar-toggle').style.transform = 'rotate(0deg)';
    }
    if (window.lucide) window.lucide.createIcons();
  });
}
