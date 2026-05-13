/**
 * Derived state — computed from raw Firebase data.
 *
 * Single source of truth: state.schedule. The Hub view (and any other consumer)
 * MUST NOT hardcode shooting days. Use these helpers instead.
 */

import { state } from './state.js';

/**
 * Normalize a schedule day from Firebase into a Hub-friendly shape.
 * Resolves location IDs into names via state.locations.
 */
function expandDay(day) {
  const locs = (day.locations || []).map(id => {
    const loc = (state.locations || []).find(l => l.id === id);
    return loc ? loc.name : `#${id}`;
  });
  return {
    day: day.day,
    date: day.date,
    weekday: day.weekday,
    title: day.title,
    icon: day.icon,
    time: day.time,
    duration: day.duration,
    locations: locs,
    locationIds: day.locations || [],
    scenes: day.scenes || [],
    notes: day.notes || '',
    conflict: day.conflict || ''
  };
}

/**
 * All shooting days (raw), sorted ascending by `day` — includes TBD entries.
 */
export function getShootDays() {
  if (!Array.isArray(state.schedule)) return [];
  return [...state.schedule]
    .sort((a, b) => (a.day || 0) - (b.day || 0))
    .map(expandDay);
}

/**
 * Only those shoot days that have a confirmed (non-TBD) ISO date.
 */
function getDatedShootDays() {
  return getShootDays().filter(d => {
    if (!d.date || d.date === 'TBD') return false;
    const iso = String(d.date);
    return /^\d{4}-\d{2}-\d{2}$/.test(iso);
  });
}

/**
 * Today's date as YYYY-MM-DD in local time.
 */
export function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Returns the current shooting context. Phases:
 *  - 'pre'              : before first shoot day
 *  - 'shooting'         : today IS a shoot day → includes shootDay
 *  - 'shooting-break'   : between first & last shoot day, but not on a shoot day
 *  - 'post'             : after last shoot day
 *  - 'idle'             : no schedule data
 */
export function getShootContext() {
  // Only days with a real ISO date can drive phase calculations.
  const days = getDatedShootDays();
  if (days.length === 0) return { phase: 'idle', diff: 0 };

  const today = todayISO();
  const today0 = new Date(today + 'T00:00:00');
  const first = days[0];
  const last = days[days.length - 1];
  const firstDate = new Date(first.date + 'T00:00:00');
  const lastDate = new Date(last.date + 'T00:00:00');

  const ms = 1000 * 60 * 60 * 24;
  const diffToFirst = Math.ceil((firstDate - today0) / ms);

  // Are we ON a (dated) shoot day?
  const todayDay = days.find(d => d.date === today);
  if (todayDay) return { phase: 'shooting', diff: 0, shootDay: todayDay };

  if (diffToFirst > 0) return { phase: 'pre', diff: diffToFirst, firstDay: first };

  if (today0 > lastDate) {
    const postDiff = Math.ceil((today0 - lastDate) / ms);
    return { phase: 'post', diff: postDiff };
  }

  // Between dated days — show the next confirmed day if any
  const next = days.find(d => new Date(d.date + 'T00:00:00') > today0);
  return { phase: 'shooting-break', diff: 0, nextDay: next || null };
}

/**
 * Tasks owned by or assigned to the current user, that are not done.
 * Falls back to all open tasks sorted by deadline if no personal match.
 */
export function getMyOpenTasks(limit = 5) {
  const tasks = state.kanban?.tasks || [];
  const userName = state.user?.displayName || '';
  const userEmail = state.user?.email || '';
  // Prefer first name when available (common case in this team)
  const firstName = (userName.split(' ')[0] || userEmail).trim().toLowerCase();
  if (!firstName) return { list: [], isPersonal: false };

  // Word-boundary regex: matches the name as a whole word, not as substring.
  // Escape regex specials in the name first.
  const safe = firstName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(^|[\\s,/])${safe}([\\s,/]|$)`, 'i');

  const isMine = t => {
    const owner = String(t.owner || '');
    const assignee = String(t.assignee || '');
    return re.test(owner) || re.test(assignee);
  };

  const open = tasks.filter(t => t.status !== 'done');
  const mine = open.filter(isMine);

  const sorted = (list) => list.sort((a, b) => {
    if (a.deadline && b.deadline) return new Date(a.deadline) - new Date(b.deadline);
    if (a.deadline) return -1;
    if (b.deadline) return 1;
    return 0;
  });

  const list = mine.length > 0 ? sorted(mine) : sorted(open);
  return { list: list.slice(0, limit), isPersonal: mine.length > 0 };
}

/**
 * Tasks with deadlines within `days` and not done.
 * Sorted by deadline ascending.
 */
export function getUrgentTasks(daysAhead = 3) {
  const tasks = state.kanban?.tasks || [];
  const today0 = new Date(todayISO() + 'T00:00:00');
  const cutoff = new Date(today0.getTime() + daysAhead * 24 * 3600 * 1000);
  return tasks.filter(t => {
    if (!t.deadline || t.status === 'done') return false;
    const dl = new Date(t.deadline);
    return !isNaN(dl) && dl <= cutoff;
  }).sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
}

/**
 * Returns aggregate progress for headline KPIs.
 */
export function getProgressKPIs() {
  const result = {};
  if (Array.isArray(state.locations)) {
    const total = state.locations.length;
    const confirmed = state.locations.filter(l => l.status === 'confirmed').length;
    result.locations = { total, confirmed, pct: total ? Math.round(confirmed / total * 100) : 0 };
  }
  if (state.kanban?.tasks) {
    const total = state.kanban.tasks.length;
    const done = state.kanban.tasks.filter(t => t.status === 'done').length;
    result.tasks = { total, done, pct: total ? Math.round(done / total * 100) : 0 };
  }
  if (state.equipment?.categories) {
    let total = 0;
    state.equipment.categories.forEach(c => { total += (c.items || []).length; });
    let checked = 0;
    try {
      const map = JSON.parse(localStorage.getItem('equipment_checked') || '{}');
      checked = Object.values(map).filter(Boolean).length;
    } catch { /* ignore */ }
    result.equipment = { total, checked, pct: total ? Math.round(checked / total * 100) : 0 };
  }
  return result;
}