import { state } from './state.js';

const DB_URL = 'https://fraime-3b3ed-default-rtdb.europe-west1.firebasedatabase.app';
const FILES = ['config','locations','schedule','contacts','team','equipment','budget','timeline','kanban'];

export function invalidateCache() {
  // No-op — Firebase is always fresh
}

export async function fetchAllData(forceRefresh = false) {
  const errors = [];
  const results = await Promise.all(FILES.map(async name => {
    try {
      const res = await fetch(`${DB_URL}/${name}.json`);
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

export async function saveData(name, data) {
  const res = await fetch(`${DB_URL}/${name}.json`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(`Save failed: HTTP ${res.status}`);
  return { ok: true };
}
