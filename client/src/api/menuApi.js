import { apiClient } from "./client";

export const menuApi = {
  getFullMenu: async () => {
    return apiClient("/menu/getfullmenu", {
      method: "GET",
    });
  },

  createMenu: async (menuData) => {
    return apiClient("/menu/create", {
      method: "POST",
      body: JSON.stringify(menuData),
    });
  },

  updateMenu: async (id, menuData) => {
    return apiClient(`/menu/update/${id}`, {
      method: "PUT",
      body: JSON.stringify(menuData),
    });
  },

  deleteMenu: async (id) => {
    return apiClient(`/menu/delete/${id}`, {
      method: "DELETE",
    });
  },

  getCategories: async () => {
    return apiClient("/category/get", {
      method: "GET",
    });
  },

  createCategory: async (categoryData) => {
    return apiClient("/category/create", {
      method: "POST",
      body: JSON.stringify(categoryData),
    });
  },
};
