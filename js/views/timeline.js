import { state } from '../core/state.js';
import { escapeHtml } from '../core/events.js';
export default async function viewTimeline() {
  const items = state.timeline;
  const editing = state.editMode;
  let currentPhase = '';
  return `
    <h2 class="text-xl font-extrabold tracking-tight mb-lg"><i data-lucide="clock"></i> Timeline</h2>
    <div class="relative pl-lg border-l-2 border-border ml-sm flex flex-col gap-md">
      ${items.map((item, idx) => {
        let phaseHeader = '';
        if (item.phase !== currentPhase) {
          currentPhase = item.phase;
          phaseHeader = `<div class="text-sm font-extrabold text-violet uppercase tracking-wide mt-lg mb-sm -ml-lg pl-lg">${escapeHtml(item.phase)}</div>`;
        }
        const dotColor = item.status === 'done' ? 'bg-green border-green/30' : item.status === 'active' ? 'bg-violet border-violet/30 animate-pulse' : item.status === 'goal' ? 'bg-gold border-gold/30' : 'bg-muted border-border';
        const textClass = item.status === 'done' ? 'text-txt' : item.status === 'active' ? 'text-violet font-bold' : item.status === 'goal' ? 'text-gold font-bold' : 'text-muted';
        const deadlineBadge = item.deadline ? '<span class="text-xs font-semibold px-[10px] py-[3px] rounded-full border border-accent/30 bg-accent/10 text-accent ml-sm">Deadline!</span>' : '';
        const statusAction = editing ? `data-action="cycle-timeline-status" data-idx="${idx}" style="cursor:pointer"` : '';
        const titleField = editing
          ? `<span contenteditable="true" data-field="title" data-file="timeline" data-idx="${idx}">${escapeHtml(item.title)}</span>`
          : escapeHtml(item.title);
        const deleteBtn = editing ? `<button class="w-5 h-5 flex items-center justify-center rounded-full bg-accent/10 text-accent text-xs cursor-pointer border-none hover:bg-accent/20 ml-sm" data-action="delete-timeline" data-idx="${idx}">✕</button>` : '';
        return `
          ${phaseHeader}
          <div class="relative flex items-start gap-md py-xs" ${statusAction}>
            <div class="absolute -left-[calc(var(--sp-lg)+5px)] top-1 w-2.5 h-2.5 rounded-full border-2 ${dotColor}"></div>
            <div class="flex flex-col gap-xs flex-1">
              <div class="flex items-center ${textClass}">${titleField} ${deadlineBadge} ${deleteBtn}</div>
              <div class="text-xs text-muted">${escapeHtml(item.date)}</div>
            </div>
          </div>`;
      }).join('')}
    </div>
    ${editing ? `<button class="mt-md px-lg py-sm rounded-full text-sm font-semibold border border-dashed border-border text-muted cursor-pointer hover:border-violet hover:text-violet transition-all duration-base" data-action="add-timeline">+ Meilenstein hinzufügen</button>` : ''}
  `;
}
