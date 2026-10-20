const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { handleValidationErrors } = require('../middleware/validationMiddleware');

const router = express.Router();

router.post(
  '/register',
  [
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Le nom complet doit comporter entre 2 et 100 caractères.'),
    body('email').trim().isEmail().withMessage('Format d\'adresse email invalide.'),
    body('password').isLength({ min: 6 }).withMessage('Le mot de passe doit comporter au moins 6 caractères.'),
    body('role').optional().isIn(['STUDENT', 'INSTRUCTOR']).withMessage('Rôle invalide.'),
    handleValidationErrors
  ],
  authController.register
);

router.post(
  '/login',
  [
    body('email').trim().isEmail().withMessage('Veuillez fournir un email valide.'),
    body('password').notEmpty().withMessage('Le mot de passe est obligatoire.'),
    handleValidationErrors
  ],
  authController.login
);

router.get('/me', authenticateToken, authController.getMe);
router.put('/profile', authenticateToken, authController.updateProfile);

module.exports = router;
