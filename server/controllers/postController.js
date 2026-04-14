const Post = require('../models/Post');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { awardXP } = require('../utils/gamification');

// @desc    Get posts for a community
// @route   GET /api/posts?community=&sort=hot|new|top&page=
const getPosts = async (req, res) => {
  try {
    const { community, sort = 'new', page = 1, limit = 15, tag } = req.query;
    const query = { isDeleted: false };
    if (community) query.community = community;
    if (tag) query.tags = tag;

    let sortQuery = { createdAt: -1 };
    if (sort === 'top') sortQuery = { 'upvotes.length': -1 };
    if (sort === 'hot') sortQuery = { views: -1, createdAt: -1 };

    const posts = await Post.find(query)
      .populate('author', 'username avatar level badges')
      .populate('community', 'name slug avatar')
      .sort(sortQuery)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Post.countDocuments(query);

    res.json({ success: true, posts, total });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create post
// @route   POST /api/posts
const createPost = async (req, res) => {
  try {
    const { title, body, community, tags, flair, images } = req.body;

    const post = await Post.create({
      title,
      body,
      community,
      tags: tags || [],
      flair: flair || '',
      images: images || [],
      author: req.user._id,
    });

    await User.findByIdAndUpdate(req.user._id, { $inc: { totalPosts: 1 } });
    await awardXP(req.user._id, 'post');

    await post.populate('author', 'username avatar level');
    await post.populate('community', 'name slug');

    res.status(201).json({ success: true, post });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single post
// @route   GET /api/posts/:id
const getPost = async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    )
      .populate('author', 'username avatar level badges bio')
      .populate('community', 'name slug avatar')
      .populate('comments.author', 'username avatar level');

    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    res.json({ success: true, post });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upvote / downvote post
// @route   POST /api/posts/:id/vote
const votePost = async (req, res) => {
  try {
    const { vote } = req.body; // 'up' or 'down'
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const userId = req.user._id.toString();
    const upvoted = post.upvotes.map(id => id.toString()).includes(userId);
    const downvoted = post.downvotes.map(id => id.toString()).includes(userId);

    if (vote === 'up') {
      if (upvoted) {
        post.upvotes = post.upvotes.filter(id => id.toString() !== userId);
      } else {
        post.upvotes.push(req.user._id);
        post.downvotes = post.downvotes.filter(id => id.toString() !== userId);
        if (!upvoted) await awardXP(post.author, 'upvote_received');
      }
    } else {
      if (downvoted) {
        post.downvotes = post.downvotes.filter(id => id.toString() !== userId);
      } else {
        post.downvotes.push(req.user._id);
        post.upvotes = post.upvotes.filter(id => id.toString() !== userId);
      }
    }

    await post.save();
    res.json({ success: true, upvotes: post.upvotes.length, downvotes: post.downvotes.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add comment
// @route   POST /api/posts/:id/comment
const addComment = async (req, res) => {
  try {
    const { content } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    post.comments.push({ author: req.user._id, content });
    await post.save();
    await awardXP(req.user._id, 'comment');

    await post.populate('comments.author', 'username avatar level');

    const newComment = post.comments[post.comments.length - 1];

    if (post.author.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: post.author,
        sender: req.user._id,
        type: 'comment',
        title: 'New Comment',
        content: `${req.user.username} commented on your post`,
        icon: '💬',
        link: `/communities/post/${post._id}`,
      });
    }

    res.status(201).json({ success: true, comment: newComment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getPosts, createPost, getPost, votePost, addComment };
