import { state } from '../core/state.js';
import { escapeHtml, getEquipmentChecked } from '../core/events.js';

// Shooting days mapping (17-21 June 2026)
const SHOOT_DAYS = [
  { day: 1, date: '2026-06-17', title: 'WG & Treppenhaus', locations: ['WG—Flur & Eingang', 'WG—Zimmer BWL-Student', 'WG—Atelier Kreative', 'Treppenhaus & Sicherungskeller'], time: '10:00–20:00' },
  { day: 2, date: '2026-06-18', title: 'Techniker-Base', locations: ['Techniker-Keller/Base'], time: '14:00–20:00' },
  { day: 3, date: '2026-06-19', title: 'Gastronomie', locations: ['Restaurant/Café (Date)', 'Café-Terrasse'], time: '15:00–21:00' },
  { day: 4, date: '2026-06-20', title: 'Außen-Countdown', locations: ['Parkbank', 'Treppe (Rocky)', 'Western-Kulisse', 'Regen-Außenbereich', 'Sonnenuntergang'], time: '08:00–Sunset' },
  { day: 5, date: '2026-06-21', title: 'Spezial-Setups', locations: ['Tanzfläche', 'Bar/Kneipe', 'Piano-Raum'], time: '16:00–22:00' }
];

function getShootContext() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const shootStart = new Date('2026-06-17');
  const shootEnd = new Date('2026-06-21');
  const diff = Math.ceil((shootStart - today) / (1000 * 60 * 60 * 24));

  // Find today's shoot day
  const todayStr = today.toISOString().split('T')[0];
  const currentShootDay = SHOOT_DAYS.find(d => d.date === todayStr);

  if (currentShootDay) {
    return { phase: 'shooting', diff: 0, shootDay: currentShootDay };
  } else if (diff > 0) {
    return { phase: 'pre', diff };
  } else if (today > shootEnd) {
    const postDiff = Math.ceil((today - shootEnd) / (1000 * 60 * 60 * 24));
    return { phase: 'post', diff: postDiff };
  } else {
    // Between shoot days (weekend etc.)
    return { phase: 'shooting-break', diff: 0 };
  }
}

function renderContextBanner(ctx) {
  if (ctx.phase === 'shooting' && ctx.shootDay) {
    const sd = ctx.shootDay;
    return `
      <div class="bg-green/10 border border-green/30 rounded-sm p-lg mb-lg animate-fadeIn">
        <div class="flex items-center gap-sm mb-sm">
          <span class="text-2xl">🎬</span>
          <span class="text-lg font-extrabold text-green">Drehtag ${sd.day} von 5</span>
        </div>
        <div class="text-xl font-bold text-txt mb-xs">${escapeHtml(sd.title)}</div>
        <div class="flex items-center gap-sm text-sm text-muted">
          <i data-lucide="clock" class="w-4 h-4"></i>
          <span>${escapeHtml(sd.time)}</span>
        </div>
      </div>`;
  }
  if (ctx.phase === 'pre') {
    const urgency = ctx.diff <= 7 ? 'text-accent' : ctx.diff <= 14 ? 'text-gold' : 'text-violet';
    return `
      <div class="bg-card border border-border rounded-sm p-lg mb-lg animate-fadeIn">
        <div class="flex items-center gap-sm mb-xs">
          <span class="text-2xl">🎬</span>
          <span class="text-base ${urgency} font-bold">Noch ${ctx.diff} Tag${ctx.diff !== 1 ? 'e' : ''} bis zum Dreh</span>
        </div>
        <span class="text-sm text-muted">Erster Drehtag: 17. Juni 2026 · Premiere: 20. November 2026</span>
      </div>`;
  }
  if (ctx.phase === 'post') {
    return `
      <div class="bg-card border border-border rounded-sm p-lg mb-lg animate-fadeIn">
        <div class="flex items-center gap-sm">
          <span class="text-2xl">🎞️</span>
          <span class="text-base text-muted font-bold">Post-Production</span>
        </div>
        <span class="text-sm text-muted mt-xs block">Dreh abgeschlossen · Premiere: 20. November 2026</span>
      </div>`;
  }
  return '';
}

function renderTodayLocation(ctx) {
  if (ctx.phase !== 'shooting' || !ctx.shootDay) return '';
  const sd = ctx.shootDay;
  const locationItems = sd.locations.map(loc => {
    const match = state.locations?.find(l => l.name && l.name.includes(loc.split('—')[0]));
    const concrete = match?.concrete ? escapeHtml(match.concrete) : '';
    return `<div class="flex items-center gap-sm py-sm border-b border-border last:border-0">
      <i data-lucide="map-pin" class="w-4 h-4 text-violet shrink-0"></i>
      <div class="flex-1 min-w-0">
        <div class="text-sm font-medium text-txt truncate">${escapeHtml(loc)}</div>
        ${concrete ? `<div class="text-xs text-muted truncate">${concrete}</div>` : ''}
      </div>
      ${match?.mapUrl ? `<a href="${escapeHtml(match.mapUrl)}" target="_blank" rel="noopener" class="shrink-0 p-xs rounded-sm bg-violet/10 text-violet hover:bg-violet/20 transition-all" aria-label="Navigation öffnen"><i data-lucide="navigation" class="w-4 h-4"></i></a>` : ''}
    </div>`;
  }).join('');

  return `
    <div class="bg-card border border-border rounded-sm p-lg mb-lg">
      <div class="flex items-center gap-sm mb-md">
        <i data-lucide="map-pin" class="w-5 h-5 text-violet"></i>
        <h3 class="text-base font-bold text-txt">Heutige Locations</h3>
      </div>
      ${locationItems}
    </div>`;
}

function renderMyTasks() {
  if (!state.kanban || !state.kanban.tasks) return '';
  const user = state.user?.displayName || state.user?.email || '';
  const myTasks = state.kanban.tasks.filter(t =>
    t.status !== 'done' && (
      (t.owner && t.owner.toLowerCase().includes(user.toLowerCase())) ||
      (t.assignees && t.assignees.some(a => a.toLowerCase().includes(user.toLowerCase())))
    )
  ).slice(0, 5);

  // Fallback: show urgent tasks if no personal tasks
  const tasks = myTasks.length > 0 ? myTasks : state.kanban.tasks
    .filter(t => t.status !== 'done')
    .sort((a, b) => {
      if (a.deadline && b.deadline) return new Date(a.deadline) - new Date(b.deadline);
      if (a.deadline) return -1;
      return 1;
    })
    .slice(0, 5);

  if (tasks.length === 0) return '';

  const label = myTasks.length > 0 ? 'Meine Aufgaben' : 'Nächste Aufgaben';
  const taskItems = tasks.map(t => {
    const isDone = t.status === 'done';
    const deadlineBadge = t.deadline ? `<span class="text-[10px] text-muted ml-auto shrink-0">${escapeHtml(t.deadline)}</span>` : '';
    return `<div class="flex items-center gap-sm py-sm border-b border-border last:border-0">
      <input type="checkbox" ${isDone ? 'checked' : ''} data-action="toggle-task-check" data-task-id="${escapeHtml(t.id)}" class="w-5 h-5 shrink-0 accent-violet cursor-pointer">
      <div class="flex-1 min-w-0">
        <div class="text-sm font-medium text-txt truncate ${isDone ? 'line-through opacity-50' : ''}">${escapeHtml(t.title)}</div>
      </div>
      ${deadlineBadge}
    </div>`;
  }).join('');

  return `
    <div class="bg-card border border-border rounded-sm p-lg mb-lg">
      <div class="flex items-center justify-between mb-md">
        <div class="flex items-center gap-sm">
          <i data-lucide="check-square" class="w-5 h-5 text-violet"></i>
          <h3 class="text-base font-bold text-txt">${label}</h3>
        </div>
        <a href="#my-tasks" class="text-xs text-violet hover:text-lilac no-underline">Alle →</a>
      </div>
      ${taskItems}
    </div>`;
}

function renderDeadlineWarnings() {
  if (!state.kanban || !state.kanban.tasks) return '';
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const threeDays = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);

  const warnings = state.kanban.tasks.filter(t => {
    if (!t.deadline || t.status === 'done') return false;
    const dl = new Date(t.deadline);
    return dl <= threeDays;
  }).sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

  if (warnings.length === 0) return '';

  const items = warnings.slice(0, 3).map(t => {
    const dl = new Date(t.deadline);
    const isOverdue = dl < today;
    const cls = isOverdue ? 'text-accent' : 'text-gold';
    const icon = isOverdue ? 'alert-circle' : 'alert-triangle';
    return `<div class="flex items-center gap-sm py-xs">
      <i data-lucide="${icon}" class="w-4 h-4 ${cls} shrink-0"></i>
      <span class="text-sm text-txt truncate flex-1">${escapeHtml(t.title)}</span>
      <span class="text-[10px] ${cls} shrink-0">${escapeHtml(t.deadline)}</span>
    </div>`;
  }).join('');

  return `
    <div class="bg-accent/5 border border-accent/20 rounded-sm p-md mb-lg animate-fadeIn">
      <div class="text-xs font-bold uppercase tracking-wider text-accent mb-sm">Achtung — Deadlines</div>
      ${items}
    </div>`;
}

function renderQuickActions() {
  return `
    <div class="grid grid-cols-2 gap-sm mb-lg">
      <a href="#locations" class="flex items-center gap-sm p-md bg-card border border-border rounded-sm no-underline hover:border-violet/30 hover:bg-violet/5 transition-all">
        <i data-lucide="map-pin" class="w-5 h-5 text-violet"></i>
        <span class="text-sm font-medium text-txt">Drehorte</span>
      </a>
      <a href="#schedule" class="flex items-center gap-sm p-md bg-card border border-border rounded-sm no-underline hover:border-violet/30 hover:bg-violet/5 transition-all">
        <i data-lucide="calendar" class="w-5 h-5 text-violet"></i>
        <span class="text-sm font-medium text-txt">Drehplan</span>
      </a>
      <a href="#kanban" class="flex items-center gap-sm p-md bg-card border border-border rounded-sm no-underline hover:border-violet/30 hover:bg-violet/5 transition-all">
        <i data-lucide="kanban" class="w-5 h-5 text-violet"></i>
        <span class="text-sm font-medium text-txt">Kanban</span>
      </a>
      <a href="#contacts" class="flex items-center gap-sm p-md bg-card border border-border rounded-sm no-underline hover:border-violet/30 hover:bg-violet/5 transition-all">
        <i data-lucide="phone" class="w-5 h-5 text-violet"></i>
        <span class="text-sm font-medium text-txt">Kontakte</span>
      </a>
    </div>`;
}

function renderProgress() {
  const sections = [];

  if (state.locations) {
    const confirmed = state.locations.filter(l => l.status === 'confirmed').length;
    const total = state.locations.length;
    const pct = Math.round((confirmed / total) * 100);
    sections.push({ label: 'Locations bestätigt', value: `${confirmed}/${total}`, pct, color: 'bg-violet' });
  }
  if (state.kanban && state.kanban.tasks) {
    const done = state.kanban.tasks.filter(t => t.status === 'done').length;
    const total = state.kanban.tasks.length;
    const pct = Math.round((done / total) * 100);
    sections.push({ label: 'Tasks erledigt', value: `${done}/${total}`, pct, color: 'bg-green' });
  }
  if (state.equipment) {
    const checked = getEquipmentChecked();
    const total = state.equipment.categories.reduce((sum, cat) => sum + cat.items.length, 0);
    const checkedCount = Object.values(checked).filter(Boolean).length;
    const pct = total > 0 ? Math.round((checkedCount / total) * 100) : 0;
    sections.push({ label: 'Equipment bereit', value: `${checkedCount}/${total}`, pct, color: 'bg-gold' });
  }

  if (sections.length === 0) return '';

  const bars = sections.map(s => `
    <div class="flex flex-col gap-xs">
      <div class="flex items-center justify-between">
        <span class="text-xs text-muted">${s.label}</span>
        <span class="text-xs font-bold text-txt">${s.value}</span>
      </div>
      <div class="h-[6px] bg-border rounded-full overflow-hidden">
        <div class="${s.color} h-full rounded-full transition-all duration-medium" style="width:${s.pct}%"></div>
      </div>
    </div>`).join('');

  return `
    <div class="bg-card border border-border rounded-sm p-lg mb-lg">
      <div class="flex items-center gap-sm mb-md">
        <i data-lucide="bar-chart-2" class="w-5 h-5 text-violet"></i>
        <h3 class="text-base font-bold text-txt">Fortschritt</h3>
      </div>
      <div class="flex flex-col gap-md">${bars}</div>
    </div>`;
}

function renderExternalLinks() {
  return `
    <div class="flex gap-sm flex-wrap">
      <a href="https://drive.google.com/drive/folders/1s1rMK-EZMx79g7yWUCoXA_Otdb4crZLi?usp=sharing" target="_blank" rel="noopener" class="flex items-center gap-xs px-md py-sm bg-card border border-border rounded-sm text-sm text-txt no-underline hover:border-violet/30 transition-all">
        <i data-lucide="hard-drive" class="w-4 h-4 text-violet"></i> Drive
      </a>
      <a href="https://www.figma.com/board/TNmHCPlbfxyyKoEUt2qCqw/Night-Of-The-Graduates?node-id=705-4805&t=cW4KQevFJlEVlGRa-1" target="_blank" rel="noopener" class="flex items-center gap-xs px-md py-sm bg-card border border-border rounded-sm text-sm text-txt no-underline hover:border-violet/30 transition-all">
        <i data-lucide="figma" class="w-4 h-4 text-violet"></i> Figma
      </a>
    </div>`;
}

export default async function viewHub() {
  if (!state.config) return '<p class="text-muted p-lg">Laden...</p>';

  const ctx = getShootContext();

  return `
    ${renderContextBanner(ctx)}
    ${renderDeadlineWarnings()}
    ${renderTodayLocation(ctx)}
    ${renderMyTasks()}
    ${renderQuickActions()}
    ${renderProgress()}
    ${renderExternalLinks()}
  `;
}
