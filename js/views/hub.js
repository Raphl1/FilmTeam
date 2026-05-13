import { state } from '../core/state.js';
import { escapeHtml } from '../core/events.js';
import { getShootContext, getMyOpenTasks, getUrgentTasks, getProgressKPIs } from '../core/derive.js';

function navUrl(query) {
  const q = encodeURIComponent(query);
  if (typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent)) return 'https://maps.apple.com/?q=' + q;
  return 'https://www.google.com/maps/search/?api=1&query=' + q;
}

function parseShootTime(timeStr) {
  if (!timeStr) return null;
  const m = String(timeStr).match(/(\d{1,2}):(\d{2})\s*[\u2013-]\s*(?:(\d{1,2}):(\d{2})|Sunset|sunset)/);
  if (!m) return null;
  const now = new Date();
  const start = new Date(now); start.setHours(parseInt(m[1], 10), parseInt(m[2], 10), 0, 0);
  let end = null;
  if (m[3]) { end = new Date(now); end.setHours(parseInt(m[3], 10), parseInt(m[4], 10), 0, 0); }
  return { start, end };
}

function fmtRem(ms) {
  if (ms <= 0) return 'jetzt';
  const min = Math.floor(ms / 60000);
  if (min < 60) return 'in ' + min + ' Min';
  const h = Math.floor(min / 60); const r = min % 60;
  return r ? 'in ' + h + 'h ' + r + 'm' : 'in ' + h + 'h';
}

function renderContextBanner(ctx) {
  if (ctx.phase === 'shooting' && ctx.shootDay) {
    const sd = ctx.shootDay;
    const t = parseShootTime(sd.time);
    let live = '';
    if (t) {
      const now = new Date();
      if (now < t.start) live = '<span class="text-xs px-sm py-xs rounded-full bg-violet/15 text-violet font-bold">Start ' + fmtRem(t.start - now) + '</span>';
      else if (t.end && now > t.end) live = '<span class="text-xs px-sm py-xs rounded-full bg-muted/15 text-muted font-bold">Wrap</span>';
      else live = '<span class="text-xs px-sm py-xs rounded-full bg-green/15 text-green font-bold animate-pulse">LIVE</span>';
    }
    return '<div class="bg-green/10 border border-green/30 rounded-sm p-lg mb-lg animate-fadeIn">'
      + '<div class="flex items-center justify-between gap-sm mb-sm flex-wrap">'
      + '<div class="flex items-center gap-sm"><span class="text-2xl" aria-hidden="true">' + (sd.icon || '🎬') + '</span><span class="text-lg font-extrabold text-green">Drehtag ' + sd.day + '</span></div>'
      + live + '</div>'
      + '<div class="text-xl font-bold text-txt mb-xs">' + escapeHtml(sd.title || '') + '</div>'
      + '<div class="flex items-center gap-sm text-sm text-muted"><i data-lucide="clock" class="w-4 h-4"></i><span>' + escapeHtml(sd.time || '') + '</span></div>'
      + '</div>';
  }
  if (ctx.phase === 'pre') {
    const cls = ctx.diff <= 7 ? 'text-accent' : ctx.diff <= 14 ? 'text-gold' : 'text-violet';
    const fd = ctx.firstDay;
    return '<div class="bg-card border border-border rounded-sm p-lg mb-lg animate-fadeIn">'
      + '<div class="flex items-center gap-sm mb-xs"><span class="text-2xl" aria-hidden="true">🎬</span><span class="text-base ' + cls + ' font-bold">Noch ' + ctx.diff + ' Tag' + (ctx.diff !== 1 ? 'e' : '') + ' bis zum ersten Drehtag</span></div>'
      + (fd ? '<span class="text-sm text-muted">' + escapeHtml(fd.title || '') + ' · ' + escapeHtml(fd.time || '') + '</span>' : '')
      + '</div>';
  }
  if (ctx.phase === 'shooting-break' && ctx.nextDay) {
    const nd = ctx.nextDay;
    return '<div class="bg-card border border-border rounded-sm p-lg mb-lg animate-fadeIn">'
      + '<div class="flex items-center gap-sm mb-xs"><span class="text-2xl" aria-hidden="true">🎬</span><span class="text-base text-violet font-bold">Heute kein Dreh — nächster Drehtag: ' + escapeHtml(nd.title || '') + '</span></div>'
      + '<span class="text-sm text-muted">' + escapeHtml(nd.date || '') + ' · ' + escapeHtml(nd.time || '') + '</span>'
      + '</div>';
  }
  if (ctx.phase === 'post') {
    return '<div class="bg-card border border-border rounded-sm p-lg mb-lg animate-fadeIn">'
      + '<div class="flex items-center gap-sm"><span class="text-2xl" aria-hidden="true">🎞️</span><span class="text-base text-muted font-bold">Post-Production</span></div>'
      + '<span class="text-sm text-muted mt-xs block">Dreh abgeschlossen · Premiere: 20. November 2026</span>'
      + '</div>';
  }
  return '';
}

function renderTodayLocations(ctx) {
  if (ctx.phase !== 'shooting' || !ctx.shootDay) return '';
  const sd = ctx.shootDay;
  if (!sd.locationIds || sd.locationIds.length === 0) return '';
  const items = sd.locationIds.map(id => {
    const loc = (state.locations || []).find(l => l.id === id);
    if (!loc) return '';
    const concrete = loc.concrete ? escapeHtml(loc.concrete) : '';
    const target = loc.mapLink || (loc.concrete ? navUrl(loc.concrete) : navUrl(loc.name || ''));
    return '<div class="flex items-center gap-sm py-sm border-b border-border last:border-0">'
      + '<i data-lucide="map-pin" class="w-4 h-4 text-violet shrink-0"></i>'
      + '<div class="flex-1 min-w-0"><div class="text-sm font-medium text-txt truncate">' + escapeHtml(loc.name) + '</div>'
      + (concrete ? '<div class="text-xs text-muted truncate">' + concrete + '</div>' : '')
      + '</div>'
      + '<a href="' + escapeHtml(target) + '" target="_blank" rel="noopener" class="shrink-0 px-sm py-xs rounded-sm bg-violet/10 text-violet hover:bg-violet/20 transition-all flex items-center gap-xs text-xs font-semibold" aria-label="Navigation zu ' + escapeHtml(loc.name) + '">'
      + '<i data-lucide="navigation" class="w-4 h-4"></i><span class="hidden md:inline">Navigieren</span></a>'
      + '</div>';
  }).join('');
  return '<div class="bg-card border border-border rounded-sm p-lg mb-lg">'
    + '<div class="flex items-center gap-sm mb-md"><i data-lucide="map-pin" class="w-5 h-5 text-violet"></i><h3 class="text-base font-bold text-txt">Heutige Locations</h3></div>'
    + items + '</div>';
}

function renderMyTasks() {
  const { list, isPersonal } = getMyOpenTasks(5);
  if (list.length === 0) return '';
  const label = isPersonal ? 'Meine nächsten Aufgaben' : 'Nächste Aufgaben';
  const items = list.map(t => {
    const dl = t.deadline ? '<span class="text-[10px] text-muted ml-auto shrink-0">' + escapeHtml(t.deadline) + '</span>' : '';
    return '<div class="flex items-center gap-sm py-sm border-b border-border last:border-0">'
      + '<input type="checkbox" data-action="toggle-task-check" data-task-id="' + escapeHtml(t.id) + '" class="w-5 h-5 shrink-0 accent-violet cursor-pointer" aria-label="Aufgabe ' + escapeHtml(t.title) + ' erledigt">'
      + '<div class="flex-1 min-w-0"><div class="text-sm font-medium text-txt truncate">' + escapeHtml(t.title) + '</div></div>'
      + dl + '</div>';
  }).join('');
  return '<div class="bg-card border border-border rounded-sm p-lg mb-lg">'
    + '<div class="flex items-center justify-between mb-md">'
    + '<div class="flex items-center gap-sm"><i data-lucide="check-square" class="w-5 h-5 text-violet"></i><h3 class="text-base font-bold text-txt">' + label + '</h3></div>'
    + '<a href="#my-tasks" class="text-xs text-violet hover:text-lilac no-underline">Alle →</a>'
    + '</div>' + items + '</div>';
}

function renderDeadlineWarnings() {
  const urgent = getUrgentTasks(3);
  if (urgent.length === 0) return '';
  const today0 = new Date(); today0.setHours(0, 0, 0, 0);
  const items = urgent.slice(0, 3).map(t => {
    const dl = new Date(t.deadline);
    const isOverdue = dl < today0;
    const cls = isOverdue ? 'text-accent' : 'text-gold';
    const icon = isOverdue ? 'alert-circle' : 'alert-triangle';
    return '<div class="flex items-center gap-sm py-xs">'
      + '<i data-lucide="' + icon + '" class="w-4 h-4 ' + cls + ' shrink-0"></i>'
      + '<span class="text-sm text-txt truncate flex-1">' + escapeHtml(t.title) + '</span>'
      + '<span class="text-[10px] ' + cls + ' shrink-0">' + escapeHtml(t.deadline) + '</span>'
      + '</div>';
  }).join('');
  return '<div class="bg-accent/5 border border-accent/20 rounded-sm p-md mb-lg animate-fadeIn">'
    + '<div class="text-xs font-bold uppercase tracking-wider text-accent mb-sm">Achtung — Deadlines</div>'
    + items + '</div>';
}

function renderQuickActions() {
  const tile = (route, icon, label) =>
    '<a href="#' + route + '" class="flex items-center gap-sm p-md bg-card border border-border rounded-sm no-underline hover:border-violet/30 hover:bg-violet/5 transition-all">'
    + '<i data-lucide="' + icon + '" class="w-5 h-5 text-violet"></i>'
    + '<span class="text-sm font-medium text-txt">' + label + '</span></a>';
  return '<div class="grid grid-cols-2 gap-sm mb-lg">'
    + tile('locations', 'map-pin', 'Drehorte')
    + tile('schedule', 'calendar', 'Drehplan')
    + tile('kanban', 'kanban', 'Kanban')
    + tile('budget', 'wallet', 'Budget')
    + '</div>';
}

function renderProgress() {
  const k = getProgressKPIs();
  const sections = [];
  if (k.locations) sections.push({ label: 'Locations bestätigt', value: k.locations.confirmed + '/' + k.locations.total, pct: k.locations.pct, color: 'bg-violet' });
  if (k.tasks) sections.push({ label: 'Tasks erledigt', value: k.tasks.done + '/' + k.tasks.total, pct: k.tasks.pct, color: 'bg-green' });
  if (k.equipment) sections.push({ label: 'Equipment bereit', value: k.equipment.checked + '/' + k.equipment.total, pct: k.equipment.pct, color: 'bg-gold' });
  if (sections.length === 0) return '';
  const bars = sections.map(s =>
    '<div class="flex flex-col gap-xs">'
    + '<div class="flex items-center justify-between"><span class="text-xs text-muted">' + s.label + '</span><span class="text-xs font-bold text-txt">' + s.value + '</span></div>'
    + '<div class="h-[6px] bg-border rounded-full overflow-hidden"><div class="' + s.color + ' h-full rounded-full transition-all duration-medium" style="width:' + s.pct + '%"></div></div>'
    + '</div>'
  ).join('');
  return '<div class="bg-card border border-border rounded-sm p-lg mb-lg">'
    + '<div class="flex items-center gap-sm mb-md"><i data-lucide="bar-chart-2" class="w-5 h-5 text-violet"></i><h3 class="text-base font-bold text-txt">Fortschritt</h3></div>'
    + '<div class="flex flex-col gap-md">' + bars + '</div>'
    + '</div>';
}

function renderExternalLinks() {
  return '<div class="flex gap-sm flex-wrap">'
    + '<a href="https://drive.google.com/drive/folders/1s1rMK-EZMx79g7yWUCoXA_Otdb4crZLi?usp=sharing" target="_blank" rel="noopener" class="flex items-center gap-xs px-md py-sm bg-card border border-border rounded-sm text-sm text-txt no-underline hover:border-violet/30 transition-all"><i data-lucide="hard-drive" class="w-4 h-4 text-violet"></i> Drive</a>'
    + '<a href="https://www.figma.com/board/TNmHCPlbfxyyKoEUt2qCqw/Night-Of-The-Graduates" target="_blank" rel="noopener" class="flex items-center gap-xs px-md py-sm bg-card border border-border rounded-sm text-sm text-txt no-underline hover:border-violet/30 transition-all"><i data-lucide="figma" class="w-4 h-4 text-violet"></i> Figma</a>'
    + '<button data-action="open-feedback" class="flex items-center gap-xs px-md py-sm bg-card border border-border rounded-sm text-sm text-txt no-underline hover:border-violet/30 transition-all cursor-pointer"><i data-lucide="message-circle" class="w-4 h-4 text-violet"></i> Feedback</button>'
    + '</div>';
}

export default async function viewHub() {
  if (!state.config) return '<p class="text-muted p-lg">Laden...</p>';
  const ctx = getShootContext();
  return renderContextBanner(ctx)
    + renderDeadlineWarnings()
    + renderTodayLocations(ctx)
    + renderMyTasks()
    + renderQuickActions()
    + renderProgress()
    + renderExternalLinks();
}
