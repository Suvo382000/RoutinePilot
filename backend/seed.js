require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mongoose = require('mongoose');
const User = require('./models/User');
const Department = require('./models/Department');
const Routine = require('./models/Routine');

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Department.deleteMany({});
    await Routine.deleteMany({});
    console.log('Cleared existing data');

    // Seed Departments
    const depts = await Department.insertMany([
      { name: 'CSE' },
      { name: 'IT' },
      { name: 'ECE' },
      { name: 'EE' },
      { name: 'AIML' },
      { name: 'Data Science' }
    ]);
    console.log(`Seeded ${depts.length} departments`);

    // Seed Users
    const users = await User.create([
      {
        name: 'Dr. Admin Khan',
        email: 'admin@rms.edu',
        password: 'admin123',
        role: 'admin',
        status: 'active'
      },
      {
        name: 'Prof. Rahim Ahmed',
        email: 'rahim@rms.edu',
        password: 'teacher123',
        role: 'teacher',
        department: 'CSE',
        subjects: ['Data Structures', 'Algorithms'],
        designation: 'Associate Professor',
        facultyType: 'Permanent',
        status: 'active'
      },
      {
        name: 'Ms. Nadia Islam',
        email: 'nadia@rms.edu',
        password: 'teacher123',
        role: 'teacher',
        department: 'IT',
        subjects: ['Database', 'Web Technology'],
        designation: 'Assistant Professor',
        facultyType: 'Permanent',
        status: 'active'
      },
      {
        name: 'Mr. Karim Hossain',
        email: 'karim@rms.edu',
        password: 'teacher123',
        role: 'teacher',
        department: 'ECE',
        subjects: ['Circuit Theory', 'Electronics'],
        designation: 'Assistant Professor',
        facultyType: 'Visiting',
        status: 'active'
      },
      {
        name: 'Alice Student',
        email: 'alice@rms.edu',
        password: 'student123',
        role: 'student',
        department: 'CSE',
        year: '2nd Year',
        semester: '3rd Semester',
        status: 'active'
      },
      {
        name: 'Bob Student',
        email: 'bob@rms.edu',
        password: 'student123',
        role: 'student',
        department: 'CSE',
        year: '3rd Year',
        semester: '5th Semester',
        status: 'active'
      }
    ]);
    console.log(`Seeded ${users.length} users`);

    // Get teacher IDs for routine slots
    const rahim = users.find(u => u.email === 'rahim@rms.edu');
    const nadia = users.find(u => u.email === 'nadia@rms.edu');

    // Seed Routines
    const routines = await Routine.create([
      {
        name: 'CSE 2nd Year - 3rd Semester',
        department: 'CSE',
        year: '2nd Year',
        semester: '3rd Semester',
        slots: [
          { day: 'Monday',    period: '9:30\u201310:30',  subject: 'Data Structures', teacherId: rahim._id, room: 'Room 101', classType: 'theory' },
          { day: 'Monday',    period: '10:30\u201311:30', subject: 'Database',        teacherId: nadia._id, room: 'Room 102', classType: 'theory' },
          { day: 'Tuesday',   period: '9:30\u201310:30',  subject: 'Algorithms',      teacherId: rahim._id, room: 'Room 101', classType: 'theory' },
          { day: 'Wednesday', period: '11:45\u201312:45', subject: 'Data Structures', teacherId: rahim._id, room: 'Room 101', classType: 'theory' },
          { day: 'Thursday',  period: '9:30\u201310:30',  subject: 'Database',        teacherId: nadia._id, room: 'Room 102', classType: 'theory' },
          { day: 'Thursday',  period: '14:30\u201315:30', subject: 'Algorithms',      teacherId: rahim._id, room: 'Room 101', classType: 'theory' },
          { day: 'Saturday',  period: '10:30\u201311:30', subject: 'Web Technology',  teacherId: nadia._id, room: 'Lab 1',    classType: 'theory' },
        ]
      },
      {
        name: 'CSE 3rd Year - 5th Semester',
        department: 'CSE',
        year: '3rd Year',
        semester: '5th Semester',
        slots: [
          { day: 'Monday',    period: '11:45\u201312:45', subject: 'Algorithms',     teacherId: rahim._id, room: 'Room 201', classType: 'theory' },
          { day: 'Wednesday', period: '9:30\u201310:30',  subject: 'Database',       teacherId: nadia._id, room: 'Room 202', classType: 'theory' },
          { day: 'Saturday',  period: '14:30\u201315:30', subject: 'Algorithms',     teacherId: rahim._id, room: 'Room 201', classType: 'theory' },
        ]
      }
    ]);
    console.log(`Seeded ${routines.length} routines`);

    console.log('\n✅ Database seeded successfully!');
    console.log('\nDemo Credentials:');
    console.log('  Admin:   admin@rms.edu / admin123');
    console.log('  Teacher: rahim@rms.edu / teacher123');
    console.log('  Student: alice@rms.edu / student123');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedDB();
