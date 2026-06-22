import express from 'express';
import * as roomController from '../controllers/roomController.js';
import * as messageController from '../controllers/messageController.js';

const router = express.Router();

// Room routes
router.post('/', roomController.createRoom);
router.get('/', roomController.getRooms);
router.post('/direct', roomController.getOrCreateDirectRoom);
router.post('/:id/join', roomController.joinRoom);
router.post('/:id/members', roomController.addMember);

// Message routes
router.post('/:id/messages', messageController.sendMessage);
router.get('/:id/messages', messageController.getMessages);

export default router;
