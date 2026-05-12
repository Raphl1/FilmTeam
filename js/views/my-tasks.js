import { state } from '../core/state.js';
import { escapeHtml } from '../core/events.js';

function getCheckedTasks() {
  try { return JSON.parse(localStorage.getItem('my_tasks_checked') || '{}'); } catch { return {}; }
}

export default async function viewMyTasks() {
  if (!state.team || !state.kanban) return '<p class="text-muted p-lg">Laden...</p>';
  const members = state.team.members || [];
  const tasks = state.kanban.tasks || [];
  const sel = localStorage.getItem('my_tasks_user') || '';
  const checked = getCheckedTasks();
  const my = sel ? tasks.filter(t => (t.owner||'').toLowerCase()===sel.toLowerCase() || (t.assignee||'').toLowerCase().includes(sel.toLowerCase())) : tasks;
  const sections = [['in-progress','In Arbeit','#6c3fc5'],['todo','Zu erledigen','#f72585'],['on-hold','Sonstiges','#f9c74f'],['done','Erledigt','#43aa8b']];
  const renderList = (list, label, color) => list.length === 0 ? '' : `
    <div class="flex flex-col gap-sm mb-lg">
      <div class="flex items-center justify-between px-sm py-xs font-bold text-sm text-txt" style="border-left:3px solid ${color}"><span>${label}</span><span class="text-xs font-semibold px-[10px] py-[3px] rounded-full border border-border bg-card2 text-muted">${list.length}</span></div>
      ${list.map(t => {
        const isChecked = !!checked[t.id];
        const realIdx = tasks.indexOf(t);
        return `<div class="bg-card border border-border rounded p-md flex items-start gap-md transition-all duration-base hover:border-purple/30 hover:shadow-sm ${isChecked ? 'opacity-60' : ''}">
          <button class="mt-[2px] w-6 h-6 shrink-0 rounded-sm border-2 ${isChecked ? 'border-green bg-green/20 text-green' : 'border-border text-transparent hover:border-violet'} flex items-center justify-center cursor-pointer transition-all duration-base text-xs font-bold" data-action="toggle-task-check" data-task-id="${escapeHtml(t.id)}">${isChecked ? '✓' : ''}</button>
          <div class="flex flex-col gap-xs flex-1 ${isChecked ? 'line-through' : ''}">
            <div class="text-sm font-bold text-txt">${escapeHtml(t.title)}</div>
            ${t.description ? `<div class="text-xs text-muted leading-relaxed">${escapeHtml(t.description)}</div>` : ''}
            <div class="flex flex-wrap items-center gap-sm mt-xs">
              ${t.deadline ? `<span class="text-xs text-muted">📅 ${escapeHtml(t.deadline)}</span>` : ''}
              ${t.owner ? `<span class="text-xs text-muted">Owner: ${escapeHtml(t.owner)}</span>` : ''}
              ${t.assignee ? `<span class="text-xs text-muted">Zugewiesen: ${escapeHtml(t.assignee)}</span>` : ''}
              ${isChecked ? `<span class="text-xs px-[8px] py-[2px] rounded-full bg-green/10 text-green border border-green/20">✓ Erledigt</span>` : ''}
            </div>
          </div>
        </div>`;
      }).join('')}
    </div>`;
  return `
    <h2 class="text-xl font-extrabold tracking-tight mb-lg">Meine Aufgaben</h2>
    <div class="bg-card border border-border rounded p-lg mb-lg">
      <label class="text-sm font-semibold text-muted mb-sm block">Wer bist du?</label>
      <div class="flex flex-wrap gap-sm">${sel ? `<button class="px-md py-sm rounded-full text-sm font-semibold border border-accent/30 text-accent cursor-pointer min-h-[44px] flex items-center transition-all duration-base hover:bg-accent/10" data-action="clear-member">✕ Filter zurücksetzen</button>` : ''}${members.map(m=>`<button class="px-md py-sm rounded-full text-sm font-semibold border border-border text-muted cursor-pointer min-h-[44px] flex items-center transition-all duration-base hover:border-violet/30 hover:text-violet" data-action="select-member" data-member="${escapeHtml(m.name)}" style="${sel===m.name?`background:${m.color}20;border-color:${m.color};color:${m.color}`:''}">${escapeHtml(m.name)}</button>`).join('')}</div>
    </div>
    ${!sel
      ? `<div class="flex items-center gap-md mb-lg p-sm"><span class="text-base font-bold text-txt">Alle Aufgaben</span><span class="text-xs font-semibold px-[10px] py-[3px] rounded-full border border-border bg-card2 text-muted">${my.length} Aufgabe${my.length!==1?'n':''}</span><span class="text-xs text-green font-semibold">${Object.keys(checked).filter(id => my.some(t => t.id === id) && checked[id]).length} abgehakt</span></div>
         ${my.length===0?`<div class="flex flex-col items-center justify-center py-2xl text-muted text-sm"><div class="text-3xl mb-sm"><i data-lucide="check-circle-2"></i></div><p>Keine Aufgaben vorhanden.</p></div>`
           :sections.map(([s,l,c])=>renderList(my.filter(t=>t.status===s),l,c)).join('')}`
      : `<div class="flex items-center gap-md mb-lg p-sm"><span class="text-base font-bold text-txt">${escapeHtml(sel)}</span><span class="text-xs font-semibold px-[10px] py-[3px] rounded-full border border-border bg-card2 text-muted">${my.length} Aufgabe${my.length!==1?'n':''}</span><span class="text-xs text-green font-semibold">${Object.keys(checked).filter(id => my.some(t => t.id === id) && checked[id]).length} abgehakt</span></div>
         ${my.length===0?`<div class="flex flex-col items-center justify-center py-2xl text-muted text-sm"><div class="text-3xl mb-sm"><i data-lucide="check-circle-2"></i></div><p>Keine Aufgaben — alles erledigt!</p></div>`
           :sections.map(([s,l,c])=>renderList(my.filter(t=>t.status===s),l,c)).join('')}`
    }`;
}
