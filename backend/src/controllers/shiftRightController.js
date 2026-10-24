const os = require('os');
const { isFeatureEnabled, getAllFlagsState, setFlagOverride } = require('../services/unleashService');

// État dynamique du routeur Canary (Simulation active pour Cloud, Vercel et Nginx)
let canaryState = {
  active: true,
  canaryPercentage: 10, // 10% Canary, 90% Stable
  status: 'ACTIVE_90_10',
  description: '90% Stable V1 / 10% Canary V2'
};

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
    version: process.env.APP_VERSION || 'v1.0.0-stable',
    releaseType: process.env.RELEASE_TYPE || 'STABLE',
    canaryRouter: canaryState,
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
  const { userId = 'student-42', amount = 100.0 } = req.body || {};
  const context = { userId, remoteAddress: req.ip };

  // Détermination intelligente de la version (Canary vs Stable)
  let releaseType = 'STABLE';
  let appVersion = 'v1.0.0-stable';

  const canaryHeader = req.headers['x-canary'];
  if (canaryHeader === 'always') {
    releaseType = 'CANARY';
    appVersion = 'v2.0.0-canary';
  } else if (canaryHeader === 'never') {
    releaseType = 'STABLE';
    appVersion = 'v1.0.0-stable';
  } else {
    // Répartition pondérée (simule le split_clients Nginx ou Vercel Edge)
    if (canaryState.canaryPercentage > 0 && (Math.random() * 100) < canaryState.canaryPercentage) {
      releaseType = 'CANARY';
      appVersion = 'v2.0.0-canary';
    } else {
      releaseType = 'STABLE';
      appVersion = 'v1.0.0-stable';
    }
  }

  // En-têtes HTTP de routage Canary Shift-Right
  const poolChoice = releaseType === 'CANARY' ? 'backend_canary' : 'backend_stable';
  res.setHeader('X-Canary-Pool', poolChoice);
  res.setHeader('X-Shift-Right-Router', 'Nginx-Canary-v1');
  res.setHeader('X-Served-By-Upstream', releaseType === 'CANARY' ? 'app-canary:5000' : 'app-stable:5000');

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
      message: 'ÉCHEC CRITIQUE : La passerelle de paiement a crashé. Feature flag Unleash actif !',
      details: {
        reason: 'NullPointerException / Timeout simulé dans la passerelle bancaire v2',
        faultInjectedBy: 'Unleash Feature Flag [chaos_faulty_payment]'
      },
      metadata: {
        version: appVersion,
        releaseType: releaseType,
        canaryPool: poolChoice,
        hostname: os.hostname(),
        timestamp: new Date().toISOString()
      }
    });
  }

  // 3. Cas nominal : succès opérationnel
  return res.status(200).json({
    success: true,
    status: 200,
    message: 'Transaction validée avec succès. Moteur de règlement opérationnel.',
    transactionId: `TX-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    amountPaid: amount,
    releaseType: releaseType, // Pour compatibilité simulate_traffic.sh
    version: appVersion,
    metadata: {
      version: appVersion,
      releaseType: releaseType,
      canaryPool: poolChoice,
      hostname: os.hostname(),
      canaryHit: releaseType === 'CANARY',
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * Basculer un Feature Flag à la volée (Panne simulée & Kill Switch)
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

/**
 * Déclencher le Rollback Canary (Isolation d'urgence -> 100% Stable V1)
 */
async function rollbackCanary(req, res) {
  canaryState = {
    active: false,
    canaryPercentage: 0,
    status: 'ROLLED_BACK_100_STABLE',
    description: '100% Stable V1 / 0% Canary V2 (Rollback d urgence exécuté)'
  };

  return res.status(200).json({
    success: true,
    message: 'Rollback Canary déclenché avec succès : 100% du trafic est désormais dirigé vers la version Stable V1.',
    canaryRouter: canaryState
  });
}

/**
 * Rétablir ou Promouvoir le Canary (ex: 90% Stable / 10% Canary)
 */
async function promoteCanary(req, res) {
  const ratio = parseInt(req.body.ratio || req.query.ratio || '10', 10);
  canaryState = {
    active: true,
    canaryPercentage: ratio,
    status: `ACTIVE_${100 - ratio}_${ratio}`,
    description: `${100 - ratio}% Stable V1 / ${ratio}% Canary V2 (Routage nominal actif)`
  };

  return res.status(200).json({
    success: true,
    message: `Routage Canary configuré : ${100 - ratio}% Stable / ${ratio}% Canary.`,
    canaryRouter: canaryState
  });
}

/**
 * Obtenir l'état du routeur Canary
 */
async function getCanaryStatus(req, res) {
  return res.status(200).json({
    service: 'nginx-canary-router',
    strategy: 'split_clients',
    ...canaryState
  });
}

module.exports = {
  getShiftRightStatus,
  simulateTransaction,
  toggleFeatureFlag,
  rollbackCanary,
  promoteCanary,
  getCanaryStatus
};
