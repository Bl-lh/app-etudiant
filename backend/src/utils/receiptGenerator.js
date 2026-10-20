const crypto = require('crypto');

/**
 * Génère un identifiant d'inscription unique
 * Format: ENR-YYYYMM-XXXX
 */
function generateEnrollmentNumber() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `ENR-${dateStr}-${randomSuffix}`;
}

/**
 * Génère un identifiant de transaction financière
 * Format: TXN-XXXXXXXXXXXXXXXX
 */
function generateTransactionId() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomHex = crypto.randomBytes(6).toString('hex').toUpperCase();
  return `TXN-${timestamp}-${randomHex}`;
}

/**
 * Génère un numéro de reçu / facture officiel
 * Format: REC-YYYY-XXXXXX
 */
function generateReceiptNumber() {
  const year = new Date().getFullYear();
  const randomDigits = Math.floor(100000 + Math.random() * 900000);
  return `REC-${year}-${randomDigits}`;
}

/**
 * Formate un reçu de paiement complet
 */
function formatReceiptData(payment, enrollment, user, course) {
  return {
    receiptNumber: payment.receipt_number,
    transactionId: payment.transaction_id,
    date: payment.payment_date || new Date(),
    status: payment.status,
    student: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || 'Non renseigné'
    },
    course: {
      id: course.id,
      title: course.title,
      instructor: course.instructor_name,
      level: course.level,
      duration: `${course.duration_hours} heures`
    },
    billing: {
      originalAmount: parseFloat(payment.original_amount),
      discountAmount: parseFloat(payment.discount_amount || 0),
      couponCode: payment.coupon_code || null,
      finalPaidAmount: parseFloat(payment.amount),
      currency: 'MAD / DH',
      paymentMethod: payment.payment_method,
      cardLast4: payment.card_last4 || null
    },
    institution: {
      name: 'Campus Online - Académie des Formations Supérieures',
      address: 'Avenue Ibn Sina, B.P. 765, Agdal, Rabat, Maroc',
      email: 'contact@campus-online.ma',
      registrationNumber: 'RC-RABAT-948271'
    }
  };
}

module.exports = {
  generateEnrollmentNumber,
  generateTransactionId,
  generateReceiptNumber,
  formatReceiptData
};
