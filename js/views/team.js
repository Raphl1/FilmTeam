import { state } from '../core/state.js';
import { escapeHtml } from '../core/events.js';

export default async function viewTeam() {
  if (!state.team) return '<p class="text-muted p-lg">Laden...</p>';
  const { lead, members, roles, filmrollen, casting } = state.team;
  const editing = state.editMode;
  const filter = state.teamFilter || 'all';

  // Build role lookup: person → roles they're in
  const personRoles = {};
  (roles || []).forEach(r => {
    (r.assigned || '').split(',').map(s => s.trim()).filter(Boolean).forEach(name => {
      if (!personRoles[name]) personRoles[name] = [];
      personRoles[name].push(r.title);
    });
  });
  (filmrollen || []).forEach(r => {
    (r.assigned || '').split(',').map(s => s.trim()).filter(Boolean).forEach(name => {
      if (!personRoles[name]) personRoles[name] = [];
      personRoles[name].push(r.title);
    });
  });

  // All people combined
  const allPeople = [
    ...(members || []).map(m => ({ ...m, group: 'Filmteam' })),
    ...(casting || []).map(m => ({ ...m, group: 'Casting' }))
  ];

  // Filter options
  const allRoleTitles = [...(roles || []).map(r => r.title), ...(filmrollen || []).map(r => r.title)];

  // Filtered people
  const filteredPeople = filter === 'all' 
    ? allPeople 
    : allPeople.filter(p => (personRoles[p.name] || []).some(r => r === filter));

  // ── Filmteam-Rollen Cards ──
  const rolesHtml = (roles || []).map((role, idx) => {
    const assigned = role.assigned && role.assigned.trim() !== '';
    const deleteBtn = editing ? `<button class="absolute top-sm right-sm w-6 h-6 flex items-center justify-center rounded-full bg-accent/10 text-accent text-xs cursor-pointer border-none hover:bg-accent/20" data-action="delete-role" data-idx="${idx}">✕</button>` : '';
    const personField = editing
      ? `<input type="text" class="bg-bg border border-border rounded-sm px-sm py-xs text-sm text-txt w-full" value="${escapeHtml(role.assigned || '')}" placeholder="Namen eingeben..." data-action="assign-role" data-idx="${idx}" />`
      : `<span class="text-sm font-semibold ${assigned ? 'text-txt' : 'text-muted italic'}">${assigned ? escapeHtml(role.assigned) : 'Offen'}</span>`;
    return `
      <div class="bg-card border border-border rounded overflow-hidden transition-all duration-base hover:-translate-y-0.5 hover:shadow-md hover:border-purple/30 p-lg relative flex flex-col gap-sm">
        ${deleteBtn}
        <div class="text-2xl">${role.icon}</div>
        <h3 class="text-base font-bold text-txt m-0">${escapeHtml(role.title)}</h3>
        <p class="text-sm text-muted m-0 leading-relaxed">${escapeHtml(role.description)}</p>
        <div class="flex items-center justify-between mt-auto pt-sm border-t border-border">
          ${personField}
          <span class="w-2.5 h-2.5 rounded-full shrink-0 ml-sm ${assigned ? 'bg-green' : 'bg-gold'}"></span>
        </div>
      </div>`;
  }).join('');

  // ── Filmrollen Cards ──
  const filmrollenHtml = (filmrollen || []).map((role, idx) => {
    const frIdx = idx;
    const personField = editing
      ? `<input type="text" class="bg-bg border border-border rounded-sm px-sm py-xs text-sm text-txt w-full" value="${escapeHtml(role.assigned || '')}" placeholder="Darsteller..." data-action="assign-filmrolle" data-idx="${frIdx}" />`
      : `<span class="text-sm font-semibold text-txt">${escapeHtml(role.assigned)}</span>`;
    return `
    <div class="bg-card border border-border rounded overflow-hidden transition-all duration-base hover:-translate-y-0.5 hover:shadow-md hover:border-purple/30 p-lg relative flex flex-col gap-sm border-l-[3px] border-l-lilac">
      <div class="text-2xl">${role.icon}</div>
      <h3 class="text-base font-bold text-txt m-0">${escapeHtml(role.title)}</h3>
      <p class="text-sm text-muted m-0 leading-relaxed">${escapeHtml(role.description)}</p>
      <div class="flex items-center justify-between mt-auto pt-sm border-t border-border">
        ${personField}
      </div>
    </div>`;
  }).join('');

  // ── Casting Chips ──
  const castingHtml = (casting || []).map(m => `
    <div class="flex items-center gap-sm bg-card border border-border rounded-full px-md py-xs transition-all duration-base hover:border-purple/30 hover:shadow-sm">
      <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style="background:${m.color}">${m.name.substring(0,2).toUpperCase()}</div>
      <span class="text-sm font-semibold text-txt whitespace-nowrap">${escapeHtml(m.name)}</span>
    </div>`).join('');

  // ── Alle Personen Tabelle ──
  const peopleRows = filteredPeople.map(p => {
    const pRoles = personRoles[p.name] || [];
    return `
      <tr class="border-b border-border hover:bg-card2 transition-colors duration-base">
        <td class="py-sm px-md">
          <div class="flex items-center gap-sm">
            <div class="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style="background:${p.color}">${p.name.substring(0,2).toUpperCase()}</div>
            <span class="text-sm font-semibold text-txt">${escapeHtml(p.name)}</span>
          </div>
        </td>
        <td class="py-sm px-md"><span class="text-xs px-[8px] py-[2px] rounded-full border ${p.group === 'Filmteam' ? 'border-violet/30 bg-violet/10 text-violet' : 'border-gold/30 bg-gold/10 text-gold'}">${p.group}</span></td>
        <td class="py-sm px-md"><div class="flex flex-wrap gap-xs">${pRoles.length > 0 ? pRoles.map(r => `<span class="text-xs px-[8px] py-[2px] rounded-full bg-purple/10 text-violet border border-purple/20">${escapeHtml(r)}</span>`).join('') : '<span class="text-xs text-muted italic">—</span>'}</div></td>
      </tr>`;
  }).join('');

  // ── Filter Bar ──
  const filterBar = `
    <div class="flex flex-wrap gap-xs mb-md">
      <button class="px-md py-xs rounded-full text-xs font-semibold border cursor-pointer transition-all duration-base ${filter === 'all' ? 'border-violet bg-violet/10 text-violet' : 'border-border text-muted hover:border-violet/30 hover:text-violet'}" data-action="filter-team" data-filter="all">Alle</button>
      ${allRoleTitles.map(t => `<button class="px-md py-xs rounded-full text-xs font-semibold border cursor-pointer transition-all duration-base ${filter === t ? 'border-violet bg-violet/10 text-violet' : 'border-border text-muted hover:border-violet/30 hover:text-violet'}" data-action="filter-team" data-filter="${escapeHtml(t)}">${escapeHtml(t)}</button>`).join('')}
    </div>`;

  return `
    <h2 class="text-xl font-extrabold tracking-tight mb-lg">👥 Team & Rollen</h2>
    <div class="bg-card border border-border rounded p-lg flex items-center gap-lg mb-lg">
      <div class="text-2xl">👑</div>
      <div class="flex flex-col gap-xs flex-1">
        <h3 class="text-base font-bold text-txt m-0">Projektleitung</h3>
        ${editing
          ? `<p class="text-md text-violet font-semibold m-0" contenteditable="true" data-field="lead.name" data-file="team">${escapeHtml(lead.name)}</p>`
          : `<p class="text-md text-violet font-semibold m-0">${escapeHtml(lead.name)}</p>`}
      </div>
      <span class="text-xs font-semibold px-[10px] py-[3px] rounded-full border border-green/30 bg-green/10 text-green">Zugewiesen</span>
    </div>

    <h3 class="text-md font-bold text-txt mt-2xl mb-md">🎬 Filmteam-Rollen</h3>
    <div class="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-md">${rolesHtml}</div>
    ${editing ? `<button class="mt-md px-lg py-sm rounded-full text-sm font-semibold border border-dashed border-border text-muted cursor-pointer hover:border-violet hover:text-violet transition-all duration-base" data-action="add-role">+ Rolle hinzufügen</button>` : ''}

    <h3 class="text-md font-bold text-txt mt-2xl mb-md">🎭 Schauspiel-Besetzung</h3>
    <div class="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-md">${filmrollenHtml}</div>

    <h3 class="text-md font-bold text-txt mt-2xl mb-md">🎪 Mitwirkende</h3>
    <div class="flex flex-wrap gap-sm mb-2xl">${castingHtml}</div>

    <h3 class="text-md font-bold text-txt mt-2xl mb-md">📋 Alle Personen & Zuordnungen</h3>
    ${filterBar}
    <div class="bg-card border border-border rounded overflow-hidden">
      <table class="w-full border-collapse text-left">
        <thead>
          <tr class="border-b border-border bg-card2">
            <th class="py-sm px-md text-xs font-semibold text-muted uppercase tracking-wide">Person</th>
            <th class="py-sm px-md text-xs font-semibold text-muted uppercase tracking-wide">Gruppe</th>
            <th class="py-sm px-md text-xs font-semibold text-muted uppercase tracking-wide">Rollen</th>
          </tr>
        </thead>
        <tbody>${peopleRows}</tbody>
      </table>
      <div class="px-md py-sm text-xs text-muted border-t border-border">${filteredPeople.length} von ${allPeople.length} Personen</div>
    </div>
  `;
}
