import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Navbar from '../Navbar';
import { AuthProvider } from '../../context/AuthContext';
import * as AuthContextModule from '../../context/AuthContext';

describe('Unit Tests - Component Navbar', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('TC-FE-NAV-01 : Affiche le logo, le titre et les onglets par défaut en mode anonyme', () => {
    render(
      <AuthProvider>
        <Navbar currentTab="home" setTab={vi.fn()} onOpenAuth={vi.fn()} />
      </AuthProvider>
    );

    expect(screen.getByText('Campus')).toBeInTheDocument();
    expect(screen.getByText('Enroll')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Accueil/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Catalogue/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Centre QA/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Connexion \/ Inscription/i })).toBeInTheDocument();
  });

  it('TC-FE-NAV-02 : Déclenche setTab au clic sur un onglet de navigation', async () => {
    const user = userEvent.setup();
    const handleSetTab = vi.fn();

    render(
      <AuthProvider>
        <Navbar currentTab="home" setTab={handleSetTab} onOpenAuth={vi.fn()} />
      </AuthProvider>
    );

    const catalogBtn = screen.getByRole('button', { name: /Catalogue/i });
    await user.click(catalogBtn);

    expect(handleSetTab).toHaveBeenCalledTimes(1);
    expect(handleSetTab).toHaveBeenCalledWith('courses');
  });

  it('TC-FE-NAV-03 : Déclenche onOpenAuth au clic sur le bouton de connexion', async () => {
    const user = userEvent.setup();
    const handleOpenAuth = vi.fn();

    render(
      <AuthProvider>
        <Navbar currentTab="home" setTab={vi.fn()} onOpenAuth={handleOpenAuth} />
      </AuthProvider>
    );

    const loginBtn = screen.getByRole('button', { name: /Connexion \/ Inscription/i });
    await user.click(loginBtn);

    expect(handleOpenAuth).toHaveBeenCalledTimes(1);
  });

  it('TC-FE-NAV-04 : Affiche les informations de l\'utilisateur et le bouton Mes Cours quand connecté en tant qu\'étudiant', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: { name: 'Bilal Lahyani', role: 'STUDENT' },
      isAuthenticated: true,
      isAdmin: false,
      logout: vi.fn(),
      login: vi.fn()
    });

    render(<Navbar currentTab="home" setTab={vi.fn()} onOpenAuth={vi.fn()} />);

    expect(screen.getByText('Bilal Lahyani')).toBeInTheDocument();
    expect(screen.getByText('STUDENT')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Mes Cours/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Administration/i })).toBeNull();
  });

  it('TC-FE-NAV-05 : Affiche l\'onglet Administration si l\'utilisateur est un ADMIN', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: { name: 'Professeur Admin', role: 'ADMIN' },
      isAuthenticated: true,
      isAdmin: true,
      logout: vi.fn(),
      login: vi.fn()
    });

    render(<Navbar currentTab="home" setTab={vi.fn()} onOpenAuth={vi.fn()} />);

    expect(screen.getByRole('button', { name: /Administration/i })).toBeInTheDocument();
  });

  it('TC-FE-NAV-06 : Déclenche logout au clic sur le bouton de déconnexion', async () => {
    const user = userEvent.setup();
    const mockLogout = vi.fn();

    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: { name: 'Bilal', role: 'STUDENT' },
      isAuthenticated: true,
      isAdmin: false,
      logout: mockLogout,
      login: vi.fn()
    });

    render(<Navbar currentTab="home" setTab={vi.fn()} onOpenAuth={vi.fn()} />);

    const logoutBtn = screen.getByTitle('Se déconnecter');
    await user.click(logoutBtn);

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('TC-FE-NAV-07 : Ouvre le menu Démo et permet la connexion rapide d\'un profil', async () => {
    const user = userEvent.setup();
    const mockLogin = vi.fn().mockResolvedValue({ success: true });

    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null,
      isAuthenticated: false,
      isAdmin: false,
      logout: vi.fn(),
      login: mockLogin
    });

    render(<Navbar currentTab="home" setTab={vi.fn()} onOpenAuth={vi.fn()} />);

    const demoBtn = screen.getByRole('button', { name: /Comptes Démo/i });
    await user.click(demoBtn);

    expect(screen.getByText('SÉLECTION RAPIDE DE RÔLE :')).toBeInTheDocument();

    const adminOption = screen.getByText(/Prof. Karim \(Admin\)/i);
    await user.click(adminOption);

    expect(mockLogin).toHaveBeenCalledWith('admin@campus-online.ma', 'Password123!');
  });
});
