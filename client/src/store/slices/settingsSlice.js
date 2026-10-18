import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { settingsApi } from "../../api/settingsApi";

export const fetchSettings = createAsyncThunk("settings/fetchSettings", async (_, { rejectWithValue }) => {
  try {
    const response = await settingsApi.getSettings();
    return response.data;
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

export const updateSettingsAction = createAsyncThunk(
  "settings/updateSettings",
  async (settingsData, { rejectWithValue }) => {
    try {
      const response = await settingsApi.updateSettings(settingsData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  settings: {
    shopName: "BongPizza",
    address: "",
    phone: "",
    email: "",
    gstNumber: "",
    taxEnabled: false,
    pricesIncludeTax: false,
    cgstRate: 0,
    sgstRate: 0,
    receiptFooter: "Thank you for visiting BongPizza!",
    receiptPaperSize: "80mm",
    showGstNumberOnReceipt: true,
    autoPrintReceipt: false,
    autoPrintKOT: false,
  },
  status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSettings.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.status = "succeeded";
        if (action.payload) {
          state.settings = action.payload;
        }
      })
      .addCase(fetchSettings.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      .addCase(updateSettingsAction.fulfilled, (state, action) => {
        if (action.payload) {
          state.settings = action.payload;
        }
      });
  },
});

export default settingsSlice.reducer;
