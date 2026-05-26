// ===== AUTH MODULE =====
const Auth = {
  currentUser: null,

  init() {
    const saved = sessionStorage.getItem('rms_current_user');
    if (saved) this.currentUser = JSON.parse(saved);
  },

  login(email, password, role) {
    const users = DB.getUsers();
    const user  = users.find(u =>
      u.email.toLowerCase() === email.toLowerCase() &&
      u.password === password &&
      u.role === role
    );
    if (user) {
      // Block pending accounts
      if (user.status === 'pending') {
        return { success: false, message: 'Your account is pending admin approval. Please wait for activation.' };
      }
      this.currentUser = user;
      sessionStorage.setItem('rms_current_user', JSON.stringify(user));
      return { success: true, user };
    }
    const emailMatch = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!emailMatch) return { success: false, message: 'No account found with this email address.' };
    if (emailMatch.role !== role) return { success: false, message: `This email is registered as a ${emailMatch.role}, not ${role}.` };
    return { success: false, message: 'Incorrect password. Please try again.' };
  },

  logout() {
    this.currentUser = null;
    sessionStorage.removeItem('rms_current_user');
  },

  isLoggedIn() { return !!this.currentUser; },
  getRole()    { return this.currentUser?.role; },
  getUser()    { return this.currentUser; }
};

// ===== STATE =====
let selectedRole   = 'admin';
let showPassword   = false;
let loginView      = 'login'; // 'login' | 'signup' | 'forgot'

// ===== MAIN RENDER =====
function renderLogin() {
  document.getElementById('app').innerHTML = `
    <div class="auth-page">

      <!-- LEFT PANEL -->
      <div class="auth-left">
        <div class="auth-left-content">
          <div class="auth-brand">
            <div class="auth-brand-icon">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="8" fill="white" fill-opacity="0.2"/>
                <rect x="6" y="8" width="20" height="18" rx="3" stroke="white" stroke-width="2"/>
                <line x1="6" y1="13" x2="26" y2="13" stroke="white" stroke-width="2"/>
                <line x1="11" y1="6" x2="11" y2="11" stroke="white" stroke-width="2" stroke-linecap="round"/>
                <line x1="21" y1="6" x2="21" y2="11" stroke="white" stroke-width="2" stroke-linecap="round"/>
                <rect x="10" y="17" width="4" height="4" rx="1" fill="white"/>
                <rect x="18" y="17" width="4" height="4" rx="1" fill="white" fill-opacity="0.6"/>
              </svg>
            </div>
            <span>RoutinePilot</span>
          </div>

          <div class="auth-hero">
            <h1>RoutinePilot</h1>
            <p>A unified platform for managing class schedules, teacher assignments, and student timetables across universities, colleges, and schools.</p>
          </div>

          <div class="auth-features">
            <div class="auth-feature-item">
              <div class="auth-feature-icon">📋</div>
              <div>
                <strong>Smart Scheduling</strong>
                <span>Create and manage routines with lab & theory support</span>
              </div>
            </div>
            <div class="auth-feature-item">
              <div class="auth-feature-icon">🔔</div>
              <div>
                <strong>Live Notifications</strong>
                <span>Students get instant alerts on class changes</span>
              </div>
            </div>
            <div class="auth-feature-item">
              <div class="auth-feature-icon">👨‍🏫</div>
              <div>
                <strong>Substitute Management</strong>
                <span>Teachers report absence, admin assigns substitutes</span>
              </div>
            </div>
          </div>

          <div class="auth-left-footer">
            University &nbsp;·&nbsp; College &nbsp;·&nbsp; School
          </div>
        </div>
      </div>

      <!-- RIGHT PANEL -->
      <div class="auth-right">
        <div class="auth-form-wrap" id="auth-form-wrap">
          ${renderLoginForm()}
        </div>
      </div>

    </div>
  `;
}

// ===== LOGIN FORM =====
function renderLoginForm() {
  const roleConfig = {
    admin:   { icon: '🛡️', color: '#4f46e5', label: 'Admin',   desc: 'Manage routines, teachers & students' },
    teacher: { icon: '👨‍🏫', color: '#059669', label: 'Teacher', desc: 'View schedule & report absences' },
    student: { icon: '🎓', color: '#f59e0b', label: 'Student', desc: 'View class timetable & notifications' },
  };
  const rc = roleConfig[selectedRole];

  return `
    <div class="auth-form-header">
      <div class="auth-form-logo">
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="8" fill="#4f46e5"/>
          <rect x="6" y="8" width="20" height="18" rx="3" stroke="white" stroke-width="2"/>
          <line x1="6" y1="13" x2="26" y2="13" stroke="white" stroke-width="2"/>
          <line x1="11" y1="6" x2="11" y2="11" stroke="white" stroke-width="2" stroke-linecap="round"/>
          <line x1="21" y1="6" x2="21" y2="11" stroke="white" stroke-width="2" stroke-linecap="round"/>
          <rect x="10" y="17" width="4" height="4" rx="1" fill="white"/>
          <rect x="18" y="17" width="4" height="4" rx="1" fill="white" fill-opacity="0.6"/>
        </svg>
      </div>
      <h2>Welcome back</h2>
      <p>Sign in to your account to continue</p>
    </div>

    <!-- Role Selector -->
    <div class="auth-role-selector">
      ${['admin','teacher','student'].map(r => `
        <button class="auth-role-btn ${selectedRole === r ? 'active' : ''}"
          onclick="switchRole('${r}')"
          style="${selectedRole === r ? `--role-color:${roleConfig[r].color};` : ''}">
          <span class="role-btn-icon">${roleConfig[r].icon}</span>
          <span class="role-btn-label">${roleConfig[r].label}</span>
        </button>
      `).join('')}
    </div>
    <div class="auth-role-desc" id="role-desc">
      <span style="color:${rc.color};">${rc.icon}</span> ${rc.desc}
    </div>

    <!-- Error -->
    <div class="auth-error" id="login-error" style="display:none;"></div>

    <!-- Form -->
    <form onsubmit="handleLogin(event)" autocomplete="on">
      <div class="auth-field">
        <label for="login-email">Email Address</label>
        <div class="auth-input-wrap">
          <span class="auth-input-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </span>
          <input type="email" id="login-email" placeholder="you@institution.edu"
            autocomplete="email" required />
        </div>
      </div>

      <div class="auth-field">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <label for="login-password">Password</label>
          <button type="button" class="auth-forgot-link" onclick="renderForgotPassword()">
            Forgot password?
          </button>
        </div>
        <div class="auth-input-wrap">
          <span class="auth-input-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </span>
          <input type="password" id="login-password" placeholder="Enter your password"
            autocomplete="current-password" required />
          <button type="button" class="auth-eye-btn" onclick="togglePassword()" id="eye-btn" title="Show/hide password">
            <svg id="eye-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="auth-remember">
        <label class="auth-checkbox-label">
          <input type="checkbox" id="remember-me" />
          <span class="auth-checkmark"></span>
          Remember me
        </label>
      </div>

      <button type="submit" class="auth-submit-btn" id="submit-btn">
        <span id="submit-text">Sign In</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="5" y1="12" x2="19" y2="12"/>
          <polyline points="12 5 19 12 12 19"/>
        </svg>
      </button>
    </form>

    <!-- Sign up link -->
    <div class="auth-switch-link">
      Don't have an account?
      <button onclick="window.location.href='signup.html'">Create Account</button>
    </div>
  `;
}

// ===== SIGNUP FORM =====
let signupRole = 'student';

function renderSignup() {
  signupRole = 'student';
  const wrap = document.getElementById('auth-form-wrap');
  if (wrap) wrap.innerHTML = buildSignupForm();
  setTimeout(() => attachStrengthListener(), 50);
}

function buildSignupForm() {
  const depts = DB.getDepartments();
  const roleConfig = {
    admin:   { icon: '🛡️', color: '#4f46e5', label: 'Admin'   },
    teacher: { icon: '👨‍🏫', color: '#059669', label: 'Teacher' },
    student: { icon: '🎓',  color: '#f59e0b', label: 'Student' },
  };
  const rc = roleConfig[signupRole] || roleConfig['student'];

  return `
    <div class="auth-form-header">
      <div class="auth-back-btn" onclick="renderLoginView()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="19" y1="12" x2="5" y2="12"/>
          <polyline points="12 19 5 12 12 5"/>
        </svg>
        Back to Sign In
      </div>
      <div class="auth-form-logo" style="background:#ede9fe;">
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="8" fill="#4f46e5"/>
          <rect x="6" y="8" width="20" height="18" rx="3" stroke="white" stroke-width="2"/>
          <line x1="6" y1="13" x2="26" y2="13" stroke="white" stroke-width="2"/>
          <line x1="11" y1="6" x2="11" y2="11" stroke="white" stroke-width="2" stroke-linecap="round"/>
          <line x1="21" y1="6" x2="21" y2="11" stroke="white" stroke-width="2" stroke-linecap="round"/>
          <rect x="10" y="17" width="4" height="4" rx="1" fill="white"/>
          <rect x="18" y="17" width="4" height="4" rx="1" fill="white" fill-opacity="0.6"/>
        </svg>
      </div>
      <h2>Create Account</h2>
      <p>${signupRole === 'admin' ? 'Register as system administrator. A secure admin code is required.' : 'Register as a teacher or student. Your account will be reviewed by admin before activation.'}</p>
    </div>

    <!-- Role selector — all 3 roles -->
    <div class="auth-role-selector" style="margin-bottom:10px;">
      ${['admin','teacher','student'].map(r => `
        <button class="auth-role-btn ${signupRole === r ? 'active' : ''}"
          onclick="switchSignupRole('${r}')"
          style="${signupRole === r ? `--role-color:${roleConfig[r].color};` : ''}">
          <span class="role-btn-icon">${roleConfig[r].icon}</span>
          <span class="role-btn-label">${roleConfig[r].label}</span>
        </button>
      `).join('')}
    </div>
    <div class="auth-role-desc" style="margin-bottom:18px;">
      <span style="color:${rc.color};">${rc.icon}</span>
      Signing up as <strong>${rc.label}</strong>
      ${signupRole === 'admin' ? '<span style="color:#ef4444;font-size:11px;margin-left:6px;">🔒 Requires secure code</span>' : ''}
    </div>

    <div class="auth-error"   id="su-error"   style="display:none;"></div>

    <form onsubmit="handleSignup(event)" autocomplete="off" id="signup-form">

      <!-- Full Name -->
      <div class="auth-field">
        <label>Full Name <span class="req">*</span></label>
        <div class="auth-input-wrap">
          <span class="auth-input-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </span>
          <input type="text" id="su-name" placeholder="Your full name" required />
        </div>
      </div>

      <!-- Email -->
      <div class="auth-field">
        <label>Email Address <span class="req">*</span></label>
        <div class="auth-input-wrap">
          <span class="auth-input-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </span>
          <input type="email" id="su-email" placeholder="you@institution.edu" required />
        </div>
      </div>

      <!-- Department — hidden for admin -->
      ${signupRole !== 'admin' ? `
      <div class="auth-field">
        <label>Department <span class="req">*</span></label>
        <div class="auth-input-wrap">
          <span class="auth-input-icon">🏢</span>
          <select id="su-dept" style="padding-left:38px;">
            <option value="">-- Select Department --</option>
            ${depts.map(d => `<option value="${d}">${d}</option>`).join('')}
          </select>
        </div>
      </div>
      ` : ''}

      <!-- Role-specific fields -->
      <div id="su-role-fields">
        ${signupRole === 'admin' ? `
          <!-- Admin secure code -->
          <div class="auth-field">
            <label>Admin Secure Code <span class="req">*</span></label>
            <div class="auth-input-wrap">
              <span class="auth-input-icon">🔐</span>
              <input type="password" id="su-admin-code" placeholder="Enter the admin secure code" required />
            </div>
            <div style="font-size:11px;color:var(--muted);margin-top:5px;padding:8px 10px;background:var(--bg);border-radius:6px;border-left:3px solid var(--warning);">
              ⚠️ Admin accounts have full system access. The secure code is required to prevent unauthorized registration.
            </div>
          </div>
        ` : signupRole === 'teacher' ? `
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="auth-field">
              <label>Designation <span class="req">*</span></label>
              <div class="auth-input-wrap">
                <span class="auth-input-icon">🎖️</span>
                <select id="su-designation" style="padding-left:38px;">
                  <option value="">-- Select --</option>
                  ${DESIGNATIONS.map(d => `<option>${d}</option>`).join('')}
                </select>
              </div>
            </div>
            <div class="auth-field">
              <label>Faculty Type <span class="req">*</span></label>
              <div class="auth-input-wrap">
                <span class="auth-input-icon">🏷️</span>
                <select id="su-faculty-type" style="padding-left:38px;">
                  <option value="">-- Select --</option>
                  ${FACULTY_TYPES.map(f => `<option>${f}</option>`).join('')}
                </select>
              </div>
            </div>
          </div>
          <div class="auth-field">
            <label>Subjects (comma separated)</label>
            <div class="auth-input-wrap">
              <span class="auth-input-icon">📚</span>
              <input type="text" id="su-subjects" placeholder="e.g. Mathematics, Physics" />
            </div>
          </div>
        ` : `
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="auth-field">
              <label>Year <span class="req">*</span></label>
              <div class="auth-input-wrap">
                <span class="auth-input-icon">📅</span>
                <select id="su-year" style="padding-left:38px;">
                  <option value="">-- Year --</option>
                  ${YEARS.map(y => `<option>${y}</option>`).join('')}
                </select>
              </div>
            </div>
            <div class="auth-field">
              <label>Semester <span class="req">*</span></label>
              <div class="auth-input-wrap">
                <span class="auth-input-icon">🗓️</span>
                <select id="su-semester" style="padding-left:38px;">
                  <option value="">-- Semester --</option>
                  ${SEMESTERS.map(s => `<option>${s}</option>`).join('')}
                </select>
              </div>
            </div>
          </div>
        `}
      </div>

      <!-- Password -->
      <div class="auth-field">
        <label>Password <span class="req">*</span></label>
        <div class="auth-input-wrap">
          <span class="auth-input-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </span>
          <input type="password" id="su-password" placeholder="Min. 6 characters" required minlength="6" />
          <button type="button" class="auth-eye-btn" onclick="toggleSuPassword()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
        </div>
        <!-- Strength bar -->
        <div class="pw-strength-bar" style="margin-top:6px;">
          <div class="pw-strength-fill" id="su-strength-fill"></div>
        </div>
        <div id="su-strength-label" style="font-size:11px;color:var(--muted);margin-top:3px;"></div>
      </div>

      <!-- Confirm Password -->
      <div class="auth-field">
        <label>Confirm Password <span class="req">*</span></label>
        <div class="auth-input-wrap">
          <span class="auth-input-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </span>
          <input type="password" id="su-confirm" placeholder="Re-enter password" required minlength="6" />
        </div>
      </div>

      <!-- Terms -->
      <div class="auth-remember" style="margin-bottom:20px;">
        <label class="auth-checkbox-label">
          <input type="checkbox" id="su-terms" required />
          <span class="auth-checkmark"></span>
          I agree to the <span style="color:var(--primary);font-weight:600;">Terms of Use</span> and understand my account requires admin approval.
        </label>
      </div>

      <button type="submit" class="auth-submit-btn" id="su-btn"
        style="background:linear-gradient(135deg,#059669,#0891b2);">
        <span id="su-btn-text">Create Account</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <line x1="19" y1="8" x2="19" y2="14"/>
          <line x1="22" y1="11" x2="16" y2="11"/>
        </svg>
      </button>
    </form>

    <div class="auth-switch-link">
      Already have an account?
      <button onclick="renderLoginView()">Sign In</button>
    </div>
  `;
}

function switchSignupRole(role) {
  signupRole = role;
  const wrap = document.getElementById('auth-form-wrap');
  if (wrap) wrap.innerHTML = buildSignupForm();
  setTimeout(() => attachStrengthListener(), 50);
}

function attachStrengthListener() {
  const pwEl = document.getElementById('su-password');
  if (!pwEl) return;
  pwEl.addEventListener('input', function() {
    const val   = this.value;
    const fill  = document.getElementById('su-strength-fill');
    const label = document.getElementById('su-strength-label');
    if (!fill) return;
    let s = 0;
    if (val.length >= 6)           s++;
    if (val.length >= 10)          s++;
    if (/[A-Z]/.test(val))         s++;
    if (/[0-9]/.test(val))         s++;
    if (/[^A-Za-z0-9]/.test(val))  s++;
    const lvls = [
      { w:'0%',   c:'transparent', t:'' },
      { w:'25%',  c:'#ef4444',     t:'Weak' },
      { w:'50%',  c:'#f59e0b',     t:'Fair' },
      { w:'75%',  c:'#3b82f6',     t:'Good' },
      { w:'100%', c:'#10b981',     t:'Strong' },
    ];
    const lvl = lvls[Math.min(s, 4)];
    fill.style.width      = lvl.w;
    fill.style.background = lvl.c;
    label.textContent     = lvl.t;
    label.style.color     = lvl.c;
  });
}

function toggleSuPassword() {
  const el = document.getElementById('su-password');
  if (el) el.type = el.type === 'password' ? 'text' : 'password';
}

function handleSignup(e) {
  e.preventDefault();
  const errEl   = document.getElementById('su-error');
  const btn     = document.getElementById('su-btn');
  const btnText = document.getElementById('su-btn-text');
  errEl.style.display = 'none';

  const name     = document.getElementById('su-name').value.trim();
  const email    = document.getElementById('su-email').value.trim();
  const dept     = document.getElementById('su-dept')?.value || '';
  const password = document.getElementById('su-password').value;
  const confirm  = document.getElementById('su-confirm').value;
  const terms    = document.getElementById('su-terms').checked;

  // Validation
  if (!name)     { showSuError('Please enter your full name.');         return; }
  if (!email)    { showSuError('Please enter your email address.');     return; }
  if (signupRole !== 'admin' && !dept) { showSuError('Please select your department.'); return; }
  if (!terms)    { showSuError('You must agree to the terms.');         return; }
  if (password !== confirm) { showSuError('Passwords do not match.');   return; }
  if (password.length < 6)  { showSuError('Password must be at least 6 characters.'); return; }

  // Check email not already taken
  const existing = DB.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) { showSuError('An account with this email already exists.'); return; }

  // Role-specific validation
  if (signupRole === 'admin') {
    const adminCode = document.getElementById('su-admin-code')?.value?.trim();
    if (!adminCode) { showSuError('Please enter the admin secure code.'); return; }
    if (adminCode !== 'ADMIN2026') {
      showSuError('Invalid admin secure code. Access denied.');
      return;
    }
  }
  if (signupRole === 'teacher') {
    const designation  = document.getElementById('su-designation')?.value;
    const facultyType  = document.getElementById('su-faculty-type')?.value;
    if (!designation)  { showSuError('Please select your designation.');   return; }
    if (!facultyType)  { showSuError('Please select your faculty type.'); return; }
  }
  if (signupRole === 'student') {
    const year     = document.getElementById('su-year')?.value;
    const semester = document.getElementById('su-semester')?.value;
    if (!year)     { showSuError('Please select your year.');     return; }
    if (!semester) { showSuError('Please select your semester.'); return; }
  }

  // Loading
  btn.disabled      = true;
  btnText.textContent = 'Creating account…';

  setTimeout(() => {
    // Build user object
    const userData = {
      name, email, password,
      role:       signupRole,
      department: dept || '',
      // Admin accounts are immediately active; others need approval
      status: signupRole === 'admin' ? 'active' : 'pending'
    };

    if (signupRole === 'admin') {
      // Admin has no department/year/semester
    } else if (signupRole === 'teacher') {
      const subj = document.getElementById('su-subjects')?.value || '';
      userData.subjects    = subj ? subj.split(',').map(s => s.trim()).filter(Boolean) : [];
      userData.designation = document.getElementById('su-designation')?.value || '';
      userData.facultyType = document.getElementById('su-faculty-type')?.value || '';
    } else {
      userData.year     = document.getElementById('su-year').value;
      userData.semester = document.getElementById('su-semester').value;
    }

    // Try API first, fall back to localStorage
    const trySignup = async () => {
      try {
        await AuthAPI.signup(userData);
      } catch (e) {
        // API failed — save to localStorage as fallback
        DB.addUser(userData);
      }

      // Notify admin only for teacher/student signups
      if (signupRole !== 'admin') {
        try {
          // API handles notification automatically
        } catch(e) {
          DB.addNotification({
            type: 'info', targetRole: 'admin',
            title: 'New Account Request',
            message: `${name} has registered as a ${signupRole} and is awaiting approval.`,
            icon: '👤'
          });
        }
      }
      renderSignupSuccess(name, signupRole);
    };

    trySignup();
  }, 600);
}

function showSuError(msg) {
  const el = document.getElementById('su-error');
  if (!el) return;
  el.innerHTML     = `<span>⚠️</span> ${msg}`;
  el.style.display = 'flex';
  el.classList.remove('shake');
  void el.offsetWidth;
  el.classList.add('shake');
}

function renderSignupSuccess(name, role) {
  const wrap = document.getElementById('auth-form-wrap');
  if (!wrap) return;
  wrap.innerHTML = `
    <div style="text-align:center;padding:20px 0;">
      <div style="width:80px;height:80px;background:${role === 'admin' ? 'linear-gradient(135deg,#ede9fe,#ddd6fe)' : 'linear-gradient(135deg,#d1fae5,#a7f3d0)'};border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:36px;margin:0 auto 24px;">${role === 'admin' ? '🛡️' : '✅'}</div>
      <h2 style="font-size:24px;font-weight:800;margin-bottom:10px;">${role === 'admin' ? 'Admin Account Created!' : 'Account Created!'}</h2>
      <p style="color:var(--muted);font-size:14px;line-height:1.7;margin-bottom:28px;">
        Welcome, <strong>${name}</strong>!
        ${role === 'admin'
          ? 'Your admin account is <strong>active immediately</strong>. You can sign in now with full system access.'
          : `Your <strong>${role}</strong> account has been submitted. An admin will review and approve it shortly.`
        }
      </p>

      <div style="background:${role === 'admin' ? '#f5f3ff' : '#f0fdf4'};border:1px solid ${role === 'admin' ? '#ddd6fe' : '#bbf7d0'};border-radius:12px;padding:16px 20px;margin-bottom:28px;text-align:left;">
        <div style="font-size:13px;font-weight:700;color:${role === 'admin' ? '#5b21b6' : '#166534'};margin-bottom:8px;">
          ${role === 'admin' ? '🛡️ Admin Access' : '📋 What happens next?'}
        </div>
        <div style="font-size:13px;color:${role === 'admin' ? '#5b21b6' : '#166534'};display:flex;flex-direction:column;gap:6px;">
          ${role === 'admin' ? `
            <div>✓ Full access to manage routines</div>
            <div>✓ Manage teachers, students & departments</div>
            <div>✓ Approve/reject absence requests</div>
          ` : `
            <div>1️⃣ Admin receives a notification of your request</div>
            <div>2️⃣ Admin reviews and approves your account</div>
            <div>3️⃣ You can then sign in with your credentials</div>
          `}
        </div>
      </div>

      <button class="auth-submit-btn" onclick="window.location.href='login.html'"
        style="max-width:280px;margin:0 auto;${role === 'admin' ? 'background:linear-gradient(135deg,#4f46e5,#7c3aed);' : ''}">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="19" y1="12" x2="5" y2="12"/>
          <polyline points="12 19 5 12 12 5"/>
        </svg>
        <span>${role === 'admin' ? 'Go to Sign In' : 'Back to Sign In'}</span>
      </button>
    </div>
  `;
}

// ===== FORGOT PASSWORD FORM =====
function renderForgotPassword() {
  const wrap = document.getElementById('auth-form-wrap');
  if (!wrap) return;
  wrap.innerHTML = `
      <div class="auth-back-btn" onclick="renderLoginView()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="19" y1="12" x2="5" y2="12"/>
          <polyline points="12 19 5 12 12 5"/>
        </svg>
        Back to Sign In
      </div>
      <div class="auth-fp-icon">🔑</div>
      <h2>Forgot Password?</h2>
      <p>Enter your registered email address and we'll show you your security question to reset your password.</p>
    </div>

    <div class="auth-error" id="fp-error" style="display:none;"></div>
    <div class="auth-success" id="fp-success" style="display:none;"></div>

    <form onsubmit="handleForgotStep1(event)">
      <div class="auth-field">
        <label for="fp-email">Email Address</label>
        <div class="auth-input-wrap">
          <span class="auth-input-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </span>
          <input type="email" id="fp-email" placeholder="Enter your registered email" required autofocus />
        </div>
      </div>
      <button type="submit" class="auth-submit-btn">
        <span>Find My Account</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      </button>
    </form>

    <div style="text-align:center;margin-top:20px;">
      <button class="auth-forgot-link" onclick="renderLoginView()">← Back to Sign In</button>
    </div>
  `;
}

function handleForgotStep1(e) {
  e.preventDefault();
  const email  = document.getElementById('fp-email').value.trim();
  const errEl  = document.getElementById('fp-error');
  const sucEl  = document.getElementById('fp-success');
  errEl.style.display = 'none';
  sucEl.style.display = 'none';

  const user = DB.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    errEl.textContent   = 'No account found with this email address.';
    errEl.style.display = 'block';
    return;
  }
  renderSecurityQuestion(user);
}

// ===== SECURITY QUESTION STEP =====
function renderSecurityQuestion(user) {
  const hint = user.name.split(' ')[0];
  const wrap = document.getElementById('auth-form-wrap');
  if (!wrap) return;
  wrap.innerHTML = `
    <div class="auth-form-header">
      <div class="auth-back-btn" onclick="renderForgotPassword()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="19" y1="12" x2="5" y2="12"/>
          <polyline points="12 19 5 12 12 5"/>
        </svg>
        Back
      </div>
      <div class="auth-fp-icon">🔐</div>
      <h2>Verify Your Identity</h2>
      <p>Account found for <strong>${user.email}</strong>. Answer the security question to reset your password.</p>
    </div>

    <div class="auth-user-found-card">
      <div class="user-avatar avatar-${user.role}" style="width:42px;height:42px;font-size:16px;">${user.name.charAt(0)}</div>
      <div>
        <div style="font-weight:700;font-size:14px;">${user.name}</div>
        <div style="font-size:12px;color:var(--muted);text-transform:capitalize;">${user.role}</div>
      </div>
    </div>

    <div class="auth-error" id="sq-error" style="display:none;"></div>

    <form onsubmit="handleSecurityAnswer(event, '${user.id}')">
      <div class="auth-field">
        <label>Security Question</label>
        <div class="auth-security-q">What is your first name?</div>
      </div>
      <div class="auth-field">
        <label for="sq-answer">Your Answer</label>
        <div class="auth-input-wrap">
          <span class="auth-input-icon">🔒</span>
          <input type="text" id="sq-answer" placeholder="Type your answer" required autofocus />
        </div>
      </div>
      <button type="submit" class="auth-submit-btn">
        <span>Verify Answer</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </button>
    </form>
  `;
  // store hint for verification
  window._fpUser = user;
  window._fpHint = hint;
}

function handleSecurityAnswer(e, userId) {
  e.preventDefault();
  const answer = document.getElementById('sq-answer').value.trim();
  const errEl  = document.getElementById('sq-error');
  errEl.style.display = 'none';

  if (answer.toLowerCase() !== window._fpHint.toLowerCase()) {
    errEl.textContent   = 'Incorrect answer. Please try again.';
    errEl.style.display = 'block';
    return;
  }
  renderResetPassword(userId);
}

// ===== RESET PASSWORD STEP =====
function renderResetPassword(userId) {
  const wrap = document.getElementById('auth-form-wrap');
  if (!wrap) return;
  wrap.innerHTML = `
    <div class="auth-form-header">
      <div class="auth-fp-icon" style="background:linear-gradient(135deg,#10b981,#06b6d4);">✅</div>
      <h2>Set New Password</h2>
      <p>Identity verified! Choose a strong new password for your account.</p>
    </div>

    <div class="auth-error"   id="rp-error"   style="display:none;"></div>
    <div class="auth-success" id="rp-success" style="display:none;"></div>

    <form onsubmit="handleResetPassword(event, '${userId}')">
      <div class="auth-field">
        <label for="rp-new">New Password</label>
        <div class="auth-input-wrap">
          <span class="auth-input-icon">🔑</span>
          <input type="password" id="rp-new" placeholder="Minimum 6 characters" required minlength="6" />
          <button type="button" class="auth-eye-btn" onclick="toggleRpPassword('rp-new','rp-eye1')">
            <svg id="rp-eye1" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="auth-field">
        <label for="rp-confirm">Confirm New Password</label>
        <div class="auth-input-wrap">
          <span class="auth-input-icon">🔑</span>
          <input type="password" id="rp-confirm" placeholder="Re-enter new password" required minlength="6" />
          <button type="button" class="auth-eye-btn" onclick="toggleRpPassword('rp-confirm','rp-eye2')">
            <svg id="rp-eye2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Password strength indicator -->
      <div class="auth-field" style="margin-top:-8px;">
        <div class="pw-strength-bar">
          <div class="pw-strength-fill" id="pw-strength-fill"></div>
        </div>
        <div id="pw-strength-label" style="font-size:11px;color:var(--muted);margin-top:4px;"></div>
      </div>

      <button type="submit" class="auth-submit-btn" style="background:linear-gradient(135deg,#10b981,#059669);">
        <span>Reset Password</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </button>
    </form>
  `;

  // Live password strength
  document.getElementById('rp-new').addEventListener('input', function() {
    const val = this.value;
    const fill  = document.getElementById('pw-strength-fill');
    const label = document.getElementById('pw-strength-label');
    let strength = 0;
    if (val.length >= 6)  strength++;
    if (val.length >= 10) strength++;
    if (/[A-Z]/.test(val)) strength++;
    if (/[0-9]/.test(val)) strength++;
    if (/[^A-Za-z0-9]/.test(val)) strength++;
    const levels = [
      { w: '0%',   color: 'transparent', text: '' },
      { w: '25%',  color: '#ef4444',     text: 'Weak' },
      { w: '50%',  color: '#f59e0b',     text: 'Fair' },
      { w: '75%',  color: '#3b82f6',     text: 'Good' },
      { w: '100%', color: '#10b981',     text: 'Strong' },
    ];
    const lvl = levels[Math.min(strength, 4)];
    fill.style.width      = lvl.w;
    fill.style.background = lvl.color;
    label.textContent     = lvl.text;
    label.style.color     = lvl.color;
  });
}

function handleResetPassword(e, userId) {
  e.preventDefault();
  const newPw  = document.getElementById('rp-new').value;
  const confPw = document.getElementById('rp-confirm').value;
  const errEl  = document.getElementById('rp-error');
  const sucEl  = document.getElementById('rp-success');
  errEl.style.display = 'none';

  if (newPw !== confPw) {
    errEl.textContent   = 'Passwords do not match.';
    errEl.style.display = 'block';
    return;
  }
  if (newPw.length < 6) {
    errEl.textContent   = 'Password must be at least 6 characters.';
    errEl.style.display = 'block';
    return;
  }

  DB.updateUser(userId, { password: newPw });
  sucEl.innerHTML     = '✅ Password reset successfully! Redirecting to sign in…';
  sucEl.style.display = 'block';
  setTimeout(() => renderLoginView(), 2000);
}

function toggleRpPassword(inputId, iconId) {
  const input = document.getElementById(inputId);
  input.type  = input.type === 'password' ? 'text' : 'password';
}

// ===== HELPERS =====
function renderLoginView() {
  const wrap = document.getElementById('auth-form-wrap');
  if (wrap) wrap.innerHTML = renderLoginForm();
}

function switchRole(role) {
  selectedRole = role;
  const wrap = document.getElementById('auth-form-wrap');
  if (wrap) wrap.innerHTML = renderLoginForm();
}

function togglePassword() {
  const input = document.getElementById('login-password');
  input.type  = input.type === 'password' ? 'text' : 'password';
}

function fillDemo(role, email, password) {
  selectedRole = role;
  document.getElementById('auth-form-wrap').innerHTML = renderLoginForm();
  setTimeout(() => {
    document.getElementById('login-email').value    = email;
    document.getElementById('login-password').value = password;
  }, 50);
}

function handleLogin(e) {
  e.preventDefault();
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errEl    = document.getElementById('login-error');
  const btn      = document.getElementById('submit-btn');
  const btnText  = document.getElementById('submit-text');

  btn.disabled        = true;
  btnText.textContent = 'Signing in…';

  // Try API first, fall back to localStorage
  const tryLogin = async () => {
    try {
      const user = await AuthAPI.login(email, password, selectedRole);
      btnText.textContent  = '✓ Success!';
      btn.style.background = 'linear-gradient(135deg,#10b981,#059669)';
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 600);
    } catch (apiErr) {
      // Fall back to localStorage login
      const result = Auth.login(email, password, selectedRole);
      if (result.success) {
        btnText.textContent  = '✓ Success!';
        btn.style.background = 'linear-gradient(135deg,#10b981,#059669)';
        setTimeout(() => { window.location.href = 'dashboard.html'; }, 600);
      } else {
        const msg = apiErr.message || result.message;
        errEl.innerHTML     = `<span>⚠️</span> ${msg}`;
        errEl.style.display = 'flex';
        btn.disabled        = false;
        btnText.textContent = 'Sign In';
        errEl.classList.remove('shake');
        void errEl.offsetWidth;
        errEl.classList.add('shake');
      }
    }
  };

  setTimeout(tryLogin, 300);
}
