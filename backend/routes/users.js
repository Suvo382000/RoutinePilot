const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// GET /api/users — Get all users (admin only)
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { role, status, department } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (status) filter.status = status;
    if (department) filter.department = department;

    const users = await User.find(filter).sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/users/teachers — Get all teachers
router.get('/teachers', protect, async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher', status: 'active' }).sort({ name: 1 });
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/users/students — Get all students
router.get('/students', protect, authorize('admin'), async (req, res) => {
  try {
    const students = await User.find({ role: 'student', status: 'active' }).sort({ name: 1 });
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/users/pending — Get pending approval accounts
router.get('/pending', protect, authorize('admin'), async (req, res) => {
  try {
    const pending = await User.find({ status: 'pending' }).sort({ createdAt: -1 });
    res.json(pending);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/users/:id — Get single user
router.get('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/users — Create user (admin only)
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, email, password, role, department, subjects, designation, facultyType, year, semester } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const userData = { name, email, password, role, department, status: 'active' };
    if (role === 'teacher') {
      userData.subjects = subjects || [];
      userData.designation = designation || '';
      userData.facultyType = facultyType || '';
    } else if (role === 'student') {
      userData.year = year || '';
      userData.semester = semester || '';
    }

    const user = await User.create(userData);
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT /api/users/:id — Update user (admin only)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const updates = { ...req.body };

    // If password is being updated, hash it
    if (updates.password) {
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(updates.password, salt);
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    });

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT /api/users/:id/approve — Approve pending account
router.put('/:id/approve', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'active' },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Notify the user
    const Notification = require('../models/Notification');
    await Notification.create({
      type: 'info',
      targetUserId: user._id,
      title: 'Account Approved!',
      message: `Your ${user.role} account has been approved. You can now sign in.`,
      icon: '✅'
    });

    res.json({ message: 'User approved', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE /api/users/:id — Delete user (admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
