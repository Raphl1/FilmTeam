import { state } from '../core/state.js';
import { escapeHtml } from '../core/events.js';

function getSettledItems() {
  try { return JSON.parse(localStorage.getItem('budget_settled') || '{}'); } catch { return {}; }
}

export default async function viewBudget() {
  if (!state.budget) return '<p class="text-muted p-lg">Laden...</p>';
  const { items, currency } = state.budget;
  const members = (state.team && state.team.members) || [];
  const editing = state.editMode;
  const settled = getSettledItems();

  const totalSpent = items.reduce((s, i) => s + (i.amount || 0), 0);
  const openAmount = items.reduce((s, i, idx) => s + (settled[idx] ? 0 : (i.amount || 0)), 0);
  const settledCount = items.filter((_, idx) => settled[idx]).length;
  const paidItems = items.filter(i => i.amount > 0).length;

  function approvalBadge(status) {
    if (status === 'approved') return '<span class="text-xs font-semibold px-[10px] py-[3px] rounded-full border border-green/30 bg-green/10 text-green">Genehmigt</span>';
    if (status === 'pending') return '<span class="text-xs font-semibold px-[10px] py-[3px] rounded-full border border-gold/30 bg-gold/10 text-gold">Ausstehend</span>';
    if (status === 'declined') return '<span class="text-xs font-semibold px-[10px] py-[3px] rounded-full border border-accent/30 bg-accent/10 text-accent">Abgelehnt</span>';
    return '<span class="text-xs font-semibold px-[10px] py-[3px] rounded-full border border-border bg-card2 text-muted">Offen</span>';
  }

  return `
    <h2 class="text-xl font-extrabold tracking-tight mb-lg"><i data-lucide="wallet"></i> Budget & Ausgaben</h2>
    <div class="grid grid-cols-2 xs:grid-cols-4 gap-md mb-lg">
      <div class="bg-card border border-border rounded p-md flex flex-col gap-xs"><div class="text-xs text-muted">Gesamt</div><div class="text-lg font-extrabold text-txt">${totalSpent.toFixed(2)}${currency}</div></div>
      <div class="bg-card border border-border rounded p-md flex flex-col gap-xs"><div class="text-xs text-muted">Offen</div><div class="text-lg font-extrabold ${openAmount > 0 ? 'text-accent' : 'text-green'}">${openAmount.toFixed(2)}${currency}</div></div>
      <div class="bg-card border border-border rounded p-md flex flex-col gap-xs"><div class="text-xs text-muted">Beglichen</div><div class="text-lg font-extrabold text-green">${settledCount}/${items.length}</div></div>
      <div class="bg-card border border-border rounded p-md flex flex-col gap-xs"><div class="text-xs text-muted">Ausgaben</div><div class="text-lg font-extrabold text-txt">${paidItems}/${items.length}</div></div>
    </div>
    <h3 class="text-md font-bold text-txt mt-2xl mb-md">Ausgaben</h3>
    ${items.length === 0 && !editing ? `
      <div class="flex flex-col items-center justify-center py-2xl text-muted text-sm"><div class="text-3xl mb-sm">💸</div><p>Noch keine Ausgaben eingetragen.</p></div>
    ` : `
    <div class="overflow-x-auto rounded border border-border">
      <table class="w-full border-collapse text-sm">
        <thead><tr class="bg-card2 border-b border-border"><th class="p-sm w-[40px]"></th><th class="text-left p-sm text-xs text-muted font-semibold uppercase tracking-wide">Posten</th><th class="text-right p-sm text-xs text-muted font-semibold uppercase tracking-wide">Betrag</th><th class="text-left p-sm text-xs text-muted font-semibold uppercase tracking-wide">Bezahlt von</th><th class="text-left p-sm text-xs text-muted font-semibold uppercase tracking-wide">Status</th><th class="text-left p-sm text-xs text-muted font-semibold uppercase tracking-wide">Notizen</th>${editing ? '<th class="p-sm"></th>' : ''}</tr></thead>
        <tbody>
          ${items.map((item, idx) => {
            const isSettled = !!settled[idx];
            const paidBySelect = editing ? `<select class="bg-bg border border-border rounded-sm px-sm py-xs text-sm text-txt" data-action="budget-paidby" data-idx="${idx}"><option value="">— wählen —</option>${members.map(m => `<option value="${m.name}" ${item.paidBy === m.name ? 'selected' : ''}>${m.name}</option>`).join('')}</select>` : escapeHtml(item.paidBy || '—');
            const statusField = editing ? `<select class="bg-bg border border-border rounded-sm px-sm py-xs text-sm text-txt" data-action="budget-status" data-idx="${idx}"><option value="open" ${item.status === 'open' ? 'selected' : ''}>Offen</option><option value="pending" ${item.status === 'pending' ? 'selected' : ''}>Ausstehend</option><option value="approved" ${item.status === 'approved' ? 'selected' : ''}>Genehmigt</option><option value="declined" ${item.status === 'declined' ? 'selected' : ''}>Abgelehnt</option></select>` : approvalBadge(item.status);
            return `<tr class="border-b border-border hover:bg-card2 transition-colors duration-fast ${isSettled ? 'opacity-50' : ''}">
              <td class="p-sm text-center">
                <button class="w-6 h-6 rounded-sm border-2 ${isSettled ? 'border-green bg-green/20 text-green' : 'border-border text-transparent hover:border-violet'} flex items-center justify-center cursor-pointer transition-all duration-base text-xs font-bold" data-action="toggle-budget-settled" data-idx="${idx}">${isSettled ? '✓' : ''}</button>
              </td>
              <td class="p-sm text-txt ${isSettled ? 'line-through' : ''}">${editing ? `<span contenteditable="true" data-field="name" data-file="budget" data-idx="${idx}">${escapeHtml(item.name)}</span>` : escapeHtml(item.name)}</td>
              <td class="p-sm text-right font-mono ${isSettled ? 'line-through' : ''}">${editing ? `<input type="number" class="bg-bg border border-border rounded-sm px-sm py-xs text-sm text-txt w-[80px] text-right" value="${item.amount || 0}" step="0.01" data-action="budget-amount" data-idx="${idx}" />` : `${(item.amount || 0).toFixed(2)}${currency}`}</td>
              <td class="p-sm">${paidBySelect}</td>
              <td class="p-sm">${isSettled ? '<span class="text-xs font-semibold px-[10px] py-[3px] rounded-full border border-green/30 bg-green/10 text-green">✓ Beglichen</span>' : statusField}</td>
              <td class="p-sm text-muted text-xs max-w-[200px] truncate">${editing ? `<span contenteditable="true" data-field="notes" data-file="budget" data-idx="${idx}">${escapeHtml(item.notes || '')}</span>` : escapeHtml(item.notes || '')}</td>
              ${editing ? `<td class="p-sm"><button class="w-5 h-5 flex items-center justify-center rounded-full bg-accent/10 text-accent text-xs cursor-pointer border-none hover:bg-accent/20" data-action="delete-budget" data-idx="${idx}">✕</button></td>` : ''}
            </tr>`;
          }).join('')}
          ${items.length > 0 ? `<tr class="bg-card2 border-t border-border font-bold"><td class="p-sm"></td><td class="p-sm text-txt"><strong>Offen</strong></td><td class="p-sm text-right font-mono"><strong class="${openAmount > 0 ? 'text-accent' : 'text-green'}">${openAmount.toFixed(2)}${currency}</strong></td><td colspan="3"></td>${editing ? '<td></td>' : ''}</tr>` : ''}
        </tbody>
      </table>
    </div>`}
    ${editing ? `<button class="mt-md px-lg py-sm rounded-full text-sm font-semibold border border-dashed border-border text-muted cursor-pointer hover:border-violet hover:text-violet transition-all duration-base" data-action="add-budget">+ Ausgabe hinzufügen</button>` : ''}
  `;
}
