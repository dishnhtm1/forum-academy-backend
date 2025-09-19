// routes/analyticsRoutes.js
const router = require('express').Router();

// Example: Return fake dashboard stats so frontend stops 404
router.get('/dashboard', (req, res) => {
  const period = req.query.period || 'month';
  res.json({
    period,
    users: 120,
    courses: 8,
    quizzesTaken: 45,
    submissions: 30,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;