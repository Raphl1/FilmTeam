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
| Datenbank | Firebase Realtime DB (REST API) |
| Auth | Firebase Auth (Google, Email, Phone) |
| Icons | Lucide (CDN v0.460.0) |
| Build | `npm run build:css` (Tailwind), `firebase deploy --only hosting:fraime` |
| PWA | manifest.json + sw.js (offline-fähig, installierbar) |

---

## Projekt-Struktur

```
website/
├── index.html              — Entry point
├── css/output.css          — Compiled Tailwind (committed)
├── src/input.css           — Tailwind source + @layer components
├── tailwind.config.js      — Custom theme (CSS vars, spacing, animations)
├── firebase.json           — Hosting config (public: ".")
├── .firebaserc             — Project: fraime-3b3ed
├── manifest.json           — PWA manifest
├── sw.js                   — Service Worker (cache-first CSS/JS, network-first JSON)
├── data/                   — JSON data (auch in Firebase DB gespiegelt)
│   ├── config.json         — Navigation, Stats, Projekt-Infos
│   ├── team.json           — 12 Members, 12 Casting, 14 Rollen, 6 Filmrollen
│   ├── kanban.json         — 18 Tasks, 5 Spalten
│   ├── locations.json      — 15 Drehorte mit Maps + YouTube-Referenzen
│   ├── schedule.json       — 5 Drehtage
│   ├── equipment.json      — 5 Kategorien, 25 Items
│   ├── budget.json         — 6 Posten
│   ├── timeline.json       — 22 Meilensteine
│   └── contacts.json       — 8 Kontakte, 9 Genehmigungen
└── js/
    ├── app.js              — Bootstrap, Auth-Gate, Login-Screen
    ├── core/
    │   ├── firebase.js     — Firebase Auth (Google/Email/Phone)
    │   ├── state.js        — Shared state + markDirty()
    │   ├── data.js         — fetchAllData() + saveData() via Firebase REST
    │   ├── router.js       — Hash-Router, lazy view loading, slide transitions
    │   ├── events.js       — Global event delegation (42+ actions), utils
    │   ├── github.js       — Save wrapper (uses Firebase now, not GitHub API)
    │   └── editmode.js     — Enter/Exit/Cancel edit mode
    ├── components/
    │   ├── shell.js        — App layout (sidebar, header, bottom-nav)
    │   ├── header.js       — Header buttons (edit, refresh, theme, logout)
    │   ├── nav.js          — updateNav() active state
    │   ├── search.js       — Global search (locations, tasks, team, contacts)
    │   ├── toast.js        — Toast notifications
    │   └── modal.js        — Token modal (legacy, still works)
    └── views/              — 11 lazy-loaded view modules
        ├── hub.js          — Countdown, warnings, progress, Schnellzugriff
        ├── my-tasks.js     — Aufgaben mit Checkbox + Kanban-Status-Sync
        ├── kanban.js       — Board mit DnD (Desktop + Touch)
        ├── locations.js    — Drehorte mit Maps + YouTube + Filter
        ├── schedule.js     — Drehplan mit Print-Button
        ├── team.js         — Rollen (nach Phase), Filmrollen, Filter, alle 24
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

---

## Befehle

```bash
# Lokale Entwicklung
cd website
npm run dev          # Tailwind watch mode
# Serve lokal: python3 -m http.server 8080

# Build für Production
npm run build:css    # Tailwind minified output

# Deploy
firebase deploy --only hosting:fraime

# Oder via npx (falls firebase CLI nicht global):
npx firebase-tools deploy --only hosting:fraime
```

---

## Datenfluss

1. User öffnet App → Firebase Auth prüft Login
2. Nicht eingeloggt → Login-Screen (Google/Email/Phone)
3. Eingeloggt → `fetchAllData()` holt alle 9 JSON-Nodes aus Firebase DB
4. `renderShell()` → `navigate('hub')` → View wird gerendert
5. Edit-Mode → Inline-Bearbeitung → `markDirty(file)` → Header zeigt Save-Button
6. Save → `saveData(name, data)` PUT an Firebase REST API → sofort gespeichert

---

## Offene Punkte

- [ ] **Firebase DB Rules** auf `"auth != null"` setzen (aktuell read/write: true)
- [ ] **5 "Nach Dreh" Rollen** unbesetzt (Grobschnitt, Feinschnitt, Animation, Musik, BOTB)
- [ ] **7 Kanban-Tasks** ohne Owner/Assignee
- [ ] **12 Locations** noch nicht bestätigt (pending)
- [ ] **9 Genehmigungen** offen
- [ ] **Drehtage 2-5** Termine festlegen
- [ ] **Piano-Raum (#14)** Location noch offen

---

## Key Decisions

- **Stummfilm** → kein Ton-Equipment, keine Ton-Rolle, kein Sound-Design in Timeline
- **Firebase statt GitHub API** → instant save, kein Token nötig, Echtzeit
- **Tailwind CSS** → utility-first, CSS vars für Dark/Light Theme auto-switch
- **Keine Frameworks** → vanilla JS, ES modules, kein React/Vue/Svelte
- **PWA** → offline-fähig, installierbar auf Handy
- **Alle 24 Kurs-Mitglieder** bei "Mitwirkende" aufgelistet (12 Filmteam + 12 Casting)

---

## Team-Übersicht

**Filmteam (12):** Dilara, Jetmir, Lia, Runa, Raphael, Luca, Miriam, Quyen, Benicio, Nico, Yudong, Tobi

**Casting (12):** Cosima, Salome, Emily, Maxim, Alexa, Niko, Alesia, Pauline, Esther, Elisa, Charlotte, Lea

**Filmrollen:** Regie (Dilara), Kai/KI (Jetmir/Quyen), Till/Techniker (Cosima/Jetmir), Ben/BWLer (Niko/Jetmir), Kate/Kreative (Cosima/Runa/Lea), Blaue/Date (Cosima/Lea)

---

## Externe Links in der App

- Google Drive: https://drive.google.com/drive/folders/1s1rMK-EZMx79g7yWUCoXA_Otdb4crZLi
- Figma Board: https://www.figma.com/board/TNmHCPlbfxyyKoEUt2qCqw/Night-Of-The-Graduates
- Google Calendar: embedded via iframe (calendarUrl in config.json)
