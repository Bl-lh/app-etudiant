const { pool, withTransaction } = require('../config/db');
const { validatePaymentCard } = require('../utils/luhnValidator');
const { calculateDiscount, verifyCouponEligibility } = require('../services/discountService');
const { generateTransactionId, generateReceiptNumber, formatReceiptData } = require('../utils/receiptGenerator');

/**
 * Vérifier la validité d'un coupon de réduction
 */
async function validateCoupon(req, res, next) {
  try {
    const { code, coursePrice } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Le code coupon est requis.'
      });
    }

    const cleanCode = code.trim().toUpperCase();

    const [coupons] = await pool.query(
      'SELECT id, code, discount_percent, valid_until, max_uses, current_uses, is_active FROM coupons WHERE UPPER(code) = ?',
      [cleanCode]
    );

    if (coupons.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Code promo inexistant.'
      });
    }

    const coupon = coupons[0];
    const eligibility = verifyCouponEligibility(coupon);

    if (!eligibility.isEligible) {
      return res.status(400).json({
        success: false,
        message: eligibility.reason
      });
    }

    const price = parseFloat(coursePrice || 0);
    const calculation = calculateDiscount(price, coupon.discount_percent);

    return res.status(200).json({
      success: true,
      message: `Code appliqué : -${coupon.discount_percent}% de remise`,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discountPercent: coupon.discount_percent
      },
      pricing: calculation
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Traiter et valider le paiement d'une inscription
 */
async function processPayment(req, res, next) {
  try {
    const {
      enrollmentId,
      paymentMethod = 'CREDIT_CARD',
      cardData,
      couponCode
    } = req.body;

    const userId = req.user.id;

    // 1. Récupération et validation du dossier d'inscription
    const [enrollments] = await pool.query(
      `SELECT e.id, e.enrollment_number, e.user_id, e.course_id, e.status as enrollment_status,
              c.title as course_title, c.price as course_price, c.capacity, c.enrolled_count,
              u.name as student_name, u.email as student_email, u.phone as student_phone
       FROM enrollments e
       JOIN courses c ON e.course_id = c.id
       JOIN users u ON e.user_id = u.id
       WHERE e.id = ?`,
      [enrollmentId]
    );

    if (enrollments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Dossier d\'inscription introuvable.'
      });
    }

    const enrollment = enrollments[0];

    // Vérifier que l'étudiant est bien le propriétaire de l'inscription
    if (enrollment.user_id !== userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé pour régler cette inscription.'
      });
    }

    // Vérifier si déjà payé
    if (enrollment.enrollment_status === 'CONFIRMED') {
      return res.status(400).json({
        success: false,
        message: 'Cette inscription a déjà été confirmée et payée.'
      });
    }

    const originalPrice = parseFloat(enrollment.course_price);
    let finalAmount = originalPrice;
    let discountAmount = 0.00;
    let appliedCouponId = null;
    let validatedCouponCode = null;

    // 2. Traitement du Coupon si fourni
    if (couponCode) {
      const cleanCode = couponCode.trim().toUpperCase();
      const [coupons] = await pool.query(
        'SELECT id, code, discount_percent, valid_until, max_uses, current_uses, is_active FROM coupons WHERE UPPER(code) = ?',
        [cleanCode]
      );

      if (coupons.length > 0) {
        const coupon = coupons[0];
        const eligibility = verifyCouponEligibility(coupon);
        if (eligibility.isEligible) {
          const discountCalc = calculateDiscount(originalPrice, coupon.discount_percent);
          discountAmount = discountCalc.discountAmount;
          finalAmount = discountCalc.finalPrice;
          appliedCouponId = coupon.id;
          validatedCouponCode = coupon.code;
        } else {
          return res.status(400).json({
            success: false,
            message: `Coupon invalide : ${eligibility.reason}`
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          message: 'Code promo spécifié introuvable.'
        });
      }
    }

    // 3. Validation de la méthode de paiement
    let cardLast4 = null;
    if (paymentMethod === 'CREDIT_CARD') {
      if (!cardData) {
        return res.status(400).json({
          success: false,
          message: 'Les coordonnées de carte bancaire sont requises pour ce mode de règlement.'
        });
      }

      // Validation stricte (Luhn, Expiration, CVV, Titulaire)
      const cardValidation = validatePaymentCard(cardData);
      if (!cardValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Coordonnées de carte bancaire invalides.',
          errors: cardValidation.errors
        });
      }

      // Scénario de test : Simulation de refus bancaire
      const cleanCard = (cardData.cardNumber || '').replace(/\D/g, '');
      if (cleanCard.endsWith('0002') || cardData.cvv === '000') {
        const failedTxId = generateTransactionId();
        const failedRecId = generateReceiptNumber();
        
        await pool.query(
          `INSERT INTO payments 
            (transaction_id, receipt_number, enrollment_id, user_id, amount, original_amount, discount_amount, coupon_code, payment_method, card_last4, status, failure_reason)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'FAILED', ?)`,
          [
            failedTxId, failedRecId, enrollment.id, userId, finalAmount,
            originalPrice, discountAmount, validatedCouponCode, paymentMethod,
            cleanCard.slice(-4), 'Paiement refusé par la banque émettrice (Provision insuffisante ou carte bloquée)'
          ]
        );

        return res.status(402).json({
          success: false,
          message: 'Transaction refusée par le centre bancaire (Code erreur: DECLINED_INSUFFICIENT_FUNDS).',
          transactionId: failedTxId
        });
      }

      cardLast4 = cleanCard.slice(-4);
    }

    // 4. Exécution de la transaction ACID (Persistance MySQL)
    const transactionId = generateTransactionId();
    const receiptNumber = generateReceiptNumber();

    const paymentResult = await withTransaction(async (conn) => {
      // Insertion du paiement réussi
      const [payInsert] = await conn.query(
        `INSERT INTO payments 
          (transaction_id, receipt_number, enrollment_id, user_id, amount, original_amount, discount_amount, coupon_code, payment_method, card_last4, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'SUCCESS')`,
        [
          transactionId, receiptNumber, enrollment.id, userId, finalAmount,
          originalPrice, discountAmount, validatedCouponCode, paymentMethod, cardLast4
        ]
      );

      // Mise à jour de l'inscription en 'CONFIRMED'
      await conn.query(
        'UPDATE enrollments SET status = "CONFIRMED" WHERE id = ?',
        [enrollment.id]
      );

      // Incrémentation du compteur d'étudiants inscrits au cours
      await conn.query(
        'UPDATE courses SET enrolled_count = enrolled_count + 1 WHERE id = ?',
        [enrollment.course_id]
      );

      // Si coupon utilisé, incrémentation du compteur d'utilisation
      if (appliedCouponId) {
        await conn.query(
          'UPDATE coupons SET current_uses = current_uses + 1 WHERE id = ?',
          [appliedCouponId]
        );
      }

      return payInsert.insertId;
    });

    const paymentData = {
      id: paymentResult,
      transaction_id: transactionId,
      receipt_number: receiptNumber,
      amount: finalAmount,
      original_amount: originalPrice,
      discount_amount: discountAmount,
      coupon_code: validatedCouponCode,
      payment_method: paymentMethod,
      card_last4: cardLast4,
      status: 'SUCCESS',
      payment_date: new Date()
    };

    const courseData = {
      id: enrollment.course_id,
      title: enrollment.course_title,
      instructor_name: 'Instructeur certifié',
      level: 'INTERMEDIAIRE',
      duration_hours: 30
    };

    const receipt = formatReceiptData(
      paymentData,
      enrollment,
      { id: userId, name: enrollment.student_name, email: enrollment.student_email, phone: enrollment.student_phone },
      courseData
    );

    return res.status(200).json({
      success: true,
      message: 'Paiement effectué avec succès ! Inscription validée.',
      transactionId,
      receiptNumber,
      amountPaid: finalAmount,
      receipt
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Récupérer les détails d'un reçu ou facture
 */
async function getReceipt(req, res, next) {
  try {
    const { receiptNumber } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    const [rows] = await pool.query(
      `SELECT p.*, e.enrollment_number,
              u.id as user_id, u.name as user_name, u.email as user_email, u.phone as user_phone,
              c.id as course_id, c.title as course_title, c.instructor_name, c.level, c.duration_hours
       FROM payments p
       JOIN enrollments e ON p.enrollment_id = e.id
       JOIN users u ON p.user_id = u.id
       JOIN courses c ON e.course_id = c.id
       WHERE p.receipt_number = ?`,
      [receiptNumber]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reçu de paiement introuvable.'
      });
    }

    const record = rows[0];

    if (!isAdmin && record.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé à ce reçu.'
      });
    }

    const receipt = formatReceiptData(
      record,
      { enrollment_number: record.enrollment_number },
      { id: record.user_id, name: record.user_name, email: record.user_email, phone: record.user_phone },
      { id: record.course_id, title: record.course_title, instructor_name: record.instructor_name, level: record.level, duration_hours: record.duration_hours }
    );

    return res.status(200).json({
      success: true,
      data: receipt
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Obtenir l'historique complet de tous les paiements (Administration)
 */
async function getAllPayments(req, res, next) {
  try {
    const { status, method } = req.query;

    let query = `
      SELECT p.id, p.transaction_id, p.receipt_number, p.amount, p.original_amount,
             p.discount_amount, p.coupon_code, p.payment_method, p.card_last4,
             p.status, p.payment_date, p.failure_reason,
             u.id as user_id, u.name as user_name, u.email as user_email,
             c.title as course_title, e.enrollment_number
      FROM payments p
      JOIN users u ON p.user_id = u.id
      JOIN enrollments e ON p.enrollment_id = e.id
      JOIN courses c ON e.course_id = c.id
      WHERE 1=1
    `;

    const params = [];

    if (status) {
      query += ' AND p.status = ?';
      params.push(status);
    }

    if (method) {
      query += ' AND p.payment_method = ?';
      params.push(method);
    }

    query += ' ORDER BY p.payment_date DESC';

    const [payments] = await pool.query(query, params);

    // Calcul du chiffre d'affaires
    const totalRevenue = payments
      .filter(p => p.status === 'SUCCESS')
      .reduce((sum, p) => sum + parseFloat(p.amount), 0);

    return res.status(200).json({
      success: true,
      count: payments.length,
      totalRevenue: totalRevenue.toFixed(2),
      data: payments
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  validateCoupon,
  processPayment,
  getReceipt,
  getAllPayments
};
