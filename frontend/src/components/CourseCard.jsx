import React from 'react';
import { Clock, Users, BookOpen, CheckCircle, ArrowRight, Star } from 'lucide-react';

export default function CourseCard({ course, onSelectCourse, onEnrollDirect }) {
  const isEnrolled = course.is_enrolled || course.enrollment_status === 'CONFIRMED';
  const isPending = course.enrollment_status === 'PENDING';
  const isFull = course.available_seats <= 0;

  const occupancyPercent = Math.min(100, Math.round((course.enrolled_count / course.capacity) * 100));

  return (
    <div className="glass-card" style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: 0,
      overflow: 'hidden'
    }}>
      {/* Image Thumbnail avec Badges */}
      <div style={{ position: 'relative', height: 180, overflow: 'hidden' }}>
        <img
          src={course.image_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80'}
          alt={course.title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.4s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        />
        <div style={{
          position: 'absolute',
          top: 12,
          left: 12,
          display: 'flex',
          gap: 6,
          flexWrap: 'wrap'
        }}>
          <span className="badge badge-primary" style={{ background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)' }}>
            {course.category_name}
          </span>
          <span className={`badge ${course.level === 'AVANCE' ? 'badge-warning' : 'badge-cyan'}`} style={{ background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)' }}>
            {course.level}
          </span>
        </div>

        {isEnrolled && (
          <div style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: 'rgba(16, 185, 129, 0.9)',
            color: '#ffffff',
            padding: '4px 10px',
            borderRadius: 9999,
            fontSize: '0.72rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}>
            <CheckCircle size={14} /> Déjà inscrit
          </div>
        )}
      </div>

      {/* Contenu de la Carte */}
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 6 }}>
            Par <strong>{course.instructor_name}</strong>
          </div>

          <h3 style={{
            fontSize: '1.1rem',
            fontWeight: 700,
            lineHeight: 1.4,
            marginBottom: 8,
            color: 'var(--text-main)',
            minHeight: '2.8rem'
          }}>
            {course.title}
          </h3>

          <p style={{
            fontSize: '0.86rem',
            color: 'var(--text-muted)',
            lineHeight: 1.5,
            marginBottom: 16,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {course.summary}
          </p>
        </div>

        <div>
          {/* Métriques : Durée et Places Disponibles */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={15} />
              <span>{course.duration_hours} heures</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Users size={15} />
              <span>{course.enrolled_count} / {course.capacity} inscrits</span>
            </div>
          </div>

          {/* Jauge d'occupation des places */}
          <div style={{
            width: '100%',
            height: 6,
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: 3,
            overflow: 'hidden',
            marginBottom: 16
          }}>
            <div style={{
              width: `${occupancyPercent}%`,
              height: '100%',
              background: occupancyPercent > 80 ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : 'linear-gradient(90deg, #6366f1, #06b6d4)',
              borderRadius: 3
            }} />
          </div>

          {/* Ligne Tarif & Boutons d'Action */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: 14
          }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Tarif Inscription</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: course.price == 0 ? '#10b981' : 'var(--text-main)' }}>
                {parseFloat(course.price) === 0 ? 'Gratuit' : `${parseFloat(course.price).toFixed(2)} DH`}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => onSelectCourse(course)}
                className="btn btn-sm btn-outline"
                title="Consulter le syllabus détaillé"
              >
                Détails
              </button>

              {isEnrolled ? (
                <button
                  onClick={() => onSelectCourse(course)}
                  className="btn btn-sm btn-accent"
                >
                  Accéder
                </button>
              ) : isFull ? (
                <button
                  disabled
                  className="btn btn-sm"
                  style={{ background: '#334155', color: '#94a3b8', cursor: 'not-allowed' }}
                >
                  Complet
                </button>
              ) : (
                <button
                  onClick={() => onEnrollDirect(course)}
                  className="btn btn-sm btn-primary"
                >
                  {isPending ? 'Régler' : "S'inscrire"}
                  <ArrowRight size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
