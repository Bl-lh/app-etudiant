const express = require('express');
const { body } = require('express-validator');
const paymentController = require('../controllers/paymentController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
const { handleValidationErrors } = require('../middleware/validationMiddleware');

const router = express.Router();

// Vérification de code promo
router.post(
  '/validate-coupon',
  authenticateToken,
  [
    body('code').trim().notEmpty().withMessage('Le code promo est requis.'),
    body('coursePrice').optional().isFloat({ min: 0 }),
    handleValidationErrors
  ],
  paymentController.validateCoupon
);

// Traitement du paiement
router.post(
  '/process',
  authenticateToken,
  [
    body('enrollmentId').isInt({ min: 1 }).withMessage('L\'identifiant de l\'inscription est requis.'),
    body('paymentMethod').isIn(['CREDIT_CARD', 'PAYPAL', 'BANK_TRANSFER']).withMessage('Méthode de paiement non supportée.'),
    handleValidationErrors
  ],
  paymentController.processPayment
);

// Reçu / Facture de paiement
router.get('/receipt/:receiptNumber', authenticateToken, paymentController.getReceipt);

// Historique global des paiements (Administration)
router.get('/', authenticateToken, requireRole('ADMIN'), paymentController.getAllPayments);

module.exports = router;
