import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  orderType: "dine-in", // "dine-in" | "pickup" | "delivery"
  tableId: null,
  tableNumber: "",
  customer: {
    name: "",
    phone: "",
    address: "",
  },
  items: [],
  discount: 0,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    setOrderType: (state, action) => {
      state.orderType = action.payload;
      if (action.payload !== "dine-in") {
        state.tableId = null;
        state.tableNumber = "";
      }
    },

    setTable: (state, action) => {
      state.tableId = action.payload?.tableId || null;
      state.tableNumber = action.payload?.tableNumber || "";
    },

    setCustomer: (state, action) => {
      state.customer = {
        ...state.customer,
        ...action.payload,
      };
    },

    addItem: (state, action) => {
      const menuItem = action.payload;
      const existing = state.items.find(
        (item) => item.menuItemId === (menuItem._id || menuItem.menuItemId)
      );

      const price = Number(menuItem.price) || 0;

      if (existing) {
        existing.quantity += 1;
        existing.itemTotal = existing.quantity * price;
      } else {
        state.items.push({
          menuItemId: menuItem._id || menuItem.menuItemId,
          name: menuItem.name,
          price: price,
          quantity: 1,
          itemTotal: price,
        });
      }
    },

    removeItem: (state, action) => {
      const menuItemId = action.payload;
      state.items = state.items.filter((item) => item.menuItemId !== menuItemId);
    },

    updateItemQuantity: (state, action) => {
      const { menuItemId, quantity } = action.payload;
      const item = state.items.find((i) => i.menuItemId === menuItemId);
      if (item) {
        const newQty = Math.max(0, Number(quantity) || 0);
        if (newQty === 0) {
          state.items = state.items.filter((i) => i.menuItemId !== menuItemId);
        } else {
          item.quantity = newQty;
          item.itemTotal = item.quantity * item.price;
        }
      }
    },

    setDiscount: (state, action) => {
      state.discount = Math.max(0, Number(action.payload) || 0);
    },

    clearCart: (state) => {
      state.items = [];
      state.discount = 0;
      state.customer = { name: "", phone: "", address: "" };
      state.tableId = null;
      state.tableNumber = "";
      state.orderType = "dine-in";
    },
  },
});

export const {
  setOrderType,
  setTable,
  setCustomer,
  addItem,
  removeItem,
  updateItemQuantity,
  setDiscount,
  clearCart,
} = cartSlice.actions;

export default cartSlice.reducer;
