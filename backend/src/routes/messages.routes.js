const express = require('express');
const { auth } = require('../middleware/auth');
const { listForMe, send, markRead, markConversationRead } = require('../controllers/messages.controller');
const router = express.Router();

router.get('/', auth, listForMe);
router.post('/', auth, send);
router.patch('/:id/read', auth, markRead);
router.post('/conversations/:senderId/read', auth, markConversationRead);

module.exports = router;
