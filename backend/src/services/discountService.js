/**
 * Service de Calcul des Remises et Vérification des Coupons
 * Conçu avec des règles strictes pour les tests unitaires et de limites (Boundary Value Analysis)
 */

/**
 * Arrondit un montant financier à deux décimales
 * @param {number} value
 * @returns {number}
 */
function roundCurrency(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Calcule la remise et le montant final
 * @param {number} originalPrice Prix initial (doit être >= 0)
 * @param {number} discountPercent Pourcentage de réduction (0 à 100)
 * @returns {{ originalPrice: number, discountPercent: number, discountAmount: number, finalPrice: number }}
 */
function calculateDiscount(originalPrice, discountPercent = 0) {
  const price = Number(originalPrice);
  const percent = Number(discountPercent);

  if (isNaN(price) || price < 0) {
    throw new Error('Le montant initial doit être un nombre positif ou nul.');
  }

  if (isNaN(percent) || percent < 0 || percent > 100) {
    throw new Error('Le pourcentage de remise doit être compris entre 0 et 100.');
  }

  if (price === 0 || percent === 0) {
    return {
      originalPrice: roundCurrency(price),
      discountPercent: 0,
      discountAmount: 0.00,
      finalPrice: roundCurrency(price)
    };
  }

  const rawDiscount = (price * percent) / 100;
  const discountAmount = roundCurrency(rawDiscount);
  const finalPrice = roundCurrency(Math.max(0, price - discountAmount));

  return {
    originalPrice: roundCurrency(price),
    discountPercent: percent,
    discountAmount,
    finalPrice
  };
}

/**
 * Vérifie l'éligibilité d'un coupon selon ses règles d'application
 * @param {Object} coupon Objet coupon depuis la base de données
 * @param {Date} [currentDate] Date de référence pour le test
 * @returns {{ isEligible: boolean, reason?: string }}
 */
function verifyCouponEligibility(coupon, currentDate = new Date()) {
  if (!coupon) {
    return { isEligible: false, reason: 'Code promo introuvable.' };
  }

  if (!coupon.is_active) {
    return { isEligible: false, reason: 'Ce code promo a été désactivé.' };
  }

  if (coupon.valid_until) {
    const expiration = new Date(coupon.valid_until);
    // On compare jusqu'à la fin de la journée d'expiration (23:59:59)
    expiration.setHours(23, 59, 59, 999);
    if (currentDate > expiration) {
      return { isEligible: false, reason: 'Ce code promo a expiré.' };
    }
  }

  if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
    return { isEligible: false, reason: 'Le quota maximal d’utilisation de ce coupon a été atteint.' };
  }

  return { isEligible: true };
}

module.exports = {
  roundCurrency,
  calculateDiscount,
  verifyCouponEligibility
};
