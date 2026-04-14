const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: {
    type: String,
    enum: [
      'message', 'mention', 'reply', 'achievement', 'badge',
      'friend_request', 'friend_accepted', 'upvote', 'comment',
      'community_invite', 'room_invite', 'system', 'level_up'
    ],
    required: true,
  },
  title: { type: String, required: true },
  content: { type: String, required: true },
  link: { type: String, default: '' },
  read: { type: Boolean, default: false },
  icon: { type: String, default: '🔔' },
}, { timestamps: true });

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
