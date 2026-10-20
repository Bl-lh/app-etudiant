/**
 * Tests Unitaires : Algorithme de Luhn et Validation des Cartes Bancaires
 * Processus de Qualification Logicielle - Tests Unitaires & Analyse aux Limites
 */

const {
  validateLuhn,
  detectCardType,
  validateExpiryDate,
  validateCVV,
  validateCardHolder,
  maskCardNumber,
  validatePaymentCard
} = require('../../src/utils/luhnValidator');

describe('Suite de Tests Unitaires : Validation des Cartes Bancaires (Luhn & PCI-DSS)', () => {

  describe('1. Algorithme de Luhn (validateLuhn)', () => {
    test('TC-LUHN-01 : Carte Visa de test standard valide (4242 4242 4242 4242)', () => {
      expect(validateLuhn('4242424242424242')).toBe(true);
      expect(validateLuhn('4242 4242 4242 4242')).toBe(true);
    });

    test('TC-LUHN-02 : Carte Mastercard valide (5555 5555 5555 4444)', () => {
      expect(validateLuhn('5555555555554444')).toBe(true);
    });

    test('TC-LUHN-03 : Carte corrompue (somme de contrôle Luhn erronée)', () => {
      expect(validateLuhn('4242424242424243')).toBe(false);
      expect(validateLuhn('4242424242424241')).toBe(false);
    });

    test('TC-LUHN-04 [Limites] : Longueur inférieure au seuil minimal (< 13 chiffres)', () => {
      expect(validateLuhn('42424242')).toBe(false);
      expect(validateLuhn('')).toBe(false);
      expect(validateLuhn(null)).toBe(false);
      expect(validateLuhn(undefined)).toBe(false);
    });

    test('TC-LUHN-05 [Robustesse] : Chaîne contenant des caractères non numériques', () => {
      // Nettoyé des caractères non-numériques
      expect(validateLuhn('4242-4242-4242-4242')).toBe(true);
      expect(validateLuhn('abc-invalid-card')).toBe(false);
    });
  });

  describe('2. Détection du Réseau Bancaire (detectCardType)', () => {
    test('TC-TYPE-01 : Détecte correctement les cartes VISA (commençant par 4)', () => {
      expect(detectCardType('4242424242424242')).toBe('VISA');
      expect(detectCardType('4000123456789010')).toBe('VISA');
    });

    test('TC-TYPE-02 : Détecte correctement les cartes MASTERCARD (51-55)', () => {
      expect(detectCardType('5100000000000000')).toBe('MASTERCARD');
      expect(detectCardType('5555555555554444')).toBe('MASTERCARD');
    });

    test('TC-TYPE-03 : Détecte correctement les cartes AMEX (34, 37)', () => {
      expect(detectCardType('340000000000000')).toBe('AMEX');
      expect(detectCardType('370000000000000')).toBe('AMEX');
    });

    test('TC-TYPE-04 : Retourne UNKNOWN pour un préfixe inconnu', () => {
      expect(detectCardType('9999000000000000')).toBe('UNKNOWN');
      expect(detectCardType('')).toBe('UNKNOWN');
    });
  });

  describe('3. Validation de la Date d\'Expiration (validateExpiryDate)', () => {
    // On fige la date de référence au 15 Juin 2026
    const fixedReferenceDate = new Date(2026, 5, 15); // Juin 2026

    test('TC-DATE-01 : Carte valide dans le futur (12/2027)', () => {
      expect(validateExpiryDate(12, 2027, fixedReferenceDate)).toBe(true);
      expect(validateExpiryDate('12', '27', fixedReferenceDate)).toBe(true);
    });

    test('TC-DATE-02 [Valeur Frontière] : Carte expirant au cours du mois courant (06/2026)', () => {
      expect(validateExpiryDate(6, 2026, fixedReferenceDate)).toBe(true);
    });

    test('TC-DATE-03 : Carte expirée le mois précédent (05/2026)', () => {
      expect(validateExpiryDate(5, 2026, fixedReferenceDate)).toBe(false);
    });

    test('TC-DATE-04 : Carte expirée une année passée (10/2024)', () => {
      expect(validateExpiryDate(10, 2024, fixedReferenceDate)).toBe(false);
      expect(validateExpiryDate(10, 24, fixedReferenceDate)).toBe(false);
    });

    test('TC-DATE-05 [Cas Limites] : Mois invalide (< 1 ou > 12) ou date aberrante', () => {
      expect(validateExpiryDate(0, 2027, fixedReferenceDate)).toBe(false);
      expect(validateExpiryDate(13, 2027, fixedReferenceDate)).toBe(false);
      expect(validateExpiryDate('invalid', 'year', fixedReferenceDate)).toBe(false);
      // Validité à plus de 15 ans rejetée
      expect(validateExpiryDate(1, 2050, fixedReferenceDate)).toBe(false);
    });
  });

  describe('4. Validation du Code de Sécurité CVV (validateCVV)', () => {
    test('TC-CVV-01 : CVV Visa / Mastercard valide (3 chiffres)', () => {
      expect(validateCVV('123', 'VISA')).toBe(true);
      expect(validateCVV('999', 'MASTERCARD')).toBe(true);
    });

    test('TC-CVV-02 : CVV Amex valide (4 chiffres)', () => {
      expect(validateCVV('1234', 'AMEX')).toBe(true);
      expect(validateCVV('123', 'AMEX')).toBe(false);
    });

    test('TC-CVV-03 [Robustesse] : Format incorrect (alphanumérique, trop court, trop long)', () => {
      expect(validateCVV('12', 'VISA')).toBe(false);
      expect(validateCVV('1234', 'VISA')).toBe(false);
      expect(validateCVV('abc', 'VISA')).toBe(false);
      expect(validateCVV('', 'VISA')).toBe(false);
      expect(validateCVV(null, 'VISA')).toBe(false);
    });
  });

  describe('5. Validation du Titulaire et Masquage (validateCardHolder & maskCardNumber)', () => {
    test('TC-HOLD-01 : Nom de titulaire valide', () => {
      expect(validateCardHolder('Bilal Mansouri')).toBe(true);
      expect(validateCardHolder('Prof. Karim Alami')).toBe(false); // Point non autorisé
      expect(validateCardHolder('Jean-Pierre Dupont')).toBe(true);
    });

    test('TC-HOLD-02 : Nom trop court (< 3 caractères)', () => {
      expect(validateCardHolder('AB')).toBe(false);
      expect(validateCardHolder('')).toBe(false);
    });

    test('TC-MASK-01 : Masquage sécurisé PCI-DSS', () => {
      expect(maskCardNumber('4242424242424242')).toBe('**** **** **** 4242');
      expect(maskCardNumber('5555 5555 5555 1234')).toBe('**** **** **** 1234');
    });
  });

  describe('6. Validation Complète de la Carte (validatePaymentCard)', () => {
    test('TC-AGG-01 : Formulaire de carte entièrement valide', () => {
      const result = validatePaymentCard({
        cardNumber: '4242 4242 4242 4242',
        cardHolder: 'Bilal Mansouri',
        expiryMonth: '12',
        expiryYear: '2028',
        cvv: '345'
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.cardType).toBe('VISA');
      expect(result.maskedNumber).toBe('**** **** **** 4242');
    });

    test('TC-AGG-02 : Formulaire avec erreurs multiples', () => {
      const result = validatePaymentCard({
        cardNumber: '4242424242424241', // Échec Luhn
        cardHolder: 'X',                 // Trop court
        expiryMonth: '13',               // Mois invalide
        expiryYear: '2020',              // Expiré
        cvv: 'ab'                        // Non numérique
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(4);
    });
  });
});
