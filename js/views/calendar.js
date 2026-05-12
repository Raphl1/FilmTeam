import { state } from '../core/state.js';

const ALLOWED_IFRAME_HOSTS = ['calendar.google.com', 'www.google.com'];
function isSafeUrl(url) {
  try { return ALLOWED_IFRAME_HOSTS.includes(new URL(url).hostname); } catch { return false; }
}

export default async function viewCalendar() {
  if (!state.config) return '<p class="text-muted p-lg">Laden...</p>';
  const calUrl = state.config.project.calendarUrl;
  const iframeSrc = isSafeUrl(calUrl) ? `${calUrl}&mode=MONTH` : '';
  return `
    <h2 class="text-xl font-extrabold tracking-tight mb-lg"><i data-lucide="calendar-days"></i> Kalender</h2>
    <div class="grid grid-cols-2 xs:grid-cols-4 gap-md mb-lg">
      <div class="bg-card border border-border rounded p-md flex flex-col gap-xs"><span class="text-xs text-muted">Erster Drehtag</span><span class="text-base font-bold text-txt">17. Juni 2026</span></div>
      <div class="bg-card border border-border rounded p-md flex flex-col gap-xs"><span class="text-xs text-muted">Letzter Drehtag</span><span class="text-base font-bold text-txt">21. Juni 2026</span></div>
      <div class="bg-card border border-border rounded p-md flex flex-col gap-xs"><span class="text-xs text-muted">Kalenderwoche</span><span class="text-base font-bold text-txt">KW 25</span></div>
      <div class="bg-card border border-border rounded p-md flex flex-col gap-xs"><span class="text-xs text-muted">Premiere</span><span class="text-base font-bold text-gold">20. Nov 2026</span></div>
    </div>
    ${iframeSrc ? `<div class="w-full rounded overflow-hidden border border-border bg-card">
      <iframe src="${iframeSrc}" loading="lazy" class="w-full h-[600px] max-md:h-[450px] border-none" sandbox="allow-scripts allow-same-origin"></iframe>
    </div>` : '<p class="text-muted">Kalender-URL nicht verfügbar.</p>'}
  `;
}
