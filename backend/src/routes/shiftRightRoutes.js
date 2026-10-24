const express = require('express');
const router = express.Router();
const {
  getShiftRightStatus,
  simulateTransaction,
  toggleFeatureFlag,
  rollbackCanary,
  promoteCanary,
  getCanaryStatus
} = require('../controllers/shiftRightController');

// Route de diagnostic
router.get('/status', getShiftRightStatus);

// Route de simulation de transaction sensible aux Feature Flags et au Canary
router.post('/transaction', simulateTransaction);
router.get('/transaction', simulateTransaction); // Support GET pour tests curl rapides

// Route de contrôle dynamique des Feature Flags (Panne simulée & Kill Switch Cloud)
router.post('/unleash/toggle', toggleFeatureFlag);
router.get('/unleash/toggle', toggleFeatureFlag);

// Routes de contrôle dynamique du Canary (Rollback & Promote)
router.get('/canary/status', getCanaryStatus);
router.post('/canary/rollback', rollbackCanary);
router.get('/canary/rollback', rollbackCanary);
router.post('/canary/promote', promoteCanary);
router.get('/canary/promote', promoteCanary);

module.exports = router;
