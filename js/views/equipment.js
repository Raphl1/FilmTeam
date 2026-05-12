import { state } from '../core/state.js';
import { escapeHtml, getEquipmentChecked } from '../core/events.js';
export default async function viewEquipment() {
  if (!state.equipment) return '<p class="text-muted p-lg">Laden...</p>';
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
    <h2 class="text-xl font-extrabold tracking-tight mb-lg"><i data-lucide="camera"></i> Equipment</h2>
    <div class="bg-card border border-border rounded p-lg mb-lg">
      <div class="text-sm text-muted mb-sm"><strong class="text-txt">${done}</strong> von <strong class="text-txt">${total}</strong> Positionen erledigt</div>
      <div class="w-full h-2 rounded-full bg-bg overflow-hidden"><div class="h-full rounded-full bg-violet transition-all duration-slow" style="width:${total > 0 ? (done / total * 100) : 0}%"></div></div>
    </div>
    <div class="flex flex-col gap-lg">
      ${categories.map((cat, catIdx) => `
        <div class="flex flex-col gap-sm">
          <h3 class="text-md font-bold text-txt m-0">${escapeHtml(cat.title)}</h3>
          <div class="flex flex-col gap-xs">
            ${cat.items.map((item, idx) => {
              const key = `${cat.title}_${idx}`;
              const isChecked = !!checked[key];
              const checkbox = isChecked ? '☑' : '☐';
              const ownedBadge = item.owned ? '<span class="text-xs font-semibold px-[10px] py-[3px] rounded-full border border-green/30 bg-green/10 text-green">Vorhanden</span>' : '<span class="text-xs font-semibold px-[10px] py-[3px] rounded-full border border-gold/30 bg-gold/10 text-gold">Mieten</span>';
              const deleteBtn = editing ? `<button class="w-5 h-5 flex items-center justify-center rounded-full bg-accent/10 text-accent text-xs cursor-pointer border-none hover:bg-accent/20" data-action="delete-equipment" data-cat="${catIdx}" data-idx="${idx}" title="Entfernen">✕</button>` : '';
              const nameField = editing
                ? `<span class="text-sm text-txt flex-1" contenteditable="true" data-field="name" data-file="equipment" data-cat="${catIdx}" data-idx="${idx}">${escapeHtml(item.name)}</span>`
                : `<span class="text-sm text-txt flex-1 ${isChecked ? 'line-through opacity-60' : ''}">${escapeHtml(item.name)}</span>`;
              return `<div class="flex items-center gap-sm p-sm rounded-sm hover:bg-card2 transition-colors duration-fast ${isChecked ? 'opacity-70' : ''}">
                <span class="text-lg cursor-pointer select-none" data-action="toggle-equipment" data-key="${key}">${checkbox}</span>
                ${nameField}
                ${ownedBadge}
                ${deleteBtn}
              </div>`;
            }).join('')}
            ${editing ? `<button class="mt-xs px-md py-xs rounded-full text-xs font-semibold border border-dashed border-border text-muted cursor-pointer hover:border-violet hover:text-violet transition-all duration-base self-start" data-action="add-equipment-item" data-cat="${catIdx}">+ Hinzufügen</button>` : ''}
          </div>
        </div>
      `).join('')}
    </div>
    ${editing ? `<button class="mt-lg px-lg py-sm rounded-full text-sm font-semibold border border-dashed border-border text-muted cursor-pointer hover:border-violet hover:text-violet transition-all duration-base" data-action="add-equipment-category">+ Kategorie hinzufügen</button>` : ''}
  `;
}
