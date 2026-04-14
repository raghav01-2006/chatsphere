const Quiz = require('../models/Quiz');
const User = require('../models/User');
const { awardXP } = require('../utils/gamification');

// @desc    Get daily quiz (5 questions)
// @route   GET /api/game/quiz/daily
const getDailyQuiz = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const today = new Date().toDateString();
    const quizDate = user.dailyQuizDate ? new Date(user.dailyQuizDate).toDateString() : null;

    if (user.dailyQuizCompleted && quizDate === today) {
      return res.status(400).json({ success: false, message: 'Daily quiz already completed', alreadyDone: true });
    }

    // Get 5 random questions
    const questions = await Quiz.aggregate([
      { $match: { isActive: true } },
      { $sample: { size: 5 } },
    ]);

    // Remove correct answers from response
    const sanitized = questions.map(q => ({
      _id: q._id,
      question: q.question,
      options: q.options,
      category: q.category,
      difficulty: q.difficulty,
      timeLimitSeconds: q.timeLimitSeconds,
      xpReward: q.xpReward,
    }));

    res.json({ success: true, questions: sanitized });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Submit quiz answers
// @route   POST /api/game/quiz/submit
const submitQuiz = async (req, res) => {
  try {
    const { answers } = req.body; // [{ questionId, selectedAnswer }]

    const user = await User.findById(req.user._id);
    const today = new Date().toDateString();
    const quizDate = user.dailyQuizDate ? new Date(user.dailyQuizDate).toDateString() : null;

    if (user.dailyQuizCompleted && quizDate === today) {
      return res.status(400).json({ success: false, message: 'Daily quiz already completed' });
    }

    const results = [];
    let totalXP = 0;
    let correctCount = 0;

    for (const answer of answers) {
      const question = await Quiz.findById(answer.questionId);
      if (!question) continue;

      const isCorrect = question.correctAnswer === answer.selectedAnswer;
      if (isCorrect) {
        correctCount++;
        totalXP += question.xpReward;
      }

      results.push({
        questionId: answer.questionId,
        question: question.question,
        selectedAnswer: answer.selectedAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        explanation: question.explanation,
      });
    }

    // Award XP for correct answers
    if (totalXP > 0) {
      user.xp += totalXP;
      user.weeklyXP = (user.weeklyXP || 0) + totalXP;
      user.monthlyXP = (user.monthlyXP || 0) + totalXP;
    }

    user.dailyQuizCompleted = true;
    user.dailyQuizDate = new Date();
    await user.save();

    res.json({
      success: true,
      results,
      score: `${correctCount}/${answers.length}`,
      xpEarned: totalXP,
      totalXP: user.xp,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get leaderboard
// @route   GET /api/game/leaderboard
const getLeaderboard = async (req, res) => {
  try {
    const { period = 'all' } = req.query;
    let sortField = 'xp';
    if (period === 'weekly') sortField = 'weeklyXP';
    if (period === 'monthly') sortField = 'monthlyXP';

    const users = await User.find({})
      .select(`username avatar level ${sortField} badges loginStreak totalMessages`)
      .populate('badges', 'icon name rarity')
      .sort({ [sortField]: -1 })
      .limit(100);

    const enriched = users.map((u, i) => ({
      rank: i + 1,
      _id: u._id,
      username: u.username,
      avatar: u.avatar,
      level: u.level,
      xp: u[sortField] || u.xp,
      badges: u.badges,
      loginStreak: u.loginStreak,
    }));

    res.json({ success: true, leaderboard: enriched, period });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Seed quiz questions (admin only)
// @route   POST /api/game/quiz/seed
const seedQuizzes = async (req, res) => {
  try {
    const defaultQuestions = [
      { question: 'What does HTTP stand for?', options: ['HyperText Transfer Protocol', 'High Transfer Text Protocol', 'Hyper Transfer Text Protocol', 'HyperTool Text Protocol'], correctAnswer: 0, category: 'Technology', difficulty: 'easy', xpReward: 10, explanation: 'HTTP stands for HyperText Transfer Protocol, the foundation of web communication.' },
      { question: 'Which data structure uses LIFO order?', options: ['Queue', 'Stack', 'Array', 'Linked List'], correctAnswer: 1, category: 'Programming', difficulty: 'easy', xpReward: 10 },
      { question: 'What is the time complexity of binary search?', options: ['O(n)', 'O(n²)', 'O(log n)', 'O(1)'], correctAnswer: 2, category: 'Programming', difficulty: 'medium', xpReward: 20 },
      { question: 'Who invented the World Wide Web?', options: ['Bill Gates', 'Tim Berners-Lee', 'Linus Torvalds', 'Steve Jobs'], correctAnswer: 1, category: 'Technology', difficulty: 'easy', xpReward: 10 },
      { question: 'What does CSS stand for?', options: ['Creative Style Sheets', 'Computer Style Sheets', 'Cascading Style Sheets', 'Colorful Style Sheets'], correctAnswer: 2, category: 'Technology', difficulty: 'easy', xpReward: 10 },
      { question: 'Which planet is known as the Red Planet?', options: ['Venus', 'Jupiter', 'Saturn', 'Mars'], correctAnswer: 3, category: 'Science', difficulty: 'easy', xpReward: 10 },
      { question: 'What is 2^10?', options: ['512', '1024', '2048', '256'], correctAnswer: 1, category: 'Mathematics', difficulty: 'easy', xpReward: 10 },
      { question: 'Which language runs in a web browser?', options: ['Java', 'C++', 'JavaScript', 'Python'], correctAnswer: 2, category: 'Programming', difficulty: 'easy', xpReward: 10 },
      { question: 'What is the fastest sorting algorithm on average?', options: ['Bubble Sort', 'Insertion Sort', 'Merge Sort', 'QuickSort'], correctAnswer: 3, category: 'Programming', difficulty: 'hard', xpReward: 30 },
      { question: 'What year was the first iPhone released?', options: ['2005', '2006', '2007', '2008'], correctAnswer: 2, category: 'Technology', difficulty: 'medium', xpReward: 20 },
    ];

    await Quiz.deleteMany({});
    await Quiz.insertMany(defaultQuestions);

    res.json({ success: true, message: `${defaultQuestions.length} quiz questions seeded` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Seed badges
// @route   POST /api/game/badges/seed
const seedBadges = async (req, res) => {
  try {
    const Badge = require('../models/Badge');
    const defaultBadges = [
      { name: 'First Chat', description: 'Sent your first message', icon: '🎯', rarity: 'common', condition: { type: 'messages', threshold: 1 }, xpReward: 25 },
      { name: 'Chatterbox', description: 'Sent 100 messages', icon: '💬', rarity: 'uncommon', condition: { type: 'messages', threshold: 100 }, xpReward: 75 },
      { name: 'Community Builder', description: 'Created your first post', icon: '🌟', rarity: 'common', condition: { type: 'posts', threshold: 1 }, xpReward: 30 },
      { name: 'Scholar', description: 'Reached Level 5', icon: '📚', rarity: 'rare', condition: { type: 'level', threshold: 5 }, xpReward: 150 },
      { name: 'Veteran', description: 'Reached Level 8', icon: '⚔️', rarity: 'epic', condition: { type: 'level', threshold: 8 }, xpReward: 300 },
      { name: 'Legend', description: 'Reached Level 10', icon: '👑', rarity: 'legendary', condition: { type: 'level', threshold: 10 }, xpReward: 1000 },
      { name: 'On Fire', description: '7-day login streak', icon: '🔥', rarity: 'uncommon', condition: { type: 'streak', threshold: 7 }, xpReward: 100 },
      { name: 'Dedicated', description: '30-day login streak', icon: '💪', rarity: 'epic', condition: { type: 'streak', threshold: 30 }, xpReward: 500 },
    ];

    await Badge.deleteMany({});
    await Badge.insertMany(defaultBadges);

    res.json({ success: true, message: `${defaultBadges.length} badges seeded` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getDailyQuiz, submitQuiz, getLeaderboard, seedQuizzes, seedBadges };
