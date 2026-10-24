const app = require('./app');
const { testConnection } = require('./config/db');
const { initDatabase } = require('./config/initDatabase');

let isInitialized = false;

/**
 * Handler Serverless pour déploiement Vercel
 * Initialise automatiquement la base TiDB Cloud au premier appel
 */
module.exports = async (req, res) => {
  if (!isInitialized) {
    try {
      const isDbReady = await testConnection();
      if (isDbReady) {
        await initDatabase();
      }
      isInitialized = true;
    } catch (e) {
      console.error('Database init error:', e.message);
    }
  }
  return app(req, res);
};
