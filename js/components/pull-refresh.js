/**
 * Pull-to-Refresh Component
 * Adds native-feeling pull gesture at the top of views to reload data.
 */

const PULL_THRESHOLD = 80; // px to trigger refresh
const MAX_PULL = 120;
let active = false;
let startY = 0;
let pullDistance = 0;
let indicator = null;
let refreshCallback = null;
let refreshing = false;

/**
 * Initialize pull-to-refresh on the main content area.
 * @param {function} onRefresh - Async function called on pull trigger (e.g. fetchAllData)
 */
export function initPullToRefresh(onRefresh) {
  refreshCallback = onRefresh;

  const main = document.querySelector('main');
  if (!main) return;

  main.addEventListener('touchstart', onTouchStart, { passive: true });
  main.addEventListener('touchmove', onTouchMove, { passive: false });
  main.addEventListener('touchend', onTouchEnd, { passive: true });
}

function onTouchStart(e) {
  // Only activate when scrolled to top
  if (window.scrollY > 0 || refreshing) return;
  startY = e.touches[0].clientY;
  active = true;
  pullDistance = 0;
}

function onTouchMove(e) {
  if (!active || refreshing) return;

  const dy = e.touches[0].clientY - startY;

  // Only pull downward
  if (dy < 0) {
    active = false;
    hideIndicator();
    return;
  }

  // Prevent default scroll when pulling
  if (dy > 10 && window.scrollY === 0) {
    e.preventDefault();
  }

  pullDistance = Math.min(dy * 0.5, MAX_PULL); // dampen
  showIndicator(pullDistance);
}

function onTouchEnd() {
  if (!active) return;
  active = false;

  if (pullDistance >= PULL_THRESHOLD && refreshCallback) {
    triggerRefresh();
  } else {
    hideIndicator();
  }
  pullDistance = 0;
}

function showIndicator(distance) {
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.id = 'pull-refresh-indicator';
    indicator.className = 'fixed left-1/2 -translate-x-1/2 z-[100] flex items-center justify-center transition-none';
    indicator.style.top = '0px';

    const spinner = document.createElement('div');
    spinner.className = 'w-8 h-8 rounded-full border-2 border-border border-t-violet flex items-center justify-center';
    spinner.id = 'pull-spinner';
    indicator.appendChild(spinner);

    document.body.appendChild(indicator);
  }

  const progress = Math.min(distance / PULL_THRESHOLD, 1);
  indicator.style.top = `${distance}px`;
  indicator.style.opacity = String(progress);

  const spinner = indicator.querySelector('#pull-spinner');
  if (spinner) {
    const rotation = progress * 360;
    spinner.style.transform = `rotate(${rotation}deg)`;
    if (progress >= 1) {
      spinner.style.borderTopColor = 'var(--c-green)';
    } else {
      spinner.style.borderTopColor = 'var(--c-violet)';
    }
  }
}

function hideIndicator() {
  if (!indicator) return;
  indicator.style.transition = 'top 200ms ease, opacity 200ms ease';
  indicator.style.top = '0px';
  indicator.style.opacity = '0';
  setTimeout(() => {
    indicator?.remove();
    indicator = null;
  }, 200);
}

async function triggerRefresh() {
  refreshing = true;

  // Animate spinner
  if (indicator) {
    indicator.style.transition = 'top 200ms ease';
    indicator.style.top = '60px';
    const spinner = indicator.querySelector('#pull-spinner');
    if (spinner) {
      spinner.style.animation = 'spin 600ms linear infinite';
    }
  }

  // Haptic feedback
  if (navigator.vibrate) navigator.vibrate(10);

  try {
    await refreshCallback();
  } catch (err) {
    console.warn('[pull-refresh] Refresh failed:', err);
  }

  refreshing = false;
  hideIndicator();
}
