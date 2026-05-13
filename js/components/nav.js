const MOBILE_PRIMARY = ['hub', 'my-tasks', 'locations', 'schedule'];

export function updateNav(route) {
  // Desktop sidebar nav
  document.querySelectorAll('#main-nav .nav-item').forEach(el => {
    const isActive = el.dataset.route === route;
    if (isActive) {
      el.classList.remove('text-muted');
      el.classList.add('text-lilac');
      el.style.background = 'rgba(108,63,197,.18)';
    } else {
      el.classList.add('text-muted');
      el.classList.remove('text-lilac');
      el.style.background = '';
    }
  });

  // Mobile bottom nav (4 primary items + more button)
  document.querySelectorAll('#bottom-nav .bottom-nav-item').forEach(el => {
    const elRoute = el.dataset.route;
    const isActive = elRoute === route;
    if (isActive) {
      el.classList.remove('text-muted');
      el.classList.add('text-lilac');
      el.style.background = 'rgba(108,63,197,.12)';
    } else {
      el.classList.add('text-muted');
      el.classList.remove('text-lilac');
      el.style.background = '';
    }
  });

  // If current route is in "More" section, highlight the More button
  const moreBtn = document.getElementById('bottom-nav-more');
  if (moreBtn) {
    const isMoreRoute = !MOBILE_PRIMARY.includes(route);
    if (isMoreRoute) {
      moreBtn.classList.remove('text-muted');
      moreBtn.classList.add('text-lilac');
      moreBtn.style.background = 'rgba(108,63,197,.12)';
    } else {
      moreBtn.classList.add('text-muted');
      moreBtn.classList.remove('text-lilac');
      moreBtn.style.background = '';
    }
  }
}
