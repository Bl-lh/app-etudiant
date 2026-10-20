const request = require('supertest');
const app = require('../../src/app');

describe('Tests d\'Intégration API : Catalogue des Cours & Consultation', () => {

  describe('1. Consultation Publique des Cours (GET /api/courses)', () => {
    test('TC-API-CRS-01 [Nominal] : Récupération de la liste complète des cours publiés (HTTP 200)', async () => {
      const response = await request(app).get('/api/courses');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.count).toBeGreaterThanOrEqual(1);

      const firstCourse = response.body.data[0];
      expect(firstCourse).toHaveProperty('id');
      expect(firstCourse).toHaveProperty('title');
      expect(firstCourse).toHaveProperty('price');
      expect(firstCourse).toHaveProperty('available_seats');
      expect(firstCourse).toHaveProperty('category_name');
    });

    test('TC-API-CRS-02 [Filtre] : Filtrage par recherche textuelle', async () => {
      const response = await request(app)
        .get('/api/courses?search=Tests');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      const allMatch = response.body.data.every(c => 
        c.title.toLowerCase().includes('tests') || 
        c.description.toLowerCase().includes('tests') ||
        c.summary.toLowerCase().includes('tests')
      );
      expect(allMatch).toBe(true);
    });

    test('TC-API-CRS-03 [Filtre] : Filtrage par niveau de difficulté', async () => {
      const response = await request(app)
        .get('/api/courses?level=AVANCE');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      response.body.data.forEach(c => {
        expect(c.level).toBe('AVANCE');
      });
    });
  });

  describe('2. Consultation Détail d\'un Cours (GET /api/courses/:id)', () => {
    test('TC-API-CRS-04 [Nominal] : Récupération des détails avec programme syllabus et avis (HTTP 200)', async () => {
      const response = await request(app).get('/api/courses/1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(1);
      expect(Array.isArray(response.body.data.syllabus)).toBe(true);
      expect(response.body.data.syllabus.length).toBeGreaterThan(0);
      expect(response.body.data).toHaveProperty('average_rating');
    });

    test('TC-API-CRS-05 [Négatif] : Rejet si l\'ID du cours n\'existe pas (HTTP 404)', async () => {
      const response = await request(app).get('/api/courses/999999');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('introuvable');
    });
  });

  describe('3. Catégories de Formation (GET /api/courses/categories)', () => {
    test('TC-API-CRS-06 [Nominal] : Liste des catégories avec comptage de cours associés', async () => {
      const response = await request(app).get('/api/courses/categories');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
      expect(response.body.data[0]).toHaveProperty('slug');
      expect(response.body.data[0]).toHaveProperty('course_count');
    });
  });

  describe('4. Sécurité des Droits d\'Accès (RBAC)', () => {
    test('TC-API-CRS-07 [Sécurité/RBAC] : Refus de création de cours pour un utilisateur non authentifié (HTTP 401)', async () => {
      const response = await request(app)
        .post('/api/courses')
        .send({
          title: 'Cours Non Autorisé',
          category_id: 1,
          summary: 'Résumé cours test sécurité',
          description: 'Description détaillée cours test sécurité',
          price: 199.00
        });

      expect(response.status).toBe(401);
    });
  });
});
