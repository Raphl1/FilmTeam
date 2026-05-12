import { onAuth, loginWithGoogle, loginWithEmail, loginWithPhone, logout, getCurrentUser } from './core/firebase.js';
import { fetchAllData } from './core/data.js';
import { state } from './core/state.js';
import { renderShell } from './components/shell.js';
import { renderHeaderControls } from './components/header.js';
import { navigate } from './core/router.js';
import './core/events.js';

function showLoginScreen() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;flex-direction:column;gap:20px;font-family:system-ui,sans-serif;padding:24px;text-align:center;background:#0a0f1e">
      <div style="font-size:3rem">🎬</div>
      <h1 style="font-size:1.5rem;font-weight:800;color:#e2e8f0;margin:0">FR<span style="color:#c77dff">(AI)</span>ME</h1>
      <p style="color:#8892a4;font-size:.85rem;max-width:300px;margin:0">Projektplanung für Night of the Graduates 2026</p>
      
      <div id="login-error" style="display:none;color:#f72585;font-size:.8rem;max-width:300px;padding:8px;border-radius:6px;border:1px solid rgba(247,37,133,.2);background:rgba(247,37,133,.05)"></div>
      
      <button id="google-login-btn" style="display:flex;align-items:center;gap:12px;padding:12px 24px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:#111827;color:#e2e8f0;font-size:.9rem;font-weight:600;cursor:pointer;width:280px;justify-content:center">
        <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
        Mit Google anmelden
      </button>

      <div style="width:280px;display:flex;align-items:center;gap:12px">
        <div style="flex:1;height:1px;background:rgba(255,255,255,.1)"></div>
        <span style="color:#8892a4;font-size:.75rem">oder</span>
        <div style="flex:1;height:1px;background:rgba(255,255,255,.1)"></div>
      </div>

      <div style="display:flex;flex-direction:column;gap:10px;width:280px">
        <input id="email-input" type="email" placeholder="E-Mail" style="padding:10px 14px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:#111827;color:#e2e8f0;font-size:.9rem;outline:none">
        <input id="password-input" type="password" placeholder="Passwort (min. 6 Zeichen)" style="padding:10px 14px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:#111827;color:#e2e8f0;font-size:.9rem;outline:none">
        <button id="email-login-btn" style="padding:10px 24px;border-radius:8px;border:none;background:#6c3fc5;color:white;font-size:.9rem;font-weight:600;cursor:pointer">Mit E-Mail anmelden</button>
      </div>

      <div style="width:280px;display:flex;align-items:center;gap:12px">
        <div style="flex:1;height:1px;background:rgba(255,255,255,.1)"></div>
        <span style="color:#8892a4;font-size:.75rem">oder</span>
        <div style="flex:1;height:1px;background:rgba(255,255,255,.1)"></div>
      </div>

      <div style="display:flex;flex-direction:column;gap:10px;width:280px">
        <input id="phone-input" type="tel" placeholder="+49 170 1234567" style="padding:10px 14px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:#111827;color:#e2e8f0;font-size:.9rem;outline:none">
        <button id="phone-login-btn" style="padding:10px 24px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:transparent;color:#e2e8f0;font-size:.9rem;font-weight:600;cursor:pointer">SMS-Code senden</button>
        <input id="sms-code-input" type="text" placeholder="SMS-Code eingeben" style="display:none;padding:10px 14px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:#111827;color:#e2e8f0;font-size:.9rem;outline:none">
        <button id="verify-code-btn" style="display:none;padding:10px 24px;border-radius:8px;border:none;background:#43aa8b;color:white;font-size:.9rem;font-weight:600;cursor:pointer">Code bestätigen</button>
      </div>

      <div id="recaptcha-container"></div>
      <p style="color:#8892a4;font-size:.7rem;max-width:280px;margin-top:8px">Bei E-Mail: Falls kein Konto existiert, wird automatisch eines erstellt.</p>
    </div>
  `;

  function showError(msg) {
    const el = document.getElementById('login-error');
    el.textContent = msg;
    el.style.display = 'block';
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
      document.getElementById('sms-code-input').style.display = 'block';
      document.getElementById('verify-code-btn').style.display = 'block';
      document.getElementById('phone-login-btn').textContent = 'Code gesendet ✓';
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
  app.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;gap:16px;color:#8892a4;font-family:system-ui,sans-serif"><div style="font-size:2rem">🎬</div><div>Lade FR(AI)ME...</div></div>`;

  if (!localStorage.getItem('theme')) {
    const preferLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    localStorage.setItem('theme', preferLight ? 'light' : 'dark');
  }

  try {
    await fetchAllData();
  } catch (err) {
    app.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;gap:16px;color:#f72585;font-family:system-ui,sans-serif;padding:24px;text-align:center"><div style="font-size:2rem">⚠️</div><div style="font-size:1.1rem;font-weight:700">Daten konnten nicht geladen werden</div><div style="color:#8892a4;font-size:.85rem;max-width:400px">${err.message}</div><button onclick="location.reload()" style="margin-top:16px;padding:8px 24px;border-radius:8px;border:1px solid #f72585;color:#f72585;background:transparent;cursor:pointer;font-size:.85rem">Neu laden</button></div>`;
    return;
  }

  state.loaded = true;
  state.user = user;
  window.location.hash = '';
  const route = 'hub';

  try {
    renderShell(route);
    renderHeaderControls();
    await navigate(route);
  } catch (err) {
    app.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;gap:16px;color:#f72585;font-family:system-ui,sans-serif;padding:24px;text-align:center"><div style="font-size:2rem">⚠️</div><div style="font-size:1.1rem;font-weight:700">Rendering-Fehler</div><div style="color:#8892a4;font-size:.85rem;max-width:400px">${err.message}</div><button onclick="location.reload()" style="margin-top:16px;padding:8px 24px;border-radius:8px;border:1px solid #f72585;color:#f72585;background:transparent;cursor:pointer;font-size:.85rem">Neu laden</button></div>`;
  }
}

onAuth((user) => {
  if (user) {
    startApp(user);
  } else {
    showLoginScreen();
  }
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
