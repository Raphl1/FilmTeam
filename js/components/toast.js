export function showToast(message, type = 'success', duration) {
  const ms = duration || (type === 'error' ? 5000 : type === 'warning' ? 4000 : 3000);
  document.querySelector('.toast')?.remove();
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.textContent = message;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, ms);
}
