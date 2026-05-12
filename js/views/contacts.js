import { state } from '../core/state.js';
import { escapeHtml, getPermitStatus, getPermitLabel } from '../core/events.js';
export default async function viewContacts() {
  if (!state.contacts) return '<p class="text-muted p-lg">Laden...</p>';
  const { contacts, permits } = state.contacts;
  const permitStatuses = getPermitStatus();
  const editing = state.editMode;
  const catColors = { 'dhbw': 'border-l-purple', 'park': 'border-l-green', 'city': 'border-l-gold', 'gastro': 'border-l-accent' };
  const catDotColors = { 'dhbw': 'bg-purple', 'park': 'bg-green', 'city': 'bg-gold', 'gastro': 'bg-accent' };
  return `
    <h2 class="text-xl font-extrabold tracking-tight mb-lg"><i data-lucide="phone"></i> Kontakte</h2>
    <div class="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-md">
      ${contacts.map((c, idx) => {
        const borderClass = catColors[c.category] || '';
        const dotClass = catDotColors[c.category] || 'bg-muted';
        const phone = c.phone ? `<a href="tel:${c.phone.replace(/\s/g, '')}" target="_blank" class="text-sm text-violet no-underline hover:text-lilac transition-colors duration-base">📱 ${c.phone}</a>` : '';
        const email = c.email ? `<a href="mailto:${c.email}" target="_blank" class="text-sm text-violet no-underline hover:text-lilac transition-colors duration-base">✉️ ${c.email}</a>` : '';
        const instagram = c.instagram ? `<a href="https://instagram.com/${c.instagram.replace('@', '')}" target="_blank" class="text-sm text-violet no-underline hover:text-lilac transition-colors duration-base">📷 ${c.instagram}</a>` : '';
        const deleteBtn = editing ? `<button class="absolute top-sm right-sm w-6 h-6 flex items-center justify-center rounded-full bg-accent/10 text-accent text-xs cursor-pointer border-none hover:bg-accent/20" data-action="delete-contact" data-idx="${idx}" title="Löschen">✕</button>` : '';
        const nameField = editing
          ? `<h3 class="text-base font-bold text-txt m-0" contenteditable="true" data-field="name" data-file="contacts" data-idx="${idx}" data-subkey="contacts">${escapeHtml(c.name)}</h3>`
          : `<h3 class="text-base font-bold text-txt m-0">${escapeHtml(c.name)}</h3>`;
        const roleField = editing
          ? `<p class="text-sm text-muted m-0" contenteditable="true" data-field="role" data-file="contacts" data-idx="${idx}" data-subkey="contacts">${escapeHtml(c.role)}</p>`
          : `<p class="text-sm text-muted m-0">${escapeHtml(c.role)}</p>`;
        return `
          <div class="bg-card border border-border rounded overflow-hidden transition-all duration-base hover:-translate-y-0.5 hover:shadow-md hover:border-purple/30 p-lg relative flex flex-col gap-sm border-l-[3px] ${borderClass}">
            ${deleteBtn}
            <div class="flex items-center gap-sm">
              <span class="w-2.5 h-2.5 rounded-full shrink-0 ${dotClass}"></span>
              ${nameField}
            </div>
            ${roleField}
            <div class="flex flex-col gap-xs mt-sm">
              ${phone}${email}${instagram}
              ${c.address ? `<div class="text-xs text-muted">📍 ${escapeHtml(c.address)}</div>` : ''}
            </div>
            ${c.note ? `<div class="text-xs text-muted mt-sm p-sm bg-bg rounded-sm">📝 ${escapeHtml(c.note)}</div>` : ''}
          </div>`;
      }).join('')}
    </div>
    ${editing ? `<button class="mt-md px-lg py-sm rounded-full text-sm font-semibold border border-dashed border-border text-muted cursor-pointer hover:border-violet hover:text-violet transition-all duration-base" data-action="add-contact">+ Kontakt hinzufügen</button>` : ''}
    <h3 class="text-md font-bold text-txt mt-2xl mb-md">Genehmigungen</h3>
    <div class="overflow-x-auto rounded border border-border">
      <table class="w-full border-collapse text-sm">
        <thead><tr class="bg-card2 border-b border-border"><th class="text-left p-sm text-xs text-muted font-semibold uppercase tracking-wide">Location</th><th class="text-left p-sm text-xs text-muted font-semibold uppercase tracking-wide">Kontakt</th><th class="text-left p-sm text-xs text-muted font-semibold uppercase tracking-wide">Status</th><th class="text-left p-sm text-xs text-muted font-semibold uppercase tracking-wide">Notizen</th></tr></thead>
        <tbody>
          ${permits.map((p, idx) => {
            const savedStatus = permitStatuses[`permit_${idx}`] || p.status;
            const contact = contacts.find(c => c.id === p.contact);
            const contactName = contact ? contact.name : '—';
            const permitColor = savedStatus === 'granted' ? 'border-green/30 bg-green/10 text-green' : savedStatus === 'pending' ? 'border-gold/30 bg-gold/10 text-gold' : savedStatus === 'denied' ? 'border-accent/30 bg-accent/10 text-accent' : 'border-border bg-card2 text-muted';
            return `<tr class="border-b border-border hover:bg-card2 transition-colors duration-fast">
              <td class="p-sm text-txt">${escapeHtml(p.location)}</td>
              <td class="p-sm text-txt">${escapeHtml(contactName)}</td>
              <td class="p-sm"><span class="text-xs font-semibold px-[10px] py-[3px] rounded-full border cursor-pointer ${permitColor}" data-action="cycle-permit" data-permit-idx="${idx}">${getPermitLabel(savedStatus)}</span></td>
              <td class="p-sm text-muted">${escapeHtml(p.notes)}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}
