const express = require('express');
const statsController = require('../controllers/statsController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authenticateToken, requireRole('ADMIN'), statsController.getPlatformStats);

module.exports = router;
