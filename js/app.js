import { onAuth, loginWithGoogle, loginWithEmail, loginWithPhone, logout } from './core/firebase.js';
import { fetchAllData } from './core/data.js';
import { state } from './core/state.js';
import { renderShell } from './components/shell.js';
import { renderHeaderControls } from './components/header.js';
import { navigate, getRoute } from './core/router.js';
import { startListeners, stopListeners } from './core/realtime.js';
import { initPullToRefresh } from './components/pull-refresh.js';
import { initAnalytics, trackView, trackError } from './core/analytics.js';
import { maybePromptFeedback } from './components/feedback.js';
import { maybePromptSUS } from './components/sus.js';
import './core/events.js';

function showLoginScreen() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="login-screen min-h-screen flex items-center justify-center p-lg font-sans animate-fadeIn" style="background:linear-gradient(135deg,#0a0f1e 0%,#1a1040 40%,#0f1a3a 100%)">
      <div class="login-card w-full max-w-[360px] flex flex-col items-center gap-lg p-xl rounded-[18px] border border-border2" style="background:rgba(17,24,39,.65);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);box-shadow:0 8px 40px rgba(0,0,0,.4),0 0 80px rgba(108,63,197,.06)">
        
        <div class="flex flex-col items-center gap-sm">
          <div class="text-[3.5rem] login-logo-glow">🎬</div>
          <h1 class="text-2xl font-extrabold tracking-tight text-txt m-0">FR<span class="text-lilac">(AI)</span>ME</h1>
          <p class="text-muted text-sm m-0 text-center max-w-[280px]">Projektplanung für Night of the Graduates 2026</p>
        </div>

        <div id="login-error" class="login-error hidden w-full text-xs text-accent text-center px-md py-sm rounded-sm border border-accent/20" style="background:rgba(247,37,133,.05)"></div>

        <button id="google-login-btn" class="login-btn-google flex items-center gap-md px-lg py-md rounded-sm border border-border2 bg-card text-txt text-sm font-semibold cursor-pointer w-full justify-center transition-all duration-base hover:border-violet/40 hover:bg-card2 hover:shadow-md active:scale-[.97]">
          <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Mit Google anmelden
        </button>

        <div class="w-full flex items-center gap-md">
          <div class="flex-1 h-px" style="background:linear-gradient(90deg,transparent,var(--c-border2),transparent)"></div>
          <span class="text-muted text-xs font-medium">oder</span>
          <div class="flex-1 h-px" style="background:linear-gradient(90deg,transparent,var(--c-border2),transparent)"></div>
        </div>

        <div class="flex flex-col gap-sm w-full">
          <input id="email-input" type="email" autocomplete="email" placeholder="E-Mail" aria-label="E-Mail-Adresse" class="login-input w-full px-md py-[11px] rounded-sm border border-border2 bg-card text-txt text-sm outline-none transition-all duration-base focus:border-violet/60 focus:shadow-focus">
          <input id="password-input" type="password" autocomplete="current-password" placeholder="Passwort (min. 6 Zeichen)" aria-label="Passwort, mindestens 6 Zeichen" class="login-input w-full px-md py-[11px] rounded-sm border border-border2 bg-card text-txt text-sm outline-none transition-all duration-base focus:border-violet/60 focus:shadow-focus">
          <button id="email-login-btn" class="w-full px-lg py-[11px] rounded-sm border-none bg-purple text-white text-sm font-semibold cursor-pointer transition-all duration-base hover:brightness-110 hover:shadow-md active:scale-[.97]">Mit E-Mail anmelden</button>
        </div>

        <div class="w-full flex items-center gap-md">
          <div class="flex-1 h-px" style="background:linear-gradient(90deg,transparent,var(--c-border2),transparent)"></div>
          <span class="text-muted text-xs font-medium">oder</span>
          <div class="flex-1 h-px" style="background:linear-gradient(90deg,transparent,var(--c-border2),transparent)"></div>
        </div>

        <div class="flex flex-col gap-sm w-full">
          <input id="phone-input" type="tel" autocomplete="tel" placeholder="+49 170 1234567" aria-label="Telefonnummer im internationalen Format" class="login-input w-full px-md py-[11px] rounded-sm border border-border2 bg-card text-txt text-sm outline-none transition-all duration-base focus:border-violet/60 focus:shadow-focus">
          <button id="phone-login-btn" class="w-full px-lg py-[11px] rounded-sm border border-border2 bg-transparent text-txt text-sm font-semibold cursor-pointer transition-all duration-base hover:border-violet/40 hover:bg-card2 active:scale-[.97]">SMS-Code senden</button>
          <input id="sms-code-input" type="text" inputmode="numeric" autocomplete="one-time-code" placeholder="SMS-Code eingeben" aria-label="SMS-Bestätigungscode" class="login-input hidden w-full px-md py-[11px] rounded-sm border border-border2 bg-card text-txt text-sm outline-none transition-all duration-base focus:border-violet/60 focus:shadow-focus">
          <button id="verify-code-btn" class="hidden w-full px-lg py-[11px] rounded-sm border-none bg-green text-white text-sm font-semibold cursor-pointer transition-all duration-base hover:brightness-110 hover:shadow-md active:scale-[.97]">Code bestätigen</button>
        </div>

        <div id="recaptcha-container"></div>
        <p class="text-muted text-xs text-center max-w-[280px] m-0">Bei E-Mail: Falls kein Konto existiert, wird automatisch eines erstellt.</p>
      </div>
    </div>
  `;

  function showError(msg) {
    const el = document.getElementById('login-error');
    el.textContent = msg;
    el.classList.remove('hidden');
    el.classList.add('animate-shake');
    setTimeout(() => el.classList.remove('animate-shake'), 350);
  }

  // Google
  document.getElementById('google-login-btn')?.addEventListener('click', async () => {
    try {
      await loginWithGoogle();
    } catch (e) {
      showError(e.message || 'Google Login fehlgeschlagen');
    }
  });

  // Email
  document.getElementById('email-login-btn')?.addEventListener('click', async () => {
    const email = document.getElementById('email-input').value.trim();
    const password = document.getElementById('password-input').value;
    if (!email || !password) { showError('E-Mail und Passwort eingeben'); return; }
    if (password.length < 6) { showError('Passwort muss mindestens 6 Zeichen haben'); return; }
    try {
      await loginWithEmail(email, password);
    } catch (e) {
      showError(e.message || 'E-Mail Login fehlgeschlagen');
    }
  });

  // Phone
  let confirmationResult = null;
  document.getElementById('phone-login-btn')?.addEventListener('click', async () => {
    const phone = document.getElementById('phone-input').value.trim();
    if (!phone) { showError('Telefonnummer eingeben'); return; }
    try {
      confirmationResult = await loginWithPhone(phone, 'recaptcha-container');
      document.getElementById('sms-code-input').classList.remove('hidden');
      document.getElementById('verify-code-btn').classList.remove('hidden');
      document.getElementById('phone-login-btn').textContent = 'Code gesendet \u2713';
      document.getElementById('phone-login-btn').style.opacity = '0.5';
    } catch (e) {
      showError(e.message || 'SMS senden fehlgeschlagen');
    }
  });

  document.getElementById('verify-code-btn')?.addEventListener('click', async () => {
    const code = document.getElementById('sms-code-input').value.trim();
    if (!code || !confirmationResult) { showError('Code eingeben'); return; }
    try {
      await confirmationResult.confirm(code);
    } catch (e) {
      showError('Falscher Code');
    }
  });

  // Enter key for email
  document.getElementById('password-input')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') document.getElementById('email-login-btn').click();
  });
}

async function startApp(user) {
  const app = document.getElementById('app');
  app.innerHTML = `<div class="flex items-center justify-center h-screen flex-col gap-md text-muted font-sans animate-fadeIn"><div class="text-2xl login-logo-glow">🎬</div><div class="text-sm font-medium">Lade FR(AI)ME...</div><div class="loading-spinner mt-md"></div></div>`;

  if (!localStorage.getItem('theme')) {
    const preferLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    localStorage.setItem('theme', preferLight ? 'light' : 'dark');
  }

  try {
    await fetchAllData();
  } catch (err) {
    app.innerHTML = `<div class="flex items-center justify-center h-screen flex-col gap-md text-accent font-sans p-lg text-center animate-fadeIn"><div class="text-2xl">⚠️</div><div class="text-md font-bold">Daten konnten nicht geladen werden</div><div class="text-muted text-sm max-w-[400px]">${err.message}</div><button onclick="location.reload()" class="mt-md px-lg py-sm rounded-sm border border-accent text-accent bg-transparent cursor-pointer text-sm hover:bg-accent/10 transition-all duration-base">Neu laden</button></div>`;
    return;
  }

  // One-time migration: localStorage permit_status → state.contacts.permits[].status (Firebase)
  // Runs only if migration flag is missing AND we have unsaved local statuses.
  try {
    if (!localStorage.getItem('fraime_permit_migrated_v1') && state.contacts?.permits) {
      const local = JSON.parse(localStorage.getItem('permit_status') || '{}');
      let touched = false;
      Object.keys(local).forEach(k => {
        const m = k.match(/^permit_(\d+)$/);
        if (!m) return;
        const idx = parseInt(m[1], 10);
        if (state.contacts.permits[idx] && local[k]) {
          state.contacts.permits[idx].status = local[k];
          touched = true;
        }
      });
      if (touched) {
        const { saveData } = await import('./core/data.js');
        await saveData('contacts', state.contacts);
      }
      localStorage.setItem('fraime_permit_migrated_v1', '1');
    }
  } catch { /* ignore migration failures */ }

  startListeners();

  state.loaded = true;
  state.user = user;
  const route = getRoute() || 'hub';

  try {
    renderShell(route);
    renderHeaderControls();
    await navigate(route);
    initPullToRefresh(async () => {
      await fetchAllData();
      await navigate(getRoute(), true);
    });

    // Phase 4: Analytics + Evaluation prompts (post-render so they don't block UI)
    initAnalytics();
    trackView(route);
    maybePromptFeedback();
    maybePromptSUS();

    // Auto-refresh the Hub when the day changes (e.g. shoot phase transition).
    // Cheap: just compares ISO date once per minute and re-renders only if needed.
    const { todayISO } = await import('./core/derive.js');
    let lastDay = todayISO();
    setInterval(() => {
      const now = todayISO();
      if (now !== lastDay) {
        lastDay = now;
        if (getRoute() === 'hub') navigate('hub', true);
      }
    }, 60_000);
  } catch (err) {
    trackError(err, 'startApp.render');
    app.innerHTML = `<div class="flex items-center justify-center h-screen flex-col gap-md text-accent font-sans p-lg text-center animate-fadeIn"><div class="text-2xl">⚠️</div><div class="text-md font-bold">Rendering-Fehler</div><div class="text-muted text-sm max-w-[400px]">${err.message}</div><button onclick="location.reload()" class="mt-md px-lg py-sm rounded-sm border border-accent text-accent bg-transparent cursor-pointer text-sm hover:bg-accent/10 transition-all duration-base">Neu laden</button></div>`;
  }
}

onAuth((user) => {
  if (user) {
    startApp(user);
  } else {
    stopListeners();
    showLoginScreen();
  }
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
