import React, { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { useDispatch } from "react-redux";
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
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
