/**
 * Routine Constraint Validator
 * 
 * Validates all scheduling rules before saving a routine.
 * Returns { valid: true } or { valid: false, errors: [...] }
 */

const { THEORY_PERIODS, LAB_PERIODS, DAYS, MAX_HOURS } = require('./constants');

/**
 * Get slot number(s) for a given period label
 */
function getSlotNumbers(periodLabel) {
  const theory = THEORY_PERIODS.find(p => p.label === periodLabel);
  if (theory) return [theory.slot];
  const lab = LAB_PERIODS.find(p => p.label === periodLabel);
  if (lab) return lab.slots;
  return [];
}

/**
 * Get hours for a period (theory=1, lab=4)
 */
function getPeriodHours(periodLabel) {
  const lab = LAB_PERIODS.find(p => p.label === periodLabel);
  if (lab) return 4;
  return 1; // theory
}

/**
 * Check if a period is a lab
 */
function isLab(periodLabel) {
  return LAB_PERIODS.some(p => p.label === periodLabel);
}

/**
 * Main validation function
 * @param {Array} slots - Array of slot objects in the routine being validated
 * @param {Object} routine - The routine metadata (department, year, semester)
 * @param {Array} allRoutines - All routines in the system (for cross-routine checks)
 * @param {Array} allTeachers - All teacher user objects
 * @param {Object} options - { forceThirdSubject: boolean } for emergency override
 */
function validateRoutine(slots, routine, allRoutines, allTeachers, options = {}) {
  const errors = [];
  const warnings = [];

  // Build a global schedule: teacherId -> [{ day, slot, subject, department, classType, routineId }]
  const globalSchedule = {};

  // Add slots from ALL other routines
  allRoutines.forEach(r => {
    if (r._id && r._id.toString() === routine._id?.toString()) return; // skip current routine
    (r.slots || []).forEach(s => {
      if (!s.teacherId) return;
      const tid = s.teacherId.toString ? s.teacherId.toString() : s.teacherId;
      if (!globalSchedule[tid]) globalSchedule[tid] = [];
      const slotNums = getSlotNumbers(s.period);
      slotNums.forEach(slotNum => {
        globalSchedule[tid].push({
          day: s.day,
          slot: slotNum,
          subject: s.subject,
          department: r.department,
          classType: s.classType || 'theory',
          routineId: r._id?.toString() || '',
          period: s.period
        });
      });
    });
  });

  // Add slots from current routine being validated
  slots.forEach(s => {
    if (!s.teacherId) return;
    const tid = s.teacherId.toString ? s.teacherId.toString() : s.teacherId;
    if (!globalSchedule[tid]) globalSchedule[tid] = [];
    const slotNums = getSlotNumbers(s.period);
    slotNums.forEach(slotNum => {
      globalSchedule[tid].push({
        day: s.day,
        slot: slotNum,
        subject: s.subject,
        department: routine.department,
        classType: s.classType || 'theory',
        routineId: routine._id?.toString() || 'new',
        period: s.period
      });
    });
  });

  // Get teacher info map
  const teacherMap = {};
  allTeachers.forEach(t => {
    teacherMap[t._id.toString()] = t;
  });

  // ═══════════════════════════════════════════════════════
  // CONSTRAINT 1: Subject limits per designation
  // HOD: max 1 subject | Associate/Assistant: max 2 (3 only if emergency)
  // ═══════════════════════════════════════════════════════
  Object.entries(globalSchedule).forEach(([tid, schedule]) => {
    const teacher = teacherMap[tid];
    if (!teacher) return;

    const uniqueSubjects = [...new Set(schedule.map(s => s.subject))];
    const designation = teacher.designation || 'Assistant Professor';

    if (designation === 'HOD' && uniqueSubjects.length > 1) {
      errors.push(`${teacher.name} (HOD) can only teach 1 subject. Currently assigned: ${uniqueSubjects.join(', ')}`);
    }

    if (designation !== 'HOD') {
      if (uniqueSubjects.length > 3) {
        errors.push(`${teacher.name} cannot teach more than 3 subjects. Currently: ${uniqueSubjects.join(', ')}`);
      } else if (uniqueSubjects.length === 3 && !options.forceThirdSubject) {
        warnings.push(`${teacher.name} is assigned 3 subjects (${uniqueSubjects.join(', ')}). This is only allowed when no other teacher is available.`);
      } else if (uniqueSubjects.length > 2 && !options.forceThirdSubject) {
        errors.push(`${teacher.name} can take max 2 subjects. Currently: ${uniqueSubjects.join(', ')}. Use emergency override for 3rd subject.`);
      }
    }
  });

  // ═══════════════════════════════════════════════════════
  // CONSTRAINT 2: 1 subject = 3 classes/week
  // Same subject NOT on same day. Max 2 times in 1st period across week.
  // ═══════════════════════════════════════════════════════
  // Group by subject within current routine
  const subjectSlots = {};
  slots.forEach(s => {
    if (!subjectSlots[s.subject]) subjectSlots[s.subject] = [];
    subjectSlots[s.subject].push(s);
  });

  Object.entries(subjectSlots).forEach(([subject, sSlots]) => {
    // Check: same subject on same day
    const dayCount = {};
    sSlots.forEach(s => {
      dayCount[s.day] = (dayCount[s.day] || 0) + 1;
    });
    Object.entries(dayCount).forEach(([day, count]) => {
      if (count > 1) {
        errors.push(`Subject "${subject}" is scheduled ${count} times on ${day}. Same subject cannot repeat on the same day.`);
      }
    });

    // Check: max 2 times in 1st period (slot 1) across the week
    const firstPeriodCount = sSlots.filter(s => {
      const slotNums = getSlotNumbers(s.period);
      return slotNums.includes(1);
    }).length;
    if (firstPeriodCount > 2) {
      errors.push(`Subject "${subject}" is in 1st period ${firstPeriodCount} times. Maximum 2 times in 1st period per week.`);
    }
  });

  // ═══════════════════════════════════════════════════════
  // CONSTRAINT 3: Consecutive theory class limits
  // Same faculty: max 2 consecutive theory classes
  // Cannot take 2 consecutive theory in SAME department
  // Must rest on 3rd period (unless no faculty available)
  // ═══════════════════════════════════════════════════════
  Object.entries(globalSchedule).forEach(([tid, schedule]) => {
    const teacher = teacherMap[tid];
    if (!teacher) return;
    const isVisiting = teacher.facultyType === 'Visiting';

    DAYS.forEach(day => {
      const daySlots = schedule
        .filter(s => s.day === day && s.classType === 'theory')
        .sort((a, b) => a.slot - b.slot);

      if (daySlots.length < 2) return;

      // Check consecutive slots
      for (let i = 0; i < daySlots.length - 1; i++) {
        const current = daySlots[i];
        const next = daySlots[i + 1];

        // Slots are consecutive if difference is 1
        // (slots 2->3 cross break but still consecutive in schedule)
        const isConsecutive = (next.slot - current.slot === 1) ||
          (current.slot === 2 && next.slot === 3) || // across short break
          (current.slot === 4 && next.slot === 5);   // across lunch

        if (!isConsecutive) continue;

        // Same department consecutive check
        if (current.department === next.department) {
          if (!isVisiting) {
            errors.push(`${teacher.name} has 2 consecutive theory classes in ${current.department} on ${day} (slots ${current.slot} & ${next.slot}). Not allowed in same department.`);
          }
        }

        // Check for 3 consecutive (only visiting allowed)
        if (i < daySlots.length - 2) {
          const third = daySlots[i + 2];
          const thirdConsecutive = (third.slot - next.slot === 1) ||
            (next.slot === 2 && third.slot === 3) ||
            (next.slot === 4 && third.slot === 5);

          if (thirdConsecutive && !isVisiting) {
            errors.push(`${teacher.name} has 3 consecutive theory classes on ${day} (slots ${current.slot}, ${next.slot}, ${third.slot}). Must rest after 2 consecutive. Only visiting faculty can take 3.`);
          }
        }
      }
    });
  });

  // ═══════════════════════════════════════════════════════
  // CONSTRAINT 4: Weekly hour limits
  // HOD: 12hrs | Associate: 15hrs | Assistant: 18-22hrs
  // ═══════════════════════════════════════════════════════
  Object.entries(globalSchedule).forEach(([tid, schedule]) => {
    const teacher = teacherMap[tid];
    if (!teacher) return;

    // Calculate total hours
    // Each theory slot = 1hr, each lab = 4hrs (but counted by unique period per day)
    const uniquePeriods = new Set();
    let totalHours = 0;

    schedule.forEach(s => {
      const key = `${s.day}|${s.period}`;
      if (!uniquePeriods.has(key)) {
        uniquePeriods.add(key);
        totalHours += s.classType === 'practical' ? 4 : 1;
      }
    });

    // Actually count from slots directly (avoid double-counting lab slots)
    totalHours = 0;
    const countedPeriods = new Set();
    // Re-count from original slots across all routines
    const allSlots = [];
    allRoutines.forEach(r => {
      if (r._id && r._id.toString() === routine._id?.toString()) return;
      (r.slots || []).forEach(s => {
        if (s.teacherId && (s.teacherId.toString ? s.teacherId.toString() : s.teacherId) === tid) {
          allSlots.push({ ...s, day: s.day });
        }
      });
    });
    slots.forEach(s => {
      if (s.teacherId && (s.teacherId.toString ? s.teacherId.toString() : s.teacherId) === tid) {
        allSlots.push({ ...s, day: s.day });
      }
    });

    allSlots.forEach(s => {
      const key = `${s.day}|${s.period}`;
      if (!countedPeriods.has(key)) {
        countedPeriods.add(key);
        totalHours += isLab(s.period) ? 4 : 1;
      }
    });

    const designation = teacher.designation || 'Assistant Professor';
    const maxHrs = MAX_HOURS[designation] || 22;

    if (totalHours > maxHrs) {
      errors.push(`${teacher.name} (${designation}) exceeds weekly limit: ${totalHours}hrs assigned, max ${maxHrs}hrs allowed.`);
    }
  });

  // ═══════════════════════════════════════════════════════
  // CONSTRAINT 5: Visiting faculty can take 3 consecutive
  // (Already handled in constraint 3 — visiting is exempt)
  // ═══════════════════════════════════════════════════════

  // ═══════════════════════════════════════════════════════
  // CONSTRAINT 8: Same faculty max 2 classes in 1st period per week
  // ═══════════════════════════════════════════════════════
  Object.entries(globalSchedule).forEach(([tid, schedule]) => {
    const teacher = teacherMap[tid];
    if (!teacher) return;

    const firstPeriodCount = schedule.filter(s => s.slot === 1).length;
    if (firstPeriodCount > 2) {
      errors.push(`${teacher.name} is assigned ${firstPeriodCount} classes in 1st period (9:30-10:30). Maximum 2 per week.`);
    }
  });

  // ═══════════════════════════════════════════════════════
  // CONFLICT CHECK: Same teacher, same day, same slot
  // ═══════════════════════════════════════════════════════
  Object.entries(globalSchedule).forEach(([tid, schedule]) => {
    const teacher = teacherMap[tid];
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
        const subjects = entries.map(e => `${e.subject} (${e.department})`).join(', ');
        errors.push(`${teacher.name} has a time conflict on ${day} slot ${slot}: ${subjects}`);
      }
    });
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

module.exports = { validateRoutine, getSlotNumbers, getPeriodHours, isLab };
