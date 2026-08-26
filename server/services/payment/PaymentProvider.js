// The payment gateway has NOT been decided (spec Section 29/54). This file
// defines the contract every provider must implement. Application logic
// (paymentService.js, refundService.js) only ever talks to this interface,
// never to a specific provider's SDK directly - so plugging in Razorpay,
// Stripe, or anything else later means implementing this contract in a new
// file (e.g. RazorpayProvider.js) and pointing PAYMENT_PROVIDER at it in
// .env. No other file in this codebase should need to change.
//
// This is a lightweight contract (not a TypeScript interface or an abstract
// class with enforcement) since the codebase is plain JS - each method
// below documents the shape a real implementation must return.
class PaymentProvider {
  /**
   * Verifies a payment with the provider (e.g. checking a webhook payload
   * or transaction id against the provider's API) and returns whether it
   * succeeded. Real implementations call out to the provider here.
   * @returns {Promise<{ verified: boolean, providerTransactionId: string }>}
   */
  // eslint-disable-next-line no-unused-vars
  async verifyPayment(paymentId) {
    throw new Error('verifyPayment() must be implemented by a concrete PaymentProvider.');
  }

  /**
   * Initiates a refund with the provider for a given payment/amount.
   * @returns {Promise<{ success: boolean, providerRefundId: string }>}
   */
  // eslint-disable-next-line no-unused-vars
  async createRefund(payment, amount) {
    throw new Error('createRefund() must be implemented by a concrete PaymentProvider.');
  }
}

module.exports = PaymentProvider;
