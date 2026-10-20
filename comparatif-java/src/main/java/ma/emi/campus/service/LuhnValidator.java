package ma.emi.campus.service;

/**
 * Validation d'intégrité de carte bancaire par l'Algorithme de Luhn (Modulo 10).
 * Implémentation identique à la logique Node.js src/utils/luhnValidator.js.
 */
public class LuhnValidator {

    /**
     * Valide le numéro de carte bancaire via l'algorithme de Luhn.
     * @param cardNumber Numéro de carte sous forme de chaîne (espaces acceptés)
     * @return true si la carte respecte la somme de contrôle Luhn, false sinon
     */
    public boolean validateCardNumber(String cardNumber) {
        if (cardNumber == null) {
            return false;
        }

        String cleaned = cardNumber.replaceAll("[\\s-]", "");
        if (!cleaned.matches("^\\d{13,19}$")) {
            return false;
        }

        int sum = 0;
        boolean shouldDouble = false;

        for (int i = cleaned.length() - 1; i >= 0; i--) {
            int digit = Character.getNumericValue(cleaned.charAt(i));

            if (shouldDouble) {
                digit *= 2;
                if (digit > 9) {
                    digit -= 9;
                }
            }

            sum += digit;
            shouldDouble = !shouldDouble;
        }

        return (sum % 10 == 0);
    }

    /**
     * Identifie le réseau monétique de la carte.
     * @param cardNumber Numéro de carte
     * @return "VISA", "MASTERCARD", "AMEX" ou "UNKNOWN"
     */
    public String detectCardNetwork(String cardNumber) {
        if (cardNumber == null) {
            return "UNKNOWN";
        }
        String cleaned = cardNumber.replaceAll("[\\s-]", "");
        if (cleaned.startsWith("4")) {
            return "VISA";
        } else if (cleaned.matches("^5[1-5].*")) {
            return "MASTERCARD";
        } else if (cleaned.matches("^3[47].*")) {
            return "AMEX";
        }
        return "UNKNOWN";
    }
}
