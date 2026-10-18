import React, { useEffect, useState } from "react";
import { BrowserRouter } from "react-router-dom";
import { useDispatch } from "react-redux";
import { ConfigProvider, App as AntdApp } from "antd";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { checkAuth } from "./store/slices/authSlice";
import { fetchSettings } from "./store/slices/settingsSlice";
import AppRoutes from "./routes/AppRoutes";
import SplashScreen from "./components/common/SplashScreen";

export function App() {
  // Show splash on every page load / reload
  const [showSplash, setShowSplash] = useState(true);

  const dispatch = useDispatch();

  useEffect(() => {
    // Restore authenticated session after page refresh
    dispatch(checkAuth());
    dispatch(fetchSettings());
  }, [dispatch]);

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

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
        {/* Splash renders on top; app renders underneath simultaneously */}
        {showSplash && <SplashScreen onFinish={handleSplashFinish} />}
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
