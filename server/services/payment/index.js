// Selects the active PaymentProvider based on PAYMENT_PROVIDER in .env.
// This is the ONLY file that should ever need to change when a real
// provider is chosen - add a case here pointing at a new
// RazorpayProvider.js/StripeProvider.js, set PAYMENT_PROVIDER accordingly.
const env = require('../../config/env');
const MockPaymentProvider = require('./MockPaymentProvider');

let instance = null;

function getPaymentProvider() {
  if (instance) return instance;

  switch (env.payment.provider) {
    case 'mock':
      instance = new MockPaymentProvider();
      break;
    default: {
      const err = new Error(
        `PAYMENT_PROVIDER="${env.payment.provider}" is not implemented yet. ` +
          'Only "mock" is available until a real payment gateway is chosen - see server/services/payment/PaymentProvider.js.'
      );
      err.statusCode = 503;
      throw err;
    }
  }
  return instance;
}

module.exports = { getPaymentProvider };
