import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AuthModal from '../AuthModal';
import { AuthProvider } from '../../context/AuthContext';
import api from '../../services/api';

describe('Unit Tests - Component AuthModal', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('TC-FE-AUTH-01 : Retourne null si isOpen est faux', () => {
    const { container } = render(
      <AuthProvider>
        <AuthModal isOpen={false} onClose={vi.fn()} />
      </AuthProvider>
    );
    expect(container.firstChild).toBeNull();
  });

  it('TC-FE-AUTH-02 : Affiche le formulaire de connexion par défaut', () => {
    render(
      <AuthProvider>
        <AuthModal isOpen={true} onClose={vi.fn()} />
      </AuthProvider>
    );

    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Connexion Étudiant / Enseignant');
    expect(screen.getByRole('button', { name: 'Se Connecter' })).toBeInTheDocument();
  });

  it('TC-FE-AUTH-03 : Permet de basculer en mode inscription', async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <AuthModal isOpen={true} onClose={vi.fn()} />
      </AuthProvider>
    );

    const switchBtn = screen.getByText(/S'inscrire gratuitement/i);
    await user.click(switchBtn);

    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Créer un Compte Étudiant');
    expect(screen.getByPlaceholderText('Ex: Bilal Lahyani')).toBeInTheDocument();
  });

  it('TC-FE-AUTH-04 : Remplit les champs au clic sur un raccourci de test (ex: Étudiant)', async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <AuthModal isOpen={true} onClose={vi.fn()} />
      </AuthProvider>
    );

    const studentBtn = screen.getByRole('button', { name: /Étudiant/i });
    await user.click(studentBtn);

    const emailInput = screen.getByDisplayValue('etudiant@campus-online.ma');
    expect(emailInput).toBeInTheDocument();
  });

  it('TC-FE-AUTH-05 : Soumet la connexion avec succès, appelle onSuccess et onClose', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    const handleSuccess = vi.fn();

    vi.spyOn(api, 'login').mockResolvedValueOnce({
      success: true,
      token: 'jwt-auth-success',
      user: { id: 1, name: 'Bilal', email: 'etudiant@campus-online.ma', role: 'STUDENT' }
    });

    render(
      <AuthProvider>
        <AuthModal isOpen={true} onClose={handleClose} onSuccess={handleSuccess} />
      </AuthProvider>
    );

    await user.click(screen.getByRole('button', { name: /Étudiant/i }));
    await user.click(screen.getByRole('button', { name: 'Se Connecter' }));

    await waitFor(() => {
      expect(handleSuccess).toHaveBeenCalledTimes(1);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  it('TC-FE-AUTH-06 : Affiche un message d\'erreur si la connexion échoue', async () => {
    const user = userEvent.setup();

    vi.spyOn(api, 'login').mockRejectedValueOnce(
      new Error('Mot de passe incorrect ou email introuvable')
    );

    render(
      <AuthProvider>
        <AuthModal isOpen={true} onClose={vi.fn()} />
      </AuthProvider>
    );

    await user.click(screen.getByRole('button', { name: /Étudiant/i }));
    await user.click(screen.getByRole('button', { name: 'Se Connecter' }));

    expect(await screen.findByText('Mot de passe incorrect ou email introuvable')).toBeInTheDocument();
  });

  it('TC-FE-AUTH-07 : Soumet avec succès le formulaire d\'inscription', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    const handleSuccess = vi.fn();

    vi.spyOn(api, 'register').mockResolvedValueOnce({
      success: true,
      token: 'jwt-register-success',
      user: { id: 10, name: 'Nouvel Étudiant', email: 'nouveau@campus.ma', role: 'STUDENT' }
    });

    render(
      <AuthProvider>
        <AuthModal isOpen={true} onClose={handleClose} onSuccess={handleSuccess} />
      </AuthProvider>
    );

    // Basculer en mode inscription
    await user.click(screen.getByText(/S'inscrire gratuitement/i));

    await user.type(screen.getByPlaceholderText('Ex: Bilal Lahyani'), 'Nouvel Étudiant');
    await user.type(screen.getByPlaceholderText('etudiant@campus-online.ma'), 'nouveau@campus.ma');
    await user.type(screen.getByPlaceholderText('••••••••'), 'Password123!');

    await user.click(screen.getByRole('button', { name: /Créer mon Compte/i }));

    await waitFor(() => {
      expect(handleSuccess).toHaveBeenCalledTimes(1);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });
});
