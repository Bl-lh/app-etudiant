import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthProvider, useAuth } from '../AuthContext';
import api from '../../services/api';

// Composant de test pour consommer le hook useAuth
function TestConsumer() {
  const auth = useAuth();
  return (
    <div>
      <div data-testid="auth-loading">{auth.loading ? 'loading' : 'ready'}</div>
      <div data-testid="auth-status">{auth.isAuthenticated ? 'authenticated' : 'anonymous'}</div>
      <div data-testid="auth-role">{auth.user?.role || 'none'}</div>
      <div data-testid="auth-name">{auth.user?.name || 'none'}</div>
      <div data-testid="is-admin">{auth.isAdmin ? 'true' : 'false'}</div>
      <div data-testid="is-instructor">{auth.isInstructor ? 'true' : 'false'}</div>

      <button onClick={() => auth.login('test@campus.ma', 'password123')}>Se Connecter</button>
      <button onClick={() => auth.register({ name: 'Nouveau', email: 'n@c.ma', password: '123' })}>S'inscrire</button>
      <button onClick={auth.logout}>Déconnexion</button>
      <button onClick={auth.refreshUser}>Rafraîchir</button>
    </div>
  );
}

describe('Unit Tests - AuthContext & useAuth Hook', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('TC-FE-CTX-01 : useAuth lève une exception s\'il est exécuté en dehors de AuthProvider', () => {
    // Espionner console.error pour éviter de polluer les logs de test
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestConsumer />);
    }).toThrow('useAuth must be used within an AuthProvider');

    consoleError.mockRestore();
  });

  it('TC-FE-CTX-02 : Initialisation sans token -> état anonyme et loading: ready', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('auth-loading')).toHaveTextContent('ready');
    expect(screen.getByTestId('auth-status')).toHaveTextContent('anonymous');
    expect(screen.getByTestId('auth-role')).toHaveTextContent('none');
    expect(screen.getByTestId('is-admin')).toHaveTextContent('false');
  });

  it('TC-FE-CTX-03 : Initialisation avec token valide dans localStorage -> recharge l\'utilisateur via api.getMe', async () => {
    localStorage.setItem('campus_token', 'valid-stored-token');
    vi.spyOn(api, 'getMe').mockResolvedValueOnce({
      success: true,
      user: { id: 1, name: 'Bilal Lahyani', email: 'bilal@campus.ma', role: 'ADMIN' }
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    // Attendre le chargement
    await screen.findByText('Bilal Lahyani');

    expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
    expect(screen.getByTestId('auth-role')).toHaveTextContent('ADMIN');
    expect(screen.getByTestId('is-admin')).toHaveTextContent('true');
    expect(screen.getByTestId('is-instructor')).toHaveTextContent('true');
  });

  it('TC-FE-CTX-04 : Initialisation avec token expiré / invalide -> déclenche logout automatique', async () => {
    localStorage.setItem('campus_token', 'expired-token');
    vi.spyOn(api, 'getMe').mockRejectedValueOnce(new Error('Token expiré'));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await screen.findByText('ready');
    expect(screen.getByTestId('auth-status')).toHaveTextContent('anonymous');
    expect(localStorage.getItem('campus_token')).toBeNull();
  });

  it('TC-FE-CTX-05 : login() réussit -> persiste le token et met à jour le profil', async () => {
    let contextValue;
    function Consumer() {
      contextValue = useAuth();
      return <div data-testid="auth-name">{contextValue.user?.name || 'none'}</div>;
    }
    vi.spyOn(api, 'login').mockResolvedValueOnce({
      success: true,
      token: 'jwt-new-login',
      user: { id: 3, name: 'Sara', email: 'test@campus.ma', role: 'STUDENT' }
    });

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );

    await act(async () => {
      await contextValue.login('test@campus.ma', 'password123');
    });

    expect(localStorage.getItem('campus_token')).toBe('jwt-new-login');
    expect(screen.getByTestId('auth-name')).toHaveTextContent('Sara');
    expect(contextValue.isAuthenticated).toBe(true);
    expect(contextValue.isAdmin).toBe(false);
  });

  it('TC-FE-CTX-06 : login() échoue -> propage l\'erreur', async () => {
    let contextValue;
    function Consumer() {
      contextValue = useAuth();
      return null;
    }
    vi.spyOn(api, 'login').mockRejectedValueOnce(new Error('Identifiants invalides'));

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );

    await expect(contextValue.login('test@campus.ma', 'wrongpass')).rejects.toThrow('Identifiants invalides');
  });

  it('TC-FE-CTX-07 : register() réussit -> persiste le token et connecte l\'utilisateur', async () => {
    let contextValue;
    function Consumer() {
      contextValue = useAuth();
      return <div data-testid="auth-name">{contextValue.user?.name || 'none'}</div>;
    }
    vi.spyOn(api, 'register').mockResolvedValueOnce({
      success: true,
      token: 'jwt-new-register',
      user: { id: 4, name: 'Nouveau', email: 'n@c.ma', role: 'STUDENT' }
    });

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );

    await act(async () => {
      await contextValue.register({ name: 'Nouveau', email: 'n@c.ma', password: '123' });
    });

    expect(localStorage.getItem('campus_token')).toBe('jwt-new-register');
    expect(screen.getByTestId('auth-name')).toHaveTextContent('Nouveau');
    expect(contextValue.isAuthenticated).toBe(true);
  });

  it('TC-FE-CTX-08 : logout() réinitialise le contexte et nettoie localStorage', async () => {
    const user = userEvent.setup();
    localStorage.setItem('campus_token', 'token-to-remove');
    vi.spyOn(api, 'getMe').mockResolvedValueOnce({
      success: true,
      user: { id: 1, name: 'Bilal', role: 'STUDENT' }
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await screen.findByText('Bilal');
    await user.click(screen.getByRole('button', { name: 'Déconnexion' }));

    expect(localStorage.getItem('campus_token')).toBeNull();
    expect(screen.getByTestId('auth-status')).toHaveTextContent('anonymous');
    expect(screen.getByTestId('auth-name')).toHaveTextContent('none');
  });

  it('TC-FE-CTX-09 : refreshUser() met à jour les données de l\'utilisateur connecté', async () => {
    const user = userEvent.setup();
    localStorage.setItem('campus_token', 'token-active');
    vi.spyOn(api, 'getMe')
      .mockResolvedValueOnce({
        success: true,
        user: { id: 1, name: 'Bilal Initial', role: 'STUDENT' }
      })
      .mockResolvedValueOnce({
        success: true,
        user: { id: 1, name: 'Bilal Modifié', role: 'INSTRUCTOR' }
      });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await screen.findByText('Bilal Initial');
    await user.click(screen.getByRole('button', { name: 'Rafraîchir' }));

    await screen.findByText('Bilal Modifié');
    expect(screen.getByTestId('auth-role')).toHaveTextContent('INSTRUCTOR');
    expect(screen.getByTestId('is-instructor')).toHaveTextContent('true');
  });
});
