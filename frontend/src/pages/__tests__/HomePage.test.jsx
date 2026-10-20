import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import HomePage from '../HomePage';

describe('Unit Tests - Page HomePage', () => {
  const mockCourses = [
    {
      id: 1,
      title: 'Formation Playwright Pro',
      summary: 'Tests end-to-end automatisés.',
      instructor_name: 'Dr. Karim Alami',
      category_name: 'Tests Logiciels',
      level: 'INTERMEDIAIRE',
      duration_hours: 30,
      enrolled_count: 12,
      capacity: 25,
      price: 500.00
    },
    {
      id: 2,
      title: 'React 19 & Vitest',
      summary: 'Frontend moderne avec tests unitaires.',
      instructor_name: 'Prof. Hassan',
      category_name: 'Développement Web',
      level: 'DEBUTANT',
      duration_hours: 20,
      enrolled_count: 5,
      capacity: 30,
      price: 0.00
    }
  ];

  it('TC-FE-HPAGE-01 : Affiche le titre principal Hero et le badge du projet académique', () => {
    render(
      <HomePage
        courses={mockCourses}
        setTab={vi.fn()}
        onSelectCourse={vi.fn()}
        onEnrollDirect={vi.fn()}
      />
    );

    expect(screen.getByText(/PROCESSUS COMPLET DES TESTS LOGICIELS/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Inscrivez-vous aux Cours en Ligne/i);
    expect(screen.getByText('Formation Playwright Pro')).toBeInTheDocument();
  });

  it('TC-FE-HPAGE-02 : Déclenche setTab(\'courses\') au clic sur Explorer le Catalogue', async () => {
    const user = userEvent.setup();
    const handleSetTab = vi.fn();

    render(
      <HomePage
        courses={mockCourses}
        setTab={handleSetTab}
        onSelectCourse={vi.fn()}
        onEnrollDirect={vi.fn()}
      />
    );

    const catalogBtn = screen.getByRole('button', { name: /Explorer le Catalogue de Cours/i });
    await user.click(catalogBtn);

    expect(handleSetTab).toHaveBeenCalledWith('courses');
  });

  it('TC-FE-HPAGE-03 : Déclenche setTab(\'qa\') au clic sur Centre QA', async () => {
    const user = userEvent.setup();
    const handleSetTab = vi.fn();

    render(
      <HomePage
        courses={mockCourses}
        setTab={handleSetTab}
        onSelectCourse={vi.fn()}
        onEnrollDirect={vi.fn()}
      />
    );

    const qaBtn = screen.getByRole('button', { name: /Centre QA/i });
    await user.click(qaBtn);

    expect(handleSetTab).toHaveBeenCalledWith('qa');
  });
});
