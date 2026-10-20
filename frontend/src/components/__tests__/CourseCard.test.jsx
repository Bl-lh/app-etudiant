import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import CourseCard from '../CourseCard';

describe('Unit Tests - Component CourseCard', () => {
  const baseCourse = {
    id: 1,
    title: 'Automatisation des Tests avec Playwright',
    summary: 'Maîtrisez les tests E2E et la qualification logicielle moderne.',
    instructor_name: 'Dr. Karim Alami',
    category_name: 'Tests Logiciels',
    level: 'INTERMEDIAIRE',
    duration_hours: 35,
    enrolled_count: 15,
    capacity: 30,
    available_seats: 15,
    price: 650.00,
    image_url: 'https://example.com/course.jpg',
    is_enrolled: false,
    enrollment_status: null
  };

  it('TC-FE-CCARD-01 : Affiche les informations textuelles et métriques du cours', () => {
    render(<CourseCard course={baseCourse} onSelectCourse={vi.fn()} onEnrollDirect={vi.fn()} />);

    expect(screen.getByText('Automatisation des Tests avec Playwright')).toBeInTheDocument();
    expect(screen.getByText(/Dr. Karim Alami/i)).toBeInTheDocument();
    expect(screen.getByText('Tests Logiciels')).toBeInTheDocument();
    expect(screen.getByText('INTERMEDIAIRE')).toBeInTheDocument();
    expect(screen.getByText('35 heures')).toBeInTheDocument();
    expect(screen.getByText('15 / 30 inscrits')).toBeInTheDocument();
    expect(screen.getByText('650.00 DH')).toBeInTheDocument();
  });

  it('TC-FE-CCARD-02 : Affiche la mention "Gratuit" pour un cours à tarif 0', () => {
    const freeCourse = { ...baseCourse, price: 0 };
    render(<CourseCard course={freeCourse} onSelectCourse={vi.fn()} onEnrollDirect={vi.fn()} />);

    expect(screen.getByText('Gratuit')).toBeInTheDocument();
  });

  it('TC-FE-CCARD-03 : Déclenche onSelectCourse au clic sur le bouton "Détails"', async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();
    render(<CourseCard course={baseCourse} onSelectCourse={handleSelect} onEnrollDirect={vi.fn()} />);

    const detailsBtn = screen.getByRole('button', { name: /Détails/i });
    await user.click(detailsBtn);

    expect(handleSelect).toHaveBeenCalledTimes(1);
    expect(handleSelect).toHaveBeenCalledWith(baseCourse);
  });

  it('TC-FE-CCARD-04 : Déclenche onEnrollDirect au clic sur "S\'inscrire" si non inscrit', async () => {
    const user = userEvent.setup();
    const handleEnroll = vi.fn();
    render(<CourseCard course={baseCourse} onSelectCourse={vi.fn()} onEnrollDirect={handleEnroll} />);

    const enrollBtn = screen.getByRole('button', { name: /S'inscrire/i });
    await user.click(enrollBtn);

    expect(handleEnroll).toHaveBeenCalledTimes(1);
    expect(handleEnroll).toHaveBeenCalledWith(baseCourse);
  });

  it('TC-FE-CCARD-05 : Affiche le badge "Déjà inscrit" et le bouton "Accéder" pour un étudiant inscrit', async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();
    const enrolledCourse = { ...baseCourse, is_enrolled: true, enrollment_status: 'CONFIRMED' };

    render(<CourseCard course={enrolledCourse} onSelectCourse={handleSelect} onEnrollDirect={vi.fn()} />);

    expect(screen.getByText(/Déjà inscrit/i)).toBeInTheDocument();
    const accessBtn = screen.getByRole('button', { name: /Accéder/i });
    expect(accessBtn).toBeInTheDocument();

    await user.click(accessBtn);
    expect(handleSelect).toHaveBeenCalledWith(enrolledCourse);
  });

  it('TC-FE-CCARD-06 : Affiche "Régler" si le cours est en attente de paiement (status PENDING)', async () => {
    const pendingCourse = { ...baseCourse, enrollment_status: 'PENDING' };
    render(<CourseCard course={pendingCourse} onSelectCourse={vi.fn()} onEnrollDirect={vi.fn()} />);

    expect(screen.getByRole('button', { name: /Régler/i })).toBeInTheDocument();
  });

  it('TC-FE-CCARD-07 : Désactive le bouton avec "Complet" si aucune place n\'est disponible', () => {
    const fullCourse = { ...baseCourse, available_seats: 0, enrolled_count: 30, capacity: 30 };
    render(<CourseCard course={fullCourse} onSelectCourse={vi.fn()} onEnrollDirect={vi.fn()} />);

    const fullBtn = screen.getByRole('button', { name: /Complet/i });
    expect(fullBtn).toBeDisabled();
  });
});
