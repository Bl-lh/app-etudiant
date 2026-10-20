package ma.emi.campus.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Tests Unitaires JUnit 5 - Algorithme de Luhn (LuhnValidator)")
class LuhnValidatorTest {

    private LuhnValidator validator;

    @BeforeEach
    void setUp() {
        validator = new LuhnValidator();
    }

    @Test
    @DisplayName("Devrait valider les cartes de test standard conformes à Luhn")
    void shouldValidateStandardCreditCards() {
        assertAll("Vérification cartes valides",
            () -> assertTrue(validator.validateCardNumber("4532015112830366"), "Visa valide"),
            () -> assertTrue(validator.validateCardNumber("5425233430109903"), "Mastercard valide"),
            () -> assertTrue(validator.validateCardNumber("378282246310005"), "Amex valide"),
            () -> assertTrue(validator.validateCardNumber("4532 0151 1283 0366"), "Visa avec espaces"),
            () -> assertTrue(validator.validateCardNumber("4532-0151-1283-0366"), "Visa avec tirets")
        );
    }

    @Test
    @DisplayName("Devrait détecter le réseau même avec des espaces ou tirets")
    void shouldDetectNetworkWithSpacesOrDashes() {
        assertThat(validator.detectCardNetwork("4532 0151 1283 0366")).isEqualTo("VISA");
        assertThat(validator.detectCardNetwork("5425-2334-3010-9903")).isEqualTo("MASTERCARD");
    }

    @ParameterizedTest(name = "Carte invalide [{index}] : {0}")
    @ValueSource(strings = {
        "4532015112830367", // Dernier chiffre erroné
        "1234567890123456", // Somme de contrôle invalide
        "4532",             // Longueur trop courte (< 13)
        "abc1234567890123", // Caractères non numériques
        ""                  // Chaîne vide
    })
    @DisplayName("Devrait rejeter les numéros non conformes ou corrompus")
    void shouldRejectInvalidCardNumbers(String invalidCard) {
        assertFalse(validator.validateCardNumber(invalidCard));
    }

    @Test
    @DisplayName("Devrait gérer gracieusement la valeur nulle")
    void shouldHandleNullCardNumber() {
        assertFalse(validator.validateCardNumber(null));
        assertThat(validator.detectCardNetwork(null)).isEqualTo("UNKNOWN");
    }

    @ParameterizedTest(name = "Réseau pour {0} => {1}")
    @CsvSource({
        "4532015112830366, VISA",
        "5425233430109903, MASTERCARD",
        "378282246310005, AMEX",
        "6011000000000000, UNKNOWN"
    })
    @DisplayName("Devrait détecter le réseau monétique adéquat")
    void shouldDetectCardNetwork(String cardNumber, String expectedNetwork) {
        assertThat(validator.detectCardNetwork(cardNumber)).isEqualTo(expectedNetwork);
    }
}
