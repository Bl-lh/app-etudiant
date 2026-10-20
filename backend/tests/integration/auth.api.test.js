const request = require('supertest');
const app = require('../../src/app');
const { pool } = require('../../src/config/db');

describe('Tests d\'Intégration API : Authentification & Gestion des Comptes', () => {

  const testEmail = `etudiant.test.${Date.now()}@campus-online.ma`;
  let studentToken = null;

  afterAll(async () => {
    // Nettoyage de l'utilisateur de test créé
    await pool.query('DELETE FROM users WHERE email LIKE "etudiant.test.%"');
  });

  describe('1. Inscription (POST /api/auth/register)', () => {
    test('TC-API-AUTH-01 [Nominal] : Création réussie d\'un compte étudiant (HTTP 201)', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Youssef Testeur',
          email: testEmail,
          password: 'Password123!',
          phone: '+212660123456'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe(testEmail.toLowerCase());
      expect(response.body.user.role).toBe('STUDENT');
      expect(response.body.user.password_hash).toBeUndefined(); // Sécurité : Ne jamais renvoyer le hash

      studentToken = response.body.token;
    });

    test('TC-API-AUTH-02 [Négatif] : Rejet si l\'email est déjà utilisé (HTTP 409 Conflict)', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Doublon Testeur',
          email: testEmail,
          password: 'Password123!'
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('existe déjà');
    });

    test('TC-API-AUTH-03 [Validation/Limites] : Rejet si mot de passe trop court (< 6 caractères) (HTTP 400)', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Court Pass',
          email: `short.${Date.now()}@campus-online.ma`,
          password: '123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.some(e => e.field === 'password')).toBe(true);
    });
  });

  describe('2. Connexion (POST /api/auth/login)', () => {
    test('TC-API-AUTH-04 [Nominal] : Connexion avec identifiants valides (HTTP 200)', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: 'Password123!'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe(testEmail);
    });

    test('TC-API-AUTH-05 [Sécurité] : Rejet en cas de mot de passe incorrect (HTTP 401)', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: 'WrongPassword456!'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.token).toBeUndefined();
    });

    test('TC-API-AUTH-06 [Sécurité] : Rejet si l\'email n\'existe pas (HTTP 401)', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'inconnu.etudiant.999@campus-online.ma',
          password: 'Password123!'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('3. Profil Utilisateur (GET /api/auth/me)', () => {
    test('TC-API-AUTH-07 [Nominal] : Accès autorisé avec Bearer Token valide (HTTP 200)', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user.name).toBe('Youssef Testeur');
    });

    test('TC-API-AUTH-08 [Sécurité] : Refus d\'accès sans jeton d\'autorisation (HTTP 401)', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('TC-API-AUTH-09 [Sécurité] : Refus d\'accès avec jeton altéré ou falsifié (HTTP 403)', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer token_invalide_falsifie_12345');

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });
});
