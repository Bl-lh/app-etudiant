package ma.emi.campus.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("Tests Unitaires JUnit 5 - Réponse Passerelle de Paiement (PaymentGateway)")
class PaymentGatewayTest {

    @Test
    @DisplayName("Devrait instancier et exposer les attributs d'une transaction réussie")
    void shouldExposeSuccessfulTransactionAttributes() {
        PaymentGateway.PaymentResponse response = new PaymentGateway.PaymentResponse(
                true,
                "TX-SUCCESS-9912",
                null
        );

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getTransactionId()).isEqualTo("TX-SUCCESS-9912");
        assertThat(response.getErrorMessage()).isNull();
    }

    @Test
    @DisplayName("Devrait instancier et exposer les attributs d'une transaction échouée")
    void shouldExposeFailedTransactionAttributes() {
        PaymentGateway.PaymentResponse response = new PaymentGateway.PaymentResponse(
                false,
                null,
                "Fonds insuffisants"
        );

        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getTransactionId()).isNull();
        assertThat(response.getErrorMessage()).isEqualTo("Fonds insuffisants");
    }
}
