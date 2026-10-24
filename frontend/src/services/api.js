const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL)
  ? import.meta.env.VITE_API_URL
  : (typeof window !== 'undefined' && window.location?.port !== '3000' && window.location?.origin && !(typeof process !== 'undefined' && process.env?.JEST_WORKER_ID)
    ? '/api'
    : 'http://localhost:5000/api');

/**
 * Client HTTP centralisé avec gestion des jetons JWT et extraction d'erreurs
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('campus_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };

  const config = {
    ...options,
    headers
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      const error = new Error(data.message || 'Une erreur réseau est survenue.');
      error.status = response.status;
      error.details = data.errors || null;
      throw error;
    }

    return data;
  } catch (err) {
    if (!err.status) {
      err.message = 'Impossible de contacter le serveur backend. Assurez-vous que l\'API tourne sur le port 5000.';
    }
    throw err;
  }
}

export const api = {
  // --- AUTHENTIFICATION ---
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (userData) => request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  getMe: () => request('/auth/me'),
  updateProfile: (profileData) => request('/auth/profile', { method: 'PUT', body: JSON.stringify(profileData) }),

  // --- CATALOGUE DE COURS ---
  getCourses: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') query.append(k, v);
    });
    const qs = query.toString();
    return request(`/courses${qs ? `?${qs}` : ''}`);
  },
  getCategories: () => request('/courses/categories'),
  getCourseById: (id) => request(`/courses/${id}`),
  createCourse: (courseData) => request('/courses', { method: 'POST', body: JSON.stringify(courseData) }),
  updateCourse: (id, courseData) => request(`/courses/${id}`, { method: 'PUT', body: JSON.stringify(courseData) }),
  deleteCourse: (id) => request(`/courses/${id}`, { method: 'DELETE' }),

  // --- INSCRIPTIONS AUX COURS ---
  enroll: (courseId) => request('/enrollments', { method: 'POST', body: JSON.stringify({ courseId }) }),
  getMyEnrollments: () => request('/enrollments/my'),
  getEnrollmentById: (id) => request(`/enrollments/${id}`),
  getAllEnrollments: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/enrollments${query ? `?${query}` : ''}`);
  },
  cancelEnrollment: (id) => request(`/enrollments/${id}`, { method: 'DELETE' }),

  // --- PAIEMENT & FACTURATION ---
  validateCoupon: (code, coursePrice) => request('/payments/validate-coupon', {
    method: 'POST',
    body: JSON.stringify({ code, coursePrice })
  }),
  processPayment: (paymentPayload) => request('/payments/process', {
    method: 'POST',
    body: JSON.stringify(paymentPayload)
  }),
  getReceipt: (receiptNumber) => request(`/payments/receipt/${receiptNumber}`),
  getAllPayments: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/payments${query ? `?${query}` : ''}`);
  },

  // --- STATISTIQUES & KPI ADMIN ---
  getPlatformStats: () => request('/stats'),

  // --- CENTRE DE TESTS LOGICIELS & QUALIFICATION (QA) ---
  getQAStatus: () => request('/qa/status'),
  logQAAudit: (auditData) => request('/qa/audit', { method: 'POST', body: JSON.stringify(auditData) }),
  runLiveTests: () => request('/qa/run', { method: 'POST' }),

  // --- HEALTHCHECK & SHIFT-RIGHT ---
  getHealth: () => fetch(`${API_BASE_URL.replace(/\/api$/, '')}/health`).then(r => r.json()),
  getShiftRightStatus: () => request('/shift-right/status'),
  simulateShiftRightTransaction: (data = {}) => request('/shift-right/transaction', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  toggleUnleashFlag: (flag, action) => request(`/shift-right/unleash/toggle?flag=${encodeURIComponent(flag)}&action=${encodeURIComponent(action)}`),
  rollbackCanary: () => request('/shift-right/canary/rollback', { method: 'POST' }),
  promoteCanary: (ratio = 10) => request('/shift-right/canary/promote', {
    method: 'POST',
    body: JSON.stringify({ ratio })
  }),
  getCanaryStatus: () => request('/shift-right/canary/status')
};

export default api;
