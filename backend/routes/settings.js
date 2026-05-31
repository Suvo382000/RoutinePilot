const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const { protect, authorize } = require('../middleware/auth');

// GET /api/settings/admin-code — Get admin secret code (public — needed for signup validation)
router.get('/admin-code', async (req, res) => {
  try {
    const setting = await Settings.findOne({ key: 'admin_secret_code' });
    // Don't return the actual code — just confirm if a custom one exists
    res.json({ hasCustomCode: !!setting });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/settings/verify-admin-code — Verify admin code during signup
router.post('/verify-admin-code', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ valid: false, message: 'Code is required' });

    const setting = await Settings.findOne({ key: 'admin_secret_code' });
    const currentCode = setting ? setting.value : 'ADMIN2026'; // default

    if (code === currentCode) {
      res.json({ valid: true });
    } else {
      res.status(401).json({ valid: false, message: 'Invalid admin secure code. Access denied.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT /api/settings/admin-code — Update admin secret code (admin only)
router.put('/admin-code', protect, authorize('admin'), async (req, res) => {
  try {
    const { currentCode, newCode } = req.body;
    if (!currentCode || !newCode) {
      return res.status(400).json({ message: 'Current code and new code are required' });
    }
    if (newCode.length < 6) {
      return res.status(400).json({ message: 'New code must be at least 6 characters' });
    }

    // Verify current code
    const setting = await Settings.findOne({ key: 'admin_secret_code' });
    const existingCode = setting ? setting.value : 'ADMIN2026';

    if (currentCode !== existingCode) {
      return res.status(401).json({ message: 'Current code is incorrect' });
    }

    // Update or create
    await Settings.findOneAndUpdate(
      { key: 'admin_secret_code' },
      { key: 'admin_secret_code', value: newCode },
      { upsert: true, new: true }
    );

    res.json({ message: 'Admin secret code updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
