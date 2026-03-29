const express = require('express');
const { auth } = require('../middleware/auth');
const { listThreads, getThread, createThread, incrementViewCount, updateThreadFlags, deleteThread, createComment } = require('../controllers/threads.controller');
const router = express.Router();

router.get('/', listThreads);
router.get('/:id', getThread);
router.post('/', auth, createThread);
router.post('/:id/view', incrementViewCount);
router.post('/:id/comments', auth, createComment);
router.patch('/:id', auth, updateThreadFlags);
router.delete('/:id', auth, deleteThread);

module.exports = router;
