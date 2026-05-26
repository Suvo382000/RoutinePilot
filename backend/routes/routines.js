const express = require('express');
const router = express.Router();
const Routine = require('../models/Routine');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { validateRoutine } = require('../utils/routineValidator');

// GET /api/routines — Get all routines
router.get('/', protect, async (req, res) => {
  try {
    const { department, year, semester } = req.query;
    const filter = {};
    if (department) filter.department = department;
    if (year) filter.year = year;
    if (semester) filter.semester = semester;

    const routines = await Routine.find(filter)
      .populate('slots.teacherId', 'name email department')
      .populate('slots.substituteTeacherId', 'name email department')
      .sort({ createdAt: -1 });

    res.json(routines);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/routines/my — Get routines for current user (teacher/student)
router.get('/my', protect, async (req, res) => {
  try {
    const user = req.user;
    let routines;

    if (user.role === 'teacher') {
      routines = await Routine.find({ 'slots.teacherId': user._id })
        .populate('slots.teacherId', 'name email')
        .populate('slots.substituteTeacherId', 'name email');
    } else if (user.role === 'student') {
      routines = await Routine.find({
        department: user.department,
        year: user.year,
        semester: user.semester
      })
        .populate('slots.teacherId', 'name email')
        .populate('slots.substituteTeacherId', 'name email');
    } else {
      routines = await Routine.find()
        .populate('slots.teacherId', 'name email')
        .populate('slots.substituteTeacherId', 'name email');
    }

    res.json(routines);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/routines/:id — Get single routine
router.get('/:id', protect, async (req, res) => {
  try {
    const routine = await Routine.findById(req.params.id)
      .populate('slots.teacherId', 'name email department')
      .populate('slots.substituteTeacherId', 'name email department');

    if (!routine) return res.status(404).json({ message: 'Routine not found' });
    res.json(routine);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/routines/validate — Validate routine without saving
router.post('/validate', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, department, year, semester, slots, forceThirdSubject } = req.body;

    const allRoutines = await Routine.find();
    const allTeachers = await User.find({ role: 'teacher', status: 'active' });

    const result = validateRoutine(
      slots || [],
      { _id: null, department, year, semester, name },
      allRoutines,
      allTeachers,
      { forceThirdSubject: forceThirdSubject || false }
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/routines — Create routine (admin only) with validation
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, department, year, semester, slots, skipValidation, forceThirdSubject } = req.body;

    // Run validation unless explicitly skipped
    if (!skipValidation) {
      const allRoutines = await Routine.find();
      const allTeachers = await User.find({ role: 'teacher', status: 'active' });

      const validation = validateRoutine(
        slots || [],
        { _id: null, department, year, semester, name },
        allRoutines,
        allTeachers,
        { forceThirdSubject: forceThirdSubject || false }
      );

      if (!validation.valid) {
        return res.status(400).json({
          message: 'Routine validation failed',
          errors: validation.errors,
          warnings: validation.warnings
        });
      }

      // Return warnings even on success
      if (validation.warnings.length > 0) {
        const routine = await Routine.create({ name, department, year, semester, slots: slots || [] });
        const populated = await Routine.findById(routine._id)
          .populate('slots.teacherId', 'name email')
          .populate('slots.substituteTeacherId', 'name email');
        return res.status(201).json({ routine: populated, warnings: validation.warnings });
      }
    }

    const routine = await Routine.create({ name, department, year, semester, slots: slots || [] });
    const populated = await Routine.findById(routine._id)
      .populate('slots.teacherId', 'name email')
      .populate('slots.substituteTeacherId', 'name email');

    res.status(201).json({ routine: populated });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT /api/routines/:id — Update routine (admin only) with validation
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { slots, skipValidation, forceThirdSubject, ...otherUpdates } = req.body;
    const existingRoutine = await Routine.findById(req.params.id);
    if (!existingRoutine) return res.status(404).json({ message: 'Routine not found' });

    const updatedData = { ...otherUpdates };
    if (slots) updatedData.slots = slots;

    // Run validation on updated slots
    if (slots && !skipValidation) {
      const allRoutines = await Routine.find();
      const allTeachers = await User.find({ role: 'teacher', status: 'active' });

      const validation = validateRoutine(
        slots,
        { _id: existingRoutine._id, department: otherUpdates.department || existingRoutine.department, year: otherUpdates.year || existingRoutine.year, semester: otherUpdates.semester || existingRoutine.semester },
        allRoutines,
        allTeachers,
        { forceThirdSubject: forceThirdSubject || false }
      );

      if (!validation.valid) {
        return res.status(400).json({
          message: 'Routine validation failed',
          errors: validation.errors,
          warnings: validation.warnings
        });
      }
    }

    const routine = await Routine.findByIdAndUpdate(req.params.id, updatedData, {
      new: true, runValidators: true
    })
      .populate('slots.teacherId', 'name email')
      .populate('slots.substituteTeacherId', 'name email');

    res.json({ routine });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE /api/routines/:id — Delete routine (admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const routine = await Routine.findByIdAndDelete(req.params.id);
    if (!routine) return res.status(404).json({ message: 'Routine not found' });
    res.json({ message: 'Routine deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
