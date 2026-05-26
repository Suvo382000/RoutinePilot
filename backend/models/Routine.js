const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  day: {
    type: String,
    required: true,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  },
  period: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  room: {
    type: String,
    default: 'TBA'
  },
  classType: {
    type: String,
    enum: ['theory', 'practical'],
    default: 'theory'
  },
  labDuration: {
    type: String,
    default: ''
  },
  substituteTeacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  substituteDate: {
    type: String,
    default: ''
  }
}, { _id: true });

const routineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Routine name is required'],
    trim: true
  },
  department: {
    type: String,
    required: [true, 'Department is required']
  },
  year: {
    type: String,
    required: [true, 'Year is required']
  },
  semester: {
    type: String,
    required: [true, 'Semester is required']
  },
  slots: [slotSchema]
}, {
  timestamps: true
});

module.exports = mongoose.model('Routine', routineSchema);
