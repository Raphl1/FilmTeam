/**
 * Swipe Actions Component
 * Enables horizontal swipe gestures on list items to reveal action buttons.
 * - Swipe right: "Done" action (green)
 * - Swipe left: "Delete" action (red)
 */

const THRESHOLD = 60; // px to trigger action reveal
const MAX_SWIPE = 100; // max px for action width
const VELOCITY_THRESHOLD = 0.5; // px/ms for fast swipe

/**
 * Initialize swipe actions on a container's child items.
 * @param {HTMLElement} container - Parent element containing swipeable items
 * @param {object} options
 * @param {function} options.onSwipeRight - Called with the item element on right swipe confirm
 * @param {function} options.onSwipeLeft - Called with the item element on left swipe confirm
 * @param {string} options.rightLabel - Label for right action (default: "Erledigt")
 * @param {string} options.leftLabel - Label for left action (default: "Löschen")
 * @param {string} options.itemSelector - CSS selector for swipeable items (default: '.swipe-item')
 */
export function initSwipeActions(container, options = {}) {
  const {
    onSwipeRight,
    onSwipeLeft,
    rightLabel = 'Erledigt',
    leftLabel = 'Löschen',
    itemSelector = '.swipe-item'
  } = options;

  let activeItem = null;
  let startX = 0;
  let startY = 0;
  let currentX = 0;
  let startTime = 0;
  let isHorizontal = null; // null = undecided, true = horizontal, false = vertical

  container.addEventListener('touchstart', (e) => {
    const item = e.target.closest(itemSelector);
    if (!item) return;

    // Reset any previously open item
    if (activeItem && activeItem !== item) {
      resetItem(activeItem);
    }

    activeItem = item;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    startTime = Date.now();
    currentX = 0;
    isHorizontal = null;
    item.style.transition = 'none';
  }, { passive: true });

  container.addEventListener('touchmove', (e) => {
    if (!activeItem) return;

    const dx = e.touches[0].clientX - startX;
    const dy = e.touches[0].clientY - startY;

    // Determine swipe direction on first significant move
    if (isHorizontal === null) {
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
        isHorizontal = Math.abs(dx) > Math.abs(dy);
      }
      return;
    }

    if (!isHorizontal) {
      activeItem = null;
      return;
    }

    e.preventDefault();
    currentX = Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, dx));

    // Only allow configured directions
    if (currentX > 0 && !onSwipeRight) currentX = 0;
    if (currentX < 0 && !onSwipeLeft) currentX = 0;

    const content = activeItem.querySelector('.swipe-content');
    if (content) {
      content.style.transform = `translateX(${currentX}px)`;
    }

    // Show action indicators
    updateActionIndicators(activeItem, currentX, rightLabel, leftLabel);
  }, { passive: false });

  container.addEventListener('touchend', () => {
    if (!activeItem || !isHorizontal) {
      activeItem = null;
      return;
    }

    const elapsed = Date.now() - startTime;
    const velocity = Math.abs(currentX) / elapsed;
    const triggered = Math.abs(currentX) >= THRESHOLD || velocity > VELOCITY_THRESHOLD;

    if (triggered && currentX > 0 && onSwipeRight) {
      // Animate out to right
      completeSwipe(activeItem, 'right');
      setTimeout(() => onSwipeRight(activeItem), 200);
    } else if (triggered && currentX < 0 && onSwipeLeft) {
      // Animate out to left
      completeSwipe(activeItem, 'left');
      setTimeout(() => onSwipeLeft(activeItem), 200);
    } else {
      resetItem(activeItem);
    }

    activeItem = null;
    currentX = 0;
    isHorizontal = null;
  }, { passive: true });

  // Reset on scroll
  container.addEventListener('scroll', () => {
    if (activeItem) resetItem(activeItem);
    activeItem = null;
  }, { passive: true });
}

function updateActionIndicators(item, dx, rightLabel, leftLabel) {
  let rightAction = item.querySelector('.swipe-action-right');
  let leftAction = item.querySelector('.swipe-action-left');

  if (dx > 0) {
    if (!rightAction) {
      rightAction = document.createElement('div');
      rightAction.className = 'swipe-action-right absolute inset-y-0 left-0 flex items-center px-md bg-green/20 rounded-sm text-green text-sm font-medium';
      rightAction.textContent = rightLabel;
      item.style.position = 'relative';
      item.insertBefore(rightAction, item.firstChild);
    }
    const progress = Math.min(dx / THRESHOLD, 1);
    rightAction.style.opacity = String(progress);
    rightAction.style.width = `${Math.abs(dx)}px`;
  } else if (rightAction) {
    rightAction.remove();
  }

  if (dx < 0) {
    if (!leftAction) {
      leftAction = document.createElement('div');
      leftAction.className = 'swipe-action-left absolute inset-y-0 right-0 flex items-center justify-end px-md bg-accent/20 rounded-sm text-accent text-sm font-medium';
      leftAction.textContent = leftLabel;
      item.style.position = 'relative';
      item.appendChild(leftAction);
    }
    const progress = Math.min(Math.abs(dx) / THRESHOLD, 1);
    leftAction.style.opacity = String(progress);
    leftAction.style.width = `${Math.abs(dx)}px`;
  } else if (leftAction) {
    leftAction.remove();
  }
}

function completeSwipe(item, direction) {
  const content = item.querySelector('.swipe-content');
  if (content) {
    content.style.transition = 'transform 200ms ease, opacity 200ms ease';
    content.style.transform = `translateX(${direction === 'right' ? '100%' : '-100%'})`;
    content.style.opacity = '0';
  }
  // Haptic feedback if available
  if (navigator.vibrate) navigator.vibrate(15);
}

function resetItem(item) {
  const content = item.querySelector('.swipe-content');
  if (content) {
    content.style.transition = 'transform 200ms ease';
    content.style.transform = 'translateX(0)';
  }
  // Remove action indicators
  item.querySelector('.swipe-action-right')?.remove();
  item.querySelector('.swipe-action-left')?.remove();
}
