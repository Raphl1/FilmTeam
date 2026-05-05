/**
 * FR(AI)ME — Night of the Graduates 2026
 * Single Page Application with Inline Editing, GitHub Sync & Kanban DnD
 * Vanilla JS · Hash Router · localStorage persistence
 */

// =============================================================================
// STATE
// =============================================================================
const state = {
  config: null,
  locations: null,
  schedule: null,
  contacts: null,
  team: null,
  equipment: null,
  budget: null,
  timeline: null,
  kanban: null,
  activeFilter: 'all',
  editMode: false,
  dirty: new Set(),       // tracks which data files have been modified
  saving: false,
  loaded: false
};

// =============================================================================
// GITHUB SYNC CONFIG
// =============================================================================
const GITHUB_REPO = 'Raphl1/FilmTeam';
const GITHUB_BRANCH = 'main';
const DATA_PATH = 'data';

function getGithubToken() {
  return localStorage.getItem('github_token') || '';
}

function setGithubToken(token) {
  localStorage.setItem('github_token', token);
}

function hasGithubToken() {
  return !!getGithubToken();
}

// Fetch SHA for a file from GitHub
async function fetchFileSHA(filePath) {
  const token = getGithubToken();
  const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}?ref=${GITHUB_BRANCH}`, {
    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json' }
  });
  if (res.ok) {
    const data = await res.json();
    return data.sha;
  }
  return null;
}

// Save a single JSON file to GitHub via API
async function saveFileToGithub(fileName, data) {
  const token = getGithubToken();
  if (!token) return { ok: false, error: 'Kein Token' };

  const filePath = `${DATA_PATH}/${fileName}.json`;

  try {
    const sha = await fetchFileSHA(filePath);
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2) + '\n')));
    const body = {
      message: `Update ${fileName}.json via FR(AI)ME Editor`,
      content,
      branch: GITHUB_BRANCH
    };
    if (sha) body.sha = sha;

    const putRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (putRes.ok) return { ok: true };
    const err = await putRes.json();
    return { ok: false, error: err.message || 'Fehler beim Speichern' };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// Save all dirty files to GitHub
async function saveAllDirty() {
  if (state.dirty.size === 0) {
    showToast('Keine \u00c4nderungen vorhanden', 'info');
    return;
  }

  state.saving = true;
  renderHeaderControls();
  showToast('Speichere...', 'info');

  let errors = [];
  for (const file of state.dirty) {
    const result = await saveFileToGithub(file, state[file]);
    if (!result.ok) errors.push(`${file}: ${result.error}`);
  }

  state.saving = false;

  if (errors.length === 0) {
    showToast('Gespeichert \u2713', 'success');
    state.dirty.clear();
    exitEditMode();
    await fetchAllData();
    render();
  } else {
    showToast('Fehler: ' + errors.join(', '), 'error');
    renderHeaderControls();
  }
}

// =============================================================================
// THEME
// =============================================================================
function getTheme() {
  return localStorage.getItem('theme') || 'dark';
}

function applyTheme(theme) {
  localStorage.setItem('theme', theme);
  document.body.className = theme;
}

// =============================================================================
// ROUTER
// =============================================================================
function getRoute() {
  return window.location.hash.slice(1) || 'hub';
}

// =============================================================================
// ICONS (emoji-based for zero dependencies)
// =============================================================================
const ICONS = {
  'grid': '\u25A6',
  'map-pin': '\uD83D\uDCCD',
  'calendar': '\uD83D\uDCC5',
  'users': '\uD83D\uDC65',
  'camera': '\uD83C\uDFA5',
  'wallet': '\uD83D\uDCB0',
  'clock': '\u23F3',
  'phone': '\uD83D\uDCDE',
  'calendar-days': '\uD83D\uDDD3\uFE0F',
  'kanban': '\uD83D\uDCCB',
  'user': '\uD83D\uDC64',
  'sun': '\u2600\uFE0F',
  'moon': '\uD83C\uDF19'
};

// =============================================================================
// UTILITIES
// =============================================================================
function formatDate(dateStr) {
  const d = new Date(dateStr);
  const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  return `${days[d.getDay()]}, ${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
}

function getEquipmentChecked() {
  try { return JSON.parse(localStorage.getItem('equipment_checked') || '{}'); }
  catch { return {}; }
}

function setEquipmentChecked(data) {
  localStorage.setItem('equipment_checked', JSON.stringify(data));
}

function getPermitStatus() {
  try { return JSON.parse(localStorage.getItem('permit_status') || '{}'); }
  catch { return {}; }
}

function setPermitStatus(data) {
  localStorage.setItem('permit_status', JSON.stringify(data));
}

function getPermitLabel(status) {
  const labels = {
    'not-asked': 'Nicht angefragt',
    'not-booked': 'Nicht gebucht',
    'pending': 'Ausstehend',
    'approved': 'Genehmigt',
    'declined': 'Abgelehnt'
  };
  return labels[status] || status;
}

function cyclePermitStatus(current) {
  const cycle = ['not-asked', 'pending', 'approved', 'declined'];
  const idx = cycle.indexOf(current);
  return cycle[(idx + 1) % cycle.length];
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// =============================================================================
// TOAST SYSTEM
// =============================================================================
function showToast(message, type = 'success') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// =============================================================================
// EDIT MODE LOGIC
// =============================================================================
function enterEditMode() {
  if (!hasGithubToken()) {
    showTokenModal();
    return;
  }
  state.editMode = true;
  state.dirty.clear();
  document.body.classList.add('edit-mode-active');
  render();
  showToast('Bearbeitungsmodus aktiv', 'info');
}

function exitEditMode() {
  state.editMode = false;
  state.dirty.clear();
  document.body.classList.remove('edit-mode-active');
  render();
}

function cancelEditMode() {
  if (state.dirty.size > 0) {
    if (!confirm('Ungespeicherte \u00c4nderungen verwerfen?')) return;
  }
  // Reload data to discard changes
  fetchAllData().then(() => {
    exitEditMode();
    showToast('\u00c4nderungen verworfen', 'info');
  });
}

function markDirty(file) {
  state.dirty.add(file);
  renderHeaderControls();
}

function showTokenModal() {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'token-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <h3>GitHub Token erforderlich</h3>
      <p>Um \u00c4nderungen zu speichern, ben\u00f6tigst du einen <strong>Personal Access Token</strong> mit <code>repo</code> Berechtigung.</p>
      <p><a href="https://github.com/settings/tokens/new?scopes=repo&description=FRAIME+Editor" target="_blank" rel="noopener">Token erstellen &rarr;</a></p>
      <input type="password" id="token-input" placeholder="ghp_xxxxxxxxxxxx" class="token-input" autocomplete="off" />
      <div class="modal-actions">
        <button class="btn btn-secondary" data-action="close-modal">Abbrechen</button>
        <button class="btn btn-primary" data-action="save-token">Speichern</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  requestAnimationFrame(() => modal.classList.add('show'));
  document.getElementById('token-input').focus();
}

function closeTokenModal() {
  const modal = document.getElementById('token-modal');
  if (modal) {
    modal.classList.remove('show');
    setTimeout(() => modal.remove(), 300);
  }
}

// =============================================================================
// DATA FETCHING
// =============================================================================
async function fetchAllData() {
  const files = ['config', 'locations', 'schedule', 'contacts', 'team', 'equipment', 'budget', 'timeline', 'kanban'];
  const results = await Promise.all(
    files.map(f => fetch(`data/${f}.json?t=${Date.now()}`).then(r => r.json()))
  );
  files.forEach((name, i) => { state[name] = results[i]; });
}

// =============================================================================
// SKELETON LOADING
// =============================================================================
function renderSkeleton() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <header class="site-header">
      <div class="header-inner">
        <div class="header-text">
          <div class="skeleton skeleton-tag"></div>
          <div class="skeleton skeleton-title"></div>
          <div class="skeleton skeleton-subtitle"></div>
        </div>
      </div>
    </header>
    <nav class="site-nav">
      ${Array(9).fill('<div class="skeleton skeleton-nav-item"></div>').join('')}
    </nav>
    <main class="page-main">
      <div class="view-container">
        <div class="skeleton-grid">
          ${Array(6).fill('<div class="skeleton skeleton-card"></div>').join('')}
        </div>
      </div>
    </main>
  `;
}

// =============================================================================
// MAIN RENDER
// =============================================================================
function render() {
  const scrollPos = window.scrollY;
  const theme = getTheme();
  applyTheme(theme);

  const app = document.getElementById('app');
  const route = getRoute();
  const themeIcon = theme === 'dark' ? ICONS.sun : ICONS.moon;
  const editClass = state.editMode ? 'editing' : '';

  app.innerHTML = `
    <header class="site-header ${editClass}">
      <div class="header-inner">
        <div class="header-text">
          <div class="tag">Filmteam DHBW Mannheim MPG24</div>
          <h1>FR<span class="ai">(AI)</span>ME<span class="sep"> \u2014 </span>Night of the Graduates</h1>
          <div class="subtitle">Vollst\u00e4ndige Projektplanung \u00b7 2026</div>
        </div>
        <div class="header-actions" id="header-actions">
          ${renderHeaderButtons(themeIcon)}
        </div>
      </div>
    </header>

    <nav class="site-nav" id="main-nav">
      ${state.config.navigation.map(item => `
        <a href="#${item.id}" class="nav-item ${item.id === route ? 'active' : ''}" data-route="${item.id}">
          <span class="nav-icon">${ICONS[item.icon] || ''}</span>
          <span class="nav-label">${item.label}</span>
        </a>
      `).join('')}
    </nav>

    <main class="page-main">
      <div class="view-container" id="view-container">
        ${renderView(route)}
      </div>
    </main>
  `;

  // Restore scroll position
  window.scrollTo(0, scrollPos);

  // Initialize drag and drop if on kanban view and NOT in edit mode
  if (route === 'kanban' && !state.editMode) {
    initKanbanDragAndDrop();
  }
}

function renderHeaderButtons(themeIcon) {
  if (state.editMode) {
    return `
      <span class="edit-label">Bearbeiten</span>
      <button class="header-btn save-btn" data-action="save-changes" title="Speichern" ${state.saving ? 'disabled' : ''}>
        ${state.saving ? '\u23F3' : '\uD83D\uDCBE'}
      </button>
      <button class="header-btn cancel-btn" data-action="cancel-edit" title="Abbrechen">
        \u2715
      </button>
      <button class="theme-toggle" data-action="toggle-theme" aria-label="Theme wechseln">
        ${themeIcon}
      </button>
    `;
  }
  return `
    <button class="header-btn edit-btn" data-action="enter-edit" title="Bearbeiten">
      \u270F\uFE0F
    </button>
    <button class="theme-toggle" data-action="toggle-theme" aria-label="Theme wechseln">
      ${themeIcon}
    </button>
  `;
}

function renderHeaderControls() {
  const actions = document.getElementById('header-actions');
  if (!actions) return;
  const theme = getTheme();
  const themeIcon = theme === 'dark' ? ICONS.sun : ICONS.moon;
  actions.innerHTML = renderHeaderButtons(themeIcon);
}

// =============================================================================
// VIEW DISPATCHER
// =============================================================================
function renderView(route) {
  switch (route) {
    case 'hub':       return viewHub();
    case 'my-tasks':  return viewMyTasks();
    case 'kanban':    return viewKanban();
    case 'locations': return viewLocations();
    case 'schedule':  return viewSchedule();
    case 'team':      return viewTeam();
    case 'equipment': return viewEquipment();
    case 'budget':    return viewBudget();
    case 'timeline':  return viewTimeline();
    case 'contacts':  return viewContacts();
    case 'calendar':  return viewCalendar();
    default:          return viewHub();
  }
}

// =============================================================================
// VIEW: HUB
// =============================================================================
function viewHub() {
  const { stats, navigation } = state.config;
  const links = navigation.filter(n => n.id !== 'hub');

  const descriptions = {
    'locations': '15 Locations mit Maps, Referenzen und Status.',
    'schedule': '5-Tage Drehplan mit Szenen und Konflikten.',
    'team': 'Rollen und offene Positionen im \u00dcberblick.',
    'equipment': 'Checkliste f\u00fcr Kamera, Licht, Ton & Props.',
    'budget': 'Min/Max Kalkulation aller Kostenpunkte.',
    'timeline': 'Meilensteine bis zur Premiere.',
    'contacts': 'Ansprechpartner & Genehmigungsstatus.',
    'calendar': 'Google Calendar mit allen Drehterminen.'
  };

  return `
    <div class="hub-banner">
      <span class="hub-banner-icon">\uD83C\uDFAC</span>
      <div class="hub-banner-text">
        <strong>Erster Drehtag: 17. Juni 2026</strong>
        <span class="hub-banner-sub">5 Drehtage \u00b7 15 Locations \u00b7 Mannheim & Weinheim</span>
      </div>
    </div>

    <div class="stats-grid">
      ${stats.map(s => `
        <div class="stat-card">
          <div class="stat-num">${s.value}</div>
          <div class="stat-label">${s.label}</div>
        </div>
      `).join('')}
    </div>

    <h2 class="view-title">Schnellzugriff</h2>
    <div class="hub-grid">
      ${links.map(item => `
        <a href="#${item.id}" class="hub-card">
          <div class="hc-icon">${ICONS[item.icon] || ''}</div>
          <div class="hc-title">${item.label}</div>
          <div class="hc-desc">${descriptions[item.id] || ''}</div>
        </a>
      `).join('')}
    </div>
  `;
}

// =============================================================================
// VIEW: MY TASKS (persoenliche Aufgabenansicht)
// =============================================================================
function viewMyTasks() {
  const members = state.team.members || [];
  const tasks = state.kanban.tasks || [];
  const selectedMember = localStorage.getItem('my_tasks_user') || '';

  // Filter tasks for selected member
  const myTasks = selectedMember
    ? tasks.filter(t =>
        (t.owner && t.owner.toLowerCase() === selectedMember.toLowerCase()) ||
        (t.assignee && t.assignee.toLowerCase().includes(selectedMember.toLowerCase()))
      )
    : [];

  const todoTasks = myTasks.filter(t => t.status === 'todo');
  const inProgressTasks = myTasks.filter(t => t.status === 'in-progress');
  const doneTasks = myTasks.filter(t => t.status === 'done');
  const otherTasks = myTasks.filter(t => !['todo','in-progress','done'].includes(t.status));

  function renderTaskList(taskList, label, color) {
    if (taskList.length === 0) return '';
    return `
      <div class="my-tasks-section">
        <div class="my-tasks-section-header" style="border-left:3px solid ${color}">
          <span>${label}</span>
          <span class="my-tasks-count">${taskList.length}</span>
        </div>
        ${taskList.map(t => `
          <div class="my-task-item">
            <div class="my-task-title">${escapeHtml(t.title)}</div>
            ${t.description ? `<div class="my-task-desc">${escapeHtml(t.description)}</div>` : ''}
            <div class="my-task-meta">
              ${t.deadline ? `<span class="my-task-deadline">\uD83D\uDCC5 ${escapeHtml(t.deadline)}</span>` : ''}
              ${t.owner ? `<span class="my-task-owner">Owner: ${escapeHtml(t.owner)}</span>` : ''}
              ${t.assignee ? `<span class="my-task-assignee">Zugewiesen: ${escapeHtml(t.assignee)}</span>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  return `
    <h2 class="view-title">\uD83D\uDC64 Meine Aufgaben</h2>

    <div class="my-tasks-selector">
      <label class="my-tasks-label">Wer bist du?</label>
      <div class="my-tasks-chips">
        ${members.map(m => `
          <button class="my-tasks-chip ${selectedMember === m.name ? 'active' : ''}" data-action="select-member" data-member="${escapeHtml(m.name)}" style="${selectedMember === m.name ? `background:${m.color}20; border-color:${m.color}; color:${m.color}` : ''}">
            ${escapeHtml(m.name)}
          </button>
        `).join('')}
      </div>
    </div>

    ${!selectedMember ? `
      <div class="empty-state">
        <div class="empty-icon">\uD83D\uDC46</div>
        <p>W\u00e4hle oben deinen Namen um deine Aufgaben zu sehen.</p>
      </div>
    ` : `
      <div class="my-tasks-summary">
        <span class="my-tasks-name">${escapeHtml(selectedMember)}</span>
        <span class="my-tasks-total">${myTasks.length} Aufgabe${myTasks.length !== 1 ? 'n' : ''}</span>
      </div>

      ${myTasks.length === 0 ? `
        <div class="empty-state">
          <div class="empty-icon">\u2705</div>
          <p>Keine Aufgaben \u2014 alles erledigt!</p>
        </div>
      ` : `
        ${renderTaskList(inProgressTasks, 'In Arbeit', '#6c3fc5')}
        ${renderTaskList(todoTasks, 'Zu erledigen', '#f72585')}
        ${renderTaskList(otherTasks, 'Sonstiges', '#f9c74f')}
        ${renderTaskList(doneTasks, 'Erledigt', '#43aa8b')}
      `}
    `}
  `;
}

// =============================================================================
// VIEW: KANBAN (Jira-Style with Drag-and-Drop)
// =============================================================================
function viewKanban() {
  const { columns, tasks } = state.kanban;
  const members = state.team.members || [];
  const editing = state.editMode;

  // Count per status
  const counts = {};
  columns.forEach(col => { counts[col.id] = tasks.filter(t => t.status === col.id).length; });
  const totalTasks = tasks.length;
  const doneTasksCount = counts['done'] || 0;

  // Avatar color from name
  function avatarColor(name) {
    if (!name) return 'var(--muted)';
    const colors = ['#6c3fc5', '#f72585', '#43aa8b', '#4285f4', '#f9c74f', '#ff6b35', '#9b5de5', '#00bbf9'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  }

  function avatarInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  }

  // Determine if cards should be draggable (only when NOT in edit mode)
  const draggableAttr = !editing ? 'draggable="true"' : '';

  return `
    <div class="kanban-header-bar">
      <h2 class="view-title">\uD83D\uDCCB Board</h2>
      <div class="kanban-progress">
        <span class="kanban-progress-text">${doneTasksCount}/${totalTasks} erledigt</span>
        <div class="kanban-progress-bar">
          <div class="kanban-progress-fill" style="width:${totalTasks > 0 ? (doneTasksCount/totalTasks*100) : 0}%"></div>
        </div>
      </div>
    </div>

    <div class="kanban-board">
      ${columns.map(col => {
        const colTasks = tasks.filter(t => t.status === col.id);
        return `
          <div class="kanban-column" data-column="${col.id}">
            <div class="kanban-col-header">
              <div class="kanban-col-dot" style="background:${col.color}"></div>
              <span class="kanban-col-title">${col.label}</span>
              <span class="kanban-col-count">${colTasks.length}</span>
            </div>
            <div class="kanban-col-body" data-col-id="${col.id}">
              ${colTasks.map(task => {
                const realIdx = tasks.indexOf(task);
                const deleteBtn = editing ? `<button class="kanban-delete" data-action="delete-kanban-task" data-idx="${realIdx}">\u2715</button>` : '';
                const statusSelect = editing ? `
                  <select class="kanban-status-select" data-action="change-kanban-status" data-idx="${realIdx}">
                    ${columns.map(c => `<option value="${c.id}" ${task.status === c.id ? 'selected' : ''}>${c.label}</option>`).join('')}
                  </select>` : '';

                const ownerAvatar = task.owner ? `
                  <div class="kanban-avatar" style="background:${avatarColor(task.owner)}" title="${escapeHtml(task.owner)}">
                    ${avatarInitials(task.owner)}
                  </div>` : '';

                const assigneeTags = task.assignee ? task.assignee.split(',').map(a => a.trim()).filter(Boolean).map(a => `
                  <span class="kanban-assignee-tag">${escapeHtml(a)}</span>
                `).join('') : '';

                const deadlineClass = task.deadline && new Date(task.deadline) < new Date() ? 'overdue' : '';

                // Editable fields
                const titleField = editing
                  ? `<span contenteditable="true" data-field="title" data-file="kanban" data-idx="${realIdx}" data-subkey="tasks">${escapeHtml(task.title)}</span>`
                  : escapeHtml(task.title);

                const descField = editing
                  ? `<div class="kanban-card-desc" contenteditable="true" data-field="description" data-file="kanban" data-idx="${realIdx}" data-subkey="tasks">${escapeHtml(task.description || '')}</div>`
                  : (task.description ? `<div class="kanban-card-desc">${escapeHtml(task.description)}</div>` : '');

                const ownerField = editing
                  ? `<input type="text" class="kanban-inline-input" value="${escapeHtml(task.owner || '')}" placeholder="Owner..." data-action="kanban-owner" data-idx="${realIdx}" />`
                  : (task.owner ? `<span class="kanban-owner-label">${escapeHtml(task.owner)}</span>` : '');

                const assigneeField = editing
                  ? `<input type="text" class="kanban-inline-input" value="${escapeHtml(task.assignee || '')}" placeholder="Zugewiesen an..." data-action="kanban-assignee" data-idx="${realIdx}" />`
                  : '';

                const deadlineField = editing
                  ? `<input type="date" class="kanban-inline-input kanban-date-input" value="${task.deadline || ''}" data-action="kanban-deadline" data-idx="${realIdx}" />`
                  : (task.deadline ? `<span class="kanban-deadline ${deadlineClass}">\uD83D\uDCC5 ${escapeHtml(task.deadline)}</span>` : '');

                return `
                  <div class="kanban-card" ${draggableAttr} data-task-idx="${realIdx}">
                    ${deleteBtn}
                    <div class="kanban-card-top">
                      <span class="kanban-card-id">${task.id.toUpperCase()}</span>
                      ${editing ? '' : ownerAvatar}
                    </div>
                    <div class="kanban-card-title">${titleField}</div>
                    ${descField}
                    ${editing ? `
                      <div class="kanban-edit-fields">
                        <label class="kanban-field-label">Owner</label>
                        ${ownerField}
                        <label class="kanban-field-label">Zugewiesen</label>
                        ${assigneeField}
                        <label class="kanban-field-label">Deadline</label>
                        ${deadlineField}
                      </div>
                    ` : `
                      ${assigneeTags ? `<div class="kanban-assignees">${assigneeTags}</div>` : ''}
                      <div class="kanban-card-footer">
                        ${ownerField}
                        ${deadlineField}
                      </div>
                    `}
                    ${statusSelect}
                  </div>
                `;
              }).join('')}
              ${colTasks.length === 0 ? '<div class="kanban-empty">Keine Aufgaben</div>' : ''}
            </div>
            ${editing ? `<button class="kanban-add-btn" data-action="add-kanban-task" data-status="${col.id}">+ Aufgabe</button>` : ''}
          </div>
        `;
      }).join('')}
    </div>

    <div class="kanban-members-bar">
      <span class="kanban-members-label">Team:</span>
      ${members.map(m => `
        <div class="kanban-member-chip" title="${escapeHtml(m)}">
          <div class="kanban-avatar-sm" style="background:${avatarColor(m)}">${avatarInitials(m)}</div>
          <span>${escapeHtml(m)}</span>
        </div>
      `).join('')}
    </div>
  `;
}

// =============================================================================
// VIEW: LOCATIONS
// =============================================================================
function viewLocations() {
  const locations = state.locations;
  const filter = state.activeFilter;
  const allBadges = [...new Set(locations.flatMap(l => l.badges))];
  const editing = state.editMode;

  let filtered;
  if (filter === 'all') {
    filtered = locations;
  } else if (filter === 'open') {
    filtered = locations.filter(l => l.status === 'open');
  } else {
    filtered = locations.filter(l => l.badges.includes(filter));
  }

  const emptyState = filtered.length === 0
    ? '<div class="empty-state">Keine Locations gefunden f\u00fcr diesen Filter.</div>'
    : '';

  return `
    <h2 class="view-title">\uD83D\uDCCD Drehorte</h2>
    <div class="filter-bar">
      <button class="filter-btn ${filter === 'all' ? 'active' : ''}" data-filter="all">Alle</button>
      ${allBadges.map(b => `
        <button class="filter-btn ${filter === b ? 'active' : ''}" data-filter="${b}">${b}</button>
      `).join('')}
      <button class="filter-btn ${filter === 'open' ? 'active' : ''}" data-filter="open">Offen</button>
    </div>
    ${emptyState}
    <div class="locations-grid">
      ${filtered.map((loc, idx) => {
        const realIdx = locations.indexOf(loc);
        const statusClass = loc.status === 'confirmed' ? 'status-green'
          : loc.status === 'pending' ? 'status-yellow' : 'status-gray';
        const statusLabel = loc.status === 'confirmed' ? 'Best\u00e4tigt'
          : loc.status === 'pending' ? 'Ausstehend' : 'Offen';

        const mapEmbed = loc.mapEmbed
          ? `<div class="loc-map"><iframe src="${loc.mapEmbed}" loading="lazy" allowfullscreen referrerpolicy="no-referrer-when-downgrade"></iframe></div>`
          : '';

        const mapLink = loc.mapLink
          ? `<a href="${loc.mapLink}" target="_blank" rel="noopener" class="maps-btn">\uD83D\uDDFA\uFE0F Google Maps</a>`
          : '';

        const deleteBtn = editing ? `<button class="delete-btn" data-action="delete-location" data-idx="${realIdx}" title="L\u00f6schen">\u2715</button>` : '';

        const statusBadge = editing
          ? `<span class="status-badge ${statusClass} editable-badge" data-action="cycle-location-status" data-idx="${realIdx}">${statusLabel}</span>`
          : `<span class="status-badge ${statusClass}">${statusLabel}</span>`;

        const nameField = editing
          ? `<h3 class="loc-name" contenteditable="true" data-field="name" data-file="locations" data-idx="${realIdx}">${escapeHtml(loc.name)}</h3>`
          : `<h3 class="loc-name">${escapeHtml(loc.name)}</h3>`;

        const concreteField = editing
          ? `<p class="loc-concrete" contenteditable="true" data-field="concrete" data-file="locations" data-idx="${realIdx}">${escapeHtml(loc.concrete)}</p>`
          : `<p class="loc-concrete">${escapeHtml(loc.concrete)}</p>`;

        const vibeField = editing
          ? `<p class="loc-vibe" contenteditable="true" data-field="vibe" data-file="locations" data-idx="${realIdx}">${escapeHtml(loc.vibe)}</p>`
          : `<p class="loc-vibe">${escapeHtml(loc.vibe)}</p>`;

        return `
          <div class="card loc-card">
            ${deleteBtn}
            ${mapEmbed}
            <div class="loc-body">
              <div class="loc-header">
                <span class="loc-id">#${String(loc.id).padStart(2, '0')}</span>
                ${statusBadge}
              </div>
              ${nameField}
              ${concreteField}
              <div class="loc-badges">
                ${loc.badges.map(b => `<span class="badge badge-${b.toLowerCase()}">${b}</span>`).join(' ')}
              </div>
              ${vibeField}
              ${loc.reference ? `<div class="loc-ref">\uD83C\uDFAC ${escapeHtml(loc.reference)}</div>` : ''}
              ${mapLink}
            </div>
          </div>
        `;
      }).join('')}
    </div>
    ${editing ? `<button class="add-item-btn" data-action="add-location">+ Location hinzuf\u00fcgen</button>` : ''}
  `;
}

// =============================================================================
// VIEW: SCHEDULE
// =============================================================================
function viewSchedule() {
  const days = state.schedule;
  const calUrl = state.config.project.calendarUrl;
  const editing = state.editMode;

  return `
    <h2 class="view-title">\uD83D\uDCC5 Drehplan</h2>
    <div class="schedule-grid">
      ${days.map((day, idx) => {
        const locNames = day.locations.map(id => {
          const loc = state.locations.find(l => l.id === id);
          return loc ? loc.name : `#${id}`;
        });

        const deleteBtn = editing ? `<button class="delete-btn" data-action="delete-schedule" data-idx="${idx}" title="L\u00f6schen">\u2715</button>` : '';

        const titleField = editing
          ? `<h3 class="sched-title"><span>${day.icon}</span> <span contenteditable="true" data-field="title" data-file="schedule" data-idx="${idx}">${escapeHtml(day.title)}</span></h3>`
          : `<h3 class="sched-title">${day.icon} ${escapeHtml(day.title)}</h3>`;

        const notesField = editing
          ? `<div class="sched-notes" contenteditable="true" data-field="notes" data-file="schedule" data-idx="${idx}">${escapeHtml(day.notes || '')}</div>`
          : (day.notes ? `<div class="sched-notes">\uD83D\uDCDD ${escapeHtml(day.notes)}</div>` : '');

        return `
          <div class="card schedule-card">
            ${deleteBtn}
            <div class="sched-header">
              <span class="sched-day">Tag ${day.day}</span>
              <span class="sched-date">${formatDate(day.date)}</span>
            </div>
            ${titleField}
            <div class="sched-time">\u23F0 ${day.time}</div>
            <div class="sched-locations">
              <strong>Locations:</strong>
              <div class="sched-loc-tags">
                ${locNames.map(n => `<span class="sched-loc-tag">${escapeHtml(n)}</span>`).join('')}
              </div>
            </div>
            <div class="sched-scenes">
              <strong>Szenen:</strong>
              <ul>${day.scenes.map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ul>
            </div>
            ${notesField}
            ${day.conflict ? `<div class="sched-conflict">\u26A0\uFE0F <strong>Konflikt:</strong> ${escapeHtml(day.conflict)}</div>` : ''}
          </div>
        `;
      }).join('')}
    </div>
    ${editing ? `<button class="add-item-btn" data-action="add-schedule">+ Drehtag hinzuf\u00fcgen</button>` : ''}
    <h3 class="sub-title">\uD83D\uDCC6 Google Kalender</h3>
    <div class="calendar-embed">
      <iframe src="${calUrl}&mode=WEEK" loading="lazy"></iframe>
    </div>
  `;
}

// =============================================================================
// VIEW: TEAM
// =============================================================================
function viewTeam() {
  const { lead, roles } = state.team;
  const editing = state.editMode;

  return `
    <h2 class="view-title">\uD83D\uDC65 Team & Rollen</h2>
    <div class="team-lead card">
      <div class="lead-icon">\uD83D\uDC51</div>
      <div class="lead-info">
        <h3>Projektleitung</h3>
        ${editing
          ? `<p class="lead-name" contenteditable="true" data-field="lead.name" data-file="team">${escapeHtml(lead.name)}</p>`
          : `<p class="lead-name">${escapeHtml(lead.name)}</p>`}
      </div>
      <span class="status-badge status-green">Zugewiesen</span>
    </div>
    <div class="team-grid">
      ${roles.map((role, idx) => {
        const assigned = role.assigned && role.assigned.trim() !== '';
        const deleteBtn = editing ? `<button class="delete-btn" data-action="delete-role" data-idx="${idx}" title="L\u00f6schen">\u2715</button>` : '';

        const personField = editing
          ? `<input type="text" class="inline-input" value="${escapeHtml(role.assigned || '')}" placeholder="Name zuweisen..." data-action="assign-role" data-idx="${idx}" />`
          : `<span class="role-person ${assigned ? '' : 'role-open'}">${assigned ? escapeHtml(role.assigned) : 'Offen'}</span>`;

        return `
          <div class="card role-card">
            ${deleteBtn}
            <div class="role-icon">${role.icon}</div>
            <h3 class="role-title">${escapeHtml(role.title)}</h3>
            <p class="role-desc">${escapeHtml(role.description)}</p>
            <div class="role-footer">
              ${personField}
              <span class="status-dot ${assigned ? 'status-green' : 'status-yellow'}"></span>
            </div>
          </div>
        `;
      }).join('')}
    </div>
    ${editing ? `<button class="add-item-btn" data-action="add-role">+ Rolle hinzuf\u00fcgen</button>` : ''}
  `;
}

// =============================================================================
// VIEW: EQUIPMENT
// =============================================================================
function viewEquipment() {
  const { categories } = state.equipment;
  const checked = getEquipmentChecked();
  const editing = state.editMode;

  let total = 0, done = 0;
  categories.forEach(cat => {
    cat.items.forEach((_, idx) => {
      total++;
      if (checked[`${cat.title}_${idx}`]) done++;
    });
  });

  return `
    <h2 class="view-title">\uD83C\uDFA5 Equipment</h2>
    <div class="equipment-summary">
      <div class="eq-progress-text"><strong>${done}</strong> von <strong>${total}</strong> Positionen erledigt</div>
      <div class="eq-progress-bar">
        <div class="eq-progress-fill" style="width:${total > 0 ? (done / total * 100) : 0}%"></div>
      </div>
    </div>
    <div class="equipment-list">
      ${categories.map((cat, catIdx) => `
        <div class="eq-category">
          <h3 class="eq-cat-title">${escapeHtml(cat.title)}</h3>
          <div class="eq-items">
            ${cat.items.map((item, idx) => {
              const key = `${cat.title}_${idx}`;
              const isChecked = !!checked[key];
              const checkbox = isChecked ? '\u2611' : '\u2610';
              const ownedBadge = item.owned
                ? '<span class="eq-owned">Vorhanden</span>'
                : '<span class="eq-rent">Mieten</span>';
              const deleteBtn = editing ? `<button class="delete-btn-sm" data-action="delete-equipment" data-cat="${catIdx}" data-idx="${idx}" title="Entfernen">\u2715</button>` : '';
              const nameField = editing
                ? `<span class="eq-name" contenteditable="true" data-field="name" data-file="equipment" data-cat="${catIdx}" data-idx="${idx}">${escapeHtml(item.name)}</span>`
                : `<span class="eq-name">${escapeHtml(item.name)}</span>`;
              return `
                <div class="eq-item ${isChecked ? 'eq-checked' : ''}">
                  <span class="eq-checkbox" data-action="toggle-equipment" data-key="${key}">${checkbox}</span>
                  ${nameField}
                  ${ownedBadge}
                  ${deleteBtn}
                </div>
              `;
            }).join('')}
            ${editing ? `<button class="add-item-btn-sm" data-action="add-equipment-item" data-cat="${catIdx}">+ Hinzuf\u00fcgen</button>` : ''}
          </div>
        </div>
      `).join('')}
    </div>
    ${editing ? `<button class="add-item-btn" data-action="add-equipment-category">+ Kategorie hinzuf\u00fcgen</button>` : ''}
  `;
}

// =============================================================================
// VIEW: BUDGET (Split-Style)
// =============================================================================
function viewBudget() {
  const { items, currency } = state.budget;
  const members = state.team.members || [];
  const editing = state.editMode;

  // Calculate totals
  const totalSpent = items.reduce((s, i) => s + (i.amount || 0), 0);
  const perPerson = members.length > 0 ? totalSpent / members.length : 0;

  // Calculate who paid how much
  const paidByPerson = {};
  members.forEach(m => { paidByPerson[m.name] = 0; });
  items.forEach(item => {
    if (item.paidBy && paidByPerson[item.paidBy] !== undefined) {
      paidByPerson[item.paidBy] += (item.amount || 0);
    }
  });

  // Calculate balance (paid - fair share)
  const balances = members.map(m => ({
    name: m.name,
    color: m.color,
    paid: paidByPerson[m.name] || 0,
    balance: (paidByPerson[m.name] || 0) - perPerson
  }));

  // Status badge helper
  function approvalBadge(status) {
    if (status === 'approved') return '<span class="status-badge status-green">Genehmigt</span>';
    if (status === 'pending') return '<span class="status-badge status-yellow">Ausstehend</span>';
    if (status === 'declined') return '<span class="status-badge" style="background:rgba(247,37,133,.1);color:var(--accent);border:1px solid rgba(247,37,133,.2);">Abgelehnt</span>';
    return '<span class="status-badge status-gray">Offen</span>';
  }

  return `
    <h2 class="view-title">\uD83D\uDCB0 Budget & Ausgaben</h2>

    <!-- Summary Cards -->
    <div class="budget-summary-grid">
      <div class="budget-summary-card">
        <div class="bsc-label">Gesamt ausgegeben</div>
        <div class="bsc-value">${totalSpent.toFixed(2)}${currency}</div>
      </div>
      <div class="budget-summary-card">
        <div class="bsc-label">Pro Person</div>
        <div class="bsc-value">${perPerson.toFixed(2)}${currency}</div>
      </div>
      <div class="budget-summary-card">
        <div class="bsc-label">Posten</div>
        <div class="bsc-value">${items.length}</div>
      </div>
      <div class="budget-summary-card">
        <div class="bsc-label">Personen</div>
        <div class="bsc-value">${members.length}</div>
      </div>
    </div>

    <!-- Balances (who owes whom) -->
    ${items.length > 0 ? `
    <h3 class="sub-title">Saldo pro Person</h3>
    <div class="balance-grid">
      ${balances.map(b => `
        <div class="balance-card" style="border-left:3px solid ${b.color}">
          <div class="balance-name">${escapeHtml(b.name)}</div>
          <div class="balance-paid">${b.paid.toFixed(2)}${currency} bezahlt</div>
          <div class="balance-amount ${b.balance >= 0 ? 'positive' : 'negative'}">
            ${b.balance >= 0 ? '+' : ''}${b.balance.toFixed(2)}${currency}
          </div>
        </div>
      `).join('')}
    </div>
    ` : ''}

    <!-- Expenses Table -->
    <h3 class="sub-title">Ausgaben</h3>
    ${items.length === 0 && !editing ? `
      <div class="empty-state">
        <div class="empty-icon">\uD83D\uDCB8</div>
        <p>Noch keine Ausgaben eingetragen. Klicke auf \u270F\uFE0F um welche hinzuzuf\u00fcgen.</p>
      </div>
    ` : `
    <div class="budget-table-wrap">
      <table class="ref-table">
        <thead>
          <tr>
            <th>Posten</th>
            <th>Betrag</th>
            <th>Bezahlt von</th>
            <th>Status</th>
            <th>Notizen</th>
            ${editing ? '<th></th>' : ''}
          </tr>
        </thead>
        <tbody>
          ${items.map((item, idx) => {
            const paidBySelect = editing ? `
              <select class="kanban-status-select" data-action="budget-paidby" data-idx="${idx}">
                <option value="">\u2014 w\u00e4hlen \u2014</option>
                ${members.map(m => `<option value="${m.name}" ${item.paidBy === m.name ? 'selected' : ''}>${m.name}</option>`).join('')}
              </select>` : escapeHtml(item.paidBy || '\u2014');

            const statusField = editing ? `
              <select class="kanban-status-select" data-action="budget-status" data-idx="${idx}">
                <option value="open" ${item.status === 'open' ? 'selected' : ''}>Offen</option>
                <option value="pending" ${item.status === 'pending' ? 'selected' : ''}>Ausstehend</option>
                <option value="approved" ${item.status === 'approved' ? 'selected' : ''}>Genehmigt</option>
                <option value="declined" ${item.status === 'declined' ? 'selected' : ''}>Abgelehnt</option>
              </select>` : approvalBadge(item.status);

            return `
              <tr>
                <td>${editing
                  ? `<span contenteditable="true" data-field="name" data-file="budget" data-idx="${idx}">${escapeHtml(item.name)}</span>`
                  : escapeHtml(item.name)}</td>
                <td class="num-cell">${editing
                  ? `<input type="number" class="inline-number" value="${item.amount || 0}" step="0.01" data-action="budget-amount" data-idx="${idx}" />`
                  : `${(item.amount || 0).toFixed(2)}${currency}`}</td>
                <td>${paidBySelect}</td>
                <td>${statusField}</td>
                <td class="budget-note">${editing
                  ? `<span contenteditable="true" data-field="notes" data-file="budget" data-idx="${idx}">${escapeHtml(item.notes || '')}</span>`
                  : escapeHtml(item.notes || '')}</td>
                ${editing ? `<td><button class="delete-btn-sm" data-action="delete-budget" data-idx="${idx}">\u2715</button></td>` : ''}
              </tr>
            `;
          }).join('')}
          ${items.length > 0 ? `
          <tr class="budget-total-row">
            <td><strong>Gesamt</strong></td>
            <td class="num-cell"><strong>${totalSpent.toFixed(2)}${currency}</strong></td>
            <td colspan="3"></td>
            ${editing ? '<td></td>' : ''}
          </tr>` : ''}
        </tbody>
      </table>
    </div>
    `}
    ${editing ? `<button class="add-item-btn" data-action="add-budget">+ Ausgabe hinzuf\u00fcgen</button>` : ''}
  `;
}

// =============================================================================
// VIEW: TIMELINE
// =============================================================================
function viewTimeline() {
  const items = state.timeline;
  const editing = state.editMode;
  let currentPhase = '';

  return `
    <h2 class="view-title">\u23F3 Timeline</h2>
    <div class="timeline">
      ${items.map((item, idx) => {
        let phaseHeader = '';
        if (item.phase !== currentPhase) {
          currentPhase = item.phase;
          phaseHeader = `<div class="timeline-phase">${escapeHtml(item.phase)}</div>`;
        }
        const dotClass = item.status === 'done' ? 'tl-done'
          : item.status === 'active' ? 'tl-active'
          : item.status === 'goal' ? 'tl-goal'
          : 'tl-upcoming';
        const deadlineBadge = item.deadline ? '<span class="tl-deadline">Deadline!</span>' : '';

        const statusAction = editing
          ? `data-action="cycle-timeline-status" data-idx="${idx}" style="cursor:pointer"`
          : '';

        const titleField = editing
          ? `<span contenteditable="true" data-field="title" data-file="timeline" data-idx="${idx}">${escapeHtml(item.title)}</span>`
          : escapeHtml(item.title);

        const deleteBtn = editing ? `<button class="delete-btn-sm" data-action="delete-timeline" data-idx="${idx}">\u2715</button>` : '';

        return `
          ${phaseHeader}
          <div class="timeline-item ${dotClass}" ${statusAction}>
            <div class="tl-dot"></div>
            <div class="tl-content">
              <div class="tl-title">${titleField} ${deadlineBadge} ${deleteBtn}</div>
              <div class="tl-date">${escapeHtml(item.date)}</div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
    ${editing ? `<button class="add-item-btn" data-action="add-timeline">+ Meilenstein hinzuf\u00fcgen</button>` : ''}
  `;
}

// =============================================================================
// VIEW: CONTACTS
// =============================================================================
function viewContacts() {
  const { contacts, permits } = state.contacts;
  const permitStatuses = getPermitStatus();
  const editing = state.editMode;

  const catColors = { 'dhbw': 'cat-purple', 'park': 'cat-green', 'city': 'cat-gold', 'gastro': 'cat-pink' };

  return `
    <h2 class="view-title">\uD83D\uDCDE Kontakte</h2>
    <div class="contacts-grid">
      ${contacts.map((c, idx) => {
        const catClass = catColors[c.category] || '';
        const phone = c.phone
          ? `<a href="tel:${c.phone.replace(/\s/g, '')}" target="_blank" class="contact-link">\uD83D\uDCF1 ${c.phone}</a>` : '';
        const email = c.email
          ? `<a href="mailto:${c.email}" target="_blank" class="contact-link">\u2709\uFE0F ${c.email}</a>` : '';
        const instagram = c.instagram
          ? `<a href="https://instagram.com/${c.instagram.replace('@', '')}" target="_blank" class="contact-link">\uD83D\uDCF7 ${c.instagram}</a>` : '';

        const deleteBtn = editing ? `<button class="delete-btn" data-action="delete-contact" data-idx="${idx}" title="L\u00f6schen">\u2715</button>` : '';

        const nameField = editing
          ? `<h3 contenteditable="true" data-field="name" data-file="contacts" data-idx="${idx}" data-subkey="contacts">${escapeHtml(c.name)}</h3>`
          : `<h3>${escapeHtml(c.name)}</h3>`;

        const roleField = editing
          ? `<p class="contact-role" contenteditable="true" data-field="role" data-file="contacts" data-idx="${idx}" data-subkey="contacts">${escapeHtml(c.role)}</p>`
          : `<p class="contact-role">${escapeHtml(c.role)}</p>`;

        return `
          <div class="card contact-card ${catClass}">
            ${deleteBtn}
            <div class="contact-header">
              <span class="contact-cat-dot ${catClass}"></span>
              ${nameField}
            </div>
            ${roleField}
            <div class="contact-details">
              ${phone}${email}${instagram}
              ${c.address ? `<div class="contact-address">\uD83D\uDCCD ${escapeHtml(c.address)}</div>` : ''}
            </div>
            ${c.note ? `<div class="contact-note">\uD83D\uDCDD ${escapeHtml(c.note)}</div>` : ''}
          </div>
        `;
      }).join('')}
    </div>
    ${editing ? `<button class="add-item-btn" data-action="add-contact">+ Kontakt hinzuf\u00fcgen</button>` : ''}

    <h3 class="sub-title">Genehmigungen</h3>
    <div class="budget-table-wrap">
      <table class="ref-table">
        <thead>
          <tr>
            <th>Location</th>
            <th>Kontakt</th>
            <th>Status</th>
            <th>Notizen</th>
          </tr>
        </thead>
        <tbody>
          ${permits.map((p, idx) => {
            const savedStatus = permitStatuses[`permit_${idx}`] || p.status;
            const contact = contacts.find(c => c.id === p.contact);
            const contactName = contact ? contact.name : '\u2014';
            return `
              <tr>
                <td>${escapeHtml(p.location)}</td>
                <td>${escapeHtml(contactName)}</td>
                <td>
                  <span class="permit-badge permit-${savedStatus}" data-action="cycle-permit" data-permit-idx="${idx}">
                    ${getPermitLabel(savedStatus)}
                  </span>
                </td>
                <td>${escapeHtml(p.notes)}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// =============================================================================
// VIEW: CALENDAR
// =============================================================================
function viewCalendar() {
  const calUrl = state.config.project.calendarUrl;

  return `
    <h2 class="view-title">\uD83D\uDDD3\uFE0F Kalender</h2>
    <div class="calendar-info-cards">
      <div class="cal-info-card">
        <span class="cal-info-label">Erster Drehtag</span>
        <span class="cal-info-value">17. Juni 2026</span>
      </div>
      <div class="cal-info-card">
        <span class="cal-info-label">Letzter Drehtag</span>
        <span class="cal-info-value">21. Juni 2026</span>
      </div>
      <div class="cal-info-card">
        <span class="cal-info-label">Kalenderwoche</span>
        <span class="cal-info-value">KW 25</span>
      </div>
      <div class="cal-info-card">
        <span class="cal-info-label">Premiere</span>
        <span class="cal-info-value">Okt/Nov 2026</span>
      </div>
    </div>
    <div class="calendar-embed full-width">
      <iframe src="${calUrl}&mode=MONTH" loading="lazy"></iframe>
    </div>
  `;
}

// =============================================================================
// DRAG AND DROP — KANBAN (Native HTML5 API + Touch Fallback)
// =============================================================================

/**
 * Initializes drag-and-drop on kanban cards.
 * Called after render() when route === 'kanban' and NOT in edit mode.
 */
function initKanbanDragAndDrop() {
  const cards = document.querySelectorAll('.kanban-card[draggable="true"]');
  const colBodies = document.querySelectorAll('.kanban-col-body');

  // --- HTML5 Drag and Drop (desktop) ---
  cards.forEach(card => {
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragend', handleDragEnd);
  });

  colBodies.forEach(colBody => {
    colBody.addEventListener('dragover', handleDragOver);
    colBody.addEventListener('dragleave', handleDragLeave);
    colBody.addEventListener('drop', handleDrop);
  });

  // --- Touch Fallback (mobile: long-press to drag) ---
  initTouchDragAndDrop(cards, colBodies);
}

// ---- Desktop DnD handlers ----

function handleDragStart(e) {
  const card = e.currentTarget;
  const taskIdx = card.dataset.taskIdx;

  e.dataTransfer.setData('text/plain', taskIdx);
  e.dataTransfer.effectAllowed = 'move';

  // Add visual feedback with slight delay for smooth feel
  requestAnimationFrame(() => {
    card.classList.add('dragging');
  });
}

function handleDragEnd(e) {
  const card = e.currentTarget;
  card.classList.remove('dragging');

  // Clean up all drag-over states and drop indicators
  document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
  document.querySelectorAll('.drop-indicator').forEach(el => el.remove());
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';

  const colBody = e.currentTarget;
  colBody.classList.add('drag-over');

  // Show drop indicator
  removeDropIndicators(colBody);

  const afterElement = getDragAfterElement(colBody, e.clientY);
  const indicator = document.createElement('div');
  indicator.className = 'drop-indicator';

  if (afterElement === null) {
    // Append at the end (but before kanban-empty if present)
    const emptyDiv = colBody.querySelector('.kanban-empty');
    if (emptyDiv) {
      colBody.insertBefore(indicator, emptyDiv);
    } else {
      colBody.appendChild(indicator);
    }
  } else {
    colBody.insertBefore(indicator, afterElement);
  }
}

function handleDragLeave(e) {
  const colBody = e.currentTarget;
  // Only remove if we truly left the column body
  if (!colBody.contains(e.relatedTarget)) {
    colBody.classList.remove('drag-over');
    removeDropIndicators(colBody);
  }
}

function handleDrop(e) {
  e.preventDefault();
  const colBody = e.currentTarget;
  const targetColId = colBody.dataset.colId;
  const taskIdx = parseInt(e.dataTransfer.getData('text/plain'));

  // Clean up visual states
  colBody.classList.remove('drag-over');
  removeDropIndicators(colBody);
  document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
  document.querySelectorAll('.drop-indicator').forEach(el => el.remove());

  // Update state
  if (!isNaN(taskIdx) && targetColId && state.kanban.tasks[taskIdx]) {
    const task = state.kanban.tasks[taskIdx];
    if (task.status !== targetColId) {
      task.status = targetColId;
      markDirty('kanban');
      render();
    }
  }
}

/**
 * Get the element that the dragged item should be placed before.
 * Uses vertical mouse position to find closest card below cursor.
 */
function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.kanban-card:not(.dragging)')];

  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element || null;
}

function removeDropIndicators(container) {
  container.querySelectorAll('.drop-indicator').forEach(el => el.remove());
}

// ---- Touch DnD (mobile fallback: long-press to initiate drag) ----

let touchDragState = {
  active: false,
  timer: null,
  startX: 0,
  startY: 0,
  card: null,
  ghost: null,
  taskIdx: null,
  moved: false
};

function initTouchDragAndDrop(cards, colBodies) {
  cards.forEach(card => {
    card.addEventListener('touchstart', handleTouchStart, { passive: false });
    card.addEventListener('touchmove', handleTouchMove, { passive: false });
    card.addEventListener('touchend', handleTouchEnd, { passive: false });
    card.addEventListener('touchcancel', handleTouchCancel, { passive: false });
  });
}

function handleTouchStart(e) {
  // Only trigger for single finger
  if (e.touches.length !== 1) return;

  const touch = e.touches[0];
  const card = e.currentTarget;

  touchDragState.startX = touch.clientX;
  touchDragState.startY = touch.clientY;
  touchDragState.card = card;
  touchDragState.taskIdx = card.dataset.taskIdx;
  touchDragState.moved = false;

  // Start long-press timer (500ms)
  touchDragState.timer = setTimeout(() => {
    startTouchDrag(card, touch);
  }, 500);
}

function handleTouchMove(e) {
  const touch = e.touches[0];
  const dx = Math.abs(touch.clientX - touchDragState.startX);
  const dy = Math.abs(touch.clientY - touchDragState.startY);

  // If user moves finger before long-press fires, cancel
  if (!touchDragState.active && (dx > 10 || dy > 10)) {
    clearTimeout(touchDragState.timer);
    touchDragState.timer = null;
    return;
  }

  // If drag is active, move the ghost element
  if (touchDragState.active) {
    e.preventDefault(); // Prevent scrolling while dragging
    moveTouchGhost(touch);
    highlightDropTarget(touch);
    touchDragState.moved = true;
  }
}

function handleTouchEnd(e) {
  clearTimeout(touchDragState.timer);
  touchDragState.timer = null;

  if (touchDragState.active) {
    e.preventDefault();
    completeTouchDrag(e.changedTouches[0]);
  }
}

function handleTouchCancel(e) {
  clearTimeout(touchDragState.timer);
  touchDragState.timer = null;
  cancelTouchDrag();
}

function startTouchDrag(card, touch) {
  touchDragState.active = true;

  // Visual feedback on the original card
  card.classList.add('dragging');

  // Create ghost element
  const ghost = card.cloneNode(true);
  ghost.className = 'kanban-card kanban-drag-ghost';
  ghost.style.width = card.offsetWidth + 'px';
  ghost.style.left = (touch.clientX - card.offsetWidth / 2) + 'px';
  ghost.style.top = (touch.clientY - 20) + 'px';
  document.body.appendChild(ghost);
  touchDragState.ghost = ghost;

  // Haptic feedback if available
  if (navigator.vibrate) {
    navigator.vibrate(30);
  }
}

function moveTouchGhost(touch) {
  if (touchDragState.ghost) {
    touchDragState.ghost.style.left = (touch.clientX - touchDragState.ghost.offsetWidth / 2) + 'px';
    touchDragState.ghost.style.top = (touch.clientY - 20) + 'px';
  }
}

function highlightDropTarget(touch) {
  // Remove previous drag-over states
  document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
  document.querySelectorAll('.drop-indicator').forEach(el => el.remove());

  // Find the column body under the touch point
  const elemBelow = document.elementFromPoint(touch.clientX, touch.clientY);
  if (!elemBelow) return;

  const colBody = elemBelow.closest('.kanban-col-body');
  if (colBody) {
    colBody.classList.add('drag-over');

    // Show drop indicator
    const afterElement = getDragAfterElement(colBody, touch.clientY);
    const indicator = document.createElement('div');
    indicator.className = 'drop-indicator';
    if (afterElement === null) {
      const emptyDiv = colBody.querySelector('.kanban-empty');
      if (emptyDiv) {
        colBody.insertBefore(indicator, emptyDiv);
      } else {
        colBody.appendChild(indicator);
      }
    } else {
      colBody.insertBefore(indicator, afterElement);
    }
  }
}

function completeTouchDrag(touch) {
  const taskIdx = parseInt(touchDragState.taskIdx);

  // Find drop target column
  // We need to temporarily hide the ghost to get the element beneath
  if (touchDragState.ghost) {
    touchDragState.ghost.style.display = 'none';
  }
  const elemBelow = document.elementFromPoint(touch.clientX, touch.clientY);
  if (touchDragState.ghost) {
    touchDragState.ghost.style.display = '';
  }

  if (elemBelow) {
    const colBody = elemBelow.closest('.kanban-col-body');
    if (colBody) {
      const targetColId = colBody.dataset.colId;
      if (!isNaN(taskIdx) && targetColId && state.kanban.tasks[taskIdx]) {
        const task = state.kanban.tasks[taskIdx];
        if (task.status !== targetColId) {
          task.status = targetColId;
          markDirty('kanban');
        }
      }
    }
  }

  // Clean up
  cancelTouchDrag();
  render();
}

function cancelTouchDrag() {
  if (touchDragState.ghost) {
    touchDragState.ghost.remove();
    touchDragState.ghost = null;
  }
  if (touchDragState.card) {
    touchDragState.card.classList.remove('dragging');
  }
  document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
  document.querySelectorAll('.drop-indicator').forEach(el => el.remove());

  touchDragState.active = false;
  touchDragState.card = null;
  touchDragState.taskIdx = null;
  touchDragState.moved = false;
}

// =============================================================================
// EVENT DELEGATION (single listener on document)
// =============================================================================
let contentEditableDebounce = null;

document.addEventListener('click', (e) => {
  // Action buttons
  const actionEl = e.target.closest('[data-action]');
  if (actionEl) {
    const action = actionEl.dataset.action;

    // --- Theme ---
    if (action === 'toggle-theme') {
      e.preventDefault();
      const next = getTheme() === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      render();
      return;
    }

    // --- Edit mode ---
    if (action === 'enter-edit') {
      e.preventDefault();
      enterEditMode();
      return;
    }

    if (action === 'save-changes') {
      e.preventDefault();
      saveAllDirty();
      return;
    }

    if (action === 'cancel-edit') {
      e.preventDefault();
      cancelEditMode();
      return;
    }

    // --- Token modal ---
    if (action === 'close-modal') {
      e.preventDefault();
      closeTokenModal();
      return;
    }

    if (action === 'save-token') {
      e.preventDefault();
      const input = document.getElementById('token-input');
      const token = input ? input.value.trim() : '';
      if (token) {
        setGithubToken(token);
        closeTokenModal();
        enterEditMode();
      } else {
        showToast('Bitte Token eingeben', 'error');
      }
      return;
    }

    // --- Equipment checkbox ---
    if (action === 'toggle-equipment') {
      e.preventDefault();
      const key = actionEl.dataset.key;
      const checked = getEquipmentChecked();
      checked[key] = !checked[key];
      setEquipmentChecked(checked);
      render();
      return;
    }

    // --- Permit cycling ---
    if (action === 'cycle-permit') {
      e.preventDefault();
      const idx = actionEl.dataset.permitIdx;
      const statuses = getPermitStatus();
      const permit = state.contacts.permits[idx];
      const current = statuses[`permit_${idx}`] || permit.status;
      statuses[`permit_${idx}`] = cyclePermitStatus(current);
      setPermitStatus(statuses);
      render();
      return;
    }

    // --- Location status cycling ---
    if (action === 'cycle-location-status') {
      e.preventDefault();
      const idx = parseInt(actionEl.dataset.idx);
      const loc = state.locations[idx];
      const cycle = ['open', 'pending', 'confirmed'];
      const curIdx = cycle.indexOf(loc.status);
      loc.status = cycle[(curIdx + 1) % cycle.length];
      markDirty('locations');
      render();
      return;
    }

    // --- Timeline status cycling ---
    if (action === 'cycle-timeline-status') {
      e.preventDefault();
      const idx = parseInt(actionEl.dataset.idx);
      const item = state.timeline[idx];
      const cycle = ['upcoming', 'active', 'done'];
      const curIdx = cycle.indexOf(item.status);
      item.status = cycle[(curIdx + 1) % cycle.length];
      markDirty('timeline');
      render();
      return;
    }

    // --- Add location ---
    if (action === 'add-location') {
      e.preventDefault();
      const maxId = state.locations.reduce((max, l) => Math.max(max, l.id), 0);
      state.locations.push({
        id: maxId + 1,
        name: 'Neue Location',
        concrete: 'Beschreibung...',
        badges: [],
        vibe: '',
        reference: '',
        mapEmbed: '',
        mapLink: '',
        status: 'open',
        cluster: ''
      });
      markDirty('locations');
      render();
      return;
    }

    // --- Delete location ---
    if (action === 'delete-location') {
      e.preventDefault();
      if (!confirm('Location wirklich l\u00f6schen?')) return;
      const idx = parseInt(actionEl.dataset.idx);
      state.locations.splice(idx, 1);
      markDirty('locations');
      render();
      return;
    }

    // --- Add schedule day ---
    if (action === 'add-schedule') {
      e.preventDefault();
      const maxDay = state.schedule.reduce((max, d) => Math.max(max, d.day), 0);
      state.schedule.push({
        day: maxDay + 1,
        date: '2026-06-22',
        weekday: 'So',
        title: 'Neuer Drehtag',
        icon: '\uD83C\uDFAC',
        time: '08:00 \u2013 18:00',
        duration: 'Ganzer Tag',
        locations: [],
        scenes: ['Szene 1'],
        notes: '',
        conflict: ''
      });
      markDirty('schedule');
      render();
      return;
    }

    // --- Delete schedule day ---
    if (action === 'delete-schedule') {
      e.preventDefault();
      if (!confirm('Drehtag wirklich l\u00f6schen?')) return;
      const idx = parseInt(actionEl.dataset.idx);
      state.schedule.splice(idx, 1);
      markDirty('schedule');
      render();
      return;
    }

    // --- Add role ---
    if (action === 'add-role') {
      e.preventDefault();
      state.team.roles.push({
        id: generateId(),
        title: 'Neue Rolle',
        icon: '\uD83C\uDFAC',
        description: 'Beschreibung...',
        assigned: '',
        status: 'open'
      });
      markDirty('team');
      render();
      return;
    }

    // --- Delete role ---
    if (action === 'delete-role') {
      e.preventDefault();
      if (!confirm('Rolle wirklich l\u00f6schen?')) return;
      const idx = parseInt(actionEl.dataset.idx);
      state.team.roles.splice(idx, 1);
      markDirty('team');
      render();
      return;
    }

    // --- Add equipment item ---
    if (action === 'add-equipment-item') {
      e.preventDefault();
      const catIdx = parseInt(actionEl.dataset.cat);
      state.equipment.categories[catIdx].items.push({
        name: 'Neues Equipment',
        owned: false,
        checked: false
      });
      markDirty('equipment');
      render();
      return;
    }

    // --- Add equipment category ---
    if (action === 'add-equipment-category') {
      e.preventDefault();
      state.equipment.categories.push({
        title: 'Neue Kategorie',
        items: []
      });
      markDirty('equipment');
      render();
      return;
    }

    // --- Delete equipment item ---
    if (action === 'delete-equipment') {
      e.preventDefault();
      const catIdx = parseInt(actionEl.dataset.cat);
      const idx = parseInt(actionEl.dataset.idx);
      state.equipment.categories[catIdx].items.splice(idx, 1);
      markDirty('equipment');
      render();
      return;
    }

    // --- Add budget item ---
    if (action === 'add-budget') {
      e.preventDefault();
      state.budget.items.push({
        name: 'Neue Ausgabe',
        amount: 0,
        paidBy: '',
        status: 'open',
        notes: ''
      });
      markDirty('budget');
      render();
      return;
    }

    // --- Delete budget item ---
    if (action === 'delete-budget') {
      e.preventDefault();
      if (!confirm('Posten wirklich l\u00f6schen?')) return;
      const idx = parseInt(actionEl.dataset.idx);
      state.budget.items.splice(idx, 1);
      markDirty('budget');
      render();
      return;
    }

    // --- Add timeline item ---
    if (action === 'add-timeline') {
      e.preventDefault();
      state.timeline.push({
        phase: 'Post-Production',
        title: 'Neuer Meilenstein',
        date: 'TBD',
        status: 'upcoming'
      });
      markDirty('timeline');
      render();
      return;
    }

    // --- Delete timeline item ---
    if (action === 'delete-timeline') {
      e.preventDefault();
      if (!confirm('Meilenstein wirklich l\u00f6schen?')) return;
      const idx = parseInt(actionEl.dataset.idx);
      state.timeline.splice(idx, 1);
      markDirty('timeline');
      render();
      return;
    }

    // --- Add contact ---
    if (action === 'add-contact') {
      e.preventDefault();
      state.contacts.contacts.push({
        id: generateId(),
        name: 'Neuer Kontakt',
        role: 'Rolle...',
        category: 'city',
        phone: '',
        email: '',
        address: '',
        note: ''
      });
      markDirty('contacts');
      render();
      return;
    }

    // --- Delete contact ---
    if (action === 'delete-contact') {
      e.preventDefault();
      if (!confirm('Kontakt wirklich l\u00f6schen?')) return;
      const idx = parseInt(actionEl.dataset.idx);
      state.contacts.contacts.splice(idx, 1);
      markDirty('contacts');
      render();
      return;
    }

    // --- Select member (my tasks) ---
    if (action === 'select-member') {
      e.preventDefault();
      localStorage.setItem('my_tasks_user', actionEl.dataset.member);
      render();
      return;
    }

    // --- Add kanban task ---
    if (action === 'add-kanban-task') {
      e.preventDefault();
      const status = actionEl.dataset.status;
      state.kanban.tasks.push({
        id: generateId(),
        title: 'Neue Aufgabe',
        description: '',
        assignee: '',
        owner: '',
        status: status,
        deadline: ''
      });
      markDirty('kanban');
      render();
      return;
    }

    // --- Delete kanban task ---
    if (action === 'delete-kanban-task') {
      e.preventDefault();
      if (!confirm('Aufgabe wirklich l\u00f6schen?')) return;
      const idx = parseInt(actionEl.dataset.idx);
      state.kanban.tasks.splice(idx, 1);
      markDirty('kanban');
      render();
      return;
    }
  }

  // Filter buttons
  const filterBtn = e.target.closest('[data-filter]');
  if (filterBtn) {
    e.preventDefault();
    state.activeFilter = filterBtn.dataset.filter;
    render();
    return;
  }
});

// --- Debounced contenteditable input handler ---
document.addEventListener('input', (e) => {
  const el = e.target;

  // ContentEditable fields
  if (el.hasAttribute('contenteditable') && el.dataset.field && el.dataset.file) {
    clearTimeout(contentEditableDebounce);
    contentEditableDebounce = setTimeout(() => {
      const file = el.dataset.file;
      const field = el.dataset.field;
      const idx = el.dataset.idx !== undefined ? parseInt(el.dataset.idx) : null;
      const subkey = el.dataset.subkey || null;
      const value = el.textContent.trim();

      if (file === 'locations' && idx !== null) {
        state.locations[idx][field] = value;
      } else if (file === 'schedule' && idx !== null) {
        state.schedule[idx][field] = value;
      } else if (file === 'team') {
        if (field === 'lead.name') {
          state.team.lead.name = value;
        }
      } else if (file === 'budget' && idx !== null) {
        state.budget.items[idx][field] = value;
      } else if (file === 'timeline' && idx !== null) {
        state.timeline[idx][field] = value;
      } else if (file === 'contacts' && idx !== null && subkey === 'contacts') {
        state.contacts.contacts[idx][field] = value;
      } else if (file === 'kanban' && idx !== null && subkey === 'tasks') {
        state.kanban.tasks[idx][field] = value;
      } else if (file === 'equipment') {
        const catIdx = parseInt(el.dataset.cat);
        const itemIdx = parseInt(el.dataset.idx);
        if (!isNaN(catIdx) && !isNaN(itemIdx)) {
          state.equipment.categories[catIdx].items[itemIdx][field] = value;
        }
      }

      markDirty(file);
    }, 400);
    return;
  }

  // Budget number inputs
  if (el.dataset.action === 'budget-amount') {
    const idx = parseInt(el.dataset.idx);
    state.budget.items[idx].amount = parseFloat(el.value) || 0;
    markDirty('budget');
    return;
  }

  // Budget paidBy select
  if (el.dataset.action === 'budget-paidby') {
    const idx = parseInt(el.dataset.idx);
    state.budget.items[idx].paidBy = el.value;
    markDirty('budget');
    return;
  }

  // Budget status select
  if (el.dataset.action === 'budget-status') {
    const idx = parseInt(el.dataset.idx);
    state.budget.items[idx].status = el.value;
    markDirty('budget');
    return;
  }

  // Role assignment input
  if (el.dataset.action === 'assign-role') {
    const idx = parseInt(el.dataset.idx);
    state.team.roles[idx].assigned = el.value;
    markDirty('team');
    return;
  }

  // Kanban status change
  if (el.dataset.action === 'change-kanban-status') {
    const idx = parseInt(el.dataset.idx);
    state.kanban.tasks[idx].status = el.value;
    markDirty('kanban');
    render();
    return;
  }

  // Kanban owner
  if (el.dataset.action === 'kanban-owner') {
    const idx = parseInt(el.dataset.idx);
    state.kanban.tasks[idx].owner = el.value;
    markDirty('kanban');
    return;
  }

  // Kanban assignee
  if (el.dataset.action === 'kanban-assignee') {
    const idx = parseInt(el.dataset.idx);
    state.kanban.tasks[idx].assignee = el.value;
    markDirty('kanban');
    return;
  }

  // Kanban deadline
  if (el.dataset.action === 'kanban-deadline') {
    const idx = parseInt(el.dataset.idx);
    state.kanban.tasks[idx].deadline = el.value;
    markDirty('kanban');
    return;
  }
});

// =============================================================================
// KEYBOARD SHORTCUTS
// =============================================================================
document.addEventListener('keydown', (e) => {
  // Escape = cancel edit mode
  if (e.key === 'Escape') {
    if (document.getElementById('token-modal')) {
      closeTokenModal();
      return;
    }
    if (state.editMode) {
      cancelEditMode();
      return;
    }
  }

  // Ctrl+S / Cmd+S = save
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    if (state.editMode) {
      saveAllDirty();
    }
    return;
  }
});

// Handle Enter in token modal input
document.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && e.target.id === 'token-input') {
    e.preventDefault();
    const token = e.target.value.trim();
    if (token) {
      setGithubToken(token);
      closeTokenModal();
      enterEditMode();
    }
  }
});

// =============================================================================
// ROUTE CHANGE WITH FADE TRANSITION
// =============================================================================
window.addEventListener('hashchange', () => {
  const container = document.getElementById('view-container');
  if (container) {
    container.classList.add('fade-out');
    setTimeout(() => {
      if (getRoute() !== 'locations') {
        state.activeFilter = 'all';
      }
      render();
    }, 150);
  } else {
    if (getRoute() !== 'locations') {
      state.activeFilter = 'all';
    }
    render();
  }
});

// =============================================================================
// BOOTSTRAP
// =============================================================================
async function init() {
  renderSkeleton();
  await fetchAllData();
  state.loaded = true;
  render();
}

init();
