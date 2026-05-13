import { getDatabase, ref, onValue } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js';
import { app } from './firebase.js';
import { state } from './state.js';
import { FILES } from './data.js';

const db = getDatabase(app);

let unsubscribers = [];
let pendingUpdates = {};
let initialLoadCount = 0;
let initialLoadDone = false;

// Echo-suppression: when WE save a file, we briefly mark it so the
// listener-callback that fires right after with our own data is ignored
// without doing an expensive deep equality check.
const ownWriteFlags = new Map(); // name -> timestamp

export function markOwnWrite(name) {
  ownWriteFlags.set(name, Date.now());
  // Auto-clear after 5s in case the listener never fires
  setTimeout(() => {
    if (Date.now() - (ownWriteFlags.get(name) || 0) >= 5000) {
      ownWriteFlags.delete(name);
    }
  }, 5000);
}

function isOwnEcho(name) {
  const ts = ownWriteFlags.get(name);
  if (!ts) return false;
  // Within 4s of our save → treat as our own echo
  if (Date.now() - ts < 4000) {
    ownWriteFlags.delete(name);
    return true;
  }
  ownWriteFlags.delete(name);
  return false;
}

export function startListeners() {
  initialLoadCount = 0;
  initialLoadDone = false;

  FILES.forEach(name => {
    const dbRef = ref(db, name);
    const unsub = onValue(dbRef, (snapshot) => {
      const data = snapshot.val();

      // Initial load — count all callbacks regardless of data content
      if (!initialLoadDone) {
        initialLoadCount++;
        if (initialLoadCount >= FILES.length) initialLoadDone = true;
        if (data !== null) state[name] = data;
        return;
      }

      if (data === null) return;

      // Echo-suppression for our own writes
      if (isOwnEcho(name)) return;

      // Edit mode: buffer conflicts, don't disrupt UI
      if (state.editMode) {
        if (state.dirty.has(name)) {
          pendingUpdates[name] = data;
          // Show conflict banner (replaces former toast warning)
          import('../components/conflict-banner.js').then(m => m.showConflictBanner());
        } else {
          state[name] = data;
        }
        return;
      }

      // Normal mode: apply and re-render
      state[name] = data;
      rerenderActiveView();
    });

    unsubscribers.push(unsub);
  });
}

export function stopListeners() {
  unsubscribers.forEach(fn => fn());
  unsubscribers = [];
  pendingUpdates = {};
  initialLoadDone = false;
  initialLoadCount = 0;
}

export function getPendingUpdates() {
  return { ...pendingUpdates };
}

export function clearPendingUpdates() {
  pendingUpdates = {};
}

export function applyPendingUpdates() {
  Object.entries(pendingUpdates).forEach(([name, data]) => {
    state[name] = data;
  });
  pendingUpdates = {};
}

async function rerenderActiveView() {
  const { navigate, getRoute } = await import('./router.js');
  navigate(getRoute(), true);
}
