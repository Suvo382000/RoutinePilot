// ===== TEACHER MODULE =====
const Teacher = {
  currentSection: 'my-routine',

  render() {
    const user   = Auth.getUser();
    const unread = DB.getUnreadCount(user.id, 'teacher');

    document.getElementById('app').innerHTML = `
      <div class="layout">
        ${this.renderSidebar(unread)}
        <div class="main-content">
          ${this.renderTopbar(unread)}
          <div class="page-body" id="teacher-page-body">
            ${this.renderMyRoutine()}
          </div>
        </div>
      </div>
      <div class="toast-container" id="toast-container"></div>
      <div class="notif-panel" id="notif-panel">${this.renderNotifPanel()}</div>
    `;
  },

  renderSidebar(unread) {
    const user = Auth.getUser();
    return `
      <aside class="sidebar">
        <div class="sidebar-header">
          <div class="sidebar-brand">
            <div class="brand-icon">📅</div>
            <div><h2>RoutinePilot</h2><span>Smart Scheduling</span></div>
          </div>
        </div>
        <div class="sidebar-user">
          <div class="user-avatar avatar-teacher">${user.name.charAt(0)}</div>
          <div class="user-info"><h4>${user.name}</h4><span>Teacher</span></div>
        </div>
        <nav class="sidebar-nav">
          <div class="nav-section-title">My Schedule</div>
          <button class="nav-item active" id="nav-my-routine" onclick="Teacher.navigate('my-routine')">
            <span class="nav-icon">📋</span> My Routine
          </button>
          <button class="nav-item" id="nav-send-absent" onclick="Teacher.navigate('send-absent')">
            <span class="nav-icon">📩</span> Report Absence
          </button>
          <button class="nav-item" id="nav-my-requests" onclick="Teacher.navigate('my-requests')">
            <span class="nav-icon">📜</span> My Requests
          </button>
          <div class="nav-section-title">Notifications</div>
          <button class="nav-item" id="nav-notifications" onclick="Teacher.navigate('notifications')">
            <span class="nav-icon">🔔</span> Notifications
            ${unread > 0 ? `<span class="nav-badge">${unread}</span>` : ''}
          </button>
        </nav>
        <div class="sidebar-footer">
          <button class="nav-item" onclick="App.logout()">
            <span class="nav-icon">🚪</span> Logout
          </button>
        </div>
      </aside>
    `;
  },

  renderTopbar(unread) {
    const user = Auth.getUser();
    unread = unread ?? DB.getUnreadCount(user.id, 'teacher');
    return `
      <div class="topbar">
        <div class="topbar-title">
          <h2 id="page-title">My Routine</h2>
          <p id="page-subtitle">${user.department || ''} Department</p>
        </div>
        <div class="topbar-actions">
          <button class="notif-btn" onclick="Teacher.toggleNotif()">
            🔔 ${unread > 0 ? '<span class="notif-dot"></span>' : ''}
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
      'my-routine':    ['My Routine',       'Your class schedule'],
      'send-absent':   ['Report Absence',   'Notify admin of your absence'],
      'my-requests':   ['My Requests',      'Track your absence requests'],
      'notifications': ['Notifications',    'Updates and alerts']
    };
    const [title, subtitle] = titles[section] || ['Teacher', ''];
    document.getElementById('page-title').textContent    = title;
    document.getElementById('page-subtitle').textContent = subtitle;

    const body = document.getElementById('teacher-page-body');
    switch (section) {
      case 'my-routine':    body.innerHTML = this.renderMyRoutine();    break;
      case 'send-absent':   body.innerHTML = this.renderSendAbsent();   break;
      case 'my-requests':   body.innerHTML = this.renderMyRequests();   break;
      case 'notifications': body.innerHTML = this.renderNotifications();break;
    }
  },

  getMySlots() {
    const user = Auth.getUser();
    const mySlots = [];
    DB.getRoutines().forEach(routine => {
      routine.slots.forEach(slot => {
        if (slot.teacherId === user.id || slot.substituteTeacherId === user.id) {
          mySlots.push({ ...slot, routineId: routine.id, routineName: routine.name,
            isSubstitute: slot.substituteTeacherId === user.id });
        }
      });
    });
    return mySlots;
  },

  renderMyRoutine() {
    const user   = Auth.getUser();
    const todayFull = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()];
    const today  = DAYS.includes(todayFull) ? todayFull : '';
    const mySlots = this.getMySlots();

    if (mySlots.length === 0) return `
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <h3>No Classes Assigned</h3>
        <p>You have no classes in the current schedule.</p>
      </div>
    `;

    // Build slot map per routine
    const routineMap = {};
    mySlots.forEach(slot => {
      if (!routineMap[slot.routineId]) routineMap[slot.routineId] = { name: slot.routineName, slots: [] };
      routineMap[slot.routineId].slots.push(slot);
    });

    // Today's classes
    const todaySlots = mySlots.filter(s => s.day === today);

    return `
      ${todaySlots.length > 0 ? `
        <div class="card" style="margin-bottom:20px;border-left:4px solid var(--primary);">
          <div class="card-header"><h3>📍 Today's Classes — ${today}</h3></div>
          <div class="card-body">
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;">
              ${todaySlots.map(s => {
                const isLab = s.classType === 'practical' || isLabPeriod(s.period);
                return `
                <div style="background:${isLab?'linear-gradient(135deg,#f3e8ff,#e0e7ff)':'linear-gradient(135deg,#ede9fe,#e0f2fe)'};border-radius:12px;padding:16px;${isLab?'border:2px solid #a78bfa;':''}">
                  <div style="font-size:10px;font-weight:700;margin-bottom:4px;${isLab?'color:#7c3aed;':'color:#2563eb;'}">
                    ${isLab ? '🔬 PRACTICAL' : '📖 THEORY'}
                  </div>
                  <div style="font-size:16px;font-weight:700;color:${isLab?'#6d28d9':'var(--primary)'};">${s.subject}</div>
                  <div style="font-size:13px;color:var(--muted);margin-top:4px;">⏰ ${s.period}</div>
                  <div style="font-size:13px;color:var(--muted);">🚪 ${s.room}</div>
                  <div style="font-size:11px;color:var(--accent);margin-top:6px;">${s.routineName}</div>
                  ${s.isSubstitute ? '<span class="badge badge-warning" style="margin-top:6px;">Substitute</span>' : ''}
                </div>
              `}).join('')}
            </div>
          </div>
        </div>
      ` : `
        <div class="card" style="margin-bottom:20px;border-left:4px solid var(--muted);">
          <div class="card-body" style="padding:16px 24px;">
            <p style="color:var(--muted);font-size:13px;">📅 No classes today (${today}).</p>
          </div>
        </div>
      `}

      ${Object.entries(routineMap).map(([rId, rData]) => `
        <div class="card" style="margin-bottom:20px;">
          <div class="card-header"><h3>📋 ${rData.name}</h3></div>
          <div class="card-body">
            ${this.renderTeacherRoutineTable(rData.slots, today)}
          </div>
        </div>
      `).join('')}
    `;
  },

  renderTeacherRoutineTable(slots, today) {
    const slotMap = {};
    const spanned = {};

    const BREAK_BOUNDARIES = [[2,3],[4,5]];
    function crossesBreak(slotNums) {
      return BREAK_BOUNDARIES.some(([a,b]) => slotNums.includes(a) && slotNums.includes(b));
    }

    slots.forEach(s => {
      const slotNums = getPeriodSlots(s.period);
      if (slotNums.length === 0) return;
      const isConsecutive = slotNums.every((sl, i) => i === 0 || sl === slotNums[i-1] + 1);
      const canSpan = isConsecutive && slotNums.length > 1 && !crossesBreak(slotNums);

      if (canSpan) {
        slotMap[s.day + '|' + slotNums[0]] = { ...s, spanSlots: slotNums };
        slotNums.slice(1).forEach(n => { spanned[s.day + '|' + n] = true; });
      } else {
        let currentGroup = [slotNums[0]];
        for (let i = 1; i < slotNums.length; i++) {
          const prev = slotNums[i-1], curr = slotNums[i];
          const consecutive = curr === prev + 1;
          const crossesBoundary = BREAK_BOUNDARIES.some(([a,b]) => prev === a && curr === b);
          if (consecutive && !crossesBoundary) {
            currentGroup.push(curr);
          } else {
            slotMap[s.day + '|' + currentGroup[0]] = { ...s, spanSlots: currentGroup, labPart: true };
            currentGroup.slice(1).forEach(n => { spanned[s.day + '|' + n] = true; });
            currentGroup = [curr];
          }
        }
        slotMap[s.day + '|' + currentGroup[0]] = { ...s, spanSlots: currentGroup, labPart: true };
        currentGroup.slice(1).forEach(n => { spanned[s.day + '|' + n] = true; });
      }
    });

    // Only show days that have at least one class
    const activeDays = DAYS.filter(d => slots.some(s => s.day === d));
    if (activeDays.length === 0) return '<p style="color:var(--muted);">No slots assigned.</p>';

    return `
      <div class="table-wrap">
        <table class="routine-table">
          <thead>
            <tr>
              <th style="min-width:130px;">Time</th>
              ${activeDays.map(d => `<th class="${d === today ? 'today-col' : ''}">${d}${d === today ? ' 📍' : ''}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${THEORY_PERIODS.map(period => {
              const breakBefore = period.slot === 3
                ? `<tr><td colspan="${activeDays.length + 1}" style="background:#fef9c3;text-align:center;font-size:11px;font-weight:700;color:#92400e;padding:5px;">☕ Short Break — 11:30–11:45 (15 min)</td></tr>`
                : period.slot === 5
                ? `<tr><td colspan="${activeDays.length + 1}" style="background:#dcfce7;text-align:center;font-size:11px;font-weight:700;color:#166534;padding:5px;">🍽️ Lunch Break — 13:45–14:30 (45 min)</td></tr>`
                : '';

              const cells = activeDays.map(day => {
                if (spanned[day + '|' + period.slot]) return '';
                const slot = slotMap[day + '|' + period.slot];
                if (!slot) return `<td class="${day === today ? 'today-col' : ''}"><span class="empty-cell">—</span></td>`;
                const rowspan = slot.spanSlots.length;
                const isLab = slot.classType === 'practical' || isLabPeriod(slot.period);
                const periodInfo = getPeriodInfo(slot.period);
                const allSlots = getPeriodSlots(slot.period);
                const isFirstPart = !slot.labPart || slot.spanSlots[0] === allSlots[0];
                return `
                  <td rowspan="${rowspan}" class="${day === today ? 'today-col' : ''}" style="vertical-align:top;overflow:hidden;">
                    <div class="class-cell ${slot.isSubstitute ? 'changed' : ''} ${isLab ? 'lab-cell' : ''}">
                      <div style="font-size:10px;font-weight:700;margin-bottom:2px;${isLab?'color:#7c3aed;':'color:#2563eb;'}">
                        ${isLab ? '🔬 PRACTICAL' : '📖 THEORY'}
                        ${slot.labPart && !isFirstPart ? '<span style="font-size:9px;opacity:.7;">(cont.)</span>' : ''}
                      </div>
                      <div class="subject">${slot.subject}</div>
                      <div class="room">🚪 ${slot.room}</div>
                      ${isLab && periodInfo?.note && isFirstPart ? `<div style="font-size:10px;color:var(--muted);">⏰ ${periodInfo.note}</div>` : ''}
                      ${slot.isSubstitute ? '<div style="font-size:10px;color:#92400e;font-weight:700;">⚠️ Substitute</div>' : ''}
                    </div>
                  </td>`;
              }).join('');

              return `${breakBefore}<tr>
                <td style="font-weight:700;font-size:11px;background:var(--bg);white-space:nowrap;padding:8px 10px;">
                  ${period.label}<div style="font-size:10px;color:var(--muted);font-weight:400;">Class ${period.slot}</div>
                </td>
                ${cells}
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  renderSendAbsent() {
    const user    = Auth.getUser();
    const mySlots = this.getMySlots();
    const uniqueSubjects = [...new Set(mySlots.map(s => s.subject))];
    const routines = DB.getRoutines();

    return `
      <div class="section-header">
        <div><h2>Report Absence</h2><p>Notify admin that you will be absent</p></div>
      </div>
      <div class="card" style="max-width:600px;">
        <div class="card-header"><h3>📩 Absence Request Form</h3></div>
        <div class="card-body">
          <div class="form-group">
            <label>Date of Absence</label>
            <input type="date" id="ab-date" min="${new Date().toISOString().split('T')[0]}" />
          </div>
          <div class="form-group">
            <label>Select Routine</label>
            <select id="ab-routine" onchange="Teacher.updateAbsentSlots()">
              <option value="">-- Select Routine --</option>
              ${routines.map(r => `<option value="${r.id}">${r.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Subject / Class</label>
            <select id="ab-subject">
              <option value="">-- Select subject first --</option>
              ${uniqueSubjects.map(s => `<option>${s}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Period / Time</label>
            <select id="ab-period">
              <option value="">-- Select period --</option>
              ${[...new Set(mySlots.map(s => s.period))].map(p => `<option value="${p}">${p}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Message to Admin</label>
            <textarea id="ab-message" placeholder="Explain the reason for your absence..."></textarea>
          </div>
          <button class="btn btn-primary" onclick="Teacher.submitAbsent()">📤 Submit Request</button>
        </div>
      </div>
    `;
  },

  updateAbsentSlots() {
    const routineId = document.getElementById('ab-routine').value;
    if (!routineId) return;
    const routine = DB.getRoutineById(routineId);
    const user    = Auth.getUser();
    const mySlots = routine.slots.filter(s => s.teacherId === user.id);

    const subjectEl = document.getElementById('ab-subject');
    const periodEl  = document.getElementById('ab-period');

    const subjects = [...new Set(mySlots.map(s => s.subject))];
    const periods  = [...new Set(mySlots.map(s => s.period))];

    subjectEl.innerHTML = '<option value="">-- Select Subject --</option>' +
      subjects.map(s => `<option value="${s}">${s}</option>`).join('');
    periodEl.innerHTML  = '<option value="">-- Select Period --</option>' +
      periods.map(p => `<option value="${p}">${p}</option>`).join('');
  },

  submitAbsent() {
    const user      = Auth.getUser();
    const date      = document.getElementById('ab-date').value;
    const routineId = document.getElementById('ab-routine').value;
    const subject   = document.getElementById('ab-subject').value;
    const period    = document.getElementById('ab-period').value;
    const message   = document.getElementById('ab-message').value.trim();

    if (!date || !routineId || !subject || !period || !message) {
      showToast('Please fill in all fields.', 'error');
      return;
    }

    const routine = DB.getRoutineById(routineId);
    DB.addAbsentRequest({
      teacherId: user.id,
      routineId,
      routineName: routine?.name || '',
      date, subject, period, message
    });

    // Notify admin
    DB.addNotification({
      type: 'absent',
      targetRole: 'admin',
      title: 'Absence Request',
      message: `${user.name} reported absence for ${subject} on ${date} (${period}).`,
      icon: '📩'
    });

    showToast('Absence request submitted! Admin will be notified.', 'success');
    this.navigate('my-requests');
  },

  renderMyRequests() {
    const user = Auth.getUser();
    const requests = DB.getAbsentRequests()
      .filter(r => r.teacherId === user.id)
      .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

    return `
      <div class="section-header">
        <div><h2>My Absence Requests</h2><p>Track the status of your requests</p></div>
      </div>
      ${requests.length === 0 ? `
        <div class="empty-state">
          <div class="empty-icon">📜</div>
          <h3>No Requests Yet</h3>
          <p>You haven't submitted any absence requests.</p>
        </div>
      ` : requests.map(r => {
        const sub = r.substituteTeacherId ? DB.getUserById(r.substituteTeacherId) : null;
        return `
          <div class="request-card ${r.status}">
            <div class="request-header">
              <h4>📚 ${r.subject}</h4>
              <span class="badge badge-${r.status === 'pending' ? 'warning' : r.status === 'approved' ? 'success' : 'danger'}">
                ${r.status.charAt(0).toUpperCase() + r.status.slice(1)}
              </span>
            </div>
            <div class="request-meta">
              📅 ${r.date} &nbsp;|&nbsp; ⏰ ${r.period} &nbsp;|&nbsp; 🏫 ${r.routineName || '—'}
            </div>
            <div class="request-msg">${r.message}</div>
            ${sub ? `<div style="font-size:13px;color:var(--success);margin-top:6px;">✅ Substitute assigned: <strong>${sub.name}</strong></div>` : ''}
            <div style="font-size:11px;color:var(--muted);margin-top:8px;">
              Submitted: ${new Date(r.createdAt).toLocaleString()}
            </div>
          </div>
        `;
      }).join('')}
    `;
  },

  renderNotifications() {
    const user   = Auth.getUser();
    const notifs = DB.getNotifications().filter(n =>
      n.targetUserId === user.id || n.targetRole === 'teacher' || n.targetRole === 'all'
    );
    DB.markAllNotifsRead(user.id);

    return `
      <div class="section-header">
        <div><h2>Notifications</h2><p>Your updates and alerts</p></div>
      </div>
      ${notifs.length === 0 ? `
        <div class="empty-state">
          <div class="empty-icon">🔔</div>
          <h3>No Notifications</h3>
          <p>You're all caught up!</p>
        </div>
      ` : notifs.map(n => `
        <div class="card" style="margin-bottom:12px;padding:16px 20px;display:flex;gap:14px;align-items:flex-start;">
          <div class="notif-icon ${n.type}" style="flex-shrink:0;">${n.icon || '🔔'}</div>
          <div>
            <div style="font-size:14px;font-weight:600;">${n.title}</div>
            <div style="font-size:13px;color:var(--muted);margin-top:4px;">${n.message}</div>
            <div style="font-size:11px;color:var(--muted);margin-top:6px;">${new Date(n.createdAt).toLocaleString()}</div>
          </div>
        </div>
      `).join('')}
    `;
  },

  renderNotifPanel() {
    const user   = Auth.getUser();
    const notifs = DB.getNotifications().filter(n =>
      n.targetUserId === user.id || n.targetRole === 'teacher' || n.targetRole === 'all'
    ).slice(0, 15);

    return `
      <div class="notif-panel-header">
        <h4>🔔 Notifications</h4>
        <button class="btn btn-outline btn-sm" onclick="Teacher.markAllRead()">Mark all read</button>
      </div>
      <div class="notif-list">
        ${notifs.length === 0 ? '<div style="padding:20px;text-align:center;color:var(--muted);font-size:13px;">No notifications</div>' :
          notifs.map(n => `
            <div class="notif-item ${n.read ? '' : 'unread'}">
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
  }
};
