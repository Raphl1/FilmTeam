import { state } from '../core/state.js';
import { escapeHtml } from '../core/events.js';

const PHASE_ICONS = { 'Pre-Production': '📋', 'Production': '🎬', 'Post-Production': '✂️', 'Premiere': '🎉' };
const PHASE_COLORS = { 'Pre-Production': 'violet', 'Production': 'green', 'Post-Production': 'gold', 'Premiere': 'accent' };

export default async function viewTimeline() {
  if (!state.timeline) return '<p class="text-muted p-lg">Laden...</p>';
  const items = state.timeline;
  const editing = state.editMode;

  // Stats
  const total = items.length;
  const done = items.filter(i => i.status === 'done').length;
  const active = items.filter(i => i.status === 'active').length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  // Group by phase
  const phases = [];
  let currentPhase = '';
  for (const item of items) {
    if (item.phase !== currentPhase) {
      currentPhase = item.phase;
      phases.push({ name: currentPhase, items: [] });
    }
    phases[phases.length - 1].items.push(item);
  }

  return `
    <h2 class="text-xl font-extrabold tracking-tight mb-lg"><i data-lucide="clock"></i> Timeline</h2>

    <!-- Progress Overview -->
    <div class="bg-card border border-border rounded p-lg mb-lg">
      <div class="flex items-center justify-between mb-sm">
        <span class="text-sm font-bold text-txt">Gesamtfortschritt</span>
        <span class="text-sm font-extrabold text-violet">${progress}%</span>
      </div>
      <div class="w-full h-3 rounded-full bg-bg overflow-hidden">
        <div class="h-full rounded-full bg-violet transition-all duration-slow" style="width:${progress}%"></div>
      </div>
      <div class="flex items-center gap-lg mt-md text-xs text-muted">
        <span class="flex items-center gap-xs"><span class="w-2 h-2 rounded-full bg-green"></span> ${done} erledigt</span>
        <span class="flex items-center gap-xs"><span class="w-2 h-2 rounded-full bg-violet animate-pulse"></span> ${active} aktiv</span>
        <span class="flex items-center gap-xs"><span class="w-2 h-2 rounded-full bg-muted"></span> ${total - done - active} ausstehend</span>
      </div>
    </div>

    <!-- Phase Sections -->
    ${phases.map(phase => {
      const phaseDone = phase.items.filter(i => i.status === 'done').length;
      const phaseTotal = phase.items.length;
      const phaseProgress = phaseTotal > 0 ? Math.round((phaseDone / phaseTotal) * 100) : 0;
      const color = PHASE_COLORS[phase.name] || 'violet';
      const icon = PHASE_ICONS[phase.name] || '📌';

      return `
      <div class="mb-2xl">
        <div class="flex items-center gap-sm mb-md">
          <span class="text-lg">${icon}</span>
          <h3 class="text-md font-extrabold text-txt m-0">${escapeHtml(phase.name)}</h3>
          <span class="text-xs font-semibold px-[10px] py-[3px] rounded-full border border-${color}/30 bg-${color}/10 text-${color} ml-auto">${phaseDone}/${phaseTotal}</span>
        </div>
        <div class="w-full h-1.5 rounded-full bg-bg overflow-hidden mb-md">
          <div class="h-full rounded-full bg-${color} transition-all duration-slow" style="width:${phaseProgress}%"></div>
        </div>
        <div class="relative pl-lg border-l-2 border-${color}/30 ml-[9px] flex flex-col gap-xs">
          ${phase.items.map((item, phaseIdx) => {
            const globalIdx = items.indexOf(item);
            const dotColor = item.status === 'done' ? 'bg-green border-green' 
              : item.status === 'active' ? 'bg-violet border-violet animate-pulse' 
              : item.status === 'goal' ? 'bg-accent border-accent animate-pulse-glow' 
              : 'bg-card2 border-border';
            const cardBg = item.status === 'active' ? 'bg-violet/5 border-violet/20' 
              : item.status === 'goal' ? 'bg-accent/5 border-accent/20' 
              : item.status === 'done' ? 'bg-card border-border opacity-70' 
              : 'bg-card border-border';
            const textClass = item.status === 'done' ? 'text-muted line-through' 
              : item.status === 'active' ? 'text-violet font-bold' 
              : item.status === 'goal' ? 'text-accent font-bold' 
              : 'text-txt';
            const deadlineBadge = item.deadline ? `<span class="text-[10px] font-bold px-[8px] py-[2px] rounded-full bg-accent/10 text-accent border border-accent/20 animate-pulse-glow">Deadline</span>` : '';
            const statusAction = editing ? `data-action="cycle-timeline-status" data-idx="${globalIdx}" style="cursor:pointer"` : '';
            const titleField = editing
              ? `<span contenteditable="true" data-field="title" data-file="timeline" data-idx="${globalIdx}">${escapeHtml(item.title)}</span>`
              : escapeHtml(item.title);
            const deleteBtn = editing ? `<button class="w-5 h-5 flex items-center justify-center rounded-full bg-accent/10 text-accent text-xs cursor-pointer border-none hover:bg-accent/20 shrink-0" data-action="delete-timeline" data-idx="${globalIdx}">✕</button>` : '';
            const checkIcon = item.status === 'done' ? '<i data-lucide="check" class="w-3 h-3 text-green shrink-0"></i>' : '';

            return `
            <div class="relative flex items-center gap-sm p-sm rounded-sm border ${cardBg} transition-all duration-base hover:shadow-sm" ${statusAction}>
              <div class="absolute -left-[calc(24px+5px)] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 ${dotColor}"></div>
              ${checkIcon}
              <div class="flex flex-col gap-[2px] flex-1 min-w-0">
                <div class="flex items-center gap-sm ${textClass} text-sm">${titleField} ${deadlineBadge} ${deleteBtn}</div>
                <span class="text-xs text-muted">${escapeHtml(item.date)}</span>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>`;
    }).join('')}
    ${editing ? `<button class="mt-md px-lg py-sm rounded-full text-sm font-semibold border border-dashed border-border text-muted cursor-pointer hover:border-violet hover:text-violet transition-all duration-base" data-action="add-timeline">+ Meilenstein hinzufügen</button>` : ''}
  `;
}
