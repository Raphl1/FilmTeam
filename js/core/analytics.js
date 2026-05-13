/**
 * Analytics & Evaluation Layer
 *
 * Implements the HEART framework (Happiness, Engagement, Adoption, Retention,
 * Task-Success), error tracking, performance KPIs, and A/B-test feature flags.
 *
 * Design goals:
 *  - DSGVO-friendly: no third-party trackers, all data into our own RTDB.
 *  - Append-only: writes go to /analytics/{uid}/{eventId} so concurrent writers
 *    never collide and we don't trigger the realtime listener storm.
 *  - Resilient: never throws into caller code; failures are logged silently.
 *
 * Public API:
 *   trackEvent(name, props?)     → arbitrary event
 *   trackView(route)             → engagement (auto-called by router)
 *   trackError(err, context?)    → manual error logging
 *   trackTaskOutcome(name, ok)   → task-success metric
 *   submitFeedback(rating, txt?) → happiness rating (1-3)
 *   submitSUS(scores)            → SUS survey results
 *   getFlag(name, default)       → feature flag for A/B tests
 *   getStats()                   → diagnostic snapshot for the SUS prompt logic
 *
 * Schema in RTDB:
 *   analytics/
 *     events/{uid}/{eventId}    { type, ts, props }
 *     errors/{uid}/{eventId}    { msg, stack, context, ts, ua }
 *     feedback/{uid}/{eventId}  { rating, text, ts, route }
 *     sus/{uid}                 { scores, score, ts }
 *     sessions/{uid}/{sid}      { start, end, views, duration }
 */

import { getDatabase, ref, push, set, update, get, child } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js';
import { app, auth } from './firebase.js';
import { state } from './state.js';

const db = getDatabase(app);

// Local diagnostic state — used to decide WHEN to ask for SUS / Feedback.
const session = {
  id: 'sid_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
  start: Date.now(),
  views: 0,
  errors: 0,
  lastEvent: 0,
  flushTimer: null,
};

const QUEUE = []; // events that couldn't be sent yet (e.g. before auth)
const FLUSH_DELAY = 2000; // batch writes

let initialized = false;

function uid() {
  return auth.currentUser?.uid || 'anon';
}

function genId() {
  return Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

function safeUA() {
  try { return navigator.userAgent.slice(0, 200); } catch { return ''; }
}

async function flushQueue() {
  if (QUEUE.length === 0) return;
  if (!auth.currentUser) return; // wait for next attempt
  const batch = QUEUE.splice(0, QUEUE.length);
  try {
    const updates = {};
    batch.forEach(({ path, data }) => { updates[path] = data; });
    await update(ref(db), updates);
  } catch (err) {
    // Re-queue on failure (capped to 100 to avoid memory blow-up)
    if (QUEUE.length < 100) QUEUE.push(...batch);
    console.warn('[analytics] flush failed', err.message);
  }
}

function scheduleFlush() {
  if (session.flushTimer) return;
  session.flushTimer = setTimeout(() => {
    session.flushTimer = null;
    flushQueue();
  }, FLUSH_DELAY);
}

function enqueue(category, data) {
  const id = genId();
  const path = `analytics/${category}/${uid()}/${id}`;
  QUEUE.push({ path, data: { ...data, ts: Date.now() } });
  session.lastEvent = Date.now();
  scheduleFlush();
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Track a generic event (engagement signal).
 */
export function trackEvent(name, props = {}) {
  enqueue('events', { type: name, sid: session.id, props });
}

/**
 * Track a view navigation. Called from router.
 */
export function trackView(route) {
  session.views += 1;
  enqueue('events', { type: 'view', route, sid: session.id });
}

/**
 * Track an error (manual or via global handler).
 */
export function trackError(err, context = '') {
  session.errors += 1;
  const msg = (err?.message || String(err)).slice(0, 500);
  const stack = (err?.stack || '').slice(0, 1500);
  enqueue('errors', { msg, stack, context, sid: session.id, ua: safeUA(), route: location.hash });
}

/**
 * Track a task-success metric. `ok=true` means user reached their goal.
 */
export function trackTaskOutcome(name, ok, meta = {}) {
  enqueue('events', { type: 'task', name, ok, sid: session.id, meta });
}

/**
 * Save a happiness rating (1=sad, 2=meh, 3=happy) plus optional text.
 */
export async function submitFeedback(rating, text = '') {
  enqueue('feedback', {
    rating: Number(rating),
    text: String(text || '').slice(0, 1000),
    sid: session.id,
    route: location.hash || '#hub',
  });
  await flushQueue();
}

/**
 * Submit SUS (System Usability Scale) survey results.
 * `scores` is an array of 10 numbers (1-5).
 */
export async function submitSUS(scores) {
  if (!Array.isArray(scores) || scores.length !== 10) return;
  // Standard SUS scoring formula
  let sum = 0;
  scores.forEach((s, i) => {
    const n = Math.max(1, Math.min(5, Number(s) || 1));
    // Odd-indexed (1,3,5,7,9) positive items: x-1
    // Even-indexed (2,4,6,8,10) negative items: 5-x
    sum += i % 2 === 0 ? (n - 1) : (5 - n);
  });
  const susScore = Math.round(sum * 2.5); // 0-100
  try {
    await set(ref(db, `analytics/sus/${uid()}`), {
      scores, score: susScore, ts: Date.now(), sid: session.id
    });
    localStorage.setItem('fraime_sus_done', '1');
  } catch (e) { console.warn('[analytics] SUS save failed', e); }
}

/**
 * A/B feature flag. Reads from state.config.experiments[name] which can be:
 *  - boolean → on/off for everyone
 *  - { enabled: true, variant: 'A'|'B' }
 *  - { enabled: true, percent: 50 } → 50% of users get it (sticky per uid)
 *
 * Returns the resolved value (boolean for simple flags, string variant otherwise).
 */
export function getFlag(name, fallback = false) {
  const exp = state.config?.experiments?.[name];
  if (exp === undefined) return fallback;
  if (typeof exp === 'boolean') return exp;
  if (!exp.enabled) return fallback;
  if (typeof exp.percent === 'number') {
    const seed = (uid() + name).split('').reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 0);
    const bucket = seed % 100;
    return bucket < exp.percent;
  }
  return exp.variant ?? true;
}

/**
 * Get session diagnostics — used to decide if we should prompt for SUS.
 */
export function getStats() {
  return {
    sid: session.id,
    sessionsCount: getSessionCount(),
    views: session.views,
    errors: session.errors,
    durationMs: Date.now() - session.start,
    susDone: localStorage.getItem('fraime_sus_done') === '1',
    feedbackGiven: localStorage.getItem('fraime_feedback_at') || null,
  };
}

function getSessionCount() {
  const key = 'fraime_session_count';
  return parseInt(localStorage.getItem(key) || '0', 10);
}

function bumpSessionCount() {
  const key = 'fraime_session_count';
  const n = getSessionCount() + 1;
  localStorage.setItem(key, String(n));
  return n;
}

// ─── Init: attach global handlers, log session start, flush on unload ───────

export function initAnalytics() {
  if (initialized) return;
  initialized = true;

  bumpSessionCount();

  // Session start event
  enqueue('events', { type: 'session-start', sid: session.id, ua: safeUA(), tz: Intl.DateTimeFormat().resolvedOptions().timeZone });

  // Performance KPIs (LCP, FCP, navigation timing)
  try { collectPerformance(); } catch { /* ignore */ }

  // Global error handlers
  window.addEventListener('error', (e) => {
    trackError(e.error || new Error(e.message || 'unknown'), `window.error@${e.filename}:${e.lineno}`);
  });
  window.addEventListener('unhandledrejection', (e) => {
    const reason = e.reason instanceof Error ? e.reason : new Error(String(e.reason));
    trackError(reason, 'unhandledrejection');
  });

  // Flush periodically and on unload
  setInterval(flushQueue, 30_000);
  window.addEventListener('beforeunload', () => {
    enqueue('sessions', {
      start: session.start, end: Date.now(),
      views: session.views, errors: session.errors,
      duration: Date.now() - session.start,
    });
    // fire-and-forget; cannot await on unload
    flushQueue();
  });
  window.addEventListener('online', flushQueue);
}

function collectPerformance() {
  // Navigation timing
  if (performance.getEntriesByType) {
    const nav = performance.getEntriesByType('navigation')[0];
    if (nav) {
      enqueue('events', {
        type: 'perf-nav', sid: session.id,
        ttfb: Math.round(nav.responseStart),
        dom: Math.round(nav.domContentLoadedEventEnd),
        load: Math.round(nav.loadEventEnd || nav.domContentLoadedEventEnd),
      });
    }
  }
  // Largest Contentful Paint
  try {
    const po = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1];
      if (last) enqueue('events', { type: 'perf-lcp', sid: session.id, value: Math.round(last.startTime) });
    });
    po.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch { /* not supported */ }
  // First Contentful Paint
  try {
    const po2 = new PerformanceObserver((list) => {
      list.getEntries().forEach(e => {
        if (e.name === 'first-contentful-paint') {
          enqueue('events', { type: 'perf-fcp', sid: session.id, value: Math.round(e.startTime) });
        }
      });
    });
    po2.observe({ type: 'paint', buffered: true });
  } catch { /* not supported */ }
}