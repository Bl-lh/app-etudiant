import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Lock, Mail, User, Phone, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, initialMode = 'login', onSuccess }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'STUDENT'
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(formData.email, formData.password);
      } else {
        await register(formData);
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Une erreur est survenue lors de l\'authentification.');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickAccount = (email, password) => {
    setFormData({ ...formData, email, password });
    setError(null);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 460 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
            {mode === 'login' ? 'Connexion Étudiant / Enseignant' : 'Créer un Compte Étudiant'}
          </h3>
          <button onClick={onClose} className="btn-outline" style={{ padding: 6, borderRadius: '50%' }}>
            <X size={18} />
          </button>
        </div>

        {/* Alerte Erreur */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 8,
            padding: '12px 14px',
            color: '#f87171',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 20
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Raccourcis Comptes de Démonstration */}
        {mode === 'login' && (
          <div style={{
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px dashed rgba(99, 102, 241, 0.3)',
            borderRadius: 8,
            padding: 12,
            marginBottom: 20
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a5b4fc', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Sparkles size={14} /> Pré-remplir avec un compte de test :
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => fillQuickAccount('etudiant@campus-online.ma', 'Password123!')}
                className="btn btn-sm btn-outline"
                style={{ fontSize: '0.78rem', padding: '4px 10px', flex: 1 }}
              >
                🎓 Étudiant
              </button>
              <button
                type="button"
                onClick={() => fillQuickAccount('admin@campus-online.ma', 'Password123!')}
                className="btn btn-sm btn-outline"
                style={{ fontSize: '0.78rem', padding: '4px 10px', flex: 1 }}
              >
                👑 Admin
              </button>
            </div>
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label">Nom et Prénom</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  required
                  placeholder="Ex: Bilal Lahyani"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Adresse Email</label>
            <input
              type="email"
              required
              placeholder="etudiant@campus-online.ma"
              className="form-input"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Mot de passe</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              className="form-input"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label">Téléphone (Optionnel)</label>
              <input
                type="tel"
                placeholder="+212 6..."
                className="form-input"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 8 }}
          >
            {loading ? 'Chargement...' : mode === 'login' ? 'Se Connecter' : 'Créer mon Compte'}
          </button>
        </form>

        {/* Toggle Mode */}
        <div style={{ textAlign: 'center', marginTop: 20, fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          {mode === 'login' ? (
            <span>
              Pas encore de compte ?{' '}
              <button
                onClick={() => { setMode('register'); setError(null); }}
                style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline' }}
              >
                S'inscrire gratuitement
              </button>
            </span>
          ) : (
            <span>
              Vous avez déjà un compte ?{' '}
              <button
                onClick={() => { setMode('login'); setError(null); }}
                style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline' }}
              >
                Se connecter
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
