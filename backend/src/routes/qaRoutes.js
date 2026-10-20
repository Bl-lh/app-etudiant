const express = require('express');
const testRunnerController = require('../controllers/testRunnerController');

const router = express.Router();

router.get('/status', testRunnerController.getTestStatus);
router.post('/audit', testRunnerController.logTestAudit);
router.post('/run', testRunnerController.runLiveTests);

module.exports = router;
