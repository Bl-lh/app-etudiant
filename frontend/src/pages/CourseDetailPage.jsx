import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, Users, Star, CheckCircle, BookOpen, ShieldCheck, ChevronRight } from 'lucide-react';
import api from '../services/api';

export default function CourseDetailPage({ courseId, onBack, onEnroll }) {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchCourse() {
      try {
        const res = await api.getCourseById(courseId);
        if (res.success) {
          setCourse(res.data);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchCourse();
  }, [courseId]);

  if (loading) {
    return (
      <div style={{ padding: '80px 0', textAlign: 'center' }}>
        <div style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>Chargement du cours...</div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center' }}>
        <p style={{ color: 'var(--danger)', marginBottom: 16 }}>{error || 'Cours introuvable.'}</p>
        <button onClick={onBack} className="btn btn-outline">
          <ArrowLeft size={16} /> Retour au catalogue
        </button>
      </div>
    );
  }

  const syllabus = Array.isArray(course.syllabus) ? course.syllabus : [];
  const reviews = course.reviews || [];

  return (
    <div style={{ padding: '20px 0 80px 0' }}>
      {/* Bouton Retour */}
      <button
        onClick={onBack}
        className="btn btn-outline btn-sm"
        style={{ marginBottom: 24 }}
      >
        <ArrowLeft size={16} /> Retour au catalogue
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 32 }}>
        {/* Colonne Principale */}
        <div>
          {/* Header du Cours */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <span className="badge badge-primary">{course.category_name}</span>
            <span className="badge badge-cyan">{course.level}</span>
          </div>

          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1.25, marginBottom: 16 }}>
            {course.title}
          </h1>

          <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 24 }}>
            {course.summary}
          </p>

          <div style={{
            display: 'flex',
            gap: 24,
            padding: '16px 20px',
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            marginBottom: 36,
            fontSize: '0.9rem'
          }}>
            <div>
              <span style={{ color: 'var(--text-dim)' }}>Instructeur : </span>
              <strong>{course.instructor_name}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-dim)' }}>Durée totale : </span>
              <strong>{course.duration_hours}h</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-dim)' }}>Note moyenne : </span>
              <strong style={{ color: '#f59e0b' }}>★ {course.average_rating || '5.0'} / 5</strong>
            </div>
          </div>

          {/* Description Détaillée */}
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 16 }}>À propos de ce programme</h2>
            <div className="glass-panel" style={{ padding: 24, lineHeight: 1.7, color: 'var(--text-muted)' }}>
              {course.description}
            </div>
          </div>

          {/* Programme et Syllabus */}
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 16 }}>Programme pédagogique (Syllabus)</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {syllabus.length > 0 ? syllabus.map((module, idx) => (
                <div
                  key={idx}
                  className="glass-panel"
                  style={{
                    padding: '16px 20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: 'rgba(99, 102, 241, 0.2)',
                      color: '#a5b4fc',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.85rem'
                    }}>
                      {idx + 1}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                        {module.module}
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                        {module.title}
                      </div>
                    </div>
                  </div>
                  <span className="badge badge-primary">{module.duration}</span>
                </div>
              )) : (
                <div className="glass-panel" style={{ padding: 20, color: 'var(--text-dim)' }}>
                  Syllabus détaillé disponible après inscription.
                </div>
              )}
            </div>
          </div>

          {/* Avis Étudiants */}
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 16 }}>Évaluations & Retours d'étudiants</h2>
            {reviews.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {reviews.map((r) => (
                  <div key={r.id} className="glass-panel" style={{ padding: 18 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontWeight: 600 }}>{r.user_name}</span>
                      <span style={{ color: '#f59e0b' }}>{'★'.repeat(r.rating)}</span>
                    </div>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>{r.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-panel" style={{ padding: 20, color: 'var(--text-dim)' }}>
                Ce cours n'a pas encore reçu d'évaluation publique.
              </div>
            )}
          </div>
        </div>

        {/* Colonne Latérale Fixe : Panneau d'Inscription */}
        <div>
          <div className="glass-panel" style={{
            padding: 28,
            position: 'sticky',
            top: 100,
            border: '1px solid rgba(99, 102, 241, 0.3)'
          }}>
            <div style={{
              height: 180,
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              marginBottom: 20
            }}>
              <img
                src={course.image_url}
                alt={course.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
              Droits d'inscription
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: 16, color: '#ffffff' }}>
              {parseFloat(course.price) === 0 ? 'Gratuit' : `${parseFloat(course.price).toFixed(2)} DH`}
            </div>

            {/* Disponibilité des Places */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.6)',
              padding: 12,
              borderRadius: 8,
              fontSize: '0.85rem',
              marginBottom: 20,
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: 'var(--text-muted)' }}>Places disponibles :</span>
                <strong>{course.available_seats} / {course.capacity}</strong>
              </div>
              <div style={{
                width: '100%',
                height: 6,
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 3,
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${Math.min(100, (course.enrolled_count / course.capacity) * 100)}%`,
                  height: '100%',
                  background: 'var(--secondary)'
                }} />
              </div>
            </div>

            {/* Bouton d'Inscription */}
            <button
              onClick={() => onEnroll(course)}
              disabled={course.available_seats <= 0}
              className="btn btn-primary"
              style={{ width: '100%', padding: '16px 20px', fontSize: '1rem', marginBottom: 16 }}
            >
              {course.available_seats <= 0 ? 'Session Complète' : "S'inscrire Maintenant"}
            </button>

            {/* Avantages & Garanties */}
            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle size={15} color="#10b981" />
                <span>Accès à vie aux modules & supports</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle size={15} color="#10b981" />
                <span>Attestation officielle téléchargeable</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={15} color="#6366f1" />
                <span>Facture & reçu conformes générés</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
