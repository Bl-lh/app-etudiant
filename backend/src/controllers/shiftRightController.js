const os = require('os');
const { isFeatureEnabled, getAllFlagsState, setFlagOverride } = require('../services/unleashService');

/**
 * Endpoint de diagnostic et métriques pour le Shift-Right Testing
 * Permet au reverse proxy et aux scripts de monitoring d'identifier le pod/version
 */
async function getShiftRightStatus(req, res) {
  const context = {
    userId: req.query.userId || 'anonymous',
    remoteAddress: req.ip
  };

  const flags = getAllFlagsState(context);

  return res.status(200).json({
    service: 'campus-enroll-backend',
    version: process.env.APP_VERSION || '1.0.0-stable',
    releaseType: process.env.RELEASE_TYPE || 'STABLE', // 'STABLE' ou 'CANARY'
    hostname: os.hostname(),
    uptime: Math.floor(process.uptime()),
    unleash: flags,
    headers: {
      receivedCanaryHeader: req.headers['x-canary'] || 'none',
      userAgent: req.headers['user-agent']
    },
    timestamp: new Date().toISOString()
  });
}

/**
 * Simulation d'une transaction métier sensible aux Feature Flags et à la version Canary
 * Permet d'injecter des pannes réelles (5xx, Latence, Dégradation) contrôlées par Unleash
 */
async function simulateTransaction(req, res) {
  const { userId = 'student-42', amount = 100.0 } = req.body;
  const context = { userId, remoteAddress: req.ip };

  const appVersion = process.env.APP_VERSION || '1.0.0-stable';
  const releaseType = process.env.RELEASE_TYPE || 'STABLE';

  // 1. Contrôle du Flag de Latence Chaos
  if (isFeatureEnabled('payment_latency_chaos', context, false)) {
    console.warn(`[CHAOS LATENCE] Injection d'un délai artificiel de 2000ms pour l'utilisateur ${userId}`);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // 2. Contrôle du Flag de Panne Critique (Failure Simulation via Unleash)
  const isFaultyPaymentActive = isFeatureEnabled('chaos_faulty_payment', context, false);

  if (isFaultyPaymentActive) {
    console.error(`[CHAOS FAILURE] Le Feature Flag 'chaos_faulty_payment' est ACTIF sur [${releaseType} - ${appVersion}] ! Panne simulée injectée.`);
    return res.status(500).json({
      success: false,
      status: 500,
      error: 'Internal Server Error (Simulated Failure)',
      errorCode: 'ERR_UNLEASH_CHAOS_PAYMENT_FAILURE',
      message: 'ÉCHEC CRITIQUE : La nouvelle passerelle de paiement a crashé. Feature flag actif !',
      details: {
        reason: 'NullPointerException / Deadlock simulé dans le composant de facturation v2',
        faultInjectedBy: 'Unleash Feature Flag [chaos_faulty_payment]'
      },
      metadata: {
        version: appVersion,
        releaseType: releaseType,
        hostname: os.hostname(),
        timestamp: new Date().toISOString()
      }
    });
  }

  // 3. Cas nominal : succès opérationnel
  return res.status(200).json({
    success: true,
    status: 200,
    message: 'Transaction validée avec succès. Moteur de règlement nominal opérationnel.',
    transactionId: `TX-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    amountPaid: amount,
    metadata: {
      version: appVersion,
      releaseType: releaseType,
      hostname: os.hostname(),
      canaryHit: releaseType === 'CANARY',
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * Basculer un Feature Flag à la volée (utile pour démo Cloud / Render sans terminal)
 */
async function toggleFeatureFlag(req, res) {
  const flag = req.body.flag || req.query.flag || 'chaos_faulty_payment';
  const action = req.body.action || req.query.action || (req.body.enabled !== undefined ? String(req.body.enabled) : 'status');

  if (action === 'on' || action === 'true' || action === 'enable') {
    setFlagOverride(flag, true);
    return res.status(200).json({
      success: true,
      message: `Feature Flag '${flag}' activé (Panne simulée).`,
      flag,
      state: true,
      killSwitchTriggered: false
    });
  } else if (action === 'off' || action === 'false' || action === 'disable' || action === 'kill') {
    setFlagOverride(flag, false);
    return res.status(200).json({
      success: true,
      message: `Kill Switch déclenché : Feature Flag '${flag}' désactivé. Trafic rétabli !`,
      flag,
      state: false,
      killSwitchTriggered: true
    });
  } else if (action === 'reset') {
    setFlagOverride(flag, null);
    return res.status(200).json({
      success: true,
      message: `Override réinitialisé pour '${flag}'.`,
      flag
    });
  }

  const currentState = isFeatureEnabled(flag, {}, false);
  return res.status(200).json({
    success: true,
    flag,
    state: currentState,
    hint: 'Passez ?action=on pour activer la panne ou ?action=off pour déclencher le Kill Switch.'
  });
}

module.exports = {
  getShiftRightStatus,
  simulateTransaction,
  toggleFeatureFlag
};
