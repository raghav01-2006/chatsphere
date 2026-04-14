const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  icon: { type: String, required: true }, // emoji or image URL
  color: { type: String, default: '#ffffff' },
  rarity: {
    type: String,
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
    default: 'common',
  },
  condition: {
    type: { type: String }, // 'messages', 'posts', 'quiz', 'streak', 'level', 'custom'
    threshold: { type: Number },
  },
  xpReward: { type: Number, default: 50 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Badge', badgeSchema);
