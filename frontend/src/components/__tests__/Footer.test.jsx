import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import Footer from '../Footer';

describe('Unit Tests - Component Footer', () => {
  it('TC-FE-FOOT-01 : Affiche les informations académiques et le copyright', () => {
    render(<Footer setTab={vi.fn()} />);

    expect(screen.getByText('CampusEnroll')).toBeInTheDocument();
    expect(screen.getByText(/École Mohammadia d'Ingénieurs \(EMI\)/)).toBeInTheDocument();
    expect(screen.getByText(/Bilal Lahyani/)).toBeInTheDocument();
    expect(screen.getByText(/ISO\/IEC\/IEEE 29119 Software Testing Standards/)).toBeInTheDocument();
  });

  it('TC-FE-FOOT-02 : Déclenche setTab lors du clic sur les liens de navigation', async () => {
    const user = userEvent.setup();
    const handleSetTab = vi.fn();
    render(<Footer setTab={handleSetTab} />);

    const catalogLink = screen.getByText('Catalogue des Cours');
    await user.click(catalogLink);
    expect(handleSetTab).toHaveBeenCalledWith('courses');

    const homeLink = screen.getByText('Accueil');
    await user.click(homeLink);
    expect(handleSetTab).toHaveBeenCalledWith('home');

    const qaLink = screen.getByText(/Centre de Qualification Logicielle/i);
    await user.click(qaLink);
    expect(handleSetTab).toHaveBeenCalledWith('qa');
  });
});
