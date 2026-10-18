import { apiClient, setStoredToken, clearStoredToken } from "./client";

export const authApi = {
  login: async (phoneNo, password) => {
    const data = await apiClient("/user/login", {
      method: "POST",
      body: JSON.stringify({ phoneNo, password }),
    });
    if (data.token) {
      setStoredToken(data.token);
    }
    return data;
  },

  getProfile: async () => {
    return apiClient("/user/me", {
      method: "GET",
    });
  },

  logout: async () => {
    try {
      await apiClient("/user/logout", {
        method: "POST",
      });
    } finally {
      clearStoredToken();
    }
  },

  createUser: async (userData) => {
    return apiClient("/user/create-user", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  },
};
