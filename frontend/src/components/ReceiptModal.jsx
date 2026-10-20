import React from 'react';
import { Printer, CheckCircle, X, ShieldCheck, Download, GraduationCap } from 'lucide-react';

export default function ReceiptModal({ receipt, onClose }) {
  if (!receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  const student = receipt.student || {};
  const course = receipt.course || {};
  const billing = receipt.billing || {};
  const institution = receipt.institution || {};

  return (
    <div className="modal-overlay">
      <div className="modal-content receipt-printable" style={{ maxWidth: 640 }}>
        {/* En-tête modal non imprimable */}
        <div className="no-print" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle color="#10b981" size={22} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Reçu Officiel d'Inscription & Paiement</h3>
          </div>
          <button onClick={onClose} className="btn-outline" style={{ padding: 6, borderRadius: '50%' }}>
            <X size={18} />
          </button>
        </div>

        {/* Corps officiel du reçu */}
        <div style={{
          padding: 24,
          background: '#ffffff',
          color: '#0f172a',
          borderRadius: 12,
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
        }}>
          {/* Logo & Institution */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #e2e8f0', paddingBottom: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <GraduationCap size={28} color="#4f46e5" />
                <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1e1b4b' }}>
                  Campus Online
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 4 }}>
                {institution.name || 'Académie des Formations Supérieures'}<br />
                {institution.address || 'Agdal, Rabat, Maroc'}<br />
                {institution.email || 'contact@campus-online.ma'}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{
                display: 'inline-block',
                background: '#ecfdf5',
                color: '#059669',
                padding: '4px 12px',
                borderRadius: 9999,
                fontWeight: 700,
                fontSize: '0.82rem',
                border: '1px solid #a7f3d0'
              }}>
                ✓ INSCRIPTION VALIDÉE
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginTop: 8 }}>
                N° Reçu : {receipt.receiptNumber}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Réf Transaction : {receipt.transactionId}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Date : {new Date(receipt.date).toLocaleString('fr-FR')}
              </div>
            </div>
          </div>

          {/* Informations Étudiant & Cours */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, margin: '20px 0', fontSize: '0.88rem' }}>
            <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid #edf2f7' }}>
              <div style={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: 6 }}>
                Étudiant Inscrit
              </div>
              <div style={{ fontWeight: 700, color: '#0f172a' }}>{student.name}</div>
              <div style={{ color: '#475569' }}>{student.email}</div>
              <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{student.phone || 'Non renseigné'}</div>
            </div>

            <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid #edf2f7' }}>
              <div style={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: 6 }}>
                Détails du Programme
              </div>
              <div style={{ fontWeight: 700, color: '#0f172a' }}>{course.title}</div>
              <div style={{ color: '#475569' }}>Instructeur : {course.instructor || 'Professeur certifié'}</div>
              <div style={{ color: '#64748b', fontSize: '0.8rem' }}>Niveau : {course.level || 'Intermédiaire'} ({course.duration})</div>
            </div>
          </div>

          {/* Décomposition Financière */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', margin: '20px 0' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', color: '#334155', textAlign: 'left' }}>
                <th style={{ padding: '10px 12px' }}>Désignation</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Montant</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '10px 12px' }}>Frais d'inscription et licence de cours</td>
                <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                  {billing.originalAmount ? billing.originalAmount.toFixed(2) : '0.00'} DH
                </td>
              </tr>

              {billing.discountAmount > 0 && (
                <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#059669' }}>
                  <td style={{ padding: '10px 12px' }}>
                    Remise Code Promo ({billing.couponCode || 'PROMO'})
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                    -{billing.discountAmount.toFixed(2)} DH
                  </td>
                </tr>
              )}

              <tr style={{ background: '#f8fafc', fontWeight: 800, fontSize: '1.05rem', color: '#1e1b4b' }}>
                <td style={{ padding: '12px 12px' }}>TOTAL RÉGLÉ (TTC)</td>
                <td style={{ padding: '12px 12px', textAlign: 'right', color: '#4f46e5' }}>
                  {billing.finalPaidAmount ? billing.finalPaidAmount.toFixed(2) : '0.00'} DH
                </td>
              </tr>
            </tbody>
          </table>

          {/* Mode de règlement & Sécurité */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#f8fafc',
            padding: 12,
            borderRadius: 8,
            fontSize: '0.8rem',
            color: '#475569'
          }}>
            <div>
              Mode de paiement : <strong>{billing.paymentMethod || 'CARTE BANCAIRE'}</strong>
              {billing.cardLast4 && ` (se terminant par •••• ${billing.cardLast4})`}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#059669' }}>
              <ShieldCheck size={16} />
              Certifié conforme & vérifié
            </div>
          </div>

          {/* Simulation Code-Barres / Authenticité */}
          <div style={{ textAlign: 'center', marginTop: 24, paddingTop: 16, borderTop: '1px dashed #cbd5e1' }}>
            <div style={{
              fontFamily: 'monospace',
              letterSpacing: '0.35em',
              fontSize: '1.1rem',
              color: '#475569',
              fontWeight: 700
            }}>
              ||| | ||||| || |||| ||||| ||| |||| |
            </div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 4 }}>
              Document électronique généré automatiquement par CampusEnroll Platform
            </div>
          </div>
        </div>

        {/* Boutons d'action non imprimables */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
          <button onClick={onClose} className="btn btn-outline btn-sm">
            Fermer
          </button>
          <button onClick={handlePrint} className="btn btn-primary btn-sm">
            <Printer size={16} />
            Imprimer / Télécharger Reçu (PDF)
          </button>
        </div>
      </div>
    </div>
  );
}
