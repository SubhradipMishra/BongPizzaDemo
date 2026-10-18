import { apiClient } from "./client";

export const paymentApi = {
  createPayment: async (paymentData) => {
    return apiClient("/payments/createPayment", {
      method: "POST",
      body: JSON.stringify(paymentData),
    });
  },

  getPaymentsByOrder: async (orderId) => {
    return apiClient(`/payments/getPaymentsByOrder/${orderId}`, {
      method: "GET",
    });
  },
};
