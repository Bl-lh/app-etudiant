package ma.emi.campus.repository;

import ma.emi.campus.model.Course;
import ma.emi.campus.model.Enrollment;

import java.util.Optional;

/**
 * Interface DAO d'accès aux données.
 * Dans les tests unitaires avec Mockito, cette interface est bouchonnée (Mockée)
 * pour éviter toute dépendance vers une base MySQL réelle.
 */
public interface EnrollmentRepository {
    boolean existsByUserIdAndCourseId(Long userId, Long courseId);
    Optional<Course> findCourseById(Long courseId);
    Enrollment save(Enrollment enrollment);
    void updateCourseEnrolledCount(Long courseId, int newCount);
}
