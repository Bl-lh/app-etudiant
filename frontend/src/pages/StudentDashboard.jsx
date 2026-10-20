import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  CheckCircle,
  Clock,
  CreditCard,
  FileText,
  User,
  ArrowRight,
  Printer,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ReceiptModal from '../components/ReceiptModal';

export default function StudentDashboard({ onSelectCourse, onResumeCheckout }) {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('courses');
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [receiptLoading, setReceiptLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await api.getMyEnrollments();
        if (res.success) {
          setEnrollments(res.data);
        }
      } catch (err) {
        console.error('Erreur chargement inscriptions:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleOpenReceipt = async (receiptNumber) => {
    if (!receiptNumber) return;
    setReceiptLoading(true);
    try {
      const res = await api.getReceipt(receiptNumber);
      if (res.success) {
        setSelectedReceipt(res.data);
      }
    } catch (err) {
      alert(err.message || 'Impossible de charger le reçu.');
    } finally {
      setReceiptLoading(false);
    }
  };

  const confirmedEnrollments = enrollments.filter(e => e.status === 'CONFIRMED');
  const pendingEnrollments = enrollments.filter(e => e.status === 'PENDING');

  return (
    <div style={{ padding: '20px 0 80px 0' }}>
      {/* En-tête Espace Étudiant */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div>
          <div className="badge badge-primary" style={{ marginBottom: 6 }}>ESPACE PERSONNEL ÉTUDIANT</div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800 }}>
            Bonjour, {user?.name}
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Suivez vos cours, votre progression et retrouvez toutes vos attestations et factures.
          </p>
        </div>

        {/* Cartouches de Synthèse */}
        <div style={{ display: 'flex', gap: 16 }}>
          <div className="glass-panel" style={{ padding: '12px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent)' }}>
              {confirmedEnrollments.length}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Cours Confirmés</div>
          </div>

          <div className="glass-panel" style={{ padding: '12px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f59e0b' }}>
              {pendingEnrollments.length}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>En attente paiement</div>
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div style={{
        display: 'flex',
        gap: 12,
        borderBottom: '1px solid var(--border-subtle)',
        marginBottom: 28
      }}>
        <button
          onClick={() => setActiveTab('courses')}
          className={`btn btn-sm ${activeTab === 'courses' ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderRadius: '8px 8px 0 0', borderBottom: 'none' }}
        >
          <BookOpen size={16} /> Mes Formations ({enrollments.length})
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`btn btn-sm ${activeTab === 'payments' ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderRadius: '8px 8px 0 0', borderBottom: 'none' }}
        >
          <CreditCard size={16} /> Historique & Reçus Fiscaux
        </button>
      </div>

      {/* CONTENU ONGLETS */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          Chargement de votre dossier étudiant...
        </div>
      ) : activeTab === 'courses' ? (
        <div>
          {enrollments.length > 0 ? (
            <div className="grid-cols-2">
              {enrollments.map((e) => {
                const isConfirmed = e.status === 'CONFIRMED';
                return (
                  <div key={e.id} className="glass-card" style={{ padding: 24 }}>
                    <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                      <img
                        src={e.image_url}
                        alt={e.course_title}
                        style={{ width: 80, height: 80, borderRadius: 12, objectFit: 'cover' }}
                      />
                      <div style={{ flexGrow: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span className={`badge ${isConfirmed ? 'badge-success' : 'badge-warning'}`}>
                            {isConfirmed ? 'INSCRIPTION VALIDÉE' : 'EN ATTENTE DE RÈGLEMENT'}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
                            {e.enrollment_number}
                          </span>
                        </div>

                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '8px 0 4px 0' }}>
                          {e.course_title}
                        </h3>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                          Par {e.instructor_name} • {e.category_name}
                        </div>
                      </div>
                    </div>

                    {/* Barre de Progression */}
                    {isConfirmed && (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 6 }}>
                          <span style={{ color: 'var(--text-muted)' }}>Progression pédagogique</span>
                          <strong>{e.progress_percent || 0}%</strong>
                        </div>
                        <div style={{ width: '100%', height: 6, background: 'rgba(255, 255, 255, 0.08)', borderRadius: 3 }}>
                          <div style={{
                            width: `${e.progress_percent || 0}%`,
                            height: '100%',
                            background: 'var(--accent)',
                            borderRadius: 3
                          }} />
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderTop: '1px solid var(--border-subtle)',
                      paddingTop: 14
                    }}>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                        Inscrit le {new Date(e.enrollment_date).toLocaleDateString('fr-FR')}
                      </div>

                      <div style={{ display: 'flex', gap: 8 }}>
                        {isConfirmed ? (
                          <>
                            {e.receipt_number && (
                              <button
                                onClick={() => handleOpenReceipt(e.receipt_number)}
                                className="btn btn-sm btn-outline"
                                title="Télécharger le reçu officiel"
                              >
                                <FileText size={15} /> Reçu
                              </button>
                            )}
                            <button
                              onClick={() => onSelectCourse({ id: e.course_id })}
                              className="btn btn-sm btn-primary"
                            >
                              Accéder aux Cours <ArrowRight size={14} />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => onResumeCheckout(e)}
                            className="btn btn-sm btn-primary"
                            style={{ background: '#f59e0b' }}
                          >
                            Finaliser le Paiement
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '60px 20px', textAlign: 'center' }}>
              <BookOpen size={48} color="var(--text-dim)" style={{ marginBottom: 16 }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 8 }}>
                Vous n'êtes inscrit à aucun cours pour le moment
              </h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>
                Explorez notre catalogue et commencez votre formation dès aujourd'hui.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* ONGLET PAIEMENTS ET REÇUS */
        <div className="glass-panel" style={{ padding: 24, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                <th style={{ padding: 12 }}>Date</th>
                <th style={{ padding: 12 }}>N° Reçu</th>
                <th style={{ padding: 12 }}>Réf Transaction</th>
                <th style={{ padding: 12 }}>Cours Inscrit</th>
                <th style={{ padding: 12 }}>Montant Réglé</th>
                <th style={{ padding: 12 }}>Mode</th>
                <th style={{ padding: 12 }}>Statut</th>
                <th style={{ padding: 12, textAlign: 'right' }}>Document</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.filter(e => e.receipt_number).map((e) => (
                <tr key={e.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <td style={{ padding: 12, color: 'var(--text-dim)' }}>
                    {new Date(e.enrollment_date).toLocaleDateString('fr-FR')}
                  </td>
                  <td style={{ padding: 12, fontWeight: 600 }}>{e.receipt_number}</td>
                  <td style={{ padding: 12, fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    {e.transaction_id || 'N/A'}
                  </td>
                  <td style={{ padding: 12, fontWeight: 600 }}>{e.course_title}</td>
                  <td style={{ padding: 12, fontWeight: 700, color: 'var(--accent)' }}>
                    {parseFloat(e.paid_amount || e.course_price).toFixed(2)} DH
                  </td>
                  <td style={{ padding: 12 }}>{e.payment_method || 'CARTE BANCAIRE'}</td>
                  <td style={{ padding: 12 }}>
                    <span className="badge badge-success">✓ SUCCÈS</span>
                  </td>
                  <td style={{ padding: 12, textAlign: 'right' }}>
                    <button
                      onClick={() => handleOpenReceipt(e.receipt_number)}
                      className="btn btn-sm btn-outline"
                      style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                    >
                      <Printer size={14} /> Imprimer Reçu
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Reçu */}
      {selectedReceipt && (
        <ReceiptModal
          receipt={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </div>
  );
}
