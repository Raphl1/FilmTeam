import { state } from '../core/state.js';
import { renderSearch } from './search.js';
import { openBottomSheet, closeBottomSheet } from './bottom-sheet.js';

const LUCIDE = {
  'hub':'layout-grid','my-tasks':'user','kanban':'kanban','locations':'map-pin',
  'schedule':'calendar','team':'users','equipment':'camera','budget':'wallet',
  'timeline':'clock','contacts':'phone','calendar':'calendar-days'
};

// Primary mobile nav items (4 + More)
const MOBILE_PRIMARY = ['hub', 'my-tasks', 'locations', 'schedule'];
const MOBILE_PRIMARY_LABELS = { 'hub': 'Heute', 'my-tasks': 'Aufgaben', 'locations': 'Drehorte', 'schedule': 'Drehplan' };
const MOBILE_PRIMARY_ICONS = { 'hub': 'home', 'my-tasks': 'check-square', 'locations': 'map-pin', 'schedule': 'calendar' };

// Desktop sidebar groups
const NAV_GROUPS = [
  { label: 'On-Set', items: ['hub', 'my-tasks', 'kanban', 'locations', 'schedule'] },
  { label: 'Planung', items: ['team', 'equipment', 'budget', 'timeline', 'contacts', 'calendar'] }
];

const NAV_CLS = 'nav-item group relative flex items-center gap-sm px-md py-sm min-h-[44px] rounded-sm text-muted no-underline overflow-hidden whitespace-nowrap transition-all duration-base hover:text-txt hover:bg-violet/[.06]';

export function renderShell(route) {
  const app = document.getElementById('app');
  if (!state.config) {
    const msg = document.createElement('div');
    msg.className = 'flex items-center justify-center h-screen text-muted';
    msg.textContent = 'Konfiguration fehlt';
    app.replaceChildren(msg);
    return;
  }
  const { navigation, project } = state.config;
  const theme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  localStorage.setItem('theme', theme);
  document.body.className = theme;

  // Build grouped sidebar nav (trusted internal data from config.json)
  const sidebarNav = NAV_GROUPS.map(group => {
    const items = group.items
      .map(id => navigation.find(n => n.id === id))
      .filter(Boolean)
      .map(item => {
        const a = document.createElement('a');
        a.href = `#${item.id}`;
        a.className = NAV_CLS;
        a.dataset.route = item.id;
        a.dataset.tooltip = item.label;
        a.innerHTML = `<span class="nav-active-bar absolute left-0 top-[20%] bottom-[20%] w-[3px] rounded-full bg-violet opacity-0 transition-opacity duration-base"></span><i data-lucide="${LUCIDE[item.id] || 'circle'}" class="w-5 h-5 shrink-0 transition-transform duration-base group-hover:scale-110"></i><span class="text-sm nav-label transition-all duration-medium"></span>`;
        a.querySelector('.nav-label').textContent = item.label;
        return a.outerHTML;
      })
      .join('');
    return `<div class="nav-group mb-sm"><div class="nav-group-label text-[.6rem] uppercase tracking-wider text-muted/60 font-bold px-md pt-sm pb-xs nav-label">${group.label}</div>${items}</div>`;
  }).join('');

  // Mobile bottom nav: 4 primary + More button
  const mobileNavItems = MOBILE_PRIMARY.map(id => {
    const a = document.createElement('a');
    a.href = `#${id}`;
    a.className = 'bottom-nav-item flex flex-col items-center justify-center gap-[2px] px-sm py-xs min-w-[64px] min-h-[56px] text-muted no-underline rounded-sm transition-all duration-base';
    a.dataset.route = id;
    a.innerHTML = `<i data-lucide="${MOBILE_PRIMARY_ICONS[id]}" class="w-[22px] h-[22px] transition-transform duration-base"></i><span class="text-[.65rem] font-semibold whitespace-nowrap"></span>`;
    a.querySelector('span').textContent = MOBILE_PRIMARY_LABELS[id];
    return a.outerHTML;
  }).join('');

  // Construct full layout
  const layout = document.createElement('div');
  layout.className = 'flex min-h-screen min-h-[100dvh] animate-fadeIn';

  // Use innerHTML for the complex layout structure — all data is from trusted internal config
  layout.innerHTML = `
    <aside class="sidebar w-[220px] min-h-screen bg-card border-r border-border flex flex-col sticky top-0 h-screen overflow-y-auto overflow-x-hidden transition-[width] duration-medium shrink-0 z-50 max-md:hidden" id="sidebar">
      <div class="flex items-center gap-sm px-md py-md border-b border-border min-h-[60px] overflow-hidden">
        <a href="#hub" class="flex items-center gap-sm no-underline">
          <span class="text-[1.4rem] shrink-0">🎬</span>
          <span class="text-base font-extrabold tracking-tight whitespace-nowrap transition-opacity duration-medium sidebar-logo-text text-txt hover:text-lilac">FR<span class="text-lilac">(AI)</span>ME</span>
        </a>
      </div>
      <nav class="flex-1 flex flex-col p-sm overflow-hidden" id="main-nav">${sidebarNav}</nav>
      <button class="m-sm p-sm bg-transparent border border-border rounded-sm text-muted cursor-pointer flex items-center justify-center transition-all duration-base hover:bg-violet/[.08] hover:text-violet min-h-[36px] sidebar-toggle" id="sidebar-toggle" aria-label="Sidebar umschalten">
        <i data-lucide="chevrons-left"></i>
      </button>
    </aside>
    <div class="flex-1 min-w-0 flex flex-col">
      <header class="header-glow bg-card backdrop-blur-md sticky top-0 z-40" id="site-header">
        <div class="flex items-center justify-between px-lg py-sm max-w-main mx-auto w-full max-md:px-md max-md:py-xs">
          <div class="max-md:flex max-md:items-center max-md:gap-sm">
            <div class="text-xs font-semibold uppercase tracking-wider text-muted mb-1 max-md:hidden">${project.team}</div>
            <h1 class="text-lg font-extrabold tracking-tight text-txt max-md:text-base">FR<span class="text-lilac">(AI)</span>ME<span class="text-muted font-normal max-md:hidden"> — </span><span class="text-txt2 font-semibold text-base max-md:hidden">Night of the Graduates</span></h1>
            <div class="text-sm text-muted mt-[2px] max-md:hidden">Vollständige Projektplanung · 2026</div>
          </div>
          <div class="flex items-center gap-sm" id="header-actions"></div>
        </div>
        <div class="px-lg pb-sm max-w-main mx-auto w-full max-md:hidden">${renderSearch()}</div>
      </header>
      <nav class="hidden max-md:flex fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border z-[200] bottom-nav-bar justify-around items-center" style="padding-bottom:max(4px,env(safe-area-inset-bottom))" id="bottom-nav">
        ${mobileNavItems}
        <button class="bottom-nav-item flex flex-col items-center justify-center gap-[2px] px-sm py-xs min-w-[64px] min-h-[56px] text-muted rounded-sm transition-all duration-base" id="bottom-nav-more" aria-label="Mehr anzeigen">
          <i data-lucide="more-horizontal" class="w-[22px] h-[22px]"></i>
          <span class="text-[.65rem] font-semibold">Mehr</span>
        </button>
      </nav>
      <main class="flex-1 max-w-main px-lg py-xl pb-2xl max-md:px-md max-md:pb-[calc(24px+72px+env(safe-area-inset-bottom))]">
        <div class="view-container" id="view-container"></div>
      </main>
    </div>
  `;

  app.replaceChildren(layout);

  // Sidebar collapse state
  const collapsed = localStorage.getItem('sidebar_collapsed') === 'true';
  if (collapsed) {
    const s = document.getElementById('sidebar');
    if (s) {
      s.classList.add('collapsed');
      s.style.width = '64px';
      s.querySelectorAll('.nav-label').forEach(l => { l.style.opacity = '0'; l.style.width = '0'; l.style.overflow = 'hidden'; });
      const logoText = s.querySelector('.sidebar-logo-text');
      if (logoText) logoText.style.opacity = '0';
      const toggle = s.querySelector('.sidebar-toggle');
      if (toggle) toggle.style.transform = 'rotate(180deg)';
    }
  }
  if (window.lucide) window.lucide.createIcons();

  // Sidebar toggle handler
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

  // "More" button opens bottom sheet with remaining nav items
  document.getElementById('bottom-nav-more')?.addEventListener('click', () => {
    const moreItems = navigation
      .filter(item => !MOBILE_PRIMARY.includes(item.id))
      .map(item => `<a href="#${item.id}" class="bottom-sheet-nav-item flex items-center gap-md px-lg py-md text-txt no-underline rounded-sm transition-all duration-base hover:bg-violet/[.08]" data-route="${item.id}"><i data-lucide="${LUCIDE[item.id] || 'circle'}" class="w-5 h-5 text-muted"></i><span class="text-sm font-medium">${item.label}</span></a>`)
      .join('');

    openBottomSheet(moreItems, { title: 'Navigation' });

    // Close sheet when a nav item is clicked
    setTimeout(() => {
      document.querySelectorAll('.bottom-sheet-nav-item').forEach(el => {
        el.addEventListener('click', () => closeBottomSheet());
      });
    }, 50);
  });
}
