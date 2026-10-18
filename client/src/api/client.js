// Centralized API client for BongPizza POS

const RAW_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:7070/api";
const BASE_URL = RAW_BASE_URL.replace(/\/+$/, "");

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

/**
 * Downloads a binary file (e.g. .xlsx, .csv, .json.gz) with auth headers
 * and automatically triggers browser download.
 */
export const downloadBlob = async (endpoint, fallbackFilename = "download") => {
  const url = `${BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
  const headers = {};
  const token = getStoredToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: "GET",
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    let errorMsg = `Download failed with status ${response.status}`;
    try {
      const errData = await response.json();
      if (errData.message) errorMsg = errData.message;
    } catch (_) {}
    throw new Error(errorMsg);
  }

  let filename = fallbackFilename;
  const disposition = response.headers.get("content-disposition");
  if (disposition && disposition.includes("filename=")) {
    const match = disposition.match(/filename=["']?([^"']+)["']?/);
    if (match && match[1]) filename = match[1];
  }

  const blob = await response.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(blobUrl);

  return { success: true, filename };
};

