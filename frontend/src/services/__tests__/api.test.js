import { describe, it, expect, beforeEach, vi } from 'vitest';
import api from '../api';

describe('Unit Tests - Frontend API Service (api.js)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    global.fetch = vi.fn();
  });

  describe('1. Gestionnaire de requêtes HTTP (request)', () => {
    it('TC-FE-API-01 : Doit inclure le jeton JWT Authorization dans le header si présent dans localStorage', async () => {
      localStorage.setItem('campus_token', 'jwt-test-token-123');
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] })
      });

      await api.getCategories();

      expect(global.fetch).toHaveBeenCalledTimes(1);
      const [url, options] = global.fetch.mock.calls[0];
      expect(url).toBe('http://localhost:5000/api/courses/categories');
      expect(options.headers).toMatchObject({
        'Content-Type': 'application/json',
        'Authorization': 'Bearer jwt-test-token-123'
      });
    });

    it('TC-FE-API-02 : Ne doit pas inclure de header Authorization si aucun token dans localStorage', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] })
      });

      await api.getCategories();

      const [, options] = global.fetch.mock.calls[0];
      expect(options.headers.Authorization).toBeUndefined();
    });

    it('TC-FE-API-03 : Doit lever une erreur enrichie (status, message, details) si la réponse HTTP est en échec (ex: 400)', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          message: 'Données invalides',
          errors: [{ field: 'email', message: 'Email invalide' }]
        })
      });

      await expect(api.login({ email: 'bad', password: '123' })).rejects.toMatchObject({
        message: 'Données invalides',
        status: 400,
        details: [{ field: 'email', message: 'Email invalide' }]
      });
    });

    it('TC-FE-API-04 : Doit formater un message d\'erreur explicite en cas d\'erreur réseau (panne backend)', async () => {
      global.fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

      await expect(api.getCategories()).rejects.toThrow(
        "Impossible de contacter le serveur backend. Assurez-vous que l'API tourne sur le port 5000."
      );
    });
  });

  describe('2. Authentification', () => {
    it('TC-FE-API-05 : api.login envoie un POST avec credentials JSON', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, token: 'fake-jwt', user: { id: 1 } })
      });

      const res = await api.login({ email: 'test@campus.ma', password: 'pass' });

      expect(global.fetch).toHaveBeenCalledWith('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@campus.ma', password: 'pass' })
      });
      expect(res.success).toBe(true);
    });

    it('TC-FE-API-06 : api.register envoie un POST avec les données utilisateur', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, token: 'new-jwt', user: { id: 2 } })
      });

      const payload = { name: 'Ali', email: 'ali@campus.ma', password: 'pass' };
      const res = await api.register(payload);

      expect(global.fetch).toHaveBeenCalledWith('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      expect(res.user.id).toBe(2);
    });

    it('TC-FE-API-07 : api.getMe effectue un GET vers /auth/me', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, user: { id: 1, role: 'STUDENT' } })
      });

      const res = await api.getMe();
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:5000/api/auth/me', expect.any(Object));
      expect(res.user.role).toBe('STUDENT');
    });

    it('TC-FE-API-08 : api.updateProfile effectue un PUT vers /auth/profile', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      await api.updateProfile({ name: 'Ali Updated' });
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:5000/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Ali Updated' })
      });
    });
  });

  describe('3. Catalogue de Cours', () => {
    it('TC-FE-API-09 : api.getCourses filtre les paramètres nuls ou vides dans la Query String', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, courses: [] })
      });

      await api.getCourses({ categoryId: 2, search: '', level: null, sort: 'price_asc' });

      const [url] = global.fetch.mock.calls[0];
      expect(url).toBe('http://localhost:5000/api/courses?categoryId=2&sort=price_asc');
    });

    it('TC-FE-API-10 : api.getCourseById appelle /courses/:id', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, course: { id: 5 } })
      });

      const res = await api.getCourseById(5);
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:5000/api/courses/5', expect.any(Object));
      expect(res.course.id).toBe(5);
    });

    it('TC-FE-API-11 : api.createCourse envoie un POST', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, courseId: 10 })
      });

      const data = { title: 'Nouveau cours', price: 500 };
      await api.createCourse(data);
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:5000/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    });

    it('TC-FE-API-12 : api.deleteCourse envoie un DELETE', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      await api.deleteCourse(10);
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:5000/api/courses/10', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
    });
  });

  describe('4. Inscriptions & Paiements', () => {
    it('TC-FE-API-13 : api.enroll envoie un POST vers /enrollments', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, enrollmentId: 42 })
      });

      const res = await api.enroll(7);
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:5000/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: 7 })
      });
      expect(res.enrollmentId).toBe(42);
    });

    it('TC-FE-API-14 : api.validateCoupon envoie le code et le prix de base', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, discountPercent: 20, discountedPrice: 680 })
      });

      const res = await api.validateCoupon('ETUDIANT20', 850);
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:5000/api/payments/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: 'ETUDIANT20', coursePrice: 850 })
      });
      expect(res.discountedPrice).toBe(680);
    });

    it('TC-FE-API-15 : api.processPayment soumet la transaction financière', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, receipt: { receiptNumber: 'REC-123' } })
      });

      const payload = { enrollmentId: 1, cardNumber: '4532000000000000', amount: 850 };
      const res = await api.processPayment(payload);

      expect(global.fetch).toHaveBeenCalledWith('http://localhost:5000/api/payments/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      expect(res.receipt.receiptNumber).toBe('REC-123');
    });

    it('TC-FE-API-16 : api.getReceipt récupère la facture par son numéro', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, receipt: { id: 1 } })
      });

      await api.getReceipt('REC-999');
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:5000/api/payments/receipt/REC-999', expect.any(Object));
    });

    it('TC-FE-API-17 : api.getAllEnrollments et cancelEnrollment', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, enrollments: [] })
      });

      await api.getAllEnrollments({ status: 'CONFIRMED' });
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:5000/api/enrollments?status=CONFIRMED', expect.any(Object));

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });
      await api.cancelEnrollment(99);
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:5000/api/enrollments/99', {
        method: 'DELETE',
        headers: expect.any(Object)
      });
    });

    it('TC-FE-API-18 : api.getAllPayments', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, payments: [] })
      });

      await api.getAllPayments({ limit: 10 });
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:5000/api/payments?limit=10', expect.any(Object));
    });
  });

  describe('5. QA Center & Healthcheck', () => {
    it('TC-FE-API-19 : api.getQAStatus et runLiveTests', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, status: 'READY' })
      });

      const res = await api.getQAStatus();
      expect(res.status).toBe('READY');

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, executed: 81 })
      });
      const runRes = await api.runLiveTests();
      expect(runRes.executed).toBe(81);
    });

    it('TC-FE-API-20 : api.logQAAudit envoie les données de journalisation', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, logId: 101 })
      });

      const auditData = { testName: 'TC-FE-01', status: 'PASSED' };
      const res = await api.logQAAudit(auditData);
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:5000/api/qa/audit', {
        method: 'POST',
        headers: expect.any(Object),
        body: JSON.stringify(auditData)
      });
      expect(res.logId).toBe(101);
    });

    it('TC-FE-API-21 : api.getHealth appelle /health directement', async () => {
      global.fetch.mockResolvedValueOnce({
        json: async () => ({ status: 'UP', database: 'CONNECTED' })
      });

      const res = await api.getHealth();
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:5000/health');
      expect(res.status).toBe('UP');
    });
  });
});
