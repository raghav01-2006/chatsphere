const express = require('express');
const router = express.Router();
const { getPosts, createPost, getPost, votePost, addComment } = require('../controllers/postController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', getPosts);
router.post('/', createPost);
router.get('/:id', getPost);
router.post('/:id/vote', votePost);
router.post('/:id/comment', addComment);

module.exports = router;
