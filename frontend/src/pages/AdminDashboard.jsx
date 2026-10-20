import React, { useState, useEffect } from 'react';
import {
  Users,
  BookOpen,
  DollarSign,
  TrendingUp,
  Plus,
  Trash2,
  Edit,
  ShieldCheck,
  CheckCircle,
  XCircle,
  FileText
} from 'lucide-react';
import api from '../services/api';
import ReceiptModal from '../components/ReceiptModal';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('courses');

  // Modal Ajout Cours
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [newCourse, setNewCourse] = useState({
    title: '',
    category_id: 1,
    summary: '',
    description: '',
    price: 399.00,
    level: 'DEBUTANT',
    duration_hours: 20,
    capacity: 30
  });

  const [selectedReceipt, setSelectedReceipt] = useState(null);

  useEffect(() => {
    loadAllAdminData();
  }, []);

  async function loadAllAdminData() {
    setLoading(true);
    try {
      const [statsRes, coursesRes, enrollRes, payRes] = await Promise.all([
        api.getPlatformStats(),
        api.getCourses(),
        api.getAllEnrollments(),
        api.getAllPayments()
      ]);

      if (statsRes.success) setStats(statsRes.stats);
      if (coursesRes.success) setCourses(coursesRes.data);
      if (enrollRes.success) setEnrollments(enrollRes.data);
      if (payRes.success) setPayments(payRes.data);
    } catch (err) {
      console.error('Erreur données admin:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createCourse(newCourse);
      if (res.success) {
        setShowAddCourse(false);
        setNewCourse({
          title: '',
          category_id: 1,
          summary: '',
          description: '',
          price: 399.00,
          level: 'DEBUTANT',
          duration_hours: 20,
          capacity: 30
        });
        loadAllAdminData();
      }
    } catch (err) {
      alert(err.message || 'Erreur lors de la création du cours.');
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce cours ?')) return;
    try {
      const res = await api.deleteCourse(courseId);
      if (res.success) {
        loadAllAdminData();
      }
    } catch (err) {
      alert(err.message || 'Impossible de supprimer le cours.');
    }
  };

  const handleViewReceipt = async (receiptNumber) => {
    try {
      const res = await api.getReceipt(receiptNumber);
      if (res.success) setSelectedReceipt(res.data);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ padding: '20px 0 80px 0' }}>
      {/* Header Admin */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <div className="badge badge-warning" style={{ marginBottom: 6 }}>PORTAIL D'ADMINISTRATION & GESTION</div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Tableau de Bord Administratif</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Supervision des inscriptions, gestion du catalogue et métriques financières MySQL en temps réel.
          </p>
        </div>

        <button
          onClick={() => setShowAddCourse(true)}
          className="btn btn-primary"
        >
          <Plus size={18} /> Ajouter un Cours
        </button>
      </div>

      {/* Cartes KPI Stats */}
      {stats && (
        <div className="grid-cols-4" style={{ marginBottom: 36 }}>
          <div className="glass-panel" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: 8 }}>
              <span>Total Étudiants</span>
              <Users size={20} color="var(--primary)" />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{stats.totalStudents}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--accent)', marginTop: 4 }}>Inscrits sur la plateforme</div>
          </div>

          <div className="glass-panel" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: 8 }}>
              <span>Formations Actives</span>
              <BookOpen size={20} color="var(--secondary)" />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{stats.totalCourses}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 4 }}>Programmes en ligne</div>
          </div>

          <div className="glass-panel" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: 8 }}>
              <span>Inscriptions Actives</span>
              <CheckCircle size={20} color="var(--accent)" />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{stats.totalEnrollments}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 4 }}>Confirmées et actives</div>
          </div>

          <div className="glass-panel" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: 8 }}>
              <span>Chiffre d'Affaires</span>
              <DollarSign size={20} color="#f59e0b" />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f59e0b' }}>
              {stats.totalRevenue} DH
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 4 }}>Recettes nettes perçues</div>
          </div>
        </div>
      )}

      {/* Onglets Administration */}
      <div style={{ display: 'flex', gap: 12, borderBottom: '1px solid var(--border-subtle)', marginBottom: 28 }}>
        <button
          onClick={() => setActiveTab('courses')}
          className={`btn btn-sm ${activeTab === 'courses' ? 'btn-primary' : 'btn-outline'}`}
        >
          Gestion des Cours ({courses.length})
        </button>

        <button
          onClick={() => setActiveTab('enrollments')}
          className={`btn btn-sm ${activeTab === 'enrollments' ? 'btn-primary' : 'btn-outline'}`}
        >
          Inscriptions Étudiants ({enrollments.length})
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`btn btn-sm ${activeTab === 'payments' ? 'btn-primary' : 'btn-outline'}`}
        >
          Transactions & Paiements ({payments.length})
        </button>
      </div>

      {/* CONTENU ONGLETS */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          Chargement des données administratives...
        </div>
      ) : activeTab === 'courses' ? (
        /* TABLE DES COURS */
        <div className="glass-panel" style={{ padding: 24, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                <th style={{ padding: 12 }}>ID</th>
                <th style={{ padding: 12 }}>Titre du Cours</th>
                <th style={{ padding: 12 }}>Catégorie</th>
                <th style={{ padding: 12 }}>Tarif</th>
                <th style={{ padding: 12 }}>Capacité / Places</th>
                <th style={{ padding: 12 }}>Niveau</th>
                <th style={{ padding: 12, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <td style={{ padding: 12, color: 'var(--text-dim)' }}>#{c.id}</td>
                  <td style={{ padding: 12, fontWeight: 700 }}>{c.title}</td>
                  <td style={{ padding: 12 }}>{c.category_name}</td>
                  <td style={{ padding: 12, fontWeight: 700, color: 'var(--accent)' }}>
                    {parseFloat(c.price).toFixed(2)} DH
                  </td>
                  <td style={{ padding: 12 }}>
                    <strong>{c.enrolled_count}</strong> / {c.capacity} inscrits ({c.available_seats} libres)
                  </td>
                  <td style={{ padding: 12 }}>
                    <span className="badge badge-cyan">{c.level}</span>
                  </td>
                  <td style={{ padding: 12, textAlign: 'right' }}>
                    <button
                      onClick={() => handleDeleteCourse(c.id)}
                      className="btn btn-sm btn-danger"
                      title="Supprimer ce cours"
                      style={{ padding: '6px 10px' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : activeTab === 'enrollments' ? (
        /* TABLE DES INSCRIPTIONS */
        <div className="glass-panel" style={{ padding: 24, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                <th style={{ padding: 12 }}>Réf Inscription</th>
                <th style={{ padding: 12 }}>Étudiant</th>
                <th style={{ padding: 12 }}>Cours</th>
                <th style={{ padding: 12 }}>Statut</th>
                <th style={{ padding: 12 }}>Paiement</th>
                <th style={{ padding: 12 }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map((e) => (
                <tr key={e.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <td style={{ padding: 12, fontFamily: 'monospace', fontWeight: 600 }}>{e.enrollment_number}</td>
                  <td style={{ padding: 12 }}>
                    <div style={{ fontWeight: 600 }}>{e.user_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{e.user_email}</div>
                  </td>
                  <td style={{ padding: 12 }}>{e.course_title}</td>
                  <td style={{ padding: 12 }}>
                    <span className={`badge ${e.status === 'CONFIRMED' ? 'badge-success' : 'badge-warning'}`}>
                      {e.status}
                    </span>
                  </td>
                  <td style={{ padding: 12 }}>
                    {e.receipt_number ? (
                      <span
                        onClick={() => handleViewReceipt(e.receipt_number)}
                        style={{ color: 'var(--secondary)', cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        {e.receipt_number}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-dim)' }}>Non réglé</span>
                    )}
                  </td>
                  <td style={{ padding: 12, color: 'var(--text-dim)' }}>
                    {new Date(e.enrollment_date).toLocaleDateString('fr-FR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* TABLE DES TRANSACTIONS FINANCIÈRES */
        <div className="glass-panel" style={{ padding: 24, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                <th style={{ padding: 12 }}>N° Reçu</th>
                <th style={{ padding: 12 }}>Réf Transaction</th>
                <th style={{ padding: 12 }}>Étudiant Payeur</th>
                <th style={{ padding: 12 }}>Montant Net</th>
                <th style={{ padding: 12 }}>Remise Code</th>
                <th style={{ padding: 12 }}>Mode</th>
                <th style={{ padding: 12 }}>Statut</th>
                <th style={{ padding: 12, textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <td style={{ padding: 12, fontWeight: 700 }}>{p.receipt_number}</td>
                  <td style={{ padding: 12, fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    {p.transaction_id}
                  </td>
                  <td style={{ padding: 12 }}>{p.user_name}</td>
                  <td style={{ padding: 12, fontWeight: 700, color: 'var(--accent)' }}>
                    {parseFloat(p.amount).toFixed(2)} DH
                  </td>
                  <td style={{ padding: 12 }}>
                    {p.coupon_code ? (
                      <span className="badge badge-primary">-{parseFloat(p.discount_amount).toFixed(2)} DH ({p.coupon_code})</span>
                    ) : (
                      <span style={{ color: 'var(--text-dim)' }}>0.00 DH</span>
                    )}
                  </td>
                  <td style={{ padding: 12 }}>{p.payment_method}</td>
                  <td style={{ padding: 12 }}>
                    <span className={`badge ${p.status === 'SUCCESS' ? 'badge-success' : 'badge-danger'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td style={{ padding: 12, textAlign: 'right' }}>
                    {p.status === 'SUCCESS' && (
                      <button
                        onClick={() => handleViewReceipt(p.receipt_number)}
                        className="btn btn-sm btn-outline"
                        style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                      >
                        Voir Facture
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Ajout Cours */}
      {showAddCourse && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 560 }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 20 }}>
              Ajouter une Nouvelle Formation
            </h3>
            <form onSubmit={handleCreateCourse}>
              <div className="form-group">
                <label className="form-label">Titre du Programme</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={newCourse.title}
                  onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                  placeholder="Ex: Architecture Microservices & Docker"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Catégorie</label>
                  <select
                    className="form-select"
                    value={newCourse.category_id}
                    onChange={(e) => setNewCourse({ ...newCourse, category_id: parseInt(e.target.value, 10) })}
                  >
                    <option value={1}>Développement Web & Mobile</option>
                    <option value={2}>Tests Logiciels & DevOps</option>
                    <option value={3}>IA & Data Science</option>
                    <option value={4}>Cybersécurité & Réseaux</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Niveau</label>
                  <select
                    className="form-select"
                    value={newCourse.level}
                    onChange={(e) => setNewCourse({ ...newCourse, level: e.target.value })}
                  >
                    <option value="DEBUTANT">Débutant</option>
                    <option value="INTERMEDIAIRE">Intermédiaire</option>
                    <option value="AVANCE">Avancé</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Résumé Court</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={newCourse.summary}
                  onChange={(e) => setNewCourse({ ...newCourse, summary: e.target.value })}
                  placeholder="Description succincte pour la carte du cours..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description Détaillée</label>
                <textarea
                  rows={3}
                  required
                  className="form-textarea"
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                  placeholder="Objectifs pédagogiques, prérequis et compétences visées..."
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Tarif (DH)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    className="form-input"
                    value={newCourse.price}
                    onChange={(e) => setNewCourse({ ...newCourse, price: parseFloat(e.target.value) })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Capacité (Places)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    className="form-input"
                    value={newCourse.capacity}
                    onChange={(e) => setNewCourse({ ...newCourse, capacity: parseInt(e.target.value, 10) })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Durée (Heures)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    className="form-input"
                    value={newCourse.duration_hours}
                    onChange={(e) => setNewCourse({ ...newCourse, duration_hours: parseInt(e.target.value, 10) })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
                <button
                  type="button"
                  onClick={() => setShowAddCourse(false)}
                  className="btn btn-outline"
                >
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary">
                  Créer et Publier le Cours
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Reçu de Consultation Admin */}
      {selectedReceipt && (
        <ReceiptModal
          receipt={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </div>
  );
}
