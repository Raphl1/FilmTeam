import { state, markDirty } from '../core/state.js';
import { escapeHtml } from '../core/events.js';
import { navigate, getRoute } from '../core/router.js';
import { showToast } from '../components/toast.js';

function avatarColor(name) {
  if (!name) return 'var(--muted)';
  const colors=['#6c3fc5','#f72585','#43aa8b','#4285f4','#f9c74f','#ff6b35','#9b5de5','#00bbf9'];
  let h=0; for(let i=0;i<name.length;i++) h=name.charCodeAt(i)+((h<<5)-h);
  return colors[Math.abs(h)%colors.length];
}
function avatarInitials(name) { return name ? name.split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase() : '?'; }

export default async function viewKanban() {
  if (!state.kanban) return '<p class="text-muted p-lg">Laden...</p>';
  const {columns,tasks} = state.kanban;
  const members = (state.team && state.team.members)||[];
  const editing = state.editMode;
  const done = tasks.filter(t=>t.status==='done').length;
  const draggable = !editing ? 'draggable="true"' : '';
  const checked = (() => { try { return JSON.parse(localStorage.getItem('my_tasks_checked')||'{}'); } catch { return {}; } })();
  return `
    <div class="flex items-center justify-between mb-lg flex-wrap gap-md">
      <h2 class="text-xl font-extrabold tracking-tight m-0">Board</h2>
      <div class="flex items-center gap-sm">
        <span class="text-sm text-muted">${done}/${tasks.length} erledigt</span>
        <div class="w-[120px] h-2 rounded-full bg-bg overflow-hidden"><div class="h-full rounded-full bg-violet transition-all duration-slow" style="width:${tasks.length>0?(done/tasks.length*100):0}%"></div></div>
      </div>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md pb-sm">
      ${columns.map(col => {
        const ct = tasks.filter(t=>t.status===col.id);
        return `<div class="kanban-column flex flex-col bg-card2 rounded min-h-[200px] border border-border min-w-0 overflow-hidden" data-column="${col.id}">
          <div class="flex items-center gap-sm p-md pb-sm sticky top-0 bg-card2 z-10"><div class="w-3 h-3 rounded-full shrink-0" style="background:${col.color}"></div><span class="text-sm font-bold text-txt truncate">${col.label}</span><span class="text-xs font-semibold px-[8px] py-[2px] rounded-full bg-bg text-muted ml-auto shrink-0">${ct.length}</span></div>
          <div class="kanban-col-body flex flex-col gap-sm p-sm flex-1 min-h-[100px]" data-col-id="${col.id}">
            ${ct.map(task => {
              const ri = tasks.indexOf(task);
              const del = editing ? `<button class="absolute top-xs right-xs w-6 h-6 flex items-center justify-center rounded-full bg-accent/15 text-accent text-xs cursor-pointer border border-accent/20 hover:bg-accent/25 z-10 backdrop-blur-sm" data-action="delete-kanban-task" data-idx="${ri}" aria-label="Aufgabe löschen"><i data-lucide="x" class="w-3 h-3"></i></button>` : '';
              const ss = editing ? `<select class="bg-bg border border-border rounded-sm px-sm py-xs text-xs text-txt w-full mt-sm" data-action="change-kanban-status" data-idx="${ri}">${columns.map(c=>`<option value="${c.id}"${task.status===c.id?' selected':''}>${c.label}</option>`).join('')}</select>` : '';
              const oa = task.owner ? `<div class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style="background:${avatarColor(task.owner)}" title="${escapeHtml(task.owner)}">${avatarInitials(task.owner)}</div>` : '';
              const at = task.assignee ? task.assignee.split(',').map(a=>`<span class="inline-flex items-center text-[11px] leading-none px-sm py-[4px] rounded-full bg-violet/12 text-violet border border-violet/25 font-medium">${escapeHtml(a.trim())}</span>`).join('') : '';
              const dlc = task.deadline && new Date(task.deadline)<new Date() ? 'text-accent' : 'text-muted';
              const tf = editing ? `<span contenteditable="true" data-field="title" data-file="kanban" data-idx="${ri}" data-subkey="tasks">${escapeHtml(task.title)}</span>` : escapeHtml(task.title);
              const titleClass = editing ? 'text-sm font-bold text-txt leading-snug break-words pr-lg' : 'text-sm font-bold text-txt leading-snug break-words';
              const df = editing
                ? `<div class="text-xs text-muted leading-relaxed mt-xs break-words" contenteditable="true" data-field="description" data-file="kanban" data-idx="${ri}" data-subkey="tasks">${escapeHtml(task.description||'')}</div>`
                : (task.description ? `<div class="text-xs text-muted leading-relaxed mt-xs break-words line-clamp-3" title="${escapeHtml(task.description)}">${escapeHtml(task.description)}</div>` : '');
              const of2 = editing ? `<input type="text" class="bg-bg border border-border rounded-sm px-sm py-xs text-xs text-txt w-full" value="${escapeHtml(task.owner||'')}" placeholder="Owner..." data-action="kanban-owner" data-idx="${ri}"/>` : (task.owner?`<span class="text-xs text-muted">${escapeHtml(task.owner)}</span>`:'');
              const af = editing ? `<input type="text" class="bg-bg border border-border rounded-sm px-sm py-xs text-xs text-txt w-full" value="${escapeHtml(task.assignee||'')}" placeholder="Zugewiesen..." data-action="kanban-assignee" data-idx="${ri}"/>` : '';
              const dlf = editing ? `<input type="date" class="bg-bg border border-border rounded-sm px-sm py-xs text-xs text-txt w-full" value="${task.deadline||''}" data-action="kanban-deadline" data-idx="${ri}"/>` : (task.deadline?`<span class="text-xs ${dlc}">📅 ${escapeHtml(task.deadline)}</span>`:'');
              const checkedBadge = checked[task.id] ? `<span class="inline-flex items-center text-[10px] leading-none px-sm py-[3px] rounded-full bg-green/12 text-green border border-green/25 font-semibold self-start">✓ abgehakt</span>` : '';
              const dayBadge = task.day ? `<span class="inline-flex items-center text-[10px] leading-none px-sm py-[3px] rounded-full bg-violet/12 text-violet border border-violet/25 font-semibold self-start">Tag ${task.day}</span>` : '';
              const cardPad = editing ? 'p-sm pr-md pt-md' : 'p-sm';
              return `<div class="kanban-card bg-card border border-border rounded-sm ${cardPad} relative flex flex-col gap-xs transition-all duration-base hover:shadow-sm hover:border-purple/30 ${editing?'':'cursor-grab'} min-w-0" ${draggable} data-task-idx="${ri}" data-task-id="${escapeHtml(task.id)}">
                ${del}
                <div class="flex items-center justify-between gap-sm min-w-0"><span class="text-[10px] font-mono text-muted uppercase shrink-0">${task.id.toUpperCase()}</span>${editing?'':oa}</div>
                <div class="${titleClass}">${tf}</div>${df}
                ${(checkedBadge || dayBadge) ? `<div class="flex flex-wrap gap-xs">${checkedBadge}${dayBadge}</div>` : ''}
                ${editing
                  ? `<div class="flex flex-col gap-xs mt-sm border-t border-border pt-sm"><label class="text-[10px] text-muted uppercase font-semibold">Zugewiesen</label>${af}<label class="text-[10px] text-muted uppercase font-semibold">Deadline</label>${dlf}</div>`
                  : `${at?`<div class="flex flex-wrap gap-xs mt-xs">${at}</div>`:''}${(of2 || dlf) ? `<div class="flex flex-wrap items-center gap-sm mt-xs text-xs">${of2}${dlf}</div>` : ''}`
                }
                ${ss}
              </div>`;
            }).join('')}
            ${ct.length===0?'<div class="flex items-center justify-center text-xs text-muted py-lg opacity-60">Keine Aufgaben</div>':''}
          </div>
          ${editing?`<button class="mx-sm mb-sm px-md py-xs rounded-full text-xs font-semibold border border-dashed border-border text-muted cursor-pointer hover:border-violet hover:text-violet transition-all duration-base" data-action="add-kanban-task" data-status="${col.id}">+ Aufgabe</button>`:''}
        </div>`;
      }).join('')}
    </div>
    <div class="flex items-center gap-sm mt-lg p-md bg-card border border-border rounded flex-wrap">
      <span class="text-xs font-semibold text-muted uppercase tracking-wide">Team:</span>
      ${members.map(m=>`<div class="flex items-center gap-xs px-sm py-xs rounded-full bg-card2 border border-border"><div class="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style="background:${avatarColor(m.name||m)}">${avatarInitials(m.name||m)}</div><span class="text-xs text-txt">${escapeHtml(m.name||m)}</span></div>`).join('')}
    </div>`;
}

// ── DnD ────────────────────────────────────────────────────────────────────
export function initKanbanDragAndDrop() {
  const cards = document.querySelectorAll('.kanban-card[draggable="true"]');
  const cols = document.querySelectorAll('.kanban-col-body');
  cards.forEach(c => { c.addEventListener('dragstart', onDragStart); c.addEventListener('dragend', onDragEnd); });
  cols.forEach(c => { c.addEventListener('dragover', onDragOver); c.addEventListener('dragleave', onDragLeave); c.addEventListener('drop', onDrop); });
  initTouchDnD(cards);
}
function onDragStart(e) { e.dataTransfer.setData('text/plain', e.currentTarget.dataset.taskId || ''); e.dataTransfer.effectAllowed='move'; requestAnimationFrame(()=>e.currentTarget.classList.add('dragging')); }
function onDragEnd(e) { e.currentTarget.classList.remove('dragging'); cleanup(); }
function onDragOver(e) { e.preventDefault(); e.dataTransfer.dropEffect='move'; const c=e.currentTarget; c.classList.add('drag-over'); removeIndicators(c); placeIndicator(c, e.clientY); }
function onDragLeave(e) { const c=e.currentTarget; if(!c.contains(e.relatedTarget)){c.classList.remove('drag-over');removeIndicators(c);} }
function onDrop(e) {
  e.preventDefault();
  const c = e.currentTarget;
  const taskId = e.dataTransfer.getData('text/plain');
  const col = c.dataset.colId;
  cleanup();
  if (!taskId || !col) return;
  const t = state.kanban.tasks.find(x => x.id === taskId);
  if (!t) return;
  if (t.status !== col) {
    t.status = col;
    markDirty('kanban');
    navigate(getRoute(), true);
    const colLabel = state.kanban.columns.find(x => x.id === col)?.label || col;
    showToast(`"${t.title}" → ${colLabel}`, 'success');
  }
}
function afterEl(container,y) { return [...container.querySelectorAll('.kanban-card:not(.dragging)')].reduce((cl,ch)=>{const b=ch.getBoundingClientRect(),o=y-b.top-b.height/2;return o<0&&o>cl.offset?{offset:o,element:ch}:cl;},{offset:Number.NEGATIVE_INFINITY}).element||null; }
function removeIndicators(c) { c.querySelectorAll('.drop-indicator').forEach(e=>e.remove()); }
function placeIndicator(c,y) { const ind=document.createElement('div'); ind.className='drop-indicator'; const af=afterEl(c,y),em=c.querySelector('.kanban-empty'); af===null?(em?c.insertBefore(ind,em):c.appendChild(ind)):c.insertBefore(ind,af); }
function cleanup() { document.querySelectorAll('.drag-over').forEach(e=>e.classList.remove('drag-over')); document.querySelectorAll('.drop-indicator').forEach(e=>e.remove()); }
let td = { active: false, timer: null, startX: 0, startY: 0, card: null, ghost: null, taskId: null };
function initTouchDnD(cards) {
  cards.forEach(c => {
    c.addEventListener('touchstart', onTS, { passive: false });
    c.addEventListener('touchmove', onTM, { passive: false });
    c.addEventListener('touchend', onTE, { passive: false });
    c.addEventListener('touchcancel', onTC, { passive: false });
  });
}
function onTS(e) {
  if (e.touches.length !== 1) return;
  const t = e.touches[0], c = e.currentTarget;
  td.startX = t.clientX; td.startY = t.clientY; td.card = c;
  td.taskId = c.dataset.taskId;
  td.timer = setTimeout(() => startTD(c, t), 500);
}
function onTM(e) {
  const t = e.touches[0];
  const dx = Math.abs(t.clientX - td.startX), dy = Math.abs(t.clientY - td.startY);
  if (!td.active && (dx > 10 || dy > 10)) { clearTimeout(td.timer); return; }
  if (!td.active) return;
  e.preventDefault();
  if (td.ghost) {
    td.ghost.style.left = (t.clientX - td.ghost.offsetWidth / 2) + 'px';
    td.ghost.style.top = (t.clientY - 20) + 'px';
  }
  cleanup();
  const eb = document.elementFromPoint(t.clientX, t.clientY);
  const cb = eb?.closest('.kanban-col-body');
  if (cb) { cb.classList.add('drag-over'); placeIndicator(cb, t.clientY); }
}
function onTE(e) {
  clearTimeout(td.timer);
  if (!td.active) { cancelTD(); return; }
  e.preventDefault();
  const t = e.changedTouches[0];
  if (td.ghost) td.ghost.style.display = 'none';
  const eb = document.elementFromPoint(t.clientX, t.clientY);
  if (td.ghost) td.ghost.style.display = '';
  const cb = eb?.closest('.kanban-col-body');
  if (cb && cb.dataset.colId) {
    const col = cb.dataset.colId;
    const tk = state.kanban.tasks.find(x => x.id === td.taskId);
    if (tk && tk.status !== col) {
      tk.status = col;
      markDirty('kanban');
      const colLabel = state.kanban.columns.find(x => x.id === col)?.label || col;
      showToast(`"${tk.title}" → ${colLabel}`, 'success');
    }
  } else {
    showToast('Drop ungültig', 'warning');
  }
  cancelTD();
  navigate(getRoute(), true);
}
function onTC() { clearTimeout(td.timer); cancelTD(); }
function startTD(c, t) {
  td.active = true; c.classList.add('dragging');
  const g = c.cloneNode(true);
  g.className = 'kanban-card kanban-drag-ghost';
  g.style.cssText = `width:${c.offsetWidth}px;left:${t.clientX - c.offsetWidth / 2}px;top:${t.clientY - 20}px`;
  document.body.appendChild(g);
  td.ghost = g;
  if (navigator.vibrate) navigator.vibrate(30);
}
function cancelTD() {
  td.ghost?.remove();
  td.card?.classList.remove('dragging');
  cleanup();
  td.active = false; td.card = null; td.ghost = null; td.taskId = null;
}
