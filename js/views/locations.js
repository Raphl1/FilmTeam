import { state } from '../core/state.js';
import { escapeHtml, getPermitLabel } from '../core/events.js';

const ALLOWED_MAP_HOSTS = ['www.google.com', 'maps.google.com', 'google.com'];
function isSafeMapUrl(url) {
  if (!url) return false;
  try { return ALLOWED_MAP_HOSTS.includes(new URL(url).hostname); } catch { return false; }
}

const TAB_KEY = 'locations_active_tab';

function getActiveTab() {
  return localStorage.getItem(TAB_KEY) || 'places';
}

function setActiveTab(tab) {
  localStorage.setItem(TAB_KEY, tab);
}

function tabsBar(active) {
  const tab = (id, label, count) =>
    '<button class="px-md py-sm rounded-full text-sm font-semibold border cursor-pointer min-h-[44px] flex items-center gap-xs transition-all duration-base '
    + (active === id ? 'border-violet/30 text-violet bg-violet/10' : 'border-border text-muted hover:border-violet/30 hover:text-violet')
    + '" data-locations-tab="' + id + '" role="tab" aria-selected="' + (active === id) + '">'
    + label + (count !== undefined ? '<span class="text-[10px] opacity-60">' + count + '</span>' : '') + '</button>';

  const locCount = (state.locations || []).length;
  const conCount = ((state.contacts && state.contacts.contacts) || []).length;
  const perCount = ((state.contacts && state.contacts.permits) || []).length;

  return '<div class="flex flex-wrap gap-sm mb-lg" role="tablist" aria-label="Drehorte und Kontakte Tabs">'
    + tab('places', '📍 Drehorte', locCount)
    + tab('contacts', '📞 Kontakte', conCount)
    + tab('permits', '✅ Genehmigungen', perCount)
    + '</div>';
}

// ─── PLACES TAB (former locations view) ─────────────────────────────────────

function renderPlaces() {
  const locations = state.locations || [];
  const filter = state.activeFilter;
  const allBadges = [...new Set(locations.flatMap(l => l.badges || []))];
  const editing = state.editMode;

  let filtered;
  if (filter === 'all') filtered = locations;
  else if (filter === 'open') filtered = locations.filter(l => l.status === 'open');
  else filtered = locations.filter(l => (l.badges || []).includes(filter));

  const filterPill = (id, label, count) =>
    '<button class="px-md py-sm rounded-full text-sm font-semibold border cursor-pointer min-h-[44px] flex items-center transition-all duration-base '
    + (filter === id ? 'border-violet/30 text-violet bg-violet/10' : 'border-border text-muted hover:border-violet/30 hover:text-violet')
    + '" data-filter="' + id + '">' + label + ' (' + count + ')</button>';

  const filters = '<div class="flex flex-wrap gap-sm mb-lg">'
    + filterPill('all', 'Alle', locations.length)
    + allBadges.map(b => filterPill(b, b, locations.filter(l => (l.badges || []).includes(b)).length)).join('')
    + filterPill('open', 'Offen', locations.filter(l => l.status === 'open').length)
    + '</div>';

  const empty = filtered.length === 0
    ? (locations.length === 0
        ? '<div class="flex flex-col items-center justify-center py-2xl text-muted text-sm"><i data-lucide="map-pin" class="w-10 h-10 mb-md opacity-50"></i><p class="font-semibold text-base">Noch keine Locations angelegt</p></div>'
        : '<div class="flex flex-col items-center justify-center py-2xl text-muted text-sm">Keine Locations für diesen Filter.</div>')
    : '';

  const cards = filtered.map(loc => {
    const realIdx = locations.indexOf(loc);
    const statusColor = loc.status === 'confirmed' ? 'border-green/30 bg-green/10 text-green' : loc.status === 'pending' ? 'border-gold/30 bg-gold/10 text-gold' : 'border-border bg-card2 text-muted';
    const statusLabel = loc.status === 'confirmed' ? 'Bestätigt' : loc.status === 'pending' ? 'Ausstehend' : 'Offen';
    const mapEmbed = loc.mapEmbed && isSafeMapUrl(loc.mapEmbed)
      ? '<div class="w-full h-[180px] overflow-hidden"><iframe src="' + loc.mapEmbed + '" loading="lazy" allowfullscreen referrerpolicy="no-referrer-when-downgrade" class="w-full h-full border-none" sandbox="allow-scripts allow-same-origin"></iframe></div>'
      : '';
    const mapLink = loc.mapLink && isSafeMapUrl(loc.mapLink)
      ? '<a href="' + loc.mapLink + '" target="_blank" rel="noopener" class="inline-flex items-center gap-xs text-sm text-violet font-semibold no-underline mt-sm hover:text-lilac transition-colors duration-base">🗺️ Google Maps</a>'
      : '';
    const refLink = loc.referenceUrl
      ? '<a href="' + loc.referenceUrl + '" target="_blank" rel="noopener" class="inline-flex items-center gap-xs text-sm text-accent font-semibold no-underline mt-sm hover:text-lilac transition-colors duration-base">🎬 Referenz ansehen</a>'
      : '';
    const deleteBtn = editing
      ? '<button class="absolute top-sm right-sm w-6 h-6 flex items-center justify-center rounded-full bg-accent/10 text-accent text-xs cursor-pointer border-none hover:bg-accent/20 z-10" data-action="delete-location" data-idx="' + realIdx + '" title="Löschen">✕</button>'
      : '';
    const statusBadge = editing
      ? '<span class="text-xs font-semibold px-[10px] py-[3px] rounded-full border ' + statusColor + ' cursor-pointer" data-action="cycle-location-status" data-idx="' + realIdx + '">' + statusLabel + '</span>'
      : '<span class="text-xs font-semibold px-[10px] py-[3px] rounded-full border ' + statusColor + '">' + statusLabel + '</span>';
    const nameField = editing
      ? '<h3 class="text-base font-bold text-txt m-0" contenteditable="true" data-field="name" data-file="locations" data-idx="' + realIdx + '">' + escapeHtml(loc.name) + '</h3>'
      : '<h3 class="text-base font-bold text-txt m-0">' + escapeHtml(loc.name) + '</h3>';
    const concreteField = editing
      ? '<p class="text-sm text-muted m-0" contenteditable="true" data-field="concrete" data-file="locations" data-idx="' + realIdx + '">' + escapeHtml(loc.concrete || '') + '</p>'
      : '<p class="text-sm text-muted m-0">' + escapeHtml(loc.concrete || '') + '</p>';
    const vibeField = editing
      ? '<p class="text-xs text-muted italic m-0 mt-sm" contenteditable="true" data-field="vibe" data-file="locations" data-idx="' + realIdx + '">' + escapeHtml(loc.vibe || '') + '</p>'
      : '<p class="text-xs text-muted italic m-0 mt-sm">' + escapeHtml(loc.vibe || '') + '</p>';
    return '<div class="bg-card border border-border rounded overflow-hidden transition-all duration-base hover:-translate-y-0.5 hover:shadow-md hover:border-purple/30 relative flex flex-col">'
      + deleteBtn + mapEmbed
      + '<div class="p-md flex flex-col gap-sm flex-1">'
      + '<div class="flex items-center justify-between"><span class="text-xs font-mono text-muted">#' + String(loc.id).padStart(2, '0') + '</span>' + statusBadge + '</div>'
      + nameField + concreteField
      + '<div class="flex flex-wrap gap-xs">' + (loc.badges || []).map(b => '<span class="text-xs font-semibold px-[10px] py-[3px] rounded-full border border-border text-muted">' + b + '</span>').join(' ') + '</div>'
      + vibeField
      + (loc.reference ? '<div class="text-xs text-muted mt-sm">🎬 ' + escapeHtml(loc.reference) + '</div>' : '')
      + mapLink + refLink
      + '</div></div>';
  }).join('');

  return filters + empty
    + '<div class="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-md">' + cards + '</div>'
    + (editing ? '<button class="mt-md px-lg py-sm rounded-full text-sm font-semibold border border-dashed border-border text-muted cursor-pointer hover:border-violet hover:text-violet transition-all duration-base" data-action="add-location">+ Location hinzufügen</button>' : '');
}

// ─── CONTACTS TAB ───────────────────────────────────────────────────────────

function renderContacts() {
  if (!state.contacts) return '<p class="text-muted p-lg">Laden...</p>';
  const contacts = state.contacts.contacts || [];
  const editing = state.editMode;

  const catColors = { 'dhbw': 'border-l-purple', 'park': 'border-l-green', 'city': 'border-l-gold', 'gastro': 'border-l-accent' };
  const catDots = { 'dhbw': 'bg-purple', 'park': 'bg-green', 'city': 'bg-gold', 'gastro': 'bg-accent' };

  if (contacts.length === 0) {
    return '<div class="flex flex-col items-center justify-center py-2xl text-muted text-sm"><i data-lucide="phone" class="w-10 h-10 mb-md opacity-50"></i><p class="font-semibold text-base">Noch keine Kontakte angelegt</p></div>';
  }

  const cards = contacts.map((c, idx) => {
    const borderClass = catColors[c.category] || '';
    const dotClass = catDots[c.category] || 'bg-muted';
    const phone = c.phone ? '<a href="tel:' + c.phone.replace(/\s/g, '') + '" class="text-sm text-violet no-underline hover:text-lilac transition-colors duration-base">📱 ' + escapeHtml(c.phone) + '</a>' : '';
    const email = c.email ? '<a href="mailto:' + escapeHtml(c.email) + '" class="text-sm text-violet no-underline hover:text-lilac transition-colors duration-base">✉️ ' + escapeHtml(c.email) + '</a>' : '';
    const insta = c.instagram ? '<a href="https://instagram.com/' + escapeHtml(c.instagram.replace('@', '')) + '" target="_blank" rel="noopener" class="text-sm text-violet no-underline hover:text-lilac transition-colors duration-base">📷 ' + escapeHtml(c.instagram) + '</a>' : '';
    const website = c.website ? '<a href="' + escapeHtml(c.website) + '" target="_blank" rel="noopener" class="text-sm text-violet no-underline hover:text-lilac transition-colors duration-base">🌐 ' + escapeHtml(c.website) + '</a>' : '';
    const deleteBtn = editing
      ? '<button class="absolute top-sm right-sm w-6 h-6 flex items-center justify-center rounded-full bg-accent/10 text-accent text-xs cursor-pointer border-none hover:bg-accent/20" data-action="delete-contact" data-idx="' + idx + '" title="Löschen">✕</button>'
      : '';
    const nameField = editing
      ? '<h3 class="text-base font-bold text-txt m-0" contenteditable="true" data-field="name" data-file="contacts" data-idx="' + idx + '" data-subkey="contacts">' + escapeHtml(c.name) + '</h3>'
      : '<h3 class="text-base font-bold text-txt m-0">' + escapeHtml(c.name) + '</h3>';
    const roleField = editing
      ? '<p class="text-sm text-muted m-0" contenteditable="true" data-field="role" data-file="contacts" data-idx="' + idx + '" data-subkey="contacts">' + escapeHtml(c.role || '') + '</p>'
      : '<p class="text-sm text-muted m-0">' + escapeHtml(c.role || '') + '</p>';
    return '<div class="bg-card border border-border rounded overflow-hidden transition-all duration-base hover:-translate-y-0.5 hover:shadow-md hover:border-purple/30 p-lg relative flex flex-col gap-sm border-l-[3px] ' + borderClass + '">'
      + deleteBtn
      + '<div class="flex items-center gap-sm"><span class="w-2.5 h-2.5 rounded-full shrink-0 ' + dotClass + '"></span>' + nameField + '</div>'
      + roleField
      + '<div class="flex flex-col gap-xs mt-sm">' + phone + email + insta + website
      + (c.address ? '<div class="text-xs text-muted">📍 ' + escapeHtml(c.address) + '</div>' : '')
      + '</div>'
      + (c.note ? '<div class="text-xs text-muted mt-sm p-sm bg-bg rounded-sm">📝 ' + escapeHtml(c.note) + '</div>' : '')
      + '</div>';
  }).join('');

  return '<div class="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-md">' + cards + '</div>'
    + (editing ? '<button class="mt-md px-lg py-sm rounded-full text-sm font-semibold border border-dashed border-border text-muted cursor-pointer hover:border-violet hover:text-violet transition-all duration-base" data-action="add-contact">+ Kontakt hinzufügen</button>' : '');
}

// ─── PERMITS TAB ────────────────────────────────────────────────────────────

function renderPermits() {
  if (!state.contacts) return '<p class="text-muted p-lg">Laden...</p>';
  const { contacts, permits } = state.contacts;
  if (!permits || permits.length === 0) {
    return '<div class="flex flex-col items-center justify-center py-2xl text-muted text-sm"><i data-lucide="check-square" class="w-10 h-10 mb-md opacity-50"></i><p class="font-semibold text-base">Keine Genehmigungen erfasst</p></div>';
  }
  const rows = permits.map((p, idx) => {
    const s = p.status || 'not-asked';
    const contact = (contacts || []).find(c => c.id === p.contact);
    const contactName = contact ? contact.name : '—';
    const permitColor = s === 'approved' ? 'border-green/30 bg-green/10 text-green'
      : s === 'pending' ? 'border-gold/30 bg-gold/10 text-gold'
      : s === 'declined' ? 'border-accent/30 bg-accent/10 text-accent'
      : 'border-border bg-card2 text-muted';
    return '<tr class="border-b border-border hover:bg-card2 transition-colors duration-fast">'
      + '<td class="p-sm text-txt">' + escapeHtml(p.location) + '</td>'
      + '<td class="p-sm text-txt">' + escapeHtml(contactName) + '</td>'
      + '<td class="p-sm"><span class="text-xs font-semibold px-[10px] py-[3px] rounded-full border cursor-pointer ' + permitColor + '" data-action="cycle-permit" data-permit-idx="' + idx + '">' + getPermitLabel(s) + '</span></td>'
      + '<td class="p-sm text-muted">' + escapeHtml(p.notes || '') + '</td>'
      + '</tr>';
  }).join('');
  return '<div class="overflow-x-auto rounded border border-border">'
    + '<table class="w-full border-collapse text-sm">'
    + '<thead><tr class="bg-card2 border-b border-border">'
    + '<th class="text-left p-sm text-xs text-muted font-semibold uppercase tracking-wide">Location</th>'
    + '<th class="text-left p-sm text-xs text-muted font-semibold uppercase tracking-wide">Kontakt</th>'
    + '<th class="text-left p-sm text-xs text-muted font-semibold uppercase tracking-wide">Status</th>'
    + '<th class="text-left p-sm text-xs text-muted font-semibold uppercase tracking-wide">Notizen</th>'
    + '</tr></thead><tbody>' + rows + '</tbody></table></div>';
}

// ─── Default export ─────────────────────────────────────────────────────────

export default async function viewLocations() {
  const tab = getActiveTab();
  const headline = tab === 'contacts'
    ? '📞 Kontakte'
    : tab === 'permits'
    ? '✅ Genehmigungen'
    : '📍 Drehorte & Kontakte';

  let body;
  if (tab === 'contacts') body = renderContacts();
  else if (tab === 'permits') body = renderPermits();
  else body = renderPlaces();

  return '<h2 class="text-xl font-extrabold tracking-tight mb-lg">' + headline + '</h2>'
    + tabsBar(tab) + body;
}

// Hash-deeplink: #locations?tab=contacts
export function applyHashTab() {
  try {
    const hash = window.location.hash || '';
    const m = hash.match(/[?&]tab=([\w-]+)/);
    if (m && ['places', 'contacts', 'permits'].includes(m[1])) {
      setActiveTab(m[1]);
    }
  } catch { /* ignore */ }
}
