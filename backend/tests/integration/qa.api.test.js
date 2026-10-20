const request = require('supertest');
const app = require('../../src/app');

describe('Tests d\'Intégration API : Centre QA, Santé Système & Traçabilité des Tests', () => {

  describe('1. Santé Système (GET /health)', () => {
    test('TC-API-SYS-01 : Vérification de la disponibilité du serveur et de MySQL', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('UP');
      expect(response.body.database).toBe('CONNECTED');
    });

    test('TC-API-SYS-02 : Gestion d\'une route non trouvée (HTTP 404)', async () => {
      const response = await request(app).get('/api/route-inexistante-pour-test-404');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('introuvable');
    });
  });

  describe('2. Centre QA & Catalogue des Exigences (GET /api/qa/status & POST /api/qa/audit)', () => {
    test('TC-API-QA-01 : Consultation du catalogue des cas de tests et métriques', async () => {
      const response = await request(app).get('/api/qa/status');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.stats).toHaveProperty('totalCases');
      expect(Array.isArray(response.body.catalog)).toBe(true);
      expect(response.body.catalog.length).toBeGreaterThanOrEqual(10);
    });

    test('TC-API-QA-02 : Enregistrement d\'un log d\'audit dans la table test_audit_logs', async () => {
      const response = await request(app)
        .post('/api/qa/audit')
        .send({
          testSuite: 'API_INTEGRATION_TESTS',
          testCase: 'TC-API-QA-02',
          status: 'PASSED',
          durationMs: 45,
          details: 'Validation de l\'audit trail MySQL'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });
  });
});
