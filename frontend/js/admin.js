// ===== ADMIN MODULE =====
const Admin = {
  currentSection: 'dashboard',

  render() {
    const user = Auth.getUser();
    const unread = DB.getUnreadCount(user.id, 'admin');
    const pendingCount = DB.getAbsentRequests().filter(r => r.status === 'pending').length;
    const pendingAccounts = DB.getUsers().filter(u => u.status === 'pending').length;

    document.getElementById('app').innerHTML = `
      <div class="layout">
        ${this.renderSidebar(unread, pendingCount)}
        <div class="main-content">
          ${this.renderTopbar()}
          <div class="page-body" id="admin-page-body">
            ${this.renderDashboard()}
          </div>
        </div>
      </div>
      <div class="toast-container" id="toast-container"></div>
      <div class="notif-panel" id="notif-panel">
        ${this.renderNotifPanel()}
      </div>
    `;

    // Show toast if there are pending account approvals
    if (pendingAccounts > 0) {
      setTimeout(() => {
        showToast(`${pendingAccounts} account${pendingAccounts > 1 ? 's' : ''} waiting for your approval! Go to Account Approvals.`, 'warning');
      }, 1000);
    }
  },

  renderSidebar(unread, pendingCount) {
    const user = Auth.getUser();
    return `
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-header">
          <div class="sidebar-brand">
            <div class="brand-icon">📅</div>
            <div><h2>RoutinePilot</h2><span>Smart Scheduling</span></div>
          </div>
        </div>
        <div class="sidebar-user">
          <div class="user-avatar avatar-admin">${user.name.charAt(0)}</div>
          <div class="user-info"><h4>${user.name}</h4><span>${user.role}</span></div>
        </div>
        <nav class="sidebar-nav">
          <div class="nav-section-title">Main</div>
          <button class="nav-item active" id="nav-dashboard" onclick="Admin.navigate('dashboard')">
            <span class="nav-icon">🏠</span> Dashboard
          </button>
          <button class="nav-item" id="nav-routines" onclick="Admin.navigate('routines')">
            <span class="nav-icon">📋</span> Manage Routines
          </button>
          <button class="nav-item" id="nav-create-routine" onclick="Admin.navigate('create-routine')">
            <span class="nav-icon">➕</span> Create Routine
          </button>
          <div class="nav-section-title">People</div>
          <button class="nav-item" id="nav-teachers" onclick="Admin.navigate('teachers')">
            <span class="nav-icon">👨‍🏫</span> Teachers
          </button>
          <button class="nav-item" id="nav-students" onclick="Admin.navigate('students')">
            <span class="nav-icon">🎓</span> Students
          </button>
          <div class="nav-section-title">Settings</div>
          <button class="nav-item" id="nav-departments" onclick="Admin.navigate('departments')">
            <span class="nav-icon">🏢</span> Departments
          </button>
          <div class="nav-section-title">Requests</div>
          <button class="nav-item" id="nav-approvals" onclick="Admin.navigate('approvals')">
            <span class="nav-icon">👤</span> Account Approvals
            ${DB.getUsers().filter(u => u.status === 'pending').length > 0 ? `<span class="nav-badge">${DB.getUsers().filter(u => u.status === 'pending').length}</span>` : ''}
          </button>
          <button class="nav-item" id="nav-absent" onclick="Admin.navigate('absent')">
            <span class="nav-icon">📩</span> Absent Requests
            ${pendingCount > 0 ? `<span class="nav-badge">${pendingCount}</span>` : ''}
          </button>
          <button class="nav-item" id="nav-changelog" onclick="Admin.navigate('changelog')">
            <span class="nav-icon">📝</span> Change Log
          </button>
        </nav>
        <div class="sidebar-footer">
          <button class="nav-item" id="nav-profile" onclick="Admin.navigate('profile')">
            <span class="nav-icon">⚙️</span> My Profile
          </button>
          <button class="nav-item" onclick="App.logout()">
            <span class="nav-icon">🚪</span> Logout
          </button>
        </div>
      </aside>
    `;
  },

  renderTopbar() {
    const user = Auth.getUser();
    const unread = DB.getUnreadCount(user.id, 'admin');
    return `
      <div class="topbar">
        <div class="topbar-title">
          <h2 id="page-title">Dashboard</h2>
          <p id="page-subtitle">Welcome back, ${user.name}</p>
        </div>
        <div class="topbar-actions">
          <button class="notif-btn" onclick="Admin.toggleNotif()" title="Notifications">
            🔔 ${unread > 0 ? `<span class="notif-dot"></span>` : ''}
          </button>
          <button class="btn btn-outline btn-sm" onclick="App.logout()">Logout</button>
        </div>
      </div>
    `;
  },

  navigate(section) {
    this.currentSection = section;
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const navEl = document.getElementById('nav-' + section);
    if (navEl) navEl.classList.add('active');

    const titles = {
      dashboard: ['Dashboard', 'Overview of the system'],
      routines: ['Manage Routines', 'View and edit all class routines'],
      'create-routine': ['Create Routine', 'Build a new class schedule'],
      teachers: ['Teachers', 'Manage teacher accounts'],
      students: ['Students', 'Manage student accounts'],
      departments: ['Departments', 'Add, rename or remove departments'],
      approvals:   ['Account Approvals', 'Review and approve new user registrations'],
      absent: ['Absent Requests', 'Review teacher absence requests'],
      changelog: ['Change Log', 'History of all schedule changes'],
      profile:   ['My Profile', 'Update your name and password']
    };

    const [title, subtitle] = titles[section] || ['Admin', ''];
    document.getElementById('page-title').textContent    = title;
    document.getElementById('page-subtitle').textContent = subtitle;

    const body = document.getElementById('admin-page-body');
    switch (section) {
      case 'dashboard':      body.innerHTML = this.renderDashboard();      break;
      case 'routines':       body.innerHTML = this.renderRoutines();       break;
      case 'create-routine': body.innerHTML = this.renderCreateRoutine();  break;
      case 'teachers':       body.innerHTML = this.renderTeachers();       break;
      case 'students':       body.innerHTML = this.renderStudents();       break;
      case 'departments':    body.innerHTML = this.renderDepartments();    break;
      case 'approvals':      body.innerHTML = this.renderApprovals();      break;
      case 'absent':         body.innerHTML = this.renderAbsentRequests(); break;
      case 'changelog':      body.innerHTML = this.renderChangelog();      break;
      case 'profile':        body.innerHTML = this.renderProfile();       break;
    }
  },

  renderDashboard() {
    const routines  = DB.getRoutines();
    const teachers  = DB.getUsersByRole('teacher');
    const students  = DB.getUsersByRole('student');
    const pending   = DB.getAbsentRequests().filter(r => r.status === 'pending');
    const changelog = DB.getChangelog().slice(0, 5);
    const pendingAccounts = DB.getUsers().filter(u => u.status === 'pending');

    return `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon blue">📋</div>
          <div class="stat-info"><h3>${routines.length}</h3><p>Total Routines</p></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon green">👨‍🏫</div>
          <div class="stat-info"><h3>${teachers.length}</h3><p>Teachers</p></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon yellow">🎓</div>
          <div class="stat-info"><h3>${students.length}</h3><p>Students</p></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon red">📩</div>
          <div class="stat-info"><h3>${pending.length}</h3><p>Absent Requests</p></div>
        </div>
        ${pendingAccounts.length > 0 ? `
        <div class="stat-card" style="cursor:pointer;border:2px solid var(--warning);" onclick="Admin.navigate('approvals')">
          <div class="stat-icon yellow">👤</div>
          <div class="stat-info"><h3>${pendingAccounts.length}</h3><p>Pending Approvals</p></div>
        </div>
        ` : ''}
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; flex-wrap:wrap;">
        <div class="card">
          <div class="card-header"><h3>📋 Recent Routines</h3>
            <button class="btn btn-primary btn-sm" onclick="Admin.navigate('create-routine')">+ New</button>
          </div>
          <div class="card-body">
            ${routines.length === 0 ? '<p style="color:var(--muted);font-size:13px;">No routines yet.</p>' :
              routines.slice(0,5).map(r => `
                <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border);">
                  <div>
                    <div style="font-size:13px;font-weight:600;">${r.name}</div>
                    <div style="font-size:11px;color:var(--muted);">${r.department} · ${r.slots.length} slots</div>
                  </div>
                  <button class="btn btn-outline btn-sm" onclick="Admin.navigate('routines')">View</button>
                </div>
              `).join('')}
          </div>
        </div>

        <div class="card">
          <div class="card-header"><h3>📩 Pending Absent Requests</h3>
            <button class="btn btn-outline btn-sm" onclick="Admin.navigate('absent')">View All</button>
          </div>
          <div class="card-body">
            ${pending.length === 0 ? '<p style="color:var(--muted);font-size:13px;">No pending requests.</p>' :
              pending.slice(0,4).map(r => {
                const teacher = DB.getUserById(r.teacherId);
                return `
                  <div class="request-card pending">
                    <div class="request-header">
                      <h4>${teacher?.name || 'Unknown'}</h4>
                      <span class="badge badge-warning">Pending</span>
                    </div>
                    <div class="request-meta">📅 ${r.date} · ${r.subject}</div>
                    <div style="display:flex;gap:8px;margin-top:8px;">
                      <button class="btn btn-success btn-sm" onclick="Admin.approveAbsent('${r.id}')">✓ Approve</button>
                      <button class="btn btn-danger btn-sm" onclick="Admin.rejectAbsent('${r.id}')">✗ Reject</button>
                    </div>
                  </div>
                `;
              }).join('')}
          </div>
        </div>
      </div>

      ${changelog.length > 0 ? `
        <div class="card" style="margin-top:20px;">
          <div class="card-header"><h3>📝 Recent Changes</h3></div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Date</th><th>Action</th><th>Details</th><th>By</th></tr></thead>
              <tbody>
                ${changelog.map(c => `
                  <tr>
                    <td>${new Date(c.createdAt).toLocaleDateString()}</td>
                    <td><span class="badge badge-info">${c.action}</span></td>
                    <td>${c.details}</td>
                    <td>${c.by}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      ` : ''}
    `;
  },

  renderRoutines() {
    const routines = DB.getRoutines();

    // Check for any conflicts across all routines
    const allConflicts = [];
    const teacherSlotMap = {}; // teacherId|day|slot -> routineName
    routines.forEach(r => {
      (r.slots || []).forEach(s => {
        if (!s.teacherId) return;
        const slotNums = getPeriodSlots(s.period);
        slotNums.forEach(slotNum => {
          const key = `${s.teacherId}|${s.day}|${slotNum}`;
          if (teacherSlotMap[key]) {
            const teacher = DB.getUserById(s.teacherId);
            const period  = THEORY_PERIODS.find(p => p.slot === slotNum);
            allConflicts.push(`${teacher?.name || s.teacherId} — ${s.day} ${period?.label || 'slot '+slotNum} (${teacherSlotMap[key]} & ${r.name})`);
          } else {
            teacherSlotMap[key] = r.name;
          }
        });
      });
    });

    return `
      <div class="section-header">
        <div><h2>All Routines</h2><p>Manage class schedules</p></div>
        <button class="btn btn-primary" onclick="Admin.navigate('create-routine')">➕ Create New Routine</button>
      </div>

      ${allConflicts.length > 0 ? `
        <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:16px 20px;margin-bottom:20px;">
          <div style="font-size:14px;font-weight:700;color:#dc2626;margin-bottom:10px;">⚠️ ${allConflicts.length} Scheduling Conflict${allConflicts.length > 1 ? 's' : ''} Detected</div>
          ${allConflicts.map(c => `<div style="font-size:12px;color:#dc2626;padding:4px 0;border-bottom:1px solid #fecaca;">• ${c}</div>`).join('')}
          <div style="font-size:11px;color:#ef4444;margin-top:8px;">Please edit the affected routines to resolve these conflicts.</div>
        </div>
      ` : ''}
      ${routines.length === 0 ? `
        <div class="empty-state">
          <div class="empty-icon">📋</div>
          <h3>No Routines Yet</h3>
          <p>Create your first routine to get started.</p>
        </div>
      ` : routines.map(r => `
        <div class="card" style="margin-bottom:20px;">
          <div class="card-header">
            <div>
              <h3>${r.name}</h3>
              <div style="font-size:12px;color:var(--muted);margin-top:4px;">
                ${r.department} · ${r.year} · ${r.semester} · ${r.slots.length} class slots
              </div>
            </div>
            <div style="display:flex;gap:8px;">
              <button class="btn btn-outline btn-sm" onclick="Admin.viewRoutine('${r.id}')">👁 View</button>
              <button class="btn btn-warning btn-sm" onclick="Admin.editRoutineSlot('${r.id}')">✏️ Edit Slots</button>
              <button class="btn btn-danger btn-sm" onclick="Admin.deleteRoutine('${r.id}')">🗑 Delete</button>
            </div>
          </div>
          <div class="card-body" style="padding:16px 24px;">
            ${this.renderRoutineTable(r)}
          </div>
        </div>
      `).join('')}
    `;
  },

  renderRoutineTable(routine) {
    const todayFull = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()];
    const today = DAYS.includes(todayFull) ? todayFull : '';

    // Break boundaries: rowspan must NOT cross these
    // Short break is between slot 2 and slot 3
    // Lunch break is between slot 4 and slot 5
    const BREAK_BOUNDARIES = [[2,3],[4,5]];

    function crossesBreak(slotNums) {
      return BREAK_BOUNDARIES.some(([a,b]) => slotNums.includes(a) && slotNums.includes(b));
    }

    // Build a map: day|slotNumber -> slot data
    const slotMap = {};
    // Track which cells are "consumed" by a spanning lab (only for CONSECUTIVE slots)
    const spanned = {}; // key: day|slotNum -> true

    routine.slots.forEach(s => {
      const slots = getPeriodSlots(s.period);
      if (slots.length === 0) return;

      // Check if slots are consecutive AND don't cross a break boundary
      const isConsecutive = slots.every((sl, i) => i === 0 || sl === slots[i-1] + 1);
      const canSpan = isConsecutive && slots.length > 1 && !crossesBreak(slots);

      if (canSpan) {
        // Safe to use rowspan — all slots are consecutive within same session
        slotMap[s.day + '|' + slots[0]] = { ...s, spanSlots: slots };
        slots.slice(1).forEach(n => { spanned[s.day + '|' + n] = true; });
      } else {
        // Non-consecutive OR crosses break/lunch — show in each slot individually
        // Group consecutive sub-runs that don't cross breaks
        let currentGroup = [slots[0]];
        for (let i = 1; i < slots.length; i++) {
          const prev = slots[i-1];
          const curr = slots[i];
          const consecutive = curr === prev + 1;
          const crossesBoundary = BREAK_BOUNDARIES.some(([a,b]) => prev === a && curr === b);
          if (consecutive && !crossesBoundary) {
            currentGroup.push(curr);
          } else {
            // Save current group
            slotMap[s.day + '|' + currentGroup[0]] = { ...s, spanSlots: currentGroup, labPart: true };
            currentGroup.slice(1).forEach(n => { spanned[s.day + '|' + n] = true; });
            currentGroup = [curr];
          }
        }
        // Save last group
        slotMap[s.day + '|' + currentGroup[0]] = { ...s, spanSlots: currentGroup, labPart: true };
        currentGroup.slice(1).forEach(n => { spanned[s.day + '|' + n] = true; });
      }
    });

    return `
      <div class="table-wrap">
        <table class="routine-table">
          <thead>
            <tr>
              <th style="min-width:130px;">Time</th>
              ${DAYS.map(d => `<th class="${d === today ? 'today-col' : ''}">${d}${d === today ? ' 📍' : ''}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${THEORY_PERIODS.map((period, idx) => {
              // Check if we need a break row before this period
              const breakBefore = period.slot === 3
                ? `<tr class="break-row"><td colspan="${DAYS.length + 1}" style="background:#fef9c3;text-align:center;font-size:11px;font-weight:700;color:#92400e;padding:5px;border:1px solid #fde68a;">☕ Short Break — 11:30–11:45 (15 min)</td></tr>`
                : period.slot === 5
                ? `<tr class="break-row"><td colspan="${DAYS.length + 1}" style="background:#dcfce7;text-align:center;font-size:11px;font-weight:700;color:#166534;padding:5px;border:1px solid #bbf7d0;">🍽️ Lunch Break — 13:45–14:30 (45 min)</td></tr>`
                : '';

              const cells = DAYS.map(day => {
                if (spanned[day + '|' + period.slot]) return ''; // consumed by rowspan
                const slot = slotMap[day + '|' + period.slot];
                if (!slot) return `<td class="${day === today ? 'today-col' : ''}"><span class="empty-cell">—</span></td>`;

                const rowspan = slot.spanSlots.length;
                const teacher = DB.getUserById(slot.teacherId);
                const isChanged = slot.substituteTeacherId;
                const displayTeacher = isChanged ? DB.getUserById(slot.substituteTeacherId) : teacher;
                const isLab = slot.classType === 'practical' || isLabPeriod(slot.period);
                const periodInfo = getPeriodInfo(slot.period);
                const isFirstPart = !slot.labPart || slot.spanSlots[0] === getPeriodSlots(slot.period)[0];

                return `
                  <td rowspan="${rowspan}" class="${day === today ? 'today-col' : ''}" style="vertical-align:top;overflow:hidden;">
                    <div class="class-cell ${isChanged ? 'changed' : ''} ${isLab ? 'lab-cell' : ''}">
                      <div style="font-size:10px;font-weight:700;margin-bottom:3px;${isLab ? 'color:#7c3aed;' : 'color:#2563eb;'}">
                        ${isLab ? '🔬 PRACTICAL' : '📖 THEORY'}
                        ${slot.labPart && !isFirstPart ? '<span style="font-size:9px;opacity:.7;">(cont.)</span>' : ''}
                      </div>
                      <div class="subject">${slot.subject}</div>
                      <div class="teacher">👤 ${displayTeacher?.name || 'TBA'}</div>
                      <div class="room">🚪 ${slot.room}</div>
                      ${isLab && periodInfo?.note && isFirstPart ? `<div style="font-size:10px;color:var(--muted);margin-top:3px;">⏰ ${periodInfo.note}</div>` : ''}
                      ${isChanged ? '<div style="font-size:10px;color:#92400e;font-weight:700;">⚠️ Substitute</div>' : ''}
                    </div>
                  </td>`;
              }).join('');

              return `${breakBefore}<tr>
                <td style="font-weight:700;font-size:11px;background:var(--bg);white-space:nowrap;padding:8px 10px;">
                  ${period.label}
                  <div style="font-size:10px;color:var(--muted);font-weight:400;">Class ${period.slot}</div>
                </td>
                ${cells}
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  viewRoutine(id) {
    const routine = DB.getRoutineById(id);
    if (!routine) return;
    showModal(`
      <div class="modal-header">
        <h3>📋 ${routine.name}</h3>
        <button class="modal-close" onclick="closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px;">
          <span class="badge badge-primary">${routine.department}</span>
          <span class="badge badge-info">${routine.year}</span>
          <span class="badge badge-success">${routine.semester}</span>
        </div>
        ${this.renderRoutineTable(routine)}
      </div>
    `);
  },

  renderCreateRoutine() {
    const teachers = DB.getUsersByRole('teacher');
    return `
      <div class="section-header">
        <div><h2>Create New Routine</h2><p>Set up a class schedule</p></div>
      </div>
      <div class="card">
        <div class="card-header"><h3>Routine Details</h3></div>
        <div class="card-body">
          <div class="form-grid">
            <div class="form-group">
              <label>Routine Name</label>
              <input type="text" id="r-name" placeholder="e.g. CSE 2nd Year - Spring 2025" />
            </div>
            <div class="form-group">
              <label>Department</label>
              <select id="r-dept">
                ${DB.getDepartments().map(d => `<option>${d}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Year</label>
              <select id="r-year">
                ${YEARS.map(y => `<option>${y}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Semester</label>
              <select id="r-semester">
                ${SEMESTERS.map(s => `<option>${s}</option>`).join('')}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div class="card" style="margin-top:20px;">
        <div class="card-header">
          <h3>Class Slots</h3>
          <button class="btn btn-success btn-sm" onclick="Admin.addSlotRow()">➕ Add Slot</button>
        </div>
        <div class="card-body">
          <div id="slots-container">
            ${this.renderSlotRow(0, teachers)}
          </div>
          <div id="slots-list"></div>
        </div>
      </div>

      <div style="margin-top:20px;display:flex;gap:12px;">
        <button class="btn btn-primary" onclick="Admin.saveRoutine()">💾 Save Routine</button>
        <button class="btn btn-outline" onclick="Admin.navigate('routines')">Cancel</button>
      </div>
    `;
  },

  _slotCount: 1,

  renderSlotRow(idx, teachers) {
    teachers = teachers || DB.getUsersByRole('teacher');
    return `
      <div id="slot-row-${idx}" style="margin-bottom:14px;padding:16px;background:var(--bg);border-radius:12px;border:2px solid var(--border);">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="font-size:13px;font-weight:700;color:var(--muted);">Slot #${idx + 1}</span>
            <div class="class-type-toggle" id="type-toggle-${idx}">
              <button type="button" class="type-btn active" id="type-theory-${idx}"
                onclick="Admin.switchClassType(${idx},'theory')"
                style="padding:6px 14px;border:2px solid var(--primary);border-radius:8px 0 0 8px;background:var(--primary);color:#fff;font-size:12px;font-weight:700;cursor:pointer;">
                📖 Theory
              </button>
              <button type="button" class="type-btn" id="type-practical-${idx}"
                onclick="Admin.switchClassType(${idx},'practical')"
                style="padding:6px 14px;border:2px solid var(--primary);border-radius:0 8px 8px 0;background:#fff;color:var(--primary);font-size:12px;font-weight:700;cursor:pointer;">
                🔬 Practical
              </button>
            </div>
          </div>
          <button class="btn btn-danger btn-sm" onclick="document.getElementById('slot-row-${idx}').remove()">🗑 Remove</button>
        </div>

        <div class="form-grid">
          <div class="form-group">
            <label>Day</label>
            <select id="slot-day-${idx}">
              ${DAYS.map(d => `<option>${d}</option>`).join('')}
            </select>
          </div>

          <!-- Lab duration selector — hidden for theory -->
          <div class="form-group" id="lab-duration-group-${idx}" style="display:none;">
            <label>Lab Duration</label>
            <select id="slot-lab-duration-${idx}" onchange="Admin.updatePeriodOptions(${idx})">
              <option value="1+3">1 hr + 3 hrs (1hr first, 3hr afternoon)</option>
              <option value="3+1">3 hrs + 1 hr (3hr afternoon, 1hr morning)</option>
              <option value="2+2">2 hrs + 2 hrs (split equally)</option>
            </select>
          </div>

          <div class="form-group">
            <label>Period / Time</label>
            <select id="slot-period-${idx}">
              ${THEORY_PERIODS.map(p => `<option value="${p.label}">${p.label} &nbsp;(Class ${p.slot})</option>`).join('')}
            </select>
          </div>

          <div class="form-group">
            <label>Subject</label>
            <input type="text" id="slot-subject-${idx}" placeholder="Subject name" />
          </div>
          <div class="form-group">
            <label>Teacher</label>
            <select id="slot-teacher-${idx}">
              <option value="">-- Select Teacher --</option>
              ${teachers.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Room / Lab</label>
            <input type="text" id="slot-room-${idx}" placeholder="e.g. Room 101 / Lab 1" />
          </div>
        </div>
        <!-- hidden field to track type -->
        <input type="hidden" id="slot-classtype-${idx}" value="theory" />
      </div>
    `;
  },

  switchClassType(idx, type) {
    const theoryBtn    = document.getElementById('type-theory-' + idx);
    const practicalBtn = document.getElementById('type-practical-' + idx);
    const labDurGroup  = document.getElementById('lab-duration-group-' + idx);
    const typeField    = document.getElementById('slot-classtype-' + idx);

    if (type === 'theory') {
      theoryBtn.style.background    = 'var(--primary)';
      theoryBtn.style.color         = '#fff';
      practicalBtn.style.background = '#fff';
      practicalBtn.style.color      = 'var(--primary)';
      labDurGroup.style.display     = 'none';
      typeField.value               = 'theory';
      // Reset period to theory options
      this.updatePeriodOptions(idx, 'theory');
    } else {
      practicalBtn.style.background = 'var(--primary)';
      practicalBtn.style.color      = '#fff';
      theoryBtn.style.background    = '#fff';
      theoryBtn.style.color         = 'var(--primary)';
      labDurGroup.style.display     = 'block';
      typeField.value               = 'practical';
      this.updatePeriodOptions(idx, 'practical');
    }
  },

  updatePeriodOptions(idx, forceType) {
    const type     = forceType || document.getElementById('slot-classtype-' + idx)?.value || 'theory';
    const durEl    = document.getElementById('slot-lab-duration-' + idx);
    const duration = durEl ? durEl.value : '1+3';
    const periodEl = document.getElementById('slot-period-' + idx);
    if (!periodEl) return;

    if (type === 'theory') {
      periodEl.innerHTML = THEORY_PERIODS.map(p =>
        `<option value="${p.label}">${p.label} &nbsp;(Class ${p.slot})</option>`
      ).join('');
    } else {
      const typeKey = 'lab-' + duration;
      const filtered = LAB_PERIODS.filter(p => p.type === typeKey);
      periodEl.innerHTML = filtered.map(p =>
        `<option value="${p.label}">${p.label}</option>`
      ).join('');
    }
  },

  addSlotRow() {
    const container = document.getElementById('slots-container');
    const div = document.createElement('div');
    div.innerHTML = this.renderSlotRow(this._slotCount++);
    container.appendChild(div.firstElementChild);
  },

  // ===== ROUTINE VALIDATION (Client-side) =====
  validateSlots(slots, currentRoutineId) {
    const errors = [];
    const allRoutines = DB.getRoutines();

    // Normalize subject name: trim + lowercase for comparison
    const normalizeSubject = s => s.trim().toLowerCase();

    // Build global teacher schedule from OTHER routines
    const teacherSchedule = {}; // teacherId -> [{ day, slot, subject, routineName, period }]
    allRoutines.forEach(r => {
      if (r.id === currentRoutineId) return;
      (r.slots || []).forEach(s => {
        if (!s.teacherId) return;
        if (!teacherSchedule[s.teacherId]) teacherSchedule[s.teacherId] = [];
        const slotNums = getPeriodSlots(s.period);
        slotNums.forEach(slotNum => {
          teacherSchedule[s.teacherId].push({
            day: s.day, slot: slotNum,
            subject: s.subject,
            routineName: r.name, period: s.period
          });
        });
      });
    });

    // Add current routine's slots to the schedule
    slots.forEach(s => {
      if (!s.teacherId) return;
      if (!teacherSchedule[s.teacherId]) teacherSchedule[s.teacherId] = [];
      const slotNums = getPeriodSlots(s.period);
      slotNums.forEach(slotNum => {
        teacherSchedule[s.teacherId].push({
          day: s.day, slot: slotNum,
          subject: s.subject,
          routineName: '(this routine)', period: s.period
        });
      });
    });

    // ── CHECK 1: Same teacher, same day, same slot = TIME CONFLICT ──
    Object.entries(teacherSchedule).forEach(([tid, schedule]) => {
      const teacher = DB.getUserById(tid);
      if (!teacher) return;

      const slotMap = {};
      schedule.forEach(s => {
        const key = `${s.day}|${s.slot}`;
        if (!slotMap[key]) slotMap[key] = [];
        slotMap[key].push(s);
      });

      Object.entries(slotMap).forEach(([key, entries]) => {
        if (entries.length > 1) {
          const [day, slot] = key.split('|');
          const period = THEORY_PERIODS.find(p => p.slot === parseInt(slot));
          const timeLabel = period ? period.label : `slot ${slot}`;
          const subjects = entries.map(e => `"${e.subject}" (${e.routineName})`).join(' & ');
          errors.push(`⚠️ ${teacher.name} has a TIME CONFLICT on ${day} at ${timeLabel}: ${subjects}`);
        }
      });
    });

    // ── CHECK 2: Same subject (case-insensitive) on same day within this routine ──
    const subjectDayMap = {};
    slots.forEach(s => {
      const key = `${normalizeSubject(s.subject)}|${s.day}`;
      subjectDayMap[key] = (subjectDayMap[key] || 0) + 1;
    });
    Object.entries(subjectDayMap).forEach(([key, count]) => {
      if (count > 1) {
        const [subject, day] = key.split('|');
        errors.push(`⚠️ Subject "${subject}" appears ${count} times on ${day}. Same subject cannot repeat on the same day.`);
      }
    });

    // ── CHECK 2b: Same subject max 3 classes per week ──
    const subjectWeekMap = {};
    slots.forEach(s => {
      const key = normalizeSubject(s.subject).toLowerCase();
      subjectWeekMap[key] = (subjectWeekMap[key] || 0) + 1;
    });
    Object.entries(subjectWeekMap).forEach(([subject, count]) => {
      if (count > 3) {
        errors.push(`⚠️ Subject "${subject}" has ${count} classes this week. Maximum allowed is 3 classes per week per subject.`);
      }
    });

    // ── CHECK 3: Same subject name inconsistency (e.g. "JAVA" vs "java") ──
    const subjectNames = slots.map(s => s.subject.trim()).filter(Boolean);
    const subjectGroups = {};
    subjectNames.forEach(name => {
      const key = name.toLowerCase();
      if (!subjectGroups[key]) subjectGroups[key] = new Set();
      subjectGroups[key].add(name);
    });
    Object.entries(subjectGroups).forEach(([key, variants]) => {
      if (variants.size > 1) {
        errors.push(`⚠️ Subject name inconsistency: ${[...variants].map(v => `"${v}"`).join(' and ')} are the same subject. Please use consistent casing.`);
      }
    });

    // ── CHECK 4: Faculty max 2 classes in 1st period per week ──
    Object.entries(teacherSchedule).forEach(([tid, schedule]) => {
      const teacher = DB.getUserById(tid);
      if (!teacher) return;
      const firstPeriodCount = schedule.filter(s => s.slot === 1).length;
      if (firstPeriodCount > 2) {
        errors.push(`⚠️ ${teacher.name} has ${firstPeriodCount} classes in 1st period (9:30–10:30). Maximum 2 per week.`);
      }
    });

    // ── CHECK 5: Same subject max 2 times in 1st period across ALL routines ──
    // Count 1st-period appearances of each subject (case-insensitive) across existing routines
    const allRoutineSubjectFirstPeriod = {};
    DB.getRoutines().forEach(r => {
      if (r.id === currentRoutineId) return; // skip current
      (r.slots || []).forEach(s => {
        const slotNums = getPeriodSlots(s.period);
        if (slotNums.includes(1)) {
          const key = s.subject.trim().toLowerCase();
          allRoutineSubjectFirstPeriod[key] = (allRoutineSubjectFirstPeriod[key] || 0) + 1;
        }
      });
    });
    // Add current routine's 1st-period slots
    slots.forEach(s => {
      const slotNums = getPeriodSlots(s.period);
      if (slotNums.includes(1)) {
        const key = s.subject.trim().toLowerCase();
        allRoutineSubjectFirstPeriod[key] = (allRoutineSubjectFirstPeriod[key] || 0) + 1;
      }
    });
    Object.entries(allRoutineSubjectFirstPeriod).forEach(([subject, count]) => {
      if (count > 2) {
        errors.push(`⚠️ Subject "${subject}" appears ${count} times in 1st period (9:30–10:30) across all routines. Maximum allowed is 2.`);
      }
    });

    return errors;
  },

  saveRoutine() {
    const name     = document.getElementById('r-name').value.trim();
    const dept     = document.getElementById('r-dept').value;
    const year     = document.getElementById('r-year').value;
    const semester = document.getElementById('r-semester').value;

    if (!name) { showToast('Please enter a routine name.', 'error'); return; }

    const slots = [];
    document.querySelectorAll('[id^="slot-row-"]').forEach(row => {
      const idx       = row.id.replace('slot-row-', '');
      const day       = document.getElementById('slot-day-' + idx)?.value;
      const period    = document.getElementById('slot-period-' + idx)?.value;
      const subject   = document.getElementById('slot-subject-' + idx)?.value?.trim();
      const teacher   = document.getElementById('slot-teacher-' + idx)?.value;
      const room      = document.getElementById('slot-room-' + idx)?.value?.trim();
      const classType = document.getElementById('slot-classtype-' + idx)?.value || 'theory';
      const labDur    = document.getElementById('slot-lab-duration-' + idx)?.value || '';
      if (day && period && subject) {
        slots.push({ day, period, subject, teacherId: teacher, room: room || 'TBA', classType, labDuration: labDur });
      }
    });

    if (slots.length === 0) { showToast('Please add at least one class slot.', 'error'); return; }

    // ── Validate for conflicts ──
    const errors = this.validateSlots(slots, null);
    if (errors.length > 0) {
      showModal(`
        <div class="modal-header">
          <h3>❌ Validation Errors</h3>
          <button class="modal-close" onclick="closeModal()">✕</button>
        </div>
        <div class="modal-body">
          <p style="color:var(--muted);font-size:13px;margin-bottom:16px;">The routine cannot be saved due to scheduling conflicts:</p>
          <div style="display:flex;flex-direction:column;gap:10px;">
            ${errors.map(e => `
              <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px 14px;font-size:13px;color:#dc2626;">
                ${e}
              </div>
            `).join('')}
          </div>
          <p style="color:var(--muted);font-size:12px;margin-top:16px;">Please fix these conflicts and try again.</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" onclick="closeModal()">OK, I'll Fix It</button>
        </div>
      `);
      return;
    }

    DB.addRoutine({ name, department: dept, year, semester, slots });
    DB.addChangeLog({ action: 'Created', details: `Routine "${name}" created`, by: Auth.getUser().name });
    showToast('Routine created successfully!', 'success');
    this.navigate('routines');
  },

  editRoutineSlot(routineId) {
    const routine  = DB.getRoutineById(routineId);
    const teachers = DB.getUsersByRole('teacher');
    if (!routine) return;

    showModal(`
      <div class="modal-header">
        <h3>✏️ Edit Slots — ${routine.name}</h3>
        <button class="modal-close" onclick="closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <div style="margin-bottom:16px;">
          <button class="btn btn-success btn-sm" onclick="Admin.addEditSlotRow('${routineId}')">➕ Add New Slot</button>
        </div>
        <div id="edit-slots-container">
          ${routine.slots.map((slot, i) => {
            const isPractical = slot.classType === 'practical';
            const labDur      = slot.labDuration || '3hr';
            const labOptions  = LAB_PERIODS.filter(p => p.type === (labDur === '3hr' ? 'lab-full' : 'lab-split'));
            return `
            <div id="edit-slot-${i}" style="margin-bottom:14px;padding:14px;background:var(--bg);border-radius:12px;border:2px solid var(--border);">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
                <div style="display:flex;align-items:center;gap:10px;">
                  <span style="font-size:12px;font-weight:700;color:var(--muted);">Slot #${i+1}</span>
                  <div>
                    <button type="button" id="es-type-theory-${i}"
                      onclick="Admin.switchEditClassType(${i},'theory')"
                      style="padding:5px 12px;border:2px solid var(--primary);border-radius:8px 0 0 8px;background:${isPractical?'#fff':'var(--primary)'};color:${isPractical?'var(--primary)':'#fff'};font-size:12px;font-weight:700;cursor:pointer;">
                      📖 Theory
                    </button>
                    <button type="button" id="es-type-practical-${i}"
                      onclick="Admin.switchEditClassType(${i},'practical')"
                      style="padding:5px 12px;border:2px solid var(--primary);border-radius:0 8px 8px 0;background:${isPractical?'var(--primary)':'#fff'};color:${isPractical?'#fff':'var(--primary)'};font-size:12px;font-weight:700;cursor:pointer;">
                      🔬 Practical
                    </button>
                  </div>
                </div>
                <button class="btn btn-danger btn-sm" onclick="document.getElementById('edit-slot-${i}').remove()">🗑</button>
              </div>
              <div class="form-grid">
                <div class="form-group"><label>Day</label>
                  <select id="es-day-${i}">${DAYS.map(d => `<option ${d===slot.day?'selected':''}>${d}</option>`).join('')}</select>
                </div>
                <div class="form-group" id="es-lab-dur-group-${i}" style="display:${isPractical?'block':'none'};">
                  <label>Lab Duration</label>
                  <select id="es-lab-duration-${i}" onchange="Admin.updateEditPeriodOptions(${i})">
                    <option value="1+3" ${labDur==='1+3'?'selected':''}>1 hr + 3 hrs (1hr first)</option>
                    <option value="3+1" ${labDur==='3+1'?'selected':''}>3 hrs + 1 hr (3hr first)</option>
                    <option value="2+2" ${labDur==='2+2'?'selected':''}>2 hrs + 2 hrs (split)</option>
                  </select>
                </div>
                <div class="form-group"><label>Period / Time</label>
                  <select id="es-period-${i}">
                    ${isPractical
                      ? labOptions.map(p => `<option value="${p.label}" ${p.label===slot.period?'selected':''}>${p.label}</option>`).join('')
                      : THEORY_PERIODS.map(p => `<option value="${p.label}" ${p.label===slot.period?'selected':''}>${p.label} (Class ${p.slot})</option>`).join('')
                    }
                  </select>
                </div>
                <div class="form-group"><label>Subject</label>
                  <input type="text" id="es-subject-${i}" value="${slot.subject}" />
                </div>
                <div class="form-group"><label>Teacher</label>
                  <select id="es-teacher-${i}">
                    <option value="">-- Select --</option>
                    ${teachers.map(t => `<option value="${t.id}" ${t.id===slot.teacherId?'selected':''}>${t.name}</option>`).join('')}
                  </select>
                </div>
                <div class="form-group"><label>Room / Lab</label>
                  <input type="text" id="es-room-${i}" value="${slot.room||''}" />
                </div>
              </div>
              <input type="hidden" id="es-classtype-${i}" value="${slot.classType||'theory'}" />
            </div>
          `}).join('')}
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="Admin.saveEditedSlots('${routineId}')">💾 Save Changes</button>
      </div>
    `);
  },

  switchEditClassType(idx, type) {
    const theoryBtn    = document.getElementById('es-type-theory-' + idx);
    const practicalBtn = document.getElementById('es-type-practical-' + idx);
    const labDurGroup  = document.getElementById('es-lab-dur-group-' + idx);
    const typeField    = document.getElementById('es-classtype-' + idx);

    if (type === 'theory') {
      theoryBtn.style.background    = 'var(--primary)';
      theoryBtn.style.color         = '#fff';
      practicalBtn.style.background = '#fff';
      practicalBtn.style.color      = 'var(--primary)';
      labDurGroup.style.display     = 'none';
      typeField.value               = 'theory';
      this.updateEditPeriodOptions(idx, 'theory');
    } else {
      practicalBtn.style.background = 'var(--primary)';
      practicalBtn.style.color      = '#fff';
      theoryBtn.style.background    = '#fff';
      theoryBtn.style.color         = 'var(--primary)';
      labDurGroup.style.display     = 'block';
      typeField.value               = 'practical';
      this.updateEditPeriodOptions(idx, 'practical');
    }
  },

  updateEditPeriodOptions(idx, forceType) {
    const type     = forceType || document.getElementById('es-classtype-' + idx)?.value || 'theory';
    const durEl    = document.getElementById('es-lab-duration-' + idx);
    const duration = durEl ? durEl.value : '1+3';
    const periodEl = document.getElementById('es-period-' + idx);
    if (!periodEl) return;

    if (type === 'theory') {
      periodEl.innerHTML = THEORY_PERIODS.map(p =>
        `<option value="${p.label}">${p.label} (Class ${p.slot})</option>`
      ).join('');
    } else {
      const typeKey = 'lab-' + duration;
      const filtered = LAB_PERIODS.filter(p => p.type === typeKey);
      periodEl.innerHTML = filtered.map(p =>
        `<option value="${p.label}">${p.label}</option>`
      ).join('');
    }
  },

  _editSlotCount: 100,

  addEditSlotRow(routineId) {
    const teachers = DB.getUsersByRole('teacher');
    const idx = this._editSlotCount++;
    const container = document.getElementById('edit-slots-container');
    const div = document.createElement('div');
    div.innerHTML = `
      <div id="edit-slot-${idx}" style="margin-bottom:14px;padding:14px;background:var(--bg);border-radius:12px;border:2px solid var(--border);">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="font-size:12px;font-weight:700;color:var(--muted);">New Slot</span>
            <div>
              <button type="button" id="es-type-theory-${idx}"
                onclick="Admin.switchEditClassType(${idx},'theory')"
                style="padding:5px 12px;border:2px solid var(--primary);border-radius:8px 0 0 8px;background:var(--primary);color:#fff;font-size:12px;font-weight:700;cursor:pointer;">
                📖 Theory
              </button>
              <button type="button" id="es-type-practical-${idx}"
                onclick="Admin.switchEditClassType(${idx},'practical')"
                style="padding:5px 12px;border:2px solid var(--primary);border-radius:0 8px 8px 0;background:#fff;color:var(--primary);font-size:12px;font-weight:700;cursor:pointer;">
                🔬 Practical
              </button>
            </div>
          </div>
          <button class="btn btn-danger btn-sm" onclick="document.getElementById('edit-slot-${idx}').remove()">🗑</button>
        </div>
        <div class="form-grid">
          <div class="form-group"><label>Day</label>
            <select id="es-day-${idx}">${DAYS.map(d => `<option>${d}</option>`).join('')}</select>
          </div>
          <div class="form-group" id="es-lab-dur-group-${idx}" style="display:none;">
            <label>Lab Duration</label>
            <select id="es-lab-duration-${idx}" onchange="Admin.updateEditPeriodOptions(${idx})">
              <option value="1+3">1 hr + 3 hrs (1hr first)</option>
              <option value="3+1">3 hrs + 1 hr (3hr first)</option>
              <option value="2+2">2 hrs + 2 hrs (split)</option>
            </select>
          </div>
          <div class="form-group"><label>Period / Time</label>
            <select id="es-period-${idx}">
              ${THEORY_PERIODS.map(p => `<option value="${p.label}">${p.label} (Class ${p.slot})</option>`).join('')}
            </select>
          </div>
          <div class="form-group"><label>Subject</label>
            <input type="text" id="es-subject-${idx}" placeholder="Subject" />
          </div>
          <div class="form-group"><label>Teacher</label>
            <select id="es-teacher-${idx}">
              <option value="">-- Select --</option>
              ${teachers.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group"><label>Room / Lab</label>
            <input type="text" id="es-room-${idx}" placeholder="Room / Lab" />
          </div>
        </div>
        <input type="hidden" id="es-classtype-${idx}" value="theory" />
      </div>
    `;
    container.appendChild(div.firstElementChild);
  },

  saveEditedSlots(routineId) {
    const routine = DB.getRoutineById(routineId);
    const slots = [];
    document.querySelectorAll('[id^="edit-slot-"]').forEach(row => {
      const idx       = row.id.replace('edit-slot-', '');
      const day       = document.getElementById('es-day-' + idx)?.value;
      const period    = document.getElementById('es-period-' + idx)?.value;
      const subject   = document.getElementById('es-subject-' + idx)?.value?.trim();
      const teacher   = document.getElementById('es-teacher-' + idx)?.value;
      const room      = document.getElementById('es-room-' + idx)?.value?.trim();
      const classType = document.getElementById('es-classtype-' + idx)?.value || 'theory';
      const labDur    = document.getElementById('es-lab-duration-' + idx)?.value || '';
      if (day && period && subject) {
        slots.push({ day, period, subject, teacherId: teacher, room: room || 'TBA', classType, labDuration: labDur });
      }
    });

    // ── Validate for conflicts ──
    const errors = this.validateSlots(slots, routineId);
    if (errors.length > 0) {
      // Show errors inside the modal
      const errHtml = errors.map(e => `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:8px 12px;font-size:12px;color:#dc2626;margin-bottom:6px;">${e}</div>`).join('');
      let errContainer = document.getElementById('edit-slot-errors');
      if (!errContainer) {
        const container = document.getElementById('edit-slots-container');
        const div = document.createElement('div');
        div.id = 'edit-slot-errors';
        div.style.cssText = 'margin-bottom:16px;';
        container.parentNode.insertBefore(div, container);
        errContainer = div;
      }
      errContainer.innerHTML = `
        <div style="font-size:13px;font-weight:700;color:#dc2626;margin-bottom:8px;">❌ Cannot save — scheduling conflicts found:</div>
        ${errHtml}
      `;
      errContainer.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    DB.updateRoutine(routineId, { slots });
    DB.addChangeLog({ action: 'Updated', details: `Slots updated for "${routine.name}"`, by: Auth.getUser().name });
    closeModal();
    showToast('Routine updated!', 'success');
    this.navigate('routines');
  },

  deleteRoutine(id) {
    const routine = DB.getRoutineById(id);
    if (!confirm(`Delete routine "${routine?.name}"? This cannot be undone.`)) return;
    DB.deleteRoutine(id);
    DB.addChangeLog({ action: 'Deleted', details: `Routine "${routine?.name}" deleted`, by: Auth.getUser().name });
    showToast('Routine deleted.', 'warning');
    this.navigate('routines');
  },

  renderApprovals() {
    const pending  = DB.getUsers().filter(u => u.status === 'pending');
    const approved = DB.getUsers().filter(u => u.status === 'approved' && u.role !== 'admin');

    return `
      <div class="section-header">
        <div><h2>Account Approvals</h2><p>Review new user registrations</p></div>
      </div>

      <div class="tabs">
        <button class="tab-btn active" onclick="Admin.filterApprovals('pending', this)">
          Pending (${pending.length})
        </button>
        <button class="tab-btn" onclick="Admin.filterApprovals('approved', this)">
          Approved (${approved.length})
        </button>
      </div>

      <div id="approvals-list">
        ${this.renderApprovalsList(pending)}
      </div>
    `;
  },

  renderApprovalsList(users) {
    if (users.length === 0) return `
      <div class="empty-state">
        <div class="empty-icon">✅</div>
        <h3>All Clear</h3>
        <p>No accounts waiting for review.</p>
      </div>
    `;

    return users.map(u => `
      <div class="request-card ${u.status === 'pending' ? 'pending' : 'approved'}" style="margin-bottom:14px;">
        <div class="request-header">
          <div style="display:flex;align-items:center;gap:12px;">
            <div class="user-avatar avatar-${u.role}" style="width:42px;height:42px;font-size:16px;flex-shrink:0;">
              ${u.name.charAt(0)}
            </div>
            <div>
              <h4 style="font-size:15px;">${u.name}</h4>
              <div style="font-size:12px;color:var(--muted);">${u.email}</div>
            </div>
          </div>
          <span class="badge badge-${u.status === 'pending' ? 'warning' : 'success'}">
            ${u.status === 'pending' ? '⏳ Pending' : '✅ Approved'}
          </span>
        </div>
        <div class="request-meta" style="margin-top:10px;">
          <span class="badge badge-info" style="margin-right:6px;">
            ${u.role === 'teacher' ? '👨‍🏫' : '🎓'} ${u.role.charAt(0).toUpperCase() + u.role.slice(1)}
          </span>
          <span class="badge badge-primary" style="margin-right:6px;">🏢 ${u.department || '—'}</span>
          ${u.year     ? `<span class="badge badge-info" style="margin-right:6px;">📅 ${u.year}</span>` : ''}
          ${u.semester ? `<span class="badge badge-info">🗓️ ${u.semester}</span>` : ''}
          ${u.subjects?.length ? `<div style="margin-top:6px;font-size:12px;color:var(--muted);">📚 ${u.subjects.join(', ')}</div>` : ''}
        </div>
        ${u.status === 'pending' ? `
          <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">
            <button class="btn btn-success btn-sm" onclick="Admin.approveUser('${u.id}')">
              ✅ Approve Account
            </button>
            <button class="btn btn-danger btn-sm" onclick="Admin.rejectUser('${u.id}')">
              ❌ Reject & Delete
            </button>
          </div>
        ` : `
          <div style="margin-top:10px;">
            <button class="btn btn-danger btn-sm" onclick="Admin.deleteUser('${u.id}')">🗑 Remove</button>
          </div>
        `}
      </div>
    `).join('');
  },

  filterApprovals(status, btn) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const users = status === 'pending'
      ? DB.getUsers().filter(u => u.status === 'pending')
      : DB.getUsers().filter(u => u.status === 'approved' && u.role !== 'admin');
    document.getElementById('approvals-list').innerHTML = this.renderApprovalsList(users);
  },

  approveUser(id) {
    const user = DB.getUserById(id);
    if (!user) return;
    DB.updateUser(id, { status: 'approved' });
    DB.addNotification({
      type: 'info',
      targetUserId: id,
      title: 'Account Approved!',
      message: `Your ${user.role} account has been approved. You can now sign in.`,
      icon: '✅'
    });
    DB.addChangeLog({ action: 'Account Approved', details: `${user.name} (${user.role}) approved`, by: Auth.getUser().name });
    showToast(`${user.name}'s account approved!`, 'success');
    this.navigate('approvals');
  },

  rejectUser(id) {
    const user = DB.getUserById(id);
    if (!confirm(`Reject and delete ${user?.name}'s registration?`)) return;
    DB.deleteUser(id);
    DB.addChangeLog({ action: 'Account Rejected', details: `${user?.name} (${user?.role}) rejected`, by: Auth.getUser().name });
    showToast(`Registration rejected and removed.`, 'warning');
    this.navigate('approvals');
  },

  renderDepartments() {
    const depts = DB.getDepartments();
    const users    = DB.getUsers();
    const routines = DB.getRoutines();

    return `
      <div class="section-header">
        <div><h2>Departments</h2><p>Manage department names used across the system</p></div>
        <button class="btn btn-primary" onclick="Admin.showAddDeptModal()">➕ Add Department</button>
      </div>

      <div class="card">
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Department Name</th>
                <th>Teachers</th>
                <th>Students</th>
                <th>Routines</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${depts.length === 0
                ? `<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:32px;">No departments found.</td></tr>`
                : depts.map((dept, i) => {
                    const teacherCount  = users.filter(u => u.role === 'teacher' && u.department === dept).length;
                    const studentCount  = users.filter(u => u.role === 'student' && u.department === dept).length;
                    const routineCount  = routines.filter(r => r.department === dept).length;
                    return `
                      <tr>
                        <td style="color:var(--muted);font-size:12px;">${i + 1}</td>
                        <td>
                          <div style="display:flex;align-items:center;gap:10px;">
                            <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,var(--primary),var(--accent));display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px;font-weight:700;flex-shrink:0;">
                              ${dept.charAt(0)}
                            </div>
                            <strong style="font-size:14px;">${dept}</strong>
                          </div>
                        </td>
                        <td><span class="badge badge-success">👨‍🏫 ${teacherCount}</span></td>
                        <td><span class="badge badge-info">🎓 ${studentCount}</span></td>
                        <td><span class="badge badge-primary">📋 ${routineCount}</span></td>
                        <td>
                          <div style="display:flex;gap:8px;">
                            <button class="btn btn-warning btn-sm" onclick="Admin.showRenameDeptModal('${dept}')">✏️ Rename</button>
                            <button class="btn btn-danger btn-sm" onclick="Admin.deleteDept('${dept}', ${teacherCount + studentCount + routineCount})"
                              ${teacherCount + studentCount + routineCount > 0 ? 'title="Has linked records — will unlink them"' : ''}>
                              🗑 Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    `;
                  }).join('')
              }
            </tbody>
          </table>
        </div>
      </div>

      <div class="card" style="margin-top:16px;padding:16px 20px;background:#f0f9ff;border:1px solid #bae6fd;">
        <div style="font-size:13px;color:#0369a1;">
          <strong>ℹ️ Note:</strong> Renaming a department automatically updates all linked teachers, students, and routines.
          Deleting a department does <strong>not</strong> delete linked records — their department field will simply no longer match a valid department.
        </div>
      </div>
    `;
  },

  showAddDeptModal() {
    showModal(`
      <div class="modal-header">
        <h3>🏢 Add Department</h3>
        <button class="modal-close" onclick="closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>Department Name</label>
          <input type="text" id="new-dept-name" placeholder="e.g. Mechanical Engineering" autofocus />
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="Admin.saveNewDept()">➕ Add</button>
      </div>
    `);
    setTimeout(() => document.getElementById('new-dept-name')?.focus(), 100);
  },

  saveNewDept() {
    const name = document.getElementById('new-dept-name')?.value?.trim();
    if (!name) { showToast('Please enter a department name.', 'error'); return; }
    const added = DB.addDepartment(name);
    if (!added) { showToast(`"${name}" already exists.`, 'error'); return; }
    DB.addChangeLog({ action: 'Dept Added', details: `Department "${name}" added`, by: Auth.getUser().name });
    closeModal();
    showToast(`Department "${name}" added!`, 'success');
    this.navigate('departments');
  },

  showRenameDeptModal(oldName) {
    showModal(`
      <div class="modal-header">
        <h3>✏️ Rename Department</h3>
        <button class="modal-close" onclick="closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>Current Name</label>
          <input type="text" value="${oldName}" disabled style="background:var(--bg);color:var(--muted);" />
        </div>
        <div class="form-group">
          <label>New Name</label>
          <input type="text" id="rename-dept-name" value="${oldName}" />
        </div>
        <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:10px 14px;font-size:12px;color:#92400e;margin-top:4px;">
          ⚠️ All teachers, students, and routines linked to <strong>${oldName}</strong> will be updated automatically.
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
        <button class="btn btn-warning" onclick="Admin.confirmRenameDept('${oldName}')">✏️ Rename</button>
      </div>
    `);
    setTimeout(() => {
      const el = document.getElementById('rename-dept-name');
      if (el) { el.focus(); el.select(); }
    }, 100);
  },

  confirmRenameDept(oldName) {
    const newName = document.getElementById('rename-dept-name')?.value?.trim();
    if (!newName)           { showToast('Please enter a new name.', 'error'); return; }
    if (newName === oldName){ showToast('Name is the same — nothing changed.', 'warning'); return; }
    const existing = DB.getDepartments();
    if (existing.includes(newName)) { showToast(`"${newName}" already exists.`, 'error'); return; }

    DB.renameDepartment(oldName, newName);
    DB.addChangeLog({ action: 'Dept Renamed', details: `"${oldName}" → "${newName}"`, by: Auth.getUser().name });
    closeModal();
    showToast(`Renamed "${oldName}" to "${newName}". All records updated.`, 'success');
    this.navigate('departments');
  },

  deleteDept(name, linkedCount) {
    const msg = linkedCount > 0
      ? `Delete "${name}"?\n\n${linkedCount} record(s) are linked to this department. They will NOT be deleted but will no longer match a valid department.`
      : `Delete department "${name}"?`;
    if (!confirm(msg)) return;
    DB.deleteDepartment(name);
    DB.addChangeLog({ action: 'Dept Deleted', details: `Department "${name}" deleted`, by: Auth.getUser().name });
    showToast(`Department "${name}" deleted.`, 'warning');
    this.navigate('departments');
  },

  renderTeachers() {
    const teachers = DB.getUsersByRole('teacher');
    return `
      <div class="section-header">
        <div><h2>Teachers</h2><p>Manage teacher accounts</p></div>
        <button class="btn btn-primary" onclick="Admin.showAddUserModal('teacher')">➕ Add Teacher</button>
      </div>
      <div class="card">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Department</th><th>Designation</th><th>Faculty Type</th><th>Subjects</th><th>Actions</th></tr></thead>
            <tbody>
              ${teachers.length === 0 ? `<tr><td colspan="7" style="text-align:center;color:var(--muted);">No teachers found.</td></tr>` :
                teachers.map(t => `
                  <tr>
                    <td><div style="display:flex;align-items:center;gap:10px;">
                      <div class="user-avatar avatar-teacher" style="width:32px;height:32px;font-size:13px;">${t.name.charAt(0)}</div>
                      <strong>${t.name}</strong>
                    </div></td>
                    <td>${t.email}</td>
                    <td><span class="badge badge-info">${t.department || '—'}</span></td>
                    <td><span class="badge badge-primary">${t.designation || '—'}</span></td>
                    <td><span class="badge ${t.facultyType === 'Permanent' ? 'badge-success' : 'badge-warning'}">${t.facultyType || '—'}</span></td>
                    <td>${(t.subjects || []).join(', ') || '—'}</td>
                    <td>
                      <button class="btn btn-outline btn-sm" onclick="Admin.editUser('${t.id}')">✏️ Edit</button>
                      <button class="btn btn-danger btn-sm" onclick="Admin.deleteUser('${t.id}')">🗑</button>
                    </td>
                  </tr>
                `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  renderStudents() {
    const students = DB.getUsersByRole('student');
    return `
      <div class="section-header">
        <div><h2>Students</h2><p>Manage student accounts</p></div>
        <button class="btn btn-primary" onclick="Admin.showAddUserModal('student')">➕ Add Student</button>
      </div>
      <div class="card">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Department</th><th>Year</th><th>Semester</th><th>Actions</th></tr></thead>
            <tbody>
              ${students.length === 0 ? `<tr><td colspan="6" style="text-align:center;color:var(--muted);">No students found.</td></tr>` :
                students.map(s => `
                  <tr>
                    <td><div style="display:flex;align-items:center;gap:10px;">
                      <div class="user-avatar avatar-student" style="width:32px;height:32px;font-size:13px;">${s.name.charAt(0)}</div>
                      <strong>${s.name}</strong>
                    </div></td>
                    <td>${s.email}</td>
                    <td><span class="badge badge-info">${s.department || '—'}</span></td>
                    <td>${s.year || '—'}</td>
                    <td>${s.semester || '—'}</td>
                    <td>
                      <button class="btn btn-outline btn-sm" onclick="Admin.editUser('${s.id}')">✏️ Edit</button>
                      <button class="btn btn-danger btn-sm" onclick="Admin.deleteUser('${s.id}')">🗑</button>
                    </td>
                  </tr>
                `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  showAddUserModal(role) {
    const isTeacher = role === 'teacher';
    showModal(`
      <div class="modal-header">
        <h3>➕ Add ${isTeacher ? 'Teacher' : 'Student'}</h3>
        <button class="modal-close" onclick="closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-grid">
          <div class="form-group full"><label>Full Name</label><input type="text" id="nu-name" placeholder="Full name" /></div>
          <div class="form-group"><label>Email</label><input type="email" id="nu-email" placeholder="Email address" /></div>
          <div class="form-group"><label>Password</label><input type="password" id="nu-pass" placeholder="Password" /></div>
          <div class="form-group"><label>Department</label>
            <select id="nu-dept">${DB.getDepartments().map(d => `<option>${d}</option>`).join('')}</select>
          </div>
          ${isTeacher ? `
            <div class="form-group">
              <label>Designation</label>
              <select id="nu-designation">
                <option value="">-- Select --</option>
                ${DESIGNATIONS.map(d => `<option>${d}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Faculty Type</label>
              <select id="nu-faculty-type">
                ${FACULTY_TYPES.map(f => `<option>${f}</option>`).join('')}
              </select>
            </div>
            <div class="form-group full"><label>Subjects (comma separated)</label>
              <input type="text" id="nu-subjects" placeholder="e.g. Math, Physics" />
            </div>
          ` : `
            <div class="form-group"><label>Year</label>
              <select id="nu-year">${YEARS.map(y => `<option>${y}</option>`).join('')}</select>
            </div>
            <div class="form-group"><label>Semester</label>
              <select id="nu-semester">${SEMESTERS.map(s => `<option>${s}</option>`).join('')}</select>
            </div>
          `}
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="Admin.saveNewUser('${role}')">Save</button>
      </div>
    `);
  },

  saveNewUser(role) {
    const name  = document.getElementById('nu-name')?.value?.trim();
    const email = document.getElementById('nu-email')?.value?.trim();
    const pass  = document.getElementById('nu-pass')?.value;
    const dept  = document.getElementById('nu-dept')?.value;
    if (!name || !email || !pass) { showToast('Please fill all required fields.', 'error'); return; }

    const userData = { name, email, password: pass, role, department: dept };
    if (role === 'teacher') {
      const subj = document.getElementById('nu-subjects')?.value;
      userData.subjects    = subj ? subj.split(',').map(s => s.trim()) : [];
      userData.designation = document.getElementById('nu-designation')?.value || '';
      userData.facultyType = document.getElementById('nu-faculty-type')?.value || 'Permanent';
    } else {
      userData.year     = document.getElementById('nu-year')?.value;
      userData.semester = document.getElementById('nu-semester')?.value;
    }
    DB.addUser(userData);
    closeModal();
    showToast(`${role.charAt(0).toUpperCase() + role.slice(1)} added!`, 'success');
    this.navigate(role === 'teacher' ? 'teachers' : 'students');
  },

  editUser(id) {
    const user = DB.getUserById(id);
    if (!user) return;
    const isTeacher = user.role === 'teacher';
    showModal(`
      <div class="modal-header">
        <h3>✏️ Edit — ${user.name}</h3>
        <button class="modal-close" onclick="closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-grid">
          <div class="form-group full"><label>Full Name</label><input type="text" id="eu-name" value="${user.name}" /></div>
          <div class="form-group"><label>Email</label><input type="email" id="eu-email" value="${user.email}" /></div>
          <div class="form-group"><label>New Password (leave blank to keep)</label><input type="password" id="eu-pass" placeholder="New password" /></div>
          <div class="form-group"><label>Department</label>
            <select id="eu-dept">${DB.getDepartments().map(d => `<option ${d === user.department ? 'selected' : ''}>${d}</option>`).join('')}</select>
          </div>
          ${isTeacher ? `
            <div class="form-group">
              <label>Designation</label>
              <select id="eu-designation">
                <option value="">-- Select --</option>
                ${DESIGNATIONS.map(d => `<option ${d === user.designation ? 'selected' : ''}>${d}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Faculty Type</label>
              <select id="eu-faculty-type">
                ${FACULTY_TYPES.map(f => `<option ${f === user.facultyType ? 'selected' : ''}>${f}</option>`).join('')}
              </select>
            </div>
            <div class="form-group full">
              <label>Subjects (comma separated)</label>
              <input type="text" id="eu-subjects" value="${(user.subjects || []).join(', ')}" placeholder="e.g. Math, Physics" />
            </div>
          ` : ''}
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="Admin.saveEditUser('${id}')">Save</button>
      </div>
    `);
  },

  saveEditUser(id) {
    const user = DB.getUserById(id);
    const updates = {
      name:       document.getElementById('eu-name').value.trim(),
      email:      document.getElementById('eu-email').value.trim(),
      department: document.getElementById('eu-dept').value
    };
    const newPass = document.getElementById('eu-pass').value;
    if (newPass) updates.password = newPass;

    // Teacher-specific fields
    if (user.role === 'teacher') {
      updates.designation = document.getElementById('eu-designation')?.value || '';
      updates.facultyType = document.getElementById('eu-faculty-type')?.value || 'Permanent';
      const subj = document.getElementById('eu-subjects')?.value || '';
      updates.subjects = subj ? subj.split(',').map(s => s.trim()).filter(Boolean) : [];
    }

    DB.updateUser(id, updates);
    closeModal();
    showToast('User updated!', 'success');
    this.navigate(user.role === 'teacher' ? 'teachers' : 'students');
  },

  deleteUser(id) {
    const user = DB.getUserById(id);
    if (!confirm(`Delete user "${user?.name}"?`)) return;
    DB.deleteUser(id);
    showToast('User deleted.', 'warning');
    this.navigate(user.role === 'teacher' ? 'teachers' : 'students');
  },

  renderAbsentRequests() {
    const requests = DB.getAbsentRequests().sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    const teachers = DB.getUsersByRole('teacher');

    return `
      <div class="section-header">
        <div><h2>Absent Requests</h2><p>Review and manage teacher absence requests</p></div>
      </div>
      <div class="tabs">
        <button class="tab-btn active" onclick="Admin.filterAbsent('all', this)">All (${requests.length})</button>
        <button class="tab-btn" onclick="Admin.filterAbsent('pending', this)">Pending (${requests.filter(r=>r.status==='pending').length})</button>
        <button class="tab-btn" onclick="Admin.filterAbsent('approved', this)">Approved (${requests.filter(r=>r.status==='approved').length})</button>
        <button class="tab-btn" onclick="Admin.filterAbsent('rejected', this)">Rejected (${requests.filter(r=>r.status==='rejected').length})</button>
      </div>
      <div id="absent-list">
        ${this.renderAbsentList(requests)}
      </div>
    `;
  },

  renderAbsentList(requests) {
    if (requests.length === 0) return `
      <div class="empty-state">
        <div class="empty-icon">📩</div>
        <h3>No Requests</h3>
        <p>No absent requests found.</p>
      </div>
    `;

    return requests.map(r => {
      const teacher = DB.getUserById(r.teacherId);
      const sub     = r.substituteTeacherId ? DB.getUserById(r.substituteTeacherId) : null;
      return `
        <div class="request-card ${r.status}">
          <div class="request-header">
            <h4>👤 ${teacher?.name || 'Unknown Teacher'}</h4>
            <span class="badge badge-${r.status === 'pending' ? 'warning' : r.status === 'approved' ? 'success' : 'danger'}">
              ${r.status.charAt(0).toUpperCase() + r.status.slice(1)}
            </span>
          </div>
          <div class="request-meta">
            📅 Date: <strong>${r.date}</strong> &nbsp;|&nbsp;
            📚 Subject: <strong>${r.subject}</strong> &nbsp;|&nbsp;
            ⏰ Period: <strong>${r.period}</strong> &nbsp;|&nbsp;
            🏫 Routine: <strong>${r.routineName || '—'}</strong>
          </div>
          <div class="request-msg">${r.message}</div>
          ${sub ? `<div style="font-size:12px;color:var(--success);margin-bottom:8px;">✅ Substitute: <strong>${sub.name}</strong></div>` : ''}
          ${r.status === 'pending' ? `
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <button class="btn btn-success btn-sm" onclick="Admin.approveAbsent('${r.id}')">✓ Approve & Assign Substitute</button>
              <button class="btn btn-danger btn-sm" onclick="Admin.rejectAbsent('${r.id}')">✗ Reject</button>
            </div>
          ` : ''}
          <div style="font-size:11px;color:var(--muted);margin-top:8px;">
            Submitted: ${new Date(r.createdAt).toLocaleString()}
          </div>
        </div>
      `;
    }).join('');
  },

  filterAbsent(status, btn) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const all = DB.getAbsentRequests().sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    const filtered = status === 'all' ? all : all.filter(r => r.status === status);
    document.getElementById('absent-list').innerHTML = this.renderAbsentList(filtered);
  },

  approveAbsent(id) {
    const req      = DB.getAbsentRequests().find(r => r.id === id);
    const teachers = DB.getUsersByRole('teacher').filter(t => t.id !== req.teacherId);

    showModal(`
      <div class="modal-header">
        <h3>✅ Approve & Assign Substitute</h3>
        <button class="modal-close" onclick="closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <p style="margin-bottom:16px;font-size:13px;color:var(--muted);">
          Assign a substitute teacher for <strong>${req.subject}</strong> on <strong>${req.date}</strong> (${req.period})
        </p>
        <div class="form-group">
          <label>Select Substitute Teacher</label>
          <select id="sub-teacher">
            <option value="">-- Select Teacher --</option>
            ${teachers.map(t => `<option value="${t.id}">${t.name} (${t.department || 'N/A'})</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
        <button class="btn btn-success" onclick="Admin.confirmApprove('${id}')">✅ Confirm & Notify</button>
      </div>
    `);
  },

  confirmApprove(id) {
    const subId = document.getElementById('sub-teacher').value;
    if (!subId) { showToast('Please select a substitute teacher.', 'error'); return; }

    const req     = DB.getAbsentRequests().find(r => r.id === id);
    const teacher = DB.getUserById(req.teacherId);
    const sub     = DB.getUserById(subId);

    DB.updateAbsentRequest(id, { status: 'approved', substituteTeacherId: subId });

    // Update routine slot with substitute — only in the specific routine
    const routines = DB.getRoutines();
    let affectedRoutine = null;

    // If routineId is stored, always use that routine for targeting students
    if (req.routineId) {
      affectedRoutine = DB.getRoutineById(req.routineId);
    }

    routines.forEach(routine => {
      // Match by routineId if stored, otherwise match by teacherId + period
      const isTarget = req.routineId
        ? routine.id === req.routineId
        : routine.slots.some(s => s.teacherId === req.teacherId && s.period.trim() === req.period.trim());

      if (!isTarget) return;

      let changed = false;
      routine.slots.forEach(slot => {
        // Match by teacher + period (normalized), OR teacher + subject as fallback
        const periodMatch  = slot.period.trim() === req.period.trim();
        const subjectMatch = slot.subject.trim() === req.subject.trim();
        if (slot.teacherId === req.teacherId && (periodMatch || subjectMatch)) {
          slot.substituteTeacherId = subId;
          slot.substituteDate      = req.date;
          changed = true;
        }
      });
      if (changed) {
        DB.updateRoutine(routine.id, { slots: routine.slots });
        affectedRoutine = routine; // override with the actual matched routine
      }
    });

    // ── Notify ONLY students in the affected routine's dept/year/semester ──
    if (affectedRoutine) {
      const { department, year, semester } = affectedRoutine;
      const targetStudents = DB.getUsers().filter(u =>
        u.role       === 'student'   &&
        u.department === department  &&
        u.year       === year        &&
        u.semester   === semester
      );

      if (targetStudents.length > 0) {
        targetStudents.forEach(student => {
          DB.addNotification({
            type:         'change',
            targetUserId: student.id,          // ← individual, not broadcast
            title:        'Class Change Notification',
            message:      `Your ${req.subject} class on ${req.date} (${req.period}) will be taken by ${sub.name} instead of ${teacher.name}. [${department} · ${year} · ${semester}]`,
            icon:         '🔄'
          });
        });
      } else {
        // Fallback: no matching students found — still log it
        DB.addNotification({
          type:         'change',
          targetUserId: null,
          targetRole:   null,
          title:        'Class Change (No matching students)',
          message:      `${req.subject} on ${req.date} — substitute ${sub.name} assigned. No students matched ${department} · ${year} · ${semester}.`,
          icon:         '🔄'
        });
      }
    }

    // ── Notify substitute teacher ──
    DB.addNotification({
      type:         'info',
      targetUserId: subId,
      title:        'You have been assigned a class',
      message:      `You are assigned to take ${req.subject} on ${req.date} (${req.period}) as a substitute for ${teacher.name}${affectedRoutine ? ` [${affectedRoutine.department} · ${affectedRoutine.year} · ${affectedRoutine.semester}]` : ''}.`,
      icon:         '📌'
    });

    DB.addChangeLog({
      action:  'Substitute Assigned',
      details: `${sub.name} assigned for ${req.subject} on ${req.date} (${req.period}) replacing ${teacher.name}${affectedRoutine ? ` — ${affectedRoutine.department} ${affectedRoutine.year} ${affectedRoutine.semester}` : ''}`,
      by:      Auth.getUser().name
    });

    const studentCount = affectedRoutine
      ? DB.getUsers().filter(u =>
          u.role === 'student' &&
          u.department === affectedRoutine.department &&
          u.year       === affectedRoutine.year &&
          u.semester   === affectedRoutine.semester
        ).length
      : 0;

    closeModal();
    showToast(
      `Approved! ${sub.name} assigned. ${studentCount} student${studentCount !== 1 ? 's' : ''} in ${affectedRoutine?.department || ''} ${affectedRoutine?.year || ''} notified.`,
      'success'
    );
    this.navigate('absent');
  },

  rejectAbsent(id) {
    if (!confirm('Reject this absent request?')) return;
    DB.updateAbsentRequest(id, { status: 'rejected' });
    showToast('Request rejected.', 'warning');
    this.navigate('absent');
  },

  renderChangelog() {
    const logs = DB.getChangelog();
    return `
      <div class="section-header">
        <div><h2>Change Log</h2><p>History of all schedule changes</p></div>
      </div>
      <div class="card">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Date & Time</th><th>Action</th><th>Details</th><th>By</th></tr></thead>
            <tbody>
              ${logs.length === 0 ? `<tr><td colspan="4" style="text-align:center;color:var(--muted);">No changes recorded yet.</td></tr>` :
                logs.map(c => `
                  <tr>
                    <td style="white-space:nowrap;">${new Date(c.createdAt).toLocaleString()}</td>
                    <td><span class="badge badge-info">${c.action}</span></td>
                    <td>${c.details}</td>
                    <td>${c.by}</td>
                  </tr>
                `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  renderNotifPanel() {
    const user  = Auth.getUser();
    const notifs = DB.getNotifications().filter(n =>
      n.targetUserId === user.id || n.targetRole === 'admin' || n.targetRole === 'all'
    ).slice(0, 20);

    return `
      <div class="notif-panel-header">
        <h4>🔔 Notifications</h4>
        <button class="btn btn-outline btn-sm" onclick="Admin.markAllRead()">Mark all read</button>
      </div>
      <div class="notif-list">
        ${notifs.length === 0 ? '<div style="padding:20px;text-align:center;color:var(--muted);font-size:13px;">No notifications</div>' :
          notifs.map(n => `
            <div class="notif-item ${n.read ? '' : 'unread'}" onclick="DB.markNotifRead('${n.id}')">
              <div class="notif-icon ${n.type}">${n.icon || '🔔'}</div>
              <div class="notif-content">
                <p><strong>${n.title}</strong><br>${n.message}</p>
                <span>${new Date(n.createdAt).toLocaleString()}</span>
              </div>
            </div>
          `).join('')}
      </div>
    `;
  },

  toggleNotif() {
    const panel = document.getElementById('notif-panel');
    panel.classList.toggle('open');
    if (panel.classList.contains('open')) {
      panel.innerHTML = this.renderNotifPanel();
    }
  },

  markAllRead() {
    DB.markAllNotifsRead(Auth.getUser().id);
    document.getElementById('notif-panel').innerHTML = this.renderNotifPanel();
    showToast('All notifications marked as read.', 'info');
  },

  // ===== PROFILE =====
  renderProfile() {
    const user = Auth.getUser();
    return `
      <div class="section-header">
        <div><h2>My Profile</h2><p>Update your account details</p></div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">

        <!-- Change Name Card -->
        <div class="card">
          <div class="card-header"><h3>👤 Change Name</h3></div>
          <div class="card-body">
            <div class="form-group">
              <label>Current Name</label>
              <input type="text" value="${user.name}" disabled style="background:var(--bg);color:var(--muted);" />
            </div>
            <div class="form-group">
              <label>New Name</label>
              <input type="text" id="profile-name" value="${user.name}" placeholder="Enter new name" />
            </div>
            <button class="btn btn-primary" onclick="Admin.saveProfileName()">💾 Update Name</button>
          </div>
        </div>

        <!-- Change Password Card -->
        <div class="card">
          <div class="card-header"><h3>🔑 Change Password</h3></div>
          <div class="card-body">
            <div class="form-group">
              <label>Current Password</label>
              <input type="password" id="profile-current-pw" placeholder="Enter current password" />
            </div>
            <div class="form-group">
              <label>New Password</label>
              <input type="password" id="profile-new-pw" placeholder="Min. 6 characters" />
            </div>
            <div class="form-group">
              <label>Confirm New Password</label>
              <input type="password" id="profile-confirm-pw" placeholder="Re-enter new password" />
            </div>
            <button class="btn btn-primary" onclick="Admin.saveProfilePassword()">🔑 Update Password</button>
          </div>
        </div>

      </div>

      <!-- Account Info -->
      <div class="card" style="margin-top:24px;">
        <div class="card-header"><h3>ℹ️ Account Information</h3></div>
        <div class="card-body">
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;">
            <div>
              <div style="font-size:12px;color:var(--muted);margin-bottom:4px;">Email</div>
              <div style="font-size:14px;font-weight:600;">${user.email}</div>
            </div>
            <div>
              <div style="font-size:12px;color:var(--muted);margin-bottom:4px;">Role</div>
              <div style="font-size:14px;font-weight:600;text-transform:capitalize;">🛡️ ${user.role}</div>
            </div>
            <div>
              <div style="font-size:12px;color:var(--muted);margin-bottom:4px;">User ID</div>
              <div style="font-size:14px;font-weight:600;font-family:monospace;">${user.id}</div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  saveProfileName() {
    const newName = document.getElementById('profile-name').value.trim();
    if (!newName) { showToast('Name cannot be empty.', 'error'); return; }

    const user = Auth.getUser();
    if (newName === user.name) { showToast('Name is the same — nothing changed.', 'warning'); return; }

    DB.updateUser(user.id, { name: newName });

    // Update session
    user.name = newName;
    Auth.currentUser = user;
    sessionStorage.setItem('rms_current_user', JSON.stringify(user));

    DB.addChangeLog({ action: 'Profile Updated', details: `Admin name changed to "${newName}"`, by: newName });
    showToast('Name updated successfully!', 'success');

    // Re-render to reflect new name in sidebar/topbar
    this.render();
    this.navigate('profile');
  },

  saveProfilePassword() {
    const user      = Auth.getUser();
    const currentPw = document.getElementById('profile-current-pw').value;
    const newPw     = document.getElementById('profile-new-pw').value;
    const confirmPw = document.getElementById('profile-confirm-pw').value;

    if (!currentPw) { showToast('Please enter your current password.', 'error'); return; }
    if (!newPw)     { showToast('Please enter a new password.', 'error'); return; }
    if (newPw.length < 6) { showToast('New password must be at least 6 characters.', 'error'); return; }
    if (newPw !== confirmPw) { showToast('New passwords do not match.', 'error'); return; }

    // Verify current password
    const freshUser = DB.getUserById(user.id);
    if (freshUser.password !== currentPw) {
      showToast('Current password is incorrect.', 'error');
      return;
    }

    if (newPw === currentPw) { showToast('New password must be different from current.', 'warning'); return; }

    DB.updateUser(user.id, { password: newPw });

    // Update session
    user.password = newPw;
    Auth.currentUser = user;
    sessionStorage.setItem('rms_current_user', JSON.stringify(user));

    DB.addChangeLog({ action: 'Password Changed', details: 'Admin password updated', by: user.name });
    showToast('Password changed successfully!', 'success');
    this.navigate('profile');
  }
};
