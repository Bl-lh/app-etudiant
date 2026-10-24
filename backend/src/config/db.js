const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// Charge le fichier .env approprié selon NODE_ENV
if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: '.env.test' });
} else {
  dotenv.config();
}

let poolConfig;

if (process.env.DATABASE_URL) {
  const isSsl = process.env.DB_SSL !== 'false';
  poolConfig = {
    uri: process.env.DATABASE_URL,
    waitForConnections: true,
    connectionLimit: 15,
    queueLimit: 0,
    decimalNumbers: true,
    multipleStatements: true,
    ssl: isSsl ? { rejectUnauthorized: false } : undefined
  };
} else {
  poolConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'campus_user',
    password: process.env.DB_PASSWORD || 'campus_password',
    database: process.env.DB_NAME || 'campus_enrollment_db',
    waitForConnections: true,
    connectionLimit: 15,
    queueLimit: 0,
    decimalNumbers: true,
    multipleStatements: true,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
  };
}

const pool = mysql.createPool(poolConfig);

/**
 * Teste la connexion à la base de données MySQL
 */
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    return true;
  } catch (error) {
    console.error('Erreur de connexion MySQL :', error.message);
    return false;
  }
}

/**
 * Exécute un ensemble de requêtes dans une transaction ACID
 * @param {Function} callback Fonction recevant la connexion transactionnelle
 */
async function withTransaction(callback) {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  try {
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  pool,
  testConnection,
  withTransaction
};
