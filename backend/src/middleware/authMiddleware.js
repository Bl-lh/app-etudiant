const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_development_only';

/**
 * Middleware d'authentification par Token JWT
 */
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.split(' ')[1] 
    : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Accès non autorisé. Jeton d\'authentification (JWT) manquant.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Vérification de la présence de l'utilisateur dans la base MySQL
    const [rows] = await pool.query(
      'SELECT id, name, email, role, phone FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur associé au jeton introuvable.'
      });
    }

    req.user = rows[0];
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Jeton JWT invalide ou expiré.',
      error: error.message
    });
  }
}

/**
 * Middleware d'autorisation par rôle (RBAC)
 * @param  {...string} allowedRoles Rôles autorisés ('STUDENT', 'INSTRUCTOR', 'ADMIN')
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Accès refusé. Nécessite l'un des rôles suivants : [${allowedRoles.join(', ')}]. Votre rôle : ${req.user.role}`
      });
    }

    next();
  };
}

/**
 * Authentification optionnelle (pour consultation publique avec statut utilisateur enrichi si connecté)
 */
async function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const [rows] = await pool.query(
      'SELECT id, name, email, role FROM users WHERE id = ?',
      [decoded.userId]
    );
    if (rows.length > 0) {
      req.user = rows[0];
    }
  } catch {
    // Si jeton invalide, on continue simplement en mode anonyme
  }
  next();
}

module.exports = {
  authenticateToken,
  requireRole,
  optionalAuth,
  JWT_SECRET
};
