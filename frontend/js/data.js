// ===== INITIAL SEED DATA =====
const SEED = {
  users: [
    { id: 'u1', name: 'Dr. Admin Khan',    email: 'admin@rms.edu',  password: 'admin123',   role: 'admin'   },
    { id: 'u2', name: 'Prof. Rahim Ahmed', email: 'rahim@rms.edu',  password: 'teacher123', role: 'teacher', department: 'CSE',  subjects: ['Data Structures', 'Algorithms'], facultyType: 'Permanent', designation: 'Associate Professor' },
    { id: 'u3', name: 'Ms. Nadia Islam',   email: 'nadia@rms.edu',  password: 'teacher123', role: 'teacher', department: 'IT',   subjects: ['Database', 'Web Technology'], facultyType: 'Permanent', designation: 'Assistant Professor' },
    { id: 'u4', name: 'Mr. Karim Hossain', email: 'karim@rms.edu',  password: 'teacher123', role: 'teacher', department: 'ECE',  subjects: ['Circuit Theory', 'Electronics'], facultyType: 'Visiting', designation: 'Assistant Professor' },
    { id: 'u5', name: 'Alice Student',     email: 'alice@rms.edu',  password: 'student123', role: 'student', year: '2nd Year', semester: '3rd Semester', department: 'CSE' },
    { id: 'u6', name: 'Bob Student',       email: 'bob@rms.edu',    password: 'student123', role: 'student', year: '3rd Year', semester: '5th Semester', department: 'CSE' },
  ],

  routines: [
    {
      id: 'r1',
      name: 'CSE 2nd Year - 3rd Semester',
      department: 'CSE',
      year: '2nd Year',
      semester: '3rd Semester',
      createdAt: '2025-01-10',
      slots: [
        { day: 'Monday',    period: '9:30–10:30',   subject: 'Data Structures',    teacherId: 'u2', room: 'Room 101', classType: 'theory'    },
        { day: 'Monday',    period: '10:30–11:30',  subject: 'Database',           teacherId: 'u3', room: 'Room 102', classType: 'theory'    },
        { day: 'Tuesday',   period: '9:30–10:30',   subject: 'Algorithms',         teacherId: 'u2', room: 'Room 101', classType: 'theory'    },
        { day: 'Tuesday',   period: 'Lab 12:45–13:45 + 14:30–17:30  (1hr+3hr)', subject: 'Data Structures Lab', teacherId: 'u3', room: 'Lab 1', classType: 'practical', labDuration: '1+3' },
        { day: 'Wednesday', period: '11:45–12:45',  subject: 'Data Structures',    teacherId: 'u2', room: 'Room 101', classType: 'theory'    },
        { day: 'Thursday',  period: '9:30–10:30',   subject: 'Database',           teacherId: 'u3', room: 'Room 102', classType: 'theory'    },
        { day: 'Thursday',  period: '14:30–15:30',  subject: 'Algorithms',         teacherId: 'u2', room: 'Room 101', classType: 'theory'    },
        { day: 'Saturday',  period: '10:30–11:30',  subject: 'Web Technology',     teacherId: 'u3', room: 'Lab 1',    classType: 'theory'    },
      ]
    },
    {
      id: 'r2',
      name: 'CSE 3rd Year - 5th Semester',
      department: 'CSE',
      year: '3rd Year',
      semester: '5th Semester',
      createdAt: '2025-01-10',
      slots: [
        { day: 'Monday',    period: '11:45–12:45',  subject: 'Algorithms',       teacherId: 'u2', room: 'Room 201', classType: 'theory'    },
        { day: 'Wednesday', period: '9:30–10:30',   subject: 'Database',         teacherId: 'u3', room: 'Room 202', classType: 'theory'    },
        { day: 'Friday',    period: 'Lab 9:30–11:30 + 14:30–16:30  (2hr+2hr)', subject: 'Web Technology Lab', teacherId: 'u3', room: 'Lab 2', classType: 'practical', labDuration: '2+2' },
        { day: 'Saturday',  period: '14:30–15:30',  subject: 'Algorithms',       teacherId: 'u2', room: 'Room 201', classType: 'theory'    },
      ]
    }
  ],

  absentRequests: [],
  notifications: [],
  changeLog: []
};

// ===== DATA LAYER =====
const DB = {
  init() {
    if (!localStorage.getItem('rms_users')) {
      localStorage.setItem('rms_users',         JSON.stringify(SEED.users));
      localStorage.setItem('rms_routines',      JSON.stringify(SEED.routines));
      localStorage.setItem('rms_absent',        JSON.stringify(SEED.absentRequests));
      localStorage.setItem('rms_notifications', JSON.stringify(SEED.notifications));
      localStorage.setItem('rms_changelog',     JSON.stringify(SEED.changeLog));
    }
  },

  get(key)       { return JSON.parse(localStorage.getItem('rms_' + key) || '[]'); },
  set(key, data) { localStorage.setItem('rms_' + key, JSON.stringify(data)); },

  // Users
  getUsers()          { return this.get('users'); },
  getUserById(id)     { return this.getUsers().find(u => u.id === id); },
  getUsersByRole(role){ return this.getUsers().filter(u => u.role === role); },
  saveUsers(users)    { this.set('users', users); },

  addUser(user) {
    const users = this.getUsers();
    user.id = 'u' + Date.now();
    users.push(user);
    this.saveUsers(users);
    return user;
  },

  updateUser(id, updates) {
    const users = this.getUsers().map(u => u.id === id ? { ...u, ...updates } : u);
    this.saveUsers(users);
  },

  deleteUser(id) {
    this.saveUsers(this.getUsers().filter(u => u.id !== id));
  },

  // Routines
  getRoutines()       { return this.get('routines'); },
  getRoutineById(id)  { return this.getRoutines().find(r => r.id === id); },
  saveRoutines(r)     { this.set('routines', r); },

  addRoutine(routine) {
    const routines = this.getRoutines();
    routine.id = 'r' + Date.now();
    routine.createdAt = new Date().toISOString().split('T')[0];
    routines.push(routine);
    this.saveRoutines(routines);
    return routine;
  },

  updateRoutine(id, updates) {
    const routines = this.getRoutines().map(r => r.id === id ? { ...r, ...updates } : r);
    this.saveRoutines(routines);
  },

  deleteRoutine(id) {
    this.saveRoutines(this.getRoutines().filter(r => r.id !== id));
  },

  // Absent Requests
  getAbsentRequests()    { return this.get('absent'); },
  saveAbsentRequests(a)  { this.set('absent', a); },

  addAbsentRequest(req) {
    const reqs = this.getAbsentRequests();
    req.id = 'ab' + Date.now();
    req.createdAt = new Date().toISOString();
    req.status = 'pending';
    reqs.push(req);
    this.saveAbsentRequests(reqs);
    return req;
  },

  updateAbsentRequest(id, updates) {
    const reqs = this.getAbsentRequests().map(r => r.id === id ? { ...r, ...updates } : r);
    this.saveAbsentRequests(reqs);
  },

  // Notifications
  getNotifications()     { return this.get('notifications'); },
  saveNotifications(n)   { this.set('notifications', n); },

  addNotification(notif) {
    const notifs = this.getNotifications();
    notif.id = 'n' + Date.now();
    notif.createdAt = new Date().toISOString();
    notif.read = false;
    notifs.unshift(notif);
    this.saveNotifications(notifs);
    return notif;
  },

  markNotifRead(id) {
    const notifs = this.getNotifications().map(n => n.id === id ? { ...n, read: true } : n);
    this.saveNotifications(notifs);
  },

  markAllNotifsRead(userId) {
    const notifs = this.getNotifications().map(n =>
      (n.targetUserId === userId || n.targetRole === 'all' || n.targetRole === 'admin') ? { ...n, read: true } : n
    );
    this.saveNotifications(notifs);
  },

  getUnreadCount(userId, role) {
    return this.getNotifications().filter(n => {
      if (n.read) return false;
      if (n.targetUserId === userId) return true;
      if (n.targetRole === 'all') return true;
      // For admin and teacher roles, allow role-based targeting
      // For students, only personal targeting (no role broadcast)
      if (role !== 'student' && n.targetRole === role) return true;
      return false;
    }).length;
  },

  // Change Log
  getChangelog()    { return this.get('changelog'); },
  addChangeLog(log) {
    const logs = this.getChangelog();
    log.id = 'cl' + Date.now();
    log.createdAt = new Date().toISOString();
    logs.unshift(log);
    this.set('changelog', logs);

    // Also push to backend API so other devices see it
    if (typeof ChangelogAPI !== 'undefined') {
      ChangelogAPI.create({
        action: log.action,
        details: log.details,
        by: log.by
      }).catch(() => {});
    }
  },

  // Departments
  getDepartments() {
    const stored = localStorage.getItem('rms_departments');
    return stored ? JSON.parse(stored) : [...DEPARTMENTS];
  },
  saveDepartments(list) { localStorage.setItem('rms_departments', JSON.stringify(list)); },
  addDepartment(name) {
    const list = this.getDepartments();
    if (list.includes(name)) return false;
    list.push(name);
    this.saveDepartments(list);
    return true;
  },
  renameDepartment(oldName, newName) {
    const list = this.getDepartments().map(d => d === oldName ? newName : d);
    this.saveDepartments(list);
    // Update all users and routines that reference the old name
    this.saveUsers(this.getUsers().map(u => u.department === oldName ? { ...u, department: newName } : u));
    this.saveRoutines(this.getRoutines().map(r => r.department === oldName ? { ...r, department: newName } : r));
  },
  deleteDepartment(name) {
    this.saveDepartments(this.getDepartments().filter(d => d !== name));
  }
};

// ===== CONSTANTS =====
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ── Fixed Theory Periods (1 hr each) ──
// Class 1 : 9:30  – 10:30
// Class 2 : 10:30 – 11:30
//           ☕ Short break 11:30–11:45 (15 min)
// Class 3 : 11:45 – 12:45
// Class 4 : 12:45 – 13:45
//           🍽️ Lunch break 13:45–14:30 (45 min)
// Class 5 : 14:30 – 15:30
// Class 6 : 15:30 – 16:30
// Class 7 : 16:30 – 17:30  ← no break after lunch
const THEORY_PERIODS = [
  { label: '9:30–10:30',   start: '9:30',  end: '10:30', slot: 1 },
  { label: '10:30–11:30',  start: '10:30', end: '11:30', slot: 2 },
  { label: '11:45–12:45',  start: '11:45', end: '12:45', slot: 3 },
  { label: '12:45–13:45',  start: '12:45', end: '13:45', slot: 4 },
  { label: '14:30–15:30',  start: '14:30', end: '15:30', slot: 5 },
  { label: '15:30–16:30',  start: '15:30', end: '16:30', slot: 6 },
  { label: '16:30–17:30',  start: '16:30', end: '17:30', slot: 7 },
];

// ── Lab Periods (4 hrs total) ──
// Splits: 1hr + 3hr | 3hr + 1hr | 2hr + 2hr
const LAB_PERIODS = [

  // ── 1hr (morning) + 3hr (afternoon 14:30–17:30) ──
  {
    label: 'Lab 9:30–10:30 + 14:30–17:30  (1hr+3hr)',
    type: 'lab-1+3', slots: [1,5,6,7],
    note: '9:30–10:30  then  14:30–17:30'
  },
  {
    label: 'Lab 10:30–11:30 + 14:30–17:30  (1hr+3hr)',
    type: 'lab-1+3', slots: [2,5,6,7],
    note: '10:30–11:30  then  14:30–17:30'
  },
  {
    label: 'Lab 11:45–12:45 + 14:30–17:30  (1hr+3hr)',
    type: 'lab-1+3', slots: [3,5,6,7],
    note: '11:45–12:45  then  14:30–17:30'
  },
  {
    label: 'Lab 12:45–13:45 + 14:30–17:30  (1hr+3hr)',
    type: 'lab-1+3', slots: [4,5,6,7],
    note: '12:45–13:45  then  14:30–17:30'
  },

  // ── 3hr (afternoon 14:30–17:30) + 1hr (morning) ──
  {
    label: 'Lab 14:30–17:30 + 9:30–10:30  (3hr+1hr)',
    type: 'lab-3+1', slots: [5,6,7,1],
    note: '14:30–17:30  then  9:30–10:30'
  },
  {
    label: 'Lab 14:30–17:30 + 10:30–11:30  (3hr+1hr)',
    type: 'lab-3+1', slots: [5,6,7,2],
    note: '14:30–17:30  then  10:30–11:30'
  },
  {
    label: 'Lab 14:30–17:30 + 11:45–12:45  (3hr+1hr)',
    type: 'lab-3+1', slots: [5,6,7,3],
    note: '14:30–17:30  then  11:45–12:45'
  },
  {
    label: 'Lab 14:30–17:30 + 12:45–13:45  (3hr+1hr)',
    type: 'lab-3+1', slots: [5,6,7,4],
    note: '14:30–17:30  then  12:45–13:45'
  },

  // ── 2hr + 2hr ──
  {
    label: 'Lab 9:30–11:30 + 14:30–16:30  (2hr+2hr)',
    type: 'lab-2+2', slots: [1,2,5,6],
    note: '9:30–11:30  then  14:30–16:30'
  },
  {
    label: 'Lab 9:30–11:30 + 15:30–17:30  (2hr+2hr)',
    type: 'lab-2+2', slots: [1,2,6,7],
    note: '9:30–11:30  then  15:30–17:30'
  },
  {
    label: 'Lab 10:30–12:30 + 14:30–16:30  (2hr+2hr)',
    type: 'lab-2+2', slots: [2,3,5,6],
    note: '10:30–12:30  then  14:30–16:30'
  },
  {
    label: 'Lab 11:45–13:45 + 14:30–16:30  (2hr+2hr)',
    type: 'lab-2+2', slots: [3,4,5,6],
    note: '11:45–13:45  then  14:30–16:30'
  },
  {
    label: 'Lab 11:45–13:45 + 15:30–17:30  (2hr+2hr)',
    type: 'lab-2+2', slots: [3,4,6,7],
    note: '11:45–13:45  then  15:30–17:30'
  },
];

// All selectable periods (theory + lab) for dropdowns
const PERIODS = [
  ...THEORY_PERIODS.map(p => p.label),
  ...LAB_PERIODS.map(p => p.label)
];

// Theory-only periods for display rows in routine table
const PERIOD_ROWS = THEORY_PERIODS.map(p => p.label);

// Helper: get period info by label
function getPeriodInfo(label) {
  return THEORY_PERIODS.find(p => p.label === label)
      || LAB_PERIODS.find(p => p.label === label)
      || null;
}

// Helper: which theory slot rows does a period span?
function getPeriodSlots(label) {
  const info = getPeriodInfo(label);
  if (!info) return [];
  if (info.slots) return info.slots;
  return [info.slot];
}

// Helper: is this a lab period?
function isLabPeriod(label) {
  return LAB_PERIODS.some(p => p.label === label);
}

const YEARS   = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

const SEMESTERS = [
  '1st Semester', '2nd Semester', '3rd Semester', '4th Semester',
  '5th Semester', '6th Semester', '7th Semester', '8th Semester'
];

const DEPARTMENTS = ['CSE', 'IT', 'ECE', 'EE', 'AIML', 'Data Science'];

const FACULTY_TYPES  = ['Permanent', 'Visiting'];
const DESIGNATIONS   = ['HOD', 'Associate Professor', 'Assistant Professor'];

// Reset seed data when constants change
(function resetIfNeeded() {
  const version = '11';
  if (localStorage.getItem('rms_version') !== version) {
    Object.keys(localStorage).filter(k => k.startsWith('rms_')).forEach(k => localStorage.removeItem(k));
    localStorage.setItem('rms_version', version);
  }
})();

// Initialize DB on load
DB.init();

// ===== DATA SANITIZER =====
// Runs on every load — fixes existing routines in localStorage
(function sanitizeRoutines() {
  const routines = DB.getRoutines();
  let changed = false;

  // Normalize subject: trim + Title Case
  const normalizeSubject = name => {
    if (!name) return name;
    const trimmed = name.trim();
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
  };

  // ── Pass 1: Normalize subjects + remove teacher time conflicts (per routine) ──
  const sanitized = routines.map(routine => {
    const slots = routine.slots || [];
    const seenTeacherSlots = new Set(); // teacherId|day|slotNum
    const cleanSlots = [];

    slots.forEach(slot => {
      // Normalize subject name
      const normalizedSubject = normalizeSubject(slot.subject);
      if (normalizedSubject !== slot.subject) changed = true;

      // Check teacher time conflict within this routine
      if (slot.teacherId) {
        const slotNums = getPeriodSlots(slot.period);
        let hasConflict = false;
        slotNums.forEach(slotNum => {
          if (seenTeacherSlots.has(`${slot.teacherId}|${slot.day}|${slotNum}`)) {
            hasConflict = true;
          }
        });
        if (hasConflict) {
          changed = true;
          console.warn(`[Sanitizer] Removed time conflict: ${slot.subject} on ${slot.day} (${slot.period})`);
          return;
        }
        slotNums.forEach(slotNum => {
          seenTeacherSlots.add(`${slot.teacherId}|${slot.day}|${slotNum}`);
        });
      }

      cleanSlots.push({ ...slot, subject: normalizedSubject });
    });

    return { ...routine, slots: cleanSlots };
  });

  // ── Pass 2: Enforce constraints per routine ──
  // a) max 2 times same subject in 1st period across ALL routines
  // b) max 3 classes per week for same subject within a routine

  const subjectFirstPeriodCount = {}; // normalizedSubject -> count across all routines
  sanitized.forEach(routine => {
    (routine.slots || []).forEach(slot => {
      const slotNums = getPeriodSlots(slot.period);
      if (slotNums.includes(1)) {
        const key = normalizeSubject(slot.subject).toLowerCase();
        subjectFirstPeriodCount[key] = (subjectFirstPeriodCount[key] || 0) + 1;
      }
    });
  });

  const subjectFirstPeriodSeen = {};

  const finalRoutines = sanitized.map(routine => {
    const slots = routine.slots || [];

    // Count subject occurrences within this routine (for max 3/week check)
    const subjectWeekCount = {};
    slots.forEach(slot => {
      const key = normalizeSubject(slot.subject).toLowerCase();
      subjectWeekCount[key] = (subjectWeekCount[key] || 0) + 1;
    });

    // Track how many we've kept per subject (for max 3/week enforcement)
    const subjectKeptCount = {};

    const filteredSlots = slots.filter(slot => {
      const key = normalizeSubject(slot.subject).toLowerCase();
      const slotNums = getPeriodSlots(slot.period);

      // ── Rule b: max 3 classes per week per subject ──
      if ((subjectWeekCount[key] || 0) > 3) {
        subjectKeptCount[key] = (subjectKeptCount[key] || 0) + 1;
        if (subjectKeptCount[key] > 3) {
          changed = true;
          console.warn(`[Sanitizer] Removed excess weekly slot: "${slot.subject}" on ${slot.day} — subject already has 3 classes this week.`);
          return false;
        }
      }

      // ── Rule a: max 2 times same subject in 1st period ──
      if (slotNums.includes(1) && (subjectFirstPeriodCount[key] || 0) > 2) {
        subjectFirstPeriodSeen[key] = (subjectFirstPeriodSeen[key] || 0) + 1;
        if (subjectFirstPeriodSeen[key] > 2) {
          changed = true;
          console.warn(`[Sanitizer] Removed excess 1st-period slot: "${slot.subject}" on ${slot.day} — already appears 2 times in 1st period.`);
          return false;
        }
      }

      return true;
    });

    return { ...routine, slots: filteredSlots };
  });

  if (changed) {
    DB.saveRoutines(finalRoutines);
    console.info('[Sanitizer] Routines sanitized: subjects normalized, conflicts & excess 1st-period slots removed.');
  }
})();
