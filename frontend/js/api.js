// ===== API LAYER =====
// Replaces localStorage with real backend API calls

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api'
  : '/api';

// Store JWT token
const Token = {
  get()        { return localStorage.getItem('rms_token'); },
  set(t)       { localStorage.setItem('rms_token', t); },
  clear()      { localStorage.removeItem('rms_token'); }
};

// Base fetch with auth header
async function apiFetch(path, options = {}) {
  const token = Token.get();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) throw { status: res.status, message: data.message || 'Request failed', errors: data.errors };
  return data;
}

// ===== AUTH API =====
const AuthAPI = {
  async login(email, password, role) {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role })
    });
    Token.set(data.token);
    // Store user in session
    sessionStorage.setItem('rms_current_user', JSON.stringify({ ...data.user, id: data.user._id }));
    return data.user;
  },

  async signup(userData) {
    return await apiFetch('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  async forgotPassword(email) {
    return await apiFetch('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  },

  async resetPassword(userId, newPassword) {
    return await apiFetch('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ userId, newPassword })
    });
  },

  async changePassword(currentPassword, newPassword) {
    return await apiFetch('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword })
    });
  },

  async updateProfile(name) {
    const data = await apiFetch('/auth/update-profile', {
      method: 'PUT',
      body: JSON.stringify({ name })
    });
    // Update session
    const user = Auth.getUser();
    if (user) {
      user.name = name;
      sessionStorage.setItem('rms_current_user', JSON.stringify(user));
      Auth.currentUser = user;
    }
    return data;
  },

  logout() {
    Token.clear();
    sessionStorage.removeItem('rms_current_user');
  }
};

// ===== USERS API =====
const UsersAPI = {
  async getAll(role, status)  { return await apiFetch(`/users${role ? `?role=${role}` : ''}${status ? `&status=${status}` : ''}`); },
  async getTeachers()         { return await apiFetch('/users/teachers'); },
  async getStudents()         { return await apiFetch('/users/students'); },
  async getPending()          { return await apiFetch('/users/pending'); },
  async getById(id)           { return await apiFetch(`/users/${id}`); },

  async create(userData) {
    return await apiFetch('/users', { method: 'POST', body: JSON.stringify(userData) });
  },

  async update(id, updates) {
    return await apiFetch(`/users/${id}`, { method: 'PUT', body: JSON.stringify(updates) });
  },

  async approve(id) {
    return await apiFetch(`/users/${id}/approve`, { method: 'PUT' });
  },

  async delete(id) {
    return await apiFetch(`/users/${id}`, { method: 'DELETE' });
  }
};

// ===== ROUTINES API =====
const RoutinesAPI = {
  async getAll(filters = {}) {
    const q = new URLSearchParams(filters).toString();
    return await apiFetch(`/routines${q ? '?' + q : ''}`);
  },

  async getMy()       { return await apiFetch('/routines/my'); },
  async getById(id)   { return await apiFetch(`/routines/${id}`); },

  async validate(data) {
    return await apiFetch('/routines/validate', { method: 'POST', body: JSON.stringify(data) });
  },

  async create(data) {
    return await apiFetch('/routines', { method: 'POST', body: JSON.stringify(data) });
  },

  async update(id, data) {
    return await apiFetch(`/routines/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },

  async delete(id) {
    return await apiFetch(`/routines/${id}`, { method: 'DELETE' });
  }
};

// ===== ABSENT REQUESTS API =====
const AbsentAPI = {
  async getAll(status)  { return await apiFetch(`/absent-requests${status ? '?status=' + status : ''}`); },

  async create(data) {
    return await apiFetch('/absent-requests', { method: 'POST', body: JSON.stringify(data) });
  },

  async approve(id, substituteTeacherId) {
    return await apiFetch(`/absent-requests/${id}/approve`, {
      method: 'PUT',
      body: JSON.stringify({ substituteTeacherId })
    });
  },

  async reject(id) {
    return await apiFetch(`/absent-requests/${id}/reject`, { method: 'PUT' });
  }
};

// ===== NOTIFICATIONS API =====
const NotifAPI = {
  async getAll()        { return await apiFetch('/notifications'); },
  async getUnreadCount(){ return await apiFetch('/notifications/unread-count'); },
  async markAllRead()   { return await apiFetch('/notifications/mark-all-read', { method: 'PUT' }); },
  async markRead(id)    { return await apiFetch(`/notifications/${id}/read`, { method: 'PUT' }); }
};

// ===== DEPARTMENTS API =====
const DeptAPI = {
  async getAll()        { return await apiFetch('/departments'); },
  async create(name)    { return await apiFetch('/departments', { method: 'POST', body: JSON.stringify({ name }) }); },
  async rename(id, name){ return await apiFetch(`/departments/${id}`, { method: 'PUT', body: JSON.stringify({ name }) }); },
  async delete(id)      { return await apiFetch(`/departments/${id}`, { method: 'DELETE' }); }
};

// ===== CONSTANTS API =====
const ConstantsAPI = {
  async get() { return await apiFetch('/constants').catch(() => null); }
};
