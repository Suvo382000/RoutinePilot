const express = require('express');
const router = express.Router();
const ChangeLog = require('../models/ChangeLog');
const { protect, authorize } = require('../middleware/auth');

// GET /api/changelog — Get all changelog entries (admin only)
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const logs = await ChangeLog.find()
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/changelog — Create a changelog entry (admin only)
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { action, details, by } = req.body;
    if (!action || !details) {
      return res.status(400).json({ message: 'Action and details are required' });
    }
    const log = await ChangeLog.create({
      action,
      details,
      by: by || req.user.name
    });
    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
