import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { loginUser, clearAuthError } from "../store/slices/authSlice";
import { Pizza, Eye, EyeOff, Lock, Phone, AlertCircle, ArrowLeft } from "lucide-react";

export const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { isAuthenticated, status, error } = useSelector((state) => state.auth);

  const [phoneNo, setPhoneNo] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState("");

  const from = location.state?.from?.pathname || "/dashboard";

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!phoneNo.trim() || !password.trim()) {
      setFormError("Please enter both phone number and password.");
      return;
    }

    if (phoneNo.trim().length !== 10) {
      setFormError("Phone number must be exactly 10 digits.");
      return;
    }

    const resultAction = await dispatch(
      loginUser({ phoneNo: phoneNo.trim(), password: password.trim() })
    );

    if (loginUser.fulfilled.match(resultAction)) {
      navigate(from, { replace: true });
    }
  };

  const handleFillDemo = () => {
    setPhoneNo("9876543210");
    setPassword("admin123");
    setFormError("");
  };

  return (
    <div className="min-h-screen bg-[#FFFDF8] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Top back link */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-4 px-4">
        <Link
          to="/"
          className="inline-flex items-center text-xs font-semibold text-[#6B7280] hover:text-[#D62828] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Back to বং Pizza Home
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-2xl bg-black border-2 border-amber-400/50 flex items-center justify-center shadow-lg p-1 overflow-hidden">
            <img
              src="/images/logo.jpeg"
              alt="বং Pizza"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-black text-[#222222]">
          বং <span className="text-[#D62828]">Pizza</span> POS Login
        </h2>
        <p className="mt-1 text-center text-xs text-[#6B7280]">
          A Touch of Bengal — Enter your authorized biller credentials to access the terminal
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl border border-[#E5E7EB] shadow-xs">
          {/* Error Banner */}
          {(formError || error) && (
            <div className="mb-5 p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] flex items-start space-x-2.5 text-xs text-[#991B1B]">
              <AlertCircle className="w-4 h-4 text-[#D62828] shrink-0 mt-0.5" />
              <span>{formError || error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Phone Number Field */}
            <div>
              <label
                htmlFor="phoneNo"
                className="block text-xs font-semibold text-[#222222] mb-1.5"
              >
                10-Digit Mobile Number
              </label>
              <div className="relative rounded-lg">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6B7280]">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  id="phoneNo"
                  name="phoneNo"
                  type="tel"
                  maxLength={10}
                  required
                  value={phoneNo}
                  onChange={(e) => setPhoneNo(e.target.value.replace(/\D/g, ""))}
                  placeholder="e.g. 9876543210"
                  className="block w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC928] focus:border-[#FFC928] text-[#222222] placeholder-gray-400"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-[#222222] mb-1.5"
              >
                Password
              </label>
              <div className="relative rounded-lg">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6B7280]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="block w-full pl-9 pr-10 py-2.5 text-sm bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC928] focus:border-[#FFC928] text-[#222222] placeholder-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#6B7280] hover:text-[#222222]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-xs text-sm font-bold text-white bg-[#D62828] hover:bg-[#b91c1c] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D62828] disabled:opacity-70 transition-colors cursor-pointer"
              >
                {status === "loading" ? "Authenticating..." : "Sign In to Terminal"}
              </button>
            </div>
          </form>

          {/* Quick Demo Credentials helper */}
          <div className="mt-6 pt-4 border-t border-[#E5E7EB] text-center">
            <p className="text-[11px] text-[#6B7280] mb-2 font-medium">
              Demo Biller Account:
            </p>
            <button
              type="button"
              onClick={handleFillDemo}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-[#FFFDF8] border border-[#FFC928] text-xs font-semibold text-[#92400E] hover:bg-[#FFC928]/20 transition-colors"
            >
              <span>Auto-Fill Demo Credentials (9876543210)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
