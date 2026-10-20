import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';

import HomePage from './pages/HomePage';
import CoursesPage from './pages/CoursesPage';
import CourseDetailPage from './pages/CourseDetailPage';
import CheckoutPage from './pages/CheckoutPage';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import QACenterPage from './pages/QACenterPage';

import api from './services/api';

function MainApp() {
  const { user, isAuthenticated, isAdmin } = useAuth();

  const [currentTab, setTab] = useState('home');
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [checkoutData, setCheckoutData] = useState(null);
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [authSuccessCallback, setAuthSuccessCallback] = useState(null);

  // Chargement des cours et catégories
  const refreshCatalog = async () => {
    try {
      const [coursesRes, catRes] = await Promise.all([
        api.getCourses(),
        api.getCategories()
      ]);
      if (coursesRes.success) setCourses(coursesRes.data);
      if (catRes.success) setCategories(catRes.data);
    } catch (err) {
      console.error('Erreur chargement catalogue:', err);
    }
  };

  useEffect(() => {
    refreshCatalog();
  }, [user]);

  // Action : Voir le détail d'un cours
  const handleSelectCourse = (course) => {
    setSelectedCourseId(course.id);
    setTab('course-detail');
  };

  // Action : Inscription directe
  const handleEnrollDirect = async (course) => {
    if (!isAuthenticated) {
      setAuthSuccessCallback(() => () => handleEnrollDirect(course));
      setAuthModalOpen(true);
      return;
    }

    try {
      const res = await api.enroll(course.id);

      if (res.success) {
        if (res.requiresPayment) {
          // Redirection vers le paiement
          setCheckoutData({
            course,
            enrollmentId: res.enrollmentId
          });
          setTab('checkout');
        } else {
          // Cours gratuit validé immédiatement
          alert('Félicitations ! Vous êtes inscrit au cours gratuit.');
          refreshCatalog();
          setTab('dashboard');
        }
      }
    } catch (err) {
      alert(err.message || 'Échec de l\'inscription au cours.');
    }
  };

  // Reprendre un paiement en attente depuis l'espace étudiant
  const handleResumeCheckout = (enrollment) => {
    setCheckoutData({
      course: {
        id: enrollment.course_id,
        title: enrollment.course_title,
        price: enrollment.course_price,
        image_url: enrollment.image_url,
        instructor_name: enrollment.instructor_name,
        duration_hours: 20
      },
      enrollmentId: enrollment.id
    });
    setTab('checkout');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Barre de navigation */}
      <Navbar
        onOpenAuth={() => setAuthModalOpen(true)}
        currentTab={currentTab}
        setTab={setTab}
      />

      {/* Contenu principal selon l'onglet actif */}
      <main className="app-container" style={{ flexGrow: 1 }}>
        {currentTab === 'home' && (
          <HomePage
            courses={courses}
            setTab={setTab}
            onSelectCourse={handleSelectCourse}
            onEnrollDirect={handleEnrollDirect}
          />
        )}

        {currentTab === 'courses' && (
          <CoursesPage
            courses={courses}
            categories={categories}
            onSelectCourse={handleSelectCourse}
            onEnrollDirect={handleEnrollDirect}
          />
        )}

        {currentTab === 'course-detail' && (
          <CourseDetailPage
            courseId={selectedCourseId}
            onBack={() => setTab('courses')}
            onEnroll={handleEnrollDirect}
          />
        )}

        {currentTab === 'checkout' && checkoutData && (
          <CheckoutPage
            course={checkoutData.course}
            enrollmentId={checkoutData.enrollmentId}
            onBack={() => setTab('courses')}
            onComplete={() => {
              refreshCatalog();
              setTab('dashboard');
            }}
          />
        )}

        {currentTab === 'dashboard' && (
          <StudentDashboard
            onSelectCourse={handleSelectCourse}
            onResumeCheckout={handleResumeCheckout}
          />
        )}

        {currentTab === 'admin' && isAdmin && (
          <AdminDashboard />
        )}

        {currentTab === 'qa' && (
          <QACenterPage />
        )}
      </main>

      {/* Pied de page */}
      <Footer setTab={setTab} />

      {/* Modal d'Authentification */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => {
          if (authSuccessCallback) {
            authSuccessCallback();
            setAuthSuccessCallback(null);
          }
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
