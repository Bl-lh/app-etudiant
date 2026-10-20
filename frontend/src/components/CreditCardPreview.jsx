import React from 'react';
import { CreditCard, Shield } from 'lucide-react';

export default function CreditCardPreview({
  cardNumber = '',
  cardHolder = '',
  expiryMonth = '',
  expiryYear = '',
  cardType = 'VISA'
}) {
  // Formatage du numéro avec espaces
  const formattedNumber = cardNumber
    ? cardNumber.replace(/\D/g, '').padEnd(16, '•').replace(/(.{4})/g, '$1 ').trim()
    : '•••• •••• •••• ••••';

  const formattedHolder = cardHolder ? cardHolder.toUpperCase() : 'NOM DU TITULAIRE';
  const formattedExpiry = (expiryMonth || 'MM') + '/' + (expiryYear ? expiryYear.slice(-2) : 'AA');

  return (
    <div className="credit-card-preview">
      {/* Ligne Supérieure : Puce & Type de Carte */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="credit-card-chip" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Shield size={18} color="#10b981" />
          <span style={{
            fontSize: '0.95rem',
            fontWeight: 800,
            letterSpacing: '0.08em',
            color: cardType === 'MASTERCARD' ? '#f59e0b' : '#38bdf8'
          }}>
            {cardType || 'VISA'}
          </span>
        </div>
      </div>

      {/* Numéro de Carte */}
      <div className="credit-card-number">
        {formattedNumber}
      </div>

      {/* Ligne Inférieure : Titulaire et Expiration */}
      <div className="credit-card-footer">
        <div>
          <div className="credit-card-holder-label">Titulaire de la carte</div>
          <div className="credit-card-holder-name" style={{
            maxWidth: 220,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {formattedHolder}
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div className="credit-card-expiry-label">Expire fin</div>
          <div className="credit-card-expiry-date">{formattedExpiry}</div>
        </div>
      </div>
    </div>
  );
}
