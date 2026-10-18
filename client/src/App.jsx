import React, { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { useDispatch } from "react-redux";
import { ConfigProvider, App as AntdApp } from "antd";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { checkAuth } from "./store/slices/authSlice";
import { fetchSettings } from "./store/slices/settingsSlice";
import AppRoutes from "./routes/AppRoutes";

export function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Restore authenticated session after page refresh
    dispatch(checkAuth());
    dispatch(fetchSettings());
  }, [dispatch]);

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#D62828",
          colorLink: "#D62828",
          colorLinkHover: "#b91c1c",
          colorLinkActive: "#991b1b",
          colorSuccess: "#16a34a",
          colorWarning: "#f59e0b",
          colorError: "#dc2626",
          colorInfo: "#2563eb",
          borderRadius: 12,
        },
      }}
    >
      <AntdApp>
        <BrowserRouter>
          <AppRoutes />
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
          />
        </BrowserRouter>
      </AntdApp>
    </ConfigProvider>
  );
}

export default App;
