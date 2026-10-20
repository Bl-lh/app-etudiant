const express = require('express');
const router = express.Router();
const { getShiftRightStatus, simulateTransaction } = require('../controllers/shiftRightController');

// Route de diagnostic
router.get('/status', getShiftRightStatus);

// Route de simulation de transaction sensible aux Feature Flags et au Canary
router.post('/transaction', simulateTransaction);
router.get('/transaction', simulateTransaction); // Support GET pour tests curl rapides

module.exports = router;
