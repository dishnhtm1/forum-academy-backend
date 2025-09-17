// routes/homeworkRoutes.js
const router = require('express').Router();

// List all homework
router.get('/', (req, res) => {
  res.json([
    { id: 1, title: 'Week 1 Assignment', dueDate: '2025-09-25' },
    { id: 2, title: 'Project Proposal', dueDate: '2025-09-30' }
  ]);
});

// Homework submissions summary
router.get('/submissions/summary', (req, res) => {
  res.json({
    total: 12,
    submitted: 10,
    pending: 2
  });
});

module.exports = router;
