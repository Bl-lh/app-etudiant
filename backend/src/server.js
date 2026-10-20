const app = require('./app');
const { testConnection } = require('./config/db');
const { initUnleash } = require('./services/unleashService');

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  const isDbReady = await testConnection();

  if (!isDbReady) {
    console.error('AVERTISSEMENT : Connexion MySQL non établie. Vérifiez vos identifiants ou le conteneur Docker.');
  } else {
    console.log('✓ Base de données MySQL connectée avec succès (Persistance active)');
  }

  // Initialisation du client Unleash (Feature Flags & Kill Switch)
  initUnleash();

  const server = app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`  Plateforme d'Inscription aux Cours En Ligne (API REST) `);
    console.log(`  Projet : Réalisation du Processus des Tests Logiciels `);
    console.log(`  Serveur opérationnel sur : http://localhost:${PORT}`);
    console.log(`  Santé API : http://localhost:${PORT}/health`);
    console.log(`  Centre QA & Tests : http://localhost:${PORT}/api/qa/status`);
    console.log(`=======================================================`);
  });

  // Arrêt gracieux (Graceful Shutdown)
  const gracefulShutdown = () => {
    console.log('\nFermeture du serveur en cours...');
    server.close(() => {
      console.log('Serveur HTTP arrêté proprement.');
      process.exit(0);
    });
  };

  process.on('SIGINT', gracefulShutdown);
  process.on('SIGTERM', gracefulShutdown);
}

bootstrap();
