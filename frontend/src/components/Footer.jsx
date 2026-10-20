import React from 'react';
import { GraduationCap, ShieldCheck, Database, Award } from 'lucide-react';

export default function Footer({ setTab }) {
  return (
    <footer style={{
      borderTop: '1px solid var(--border-subtle)',
      background: 'rgba(11, 17, 33, 0.95)',
      padding: '48px 0 32px 0',
      marginTop: 80
    }}>
      <div className="app-container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr',
          gap: 36,
          marginBottom: 36
        }}>
          {/* Logo & Description */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <GraduationCap size={20} color="#ffffff" />
              </div>
              <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>CampusEnroll</span>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 440 }}>
              Plateforme Web Full-Stack d'inscription des étudiants aux cours en ligne avec facturation interactive, validation bancaire conforme et persistance relationnelle MySQL.
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
              <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>MySQL 8.4</span>
              <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>React 19 + Express</span>
              <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>81 Tests Passés</span>
            </div>
          </div>

          {/* Navigation Rapide */}
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 16 }}>Navigation</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              <li>
                <span onClick={() => setTab('home')} style={{ cursor: 'pointer' }} onMouseEnter={(e) => e.target.style.color = '#fff'} onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}>
                  Accueil
                </span>
              </li>
              <li>
                <span onClick={() => setTab('courses')} style={{ cursor: 'pointer' }} onMouseEnter={(e) => e.target.style.color = '#fff'} onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}>
                  Catalogue des Cours
                </span>
              </li>
              <li>
                <span onClick={() => setTab('qa')} style={{ cursor: 'pointer' }} onMouseEnter={(e) => e.target.style.color = '#fff'} onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}>
                  Centre de Qualification Logicielle (QA)
                </span>
              </li>
            </ul>
          </div>

          {/* Projet Académique */}
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 16 }}>Projet Universitaire</h4>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              <div><strong>Matière :</strong> Processus des Tests Logiciels</div>
              <div><strong>École :</strong> École Mohammadia d'Ingénieurs (EMI)</div>
              <div><strong>Auteur :</strong> Bilal Lahyani</div>
              <div style={{ marginTop: 8, color: 'var(--accent)' }}>✓ 100% Conforme aux Exigences</div>
            </div>
          </div>
        </div>

        {/* Ligne inférieure */}
        <div style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          paddingTop: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.78rem',
          color: 'var(--text-dim)',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div>© 2026 CampusEnroll • Plateforme d'inscription & Qualification Logicielle. Tous droits réservés.</div>
          <div style={{ display: 'flex', gap: 16 }}>
            <span>ISO/IEC/IEEE 29119 Software Testing Standards</span>
            <span>PCI-DSS Validated</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
