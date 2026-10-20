package ma.emi.campus.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

@DisplayName("Tests Unitaires JUnit 5 - Règles Commerciales (DiscountService)")
class DiscountServiceTest {

    private DiscountService discountService;

    @BeforeEach
    void setUp() {
        discountService = new DiscountService();
    }

    @ParameterizedTest(name = "Montant initial {0} MAD avec coupon {1} => Attendu {2} MAD")
    @CsvSource({
        "200.0, BIENVENUE10, 180.0",  // 10% sur 200 DH
        "300.0, TECH20, 240.0",        // 20% sur 300 DH
        "600.0, CAMPUS50, 300.0"       // 50% sur 600 DH
    })
    @DisplayName("Devrait appliquer le pourcentage de réduction nominal")
    void shouldApplyNominalDiscounts(double initialAmount, String coupon, double expectedFinal) {
        double result = discountService.applyDiscount(initialAmount, coupon);
        assertThat(result).isEqualTo(expectedFinal);
    }

    @Test
    @DisplayName("Devrait retourner le montant initial si aucun code promo n'est fourni")
    void shouldReturnOriginalAmountWhenNoCoupon() {
        assertThat(discountService.applyDiscount(250.0, null)).isEqualTo(250.0);
        assertThat(discountService.applyDiscount(250.0, "   ")).isEqualTo(250.0);
    }

    @Test
    @DisplayName("Devrait lever une exception si le montant minimal du coupon n'est pas atteint (Seuil limite)")
    void shouldThrowExceptionWhenMinimumAmountNotMet() {
        // CAMPUS50 requiert au moins 500 DH. Test avec 499 DH.
        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
            discountService.applyDiscount(499.0, "CAMPUS50")
        );
        assertThat(ex.getMessage()).contains("exige un montant minimal de 500");
    }

    @Test
    @DisplayName("Devrait lever une exception si le code promo est inconnu")
    void shouldThrowExceptionForInvalidCoupon() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
            discountService.applyDiscount(500.0, "FAUX_CODE_99")
        );
        assertThat(ex.getMessage()).contains("Code promo invalide");
    }

    @Test
    @DisplayName("Devrait rejeter les montants initiaux négatifs ou nuls")
    void shouldRejectZeroOrNegativeInitialAmounts() {
        assertThrows(IllegalArgumentException.class, () ->
            discountService.applyDiscount(0.0, "BIENVENUE10")
        );
        assertThrows(IllegalArgumentException.class, () ->
            discountService.applyDiscount(-50.0, "BIENVENUE10")
        );
    }

    @ParameterizedTest(name = "BVA Boundary Test : Seuil exact pour coupon {0} avec montant {1} MAD")
    @CsvSource({
        "BIENVENUE10, 100.0, 90.0",   // Seuil exact 100 MAD : 100 - (100 * 0.10) = 90.0
        "TECH20, 250.0, 200.0",        // Seuil exact 250 MAD : 250 - (250 * 0.20) = 200.0
        "CAMPUS50, 500.0, 250.0"       // Seuil exact 500 MAD : 500 - (500 * 0.50) = 250.0
    })
    @DisplayName("BVA Boundary Test : Le coupon doit être accepté au seuil frontière minimal exact")
    void shouldAcceptCouponExactlyAtMinimumThreshold(String coupon, double amount, double expectedFinal) {
        double result = discountService.applyDiscount(amount, coupon);
        assertThat(result)
            .describedAs("Le mutant frontière (< vers <=) doit être immédiatement abattu au seuil exact")
            .isEqualTo(expectedFinal);
    }

    @Test
    @DisplayName("Devrait valider correctement les codes coupons actifs et inactifs")
    void shouldValidateCouponCodesProperly() {
        assertThat(discountService.isValidCoupon("BIENVENUE10")).isTrue();
        assertThat(discountService.isValidCoupon("tech20")).isTrue();
        assertThat(discountService.isValidCoupon("CAMPUS50")).isTrue();
        assertThat(discountService.isValidCoupon("INCONNU")).isFalse();
        assertThat(discountService.isValidCoupon(null)).isFalse();
        assertThat(discountService.isValidCoupon("")).isFalse();
    }

    @Test
    @DisplayName("Devrait valider les accesseurs de CouponRule")
    void shouldValidateCouponRuleProperties() {
        DiscountService.CouponRule rule = new DiscountService.CouponRule(0.15, 150.0);
        assertThat(rule.getPercentage()).isEqualTo(0.15);
        assertThat(rule.getMinAmount()).isEqualTo(150.0);
    }
}
