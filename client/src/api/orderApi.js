import { apiClient } from "./client";

export const orderApi = {
  createOrder: async (orderData) => {
    return apiClient("/order/createOrder", {
      method: "POST",
      body: JSON.stringify(orderData),
    });
  },

  getAllOrders: async () => {
    return apiClient("/order/getAllOrders", {
      method: "GET",
    });
  },

  getOrderById: async (id) => {
    return apiClient(`/order/getOrderById/${id}`, {
      method: "GET",
    });
  },

  updateOrderStatus: async (id, orderStatus) => {
    return apiClient(`/order/updateOrderStatus/${id}`, {
      method: "PUT",
      body: JSON.stringify({ orderStatus }),
    });
  },

  cancelOrder: async (id) => {
    return apiClient(`/order/cancelOrder/${id}`, {
      method: "PUT",
    });
  },
};
