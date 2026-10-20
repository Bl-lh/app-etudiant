import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import CoursesPage from '../CoursesPage';

describe('Unit Tests - Page CoursesPage (Catalogue & Filtres)', () => {
  const mockCourses = [
    {
      id: 1,
      title: 'React 19 Avancé & Hooks',
      summary: 'Maîtrisez React moderne et composants temps réel.',
      instructor_name: 'Dr. Karim',
      category_name: 'Développement Web',
      category_slug: 'dev-web',
      category_id: 1,
      level: 'AVANCE',
      price: 850.00,
      enrolled_count: 25,
      capacity: 30,
      available_seats: 5,
      created_at: '2026-01-01'
    },
    {
      id: 2,
      title: 'Tests Logiciels ISTQB',
      summary: 'Processus et qualification logicielle conforme ISO 29119.',
      instructor_name: 'Prof. Alami',
      category_name: 'Tests Logiciels',
      category_slug: 'tests-logiciels',
      category_id: 2,
      level: 'DEBUTANT',
      price: 450.00,
      enrolled_count: 50,
      capacity: 50,
      available_seats: 0,
      created_at: '2026-02-01'
    },
    {
      id: 3,
      title: 'DevOps & Docker Kubernetes',
      summary: 'Conteneurisation et pipelines CI/CD.',
      instructor_name: 'Ing. Hassan',
      category_name: 'Cloud & DevOps',
      category_slug: 'cloud-devops',
      category_id: 3,
      level: 'INTERMEDIAIRE',
      price: 0.00,
      enrolled_count: 10,
      capacity: 20,
      available_seats: 10,
      created_at: '2026-03-01'
    }
  ];

  const mockCategories = [
    { id: 1, name: 'Développement Web', slug: 'dev-web', course_count: 1 },
    { id: 2, name: 'Tests Logiciels', slug: 'tests-logiciels', course_count: 1 },
    { id: 3, name: 'Cloud & DevOps', slug: 'cloud-devops', course_count: 1 }
  ];

  it('TC-FE-CPAGE-01 : Affiche le titre de la page et la liste complète des cours', () => {
    render(
      <CoursesPage
        courses={mockCourses}
        categories={mockCategories}
        onSelectCourse={vi.fn()}
        onEnrollDirect={vi.fn()}
      />
    );

    expect(screen.getByText('Catalogue des Formations & Inscriptions')).toBeInTheDocument();
    expect(screen.getByText('React 19 Avancé & Hooks')).toBeInTheDocument();
    expect(screen.getByText('Tests Logiciels ISTQB')).toBeInTheDocument();
    expect(screen.getByText('DevOps & Docker Kubernetes')).toBeInTheDocument();
  });

  it('TC-FE-CPAGE-02 : Filtre les cours en temps réel par mot-clé dans la barre de recherche', async () => {
    const user = userEvent.setup();
    render(
      <CoursesPage
        courses={mockCourses}
        categories={mockCategories}
        onSelectCourse={vi.fn()}
        onEnrollDirect={vi.fn()}
      />
    );

    const searchInput = screen.getByPlaceholderText(/Rechercher par titre/i);
    await user.type(searchInput, 'ISTQB');

    expect(screen.getByText('Tests Logiciels ISTQB')).toBeInTheDocument();
    expect(screen.queryByText('React 19 Avancé & Hooks')).toBeNull();
    expect(screen.queryByText('DevOps & Docker Kubernetes')).toBeNull();
  });

  it('TC-FE-CPAGE-03 : Filtre les cours par niveau de difficulté', async () => {
    const user = userEvent.setup();
    render(
      <CoursesPage
        courses={mockCourses}
        categories={mockCategories}
        onSelectCourse={vi.fn()}
        onEnrollDirect={vi.fn()}
      />
    );

    const selects = screen.getAllByRole('combobox');
    await user.selectOptions(selects[0], 'AVANCE');

    expect(screen.getByText('React 19 Avancé & Hooks')).toBeInTheDocument();
    expect(screen.queryByText('Tests Logiciels ISTQB')).toBeNull();
  });

  it('TC-FE-CPAGE-04 : Filtre par onglet de catégorie', async () => {
    const user = userEvent.setup();
    render(
      <CoursesPage
        courses={mockCourses}
        categories={mockCategories}
        onSelectCourse={vi.fn()}
        onEnrollDirect={vi.fn()}
      />
    );

    const categoryBtn = screen.getByRole('button', { name: /Cloud & DevOps/i });
    await user.click(categoryBtn);

    expect(screen.getByText('DevOps & Docker Kubernetes')).toBeInTheDocument();
    expect(screen.queryByText('React 19 Avancé & Hooks')).toBeNull();
  });

  it('TC-FE-CPAGE-05 : Affiche l\'état vide et réinitialise les filtres au clic sur le bouton', async () => {
    const user = userEvent.setup();
    render(
      <CoursesPage
        courses={mockCourses}
        categories={mockCategories}
        onSelectCourse={vi.fn()}
        onEnrollDirect={vi.fn()}
      />
    );

    const searchInput = screen.getByPlaceholderText(/Rechercher par titre/i);
    await user.type(searchInput, 'TermeInexistant12345');

    expect(screen.getByText('Aucun cours correspondant')).toBeInTheDocument();

    const resetBtn = screen.getByRole('button', { name: /Réinitialiser les filtres/i });
    await user.click(resetBtn);

    expect(screen.getByText('React 19 Avancé & Hooks')).toBeInTheDocument();
  });
});
