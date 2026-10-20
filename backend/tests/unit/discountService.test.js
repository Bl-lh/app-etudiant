/**
 * Tests Unitaires : Calculs des Remises et Vérification des Bons de Réduction
 * Couvre : Partitionnement d'équivalence (EP) et Analyse de Valeurs Limites (BVA)
 */

const {
  roundCurrency,
  calculateDiscount,
  verifyCouponEligibility
} = require('../../src/services/discountService');

describe('Suite de Tests Unitaires : Moteur de Calcul des Prix & Remises', () => {

  describe('1. Arrondi Monétaire (roundCurrency)', () => {
    test('TC-RND-01 : Arrondi standard au centime', () => {
      expect(roundCurrency(99.804)).toBe(99.80);
      expect(roundCurrency(99.806)).toBe(99.81);
      expect(roundCurrency(100)).toBe(100.00);
    });
  });

  describe('2. Calcul des Remises (calculateDiscount)', () => {
    test('TC-DISC-01 [Cas Nominal] : Remise 20% sur un cours à 499 DH', () => {
      const result = calculateDiscount(499, 20);
      expect(result.originalPrice).toBe(499);
      expect(result.discountPercent).toBe(20);
      expect(result.discountAmount).toBe(99.80);
      expect(result.finalPrice).toBe(399.20);
    });

    test('TC-DISC-02 [Cas Nominal] : Remise 50% sur un cours à 650 DH', () => {
      const result = calculateDiscount(650, 50);
      expect(result.discountAmount).toBe(325.00);
      expect(result.finalPrice).toBe(325.00);
    });

    test('TC-DISC-03 [Valeur Limite] : Remise de 0% (Aucune réduction)', () => {
      const result = calculateDiscount(499, 0);
      expect(result.discountAmount).toBe(0.00);
      expect(result.finalPrice).toBe(499.00);
    });

    test('TC-DISC-04 [Valeur Limite] : Remise de 100% (Cours rendu entièrement gratuit)', () => {
      const result = calculateDiscount(499, 100);
      expect(result.discountAmount).toBe(499.00);
      expect(result.finalPrice).toBe(0.00);
    });

    test('TC-DISC-05 [Valeur Limite] : Cours initialement gratuit (Prix = 0 DH)', () => {
      const result = calculateDiscount(0, 20);
      expect(result.originalPrice).toBe(0.00);
      expect(result.discountAmount).toBe(0.00);
      expect(result.finalPrice).toBe(0.00);
    });

    test('TC-DISC-06 [Anomalie & Robustesse] : Prix négatif ou pourcentage hors bornes', () => {
      expect(() => calculateDiscount(-100, 20)).toThrow('Le montant initial doit être un nombre positif ou nul.');
      expect(() => calculateDiscount(499, -5)).toThrow('Le pourcentage de remise doit être compris entre 0 et 100.');
      expect(() => calculateDiscount(499, 105)).toThrow('Le pourcentage de remise doit être compris entre 0 et 100.');
    });
  });

  describe('3. Vérification d\'Éligibilité des Coupons (verifyCouponEligibility)', () => {
    const fixedNow = new Date('2026-06-15T12:00:00Z');

    test('TC-COUP-01 : Coupon valide actif et date future', () => {
      const validCoupon = {
        code: 'ETUDIANT20',
        is_active: 1,
        valid_until: '2026-12-31',
        max_uses: 100,
        current_uses: 10
      };

      const result = verifyCouponEligibility(validCoupon, fixedNow);
      expect(result.isEligible).toBe(true);
    });

    test('TC-COUP-02 : Coupon désactivé administrativement', () => {
      const inactiveCoupon = {
        code: 'PROMO_OFF',
        is_active: 0,
        valid_until: '2026-12-31',
        max_uses: 100,
        current_uses: 0
      };

      const result = verifyCouponEligibility(inactiveCoupon, fixedNow);
      expect(result.isEligible).toBe(false);
      expect(result.reason).toContain('désactivé');
    });

    test('TC-COUP-03 : Coupon dont la date de validité est expirée', () => {
      const expiredCoupon = {
        code: 'OLD2025',
        is_active: 1,
        valid_until: '2025-12-31',
        max_uses: 100,
        current_uses: 5
      };

      const result = verifyCouponEligibility(expiredCoupon, fixedNow);
      expect(result.isEligible).toBe(false);
      expect(result.reason).toContain('expiré');
    });

    test('TC-COUP-04 [Valeur Limite] : Quota maximal d\'utilisation atteint', () => {
      const fullCoupon = {
        code: 'QUOTA10',
        is_active: 1,
        valid_until: '2026-12-31',
        max_uses: 50,
        current_uses: 50
      };

      const result = verifyCouponEligibility(fullCoupon, fixedNow);
      expect(result.isEligible).toBe(false);
      expect(result.reason).toContain('quota maximal');
    });

    test('TC-COUP-05 : Coupon inexistant ou null', () => {
      const result = verifyCouponEligibility(null, fixedNow);
      expect(result.isEligible).toBe(false);
      expect(result.reason).toContain('introuvable');
    });
  });
});
