const express = require('express');
const router = express.Router();
const { getCommunities, createCommunity, getCommunity, joinCommunity, leaveCommunity } = require('../controllers/communityController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', getCommunities);
router.post('/', createCommunity);
router.get('/:id', getCommunity);
router.post('/:id/join', joinCommunity);
router.post('/:id/leave', leaveCommunity);

module.exports = router;
