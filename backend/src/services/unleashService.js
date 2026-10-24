/**
 * Service d'intégration Unleash (Feature Flags & Kill Switch)
 * Module Singleton pour le Shift-Right Testing & Progressive Delivery
 */
const { initialize, isEnabled } = require('unleash-client');

let unleash = null;
let isReady = false;

function initUnleash() {
  const enabled = process.env.ENABLE_UNLEASH !== 'false';
  if (!enabled) {
    console.log('[Unleash] Service désactivé via ENABLE_UNLEASH=false (Mode Local/Test)');
    return;
  }

  const url = process.env.UNLEASH_URL || 'http://localhost:4242/api';
  const apiToken = process.env.UNLEASH_API_TOKEN || '*:production.be4436eb09f3a04a0d2447e180efdc35bedfc86e84b9d800fa77d169';
  const appName = process.env.UNLEASH_APP_NAME || 'campus-enroll-backend';
  const environment = process.env.UNLEASH_ENVIRONMENT || 'production';

  console.log(`[Unleash] Connexion au serveur Unleash : ${url} (App: ${appName}, Env: ${environment})`);

  try {
    unleash = initialize({
      url,
      appName,
      environment,
      customHeaders: {
        Authorization: apiToken
      },
      refreshInterval: 2000, // Synchronisation rapide toutes les 2 secondes (Kill Switch réactif)
      metricsInterval: 5000
    });

    unleash.on('ready', () => {
      isReady = true;
      console.log('✓ [Unleash] Client prêt et synchronisé avec le serveur distant.');
    });

    unleash.on('synchronized', () => {
      // Événement déclenché à chaque mise à jour de flag
      isReady = true;
    });

    unleash.on('error', (err) => {
      console.warn('⚠️ [Unleash] Avertissement de connexion (mode repli passif) :', err.message);
    });

    unleash.on('warn', (warn) => {
      console.warn('⚠️ [Unleash] Warning :', warn);
    });
  } catch (err) {
    console.warn('⚠️ [Unleash] Erreur lors de l\'initialisation :', err.message);
  }
}

const inMemoryOverrides = new Map();

function setFlagOverride(toggleName, enabled) {
  if (enabled === null || enabled === undefined || enabled === 'reset') {
    inMemoryOverrides.delete(toggleName);
  } else {
    inMemoryOverrides.set(toggleName, enabled === true || enabled === 'true' || enabled === 'on' || enabled === 1);
  }
  return inMemoryOverrides.get(toggleName);
}

/**
 * Vérifie si un Feature Flag est actif
 * @param {string} toggleName Nom du flag dans Unleash
 * @param {object} context Contexte utilisateur (userId, sessionId, etc.)
 * @param {boolean} defaultValue Valeur par défaut en cas d'inaccessibilité
 * @returns {boolean}
 */
function isFeatureEnabled(toggleName, context = {}, defaultValue = false) {
  // 1. Contrôle par override en mémoire (pour bascule dynamique Cloud / Render)
  if (inMemoryOverrides.has(toggleName)) {
    return inMemoryOverrides.get(toggleName);
  }

  // 2. Possibilité d'overrider via variable d'environnement pour tests locaux
  const envOverride = process.env[`OVERRIDE_FLAG_${toggleName.toUpperCase()}`];
  if (envOverride !== undefined) {
    return envOverride === 'true' || envOverride === '1';
  }

  if (!unleash || !isReady) {
    return defaultValue;
  }

  try {
    return isEnabled(toggleName, context, defaultValue);
  } catch (err) {
    console.warn(`[Unleash] Erreur d'évaluation du flag ${toggleName} :`, err.message);
    return defaultValue;
  }
}

/**
 * Récupère l'état courant de tous les flags clés
 */
function getAllFlagsState(context = {}) {
  const flags = [
    'chaos_faulty_payment',
    'enable_new_discount_v2',
    'canary_experimental_feature',
    'payment_latency_chaos'
  ];

  const result = {
    unleashConnected: isReady,
    inMemoryMode: !isReady || inMemoryOverrides.size > 0,
    flags: {}
  };

  for (const flag of flags) {
    result.flags[flag] = isFeatureEnabled(flag, context, false);
  }

  return result;
}

module.exports = {
  initUnleash,
  isFeatureEnabled,
  setFlagOverride,
  getAllFlagsState
};
