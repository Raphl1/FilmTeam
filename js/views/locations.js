import { state } from '../core/state.js';
import { escapeHtml } from '../core/events.js';
export default async function viewLocations() {
  if (!state.locations) return '<p class="text-muted p-lg">Laden...</p>';
  const locations = state.locations;
  const filter = state.activeFilter;
  const allBadges = [...new Set(locations.flatMap(l => l.badges))];
  const editing = state.editMode;
  let filtered;
  if (filter === 'all') filtered = locations;
  else if (filter === 'open') filtered = locations.filter(l => l.status === 'open');
  else filtered = locations.filter(l => l.badges.includes(filter));
  const emptyState = filtered.length === 0 ? '<div class="flex flex-col items-center justify-center py-2xl text-muted text-sm">Keine Locations gefunden für diesen Filter.</div>' : '';
  return `
    <h2 class="text-xl font-extrabold tracking-tight mb-lg"><i data-lucide="map-pin"></i> Drehorte</h2>
    <div class="flex flex-wrap gap-sm mb-lg">
      <button class="px-md py-sm rounded-full text-sm font-semibold border cursor-pointer min-h-[44px] flex items-center transition-all duration-base ${filter === 'all' ? 'border-violet/30 text-violet bg-violet/10' : 'border-border text-muted hover:border-violet/30 hover:text-violet'}" data-filter="all">Alle</button>
      ${allBadges.map(b => `<button class="px-md py-sm rounded-full text-sm font-semibold border cursor-pointer min-h-[44px] flex items-center transition-all duration-base ${filter === b ? 'border-violet/30 text-violet bg-violet/10' : 'border-border text-muted hover:border-violet/30 hover:text-violet'}" data-filter="${b}">${b}</button>`).join('')}
      <button class="px-md py-sm rounded-full text-sm font-semibold border cursor-pointer min-h-[44px] flex items-center transition-all duration-base ${filter === 'open' ? 'border-violet/30 text-violet bg-violet/10' : 'border-border text-muted hover:border-violet/30 hover:text-violet'}" data-filter="open">Offen</button>
    </div>
    ${emptyState}
    <div class="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-md">
      ${filtered.map(loc => {
        const realIdx = locations.indexOf(loc);
        const statusColor = loc.status === 'confirmed' ? 'border-green/30 bg-green/10 text-green' : loc.status === 'pending' ? 'border-gold/30 bg-gold/10 text-gold' : 'border-border bg-card2 text-muted';
        const statusLabel = loc.status === 'confirmed' ? 'Bestätigt' : loc.status === 'pending' ? 'Ausstehend' : 'Offen';
        const mapEmbed = loc.mapEmbed ? `<div class="w-full h-[180px] overflow-hidden"><iframe src="${loc.mapEmbed}" loading="lazy" allowfullscreen referrerpolicy="no-referrer-when-downgrade" class="w-full h-full border-none"></iframe></div>` : '';
        const mapLink = loc.mapLink ? `<a href="${loc.mapLink}" target="_blank" rel="noopener" class="inline-flex items-center gap-xs text-sm text-violet font-semibold no-underline mt-sm hover:text-lilac transition-colors duration-base">🗺️ Google Maps</a>` : '';
        const deleteBtn = editing ? `<button class="absolute top-sm right-sm w-6 h-6 flex items-center justify-center rounded-full bg-accent/10 text-accent text-xs cursor-pointer border-none hover:bg-accent/20 z-10" data-action="delete-location" data-idx="${realIdx}" title="Löschen">✕</button>` : '';
        const statusBadge = editing
          ? `<span class="text-xs font-semibold px-[10px] py-[3px] rounded-full border ${statusColor} cursor-pointer" data-action="cycle-location-status" data-idx="${realIdx}">${statusLabel}</span>`
          : `<span class="text-xs font-semibold px-[10px] py-[3px] rounded-full border ${statusColor}">${statusLabel}</span>`;
        const nameField = editing
          ? `<h3 class="text-base font-bold text-txt m-0" contenteditable="true" data-field="name" data-file="locations" data-idx="${realIdx}">${escapeHtml(loc.name)}</h3>`
          : `<h3 class="text-base font-bold text-txt m-0">${escapeHtml(loc.name)}</h3>`;
        const concreteField = editing
          ? `<p class="text-sm text-muted m-0" contenteditable="true" data-field="concrete" data-file="locations" data-idx="${realIdx}">${escapeHtml(loc.concrete)}</p>`
          : `<p class="text-sm text-muted m-0">${escapeHtml(loc.concrete)}</p>`;
        const vibeField = editing
          ? `<p class="text-xs text-muted italic m-0 mt-sm" contenteditable="true" data-field="vibe" data-file="locations" data-idx="${realIdx}">${escapeHtml(loc.vibe)}</p>`
          : `<p class="text-xs text-muted italic m-0 mt-sm">${escapeHtml(loc.vibe)}</p>`;
        return `
          <div class="bg-card border border-border rounded overflow-hidden transition-all duration-base hover:-translate-y-0.5 hover:shadow-md hover:border-purple/30 relative flex flex-col">
            ${deleteBtn}
            ${mapEmbed}
            <div class="p-md flex flex-col gap-sm flex-1">
              <div class="flex items-center justify-between">
                <span class="text-xs font-mono text-muted">#${String(loc.id).padStart(2, '0')}</span>
                ${statusBadge}
              </div>
              ${nameField}
              ${concreteField}
              <div class="flex flex-wrap gap-xs">${loc.badges.map(b => `<span class="text-xs font-semibold px-[10px] py-[3px] rounded-full border border-border text-muted">${b}</span>`).join(' ')}</div>
              ${vibeField}
              ${loc.reference ? `<div class="text-xs text-muted mt-sm">🎬 ${escapeHtml(loc.reference)}</div>` : ''}
              ${mapLink}
            </div>
          </div>`;
      }).join('')}
    </div>
    ${editing ? `<button class="mt-md px-lg py-sm rounded-full text-sm font-semibold border border-dashed border-border text-muted cursor-pointer hover:border-violet hover:text-violet transition-all duration-base" data-action="add-location">+ Location hinzufügen</button>` : ''}
  `;
}
