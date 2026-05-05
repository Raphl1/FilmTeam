/**
 * FR(AI)ME — Night of the Graduates 2026
 * Single Page Application
 * Vanilla JS · Hash Router · localStorage persistence
 */

// ═══════════════════════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════════════════════
const state = {
  config: null,
  locations: null,
  schedule: null,
  contacts: null,
  team: null,
  equipment: null,
  budget: null,
  timeline: null,
  activeFilter: 'all'
};

// ═══════════════════════════════════════════════════════════════════════════════
// DATA FETCHING
// ═══════════════════════════════════════════════════════════════════════════════
async function fetchAllData() {
  const files = ['config', 'locations', 'schedule', 'contacts', 'team', 'equipment', 'budget', 'timeline'];
  const results = await Promise.all(
    files.map(f => fetch(`data/${f}.json`).then(r => r.json()))
  );
  files.forEach((name, i) => { state[name] = results[i]; });
}

// ═══════════════════════════════════════════════════════════════════════════════
// THEME
// ═══════════════════════════════════════════════════════════════════════════════
function getTheme() {
  return localStorage.getItem('theme') || 'dark';
}

function applyTheme(theme) {
  localStorage.setItem('theme', theme);
  document.body.className = theme;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTER
// ═══════════════════════════════════════════════════════════════════════════════
function getRoute() {
  return window.location.hash.slice(1) || 'hub';
}

// ═══════════════════════════════════════════════════════════════════════════════
// ICONS (emoji-based for zero dependencies)
// ═══════════════════════════════════════════════════════════════════════════════
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
  'sun': '\u2600\uFE0F',
  'moon': '\uD83C\uDF19'
};

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN RENDER
// ═══════════════════════════════════════════════════════════════════════════════
function render() {
  const theme = getTheme();
  applyTheme(theme);

  const app = document.getElementById('app');
  const route = getRoute();
  const themeIcon = theme === 'dark' ? ICONS.sun : ICONS.moon;

  app.innerHTML = `
    <header class="site-header">
      <div class="header-inner">
        <div class="header-text">
          <div class="tag">Filmteam DHBW Mannheim MPG24</div>
          <h1>FR<span class="ai">(AI)</span>ME<span class="sep"> \u2014 </span>Night of the Graduates</h1>
          <div class="subtitle">Vollst\u00e4ndige Projektplanung \u00b7 2026</div>
        </div>
        <button class="theme-toggle" data-action="toggle-theme" aria-label="Theme wechseln">
          ${themeIcon}
        </button>
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
}

// ═══════════════════════════════════════════════════════════════════════════════
// VIEW DISPATCHER
// ═══════════════════════════════════════════════════════════════════════════════
function renderView(route) {
  switch (route) {
    case 'hub':       return viewHub();
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

// ═══════════════════════════════════════════════════════════════════════════════
// VIEW: HUB
// ═══════════════════════════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════════════════════════
// VIEW: LOCATIONS
// ═══════════════════════════════════════════════════════════════════════════════
function viewLocations() {
  const locations = state.locations;
  const filter = state.activeFilter;
  const allBadges = [...new Set(locations.flatMap(l => l.badges))];

  let filtered;
  if (filter === 'all') {
    filtered = locations;
  } else if (filter === 'open') {
    filtered = locations.filter(l => l.status === 'open');
  } else {
    filtered = locations.filter(l => l.badges.includes(filter));
  }

  return `
    <h2 class="view-title">\uD83D\uDCCD Drehorte</h2>
    <div class="filter-bar">
      <button class="filter-btn ${filter === 'all' ? 'active' : ''}" data-filter="all">Alle</button>
      ${allBadges.map(b => `
        <button class="filter-btn ${filter === b ? 'active' : ''}" data-filter="${b}">${b}</button>
      `).join('')}
      <button class="filter-btn ${filter === 'open' ? 'active' : ''}" data-filter="open">Offen</button>
    </div>
    <div class="locations-grid">
      ${filtered.map(loc => {
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

        return `
          <div class="card loc-card">
            ${mapEmbed}
            <div class="loc-body">
              <div class="loc-header">
                <span class="loc-id">#${String(loc.id).padStart(2, '0')}</span>
                <span class="status-badge ${statusClass}">${statusLabel}</span>
              </div>
              <h3 class="loc-name">${loc.name}</h3>
              <p class="loc-concrete">${loc.concrete}</p>
              <div class="loc-badges">
                ${loc.badges.map(b => `<span class="badge badge-${b.toLowerCase()}">${b}</span>`).join(' ')}
              </div>
              <p class="loc-vibe">${loc.vibe}</p>
              ${loc.reference ? `<div class="loc-ref">\uD83C\uDFAC ${loc.reference}</div>` : ''}
              ${mapLink}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════════════════════════
// VIEW: SCHEDULE
// ═══════════════════════════════════════════════════════════════════════════════
function viewSchedule() {
  const days = state.schedule;
  const calUrl = state.config.project.calendarUrl;

  return `
    <h2 class="view-title">\uD83D\uDCC5 Drehplan</h2>
    <div class="schedule-grid">
      ${days.map(day => {
        const locNames = day.locations.map(id => {
          const loc = state.locations.find(l => l.id === id);
          return loc ? loc.name : `#${id}`;
        });
        return `
          <div class="card schedule-card">
            <div class="sched-header">
              <span class="sched-day">Tag ${day.day}</span>
              <span class="sched-date">${formatDate(day.date)}</span>
            </div>
            <h3 class="sched-title">${day.icon} ${day.title}</h3>
            <div class="sched-time">\u23F0 ${day.time}</div>
            <div class="sched-locations">
              <strong>Locations:</strong>
              <div class="sched-loc-tags">
                ${locNames.map(n => `<span class="sched-loc-tag">${n}</span>`).join('')}
              </div>
            </div>
            <div class="sched-scenes">
              <strong>Szenen:</strong>
              <ul>${day.scenes.map(s => `<li>${s}</li>`).join('')}</ul>
            </div>
            ${day.notes ? `<div class="sched-notes">\uD83D\uDCDD ${day.notes}</div>` : ''}
            ${day.conflict ? `<div class="sched-conflict">\u26A0\uFE0F <strong>Konflikt:</strong> ${day.conflict}</div>` : ''}
          </div>
        `;
      }).join('')}
    </div>
    <h3 class="sub-title">\uD83D\uDCC6 Google Kalender</h3>
    <div class="calendar-embed">
      <iframe src="${calUrl}&mode=WEEK" loading="lazy"></iframe>
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════════════════════════
// VIEW: TEAM
// ═══════════════════════════════════════════════════════════════════════════════
function viewTeam() {
  const { lead, roles } = state.team;

  return `
    <h2 class="view-title">\uD83D\uDC65 Team & Rollen</h2>
    <div class="team-lead card">
      <div class="lead-icon">\uD83D\uDC51</div>
      <div class="lead-info">
        <h3>Projektleitung</h3>
        <p class="lead-name">${lead.name}</p>
      </div>
      <span class="status-badge status-green">Zugewiesen</span>
    </div>
    <div class="team-grid">
      ${roles.map(role => {
        const assigned = role.assigned && role.assigned.trim() !== '';
        return `
          <div class="card role-card">
            <div class="role-icon">${role.icon}</div>
            <h3 class="role-title">${role.title}</h3>
            <p class="role-desc">${role.description}</p>
            <div class="role-footer">
              <span class="role-person ${assigned ? '' : 'role-open'}">${assigned ? role.assigned : 'Offen'}</span>
              <span class="status-dot ${assigned ? 'status-green' : 'status-yellow'}"></span>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════════════════════════
// VIEW: EQUIPMENT
// ═══════════════════════════════════════════════════════════════════════════════
function viewEquipment() {
  const { categories } = state.equipment;
  const checked = getEquipmentChecked();

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
      ${categories.map(cat => `
        <div class="eq-category">
          <h3 class="eq-cat-title">${cat.title}</h3>
          <div class="eq-items">
            ${cat.items.map((item, idx) => {
              const key = `${cat.title}_${idx}`;
              const isChecked = !!checked[key];
              const checkbox = isChecked ? '\u2611' : '\u2610';
              const ownedBadge = item.owned
                ? '<span class="eq-owned">Vorhanden</span>'
                : '<span class="eq-rent">Mieten</span>';
              return `
                <div class="eq-item ${isChecked ? 'eq-checked' : ''}">
                  <span class="eq-checkbox" data-action="toggle-equipment" data-key="${key}">${checkbox}</span>
                  <span class="eq-name">${item.name}</span>
                  ${ownedBadge}
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════════════════════════
// VIEW: BUDGET
// ═══════════════════════════════════════════════════════════════════════════════
function viewBudget() {
  const { items, currency } = state.budget;
  const totalMin = items.reduce((s, i) => s + i.min, 0);
  const totalMax = items.reduce((s, i) => s + i.max, 0);

  return `
    <h2 class="view-title">\uD83D\uDCB0 Budget</h2>
    <div class="budget-visual">
      <div class="budget-range-labels">
        <span>Min: <strong>${totalMin}${currency}</strong></span>
        <span>Max: <strong>${totalMax}${currency}</strong></span>
      </div>
      <div class="budget-bar">
        <div class="budget-bar-fill budget-bar-max" style="width:100%"></div>
        <div class="budget-bar-fill budget-bar-min" style="width:${(totalMin / totalMax * 100)}%"></div>
      </div>
    </div>
    <div class="budget-table-wrap">
      <table class="ref-table">
        <thead>
          <tr>
            <th>Kategorie</th>
            <th>Posten</th>
            <th>Min ${currency}</th>
            <th>Max ${currency}</th>
            <th>Notizen</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr>
              <td><span class="badge badge-info">${item.category}</span></td>
              <td>${item.name}</td>
              <td class="num-cell">${item.min}</td>
              <td class="num-cell">${item.max}</td>
              <td class="budget-note">${item.notes}</td>
            </tr>
          `).join('')}
          <tr class="budget-total-row">
            <td colspan="2"><strong>Gesamt</strong></td>
            <td class="num-cell"><strong>${totalMin}${currency}</strong></td>
            <td class="num-cell"><strong>${totalMax}${currency}</strong></td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════════════════════════
// VIEW: TIMELINE
// ═══════════════════════════════════════════════════════════════════════════════
function viewTimeline() {
  const items = state.timeline;
  let currentPhase = '';

  return `
    <h2 class="view-title">\u23F3 Timeline</h2>
    <div class="timeline">
      ${items.map(item => {
        let phaseHeader = '';
        if (item.phase !== currentPhase) {
          currentPhase = item.phase;
          phaseHeader = `<div class="timeline-phase">${item.phase}</div>`;
        }
        const dotClass = item.status === 'done' ? 'tl-done'
          : item.status === 'active' ? 'tl-active'
          : item.status === 'goal' ? 'tl-goal'
          : 'tl-upcoming';
        const deadlineBadge = item.deadline ? '<span class="tl-deadline">Deadline!</span>' : '';

        return `
          ${phaseHeader}
          <div class="timeline-item ${dotClass}">
            <div class="tl-dot"></div>
            <div class="tl-content">
              <div class="tl-title">${item.title} ${deadlineBadge}</div>
              <div class="tl-date">${item.date}</div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════════════════════════
// VIEW: CONTACTS
// ═══════════════════════════════════════════════════════════════════════════════
function viewContacts() {
  const { contacts, permits } = state.contacts;
  const permitStatuses = getPermitStatus();

  const catColors = { 'dhbw': 'cat-purple', 'park': 'cat-green', 'city': 'cat-gold', 'gastro': 'cat-pink' };

  return `
    <h2 class="view-title">\uD83D\uDCDE Kontakte</h2>
    <div class="contacts-grid">
      ${contacts.map(c => {
        const catClass = catColors[c.category] || '';
        const phone = c.phone
          ? `<a href="tel:${c.phone.replace(/\s/g, '')}" target="_blank" class="contact-link">\uD83D\uDCF1 ${c.phone}</a>` : '';
        const email = c.email
          ? `<a href="mailto:${c.email}" target="_blank" class="contact-link">\u2709\uFE0F ${c.email}</a>` : '';
        const instagram = c.instagram
          ? `<a href="https://instagram.com/${c.instagram.replace('@', '')}" target="_blank" class="contact-link">\uD83D\uDCF7 ${c.instagram}</a>` : '';

        return `
          <div class="card contact-card ${catClass}">
            <div class="contact-header">
              <span class="contact-cat-dot ${catClass}"></span>
              <h3>${c.name}</h3>
            </div>
            <p class="contact-role">${c.role}</p>
            <div class="contact-details">
              ${phone}${email}${instagram}
              ${c.address ? `<div class="contact-address">\uD83D\uDCCD ${c.address}</div>` : ''}
            </div>
            ${c.note ? `<div class="contact-note">\uD83D\uDCDD ${c.note}</div>` : ''}
          </div>
        `;
      }).join('')}
    </div>

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
                <td>${p.location}</td>
                <td>${contactName}</td>
                <td>
                  <span class="permit-badge permit-${savedStatus}" data-action="cycle-permit" data-permit-idx="${idx}">
                    ${getPermitLabel(savedStatus)}
                  </span>
                </td>
                <td>${p.notes}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════════════════════════
// VIEW: CALENDAR
// ═══════════════════════════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════════════════════════
// EVENT DELEGATION (single listener on document)
// ═══════════════════════════════════════════════════════════════════════════════
document.addEventListener('click', (e) => {
  // Action buttons (theme, equipment, permits)
  const actionEl = e.target.closest('[data-action]');
  if (actionEl) {
    const action = actionEl.dataset.action;

    if (action === 'toggle-theme') {
      e.preventDefault();
      const next = getTheme() === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      render();
      return;
    }

    if (action === 'toggle-equipment') {
      e.preventDefault();
      const key = actionEl.dataset.key;
      const checked = getEquipmentChecked();
      checked[key] = !checked[key];
      setEquipmentChecked(checked);
      render();
      return;
    }

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

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTE CHANGE WITH FADE TRANSITION
// ═══════════════════════════════════════════════════════════════════════════════
window.addEventListener('hashchange', () => {
  const container = document.getElementById('view-container');
  if (container) {
    container.classList.add('fade-out');
    setTimeout(() => {
      // Reset location filter when leaving locations view
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

// ═══════════════════════════════════════════════════════════════════════════════
// BOOTSTRAP
// ═══════════════════════════════════════════════════════════════════════════════
async function init() {
  await fetchAllData();
  render();
}

init();
