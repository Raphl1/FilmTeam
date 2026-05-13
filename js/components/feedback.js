/**
 * In-App Feedback Widget — 3-click smiley rating + optional text.
 *
 * Auto-shown after the user has been active for at least 2 minutes in their
 * Nth session (N configurable), and not more often than once every 7 days.
 * Manually openable via openFeedback().
 */

import { submitFeedback, trackEvent } from '../core/analytics.js';
import { showToast } from './toast.js';

const STORAGE_KEY = 'fraime_feedback_at';
const COOLDOWN_DAYS = 7;

function html() {
  return `
    <div class="fixed inset-0 z-[400] flex items-end md:items-center justify-center p-md bg-black/50 backdrop-blur-md animate-fadeIn" id="fraime-feedback-overlay">
      <div class="w-full max-w-[400px] bg-card border border-border rounded-[18px] p-lg flex flex-col gap-md shadow-lg animate-slideUp">
        <div class="flex items-start justify-between gap-md">
          <div>
            <h3 class="text-base font-extrabold text-txt m-0">Wie läuft's?</h3>
            <p class="text-xs text-muted mt-xs">Kurzes Feedback hilft uns, FR(AI)ME besser zu machen.</p>
          </div>
          <button class="w-7 h-7 rounded-sm flex items-center justify-center text-muted hover:text-accent hover:bg-accent/10 cursor-pointer bg-transparent border-none" data-fb-action="close" aria-label="Schließen">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <div class="flex items-center justify-around py-sm" id="fraime-feedback-rating" role="radiogroup" aria-label="Stimmungs-Bewertung">
          <button class="text-3xl px-md py-sm rounded-sm hover:bg-accent/10 transition-all cursor-pointer bg-transparent border-2 border-transparent hover:border-accent/30" data-fb-rating="1" role="radio" aria-checked="false" aria-label="Schlecht">😞</button>
          <button class="text-3xl px-md py-sm rounded-sm hover:bg-gold/10 transition-all cursor-pointer bg-transparent border-2 border-transparent hover:border-gold/30" data-fb-rating="2" role="radio" aria-checked="false" aria-label="Geht so">😐</button>
          <button class="text-3xl px-md py-sm rounded-sm hover:bg-green/10 transition-all cursor-pointer bg-transparent border-2 border-transparent hover:border-green/30" data-fb-rating="3" role="radio" aria-checked="false" aria-label="Super">😀</button>
        </div>

        <textarea id="fraime-feedback-text" placeholder="Optional: Was läuft gut/schlecht?" class="w-full px-md py-sm rounded-sm border border-border2 bg-bg text-txt text-sm outline-none transition-all duration-base focus:border-violet/60 focus:shadow-focus min-h-[80px] resize-none" maxlength="1000"></textarea>

        <div class="flex justify-between items-center">
          <span class="text-[10px] text-muted">Anonym, nur für interne Auswertung</span>
          <button class="px-md py-sm rounded-sm border-none bg-purple text-white text-sm font-semibold cursor-pointer hover:brightness-110 active:scale-[.97] disabled:opacity-50 disabled:cursor-not-allowed" data-fb-action="submit" disabled>Senden</button>
        </div>
      </div>
    </div>
  `;
}

let mounted = false;
let pickedRating = 0;
let prevFocus = null;
let trapHandler = null;

function focusables(root) {
  return Array.from(root.querySelectorAll(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )).filter(el => el.offsetParent !== null);
}

function trapFocus(overlay) {
  trapHandler = (e) => {
    if (e.key === 'Escape') { closeFeedback(); return; }
    if (e.key !== 'Tab') return;
    const focusable = focusables(overlay);
    if (focusable.length === 0) return;
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };
  document.addEventListener('keydown', trapHandler);
}

export function openFeedback() {
  if (mounted) return;
  mounted = true;
  pickedRating = 0;
  prevFocus = document.activeElement;

  const wrap = document.createElement('div');
  wrap.innerHTML = html().trim();
  const overlay = wrap.firstElementChild;
  document.body.appendChild(overlay);
  if (window.lucide) window.lucide.createIcons();

  trackEvent('feedback-prompt-shown');

  // Focus first interactive element + trap Tab
  setTimeout(() => focusables(overlay)[0]?.focus(), 50);
  trapFocus(overlay);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeFeedback();
  });

  overlay.querySelectorAll('[data-fb-rating]').forEach(btn => {
    btn.addEventListener('click', () => {
      pickedRating = parseInt(btn.dataset.fbRating, 10);
      overlay.querySelectorAll('[data-fb-rating]').forEach(b => {
        const active = b === btn;
        b.setAttribute('aria-checked', String(active));
        b.classList.toggle('border-violet/40', active);
        b.classList.toggle('bg-violet/10', active);
      });
      const submit = overlay.querySelector('[data-fb-action="submit"]');
      if (submit) submit.disabled = false;
    });
  });

  overlay.querySelector('[data-fb-action="close"]').addEventListener('click', closeFeedback);
  overlay.querySelector('[data-fb-action="submit"]').addEventListener('click', async () => {
    if (!pickedRating) return;
    const text = overlay.querySelector('#fraime-feedback-text').value.trim();
    try {
      await submitFeedback(pickedRating, text);
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
      showToast('Danke für dein Feedback!', 'success');
    } catch {
      showToast('Konnte nicht senden — versuch es später', 'error');
    }
    closeFeedback();
  });
}

export function closeFeedback() {
  const overlay = document.getElementById('fraime-feedback-overlay');
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
 * Decide whether to auto-prompt the user for feedback.
 * Heuristic: at least 3 sessions, last feedback > 7 days ago, app used > 2 min.
 */
export function maybePromptFeedback() {
  try {
    const sessions = parseInt(localStorage.getItem('fraime_session_count') || '0', 10);
    if (sessions < 3) return;
    const last = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
    if (last && Date.now() - last < COOLDOWN_DAYS * 24 * 3600 * 1000) return;
    // Wait until user has been active for ~2 minutes this session
    setTimeout(() => {
      if (document.visibilityState === 'visible') openFeedback();
    }, 120_000);
  } catch { /* ignore */ }
}