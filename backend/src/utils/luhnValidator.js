/**
 * Module de Validation des Cartes Bancaires (Algorithme de Luhn & Règles Métier)
 * Conçu spécifiquement pour la testabilité unitaire (Unit Testing ISTQB)
 */

/**
 * Valide le numéro d'une carte de crédit avec l'algorithme de Luhn (Modulus 10)
 * @param {string} cardNumber Numéro de carte brut
 * @returns {boolean}
 */
function validateLuhn(cardNumber) {
  if (!cardNumber || typeof cardNumber !== 'string') return false;
  
  const cleanNumber = cardNumber.replace(/\D/g, '');
  if (cleanNumber.length < 13 || cleanNumber.length > 19) return false;

  let sum = 0;
  let shouldDouble = false;

  for (let i = cleanNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanNumber.charAt(i), 10);

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

/**
 * Détecte le réseau de la carte selon le BIN (Bank Identification Number)
 * @param {string} cardNumber 
 * @returns {'VISA' | 'MASTERCARD' | 'AMEX' | 'DISCOVER' | 'UNKNOWN'}
 */
function detectCardType(cardNumber) {
  if (!cardNumber) return 'UNKNOWN';
  const cleanNumber = cardNumber.replace(/\D/g, '');

  if (/^4[0-9]{12}(?:[0-9]{3})?$/.test(cleanNumber) || /^4/.test(cleanNumber)) {
    return 'VISA';
  }
  if (/^(?:5[1-5][0-9]{2}|222[1-9]|22[3-9][0-9]|2[3-6][0-9]{2}|27[01][0-9]|2720)/.test(cleanNumber)) {
    return 'MASTERCARD';
  }
  if (/^3[47]/.test(cleanNumber)) {
    return 'AMEX';
  }
  if (/^6(?:011|5)/.test(cleanNumber)) {
    return 'DISCOVER';
  }
  return 'UNKNOWN';
}

/**
 * Valide la date d'expiration de la carte (Mois et Année)
 * @param {number|string} month 1-12
 * @param {number|string} year Année (2 ou 4 chiffres)
 * @param {Date} [referenceDate] Date de comparaison (utile pour figer le temps en test unitaire)
 * @returns {boolean}
 */
function validateExpiryDate(month, year, referenceDate = new Date()) {
  const m = parseInt(month, 10);
  let y = parseInt(year, 10);

  if (isNaN(m) || isNaN(y)) return false;
  if (m < 1 || m > 12) return false;

  // Conversion format 2 chiffres (ex: 26 -> 2026)
  if (y < 100) {
    y += 2000;
  }

  const currentYear = referenceDate.getFullYear();
  const currentMonth = referenceDate.getMonth() + 1;

  if (y < currentYear) return false;
  if (y === currentYear && m < currentMonth) return false;
  // Ne pas accepter des cartes valables à plus de 15 ans
  if (y > currentYear + 15) return false;

  return true;
}

/**
 * Valide le code de sécurité (CVV / CVC)
 * @param {string} cvv
 * @param {string} [cardType]
 * @returns {boolean}
 */
function validateCVV(cvv, cardType = 'VISA') {
  if (!cvv || typeof cvv !== 'string') return false;
  const cleanCvv = cvv.trim();

  if (cardType === 'AMEX') {
    return /^\d{4}$/.test(cleanCvv);
  }
  return /^\d{3}$/.test(cleanCvv);
}

/**
 * Valide le nom du titulaire de la carte
 * @param {string} holderName
 * @returns {boolean}
 */
function validateCardHolder(holderName) {
  if (!holderName || typeof holderName !== 'string') return false;
  const clean = holderName.trim();
  return clean.length >= 3 && clean.length <= 50 && /^[a-zA-ZÀ-ÿ\s'-]+$/.test(clean);
}

/**
 * Masque un numéro de carte bancaire pour des raisons de conformité PCI-DSS
 * @param {string} cardNumber 
 * @returns {string} Ex: "**** **** **** 4242"
 */
function maskCardNumber(cardNumber) {
  if (!cardNumber) return '****';
  const clean = cardNumber.replace(/\D/g, '');
  if (clean.length < 4) return '****';
  const last4 = clean.slice(-4);
  return `**** **** **** ${last4}`;
}

/**
 * Validation globale de la carte bancaire avec retour d'erreurs détaillé
 * @param {Object} cardData
 * @param {Date} [referenceDate]
 * @returns {{ isValid: boolean, errors: string[], cardType: string, maskedNumber: string }}
 */
function validatePaymentCard(cardData, referenceDate = new Date()) {
  const errors = [];
  const { cardNumber, cardHolder, expiryMonth, expiryYear, cvv } = cardData || {};

  const cleanNumber = (cardNumber || '').replace(/\D/g, '');

  if (!cleanNumber) {
    errors.push('Le numéro de carte bancaire est requis.');
  } else if (!validateLuhn(cleanNumber)) {
    errors.push('Le numéro de carte bancaire est invalide (échec contrôle Luhn).');
  }

  const cardType = detectCardType(cleanNumber);

  if (!validateCardHolder(cardHolder)) {
    errors.push('Le nom du titulaire est invalide (minimum 3 caractères alphabétiques).');
  }

  if (!validateExpiryDate(expiryMonth, expiryYear, referenceDate)) {
    errors.push("La date d'expiration est invalide ou la carte a expiré.");
  }

  if (!validateCVV(cvv, cardType)) {
    errors.push(`Le code de sécurité CVV est invalide (${cardType === 'AMEX' ? '4 chiffres requis' : '3 chiffres requis'}).`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    cardType,
    maskedNumber: maskCardNumber(cleanNumber)
  };
}

module.exports = {
  validateLuhn,
  detectCardType,
  validateExpiryDate,
  validateCVV,
  validateCardHolder,
  maskCardNumber,
  validatePaymentCard
};
