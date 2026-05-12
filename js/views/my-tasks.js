import { state } from '../core/state.js';
import { escapeHtml } from '../core/events.js';
export default async function viewMyTasks() {
  const members = state.team.members || [];
  const tasks = state.kanban.tasks || [];
  const sel = localStorage.getItem('my_tasks_user') || '';
  const my = sel ? tasks.filter(t => (t.owner||'').toLowerCase()===sel.toLowerCase() || (t.assignee||'').toLowerCase().includes(sel.toLowerCase())) : [];
  const sections = [['in-progress','In Arbeit','#6c3fc5'],['todo','Zu erledigen','#f72585'],['on-hold','Sonstiges','#f9c74f'],['done','Erledigt','#43aa8b']];
  const renderList = (list, label, color) => list.length === 0 ? '' : `
    <div class="flex flex-col gap-sm mb-lg">
      <div class="flex items-center justify-between px-sm py-xs font-bold text-sm text-txt" style="border-left:3px solid ${color}"><span>${label}</span><span class="text-xs font-semibold px-[10px] py-[3px] rounded-full border border-border bg-card2 text-muted">${list.length}</span></div>
      ${list.map(t=>`<div class="bg-card border border-border rounded p-md flex flex-col gap-xs transition-all duration-base hover:border-purple/30 hover:shadow-sm"><div class="text-sm font-bold text-txt">${escapeHtml(t.title)}</div>${t.description?`<div class="text-xs text-muted leading-relaxed">${escapeHtml(t.description)}</div>`:''}<div class="flex flex-wrap items-center gap-sm mt-xs">${t.deadline?`<span class="text-xs text-muted">📅 ${escapeHtml(t.deadline)}</span>`:''}${t.owner?`<span class="text-xs text-muted">Owner: ${escapeHtml(t.owner)}</span>`:''}${t.assignee?`<span class="text-xs text-muted">Zugewiesen: ${escapeHtml(t.assignee)}</span>`:''}</div></div>`).join('')}
    </div>`;
  return `
    <h2 class="text-xl font-extrabold tracking-tight mb-lg">Meine Aufgaben</h2>
    <div class="bg-card border border-border rounded p-lg mb-lg">
      <label class="text-sm font-semibold text-muted mb-sm block">Wer bist du?</label>
      <div class="flex flex-wrap gap-sm">${members.map(m=>`<button class="px-md py-sm rounded-full text-sm font-semibold border border-border text-muted cursor-pointer min-h-[44px] flex items-center transition-all duration-base hover:border-violet/30 hover:text-violet ${sel===m.name?'!border-violet/30 !text-violet !bg-violet/10':''}" data-action="select-member" data-member="${escapeHtml(m.name)}" style="${sel===m.name?`background:${m.color}20;border-color:${m.color};color:${m.color}`:''}">${escapeHtml(m.name)}</button>`).join('')}</div>
    </div>
    ${!sel
      ? `<div class="flex flex-col items-center justify-center py-2xl text-muted text-sm"><div class="text-3xl mb-sm"><i data-lucide="hand-pointer"></i></div><p>Wähle oben deinen Namen.</p></div>`
      : `<div class="flex items-center gap-md mb-lg p-sm"><span class="text-base font-bold text-txt">${escapeHtml(sel)}</span><span class="text-xs font-semibold px-[10px] py-[3px] rounded-full border border-border bg-card2 text-muted">${my.length} Aufgabe${my.length!==1?'n':''}</span></div>
         ${my.length===0?`<div class="flex flex-col items-center justify-center py-2xl text-muted text-sm"><div class="text-3xl mb-sm"><i data-lucide="check-circle-2"></i></div><p>Keine Aufgaben — alles erledigt!</p></div>`
           :sections.map(([s,l,c])=>renderList(my.filter(t=>t.status===s),l,c)).join('')}`
    }`;
}
