// ═══════════════════════════════════════════
// LANDING.JS — Animations, Dark Mode, Counters
// ═══════════════════════════════════════════

// ── Dark Mode ──
const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;

function getTheme() {
  return localStorage.getItem('rms_theme') || 'light';
}

function setTheme(theme) {
  html.setAttribute('data-theme', theme);
  localStorage.setItem('rms_theme', theme);
  if (themeToggle) {
    themeToggle.querySelector('.theme-icon').textContent = theme === 'dark' ? '☀️' : '🌙';
  }
}

// Apply saved theme on load
setTheme(getTheme());

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    setTheme(getTheme() === 'dark' ? 'light' : 'dark');
  });
}

// ── Navbar scroll effect ──
const navbar = document.getElementById('navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  });
}

// ── Mobile hamburger ──
const hamburger = document.getElementById('hamburger');
const navMobile = document.getElementById('navMobile');
if (hamburger && navMobile) {
  hamburger.addEventListener('click', () => {
    navMobile.classList.toggle('open');
  });
  // Close on link click
  navMobile.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => navMobile.classList.remove('open'));
  });
}

// ── Scroll-triggered animations ──
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => {
        entry.target.classList.add('visible');
      }, i * 80);
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));

// ── Counter animation ──
function animateCounter(el, target, duration = 1500) {
  let start = 0;
  const step = target / (duration / 16);
  const timer = setInterval(() => {
    start += step;
    if (start >= target) {
      el.textContent = target;
      clearInterval(timer);
    } else {
      el.textContent = Math.floor(start);
    }
  }, 16);
}

// Trigger counters when hero stats come into view
const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.querySelectorAll('.stat-num').forEach(el => {
        const target = parseInt(el.dataset.target || '0');
        animateCounter(el, target);
      });
      statsObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

const heroStats = document.querySelector('.hero-stats');
if (heroStats) statsObserver.observe(heroStats);

// ── Smooth scroll for nav links ──
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const offset = 80;
      window.scrollTo({ top: target.offsetTop - offset, behavior: 'smooth' });
    }
  });
});

// ── Live Stats from localStorage ──
function loadLiveStats() {
  const studentsEl    = document.getElementById('stat-students');
  const teachersEl    = document.getElementById('stat-teachers');
  const subjectsEl    = document.getElementById('stat-subjects');
  const departmentsEl = document.getElementById('stat-departments');
  const routinesEl    = document.getElementById('stat-routines');

  if (!studentsEl) return; // not on landing page

  try {
    const users      = JSON.parse(localStorage.getItem('rms_users') || '[]');
    const routines   = JSON.parse(localStorage.getItem('rms_routines') || '[]');
    const depts      = JSON.parse(localStorage.getItem('rms_departments') || 'null');

    const students    = users.filter(u => u.role === 'student').length;
    const teachers    = users.filter(u => u.role === 'teacher').length;

    // Collect unique subjects across all routines
    const subjectSet = new Set();
    routines.forEach(r => (r.slots || []).forEach(s => {
      if (s.subject) subjectSet.add(s.subject.trim());
    }));

    // Departments: from stored list or default
    const defaultDepts = ['CSE', 'IT', 'ECE', 'EE', 'AIML', 'Data Science'];
    const deptCount = depts ? depts.length : defaultDepts.length;

    // Animate counters
    animateStat(studentsEl,    students);
    animateStat(teachersEl,    teachers);
    animateStat(subjectsEl,    subjectSet.size);
    animateStat(departmentsEl, deptCount);
    animateStat(routinesEl,    routines.length);
  } catch (e) {
    // localStorage not available or empty — show defaults
    [studentsEl, teachersEl, subjectsEl, departmentsEl, routinesEl]
      .forEach(el => { if (el) el.textContent = '—'; });
  }
}

function animateStat(el, target, duration = 1200) {
  if (!el || target === 0) { if (el) el.textContent = target; return; }
  let start = 0;
  const step = target / (duration / 16);
  const timer = setInterval(() => {
    start += step;
    if (start >= target) { el.textContent = target; clearInterval(timer); }
    else { el.textContent = Math.floor(start); }
  }, 16);
}

// Load stats when page is ready
document.addEventListener('DOMContentLoaded', () => {
  // Small delay so data.js initializes first
  setTimeout(loadLiveStats, 300);
});

// ── Patch App.route for login/signup pages to redirect to dashboard ──
if (typeof App !== 'undefined') {
  App.route = function() {
    if (Auth.isLoggedIn()) {
      window.location.href = 'dashboard.html';
    } else {
      window.location.href = 'login.html';
    }
  };
}
