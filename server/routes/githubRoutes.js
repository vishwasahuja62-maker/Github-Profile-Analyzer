const express = require('express');
const router = express.Router();
const githubController = require('../controllers/githubController');

router.get('/:username', githubController.getUserProfile);

module.exports = router;
