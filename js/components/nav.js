export function updateNav(route) {
  document.querySelectorAll('#main-nav .nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.route === route);
  });
  document.querySelectorAll('#bottom-nav .bottom-nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.route === route);
  });
}
