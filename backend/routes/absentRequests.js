const express = require('express');
const router = express.Router();
const AbsentRequest = require('../models/AbsentRequest');
const Routine = require('../models/Routine');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { protect, authorize } = require('../middleware/auth');

// GET /api/absent-requests — Get all (admin) or own (teacher)
router.get('/', protect, async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'teacher') {
      filter.teacherId = req.user._id;
    }
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const requests = await AbsentRequest.find(filter)
      .populate('teacherId', 'name email department')
      .populate('substituteTeacherId', 'name email department')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/absent-requests — Create absent request (teacher only)
router.post('/', protect, authorize('teacher'), async (req, res) => {
  try {
    const { routineId, date, subject, period, message } = req.body;

    const routine = await Routine.findById(routineId);
    if (!routine) return res.status(404).json({ message: 'Routine not found' });

    const request = await AbsentRequest.create({
      teacherId: req.user._id,
      routineId,
      routineName: routine.name,
      date, subject, period, message
    });

    // Notify admin
    await Notification.create({
      type: 'absent',
      targetRole: 'admin',
      title: 'Absence Request',
      message: `${req.user.name} reported absence for ${subject} on ${date} (${period}).`,
      icon: '📩'
    });

    const populated = await AbsentRequest.findById(request._id)
      .populate('teacherId', 'name email department');

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT /api/absent-requests/:id/approve — Approve and assign substitute (admin only)
router.put('/:id/approve', protect, authorize('admin'), async (req, res) => {
  try {
    const { substituteTeacherId } = req.body;
    if (!substituteTeacherId) {
      return res.status(400).json({ message: 'Substitute teacher ID is required' });
    }

    const request = await AbsentRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    const teacher = await User.findById(request.teacherId);
    const sub = await User.findById(substituteTeacherId);
    if (!sub) return res.status(404).json({ message: 'Substitute teacher not found' });

    // Update request status
    request.status = 'approved';
    request.substituteTeacherId = substituteTeacherId;
    await request.save();

    // Update routine slot with substitute
    const routine = await Routine.findById(request.routineId);
    if (routine) {
      let changed = false;
      routine.slots.forEach(slot => {
        const periodMatch = slot.period.trim() === request.period.trim();
        const subjectMatch = slot.subject.trim() === request.subject.trim();
        if (slot.teacherId.toString() === request.teacherId.toString() && (periodMatch || subjectMatch)) {
          slot.substituteTeacherId = substituteTeacherId;
          slot.substituteDate = request.date;
          changed = true;
        }
      });
      if (changed) await routine.save();

      // Notify ONLY students in the affected routine's dept/year/semester
      const targetStudents = await User.find({
        role: 'student',
        status: 'active',
        department: routine.department,
        year: routine.year,
        semester: routine.semester
      });

      const notifications = targetStudents.map(student => ({
        type: 'change',
        targetUserId: student._id,
        title: 'Class Change Notification',
        message: `Your ${request.subject} class on ${request.date} (${request.period}) will be taken by ${sub.name} instead of ${teacher.name}. [${routine.department} · ${routine.year} · ${routine.semester}]`,
        icon: '🔄'
      }));

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }

      // Notify substitute teacher
      await Notification.create({
        type: 'info',
        targetUserId: substituteTeacherId,
        title: 'You have been assigned a class',
        message: `You are assigned to take ${request.subject} on ${request.date} (${request.period}) as a substitute for ${teacher.name} [${routine.department} · ${routine.year} · ${routine.semester}].`,
        icon: '📌'
      });
    }

    const populated = await AbsentRequest.findById(request._id)
      .populate('teacherId', 'name email')
      .populate('substituteTeacherId', 'name email');

    res.json({
      message: `Approved! ${sub.name} assigned as substitute.`,
      request: populated,
      studentsNotified: routine ? await User.countDocuments({
        role: 'student', status: 'active',
        department: routine.department, year: routine.year, semester: routine.semester
      }) : 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT /api/absent-requests/:id/reject — Reject request (admin only)
router.put('/:id/reject', protect, authorize('admin'), async (req, res) => {
  try {
    const request = await AbsentRequest.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected' },
      { new: true }
    ).populate('teacherId', 'name email');

    if (!request) return res.status(404).json({ message: 'Request not found' });
    res.json({ message: 'Request rejected', request });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
