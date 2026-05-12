import { state, markDirty } from './state.js';
import { navigate, getRoute } from './router.js';
import { enterEditMode, cancelEditMode } from './editmode.js';
import { saveAllDirty } from './github.js';
import { showToast } from '../components/toast.js';
import { closeTokenModal, handleSaveToken } from '../components/modal.js';

// ── Shared utilities exported for views ─────────────────────────────────────
export const generateId = () => Date.now().toString(36) + Math.random().toString(36).slice(2,7);
export const escapeHtml = str => { const d = document.createElement('div'); d.textContent = str; return d.innerHTML; };
export const getEquipmentChecked = () => { try { return JSON.parse(localStorage.getItem('equipment_checked')||'{}'); } catch { return {}; } };
export const setEquipmentChecked = d => localStorage.setItem('equipment_checked', JSON.stringify(d));
export const getPermitStatus = () => { try { return JSON.parse(localStorage.getItem('permit_status')||'{}'); } catch { return {}; } };
export const setPermitStatus = d => localStorage.setItem('permit_status', JSON.stringify(d));
export const getPermitLabel = s => ({'not-asked':'Nicht angefragt','not-booked':'Nicht gebucht','pending':'Ausstehend','approved':'Genehmigt','declined':'Abgelehnt'})[s] || s;
export const cyclePermitStatus = s => { const c=['not-asked','pending','approved','declined']; return c[(c.indexOf(s)+1)%c.length]; };
export function formatDate(ds) { if (!ds || ds === 'TBD') return 'TBD'; const d=new Date(ds); if (isNaN(d)) return ds; return `${['So','Mo','Di','Mi','Do','Fr','Sa'][d.getDay()]}, ${d.getDate()}.${d.getMonth()+1}.${d.getFullYear()}`; }

// ── Click delegation ─────────────────────────────────────────────────────────
document.addEventListener('click', async e => {
  const el = e.target.closest('[data-action]');
  if (el) {
    e.preventDefault();
    const a = el.dataset.action;
    if (a === 'toggle-theme') {
      const next = (localStorage.getItem('theme')||'dark') === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', next);
      document.body.className = next;
      const { renderHeaderControls } = await import('../components/header.js');
      renderHeaderControls();
      return;
    }
    if (a === 'enter-edit')    { enterEditMode(); return; }
    if (a === 'save-changes')  { saveAllDirty(); return; }
    if (a === 'cancel-edit')   { cancelEditMode(); return; }
    if (a === 'close-modal')   { closeTokenModal(); return; }
    if (a === 'save-token')    { handleSaveToken(); return; }

    if (a === 'toggle-equipment') {
      const checked = getEquipmentChecked();
      checked[el.dataset.key] = !checked[el.dataset.key];
      setEquipmentChecked(checked); navigate(getRoute(), true); return;
    }
    if (a === 'cycle-permit') {
      const statuses = getPermitStatus();
      const idx = el.dataset.permitIdx;
      statuses[`permit_${idx}`] = cyclePermitStatus(statuses[`permit_${idx}`] || state.contacts.permits[idx].status);
      setPermitStatus(statuses); navigate(getRoute(), true); return;
    }
    if (a === 'cycle-location-status') {
      const loc = state.locations[parseInt(el.dataset.idx)];
      const c = ['open','pending','confirmed'];
      loc.status = c[(c.indexOf(loc.status)+1)%c.length];
      markDirty('locations'); navigate(getRoute(), true); return;
    }
    if (a === 'cycle-timeline-status') {
      const item = state.timeline[parseInt(el.dataset.idx)];
      const c = ['upcoming','active','done'];
      item.status = c[(c.indexOf(item.status)+1)%c.length];
      markDirty('timeline'); navigate(getRoute(), true); return;
    }
    if (a === 'select-member') { localStorage.setItem('my_tasks_user', el.dataset.member); navigate(getRoute(), true); return; }
    if (a === 'clear-member') { localStorage.removeItem('my_tasks_user'); navigate(getRoute(), true); return; }
    if (a === 'toggle-task-check') {
      const checked = JSON.parse(localStorage.getItem('my_tasks_checked') || '{}');
      const id = el.dataset.taskId;
      checked[id] = !checked[id];
      if (!checked[id]) delete checked[id];
      localStorage.setItem('my_tasks_checked', JSON.stringify(checked));
      navigate(getRoute(), true); return;
    }
    if (a === 'toggle-budget-settled') {
      const settled = JSON.parse(localStorage.getItem('budget_settled') || '{}');
      const idx = el.dataset.idx;
      settled[idx] = !settled[idx];
      if (!settled[idx]) delete settled[idx];
      localStorage.setItem('budget_settled', JSON.stringify(settled));
      navigate(getRoute(), true); return;
    }
    if (a === 'filter-team') { state.teamFilter = el.dataset.filter; navigate(getRoute(), true); return; }

    // CRUD helpers
    const crud = {
      'add-location': () => { state.locations.push({id:state.locations.reduce((m,l)=>Math.max(m,l.id),0)+1,name:'Neue Location',concrete:'',badges:[],vibe:'',reference:'',mapEmbed:'',mapLink:'',status:'open',cluster:''}); markDirty('locations'); },
      'delete-location': () => { if (!confirm('Löschen?')) return false; state.locations.splice(parseInt(el.dataset.idx),1); markDirty('locations'); },
      'add-schedule': () => { state.schedule.push({day:state.schedule.reduce((m,d)=>Math.max(m,d.day),0)+1,date:'2026-06-22',weekday:'So',title:'Neuer Drehtag',icon:'🎬',time:'08:00–18:00',duration:'Ganzer Tag',locations:[],scenes:['Szene 1'],notes:'',conflict:''}); markDirty('schedule'); },
      'delete-schedule': () => { if (!confirm('Löschen?')) return false; state.schedule.splice(parseInt(el.dataset.idx),1); markDirty('schedule'); },
      'add-role': () => { state.team.roles.push({id:generateId(),title:'Neue Rolle',icon:'🎬',description:'',assigned:'',status:'open'}); markDirty('team'); },
      'delete-role': () => { if (!confirm('Löschen?')) return false; state.team.roles.splice(parseInt(el.dataset.idx),1); markDirty('team'); },
      'add-equipment-item': () => { state.equipment.categories[parseInt(el.dataset.cat)].items.push({name:'Neues Equipment',owned:false}); markDirty('equipment'); },
      'add-equipment-category': () => { state.equipment.categories.push({title:'Neue Kategorie',items:[]}); markDirty('equipment'); },
      'delete-equipment': () => { state.equipment.categories[parseInt(el.dataset.cat)].items.splice(parseInt(el.dataset.idx),1); markDirty('equipment'); },
      'add-budget': () => { state.budget.items.push({name:'Neue Ausgabe',amount:0,paidBy:'',status:'open',notes:''}); markDirty('budget'); },
      'delete-budget': () => { if (!confirm('Löschen?')) return false; state.budget.items.splice(parseInt(el.dataset.idx),1); markDirty('budget'); },
      'add-timeline': () => { state.timeline.push({phase:'Post-Production',title:'Neuer Meilenstein',date:'TBD',status:'upcoming'}); markDirty('timeline'); },
      'delete-timeline': () => { if (!confirm('Löschen?')) return false; state.timeline.splice(parseInt(el.dataset.idx),1); markDirty('timeline'); },
      'add-contact': () => { state.contacts.contacts.push({id:generateId(),name:'Neuer Kontakt',role:'',category:'city',phone:'',email:'',address:'',note:''}); markDirty('contacts'); },
      'delete-contact': () => { if (!confirm('Löschen?')) return false; state.contacts.contacts.splice(parseInt(el.dataset.idx),1); markDirty('contacts'); },
      'add-kanban-task': () => { state.kanban.tasks.push({id:generateId(),title:'Neue Aufgabe',description:'',assignee:'',owner:'',status:el.dataset.status,deadline:''}); markDirty('kanban'); },
      'delete-kanban-task': () => { if (!confirm('Löschen?')) return false; state.kanban.tasks.splice(parseInt(el.dataset.idx),1); markDirty('kanban'); },
    };
    if (crud[a]) { const ok = crud[a](); if (ok !== false) navigate(getRoute(), true); }
    return;
  }

  const fb = e.target.closest('[data-filter]');
  if (fb) { e.preventDefault(); state.activeFilter = fb.dataset.filter; navigate(getRoute(), true); }
});

// ── Input delegation ─────────────────────────────────────────────────────────
let ceTimer = null;
let searchTimer = null;
document.addEventListener('input', e => {
  const el = e.target;

  // ── Search input handler ──
  if (el.dataset.action === 'search-input') {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(async () => {
      state.searchQuery = el.value.trim();
      const { getSearchResults, renderSearchResults } = await import('../components/search.js');
      const results = getSearchResults(state.searchQuery);
      renderSearchResults(results);
    }, 300);
    return;
  }

  if (el.hasAttribute('contenteditable') && el.dataset.field && el.dataset.file) {
    clearTimeout(ceTimer);
    ceTimer = setTimeout(() => {
      const { file, field, subkey } = el.dataset;
      const idx = el.dataset.idx !== undefined ? parseInt(el.dataset.idx) : null;
      const val = el.textContent.trim();
      if (file==='locations' && idx!==null) state.locations[idx][field]=val;
      else if (file==='schedule' && idx!==null) state.schedule[idx][field]=val;
      else if (file==='team' && field==='lead.name') state.team.lead.name=val;
      else if (file==='budget' && idx!==null) state.budget.items[idx][field]=val;
      else if (file==='timeline' && idx!==null) state.timeline[idx][field]=val;
      else if (file==='contacts' && idx!==null && subkey==='contacts') state.contacts.contacts[idx][field]=val;
      else if (file==='kanban' && idx!==null && subkey==='tasks') state.kanban.tasks[idx][field]=val;
      else if (file==='equipment') { const ci=parseInt(el.dataset.cat),ii=parseInt(el.dataset.idx); if(!isNaN(ci)&&!isNaN(ii)) state.equipment.categories[ci].items[ii][field]=val; }
      markDirty(file);
    }, 400);
    return;
  }
  const act = el.dataset.action;
  if (act==='budget-amount') { state.budget.items[parseInt(el.dataset.idx)].amount=parseFloat(el.value)||0; markDirty('budget'); }
  else if (act==='budget-paidby') { state.budget.items[parseInt(el.dataset.idx)].paidBy=el.value; markDirty('budget'); }
  else if (act==='budget-status') { state.budget.items[parseInt(el.dataset.idx)].status=el.value; markDirty('budget'); }
  else if (act==='assign-role') { state.team.roles[parseInt(el.dataset.idx)].assigned=el.value; markDirty('team'); }
  else if (act==='assign-filmrolle') { state.team.filmrollen[parseInt(el.dataset.idx)].assigned=el.value; markDirty('team'); }
  else if (act==='change-kanban-status') { state.kanban.tasks[parseInt(el.dataset.idx)].status=el.value; markDirty('kanban'); navigate(getRoute(),true); }
  else if (act==='kanban-owner') { state.kanban.tasks[parseInt(el.dataset.idx)].owner=el.value; markDirty('kanban'); }
  else if (act==='kanban-assignee') { state.kanban.tasks[parseInt(el.dataset.idx)].assignee=el.value; markDirty('kanban'); }
  else if (act==='kanban-deadline') { state.kanban.tasks[parseInt(el.dataset.idx)].deadline=el.value; markDirty('kanban'); }
});

// ── Keyboard shortcuts ────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key==='Escape') {
    if (document.getElementById('token-modal')) { closeTokenModal(); return; }
    if (state.editMode) cancelEditMode();
  }
  if ((e.ctrlKey||e.metaKey) && e.key==='s') { e.preventDefault(); if (state.editMode) saveAllDirty(); }
});
document.addEventListener('keypress', e => {
  if (e.key==='Enter' && e.target.id==='token-input') { e.preventDefault(); handleSaveToken(); }
});

// ── Close search results on outside click ────────────────────────────────────
document.addEventListener('click', e => {
  const wrapper = document.getElementById('search-wrapper');
  const results = document.getElementById('search-results');
  if (results && wrapper && !wrapper.contains(e.target)) {
    results.classList.add('hidden');
    results.textContent = '';
  }
}, true);
