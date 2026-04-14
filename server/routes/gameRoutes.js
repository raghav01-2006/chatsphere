const express = require('express');
const router = express.Router();
const { getDailyQuiz, submitQuiz, getLeaderboard, seedQuizzes, seedBadges } = require('../controllers/gameController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect);
router.get('/quiz/daily', getDailyQuiz);
router.post('/quiz/submit', submitQuiz);
router.get('/leaderboard', getLeaderboard);
router.post('/quiz/seed', adminOnly, seedQuizzes);
router.post('/badges/seed', adminOnly, seedBadges);

module.exports = router;
