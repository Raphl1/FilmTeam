import { state } from './state.js';

const TTL = 60 * 1000; // 1 minute cache
const FILES = ['config','locations','schedule','contacts','team','equipment','budget','timeline','kanban'];

function readCache(name) {
  try {
    const ts = parseInt(localStorage.getItem(`fraime_ts_${name}`) || '0', 10);
    if (Date.now() - ts > TTL) return null;
    const raw = localStorage.getItem(`fraime_data_${name}`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function writeCache(name, data) {
  try {
    localStorage.setItem(`fraime_data_${name}`, JSON.stringify(data));
    localStorage.setItem(`fraime_ts_${name}`, String(Date.now()));
  } catch {}
}

export function invalidateCache() {
  FILES.forEach(n => {
    localStorage.removeItem(`fraime_data_${n}`);
    localStorage.removeItem(`fraime_ts_${n}`);
  });
}

export async function fetchAllData(forceRefresh = false) {
  const errors = [];
  const results = await Promise.all(FILES.map(async name => {
    if (!forceRefresh) {
      const cached = readCache(name);
      if (cached) return { name, data: cached };
    }
    try {
      const res = await fetch(`data/${name}.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      writeCache(name, data);
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
