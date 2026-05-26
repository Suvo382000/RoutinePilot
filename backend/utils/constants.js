// ===== SCHEDULE CONSTANTS =====

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Theory periods (1 hr each)
// 1st: 9:30-10:30 | 2nd: 10:30-11:30 | Break 11:30-11:45
// 3rd: 11:45-12:45 | 4th: 12:45-13:45 | Lunch 13:45-14:30
// 5th: 14:30-15:30 | 6th: 15:30-16:30 | 7th: 16:30-17:30
const THEORY_PERIODS = [
  { label: '9:30\u201310:30',  slot: 1 },
  { label: '10:30\u201311:30', slot: 2 },
  { label: '11:45\u201312:45', slot: 3 },
  { label: '12:45\u201313:45', slot: 4 },
  { label: '14:30\u201315:30', slot: 5 },
  { label: '15:30\u201316:30', slot: 6 },
  { label: '16:30\u201317:30', slot: 7 },
];

// Lab periods — 4 hrs total
// Splits: 1hr+3hr | 3hr+1hr | 2hr+2hr
const LAB_PERIODS = [
  // 1hr (morning) + 3hr (afternoon 14:30-17:30)
  { label: 'Lab 9:30\u201310:30 + 14:30\u201317:30 (1hr+3hr)',   type: 'lab-1+3', slots: [1,5,6,7], note: '9:30\u201310:30 then 14:30\u201317:30' },
  { label: 'Lab 10:30\u201311:30 + 14:30\u201317:30 (1hr+3hr)',  type: 'lab-1+3', slots: [2,5,6,7], note: '10:30\u201311:30 then 14:30\u201317:30' },
  { label: 'Lab 11:45\u201312:45 + 14:30\u201317:30 (1hr+3hr)',  type: 'lab-1+3', slots: [3,5,6,7], note: '11:45\u201312:45 then 14:30\u201317:30' },
  { label: 'Lab 12:45\u201313:45 + 14:30\u201317:30 (1hr+3hr)',  type: 'lab-1+3', slots: [4,5,6,7], note: '12:45\u201313:45 then 14:30\u201317:30' },

  // 3hr (afternoon 14:30-17:30) + 1hr (morning)
  { label: 'Lab 14:30\u201317:30 + 9:30\u201310:30 (3hr+1hr)',   type: 'lab-3+1', slots: [5,6,7,1], note: '14:30\u201317:30 then 9:30\u201310:30' },
  { label: 'Lab 14:30\u201317:30 + 10:30\u201311:30 (3hr+1hr)',  type: 'lab-3+1', slots: [5,6,7,2], note: '14:30\u201317:30 then 10:30\u201311:30' },
  { label: 'Lab 14:30\u201317:30 + 11:45\u201312:45 (3hr+1hr)',  type: 'lab-3+1', slots: [5,6,7,3], note: '14:30\u201317:30 then 11:45\u201312:45' },
  { label: 'Lab 14:30\u201317:30 + 12:45\u201313:45 (3hr+1hr)',  type: 'lab-3+1', slots: [5,6,7,4], note: '14:30\u201317:30 then 12:45\u201313:45' },

  // 2hr + 2hr
  { label: 'Lab 9:30\u201311:30 + 14:30\u201316:30 (2hr+2hr)',   type: 'lab-2+2', slots: [1,2,5,6], note: '9:30\u201311:30 then 14:30\u201316:30' },
  { label: 'Lab 9:30\u201311:30 + 15:30\u201317:30 (2hr+2hr)',   type: 'lab-2+2', slots: [1,2,6,7], note: '9:30\u201311:30 then 15:30\u201317:30' },
  { label: 'Lab 10:30\u201312:30 + 14:30\u201316:30 (2hr+2hr)',  type: 'lab-2+2', slots: [2,3,5,6], note: '10:30\u201312:30 then 14:30\u201316:30' },
  { label: 'Lab 11:45\u201313:45 + 14:30\u201316:30 (2hr+2hr)',  type: 'lab-2+2', slots: [3,4,5,6], note: '11:45\u201313:45 then 14:30\u201316:30' },
  { label: 'Lab 11:45\u201313:45 + 15:30\u201317:30 (2hr+2hr)',  type: 'lab-2+2', slots: [3,4,6,7], note: '11:45\u201313:45 then 15:30\u201317:30' },
];

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

const SEMESTERS = [
  '1st Semester', '2nd Semester', '3rd Semester', '4th Semester',
  '5th Semester', '6th Semester', '7th Semester', '8th Semester'
];

const FACULTY_TYPES = ['Permanent', 'Visiting'];
const DESIGNATIONS = ['HOD', 'Associate Professor', 'Assistant Professor'];

// Weekly hour limits by designation
const MAX_HOURS = {
  'HOD': 12,
  'Associate Professor': 15,
  'Assistant Professor': 22
};

module.exports = {
  DAYS, THEORY_PERIODS, LAB_PERIODS, YEARS, SEMESTERS,
  FACULTY_TYPES, DESIGNATIONS, MAX_HOURS
};
