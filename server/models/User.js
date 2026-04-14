const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    minlength: 6,
    select: false,
  },
  googleId: { type: String },
  avatar: {
    type: String,
    default: '',
  },
  coverImage: { type: String, default: '' },
  bio: { type: String, default: '', maxlength: 200 },
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  badges: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Badge' }],
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  friendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isAdmin: { type: Boolean, default: false },
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now },
  loginStreak: { type: Number, default: 0 },
  lastLoginDate: { type: Date },
  dailyQuizCompleted: { type: Boolean, default: false },
  dailyQuizDate: { type: Date },
  status: { type: String, default: '🟢 Active', maxlength: 60 },
  theme: { type: String, enum: ['dark', 'light'], default: 'dark' },
  notifications: { type: Boolean, default: true },
  weeklyXP: { type: Number, default: 0 },
  monthlyXP: { type: Number, default: 0 },
  totalMessages: { type: Number, default: 0 },
  totalPosts: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Calculate level from XP
userSchema.methods.calculateLevel = function () {
  const thresholds = [0, 100, 300, 700, 1500, 3000, 6000, 12000, 25000, 50000];
  let level = 1;
  for (let i = 0; i < thresholds.length; i++) {
    if (this.xp >= thresholds[i]) level = i + 1;
  }
  this.level = Math.min(level, 10);
};

module.exports = mongoose.model('User', userSchema);
