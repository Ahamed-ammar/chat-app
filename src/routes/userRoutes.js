import express from 'express';
import { searchUsers, getContacts } from '../controllers/userController.js';

const router = express.Router();

router.get('/search', searchUsers);
router.get('/contacts', getContacts);

export default router;
