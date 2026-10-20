const request = require('supertest');
const app = require('../../src/app');
const { pool } = require('../../src/config/db');

describe('Scénario End-to-End (E2E) : Parcours Complet d\'un Étudiant (Inscription -> Catalogue -> Inscription Cours -> Paiement -> Reçu)', () => {

  const studentData = {
    name: 'Othmane Berrada',
    email: `othmane.e2e.${Date.now()}@campus-online.ma`,
    password: 'Password123!',
    phone: '+212670987654'
  };

  let token = null;
  let studentId = null;
  let chosenCourseId = null;
  let enrollmentId = null;
  let receiptNumber = null;
  let targetCoursePrice = 0;
  let expectedDiscount = 0;
  let expectedFinalPrice = 0;

  afterAll(async () => {
    if (studentId) {
      await pool.query('DELETE FROM payments WHERE user_id = ?', [studentId]);
      await pool.query('DELETE FROM enrollments WHERE user_id = ?', [studentId]);
      await pool.query('DELETE FROM users WHERE id = ?', [studentId]);
    }
    // Clôture du pool MySQL à la fin de tous les tests
    await pool.end();
  });

  test('Étape 1 : L\'étudiant crée son compte sur la plateforme', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(studentData);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();

    token = res.body.token;
    studentId = res.body.user.id;
  });

  test('Étape 2 : L\'étudiant consulte le catalogue et sélectionne le cours "Architecture Full-Stack"', async () => {
    const res = await request(app)
      .get('/api/courses?search=Architecture')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);

    const targetCourse = res.body.data[0];
    chosenCourseId = targetCourse.id;
    targetCoursePrice = parseFloat(targetCourse.price);
    expectedDiscount = (targetCoursePrice * 20) / 100;
    expectedFinalPrice = targetCoursePrice - expectedDiscount;
    expect(targetCourse.available_seats).toBeGreaterThan(0);
  });

  test('Étape 3 : L\'étudiant initie son inscription au cours', async () => {
    const res = await request(app)
      .post('/api/enrollments')
      .set('Authorization', `Bearer ${token}`)
      .send({ courseId: chosenCourseId });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe('PENDING');
    expect(res.body.enrollmentId).toBeDefined();

    enrollmentId = res.body.enrollmentId;
  });

  test('Étape 4 : L\'étudiant applique son bon de réduction "ETUDIANT20"', async () => {
    const res = await request(app)
      .post('/api/payments/validate-coupon')
      .set('Authorization', `Bearer ${token}`)
      .send({
        code: 'ETUDIANT20',
        coursePrice: targetCoursePrice
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.coupon.discountPercent).toBe(20);
    expect(res.body.pricing.discountAmount).toBe(expectedDiscount);
    expect(res.body.pricing.finalPrice).toBe(expectedFinalPrice);
  });

  test('Étape 5 : L\'étudiant effectue son règlement sécurisé par carte bancaire', async () => {
    const res = await request(app)
      .post('/api/payments/process')
      .set('Authorization', `Bearer ${token}`)
      .send({
        enrollmentId,
        paymentMethod: 'CREDIT_CARD',
        couponCode: 'ETUDIANT20',
        cardData: {
          cardNumber: '4242 4242 4242 4242',
          cardHolder: 'Othmane Berrada',
          expiryMonth: '11',
          expiryYear: '2028',
          cvv: '888'
        }
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.amountPaid).toBe(expectedFinalPrice);
    expect(res.body.receiptNumber).toBeDefined();

    receiptNumber = res.body.receiptNumber;
  });

  test('Étape 6 : L\'étudiant consulte son tableau de bord et vérifie son inscription active', async () => {
    const res = await request(app)
      .get('/api/enrollments/my')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const enrolledCourse = res.body.data.find(e => e.course_id === chosenCourseId);
    expect(enrolledCourse).toBeDefined();
    expect(enrolledCourse.status).toBe('CONFIRMED');
    expect(enrolledCourse.payment_status).toBe('SUCCESS');
    expect(parseFloat(enrolledCourse.paid_amount)).toBe(expectedFinalPrice);
  });

  test('Étape 7 : L\'étudiant télécharge et affiche son reçu officiel de paiement', async () => {
    const res = await request(app)
      .get(`/api/payments/receipt/${receiptNumber}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.receiptNumber).toBe(receiptNumber);
    expect(res.body.data.student.name).toBe('Othmane Berrada');
    expect(res.body.data.billing.finalPaidAmount).toBe(expectedFinalPrice);
    expect(res.body.data.billing.couponCode).toBe('ETUDIANT20');
  });
});
