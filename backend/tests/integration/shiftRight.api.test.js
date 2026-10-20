const request = require('supertest');
const app = require('../../src/app');

describe('Shift-Right Testing & Progressive Delivery API Suite', () => {
  beforeEach(() => {
    delete process.env.OVERRIDE_FLAG_CHAOS_FAULTY_PAYMENT;
    delete process.env.OVERRIDE_FLAG_PAYMENT_LATENCY_CHAOS;
  });

  afterAll(() => {
    delete process.env.OVERRIDE_FLAG_CHAOS_FAULTY_PAYMENT;
    delete process.env.OVERRIDE_FLAG_PAYMENT_LATENCY_CHAOS;
  });

  describe('1. Endpoint de Diagnostic Canary (GET /api/shift-right/status)', () => {
    test('TC-SR-01 : Récupération des métriques du nœud (Version, Type de release, Unleash)', async () => {
      const res = await request(app).get('/api/shift-right/status');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('service', 'campus-enroll-backend');
      expect(res.body).toHaveProperty('version');
      expect(res.body).toHaveProperty('releaseType');
      expect(res.body).toHaveProperty('hostname');
      expect(res.body).toHaveProperty('unleash');
      expect(res.body.unleash).toHaveProperty('flags');
    });
  });

  describe('2. Simulation de Transaction & Feature Flag Unleash (POST /api/shift-right/transaction)', () => {
    test('TC-SR-02 [Nominal] : Transaction réussie lorsque le flag de panne est inactif (HTTP 200)', async () => {
      process.env.OVERRIDE_FLAG_CHAOS_FAULTY_PAYMENT = 'false';

      const res = await request(app)
        .post('/api/shift-right/transaction')
        .send({ userId: 'student-test-1', amount: 250.0 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.status).toBe(200);
      expect(res.body).toHaveProperty('transactionId');
      expect(res.body.amountPaid).toBe(250.0);
    });

    test('TC-SR-03 [Chaos / Panne Simulée] : Échec 500 lorsque le Feature Flag Unleash est activé', async () => {
      // Simule l'activation du flag dans Unleash
      process.env.OVERRIDE_FLAG_CHAOS_FAULTY_PAYMENT = 'true';

      const res = await request(app)
        .post('/api/shift-right/transaction')
        .send({ userId: 'student-test-2', amount: 150.0 });

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.status).toBe(500);
      expect(res.body.errorCode).toBe('ERR_UNLEASH_CHAOS_PAYMENT_FAILURE');
      expect(res.body.details.faultInjectedBy).toContain('Unleash Feature Flag');
    });

    test('TC-SR-04 [Kill Switch / Rétablissement] : Retour instantané à 200 après désactivation du Flag', async () => {
      // Étape 1 : Le flag est d'abord actif (Panne)
      process.env.OVERRIDE_FLAG_CHAOS_FAULTY_PAYMENT = 'true';
      let res = await request(app).post('/api/shift-right/transaction').send({ userId: 'student-test-3' });
      expect(res.status).toBe(500);

      // Étape 2 : Activation du Kill Switch (Flag basculé sur false)
      process.env.OVERRIDE_FLAG_CHAOS_FAULTY_PAYMENT = 'false';
      res = await request(app).post('/api/shift-right/transaction').send({ userId: 'student-test-3' });

      // Rétablissement immédiat sans redémarrage
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
