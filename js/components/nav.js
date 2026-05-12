export function updateNav(route) {
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
  document.querySelectorAll('#bottom-nav .bottom-nav-item').forEach(el => {
    const isActive = el.dataset.route === route;
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
}
