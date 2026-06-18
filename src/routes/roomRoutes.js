import express from 'express';
import * as roomController from '../controllers/roomController.js';
import * as messageController from '../controllers/messageController.js';

const router = express.Router();

// Room routes
router.post('/', roomController.createRoom);
router.get('/', roomController.getRooms);
router.post('/:id/join', roomController.joinRoom);

// Message routes
router.post('/:id/messages', messageController.sendMessage);
router.get('/:id/messages', messageController.getMessages);

export default router;
