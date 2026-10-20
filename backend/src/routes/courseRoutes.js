const express = require('express');
const { body } = require('express-validator');
const courseController = require('../controllers/courseController');
const { authenticateToken, requireRole, optionalAuth } = require('../middleware/authMiddleware');
const { handleValidationErrors } = require('../middleware/validationMiddleware');

const router = express.Router();

// Routes publiques / consultation
router.get('/', optionalAuth, courseController.getAllCourses);
router.get('/categories', courseController.getCategories);
router.get('/:id', optionalAuth, courseController.getCourseById);

// Routes d'administration des cours
router.post(
  '/',
  authenticateToken,
  requireRole('ADMIN', 'INSTRUCTOR'),
  [
    body('title').trim().isLength({ min: 5, max: 200 }).withMessage('Le titre doit contenir entre 5 et 200 caractères.'),
    body('category_id').isInt({ min: 1 }).withMessage('ID de catégorie invalide.'),
    body('summary').trim().isLength({ min: 10, max: 300 }).withMessage('Le résumé doit faire entre 10 et 300 caractères.'),
    body('description').trim().isLength({ min: 20 }).withMessage('La description détaillée est trop courte.'),
    body('price').isFloat({ min: 0 }).withMessage('Le prix doit être un nombre positif ou nul.'),
    body('capacity').isInt({ min: 1, max: 500 }).withMessage('La capacité doit être comprise entre 1 et 500 places.'),
    handleValidationErrors
  ],
  courseController.createCourse
);

router.put('/:id', authenticateToken, requireRole('ADMIN', 'INSTRUCTOR'), courseController.updateCourse);
router.delete('/:id', authenticateToken, requireRole('ADMIN'), courseController.deleteCourse);

module.exports = router;
