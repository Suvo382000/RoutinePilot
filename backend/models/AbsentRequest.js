const mongoose = require('mongoose');

const absentRequestSchema = new mongoose.Schema({
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  routineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Routine',
    required: true
  },
  routineName: {
    type: String,
    default: ''
  },
  date: {
    type: String,
    required: [true, 'Date is required']
  },
  subject: {
    type: String,
    required: [true, 'Subject is required']
  },
  period: {
    type: String,
    required: [true, 'Period is required']
  },
  message: {
    type: String,
    required: [true, 'Message is required']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  substituteTeacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AbsentRequest', absentRequestSchema);
