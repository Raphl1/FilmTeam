import { setGithubToken } from '../core/github.js';
import { showToast } from './toast.js';

export function showTokenModal() {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm opacity-0 transition-opacity duration-slow';
  modal.id = 'token-modal';
  modal.innerHTML = `
    <div class="bg-card border border-border rounded p-xl max-w-[420px] w-[90%] flex flex-col gap-md shadow-lg animate-scaleIn">
      <h3 class="text-lg font-extrabold text-txt m-0">GitHub Token erforderlich</h3>
      <p class="text-sm text-muted m-0 leading-relaxed">Um Änderungen zu speichern, benötigst du einen <strong>Personal Access Token</strong> mit <code class="text-xs bg-bg px-xs py-[2px] rounded-xs border border-border">repo</code> Berechtigung.</p>
      <p class="text-sm m-0"><a href="https://github.com/settings/tokens/new?scopes=repo&description=FRAIME+Editor" target="_blank" rel="noopener" class="text-violet font-semibold no-underline hover:text-lilac transition-colors duration-base">Token erstellen &rarr;</a></p>
      <input type="password" id="token-input" placeholder="ghp_xxxxxxxxxxxx" class="bg-bg border border-border rounded-sm px-md py-sm text-sm text-txt w-full focus:outline-none focus:border-violet" autocomplete="off" />
      <div class="flex items-center justify-end gap-sm">
        <button class="px-md py-sm rounded-full text-sm font-semibold border border-border text-muted cursor-pointer hover:border-violet/30 hover:text-violet transition-all duration-base" data-action="close-modal">Abbrechen</button>
        <button class="px-md py-sm rounded-full text-sm font-semibold border-none bg-purple text-white cursor-pointer hover:opacity-90 transition-opacity duration-base" data-action="save-token">Speichern</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  requestAnimationFrame(() => modal.style.opacity = '1');
  document.getElementById('token-input')?.focus();
}

export function closeTokenModal() {
  const modal = document.getElementById('token-modal');
  if (!modal) return;
  modal.style.opacity = '0';
  setTimeout(() => modal.remove(), 300);
}

export function handleSaveToken() {
  const input = document.getElementById('token-input');
  const token = input?.value.trim() || '';
  if (token) {
    setGithubToken(token);
    closeTokenModal();
    import('../core/editmode.js').then(m => m.enterEditMode());
  } else {
    showToast('Bitte Token eingeben', 'error');
  }
}
