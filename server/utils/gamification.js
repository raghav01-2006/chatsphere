const User = require('../models/User');
const Badge = require('../models/Badge');
const Notification = require('../models/Notification');

const XP_RULES = {
  message: 2,
  post: 10,
  comment: 5,
  upvote_received: 5,
  quiz_correct: 20,
  daily_login: 10,
  friend_added: 15,
  community_created: 30,
  badge_unlocked: 50,
};

const LEVEL_THRESHOLDS = [0, 100, 300, 700, 1500, 3000, 6000, 12000, 25000, 50000];

const getLevelFromXP = (xp) => {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1;
  }
  return Math.min(level, 10);
};

const getXPForNextLevel = (currentLevel) => {
  if (currentLevel >= 10) return null;
  return LEVEL_THRESHOLDS[currentLevel]; // current level is 1-indexed
};

const awardXP = async (userId, action, io = null) => {
  const xpGained = XP_RULES[action] || 0;
  if (!xpGained) return;

  const user = await User.findById(userId);
  if (!user) return;

  const prevLevel = user.level;
  user.xp += xpGained;
  user.weeklyXP = (user.weeklyXP || 0) + xpGained;
  user.monthlyXP = (user.monthlyXP || 0) + xpGained;
  user.level = getLevelFromXP(user.xp);

  await user.save();

  // Level up notification
  if (user.level > prevLevel && io) {
    const notification = await Notification.create({
      recipient: userId,
      type: 'level_up',
      title: '🎉 Level Up!',
      content: `You reached Level ${user.level}! Keep going!`,
      icon: '⬆️',
    });
    io.to(userId.toString()).emit('new_notification', notification);
    io.to(userId.toString()).emit('level_up', { level: user.level, xp: user.xp });
  }

  // Check badge conditions
  await checkAndAwardBadges(userId, user, io);

  return { xp: user.xp, level: user.level, xpGained };
};

const checkAndAwardBadges = async (userId, user, io) => {
  const badges = await Badge.find({ isActive: true });
  const userBadges = user.badges.map(b => b.toString());

  for (const badge of badges) {
    if (userBadges.includes(badge._id.toString())) continue;

    let earned = false;
    const { type, threshold } = badge.condition || {};

    if (type === 'messages' && user.totalMessages >= threshold) earned = true;
    if (type === 'posts' && user.totalPosts >= threshold) earned = true;
    if (type === 'level' && user.level >= threshold) earned = true;
    if (type === 'streak' && user.loginStreak >= threshold) earned = true;

    if (earned) {
      user.badges.push(badge._id);
      user.xp += badge.xpReward || 50;
      await user.save();

      const notification = await Notification.create({
        recipient: userId,
        type: 'badge',
        title: '🏆 Badge Unlocked!',
        content: `You earned the "${badge.name}" badge! ${badge.icon}`,
        icon: badge.icon,
        link: `/profile/${userId}`,
      });

      if (io) {
        io.to(userId.toString()).emit('new_notification', notification);
        io.to(userId.toString()).emit('badge_earned', badge);
      }
    }
  }
};

const updateLoginStreak = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!user.lastLoginDate) {
    user.loginStreak = 1;
  } else {
    const lastLogin = new Date(user.lastLoginDate);
    lastLogin.setHours(0, 0, 0, 0);
    const diff = Math.floor((today - lastLogin) / (1000 * 60 * 60 * 24));

    if (diff === 1) {
      user.loginStreak += 1;
    } else if (diff > 1) {
      user.loginStreak = 1;
    }
    // diff === 0 means same day, no change
  }

  user.lastLoginDate = new Date();
  await user.save();

  return user.loginStreak;
};

module.exports = { awardXP, getLevelFromXP, getXPForNextLevel, updateLoginStreak, XP_RULES, LEVEL_THRESHOLDS };
