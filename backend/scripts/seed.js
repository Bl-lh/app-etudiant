const { initDatabase } = require('../src/config/initDatabase');

async function run() {
  console.log('Lancement du script seed...');
  await initDatabase();
  console.log('Seed terminé avec succès.');
  process.exit(0);
}

run().catch((err) => {
  console.error('Erreur seed :', err);
  process.exit(1);
});
