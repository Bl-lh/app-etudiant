package ma.emi.campus.service;

public interface PaymentGateway {
    class PaymentResponse {
        private final boolean success;
        private final String transactionId;
        private final String errorMessage;

        public PaymentResponse(boolean success, String transactionId, String errorMessage) {
            this.success = success;
            this.transactionId = transactionId;
            this.errorMessage = errorMessage;
        }

        public boolean isSuccess() { return success; }
        public String getTransactionId() { return transactionId; }
        public String getErrorMessage() { return errorMessage; }
    }

    PaymentResponse processPayment(Long userId, double amount, String cardNumber);
}
