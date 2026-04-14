const mongoose = require('mongoose');

const communitySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  description: { type: String, required: true, maxlength: 500 },
  avatar: { type: String, default: '' },
  banner: { type: String, default: '' },
  tags: [{ type: String, lowercase: true }],
  category: {
    type: String,
    enum: ['Technology', 'Education', 'Gaming', 'Science', 'Art', 'Music', 'Sports', 'General', 'Other'],
    default: 'General',
  },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  moderators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isPrivate: { type: Boolean, default: false },
  rules: [{ title: String, description: String }],
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' }, // linked chat room
  totalPosts: { type: Number, default: 0 },
  isVerified: { type: Boolean, default: false },
}, { timestamps: true });

communitySchema.index({ name: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Community', communitySchema);
