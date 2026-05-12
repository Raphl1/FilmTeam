import { state } from '../core/state.js';
import { escapeHtml, getEquipmentChecked } from '../core/events.js';

const ICONS = { 'locations':'map-pin','schedule':'calendar','team':'users','equipment':'camera','budget':'wallet','timeline':'clock','contacts':'phone','calendar':'calendar-days','kanban':'kanban','my-tasks':'user' };
const DESCS = { 'locations':'15 Locations mit Maps, Referenzen und Status.','schedule':'5-Tage Drehplan mit Szenen und Konflikten.','team':'Rollen und offene Positionen im Überblick.','equipment':'Checkliste für Kamera, Licht, Ton & Props.','budget':'Min/Max Kalkulation aller Kostenpunkte.','timeline':'Meilensteine bis zur Premiere.','contacts':'Ansprechpartner & Genehmigungsstatus.','calendar':'Google Calendar mit allen Drehterminen.','kanban':'Aufgaben-Board für das Team.','my-tasks':'Deine persönlichen Aufgaben.' };

function getCountdownBanner() {
  const shootDate = new Date('2026-06-17T00:00:00');
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.ceil((shootDate - today) / (1000 * 60 * 60 * 24));

  let text, subClass;
  if (diff > 1) {
    text = `Noch <strong class="text-violet">${diff} Tage</strong> bis zum ersten Drehtag (17. Juni 2026)`;
    subClass = 'text-txt';
  } else if (diff === 1) {
    text = `<strong class="text-accent">Morgen</strong> ist der erste Drehtag!`;
    subClass = 'text-accent';
  } else if (diff === 0) {
    text = `<strong class="text-green">Heute</strong> ist der erste Drehtag!`;
    subClass = 'text-green';
  } else if (diff > -5) {
    text = `<strong class="text-green">Dreh läuft!</strong> Tag ${Math.abs(diff) + 1} von 5`;
    subClass = 'text-green';
  } else {
    text = `<strong class="text-muted">Dreh abgeschlossen</strong>`;
    subClass = 'text-muted';
  }

  return `
    <div class="flex items-center gap-md p-md bg-card border border-border rounded mb-lg animate-fadeIn">
      <span class="text-2xl">🎬</span>
      <div class="flex flex-col gap-xs">
        <span class="${subClass} text-base">${text}</span>
        <span class="text-sm text-muted">5 Drehtage · 15 Locations · Mannheim & Weinheim</span>
      </div>
    </div>
  `;
}

function getDeadlineWarnings() {
  if (!state.kanban || !state.kanban.tasks) return '';
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const threeDays = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);

  const warnings = state.kanban.tasks.filter(t => {
    if (!t.deadline || t.status === 'done') return false;
    const dl = new Date(t.deadline);
    return dl <= threeDays;
  }).map(t => {
    const dl = new Date(t.deadline);
    const isOverdue = dl < today;
    const colorCls = isOverdue ? 'border-accent/40 bg-accent/5 text-accent' : 'border-gold/40 bg-gold/5 text-gold';
    const label = isOverdue ? 'Überfällig' : 'Bald fällig';
    return `<div class="flex items-center gap-sm p-sm rounded-sm border ${colorCls} text-sm">
      <span class="font-bold">${label}:</span>
      <span class="text-txt font-medium">${escapeHtml(t.title)}</span>
      <span class="ml-auto text-xs opacity-80">${escapeHtml(t.deadline)}</span>
    </div>`;
  });

  if (warnings.length === 0) return '';
  return `<div class="flex flex-col gap-sm mb-lg animate-fadeIn">${warnings.join('')}</div>`;
}

function getProgressForCard(id) {
  if (id === 'locations' && state.locations) {
    const confirmed = state.locations.filter(l => l.status === 'confirmed').length;
    return `<span class="text-[10px] text-muted mt-auto pt-sm">${confirmed}/${state.locations.length} bestätigt</span>`;
  }
  if (id === 'timeline' && state.timeline) {
    const done = state.timeline.filter(t => t.status === 'done').length;
    return `<span class="text-[10px] text-muted mt-auto pt-sm">${done}/${state.timeline.length} erledigt</span>`;
  }
  if (id === 'kanban' && state.kanban && state.kanban.tasks) {
    const done = state.kanban.tasks.filter(t => t.status === 'done').length;
    return `<span class="text-[10px] text-muted mt-auto pt-sm">${done}/${state.kanban.tasks.length} done</span>`;
  }
  if (id === 'equipment' && state.equipment) {
    const checked = getEquipmentChecked();
    const total = state.equipment.categories.reduce((sum, cat) => sum + cat.items.length, 0);
    const checkedCount = Object.values(checked).filter(Boolean).length;
    return `<span class="text-[10px] text-muted mt-auto pt-sm">${checkedCount}/${total} abgehakt</span>`;
  }
  return '';
}

export default async function viewHub() {
  if (!state.config) return '<p class="text-muted p-lg">Laden...</p>';
  const { stats, navigation } = state.config;
  const links = navigation.filter(n => n.id !== 'hub');
  return `
    ${getCountdownBanner()}
    ${getDeadlineWarnings()}
    <div class="grid grid-cols-2 xs:grid-cols-4 gap-md mb-lg">${stats.map(s=>`<div class="bg-card border border-border rounded p-md text-center"><div class="text-xl font-extrabold text-violet">${escapeHtml(String(s.value))}</div><div class="text-xs text-muted mt-xs">${escapeHtml(s.label)}</div></div>`).join('')}</div>
    <h2 class="text-xl font-extrabold tracking-tight mb-lg">Schnellzugriff</h2>
    <div class="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-md">
      <a href="https://drive.google.com/drive/folders/1s1rMK-EZMx79g7yWUCoXA_Otdb4crZLi?usp=sharing" target="_blank" rel="noopener" class="bg-card border border-border rounded p-lg flex flex-col gap-sm no-underline transition-all duration-base hover:-translate-y-0.5 hover:shadow-md hover:border-purple/30"><i data-lucide="hard-drive" class="w-5 h-5 text-violet"></i><div class="text-base font-bold text-txt">Google Drive</div><div class="text-sm text-muted leading-snug">Gemeinsamer Ordner mit allen Dateien.</div></a>
      ${links.map(item=>`<a href="#${encodeURIComponent(item.id)}" class="bg-card border border-border rounded p-lg flex flex-col gap-sm no-underline transition-all duration-base hover:-translate-y-0.5 hover:shadow-md hover:border-purple/30"><i data-lucide="${ICONS[item.id]||'circle'}" class="w-5 h-5 text-violet"></i><div class="text-base font-bold text-txt">${escapeHtml(item.label)}</div><div class="text-sm text-muted leading-snug">${DESCS[item.id]||''}</div>${getProgressForCard(item.id)}</a>`).join('')}
    </div>
  `;
}
