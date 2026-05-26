const express = require('express');
const router = express.Router();
const Department = require('../models/Department');
const User = require('../models/User');
const Routine = require('../models/Routine');
const { protect, authorize } = require('../middleware/auth');

// GET /api/departments — Get all departments
router.get('/', protect, async (req, res) => {
  try {
    const departments = await Department.find().sort({ name: 1 });
    res.json(departments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/departments — Add department (admin only)
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Department name is required' });

    const existing = await Department.findOne({ name: name.trim() });
    if (existing) return res.status(400).json({ message: `"${name}" already exists` });

    const dept = await Department.create({ name: name.trim() });
    res.status(201).json(dept);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT /api/departments/:id — Rename department (admin only)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'New name is required' });

    const dept = await Department.findById(req.params.id);
    if (!dept) return res.status(404).json({ message: 'Department not found' });

    const oldName = dept.name;
    const newName = name.trim();

    // Check if new name already exists
    const existing = await Department.findOne({ name: newName, _id: { $ne: req.params.id } });
    if (existing) return res.status(400).json({ message: `"${newName}" already exists` });

    // Update department name
    dept.name = newName;
    await dept.save();

    // Update all users and routines referencing old name
    await User.updateMany({ department: oldName }, { department: newName });
    await Routine.updateMany({ department: oldName }, { department: newName });

    res.json({ message: `Renamed "${oldName}" to "${newName}"`, department: dept });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE /api/departments/:id — Delete department (admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const dept = await Department.findByIdAndDelete(req.params.id);
    if (!dept) return res.status(404).json({ message: 'Department not found' });
    res.json({ message: `Department "${dept.name}" deleted` });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
