import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  GraduationCap,
  BookOpen,
  LayoutDashboard,
  ShieldCheck,
  CheckCircle2,
  LogIn,
  LogOut,
  User,
  Sparkles,
  Menu,
  X
} from 'lucide-react';

export default function Navbar({ onOpenAuth, currentTab, setTab }) {
  const { user, isAuthenticated, isAdmin, logout, login } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoMenuOpen, setDemoMenuOpen] = useState(false);

  const handleQuickLogin = async (email, password) => {
    try {
      await login(email, password);
      setDemoMenuOpen(false);
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <header className="glass-panel" style={{
      position: 'sticky',
      top: 16,
      zIndex: 100,
      margin: '16px 24px',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      backgroundColor: 'rgba(11, 17, 33, 0.85)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 28px'
      }}>
        {/* Logo & Titre */}
        <div
          onClick={() => setTab('home')}
          style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
        >
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)'
          }}>
            <GraduationCap size={26} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                Campus<span style={{ color: 'var(--secondary)' }}>Enroll</span>
              </span>
              <span className="badge badge-primary" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                Full-Stack MySQL
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 500 }}>
              Processus des Tests Logiciels • EMI
            </div>
          </div>
        </div>

        {/* Navigation Bureau */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 8 }} className="nav-desktop">
          <button
            onClick={() => setTab('home')}
            className={`btn btn-sm ${currentTab === 'home' ? 'btn-primary' : 'btn-outline'}`}
          >
            Accueil
          </button>

          <button
            onClick={() => setTab('courses')}
            className={`btn btn-sm ${currentTab === 'courses' ? 'btn-primary' : 'btn-outline'}`}
          >
            <BookOpen size={16} />
            Catalogue
          </button>

          {isAuthenticated && (
            <button
              onClick={() => setTab('dashboard')}
              className={`btn btn-sm ${currentTab === 'dashboard' ? 'btn-primary' : 'btn-outline'}`}
            >
              <LayoutDashboard size={16} />
              Mes Cours
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => setTab('admin')}
              className={`btn btn-sm ${currentTab === 'admin' ? 'btn-primary' : 'btn-outline'}`}
              style={{ borderColor: 'rgba(245, 158, 11, 0.4)' }}
            >
              <ShieldCheck size={16} color="#f59e0b" />
              Administration
            </button>
          )}

          <button
            onClick={() => setTab('qa')}
            className={`btn btn-sm ${currentTab === 'qa' ? 'btn-accent' : 'btn-outline'}`}
            style={{ borderColor: 'rgba(16, 185, 129, 0.4)' }}
          >
            <CheckCircle2 size={16} color="#10b981" />
            Centre QA (81 Tests)
          </button>
        </nav>

        {/* Espace Utilisateur & Connexion Rapide Démo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Menu Comptes Démo Pratique pour Évaluateur */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setDemoMenuOpen(!demoMenuOpen)}
              className="btn btn-sm btn-outline"
              title="Connexion instantanée aux comptes de test"
              style={{ fontSize: '0.8rem', borderColor: 'rgba(99, 102, 241, 0.3)' }}
            >
              <Sparkles size={14} color="#6366f1" />
              Comptes Démo
            </button>

            {demoMenuOpen && (
              <div className="glass-panel" style={{
                position: 'absolute',
                top: 45,
                right: 0,
                width: 260,
                padding: 12,
                zIndex: 200,
                backgroundColor: '#111827',
                border: '1px solid rgba(255, 255, 255, 0.15)'
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>
                  SÉLECTION RAPIDE DE RÔLE :
                </div>
                <div
                  onClick={() => handleQuickLogin('admin@campus-online.ma', 'Password123!')}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    marginBottom: 4,
                    background: 'rgba(245, 158, 11, 0.1)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(245, 158, 11, 0.2)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(245, 158, 11, 0.1)'}
                >
                  <div style={{ fontWeight: 600, color: '#f59e0b' }}>👑 Prof. Karim (Admin)</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>admin@campus-online.ma</div>
                </div>

                <div
                  onClick={() => handleQuickLogin('etudiant@campus-online.ma', 'Password123!')}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    background: 'rgba(99, 102, 241, 0.1)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)'}
                >
                  <div style={{ fontWeight: 600, color: '#818cf8' }}>🎓 Bilal (Étudiant)</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>etudiant@campus-online.ma</div>
                </div>
              </div>
            )}
          </div>

          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{user?.name}</div>
                <span className={`badge ${isAdmin ? 'badge-warning' : 'badge-primary'}`} style={{ fontSize: '0.65rem' }}>
                  {user?.role}
                </span>
              </div>
              <button
                onClick={logout}
                className="btn btn-sm btn-danger"
                title="Se déconnecter"
                style={{ padding: '8px 12px' }}
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="btn btn-sm btn-primary"
            >
              <LogIn size={16} />
              Connexion / Inscription
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
