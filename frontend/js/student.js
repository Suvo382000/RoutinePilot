// ===== STUDENT MODULE =====
const Student = {
  currentSection: 'my-routine',

  render() {
    const user   = Auth.getUser();
    const unread = DB.getUnreadCount(user.id, 'student');

    document.getElementById('app').innerHTML = `
      <div class="layout">
        ${this.renderSidebar(unread)}
        <div class="main-content">
          ${this.renderTopbar(unread)}
          <div class="page-body" id="student-page-body">
            ${this.renderMyRoutine()}
          </div>
        </div>
      </div>
      <div class="toast-container" id="toast-container"></div>
      <div class="notif-panel" id="notif-panel">${this.renderNotifPanel()}</div>
    `;

    // Show unread notification toast on login
    if (unread > 0) {
      setTimeout(() => showToast(`You have ${unread} new notification${unread > 1 ? 's' : ''}!`, 'info'), 800);
    }
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
          <div class="user-avatar avatar-student">${user.name.charAt(0)}</div>
          <div class="user-info">
            <h4>${user.name}</h4>
            <span>${user.year || 'Student'}</span>
          </div>
        </div>
        <nav class="sidebar-nav">
          <div class="nav-section-title">My Schedule</div>
          <button class="nav-item active" id="nav-my-routine" onclick="Student.navigate('my-routine')">
            <span class="nav-icon">📋</span> My Class Routine
          </button>
          <button class="nav-item" id="nav-changes" onclick="Student.navigate('changes')">
            <span class="nav-icon">🔄</span> Class Changes
          </button>
          <div class="nav-section-title">Notifications</div>
          <button class="nav-item" id="nav-notifications" onclick="Student.navigate('notifications')">
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
    unread = unread ?? DB.getUnreadCount(user.id, 'student');
    return `
      <div class="topbar">
        <div class="topbar-title">
          <h2 id="page-title">My Class Routine</h2>
          <p id="page-subtitle">${user.department || ''} · ${user.year || ''} · ${user.semester || ''}</p>
        </div>
        <div class="topbar-actions">
          <button class="notif-btn" onclick="Student.toggleNotif()">
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
      'my-routine':    ['My Class Routine',  'Your full class schedule'],
      'changes':       ['Class Changes',     'Recent schedule changes'],
      'notifications': ['Notifications',     'Updates and alerts']
    };
    const [title, subtitle] = titles[section] || ['Student', ''];
    document.getElementById('page-title').textContent    = title;
    document.getElementById('page-subtitle').textContent = subtitle;

    const body = document.getElementById('student-page-body');
    switch (section) {
      case 'my-routine':    body.innerHTML = this.renderMyRoutine();    break;
      case 'changes':       body.innerHTML = this.renderChanges();      break;
      case 'notifications': body.innerHTML = this.renderNotifications();break;
    }
  },

  getMyRoutine() {
    const user = Auth.getUser();
    return DB.getRoutines().find(r =>
      r.department === user.department &&
      r.year       === user.year &&
      r.semester   === user.semester
    );
  },

  renderMyRoutine() {
    const user    = Auth.getUser();
    const todayFull = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()];
    const today   = DAYS.includes(todayFull) ? todayFull : '';
    const routine = this.getMyRoutine();

    if (!routine) return `
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <h3>No Routine Found</h3>
        <p>No routine has been created for ${user.department} · ${user.year} · ${user.semester} yet.<br>
        Please contact your admin.</p>
      </div>
    `;

    const todaySlots = routine.slots.filter(s => s.day === today);

    return `
      <div class="card" style="margin-bottom:16px;background:linear-gradient(135deg,#4f46e5,#06b6d4);color:#fff;border:none;">
        <div class="card-body" style="padding:20px 24px;">
          <div style="font-size:13px;opacity:.8;margin-bottom:4px;">Your Schedule</div>
          <div style="font-size:20px;font-weight:700;">${routine.name}</div>
          <div style="font-size:13px;opacity:.8;margin-top:4px;">${routine.slots.length} classes per week</div>
        </div>
      </div>

      ${todaySlots.length > 0 ? `
        <div class="card" style="margin-bottom:20px;border-left:4px solid var(--primary);">
          <div class="card-header"><h3>📍 Today's Classes — ${today}</h3></div>
          <div class="card-body">
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;">
              ${todaySlots.map(s => {
                const teacher = s.substituteTeacherId
                  ? (DB.getUserById(s.substituteTeacherId) || { name: s.substituteTeacherName || 'Substitute' })
                  : (DB.getUserById(s.teacherId) || { name: s.teacherName || 'TBA' });
                const isChanged = !!s.substituteTeacherId;
                const isLab = s.classType === 'practical' || isLabPeriod(s.period);
                return `
                  <div style="background:${isLab?'linear-gradient(135deg,#f3e8ff,#e0e7ff)':isChanged?'linear-gradient(135deg,#fef3c7,#fde68a)':'linear-gradient(135deg,#ede9fe,#e0f2fe)'};border-radius:12px;padding:16px;${isLab?'border:2px solid #a78bfa;':''}${isChanged?'border:2px solid var(--warning);':''}">
                    <div style="font-size:10px;font-weight:700;margin-bottom:4px;${isLab?'color:#7c3aed;':'color:#2563eb;'}">
                      ${isLab ? '🔬 PRACTICAL' : '📖 THEORY'}
                    </div>
                    <div style="font-size:16px;font-weight:700;color:${isChanged?'#92400e':isLab?'#6d28d9':'var(--primary)'};">${s.subject}</div>
                    <div style="font-size:13px;color:var(--muted);margin-top:4px;">👤 ${teacher?.name || 'TBA'}</div>
                    <div style="font-size:13px;color:var(--muted);">⏰ ${s.period}</div>
                    <div style="font-size:13px;color:var(--muted);">🚪 ${s.room}</div>
                    ${isChanged ? '<div style="font-size:11px;color:#92400e;font-weight:700;margin-top:6px;">⚠️ Substitute Teacher</div>' : ''}
                  </div>
                `;
              }).join('')}
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

      <div class="card">
        <div class="card-header">
          <h3>📅 Full Weekly Schedule</h3>
          <button class="btn btn-outline btn-sm" onclick="window.print()">🖨️ Print</button>
        </div>
        <div class="card-body">
          ${this.renderFullRoutineTable(routine, today)}
        </div>
      </div>
    `;
  },

  renderFullRoutineTable(routine, today) {
    const slotMap = {};
    const spanned = {};

    const BREAK_BOUNDARIES = [[2,3],[4,5]];
    function crossesBreak(slotNums) {
      return BREAK_BOUNDARIES.some(([a,b]) => slotNums.includes(a) && slotNums.includes(b));
    }

    routine.slots.forEach(s => {
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

    if (routine.slots.length === 0) return '<p style="color:var(--muted);">No slots in this routine.</p>';

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
            ${THEORY_PERIODS.map(period => {
              const breakBefore = period.slot === 3
                ? `<tr><td colspan="${DAYS.length + 1}" style="background:#fef9c3;text-align:center;font-size:11px;font-weight:700;color:#92400e;padding:6px;">☕ Short Break — 11:30–11:45 (15 min)</td></tr>`
                : period.slot === 5
                ? `<tr><td colspan="${DAYS.length + 1}" style="background:#dcfce7;text-align:center;font-size:11px;font-weight:700;color:#166534;padding:6px;">🍽️ Lunch Break — 13:45–14:30 (45 min)</td></tr>`
                : '';

              const cells = DAYS.map(day => {
                if (spanned[day + '|' + period.slot]) return '';
                const slot = slotMap[day + '|' + period.slot];
                if (!slot) return `<td class="${day === today ? 'today-col' : ''}"><span class="empty-cell">—</span></td>`;
                const rowspan   = slot.spanSlots.length;
                const isChanged = !!slot.substituteTeacherId;
                const teacher   = isChanged
                  ? (DB.getUserById(slot.substituteTeacherId) || { name: slot.substituteTeacherName || 'Substitute' })
                  : (DB.getUserById(slot.teacherId) || { name: slot.teacherName || 'TBA' });
                const isLab     = slot.classType === 'practical' || isLabPeriod(slot.period);
                const periodInfo = getPeriodInfo(slot.period);
                const allSlots = getPeriodSlots(slot.period);
                const isFirstPart = !slot.labPart || slot.spanSlots[0] === allSlots[0];
                return `
                  <td rowspan="${rowspan}" class="${day === today ? 'today-col' : ''}" style="vertical-align:top;overflow:hidden;">
                    <div class="class-cell ${isChanged ? 'changed' : ''} ${isLab ? 'lab-cell' : ''}">
                      <div style="font-size:10px;font-weight:700;margin-bottom:2px;${isLab?'color:#7c3aed;':'color:#2563eb;'}">
                        ${isLab ? '🔬 PRACTICAL' : '📖 THEORY'}
                        ${slot.labPart && !isFirstPart ? '<span style="font-size:9px;opacity:.7;">(cont.)</span>' : ''}
                      </div>
                      <div class="subject">${slot.subject}</div>
                      <div class="teacher">👤 ${teacher?.name || 'TBA'}</div>
                      <div class="room">🚪 ${slot.room}</div>
                      ${isLab && periodInfo?.note && isFirstPart ? `<div style="font-size:10px;color:var(--muted);">⏰ ${periodInfo.note}</div>` : ''}
                      ${isChanged ? '<div style="font-size:10px;color:#92400e;font-weight:700;">⚠️ Substitute</div>' : ''}
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

  renderChanges() {
    const user    = Auth.getUser();
    const routine = this.getMyRoutine();

    // Only show changes that belong to THIS student's routine
    const approved = DB.getAbsentRequests().filter(r => {
      if (r.status !== 'approved') return false;
      // Match by routineId if available
      if (routine && r.routineId === routine.id) return true;
      // Fallback: match by dept/year/semester via the routine name
      if (routine && r.routineName === routine.name) return true;
      return false;
    });

    return `
      <div class="section-header">
        <div><h2>Class Changes</h2><p>Schedule changes for your class</p></div>
      </div>
      ${!routine ? `
        <div class="empty-state">
          <div class="empty-icon">📋</div>
          <h3>No Routine Found</h3>
          <p>No routine assigned for your department, year and semester.</p>
        </div>
      ` : approved.length === 0 ? `
        <div class="empty-state">
          <div class="empty-icon">🔄</div>
          <h3>No Changes</h3>
          <p>No class changes for <strong>${routine.name}</strong>.</p>
        </div>
      ` : approved.map(r => {
        const teacher = DB.getUserById(r.teacherId);
        const sub     = DB.getUserById(r.substituteTeacherId);
        return `
          <div class="card" style="margin-bottom:12px;border-left:4px solid var(--warning);">
            <div class="card-body" style="padding:16px 20px;">
              <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
                <div>
                  <div style="font-size:15px;font-weight:700;">⚠️ ${r.subject} — Class Change</div>
                  <div style="font-size:13px;color:var(--muted);margin-top:4px;">
                    📅 ${r.date} &nbsp;|&nbsp; ⏰ ${r.period} &nbsp;|&nbsp; 🏫 ${r.routineName || '—'}
                  </div>
                </div>
                <span class="badge badge-warning">Changed</span>
              </div>
              <div style="margin-top:12px;display:flex;gap:16px;flex-wrap:wrap;">
                <div style="background:#fee2e2;border-radius:8px;padding:10px 14px;font-size:13px;">
                  <div style="font-size:11px;color:var(--muted);margin-bottom:2px;">Original Teacher</div>
                  <strong>❌ ${teacher?.name || 'Unknown'}</strong>
                </div>
                <div style="font-size:20px;display:flex;align-items:center;">→</div>
                <div style="background:#d1fae5;border-radius:8px;padding:10px 14px;font-size:13px;">
                  <div style="font-size:11px;color:var(--muted);margin-bottom:2px;">Substitute Teacher</div>
                  <strong>✅ ${sub?.name || 'TBA'}</strong>
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    `;
  },
  renderNotifications() {
    const user   = Auth.getUser();
    // Only show notifications explicitly targeted to this student, or broadcast to 'all'
    // Never show targetRole:'student' — those are old broadcast style, replaced by per-user targeting
    const notifs = DB.getNotifications().filter(n =>
      n.targetUserId === user.id || n.targetRole === 'all'
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
        <div class="card" style="margin-bottom:12px;padding:16px 20px;display:flex;gap:14px;align-items:flex-start;${!n.read ? 'border-left:4px solid var(--primary);' : ''}">
          <div class="notif-icon ${n.type}" style="flex-shrink:0;">${n.icon || '🔔'}</div>
          <div>
            <div style="font-size:14px;font-weight:600;">${n.title}</div>
            <div style="font-size:13px;color:var(--muted);margin-top:4px;">${n.message}</div>
            <div style="font-size:11px;color:var(--muted);margin-top:6px;">${new Date(n.createdAt).toLocaleString()}</div>
          </div>
          ${!n.read ? '<span class="badge badge-primary" style="margin-left:auto;flex-shrink:0;">New</span>' : ''}
        </div>
      `).join('')}
    `;
  },

  renderNotifPanel() {
    const user   = Auth.getUser();
    const notifs = DB.getNotifications().filter(n =>
      n.targetUserId === user.id || n.targetRole === 'all'
    ).slice(0, 15);

    return `
      <div class="notif-panel-header">
        <h4>🔔 Notifications</h4>
        <button class="btn btn-outline btn-sm" onclick="Student.markAllRead()">Mark all read</button>
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
