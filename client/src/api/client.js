// Centralized API client for BongPizza POS

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:7070/api";

export const getStoredToken = () => {
  return localStorage.getItem("bongpizza_token") || "";
};

export const setStoredToken = (token) => {
  if (token) {
    localStorage.setItem("bongpizza_token", token);
  } else {
    localStorage.removeItem("bongpizza_token");
  }
};

export const clearStoredToken = () => {
  localStorage.removeItem("bongpizza_token");
};

export const apiClient = async (endpoint, options = {}) => {
  const url = `${BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const token = getStoredToken();
  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
    credentials: "include", // Supports HTTP-only cookies
  };

  try {
    const response = await fetch(url, config);

    let data;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const errorMessage =
        (typeof data === "object" && (data.message || data.error)) ||
        `Request failed with status ${response.status}`;
      
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    if (error.name === "TypeError" && error.message.includes("Failed to fetch")) {
      const netError = new Error("Unable to connect to BongPizza server. Please check your network or server status.");
      netError.status = 0;
      throw netError;
    }
    throw error;
  }
};
