// Simple in-memory storage for payments
// Note: This will reset on server restart

interface PaymentData {
  txHash: string;
  fromAddress: string;
  amount: string;
  timestamp: number;
  verified: boolean;
}

// Storage for collage payments
const paymentsData: Record<string, PaymentData> = {};

// Storage for user payment history
const userPayments: Record<string, string[]> = {};

export const paymentStore = {
  // Get payment data for a collage
  getPayment: (collageId: string): PaymentData | null => {
    return paymentsData[`payment:${collageId}`] || null;
  },
  
  // Save payment data for a collage
  savePayment: (collageId: string, data: PaymentData): void => {
    paymentsData[`payment:${collageId}`] = data;
    
    // Add to user payment history
    const userKey = `user:${data.fromAddress}`;
    if (!userPayments[userKey]) {
      userPayments[userKey] = [];
    }
    userPayments[userKey].push(collageId);
  },
  
  // Get all payments for a user
  getUserPayments: (userAddress: string): string[] => {
    return userPayments[`user:${userAddress}`] || [];
  },
  
  // Clear all payments (for testing)
  clearAll: (): void => {
    Object.keys(paymentsData).forEach(key => delete paymentsData[key]);
    Object.keys(userPayments).forEach(key => delete userPayments[key]);
  }
};

export default paymentStore; 