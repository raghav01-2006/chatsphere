const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, maxlength: 1000 },
  upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  replies: [{
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    content: { type: String, maxlength: 500 },
    createdAt: { type: Date, default: Date.now },
  }],
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

const postSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  body: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', required: true },
  tags: [{ type: String, lowercase: true }],
  upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  downvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [commentSchema],
  images: [{ type: String }],
  isPinned: { type: Boolean, default: false },
  isLocked: { type: Boolean, default: false },
  views: { type: Number, default: 0 },
  isDeleted: { type: Boolean, default: false },
  flair: { type: String, default: '' },
}, { timestamps: true });

postSchema.index({ title: 'text', body: 'text', tags: 'text' });
postSchema.index({ community: 1, createdAt: -1 });

module.exports = mongoose.model('Post', postSchema);
