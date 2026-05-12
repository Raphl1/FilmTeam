import { state } from './state.js';

const TTL = 5 * 60 * 1000;
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
  const results = await Promise.all(FILES.map(async name => {
    if (!forceRefresh) {
      const cached = readCache(name);
      if (cached) return { name, data: cached };
    }
    const data = await fetch(`data/${name}.json`).then(r => r.json());
    writeCache(name, data);
    return { name, data };
  }));
  results.forEach(({ name, data }) => { state[name] = data; });
}
