import { state } from '../core/state.js';
export default async function viewCalendar() {
  const calUrl = state.config.project.calendarUrl;
  return `
    <h2 class="text-xl font-extrabold tracking-tight mb-lg"><i data-lucide="calendar-days"></i> Kalender</h2>
    <div class="grid grid-cols-2 xs:grid-cols-4 gap-md mb-lg">
      <div class="bg-card border border-border rounded p-md flex flex-col gap-xs"><span class="text-xs text-muted">Erster Drehtag</span><span class="text-base font-bold text-txt">17. Juni 2026</span></div>
      <div class="bg-card border border-border rounded p-md flex flex-col gap-xs"><span class="text-xs text-muted">Letzter Drehtag</span><span class="text-base font-bold text-txt">21. Juni 2026</span></div>
      <div class="bg-card border border-border rounded p-md flex flex-col gap-xs"><span class="text-xs text-muted">Kalenderwoche</span><span class="text-base font-bold text-txt">KW 25</span></div>
      <div class="bg-card border border-border rounded p-md flex flex-col gap-xs"><span class="text-xs text-muted">Premiere</span><span class="text-base font-bold text-txt">Okt/Nov 2026</span></div>
    </div>
    <div class="w-full rounded overflow-hidden border border-border bg-card -mx-lg px-0 max-md:mx-0" style="width:calc(100% + var(--sp-xl))">
      <iframe src="${calUrl}&mode=MONTH" loading="lazy" class="w-full h-[600px] max-md:h-[450px] border-none"></iframe>
    </div>
  `;
}
