// Mock implementation for mpesaService
module.exports = {
  processPayment: async () => ({ status: 'mocked', transactionId: 'MOCK123' }),
  validatePayment: async () => ({ status: 'mocked', valid: true }),
};
