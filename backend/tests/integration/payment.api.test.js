const request = require('supertest');
const app = require('../../src/app');
const { pool } = require('../../src/config/db');

describe('Tests d\'Intégration API : Processus de Paiement et Transactions MySQL', () => {

  let studentToken = null;
  let studentId = null;
  let pendingEnrollmentId = null;
  let confirmedReceiptNumber = null;

  beforeAll(async () => {
    // 1. Création de l'étudiant
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Fatima Zahra Test',
        email: `fatima.pay.${Date.now()}@campus-online.ma`,
        password: 'Password123!'
      });

    studentToken = regRes.body.token;
    studentId = regRes.body.user.id;

    // 2. Création d'une inscription en attente sur le cours 4 (Sécurité Web, 599 DH)
    const enrRes = await request(app)
      .post('/api/enrollments')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ courseId: 4 });

    pendingEnrollmentId = enrRes.body.enrollmentId;
  });

  afterAll(async () => {
    if (studentId) {
      await pool.query('DELETE FROM payments WHERE user_id = ?', [studentId]);
      await pool.query('DELETE FROM enrollments WHERE user_id = ?', [studentId]);
      await pool.query('DELETE FROM users WHERE id = ?', [studentId]);
      // Rétablir le compteur du cours 4
      await pool.query('UPDATE courses SET enrolled_count = 0 WHERE id = 4');
    }
  });

  describe('1. Vérification des Bons de Réduction (POST /api/payments/validate-coupon)', () => {
    test('TC-API-PAY-01 [Nominal] : Validation d\'un coupon actif "ETUDIANT20" (20% remise)', async () => {
      const response = await request(app)
        .post('/api/payments/validate-coupon')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ code: 'ETUDIANT20', coursePrice: 599.00 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.coupon.discountPercent).toBe(20);
      expect(response.body.pricing.discountAmount).toBe(119.80);
      expect(response.body.pricing.finalPrice).toBe(479.20);
    });

    test('TC-API-PAY-02 [Négatif] : Rejet d\'un code promo expiré "EXPIRE10" (HTTP 400)', async () => {
      const response = await request(app)
        .post('/api/payments/validate-coupon')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ code: 'EXPIRE10', coursePrice: 599.00 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/expiré|désactivé/);
    });

    test('TC-API-PAY-03 [Négatif] : Rejet d\'un code inexistant (HTTP 404)', async () => {
      const response = await request(app)
        .post('/api/payments/validate-coupon')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ code: 'CODE_INVENTE_999', coursePrice: 599.00 });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('2. Validation & Erreurs de Paiement (POST /api/payments/process)', () => {
    test('TC-API-PAY-04 [Validation] : Rejet avec numéro de carte bancaire invalide (Luhn échoué)', async () => {
      const response = await request(app)
        .post('/api/payments/process')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          enrollmentId: pendingEnrollmentId,
          paymentMethod: 'CREDIT_CARD',
          cardData: {
            cardNumber: '4242424242424241', // Luhn faux
            cardHolder: 'Fatima Zahra',
            expiryMonth: '12',
            expiryYear: '2028',
            cvv: '123'
          }
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors.some(e => e.includes('Luhn'))).toBe(true);
    });

    test('TC-API-PAY-05 [Scénario Négatif] : Refus bancaire simulé (Carte terminant par 0002) (HTTP 402)', async () => {
      // Carte Visa valide Luhn se terminant par 0002 : '4000000000000002'
      const response = await request(app)
        .post('/api/payments/process')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          enrollmentId: pendingEnrollmentId,
          paymentMethod: 'CREDIT_CARD',
          cardData: {
            cardNumber: '4000000000000002',
            cardHolder: 'Fatima Zahra',
            expiryMonth: '11',
            expiryYear: '2029',
            cvv: '999'
          }
        });

      expect(response.status).toBe(402);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('refusée');

      // Vérification que le statut de l'inscription est resté 'PENDING'
      const [enrRows] = await pool.query('SELECT status FROM enrollments WHERE id = ?', [pendingEnrollmentId]);
      expect(enrRows[0].status).toBe('PENDING');
    });
  });

  describe('3. Transaction ACID Réussie (POST /api/payments/process & GET /api/payments/receipt)', () => {
    test('TC-API-PAY-06 [Nominal / Transactionnel] : Règlement validé avec succès, réduction et reçu généré', async () => {
      const response = await request(app)
        .post('/api/payments/process')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          enrollmentId: pendingEnrollmentId,
          paymentMethod: 'CREDIT_CARD',
          couponCode: 'ETUDIANT20',
          cardData: {
            cardNumber: '4242424242424242',
            cardHolder: 'Fatima Zahra',
            expiryMonth: '10',
            expiryYear: '2028',
            cvv: '456'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.transactionId).toMatch(/^TXN-/);
      expect(response.body.receiptNumber).toMatch(/^REC-/);
      expect(response.body.amountPaid).toBe(479.20);
      expect(response.body.receipt).toBeDefined();

      confirmedReceiptNumber = response.body.receiptNumber;

      // Vérification de la persistance en base MySQL
      const [enrRows] = await pool.query('SELECT status FROM enrollments WHERE id = ?', [pendingEnrollmentId]);
      expect(enrRows[0].status).toBe('CONFIRMED');

      const [courseRows] = await pool.query('SELECT enrolled_count FROM courses WHERE id = 4');
      expect(courseRows[0].enrolled_count).toBeGreaterThanOrEqual(1);
    });

    test('TC-API-PAY-07 [Idempotence/Protection] : Rejet d\'un second paiement pour la même inscription déjà confirmée', async () => {
      const response = await request(app)
        .post('/api/payments/process')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          enrollmentId: pendingEnrollmentId,
          paymentMethod: 'CREDIT_CARD',
          cardData: {
            cardNumber: '4242424242424242',
            cardHolder: 'Fatima Zahra',
            expiryMonth: '10',
            expiryYear: '2028',
            cvv: '456'
          }
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('déjà été confirmée');
    });

    test('TC-API-PAY-08 [Nominal] : Téléchargement et consultation du reçu officiel (GET /api/payments/receipt/:id)', async () => {
      const response = await request(app)
        .get(`/api/payments/receipt/${confirmedReceiptNumber}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.receiptNumber).toBe(confirmedReceiptNumber);
      expect(response.body.data.billing.finalPaidAmount).toBe(479.20);
      expect(response.body.data.student.email).toContain('fatima.pay');
    });
  });
});
