// ===== MAIN APP =====
const App = {
  init() {
    Auth.init();
    this.route();
  },

  route() {
    if (!Auth.isLoggedIn()) {
      renderLogin();
      return;
    }
    const role = Auth.getRole();
    switch (role) {
      case 'admin':   Admin.render();   break;
      case 'teacher': Teacher.render(); break;
      case 'student': Student.render(); break;
      default:        renderLogin();
    }
  },

  logout() {
    Auth.logout();
    renderLogin();
    showToast('Logged out successfully.', 'info');
  }
};

// ===== GLOBAL HELPERS =====

function showModal(html) {
  const existing = document.getElementById('modal-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'modal-overlay';
  overlay.innerHTML = `<div class="modal">${html}</div>`;
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  document.body.appendChild(overlay);
}

function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) overlay.remove();
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span> ${message}`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all .3s';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Close notification panel when clicking outside
document.addEventListener('click', e => {
  const panel = document.getElementById('notif-panel');
  if (panel && panel.classList.contains('open')) {
    if (!panel.contains(e.target) && !e.target.closest('.notif-btn')) {
      panel.classList.remove('open');
    }
  }
});

// ===== BOOT =====
document.addEventListener('DOMContentLoaded', () => App.init());
