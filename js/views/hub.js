import { state } from '../core/state.js';
import { escapeHtml } from '../core/events.js';
const ICONS = { 'locations':'map-pin','schedule':'calendar','team':'users','equipment':'camera','budget':'wallet','timeline':'clock','contacts':'phone','calendar':'calendar-days','kanban':'kanban','my-tasks':'user' };
const DESCS = { 'locations':'15 Locations mit Maps, Referenzen und Status.','schedule':'5-Tage Drehplan mit Szenen und Konflikten.','team':'Rollen und offene Positionen im Überblick.','equipment':'Checkliste für Kamera, Licht, Ton & Props.','budget':'Min/Max Kalkulation aller Kostenpunkte.','timeline':'Meilensteine bis zur Premiere.','contacts':'Ansprechpartner & Genehmigungsstatus.','calendar':'Google Calendar mit allen Drehterminen.','kanban':'Aufgaben-Board für das Team.','my-tasks':'Deine persönlichen Aufgaben.' };
export default async function viewHub() {
  if (!state.config) return '<p class="text-muted p-lg">Laden...</p>';
  const { stats, navigation } = state.config;
  const links = navigation.filter(n => n.id !== 'hub');
  return `
    <div class="flex items-center gap-md p-md bg-card border border-border rounded mb-lg animate-fadeIn">
      <span class="text-2xl">🎬</span>
      <div class="flex flex-col gap-xs">
        <strong class="text-txt text-base">Erster Drehtag: 17. Juni 2026</strong>
        <span class="text-sm text-muted">5 Drehtage · 15 Locations · Mannheim & Weinheim</span>
      </div>
    </div>
    <div class="grid grid-cols-2 xs:grid-cols-4 gap-md mb-lg">${stats.map(s=>`<div class="bg-card border border-border rounded p-md text-center"><div class="text-xl font-extrabold text-violet">${escapeHtml(String(s.value))}</div><div class="text-xs text-muted mt-xs">${escapeHtml(s.label)}</div></div>`).join('')}</div>
    <h2 class="text-xl font-extrabold tracking-tight mb-lg">Schnellzugriff</h2>
    <div class="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-md">${links.map(item=>`<a href="#${encodeURIComponent(item.id)}" class="bg-card border border-border rounded p-lg flex flex-col gap-sm no-underline transition-all duration-base hover:-translate-y-0.5 hover:shadow-md hover:border-purple/30"><i data-lucide="${ICONS[item.id]||'circle'}" class="w-5 h-5 text-violet"></i><div class="text-base font-bold text-txt">${escapeHtml(item.label)}</div><div class="text-sm text-muted leading-snug">${DESCS[item.id]||''}</div></a>`).join('')}</div>
  `;
}
