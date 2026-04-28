const express = require('express');
const { auth } = require('../middleware/auth');
const {
  listThreads,
  getThread,
  createThread,
  incrementViewCount,
  updateThreadFlags,
  deleteThread,
  createComment,
  deleteComment,
  voteComment,
} = require('../controllers/threads.controller');
const router = express.Router();

router.get('/', listThreads);
router.get('/:id', getThread);
router.post('/', auth, createThread);
router.post('/:id/view', incrementViewCount);
router.post('/:id/comments', auth, createComment);

// Delete a comment — author, admin, or owner only
router.delete('/comments/:commentId', auth, deleteComment);

router.patch('/:id', auth, updateThreadFlags);
router.delete('/:id', auth, deleteThread);

// Vote on a comment — also updates the comment author's karma
router.post('/comments/:commentId/vote', auth, voteComment);

module.exports = router;
