import React, { useState } from 'react';
import { Search, Filter, BookOpen, Layers } from 'lucide-react';
import CourseCard from '../components/CourseCard';

export default function CoursesPage({ courses, categories, onSelectCourse, onEnrollDirect }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.instructor_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      !selectedCategory ||
      course.category_slug === selectedCategory ||
      course.category_id === parseInt(selectedCategory, 10);

    const matchesLevel = !selectedLevel || course.level === selectedLevel;

    return matchesSearch && matchesCategory && matchesLevel;
  }).sort((a, b) => {
    if (sortBy === 'price_asc') return parseFloat(a.price) - parseFloat(b.price);
    if (sortBy === 'price_desc') return parseFloat(b.price) - parseFloat(a.price);
    if (sortBy === 'popularity') return b.enrolled_count - a.enrolled_count;
    return new Date(b.created_at) - new Date(a.created_at);
  });

  return (
    <div style={{ padding: '20px 0 80px 0' }}>
      {/* En-tête */}
      <div style={{ marginBottom: 36 }}>
        <h1 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: 8 }}>
          Catalogue des Formations & Inscriptions
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>
          Explorez nos programmes d'ingénierie logicielle et réservez votre place en ligne.
        </p>
      </div>

      {/* Barre d'Outils et Filtres */}
      <div className="glass-panel" style={{ padding: 20, marginBottom: 36 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Recherche Textuelle */}
          <div style={{ position: 'relative', flex: '1 1 300px' }}>
            <Search
              size={18}
              color="var(--text-dim)"
              style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              placeholder="Rechercher par titre, mot-clé, instructeur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ paddingLeft: 42 }}
            />
          </div>

          {/* Filtre Niveau */}
          <div style={{ width: 170 }}>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="form-select"
            >
              <option value="">Tous les niveaux</option>
              <option value="DEBUTANT">Débutant</option>
              <option value="INTERMEDIAIRE">Intermédiaire</option>
              <option value="AVANCE">Avancé</option>
            </select>
          </div>

          {/* Tri */}
          <div style={{ width: 190 }}>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="form-select"
            >
              <option value="recent">Plus récents</option>
              <option value="popularity">Popularité</option>
              <option value="price_asc">Prix croissant</option>
              <option value="price_desc">Prix décroissant</option>
            </select>
          </div>
        </div>

        {/* Filtres par Onglets Catégories */}
        <div style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          marginTop: 16,
          paddingTop: 16,
          borderTop: '1px solid var(--border-subtle)'
        }}>
          <button
            onClick={() => setSelectedCategory('')}
            className={`btn btn-sm ${!selectedCategory ? 'btn-primary' : 'btn-outline'}`}
            style={{ borderRadius: 9999, fontSize: '0.82rem' }}
          >
            Toutes les Catégories ({courses.length})
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.slug)}
              className={`btn btn-sm ${selectedCategory === cat.slug ? 'btn-primary' : 'btn-outline'}`}
              style={{ borderRadius: 9999, fontSize: '0.82rem' }}
            >
              {cat.name} ({cat.course_count || 0})
            </button>
          ))}
        </div>
      </div>

      {/* Grille des Cours */}
      {filteredCourses.length > 0 ? (
        <div className="grid-cols-3">
          {filteredCourses.map((c) => (
            <CourseCard
              key={c.id}
              course={c}
              onSelectCourse={onSelectCourse}
              onEnrollDirect={onEnrollDirect}
            />
          ))}
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <BookOpen size={48} color="var(--text-dim)" style={{ marginBottom: 16 }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 8 }}>Aucun cours correspondant</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>
            Aucun résultat pour les critères de recherche et filtres sélectionnés.
          </p>
          <button
            onClick={() => { setSearchTerm(''); setSelectedCategory(''); setSelectedLevel(''); }}
            className="btn btn-outline btn-sm"
          >
            Réinitialiser les filtres
          </button>
        </div>
      )}
    </div>
  );
}
