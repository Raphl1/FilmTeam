/**
 * SUS — System Usability Scale (10-question survey, scored 0-100).
 *
 * Standard Brooke (1996) wording, translated to German for the team.
 * Auto-prompt: after 5 sessions and not done yet. Re-openable manually.
 */

import { submitSUS, trackEvent, getStats } from '../core/analytics.js';
import { showToast } from './toast.js';

const QUESTIONS = [
  // Odd indices (1,3,5,7,9 in human terms = i=0,2,4,6,8) are positive
  // Even indices (2,4,6,8,10 = i=1,3,5,7,9) are negative
  'Ich kann mir vorstellen, FR(AI)ME regelmäßig zu nutzen.',
  'FR(AI)ME ist unnötig komplex.',
  'FR(AI)ME ist einfach zu bedienen.',
  'Ich brauche technische Unterstützung, um FR(AI)ME zu nutzen.',
  'Die Funktionen sind gut integriert.',
  'Es gibt zu viele Inkonsistenzen in FR(AI)ME.',
  'Die meisten Leute lernen FR(AI)ME schnell.',
  'FR(AI)ME ist umständlich zu bedienen.',
  'Ich fühle mich sicher beim Bedienen von FR(AI)ME.',
  'Ich musste viel lernen, bevor ich loslegen konnte.',
];

const SCALE = [
  { v: 1, l: 'Stimme gar nicht zu' },
  { v: 2, l: 'Stimme wenig zu' },
  { v: 3, l: 'Neutral' },
  { v: 4, l: 'Stimme zu' },
  { v: 5, l: 'Stimme voll zu' },
];

let mounted = false;
let prevFocus = null;
let trapHandler = null;

function focusables(root) {
  return Array.from(root.querySelectorAll(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )).filter(el => el.offsetParent !== null);
}

function trapFocus(overlay) {
  trapHandler = (e) => {
    if (e.key === 'Escape') { closeSUS(); return; }
    if (e.key !== 'Tab') return;
    const f = focusables(overlay);
    if (f.length === 0) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };
  document.addEventListener('keydown', trapHandler);
}

function renderHTML() {
  const items = QUESTIONS.map((q, idx) => `
    <div class="flex flex-col gap-xs py-sm border-b border-border last:border-0">
      <div class="text-sm text-txt font-medium">${idx + 1}. ${q}</div>
      <div class="flex items-center justify-between gap-xs mt-xs flex-wrap" role="radiogroup" aria-label="Frage ${idx + 1}">
        ${SCALE.map(s => `
          <button class="flex-1 min-w-[44px] py-sm rounded-sm border border-border text-xs font-semibold text-muted bg-transparent cursor-pointer hover:border-violet/40 hover:bg-violet/5 transition-all" data-sus-q="${idx}" data-sus-v="${s.v}" role="radio" aria-checked="false" aria-label="${s.l}">${s.v}</button>
        `).join('')}
      </div>
      <div class="flex justify-between text-[10px] text-muted">
        <span>${SCALE[0].l}</span>
        <span>${SCALE[SCALE.length - 1].l}</span>
      </div>
    </div>
  `).join('');

  return `
    <div class="fixed inset-0 z-[400] flex items-stretch md:items-center justify-center p-md md:p-lg bg-black/50 backdrop-blur-md animate-fadeIn" id="fraime-sus-overlay">
      <div class="w-full max-w-[600px] max-h-[90vh] flex flex-col bg-card border border-border rounded-[18px] shadow-lg animate-slideUp">
        <div class="flex items-start justify-between gap-md p-lg border-b border-border">
          <div>
            <h3 class="text-lg font-extrabold text-txt m-0">Kurze Umfrage zur Usability</h3>
            <p class="text-xs text-muted mt-xs">10 kurze Fragen · ca. 2 Minuten · anonym</p>
          </div>
          <button class="w-7 h-7 rounded-sm flex items-center justify-center text-muted hover:text-accent hover:bg-accent/10 cursor-pointer bg-transparent border-none shrink-0" data-sus-action="close" aria-label="Schließen">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-lg flex flex-col">
          ${items}
        </div>

        <div class="flex items-center justify-between gap-md p-lg border-t border-border">
          <span class="text-xs text-muted" id="fraime-sus-progress">0 / 10 beantwortet</span>
          <button class="px-lg py-sm rounded-sm border-none bg-purple text-white text-sm font-semibold cursor-pointer hover:brightness-110 active:scale-[.97] disabled:opacity-50 disabled:cursor-not-allowed" data-sus-action="submit" disabled>Absenden</button>
        </div>
      </div>
    </div>
  `;
}

export function openSUS() {
  if (mounted) return;
  mounted = true;
  prevFocus = document.activeElement;
  const answers = new Array(QUESTIONS.length).fill(0);

  const wrap = document.createElement('div');
  wrap.innerHTML = renderHTML().trim();
  const overlay = wrap.firstElementChild;
  document.body.appendChild(overlay);
  if (window.lucide) window.lucide.createIcons();

  trackEvent('sus-prompt-shown');

  setTimeout(() => focusables(overlay)[0]?.focus(), 50);
  trapFocus(overlay);

  const updateProgress = () => {
    const filled = answers.filter(Boolean).length;
    const progress = overlay.querySelector('#fraime-sus-progress');
    const submit = overlay.querySelector('[data-sus-action="submit"]');
    progress.textContent = `${filled} / ${QUESTIONS.length} beantwortet`;
    submit.disabled = filled < QUESTIONS.length;
  };

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeSUS();
  });

  overlay.querySelectorAll('[data-sus-q]').forEach(btn => {
    btn.addEventListener('click', () => {
      const q = parseInt(btn.dataset.susQ, 10);
      const v = parseInt(btn.dataset.susV, 10);
      answers[q] = v;
      // Update visual state for this question
      overlay.querySelectorAll(`[data-sus-q="${q}"]`).forEach(b => {
        const active = parseInt(b.dataset.susV, 10) === v;
        b.setAttribute('aria-checked', String(active));
        b.classList.toggle('bg-violet/15', active);
        b.classList.toggle('border-violet/50', active);
        b.classList.toggle('text-violet', active);
      });
      updateProgress();
    });
  });

  overlay.querySelector('[data-sus-action="close"]').addEventListener('click', closeSUS);
  overlay.querySelector('[data-sus-action="submit"]').addEventListener('click', async () => {
    if (answers.some(v => !v)) return;
    try {
      await submitSUS(answers);
      showToast('Danke für deine Bewertung!', 'success');
    } catch {
      showToast('Konnte nicht senden', 'error');
    }
    closeSUS();
  });
}

export function closeSUS() {
  const overlay = document.getElementById('fraime-sus-overlay');
  if (trapHandler) { document.removeEventListener('keydown', trapHandler); trapHandler = null; }
  if (!overlay) { mounted = false; return; }
  overlay.style.opacity = '0';
  overlay.style.transition = 'opacity 200ms ease';
  setTimeout(() => {
    overlay.remove();
    mounted = false;
    try { prevFocus?.focus?.(); } catch { /* ignore */ }
    prevFocus = null;
  }, 200);
}

/**
 * Auto-prompt: after at least 5 sessions, if SUS not yet done, and last
 * prompt > 14 days ago. Triggered ~3 minutes into a session so it doesn't
 * disturb the immediate task.
 */
export function maybePromptSUS() {
  try {
    const stats = getStats();
    if (stats.susDone) return;
    if (stats.sessionsCount < 5) return;
    const lastPrompt = parseInt(localStorage.getItem('fraime_sus_prompted_at') || '0', 10);
    if (lastPrompt && Date.now() - lastPrompt < 14 * 24 * 3600 * 1000) return;
    setTimeout(() => {
      if (document.visibilityState !== 'visible') return;
      localStorage.setItem('fraime_sus_prompted_at', String(Date.now()));
      openSUS();
    }, 3 * 60 * 1000);
  } catch { /* ignore */ }
}