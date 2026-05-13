/**
 * Offline Write Queue
 * Queues Firebase writes in IndexedDB when offline, syncs on reconnect.
 */

const DB_NAME = 'fraime-offline';
const STORE_NAME = 'write-queue';
const DB_VERSION = 1;

let db = null;
let syncing = false;

function openDB() {
  return new Promise((resolve, reject) => {
    if (db) { resolve(db); return; }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const database = e.target.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = (e) => { db = e.target.result; resolve(db); };
    req.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Queue a write operation for later sync
 * @param {string} name - Data file name (e.g. 'kanban', 'locations')
 * @param {*} data - The data to write
 */
export async function queueWrite(name, data) {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.add({ name, data, timestamp: Date.now() });
    tx.oncomplete = () => { updateSyncBadge(); resolve(); };
    tx.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Get count of queued writes
 */
export async function getQueueCount() {
  const database = await openDB();
  return new Promise((resolve) => {
    const tx = database.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(0);
  });
}

/**
 * Process all queued writes
 * @param {function} saveFn - The save function (saveData from data.js)
 */
export async function syncQueue(saveFn) {
  if (syncing) return;
  syncing = true;

  try {
    const database = await openDB();
    const items = await new Promise((resolve) => {
      const tx = database.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve([]);
    });

    if (items.length === 0) { syncing = false; return; }

    // Process in order
    const errors = [];
    for (const item of items) {
      try {
        await saveFn(item.name, item.data);
        // Remove from queue on success
        await removeFromQueue(item.id);
      } catch (err) {
        errors.push(`${item.name}: ${err.message}`);
      }
    }

    if (errors.length > 0) {
      console.warn('[offline-queue] Some writes failed:', errors);
    }
  } finally {
    syncing = false;
    updateSyncBadge();
  }
}

async function removeFromQueue(id) {
  const database = await openDB();
  return new Promise((resolve) => {
    const tx = database.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

/**
 * Clear entire queue
 */
export async function clearQueue() {
  const database = await openDB();
  return new Promise((resolve) => {
    const tx = database.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.clear();
    tx.oncomplete = () => { updateSyncBadge(); resolve(); };
    tx.onerror = () => resolve();
  });
}

// ── Sync badge UI ────────────────────────────────────────────

function updateSyncBadge() {
  getQueueCount().then(count => {
    let badge = document.getElementById('offline-sync-badge');
    if (count === 0) {
      badge?.remove();
      return;
    }
    if (!badge) {
      badge = document.createElement('div');
      badge.id = 'offline-sync-badge';
      badge.className = 'fixed top-2 left-1/2 -translate-x-1/2 z-[500] px-md py-xs rounded-full bg-gold/90 text-white text-xs font-bold flex items-center gap-xs shadow-lg';
      document.body.appendChild(badge);
    }
    badge.textContent = `${count} offline — wird synchronisiert`;
  });
}

// ── Auto-sync on reconnect ──────────────────────────────────

let saveFnRef = null;

export function initOfflineQueue(saveFn) {
  saveFnRef = saveFn;

  window.addEventListener('online', () => {
    if (saveFnRef) syncQueue(saveFnRef);
  });

  // Try syncing immediately if online
  if (navigator.onLine && saveFnRef) {
    syncQueue(saveFnRef);
  }
}

/**
 * Check if we should queue instead of direct save
 */
export function isOffline() {
  return !navigator.onLine;
}
