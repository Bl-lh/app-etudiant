import React from 'react';
import {
  GraduationCap,
  ShieldCheck,
  CheckCircle,
  Database,
  CreditCard,
  Award,
  ArrowRight,
  Sparkles,
  Layers,
  BookOpen
} from 'lucide-react';
import CourseCard from '../components/CourseCard';

export default function HomePage({ courses, setTab, onSelectCourse, onEnrollDirect }) {
  const featuredCourses = courses.slice(0, 3);

  return (
    <div>
      {/* SECTION HERO */}
      <section style={{
        padding: '60px 0 80px 0',
        textAlign: 'center',
        position: 'relative'
      }}>
        {/* Badge Hero */}
        <div style={{ display: 'inline-flex', marginBottom: 20 }}>
          <div className="badge badge-primary" style={{
            padding: '8px 18px',
            fontSize: '0.85rem',
            borderRadius: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <Sparkles size={16} color="#818cf8" />
            <span>PROJET ACADÉMIQUE • PROCESSUS COMPLET DES TESTS LOGICIELS</span>
          </div>
        </div>

        {/* Titre Principal */}
        <h1 style={{
          fontSize: '3.2rem',
          fontWeight: 800,
          letterSpacing: '-0.03em',
          lineHeight: 1.15,
          marginBottom: 24,
          maxWidth: 900,
          margin: '0 auto 24px auto',
          background: 'linear-gradient(180deg, #ffffff 0%, #cbd5e1 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Inscrivez-vous aux Cours en Ligne d'Ingénierie & Suivez vos Qualifications
        </h1>

        <p style={{
          fontSize: '1.15rem',
          color: 'var(--text-muted)',
          maxWidth: 720,
          margin: '0 auto 36px auto',
          lineHeight: 1.6
        }}>
          Plateforme Full-Stack complète d'inscription aux cours, facturation interactive et validation bancaire sécurisée avec persistance relationnelle MySQL et suite de tests automatisés.
        </p>

        {/* Boutons d'Action */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
          <button
            onClick={() => setTab('courses')}
            className="btn btn-primary btn-lg"
          >
            <BookOpen size={20} />
            Explorer le Catalogue de Cours
          </button>

          <button
            onClick={() => setTab('qa')}
            className="btn btn-accent btn-lg"
          >
            <CheckCircle size={20} />
            Centre QA (81 Tests Passés)
          </button>
        </div>

        {/* Bannière de Métriques Clés */}
        <div className="glass-panel" style={{
          maxWidth: 940,
          margin: '60px auto 0 auto',
          padding: '24px 32px',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 24
        }}>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--secondary)' }}>100%</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Persistance MySQL</div>
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent)' }}>81 / 81</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Tests Automatisés</div>
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f59e0b' }}>ACID</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Transactions Sécurisées</div>
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#a5b4fc' }}>ISTQB</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Norme de Qualification</div>
          </div>
        </div>
      </section>

      {/* SECTION DES 4 PILIERS DU PROJET */}
      <section style={{ padding: '40px 0 80px 0' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 12 }}>
            Les Fondations du Système d'Inscription
          </h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: 600, margin: '0 auto' }}>
            Une architecture conçue pour répondre aux critères stricts de qualification logicielle.
          </p>
        </div>

        <div className="grid-cols-4">
          <div className="glass-panel" style={{ padding: 24 }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'rgba(99, 102, 241, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16
            }}>
              <GraduationCap size={24} color="#6366f1" />
            </div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 8 }}>Inscription Étudiante</h4>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
              Gestion des places, quotas d'admission, détection des doublons et règles d'accès selon les rôles.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: 24 }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'rgba(6, 182, 212, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16
            }}>
              <CreditCard size={24} color="#06b6d4" />
            </div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 8 }}>Paiement & Facturation</h4>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
              Validation algorithmique de Luhn, remises sur coupons, simulation de refus et reçus officiels téléchargeables.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: 24 }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16
            }}>
              <Database size={24} color="#10b981" />
            </div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 8 }}>Persistance MySQL</h4>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
              Schéma relationnel 3NF normalisé, contraintes d'intégrité référentielle, indexes et rollback en cas d'incident.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: 24 }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16
            }}>
              <ShieldCheck size={24} color="#f59e0b" />
            </div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 8 }}>Couverture de Tests</h4>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
              Tests unitaires, tests d'intégration API, cas aux limites (BVA) et scénarios bout-en-bout (E2E).
            </p>
          </div>
        </div>
      </section>

      {/* SECTION COURS À LA UNE */}
      <section style={{ padding: '20px 0 80px 0' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginBottom: 32
        }}>
          <div>
            <div className="badge badge-cyan" style={{ marginBottom: 8 }}>FORMATIONS VEDETTES</div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>Cours en Ligne Recommandés</h2>
          </div>
          <button
            onClick={() => setTab('courses')}
            className="btn btn-outline btn-sm"
          >
            Voir tous les cours <ArrowRight size={16} />
          </button>
        </div>

        <div className="grid-cols-3">
          {featuredCourses.map((c) => (
            <CourseCard
              key={c.id}
              course={c}
              onSelectCourse={onSelectCourse}
              onEnrollDirect={onEnrollDirect}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
