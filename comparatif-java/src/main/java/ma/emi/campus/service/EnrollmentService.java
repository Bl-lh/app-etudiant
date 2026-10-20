package ma.emi.campus.service;

import ma.emi.campus.model.Course;
import ma.emi.campus.model.Enrollment;
import ma.emi.campus.repository.EnrollmentRepository;

import java.time.LocalDateTime;

/**
 * Service métier d'inscription aux cours.
 * Illustre parfaitement le pattern Injection de Dépendances
 * propice aux tests unitaires isolés avec Mockito.
 */
public class EnrollmentService {

    private final EnrollmentRepository repository;
    private final PaymentGateway paymentGateway;
    private final LuhnValidator luhnValidator;
    private final DiscountService discountService;

    public EnrollmentService(EnrollmentRepository repository,
                             PaymentGateway paymentGateway,
                             LuhnValidator luhnValidator,
                             DiscountService discountService) {
        this.repository = repository;
        this.paymentGateway = paymentGateway;
        this.luhnValidator = luhnValidator;
        this.discountService = discountService;
    }

    /**
     * Traite l'inscription d'un étudiant à un cours avec gestion du paiement.
     */
    public Enrollment enrollStudent(Long userId, Long courseId, String cardNumber, String couponCode) {
        if (userId == null || courseId == null) {
            throw new IllegalArgumentException("Identifiants utilisateur et cours obligatoires");
        }

        // Règle 1 : Unicité de l'inscription (anti-doublon)
        if (repository.existsByUserIdAndCourseId(userId, courseId)) {
            throw new IllegalStateException("L'étudiant est déjà inscrit à ce cours.");
        }

        // Règle 2 : Existence du cours
        Course course = repository.findCourseById(courseId)
                .orElseThrow(() -> new IllegalArgumentException("Cours introuvable avec l'ID : " + courseId));

        // Règle 3 : Capacité maximale
        if (course.isFull()) {
            throw new IllegalStateException("Ce cours a atteint sa capacité maximale d'inscriptions.");
        }

        double finalPrice = course.getPrice();

        // Règle 4 : Gestion du paiement si cours payant
        if (finalPrice > 0) {
            // Validation de la carte bancaire via Luhn
            if (cardNumber == null || !luhnValidator.validateCardNumber(cardNumber)) {
                throw new IllegalArgumentException("Numéro de carte bancaire invalide (Contrôle Luhn échoué).");
            }

            // Calcul éventuel de remise
            if (couponCode != null && !couponCode.trim().isEmpty()) {
                finalPrice = discountService.applyDiscount(finalPrice, couponCode);
            }

            // Débit bancaire via la passerelle de paiement
            PaymentGateway.PaymentResponse paymentResponse = paymentGateway.processPayment(userId, finalPrice, cardNumber);
            if (!paymentResponse.isSuccess()) {
                throw new IllegalStateException("Paiement rejeté par l'organisme bancaire : " + paymentResponse.getErrorMessage());
            }
        }

        // Règle 5 : Persistance et mise à jour des places
        Enrollment newEnrollment = new Enrollment(
                null,
                userId,
                courseId,
                "ACTIVE",
                finalPrice,
                LocalDateTime.now()
        );

        Enrollment saved = repository.save(newEnrollment);
        course.incrementEnrolled();
        repository.updateCourseEnrolledCount(courseId, course.getEnrolledCount());

        return saved;
    }
}
