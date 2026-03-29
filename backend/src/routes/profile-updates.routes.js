const express = require('express');
const { auth } = require('../middleware/auth');
const { listByUser, create, remove } = require('../controllers/profile-updates.controller');
const router = express.Router();

router.get('/user/:userId', listByUser);
router.post('/', auth, create);
router.delete('/:id', auth, remove);

module.exports = router;
