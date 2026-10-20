import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  CreditCard,
  CheckCircle,
  AlertCircle,
  Tag,
  ShieldCheck,
  ArrowLeft,
  Sparkles,
  Lock,
  FileText
} from 'lucide-react';
import api from '../services/api';
import CreditCardPreview from '../components/CreditCardPreview';
import ReceiptModal from '../components/ReceiptModal';
import { useAuth } from '../context/AuthContext';

export default function CheckoutPage({ course, enrollmentId, onBack, onComplete }) {
  const { user } = useAuth();

  const [paymentMethod, setPaymentMethod] = useState('CREDIT_CARD');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);

  // Formulaire Carte
  const [cardData, setCardData] = useState({
    cardNumber: '4242424242424242',
    cardHolder: user?.name || 'BILAL MANSOURI',
    expiryMonth: '12',
    expiryYear: '2028',
    cvv: '123'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generatedReceipt, setGeneratedReceipt] = useState(null);

  const basePrice = parseFloat(course?.price || 0);
  const discountAmount = appliedCoupon ? (basePrice * appliedCoupon.discountPercent) / 100 : 0;
  const finalPrice = Math.max(0, basePrice - discountAmount);

  // Application du code promo
  const handleApplyCoupon = async (codeToUse) => {
    const code = (codeToUse || couponCode).trim().toUpperCase();
    if (!code) return;

    setCouponLoading(true);
    setCouponError(null);

    try {
      const res = await api.validateCoupon(code, basePrice);
      if (res.success) {
        setAppliedCoupon(res.coupon);
        setCouponCode(code);
      }
    } catch (err) {
      setCouponError(err.message);
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  // Remplissage rapide des cartes de test ISTQB
  const setTestCard = (type) => {
    setError(null);
    if (type === 'valid') {
      setCardData({
        ...cardData,
        cardNumber: '4242424242424242',
        cvv: '123'
      });
    } else if (type === 'declined') {
      setCardData({
        ...cardData,
        cardNumber: '4000000000000002', // Déclenche le refus simulé (HTTP 402)
        cvv: '456'
      });
    } else if (type === 'invalid_luhn') {
      setCardData({
        ...cardData,
        cardNumber: '4242424242424241', // Somme Luhn corrompue (HTTP 400)
        cvv: '789'
      });
    }
  };

  // Soumission du paiement
  const handleProcessPayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        enrollmentId,
        paymentMethod,
        couponCode: appliedCoupon ? appliedCoupon.code : null,
        cardData: paymentMethod === 'CREDIT_CARD' ? cardData : null
      };

      const res = await api.processPayment(payload);

      if (res.success) {
        // Animation festive de confettis
        try {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch {
          // ignore si canvas-confetti échoue
        }

        setGeneratedReceipt(res.receipt);
      }
    } catch (err) {
      if (err.details && Array.isArray(err.details)) {
        setError(err.details.map(d => (typeof d === 'string' ? d : d.message || d.msg || JSON.stringify(d))).join(' | '));
      } else {
        setError(err.message || 'Le paiement a échoué. Veuillez vérifier les informations saisies.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px 0 80px 0' }}>
      {/* Bouton Retour */}
      <button onClick={onBack} className="btn btn-outline btn-sm" style={{ marginBottom: 24 }}>
        <ArrowLeft size={16} /> Retour
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 32 }}>
        {/* Colonne Formulaire de Règlement */}
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 8 }}>
            Validation & Paiement Sécurisé
          </h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: 28, fontSize: '0.95rem' }}>
            Finalisez votre inscription au cours par transaction MySQL sécurisée et recevez votre reçu officiel.
          </p>

          {/* Alerte Erreur */}
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: 16,
              color: '#f87171',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 24
            }}>
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          {/* Choix du Mode de Paiement */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
            <button
              type="button"
              onClick={() => setPaymentMethod('CREDIT_CARD')}
              className={`btn ${paymentMethod === 'CREDIT_CARD' ? 'btn-primary' : 'btn-outline'}`}
              style={{ flex: 1, padding: '12px 14px' }}
            >
              <CreditCard size={18} />
              Carte Bancaire
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('PAYPAL')}
              className={`btn ${paymentMethod === 'PAYPAL' ? 'btn-primary' : 'btn-outline'}`}
              style={{ flex: 1, padding: '12px 14px' }}
            >
              PayPal
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('BANK_TRANSFER')}
              className={`btn ${paymentMethod === 'BANK_TRANSFER' ? 'btn-primary' : 'btn-outline'}`}
              style={{ flex: 1, padding: '12px 14px' }}
            >
              Virement Bancaire
            </button>
          </div>

          {/* Mode Carte Bancaire avec Simulation & Prévisualisation */}
          {paymentMethod === 'CREDIT_CARD' && (
            <div className="glass-panel" style={{ padding: 24, marginBottom: 24 }}>
              {/* Carte 3D animée en direct */}
              <CreditCardPreview
                cardNumber={cardData.cardNumber}
                cardHolder={cardData.cardHolder}
                expiryMonth={cardData.expiryMonth}
                expiryYear={cardData.expiryYear}
              />

              {/* Raccourcis Scénarios de Tests ISTQB */}
              <div style={{
                background: 'rgba(99, 102, 241, 0.08)',
                border: '1px dashed rgba(99, 102, 241, 0.3)',
                borderRadius: 8,
                padding: 12,
                marginBottom: 20
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a5b4fc', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Sparkles size={14} /> SCÉNARIOS DE TEST AUTOMATISABLES (ISTQB) :
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setTestCard('valid')}
                    className="btn btn-sm btn-outline"
                    style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                  >
                    ✓ Carte Valide (4242...)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTestCard('declined')}
                    className="btn btn-sm btn-outline"
                    style={{ fontSize: '0.75rem', padding: '4px 10px', color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.4)' }}
                  >
                    ⚠ Simulation Refus Bancaire (0002)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTestCard('invalid_luhn')}
                    className="btn btn-sm btn-outline"
                    style={{ fontSize: '0.75rem', padding: '4px 10px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.4)' }}
                  >
                    ✕ Échec Algorithme Luhn
                  </button>
                </div>
              </div>

              {/* Formulaire des Champs de Carte */}
              <form onSubmit={handleProcessPayment}>
                <div className="form-group">
                  <label className="form-label">Numéro de Carte Bancaire</label>
                  <input
                    type="text"
                    required
                    maxLength={19}
                    placeholder="4242 4242 4242 4242"
                    className="form-input"
                    value={cardData.cardNumber}
                    onChange={(e) => setCardData({ ...cardData, cardNumber: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Nom du Titulaire (Sur la carte)</label>
                  <input
                    type="text"
                    required
                    placeholder="BILAL MANSOURI"
                    className="form-input"
                    value={cardData.cardHolder}
                    onChange={(e) => setCardData({ ...cardData, cardHolder: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Mois (MM)</label>
                    <input
                      type="text"
                      required
                      maxLength={2}
                      placeholder="12"
                      className="form-input"
                      value={cardData.expiryMonth}
                      onChange={(e) => setCardData({ ...cardData, expiryMonth: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Année (AAAA)</label>
                    <input
                      type="text"
                      required
                      maxLength={4}
                      placeholder="2028"
                      className="form-input"
                      value={cardData.expiryYear}
                      onChange={(e) => setCardData({ ...cardData, expiryYear: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Code CVC</label>
                    <input
                      type="password"
                      required
                      maxLength={4}
                      placeholder="123"
                      className="form-input"
                      value={cardData.cvv}
                      onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%', marginTop: 12 }}
                >
                  <Lock size={18} />
                  {loading ? 'Traitement de la transaction...' : `Payer ${finalPrice.toFixed(2)} DH et Valider`}
                </button>
              </form>
            </div>
          )}

          {paymentMethod !== 'CREDIT_CARD' && (
            <div className="glass-panel" style={{ padding: 32, textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 12 }}>
                Règlement via {paymentMethod === 'PAYPAL' ? 'Passerelle PayPal Express' : 'Virement Bancaire (RIB)'}
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 24 }}>
                {paymentMethod === 'PAYPAL'
                  ? 'Vous serez redirigé vers l\'environnement de paiement sandbox PayPal.'
                  : 'Compte Attijariwafa Bank : 007 780 0001234567890123 45'}
              </p>
              <button
                onClick={handleProcessPayment}
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                {loading ? 'Traitement...' : `Confirmer le règlement de ${finalPrice.toFixed(2)} DH`}
              </button>
            </div>
          )}
        </div>

        {/* Colonne Récapitulatif de Commande & Coupons */}
        <div>
          <div className="glass-panel" style={{ padding: 28, position: 'sticky', top: 100 }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 20 }}>
              Récapitulatif de l'Inscription
            </h3>

            {/* Fiche du Cours */}
            <div style={{ display: 'flex', gap: 14, marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid var(--border-subtle)' }}>
              <img
                src={course?.image_url}
                alt={course?.title}
                style={{ width: 70, height: 70, borderRadius: 10, objectFit: 'cover' }}
              />
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, lineHeight: 1.3, marginBottom: 4 }}>
                  {course?.title}
                </h4>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                  Instructeur : {course?.instructor_name}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--secondary)' }}>
                  Durée : {course?.duration_hours}h
                </div>
              </div>
            </div>

            {/* Bon de Réduction (Coupons) */}
            <div style={{ marginBottom: 24 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Tag size={15} color="var(--primary)" />
                Code Promo / Bon de Réduction
              </label>

              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  placeholder="Ex: ETUDIANT20"
                  className="form-input"
                  style={{ textTransform: 'uppercase' }}
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => handleApplyCoupon()}
                  disabled={couponLoading}
                  className="btn btn-outline btn-sm"
                >
                  {couponLoading ? '...' : 'Appliquer'}
                </button>
              </div>

              {couponError && (
                <div style={{ fontSize: '0.78rem', color: '#f87171', marginTop: 6 }}>
                  ✕ {couponError}
                </div>
              )}

              {appliedCoupon && (
                <div style={{
                  fontSize: '0.8rem',
                  color: '#10b981',
                  marginTop: 6,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}>
                  <CheckCircle size={14} />
                  Code {appliedCoupon.code} activé : -{appliedCoupon.discountPercent}% de réduction !
                </div>
              )}

              {/* Raccourci Coupon Test */}
              <div style={{ marginTop: 8 }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Codes de test actifs : </span>
                <span
                  onClick={() => handleApplyCoupon('ETUDIANT20')}
                  style={{ fontSize: '0.75rem', color: 'var(--secondary)', cursor: 'pointer', textDecoration: 'underline', marginRight: 8 }}
                >
                  ETUDIANT20 (-20%)
                </span>
                <span
                  onClick={() => handleApplyCoupon('PROMO50')}
                  style={{ fontSize: '0.75rem', color: 'var(--secondary)', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  PROMO50 (-50%)
                </span>
              </div>
            </div>

            {/* Décomposition Tarifaire */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.9rem', marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Tarif initial :</span>
                <span>{basePrice.toFixed(2)} DH</span>
              </div>

              {appliedCoupon && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981' }}>
                  <span>Remise ({appliedCoupon.discountPercent}%) :</span>
                  <span>-{discountAmount.toFixed(2)} DH</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Frais de dossier :</span>
                <span>0.00 DH</span>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '1.25rem',
                fontWeight: 800,
                color: '#ffffff',
                borderTop: '1px solid var(--border-subtle)',
                paddingTop: 14,
                marginTop: 6
              }}>
                <span>TOTAL À PAYER :</span>
                <span style={{ color: 'var(--accent)' }}>{finalPrice.toFixed(2)} DH</span>
              </div>
            </div>

            {/* Sécurité */}
            <div style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: 8,
              padding: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: '0.8rem',
              color: '#a7f3d0'
            }}>
              <ShieldCheck size={20} color="#10b981" />
              <span>Garantie transaction ACID MySQL. Reçu immédiat avec référence unique.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Reçu de Confirmation & Impression */}
      {generatedReceipt && (
        <ReceiptModal
          receipt={generatedReceipt}
          onClose={() => {
            setGeneratedReceipt(null);
            if (onComplete) onComplete();
          }}
        />
      )}
    </div>
  );
}
