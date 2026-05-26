// ===== API CONFIGURATION =====
// Change this URL to your deployed backend URL when going live
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api'           // Local development
  : '/api';                               // Production (same server serves frontend)

// Usage: fetch(`${API_BASE}/auth/login`, { ... })
