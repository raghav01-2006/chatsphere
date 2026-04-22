const express = require('express');
const router = express.Router();
const {
  getRooms, getMyRooms, createRoom, getRoomById,
  getRoomMessages, joinRoom, joinByInviteCode, leaveRoom, createOrGetDM,
  requestJoinRoom, acceptJoinRequest, rejectJoinRequest
} = require('../controllers/roomController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getRooms);
router.get('/my', getMyRooms);       // match client: /rooms/my
router.get('/mine', getMyRooms);     // keep old route too
router.post('/', createRoom);
router.post('/dm/:userId', createOrGetDM);
router.post('/join/:inviteCode', joinByInviteCode);
router.get('/:id', getRoomById);
router.get('/:id/messages', getRoomMessages);
router.post('/:id/join', joinRoom);
router.post('/:id/leave', leaveRoom);
router.post('/:id/request-join', requestJoinRoom);
router.post('/:id/requests/:userId/accept', acceptJoinRequest);
router.post('/:id/requests/:userId/reject', rejectJoinRequest);

module.exports = router;
