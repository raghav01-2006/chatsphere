const express = require('express');
const router = express.Router();
const { getUserById, searchUsers, getLeaderboard, sendFriendRequest, acceptFriendRequest, blockUser } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/search', searchUsers);
router.get('/leaderboard', getLeaderboard);
router.get('/:id', getUserById);
router.post('/:id/friend-request', sendFriendRequest);
router.post('/:id/accept-friend', acceptFriendRequest);
router.post('/:id/block', blockUser);

module.exports = router;
