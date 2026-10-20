const request = require('supertest');
const app = require('../../src/app');
const { pool } = require('../../src/config/db');

describe('Tests d\'Intégration API : Inscription des Étudiants aux Cours', () => {

  let studentToken = null;
  let testStudentId = null;
  let testEnrollmentId = null;

  beforeAll(async () => {
    // Création d'un étudiant dédié pour ces tests
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Inscription Étudiant',
        email: `etudiant.enr.${Date.now()}@campus-online.ma`,
        password: 'Password123!'
      });

    studentToken = regRes.body.token;
    testStudentId = regRes.body.user.id;
  });

  afterAll(async () => {
    if (testStudentId) {
      await pool.query('DELETE FROM payments WHERE user_id = ?', [testStudentId]);
      await pool.query('DELETE FROM enrollments WHERE user_id = ?', [testStudentId]);
      await pool.query('DELETE FROM users WHERE id = ?', [testStudentId]);
    }
  });

  describe('1. Inscription à un Cours Payant (POST /api/enrollments)', () => {
    test('TC-API-ENR-01 [Nominal] : Inscription initiale génère un statut PENDING (HTTP 201)', async () => {
      const response = await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ courseId: 3 });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.status).toBe('PENDING');
      expect(response.body.requiresPayment).toBe(true);
      expect(response.body.enrollmentNumber).toMatch(/^ENR-\d{8}-[A-F0-9]{6}$/);

      testEnrollmentId = response.body.enrollmentId;
    });

    test('TC-API-ENR-02 [Idempotence/Gestion Attente] : Deuxième tentative d\'inscription retourne le dossier PENDING existant', async () => {
      const response = await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ courseId: 3 });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('PENDING');
      expect(response.body.message).toContain('en attente de paiement');
    });

    test('TC-API-ENR-03 [Négatif] : Rejet si le cours n\'existe pas (HTTP 404)', async () => {
      const response = await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ courseId: 99999 });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('TC-API-ENR-04 [Limites] : Rejet si la capacité maximale du cours est atteinte (HTTP 409)', async () => {
      // Insertion temporaire d'un cours complet (capacité = 1, enrolled = 1)
      const [courseRes] = await pool.query(
        `INSERT INTO courses (category_id, title, slug, summary, description, instructor_name, price, capacity, enrolled_count)
         VALUES (1, 'Cours Plein Test', 'cours-plein-test', 'Court résumé', 'Description complète', 'Prof Test', 100, 1, 1)`
      );
      const fullCourseId = courseRes.insertId;

      const response = await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ courseId: fullCourseId });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('complet');

      // Nettoyage du cours temporaire
      await pool.query('DELETE FROM courses WHERE id = ?', [fullCourseId]);
    });
  });

  describe('2. Consultation de l\'Espace Étudiant (GET /api/enrollments/my)', () => {
    test('TC-API-ENR-05 [Nominal] : Récupération des cours de l\'étudiant connecté', async () => {
      const response = await request(app)
        .get('/api/enrollments/my')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      expect(response.body.data[0].status).toBe('PENDING');
      expect(response.body.data[0]).toHaveProperty('course_title');
    });
  });
});
