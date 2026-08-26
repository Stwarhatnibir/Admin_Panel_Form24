// Development-only mock. Clearly NOT a real payment gateway - see spec
// Section 54: "It must clearly be development-only." This exists so
// refund approval has something real to call while no real provider is
// configured; every method here deterministically "succeeds" since
// there's no real money or real provider on the other end. Swapping this
// out for RazorpayProvider/StripeProvider/etc. later requires no changes
// to paymentService.js or refundService.js - only services/payment/index.js
// needs to route to the new provider.
const PaymentProvider = require('./PaymentProvider');

class MockPaymentProvider extends PaymentProvider {
  async verifyPayment(paymentId) {
    return { verified: true, providerTransactionId: `mock_txn_${paymentId}` };
  }

  async createRefund(payment, amount) {
    return { success: true, providerRefundId: `mock_refund_${payment.id}_${Date.now()}` };
  }
}

module.exports = MockPaymentProvider;
