import { state } from './state.js';
import { auth, app } from './firebase.js';
import { getDatabase, ref, set } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js';
import { isOffline, queueWrite, initOfflineQueue } from './offline-queue.js';

const DB_URL = 'https://fraime-3b3ed-default-rtdb.europe-west1.firebasedatabase.app';
export const FILES = ['config','locations','schedule','contacts','team','equipment','budget','timeline','kanban'];

const db = getDatabase(app);

async function getAuthToken() {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  return user.getIdToken();
}

export async function fetchAllData() {
  const token = await getAuthToken();
  const errors = [];
  const results = await Promise.all(FILES.map(async name => {
    try {
      const res = await fetch(`${DB_URL}/${name}.json?auth=${token}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return { name, data };
    } catch (err) {
      errors.push(`${name}: ${err.message}`);
      return { name, data: null };
    }
  }));
  results.forEach(({ name, data }) => { if (data) state[name] = data; });
  if (errors.length > 0 && !state.config) {
    throw new Error('Daten nicht erreichbar: ' + errors.join(', '));
  }
}

async function directSave(name, data) {
  await set(ref(db, name), data);
  return { ok: true };
}

export async function saveData(name, data) {
  if (isOffline()) {
    await queueWrite(name, data);
    return { ok: true, queued: true };
  }
  return directSave(name, data);
}

// Initialize offline queue with the direct save function
initOfflineQueue(directSave);
