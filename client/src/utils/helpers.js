// ─── Time helpers ─────────────────────────────────────────────────────────────
export const formatRelativeTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = (now - date) / 1000;

  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const formatMessageTime = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

export const formatFullDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
};

// ─── XP / Level helpers ───────────────────────────────────────────────────────
const XP_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5500, 7500];
const LEVEL_NAMES = ['Newcomer', 'Novice', 'Apprentice', 'Member', 'Regular',
  'Expert', 'Veteran', 'Master', 'Grandmaster', 'Legend', 'Champion'];

export const getLevelProgress = (xp = 0, level = 1) => {
  const currentThreshold = XP_THRESHOLDS[level - 1] || 0;
  const nextThreshold = XP_THRESHOLDS[level] || XP_THRESHOLDS[XP_THRESHOLDS.length - 1];
  if (level >= 10) return 100;
  return Math.min(100, Math.max(0, ((xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100));
};

export const getLevelName = (level = 1) => LEVEL_NAMES[Math.min(level - 1, LEVEL_NAMES.length - 1)];

export const getXPForLevel = (level) => XP_THRESHOLDS[level - 1] || 0;

export const formatXP = (xp) => {
  if (xp >= 1000) return `${(xp / 1000).toFixed(1)}K`;
  return String(xp);
};

// ─── String helpers ───────────────────────────────────────────────────────────
export const truncate = (str = '', max = 50) =>
  str.length > max ? str.slice(0, max) + '…' : str;

export const getAvatarFallback = (username = '') =>
  username.slice(0, 2).toUpperCase() || 'U';

// ─── Color generator for avatars ───────────────────────────────────────────────
const PALETTE = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b',
  '#6366f1', '#10b981', '#f97316', '#06b6d4', '#84cc16',
];

export const generateColor = (seed = '') => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
};

// ─── Badge rarity ─────────────────────────────────────────────────────────────
export const getRarityColor = (rarity) => ({
  common: '#9ca3af',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f59e0b',
}[rarity] || '#9ca3af');
