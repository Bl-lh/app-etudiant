const request = require('supertest');
const app = require('../../src/app');
const { pool } = require('../../src/config/db');

describe('Tests d\'Intégration API : Administration, Statistiques & Audit', () => {

  let adminToken = null;
  let createdCourseId = null;

  beforeAll(async () => {
    // Connexion avec le compte administrateur du seed SQL
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@campus-online.ma',
        password: 'Password123!'
      });

    adminToken = res.body.token;
  });

  afterAll(async () => {
    if (createdCourseId) {
      await pool.query('DELETE FROM courses WHERE id = ?', [createdCourseId]);
    }
  });

  describe('1. Métriques et Statistiques Globales (GET /api/stats)', () => {
    test('TC-API-ADM-01 [Nominal] : Récupération des KPIs de la plateforme (HTTP 200)', async () => {
      const response = await request(app)
        .get('/api/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.stats).toHaveProperty('totalStudents');
      expect(response.body.stats).toHaveProperty('totalCourses');
      expect(response.body.stats).toHaveProperty('totalRevenue');
      expect(Array.isArray(response.body.categoryDistribution)).toBe(true);
      expect(Array.isArray(response.body.topCourses)).toBe(true);
    });

    test('TC-API-ADM-02 [Sécurité] : Refus d\'accès aux statistiques sans rôle ADMIN (HTTP 403)', async () => {
      // Inscription d'un étudiant standard
      const studentRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Non Admin User',
          email: `nonadmin.${Date.now()}@campus-online.ma`,
          password: 'Password123!'
        });

      const response = await request(app)
        .get('/api/stats')
        .set('Authorization', `Bearer ${studentRes.body.token}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Accès refusé');

      // Nettoyage
      await pool.query('DELETE FROM users WHERE id = ?', [studentRes.body.user.id]);
    });
  });

  describe('2. Administration des Cours (POST, PUT, DELETE /api/courses)', () => {
    test('TC-API-ADM-03 [Nominal] : L\'administrateur crée un nouveau cours (HTTP 201)', async () => {
      const response = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'DevOps & Pipeline CI/CD Avancé',
          category_id: 2,
          summary: 'Maîtrisez Docker, Kubernetes, GitHub Actions et l\'automatisation de tests.',
          description: 'Formation approfondie pour concevoir des chaînes d\'intégration continue avec exécution automatisée de tests logiciels.',
          price: 350.00,
          level: 'AVANCE',
          duration_hours: 25,
          capacity: 35,
          syllabus: [
            { module: 'Module 1', title: 'Fondations CI/CD', duration: '5h' },
            { module: 'Module 2', title: 'Tests automatisés dans le pipeline', duration: '10h' }
          ]
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.courseId).toBeDefined();

      createdCourseId = response.body.courseId;
    });

    test('TC-API-ADM-04 [Nominal] : L\'administrateur met à jour le cours créé (HTTP 200)', async () => {
      const response = await request(app)
        .put(`/api/courses/${createdCourseId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          price: 399.00,
          capacity: 40
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('mis à jour');
    });

    test('TC-API-ADM-05 [Nominal] : L\'administrateur supprime le cours créé sans inscriptions (HTTP 200)', async () => {
      const response = await request(app)
        .delete(`/api/courses/${createdCourseId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('supprimé');

      createdCourseId = null; // Marquer comme déjà nettoyé
    });
  });

  describe('3. Consultation Globale des Inscriptions et Paiements', () => {
    test('TC-API-ADM-06 [Nominal] : Liste complète de toutes les inscriptions pour l\'admin', async () => {
      const response = await request(app)
        .get('/api/enrollments')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('TC-API-ADM-07 [Nominal] : Historique comptable et financier de tous les paiements', async () => {
      const response = await request(app)
        .get('/api/payments')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('totalRevenue');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});
