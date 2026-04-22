const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '', maxlength: 300 },
  type: {
    type: String,
    enum: ['direct', 'group', 'community'],
    default: 'group',
  },
  avatar: { type: String, default: '' },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  pendingRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isPrivate: { type: Boolean, default: false },
  inviteCode: { type: String, unique: true, sparse: true },
  pinnedMessages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }],
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  lastActivity: { type: Date, default: Date.now },
  tags: [{ type: String }],
  rules: { type: String, default: '' },
  maxMembers: { type: Number, default: 500 },
  slowMode: { type: Number, default: 0 }, // seconds between messages
  isArchived: { type: Boolean, default: false },
}, { timestamps: true });

roomSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Room', roomSchema);
