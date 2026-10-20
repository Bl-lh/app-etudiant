const express = require('express');
const { body } = require('express-validator');
const enrollmentController = require('../controllers/enrollmentController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
const { handleValidationErrors } = require('../middleware/validationMiddleware');

const router = express.Router();

// Inscription d'un étudiant à un cours
router.post(
  '/',
  authenticateToken,
  [
    body('courseId').isInt({ min: 1 }).withMessage('L\'identifiant du cours doit être un entier valide.'),
    handleValidationErrors
  ],
  enrollmentController.enrollCourse
);

// Consultation des inscriptions de l'étudiant connecté
router.get('/my', authenticateToken, enrollmentController.getMyEnrollments);

// Consultation d'une inscription spécifique
router.get('/:id', authenticateToken, enrollmentController.getEnrollmentById);

// Annulation d'une inscription
router.delete('/:id', authenticateToken, enrollmentController.cancelEnrollment);

// Administration : toutes les inscriptions
router.get('/', authenticateToken, requireRole('ADMIN'), enrollmentController.getAllEnrollments);

module.exports = router;
