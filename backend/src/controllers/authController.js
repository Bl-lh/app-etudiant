const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const { JWT_SECRET } = require('../middleware/authMiddleware');

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Inscription d'un nouvel étudiant ou utilisateur
 */
async function register(req, res, next) {
  try {
    const { name, email, password, role = 'STUDENT', phone } = req.body;

    // Normalisation de l'email
    const normalizedEmail = email.trim().toLowerCase();

    // Vérification de l'unicité de l'email
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [normalizedEmail]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Un compte avec cette adresse email existe déjà.'
      });
    }

    // Validation du rôle autorisé lors de l'auto-inscription (par défaut STUDENT)
    const assignedRole = ['STUDENT', 'INSTRUCTOR'].includes(role) ? role : 'STUDENT';

    // Hachage sécurisé du mot de passe
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insertion dans la base MySQL
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), normalizedEmail, passwordHash, assignedRole, phone ? phone.trim() : null]
    );

    const userId = result.insertId;

    // Génération du Token JWT
    const token = jwt.sign(
      { userId, email: normalizedEmail, role: assignedRole },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.status(201).json({
      success: true,
      message: 'Compte étudiant créé avec succès.',
      token,
      user: {
        id: userId,
        name: name.trim(),
        email: normalizedEmail,
        role: assignedRole,
        phone: phone || null
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Connexion d'un utilisateur existant
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const normalizedEmail = (email || '').trim().toLowerCase();

    const [rows] = await pool.query(
      'SELECT id, name, email, password_hash, role, phone FROM users WHERE email = ?',
      [normalizedEmail]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Identifiants invalides (email ou mot de passe incorrect).'
      });
    }

    const user = rows[0];

    // Vérification du mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Identifiants invalides (email ou mot de passe incorrect).'
      });
    }

    // Génération du token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.status(200).json({
      success: true,
      message: 'Authentification réussie.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Récupérer les informations de l'utilisateur connecté
 */
async function getMe(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.phone, u.created_at,
              (SELECT COUNT(*) FROM enrollments WHERE user_id = u.id) as total_enrollments
       FROM users u WHERE u.id = ?`,
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur introuvable.'
      });
    }

    return res.status(200).json({
      success: true,
      user: rows[0]
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Mise à jour du profil utilisateur
 */
async function updateProfile(req, res, next) {
  try {
    const { name, phone } = req.body;
    const userId = req.user.id;

    await pool.query(
      'UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone) WHERE id = ?',
      [name ? name.trim() : null, phone ? phone.trim() : null, userId]
    );

    const [updated] = await pool.query(
      'SELECT id, name, email, role, phone FROM users WHERE id = ?',
      [userId]
    );

    return res.status(200).json({
      success: true,
      message: 'Profil mis à jour avec succès.',
      user: updated[0]
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  login,
  getMe,
  updateProfile
};
