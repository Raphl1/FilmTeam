import { state } from '../core/state.js';
import { escapeHtml, formatDate } from '../core/events.js';

const ALLOWED_IFRAME_HOSTS = ['calendar.google.com', 'www.google.com'];
function isSafeUrl(url) {
  try { return ALLOWED_IFRAME_HOSTS.includes(new URL(url).hostname); } catch { return false; }
}

export default async function viewSchedule() {
  if (!state.schedule || !state.config) return '<p class="text-muted p-lg">Laden...</p>';
  const days = state.schedule;
  const calUrl = state.config.project.calendarUrl;
  const safeCalUrl = isSafeUrl(calUrl) ? `${calUrl}&mode=WEEK` : '';
  const editing = state.editMode;
  return `
    <h2 class="text-xl font-extrabold tracking-tight mb-lg"><i data-lucide="calendar"></i> Drehplan</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
      ${days.map((day, idx) => {
        const locNames = day.locations.map(id => {
          const loc = state.locations.find(l => l.id === id);
          return loc ? loc.name : `#${id}`;
        });
        const deleteBtn = editing ? `<button class="absolute top-sm right-sm w-6 h-6 flex items-center justify-center rounded-full bg-accent/10 text-accent text-xs cursor-pointer border-none hover:bg-accent/20" data-action="delete-schedule" data-idx="${idx}" title="Löschen">✕</button>` : '';
        const titleField = editing
          ? `<h3 class="text-base font-bold text-txt m-0"><span>${day.icon}</span> <span contenteditable="true" data-field="title" data-file="schedule" data-idx="${idx}">${escapeHtml(day.title)}</span></h3>`
          : `<h3 class="text-base font-bold text-txt m-0">${day.icon} ${escapeHtml(day.title)}</h3>`;
        const notesField = editing
          ? `<div class="text-sm text-muted mt-sm p-sm bg-bg rounded-sm" contenteditable="true" data-field="notes" data-file="schedule" data-idx="${idx}">${escapeHtml(day.notes || '')}</div>`
          : (day.notes ? `<div class="text-sm text-muted mt-sm">📝 ${escapeHtml(day.notes)}</div>` : '');
        return `
          <div class="bg-card border border-border rounded overflow-hidden transition-all duration-base hover:-translate-y-0.5 hover:shadow-md hover:border-purple/30 p-lg relative flex flex-col gap-sm">
            ${deleteBtn}
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold px-[10px] py-[3px] rounded-full border border-violet/30 bg-violet/10 text-violet">Tag ${day.day}</span>
              <span class="text-xs text-muted">${formatDate(day.date)}</span>
            </div>
            ${titleField}
            <div class="text-sm text-muted">⏰ ${day.time}</div>
            <div class="flex flex-col gap-xs">
              <strong class="text-xs text-muted uppercase tracking-wide">Locations:</strong>
              <div class="flex flex-wrap gap-xs">${locNames.map(n => `<span class="text-xs px-sm py-xs rounded-full bg-violet/10 text-violet">${escapeHtml(n)}</span>`).join('')}</div>
            </div>
            <div class="flex flex-col gap-xs">
              <strong class="text-xs text-muted uppercase tracking-wide">Szenen:</strong>
              <ul class="m-0 pl-md text-sm text-txt leading-relaxed">${day.scenes.map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ul>
            </div>
            ${notesField}
            ${day.conflict ? `<div class="text-sm text-accent font-semibold mt-sm p-sm bg-accent/5 rounded-sm border border-accent/20">⚠️ <strong>Konflikt:</strong> ${escapeHtml(day.conflict)}</div>` : ''}
          </div>`;
      }).join('')}
    </div>
    ${editing ? `<button class="mt-md px-lg py-sm rounded-full text-sm font-semibold border border-dashed border-border text-muted cursor-pointer hover:border-violet hover:text-violet transition-all duration-base" data-action="add-schedule">+ Drehtag hinzufügen</button>` : ''}
    <h3 class="text-md font-bold text-txt mt-2xl mb-md">📆 Google Kalender</h3>
    <div class="w-full rounded overflow-hidden border border-border bg-card">
      ${safeCalUrl ? `<iframe src="${safeCalUrl}" loading="lazy" class="w-full h-[500px] max-md:h-[350px] border-none" sandbox="allow-scripts allow-same-origin"></iframe>` : ''}
    </div>
  `;
}
