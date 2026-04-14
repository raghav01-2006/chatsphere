const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: Number, required: true }, // index of correct option
  explanation: { type: String, default: '' },
  category: {
    type: String,
    enum: ['Technology', 'Science', 'Mathematics', 'History', 'General Knowledge', 'Programming', 'Other'],
    default: 'General Knowledge',
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium',
  },
  xpReward: { type: Number, default: 20 },
  timeLimitSeconds: { type: Number, default: 30 },
  isActive: { type: Boolean, default: true },
  usedOn: [{ type: Date }], // track which days this was used as daily quiz
}, { timestamps: true });

module.exports = mongoose.model('Quiz', quizSchema);
