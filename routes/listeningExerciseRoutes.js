// routes/listeningExerciseRoutes.js
const router = require('express').Router();

// ✅ Return sample listening exercises
router.get('/', (req, res) => {
  res.json([
    {
      id: 1,
      title: 'Daily Conversations - Beginner',
      audioUrl: 'https://example.com/audio1.mp3',
      transcript: 'Hello, how are you?'
    },
    {
      id: 2,
      title: 'Business Meeting - Intermediate',
      audioUrl: 'https://example.com/audio2.mp3',
      transcript: 'Let’s discuss the quarterly results.'
    }
  ]);
});

module.exports = router;
