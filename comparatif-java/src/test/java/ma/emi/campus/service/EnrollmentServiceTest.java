package ma.emi.campus.service;

import ma.emi.campus.model.Course;
import ma.emi.campus.model.Enrollment;
import ma.emi.campus.repository.EnrollmentRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Tests Unitaires JUnit 5 + Mockito - Service d'Inscription (EnrollmentService)")
class EnrollmentServiceTest {

    @Mock
    private EnrollmentRepository repository;

    @Mock
    private PaymentGateway paymentGateway;

    @Spy
    private LuhnValidator luhnValidator = new LuhnValidator();

    @Spy
    private DiscountService discountService = new DiscountService();

    @InjectMocks
    private EnrollmentService enrollmentService;

    @Captor
    private ArgumentCaptor<Enrollment> enrollmentCaptor;

    @Test
    @DisplayName("Cas Nominal : Inscription réussie avec paiement carte et coupon valide")
    void shouldEnrollStudentSuccessfullyWithPaymentAndCoupon() {
        // GIVEN (Données & Configuration des Bouchons Mockito)
        Long userId = 101L;
        Long courseId = 5L;
        String validCard = "4532015112830366"; // Carte Visa valide Luhn
        String coupon = "BIENVENUE10";       // 10% sur 200 DH = 180 DH

        Course course = new Course(courseId, "Architecture Microservices", 200.0, 30, 10);

        when(repository.existsByUserIdAndCourseId(userId, courseId)).thenReturn(false);
        when(repository.findCourseById(courseId)).thenReturn(Optional.of(course));
        when(paymentGateway.processPayment(eq(userId), eq(180.0), eq(validCard)))
                .thenReturn(new PaymentGateway.PaymentResponse(true, "TX-VISA-8849", null));
        when(repository.save(any(Enrollment.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // WHEN (Appel de la méthode métier testée)
        Enrollment result = enrollmentService.enrollStudent(userId, courseId, validCard, coupon);

        // THEN (Vérifications des assertions métier et des interactions Mockito)
        assertThat(result).isNotNull();
        assertThat(result.getUserId()).isEqualTo(userId);
        assertThat(result.getCourseId()).isEqualTo(courseId);
        assertThat(result.getAmountPaid()).isEqualTo(180.0);
        assertThat(result.getStatus()).isEqualTo("ACTIVE");

        // Vérification Mockito : La méthode save a été appelée exactement une fois
        verify(repository, times(1)).save(enrollmentCaptor.capture());
        Enrollment captured = enrollmentCaptor.getValue();
        assertThat(captured.getAmountPaid()).isEqualTo(180.0);

        // Vérification de la mise à jour des places dans le repository
        verify(repository, times(1)).updateCourseEnrolledCount(courseId, 11);
    }

    @Test
    @DisplayName("Règle Anti-Doublon : Échec immédiat si l'étudiant est déjà inscrit (Pas d'appel bancaire)")
    void shouldFailWhenStudentIsAlreadyEnrolled() {
        Long userId = 101L;
        Long courseId = 5L;

        // Bouchonnage du repository signalant un doublon
        when(repository.existsByUserIdAndCourseId(userId, courseId)).thenReturn(true);

        // Déclenchement de l'exception
        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
            enrollmentService.enrollStudent(userId, courseId, "4532015112830366", null)
        );

        assertThat(ex.getMessage()).contains("déjà inscrit");

        // PREUVE MOCKITO : La passerelle de paiement et l'écriture en base N'ONT JAMAIS été appelées !
        verifyNoInteractions(paymentGateway);
        verify(repository, never()).save(any());
    }

    @Test
    @DisplayName("Règle Capacité : Échec si le cours est complet (Capacité atteinte)")
    void shouldFailWhenCourseIsFull() {
        Long userId = 102L;
        Long courseId = 8L;
        Course fullCourse = new Course(courseId, "Intelligence Artificielle", 300.0, 25, 25);

        when(repository.existsByUserIdAndCourseId(userId, courseId)).thenReturn(false);
        when(repository.findCourseById(courseId)).thenReturn(Optional.of(fullCourse));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
            enrollmentService.enrollStudent(userId, courseId, "4532015112830366", null)
        );

        assertThat(ex.getMessage()).contains("capacité maximale");
        verifyNoInteractions(paymentGateway);
    }

    @Test
    @DisplayName("Règle Transactionnelle : Rejet de l'inscription si la banque refuse le paiement")
    void shouldRollbackEnrollmentWhenPaymentFails() {
        Long userId = 103L;
        Long courseId = 9L;
        String validCard = "4532015112830366";
        Course course = new Course(courseId, "Sécurité des Systèmes", 400.0, 20, 5);

        when(repository.existsByUserIdAndCourseId(userId, courseId)).thenReturn(false);
        when(repository.findCourseById(courseId)).thenReturn(Optional.of(course));
        
        // Simulation d'un refus bancaire (Fonds insuffisants)
        when(paymentGateway.processPayment(eq(userId), eq(400.0), eq(validCard)))
                .thenReturn(new PaymentGateway.PaymentResponse(false, null, "Solde insuffisant"));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
            enrollmentService.enrollStudent(userId, courseId, validCard, null)
        );

        assertThat(ex.getMessage()).contains("Paiement rejeté");
        assertThat(ex.getMessage()).contains("Solde insuffisant");

        // Aucune écriture en base de données ne doit avoir eu lieu
        verify(repository, never()).save(any());
        verify(repository, never()).updateCourseEnrolledCount(anyLong(), anyInt());
    }

    @Test
    @DisplayName("Cas Cours Gratuit (0 MAD) : Inscription directe sans solliciter la passerelle bancaire")
    void shouldEnrollDirectlyForFreeCourse() {
        Long userId = 104L;
        Long courseId = 1L;
        Course freeCourse = new Course(courseId, "Introduction au Génie Logiciel", 0.0, 50, 10);

        when(repository.existsByUserIdAndCourseId(userId, courseId)).thenReturn(false);
        when(repository.findCourseById(courseId)).thenReturn(Optional.of(freeCourse));
        when(repository.save(any(Enrollment.class))).thenAnswer(i -> i.getArgument(0));

        Enrollment result = enrollmentService.enrollStudent(userId, courseId, null, null);

        assertThat(result.getAmountPaid()).isEqualTo(0.0);
        verifyNoInteractions(paymentGateway);
        verify(repository, times(1)).save(any(Enrollment.class));
    }

    @Test
    @DisplayName("Garde d'intégrité : Rejet si l'identifiant utilisateur ou cours est nul")
    void shouldThrowWhenUserIdOrCourseIdIsNull() {
        assertThrows(IllegalArgumentException.class, () ->
            enrollmentService.enrollStudent(null, 1L, "4532015112830366", null)
        );
        assertThrows(IllegalArgumentException.class, () ->
            enrollmentService.enrollStudent(101L, null, "4532015112830366", null)
        );
    }

    @Test
    @DisplayName("Garde d'intégrité : Rejet si le cours n'existe pas en base")
    void shouldThrowWhenCourseDoesNotExist() {
        when(repository.existsByUserIdAndCourseId(101L, 999L)).thenReturn(false);
        when(repository.findCourseById(999L)).thenReturn(Optional.empty());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
            enrollmentService.enrollStudent(101L, 999L, "4532015112830366", null)
        );
        assertThat(ex.getMessage()).contains("Cours introuvable");
    }

    @Test
    @DisplayName("Garde Monétique : Rejet si la carte est absente ou invalide pour un cours payant")
    void shouldThrowWhenCardIsInvalidForPaidCourse() {
        Course paidCourse = new Course(12L, "DevOps Avancé", 250.0, 30, 5);
        when(repository.existsByUserIdAndCourseId(105L, 12L)).thenReturn(false);
        when(repository.findCourseById(12L)).thenReturn(Optional.of(paidCourse));

        // Carte nulle
        assertThrows(IllegalArgumentException.class, () ->
            enrollmentService.enrollStudent(105L, 12L, null, null)
        );

        // Carte échouant le contrôle Luhn
        assertThrows(IllegalArgumentException.class, () ->
            enrollmentService.enrollStudent(105L, 12L, "1234567890123456", null)
        );
    }
}
