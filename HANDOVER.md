# FR(AI)ME — Projekt Handover

## Überblick

**App:** https://fraime.web.app
**Repo:** https://github.com/Raphl1/FilmTeam (Branch: main)
**Firebase Console:** https://console.firebase.google.com/project/fraime-3b3ed
**Typ:** Stummfilm für Night of the Graduates, DHBW Mannheim MPG24
**Premiere:** 20. November 2026
**Erster Drehtag:** 17. Juni 2026 (fix), Tage 2-5 TBD
**Projektleitung:** Dilara

---

## Tech-Stack

| Was | Technologie |
|-----|------------|
| Frontend | Vanilla ES Modules, Tailwind CSS (CLI Build) |
| Hosting | Firebase Hosting (fraime.web.app) |
| Datenbank | Firebase Realtime DB (SDK v10.12.0 + REST für Initial Load) |
| Auth | Firebase Auth (Google, Email, Phone) |
| Realtime | Firebase Realtime DB SDK `onValue()` Listener |
| Icons | Lucide (CDN v0.460.0) |
| Build | `npm run build:css` (Tailwind), `firebase deploy` |
| PWA | manifest.json + sw.js (offline-fähig, installierbar) |

---

## Projekt-Struktur

```
website/
├── index.html              — Entry point
├── css/output.css          — Compiled Tailwind (committed)
├── src/input.css           — Tailwind source + @layer components
├── tailwind.config.js      — Custom theme (CSS vars, spacing, animations)
├── firebase.json           — Hosting + Database Rules config
├── database.rules.json     — Firebase DB Rules (auth != null)
├── .firebaserc             — Project: fraime-3b3ed
├── manifest.json           — PWA manifest
├── sw.js                   — Service Worker (cache-first CSS/JS, network-first JSON)
├── data/                   — JSON seed data (master lives in Firebase DB)
│   ├── config.json         — Navigation, Stats, Projekt-Infos
│   ├── team.json           — 12 Members, 12 Casting, 14 Rollen, 6 Filmrollen
│   ├── kanban.json         — Tasks, 5 Spalten
│   ├── locations.json      — 15 Drehorte mit Maps + YouTube-Referenzen
│   ├── schedule.json       — 5 Drehtage
│   ├── equipment.json      — 5 Kategorien, 25 Items
│   ├── budget.json         — 6 Posten
│   ├── timeline.json       — 22 Meilensteine
│   └── contacts.json       — 8 Kontakte, 9 Genehmigungen
└── js/
    ├── app.js              — Bootstrap, Auth-Gate, Login-Screen, Lifecycle
    ├── core/
    │   ├── firebase.js     — Firebase Auth + App-Init, exportiert app/auth
    │   ├── state.js        — Shared state object + markDirty()
    │   ├── data.js         — fetchAllData() (REST+Auth), saveData() (SDK set)
    │   ├── realtime.js     — onValue() Listener, Konflikt-Buffer, Rerender
    │   ├── router.js       — Hash-Router, lazy view loading, slide transitions
    │   ├── events.js       — Global event delegation, shared utils (emptyState, etc.)
    │   ├── github.js       — saveAllDirty() mit Konflikt-Erkennung
    │   └── editmode.js     — Enter/Exit/Cancel edit mode + Pending Updates
    ├── components/
    │   ├── shell.js        — App layout (sidebar, header, bottom-nav)
    │   ├── header.js       — Header buttons (edit, save, refresh, theme, logout)
    │   ├── nav.js          — updateNav() active state
    │   ├── search.js       — Global search (locations, tasks, team, contacts)
    │   └── toast.js        — Toast notifications (variable Dauer per type)
    └── views/              — 11 lazy-loaded view modules
        ├── hub.js          — Countdown (aus Config), Deadline-Warnungen (sortiert)
        ├── my-tasks.js     — Aufgaben, Checkbox synct Kanban-Status
        ├── kanban.js       — Board mit DnD (Desktop + Touch) + Toast-Feedback
        ├── locations.js    — Drehorte mit Maps, Filter + Counts
        ├── schedule.js     — Drehplan mit Print-Button + Null-Safety
        ├── team.js         — Rollen (nach Phase), Filmrollen, Filter
        ├── equipment.js    — Checkliste mit Fortschritt
        ├── budget.js       — Beglichen-Checkbox, offener Betrag
        ├── timeline.js     — Phasen mit Fortschrittsbalken
        ├── contacts.js     — Kontakte + Genehmigungen
        └── calendar.js     — Google Calendar Embed
```

---

## Firebase Config

```js
const firebaseConfig = {
  apiKey: "AIzaSyBrr1BynxNFHz6D3_kTd_18fWyOTiR19ns",
  authDomain: "fraime-3b3ed.firebaseapp.com",
  databaseURL: "https://fraime-3b3ed-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "fraime-3b3ed",
  storageBucket: "fraime-3b3ed.firebasestorage.app",
  messagingSenderId: "93215692033",
  appId: "1:93215692033:web:e851785f310ab7f294b700"
};
```

**Autorisierte Domains:** localhost, fraime-3b3ed.firebaseapp.com, fraime-3b3ed.web.app, fraime.web.app

**Database Rules:** `"auth != null"` — nur authentifizierte User können lesen/schreiben.

---

## Befehle

```bash
# Lokale Entwicklung
cd website
npm run dev          # Tailwind watch mode
# Serve lokal: python3 -m http.server 8080

# Build für Production
npm run build:css    # Tailwind minified output

# Deploy (beides)
firebase deploy

# Nur Hosting
firebase deploy --only hosting

# Nur DB Rules
firebase deploy --only database
```

---

## Datenfluss

```
User öffnet App
  → Firebase Auth prüft Login (onAuth Listener)
  → Nicht eingeloggt → Login-Screen (Google/Email/Phone)
  → Eingeloggt → startApp(user):
      1. fetchAllData() — REST mit Auth-Token, füllt state
      2. startListeners() — Firebase SDK onValue() auf alle 9 Pfade
      3. renderShell() → navigate(route)

Realtime-Sync:
  → Anderer User speichert → onValue() feuert
  → Nicht im Edit-Mode → state update + View re-render
  → Im Edit-Mode + gleiches File dirty → Buffer + Toast-Warnung
  → Im Edit-Mode + anderes File → stiller Update

Edit-Mode:
  → enterEditMode() → contenteditable Felder aktiv
  → Inline-Bearbeitung → markDirty(file) → Header zeigt Badge
  → saveAllDirty() → Konflikt-Check → SDK set() → Toast "Gespeichert"
  → cancelEditMode() → fetchAllData() + clearPendingUpdates()

Logout:
  → stopListeners() → Login-Screen
```

---

## Architektur-Entscheidungen

| Entscheidung | Begründung |
|---|---|
| **Firebase Realtime DB (SDK + REST)** | SDK für Live-Listener + Save, REST für Initial-Load (parallel, schneller) |
| **Auth-Token nur auf REST-Calls** | SDK handelt Auth automatisch intern |
| **Kein Framework** | 24 User, einfache CRUD-App, kein Overhead nötig |
| **Tailwind CSS + CSS Variables** | Dark/Light Theme ohne Rebuild, utility-first |
| **Service Worker** | Offline-Lesbarkeit, aber RTDB-URLs explizit ausgeschlossen |
| **Hash-Router** | SPA ohne Server-Config, Deep-Links bleiben erhalten |
| **Conflict-Buffer in realtime.js** | Edit-Mode wird nicht gestört, User entscheidet bei Konflikt |

---

## Security

- **DB Rules:** `auth != null` — deployed, aktiv
- **REST-Calls:** Auth-Token via `user.getIdToken()` als `?auth=TOKEN`
- **SDK-Calls:** Auth automatisch über Firebase SDK
- **Service Worker:** Firebase RTDB URLs werden NICHT gecacht (Token in URL)
- **XSS:** `escapeHtml()` auf allen User-Inputs, iframes mit `sandbox`
- **URL-Validation:** `isSafeUrl()` / `isSafeMapUrl()` für iframe-Embeds

---

## Offene Punkte

- [ ] **5 "Nach Dreh" Rollen** unbesetzt (Grobschnitt, Feinschnitt, Animation, Musik, BOTB)
- [ ] **7 Kanban-Tasks** ohne Owner/Assignee
- [ ] **12 Locations** noch nicht bestätigt (pending)
- [ ] **9 Genehmigungen** offen
- [ ] **Drehtage 2-5** Termine festlegen
- [ ] **Piano-Raum (#14)** Location noch offen

---

## Key Decisions

- **Stummfilm** → kein Ton-Equipment, keine Ton-Rolle, kein Sound-Design in Timeline
- **Firebase statt GitHub API** → instant save, kein Token nötig, Echtzeit-Sync
- **Tailwind CSS** → utility-first, CSS vars für Dark/Light Theme auto-switch
- **Keine Frameworks** → vanilla JS, ES modules, kein React/Vue/Svelte
- **PWA** → offline-fähig, installierbar auf Handy
- **Alle 24 Kurs-Mitglieder** bei "Mitwirkende" (12 Filmteam + 12 Casting)
- **Checkbox synct Kanban** → My-Tasks Abhaken setzt Task auf "done"

---

## Team-Übersicht

**Filmteam (12):** Dilara, Jetmir, Lia, Runa, Raphael, Luca, Miriam, Quyen, Benicio, Nico, Yudong, Tobi

**Casting (12):** Cosima, Salome, Emily, Maxim, Alexa, Niko, Alesia, Pauline, Esther, Elisa, Charlotte, Lea

**Filmrollen:** Regie (Dilara), Kai/KI (Jetmir/Quyen), Till/Techniker (Cosima/Jetmir), Ben/BWLer (Niko/Jetmir), Kate/Kreative (Cosima/Runa/Lea), Blaue/Date (Cosima/Lea)

---

## Externe Links

- **App:** https://fraime.web.app
- **Google Drive:** https://drive.google.com/drive/folders/1s1rMK-EZMx79g7yWUCoXA_Otdb4crZLi
- **Figma Board:** https://www.figma.com/board/TNmHCPlbfxyyKoEUt2qCqw/Night-Of-The-Graduates
- **Google Calendar:** embedded via iframe (calendarUrl in config.json)
- **Firebase Console:** https://console.firebase.google.com/project/fraime-3b3ed

---

## Changelog (Mai 2026)

### Phase 4 — Evaluation Layer (Option C Komplettpaket)
- **`js/core/analytics.js`** — HEART-Framework Tracking direkt in Firebase RTDB (`/analytics/{events,errors,feedback,sus,sessions}/{uid}`)
  - DSGVO-clean, keine Drittanbieter, batched writes, queue-on-fail
  - Globale Error-Handler (`window.error` + `unhandledrejection`)
  - Performance-KPIs: TTFB, DOMContentLoaded, LCP, FCP via PerformanceObserver
  - A/B-Test API: `getFlag(name, fallback)` mit Sticky-Bucket je User
- **`js/components/feedback.js`** — 3-Klick Smiley-Feedback Modal, Auto-Prompt nach 3 Sessions + 7d Cooldown
- **`js/components/sus.js`** — System Usability Scale 10-Fragen-Survey (DE-Übersetzung Brooke 1996), Auto-Prompt nach 5 Sessions
- **Hub** zeigt jetzt einen Feedback-Button im External-Links-Bereich (`data-action="open-feedback"`)

### Hub-Redesign (Drehtag-Mobile-First)
- **`js/core/derive.js`** — Single-Source-of-Truth: `SHOOT_DAYS` werden jetzt aus `state.schedule` abgeleitet, nicht mehr hardcoded im Hub
- Helpers `getShootContext()`, `getMyOpenTasks()`, `getUrgentTasks()`, `getProgressKPIs()` zentralisieren die Hub-Logik
- Hub zeigt **Live-Badge** (LIVE/Start in 47 min/Wrap) basierend auf `parseShootTime()` der Drehtag-Zeit
- **Tap-to-Navigate**: Heutige Locations öffnen Apple Maps (iOS/macOS Safari) oder Google Maps (alle anderen)
- Phase „shooting-break" für Tage zwischen Drehtagen mit Hinweis auf den nächsten Drehtag

### Save-FAB & Konflikt-UX
- **`js/components/save-fab.js`** — Floating Action Button bottom-right im Edit-Mode mit Pulse-Animation und Dirty-Count-Badge
- **`js/components/conflict-banner.js`** — Sticky-Banner statt Toast bei externen Änderungen während Edit-Mode; klare Optionen „Lokal behalten" vs. „Externe übernehmen"
- **Realtime „own-write"-Flag** (`markOwnWrite` in `realtime.js`, aufgerufen von `data.js#directSave`): Echo-Suppression ohne `JSON.stringify`-Vergleich

### Service-Worker Auto-Versionierung
- **`scripts/inject-build-hash.js`** ersetzt `__BUILD_HASH__` in `sw.js` mit der aktuellen Git-Short-Hash
- `npm run build:css` ruft das Script automatisch via `prebuild:css` auf
- Cache-Name = `frame-{git-hash}` → bei jedem Deploy automatisch invalidiert

### A11y-Polish
- Login-Inputs: `aria-label`, `autocomplete` (email, current-password, tel, one-time-code)
- Navigation: `aria-current="page"` auf aktivem Sidebar/Bottom-Nav-Item
- Feedback/SUS-Modale: `role="radiogroup"` + `role="radio"` auf Optionen

### Security + Realtime
- Firebase DB Rules auf `auth != null` gesetzt
- Auth-Token an alle REST-Calls angehängt
- Firebase Realtime DB SDK Listener für Live-Sync (alle 9 Pfade)
- Konflikt-Erkennung im Edit-Mode (Toast-Warnung + Confirm vor Überschreiben)
- Listener-Cleanup bei Logout (kein Memory-Leak)

### Code-Optimierung
- Token-Modal-System komplett entfernt (dead code)
- `invalidateCache()` No-Op entfernt
- Partial-Save: nur erfolgreiche Files aus dirty-Set entfernt
- Deep-Links erhalten (Hash nicht mehr bei Login resetzt)
- Service Worker cacht keine Firebase RTDB URLs mehr

### UX-Verbesserungen
- Toast-Dauer variabel (Error 5s, Warning 4s, Success 3s)
- Kanban Drag-and-Drop zeigt Toast-Feedback
- Touch-DnD mit Error-Handling bei ungültigem Drop
- Hub-Countdown aus Config statt hardcoded Datum
- Deadline-Warnungen nach Dringlichkeit sortiert
- Location-Filter zeigen Counts (z.B. "Indoor (5)")
- Checkbox in My-Tasks synct Kanban-Status auf "done"
- Dirty-Badge am Save-Button zeigt Anzahl ungespeicherter Dateien
- Schedule: Null-Check für state.locations + Calendar-Fallback-Text
- Sidebar-Collapse sofort beim Laden (kein Flicker)
- `emptyState()` Utility für konsistente leere Zustände

### UI-Verbesserungen
- ARIA-Labels auf allen Icon-Buttons (Accessibility)
- Checkbox Touch-Target vergrößert (24px → 32px) + role="checkbox"
- Light-Mode Gold-Kontrast verbessert (#f59e0b → #ca8a04, WCAG AA)
- Focus-Ring verstärkt (doppelter Ring, kein Duplikat mehr)
- Kanban 2-spaltig ab 480px (statt 1-spaltig)
- Sticky Kanban-Spaltenheader beim Scrollen
- `transition: all` durch spezifische Properties ersetzt (Performance)
- Print-Stylesheet: nur UI-Buttons versteckt, nicht Content
- md-Breakpoint auf Standard 768px korrigiert
- Toast-Warning CSS-Stil hinzugefügt
- Purple als Alias für Violet (konsistentes Theming)
