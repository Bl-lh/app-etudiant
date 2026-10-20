package ma.emi.campus.service;

import java.util.HashMap;
import java.util.Map;

/**
 * Service de calcul des réductions commerciales par coupon.
 * Implémentation identique à src/services/discountService.js.
 */
public class DiscountService {

    public static class CouponRule {
        private final double percentage;
        private final double minAmount;

        public CouponRule(double percentage, double minAmount) {
            this.percentage = percentage;
            this.minAmount = minAmount;
        }

        public double getPercentage() { return percentage; }
        public double getMinAmount() { return minAmount; }
    }

    private final Map<String, CouponRule> activeCoupons = new HashMap<>();

    public DiscountService() {
        activeCoupons.put("BIENVENUE10", new CouponRule(0.10, 100.0));
        activeCoupons.put("TECH20", new CouponRule(0.20, 250.0));
        activeCoupons.put("CAMPUS50", new CouponRule(0.50, 500.0));
    }

    /**
     * Calcule le montant final après application du coupon.
     * @param originalAmount Prix initial en MAD
     * @param couponCode Code promotionnel (ex: BIENVENUE10)
     * @return Montant net à payer
     */
    public double applyDiscount(double originalAmount, String couponCode) {
        if (originalAmount <= 0) {
            throw new IllegalArgumentException("Le montant initial doit être strictement positif.");
        }

        if (couponCode == null || couponCode.trim().isEmpty()) {
            return originalAmount;
        }

        String normalizedCode = couponCode.trim().toUpperCase();
        CouponRule rule = activeCoupons.get(normalizedCode);

        if (rule == null) {
            throw new IllegalArgumentException("Code promo invalide : " + couponCode);
        }

        if (originalAmount < rule.getMinAmount()) {
            throw new IllegalStateException(String.format(
                "Le coupon %s exige un montant minimal de %.2f MAD (Montant actuel : %.2f MAD)",
                normalizedCode, rule.getMinAmount(), originalAmount
            ));
        }

        double discountValue = originalAmount * rule.getPercentage();
        return Math.round((originalAmount - discountValue) * 100.0) / 100.0;
    }

    public boolean isValidCoupon(String couponCode) {
        if (couponCode == null) return false;
        return activeCoupons.containsKey(couponCode.trim().toUpperCase());
    }
}
