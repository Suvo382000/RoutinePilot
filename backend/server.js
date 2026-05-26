require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/routines', require('./routes/routines'));
app.use('/api/absent-requests', require('./routes/absentRequests'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/departments', require('./routes/departments'));

// Constants endpoint (public — for frontend dropdowns)
const constants = require('./utils/constants');
app.get('/api/constants', (req, res) => {
  res.json({
    days: constants.DAYS,
    theoryPeriods: constants.THEORY_PERIODS,
    labPeriods: constants.LAB_PERIODS,
    years: constants.YEARS,
    semesters: constants.SEMESTERS,
    facultyTypes: constants.FACULTY_TYPES,
    designations: constants.DESIGNATIONS,
    maxHours: constants.MAX_HOURS
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'RoutinePilot Backend is running' });
});

// ── Serve Frontend Static Files ──
// In production, serve the frontend from ../frontend
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Any route that doesn't match /api/* serves the frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`   Local:   http://localhost:${PORT}`);
  console.log(`   API:     http://localhost:${PORT}/api/health`);
  console.log(`   Frontend served from: ../frontend/\n`);
});
