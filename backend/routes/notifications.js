const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

// GET /api/notifications — Get notifications for current user
router.get('/', protect, async (req, res) => {
  try {
    const user = req.user;
    let filter;

    if (user.role === 'student') {
      // Students only see personal notifications or broadcast 'all'
      filter = {
        $or: [
          { targetUserId: user._id },
          { targetRole: 'all' }
        ]
      };
    } else {
      // Admin/Teacher see personal + role-based + all
      filter = {
        $or: [
          { targetUserId: user._id },
          { targetRole: user.role },
          { targetRole: 'all' }
        ]
      };
    }

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/notifications/unread-count — Get unread count
router.get('/unread-count', protect, async (req, res) => {
  try {
    const user = req.user;
    let filter;

    if (user.role === 'student') {
      filter = {
        read: false,
        $or: [
          { targetUserId: user._id },
          { targetRole: 'all' }
        ]
      };
    } else {
      filter = {
        read: false,
        $or: [
          { targetUserId: user._id },
          { targetRole: user.role },
          { targetRole: 'all' }
        ]
      };
    }

    const count = await Notification.countDocuments(filter);
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT /api/notifications/mark-all-read — Mark all as read
router.put('/mark-all-read', protect, async (req, res) => {
  try {
    const user = req.user;

    await Notification.updateMany(
      {
        $or: [
          { targetUserId: user._id },
          { targetRole: user.role },
          { targetRole: 'all' }
        ]
      },
      { read: true }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT /api/notifications/:id/read — Mark single as read
router.put('/:id/read', protect, async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
