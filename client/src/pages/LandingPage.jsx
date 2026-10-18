import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { checkAuth } from "../store/slices/authSlice";
import {
  Pizza,
  ArrowRight,
  Receipt,
  ChefHat,
  CreditCard,
  Grid,
  BarChart3,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  Clock,
  Sparkles,
  ShieldCheck,
  Zap,
} from "lucide-react";

export const LandingPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [checkingSession, setCheckingSession] = useState(false);

  const handleGetStarted = async () => {
    setCheckingSession(true);
    try {
      // Authenticate against real backend endpoint
      const result = await dispatch(checkAuth()).unwrap();
      if (result) {
        navigate("/dashboard");
      } else {
        navigate("/login");
      }
    } catch {
      navigate("/login");
    } finally {
      setCheckingSession(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFDF8] text-[#222222] flex flex-col font-sans">
      {/* Navbar */}
      <header className="bg-white border-b border-[#E5E7EB] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#FFC928] flex items-center justify-center shadow-xs">
              <Pizza className="w-6 h-6 text-[#D62828]" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-[#222222]">
              Bong<span className="text-[#D62828]">Pizza</span>
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-[#6B7280]">
            <a href="#hero" className="hover:text-[#D62828] transition-colors">
              Home
            </a>
            <a href="#features" className="hover:text-[#D62828] transition-colors">
              Features
            </a>
            <a href="#workflow" className="hover:text-[#D62828] transition-colors">
              How It Works
            </a>
            <a href="#contact" className="hover:text-[#D62828] transition-colors">
              Contact
            </a>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            <Link
              to="/login"
              className="text-sm font-semibold text-[#222222] hover:text-[#D62828] px-3 py-2 rounded-lg transition-colors"
            >
              Login
            </Link>
            <button
              onClick={handleGetStarted}
              disabled={checkingSession}
              className="inline-flex items-center space-x-2 bg-[#D62828] hover:bg-[#b91c1c] text-white text-sm font-semibold px-4 py-2.5 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-75"
            >
              <span>{checkingSession ? "Verifying..." : "Get Started"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="hero" className="py-16 md:py-24 border-b border-[#E5E7EB] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            {/* Tagline pill */}
            <div className="inline-flex items-center space-x-2 bg-[#FFC928]/25 border border-[#FFC928]/60 px-3.5 py-1.5 rounded-full text-xs font-bold text-[#92400E] mb-6">
              <Sparkles className="w-3.5 h-3.5 text-[#D62828]" />
              <span>Next-Generation Restaurant Billing & POS</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-[#222222] tracking-tight leading-tight">
              Speed Up Your Restaurant Orders & Settle Bills with{" "}
              <span className="text-[#D62828]">BongPizza</span>
            </h1>

            <p className="mt-6 text-lg text-[#6B7280] leading-relaxed">
              An all-in-one POS software built for pizza parlors, cafes, and dine-in restaurants.
              Manage tables, send instant KOTs to the kitchen, record split payments, and print thermal receipts seamlessly.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={handleGetStarted}
                disabled={checkingSession}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-[#D62828] hover:bg-[#b91c1c] text-white font-bold px-8 py-3.5 rounded-xl shadow-xs transition-colors text-base"
              >
                <span>{checkingSession ? "Checking Session..." : "Open POS Dashboard"}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              <Link
                to="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-white hover:bg-[#FAFAFA] text-[#222222] border border-[#E5E7EB] font-bold px-8 py-3.5 rounded-xl transition-colors text-base"
              >
                <span>Biller Sign In</span>
              </Link>
            </div>

            {/* Quick trust metrics */}
            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 text-center border-t border-[#E5E7EB] pt-8">
              <div>
                <p className="text-2xl font-bold text-[#D62828]">⚡ &lt; 5s</p>
                <p className="text-xs text-[#6B7280] mt-1 font-medium">Order Punching Speed</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#222222]">100%</p>
                <p className="text-xs text-[#6B7280] mt-1 font-medium">GST & Tax Compliance</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#D62828]">Cash / UPI / Card</p>
                <p className="text-xs text-[#6B7280] mt-1 font-medium">Multi-Tender Settlement</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#222222]">58 / 80mm</p>
                <p className="text-xs text-[#6B7280] mt-1 font-medium">Thermal Print Ready</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-[#FFFDF8] border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#D62828]">
              Comprehensive POS Capabilities
            </h2>
            <p className="mt-2 text-3xl font-extrabold text-[#222222]">
              Engineered for Busy Restaurant Counters
            </p>
            <p className="mt-3 text-sm text-[#6B7280]">
              Every tool your restaurant staff needs to take orders, fulfill kitchen orders, and close daily accounts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="bg-white p-6 rounded-xl border border-[#E5E7EB] hover:border-[#FFC928] transition-colors">
              <div className="w-12 h-12 rounded-lg bg-[#FFC928]/20 flex items-center justify-center text-[#D62828] mb-4">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#222222]">Lightning Billing</h3>
              <p className="text-xs text-[#6B7280] mt-2 leading-relaxed">
                Fast order entry with category filters, keyboard friendliness, custom notes, and automatic CGST + SGST tax calculations.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-6 rounded-xl border border-[#E5E7EB] hover:border-[#FFC928] transition-colors">
              <div className="w-12 h-12 rounded-lg bg-[#FFC928]/20 flex items-center justify-center text-[#D62828] mb-4">
                <Grid className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#222222]">Table Management</h3>
              <p className="text-xs text-[#6B7280] mt-2 leading-relaxed">
                Organize dine-in tables into custom groups (Ground Floor, Terrace, AC Hall) with real-time occupancy status.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-6 rounded-xl border border-[#E5E7EB] hover:border-[#FFC928] transition-colors">
              <div className="w-12 h-12 rounded-lg bg-[#FFC928]/20 flex items-center justify-center text-[#D62828] mb-4">
                <ChefHat className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#222222]">Kitchen Order Tickets (KOT)</h3>
              <p className="text-xs text-[#6B7280] mt-2 leading-relaxed">
                Streamline order flow to the kitchen. Track ticket states from Pending to Preparing, Ready, and Served.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white p-6 rounded-xl border border-[#E5E7EB] hover:border-[#FFC928] transition-colors">
              <div className="w-12 h-12 rounded-lg bg-[#FFC928]/20 flex items-center justify-center text-[#D62828] mb-4">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#222222]">Multi-Tender Settlement</h3>
              <p className="text-xs text-[#6B7280] mt-2 leading-relaxed">
                Authoritative balance calculations. Settle orders via Cash, UPI, Card, or split tenders with full validation.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white p-6 rounded-xl border border-[#E5E7EB] hover:border-[#FFC928] transition-colors">
              <div className="w-12 h-12 rounded-lg bg-[#FFC928]/20 flex items-center justify-center text-[#D62828] mb-4">
                <Receipt className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#222222]">Thermal Receipts</h3>
              <p className="text-xs text-[#6B7280] mt-2 leading-relaxed">
                Generate clean, compliant tax receipts formatted for standard 58mm, 80mm roll paper, and A4 billing.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white p-6 rounded-xl border border-[#E5E7EB] hover:border-[#FFC928] transition-colors">
              <div className="w-12 h-12 rounded-lg bg-[#FFC928]/20 flex items-center justify-center text-[#D62828] mb-4">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#222222]">Sales Analytics & Reports</h3>
              <p className="text-xs text-[#6B7280] mt-2 leading-relaxed">
                Track gross sales, net collections, best-selling pizzas, and tender-wise breakdowns with custom date range filters.
              </p>
            </div>

            {/* Feature 7 */}
            <div className="bg-white p-6 rounded-xl border border-[#E5E7EB] hover:border-[#FFC928] transition-colors">
              <div className="w-12 h-12 rounded-lg bg-[#FFC928]/20 flex items-center justify-center text-[#D62828] mb-4">
                <Pizza className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#222222]">Menu Control</h3>
              <p className="text-xs text-[#6B7280] mt-2 leading-relaxed">
                Add, update, or toggle item availability instantaneously. Organize items into categories and control prices.
              </p>
            </div>

            {/* Feature 8 */}
            <div className="bg-white p-6 rounded-xl border border-[#E5E7EB] hover:border-[#FFC928] transition-colors">
              <div className="w-12 h-12 rounded-lg bg-[#FFC928]/20 flex items-center justify-center text-[#D62828] mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#222222]">Reliable Single-Role Auth</h3>
              <p className="text-xs text-[#6B7280] mt-2 leading-relaxed">
                Clean, role-simplified access control. Every authorized restaurant biller has access to all POS modules without friction.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section id="workflow" className="py-20 bg-white border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#D62828]">
              Seamless Restaurant Workflow
            </h2>
            <p className="mt-2 text-3xl font-extrabold text-[#222222]">
              From Order Creation to Payment Settlement
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center relative">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#FFC928] text-[#222222] font-black text-lg flex items-center justify-center mb-4">
                1
              </div>
              <h4 className="font-bold text-base text-[#222222]">Take Order</h4>
              <p className="text-xs text-[#6B7280] mt-2">
                Select Dine-in Table, Takeaway, or Delivery. Add items to cart with live tax calculation.
              </p>
            </div>

            <div className="text-center relative">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#FFC928] text-[#222222] font-black text-lg flex items-center justify-center mb-4">
                2
              </div>
              <h4 className="font-bold text-base text-[#222222]">Send to Kitchen</h4>
              <p className="text-xs text-[#6B7280] mt-2">
                Generate KOT for kitchen chefs. Track real-time preparation status from Pending to Ready.
              </p>
            </div>

            <div className="text-center relative">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#FFC928] text-[#222222] font-black text-lg flex items-center justify-center mb-4">
                3
              </div>
              <h4 className="font-bold text-base text-[#222222]">Settle Payment</h4>
              <p className="text-xs text-[#6B7280] mt-2">
                Open order in Live Orders. Record Cash, UPI, Card, or partial/split tenders with balance checks.
              </p>
            </div>

            <div className="text-center relative">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#D62828] text-white font-black text-lg flex items-center justify-center mb-4">
                4
              </div>
              <h4 className="font-bold text-base text-[#222222]">Print Receipt</h4>
              <p className="text-xs text-[#6B7280] mt-2">
                Instantly print clean GST receipt on 80mm or 58mm thermal printer for the customer.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 bg-[#FAFAFA] border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl border border-[#E5E7EB] text-center">
            <h3 className="text-2xl font-bold text-[#222222]">Have questions about BongPizza POS?</h3>
            <p className="text-sm text-[#6B7280] mt-2">
              Our restaurant support team is ready to help you set up thermal printing, menu items, and table layouts.
            </p>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-[#FFFDF8] border border-[#E5E7EB]">
                <Phone className="w-5 h-5 text-[#D62828]" />
                <div>
                  <p className="text-[11px] text-[#6B7280] font-medium">Support Hotline</p>
                  <p className="text-xs font-bold text-[#222222]">+91 98765 43210</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-lg bg-[#FFFDF8] border border-[#E5E7EB]">
                <Mail className="w-5 h-5 text-[#D62828]" />
                <div>
                  <p className="text-[11px] text-[#6B7280] font-medium">Email Enquiries</p>
                  <p className="text-xs font-bold text-[#222222]">support@bongpizza.com</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-lg bg-[#FFFDF8] border border-[#E5E7EB]">
                <MapPin className="w-5 h-5 text-[#D62828]" />
                <div>
                  <p className="text-[11px] text-[#6B7280] font-medium">Restaurant HQ</p>
                  <p className="text-xs font-bold text-[#222222]">Park Street, Kolkata</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#6B7280] gap-4">
          <div className="flex items-center space-x-2">
            <Pizza className="w-4 h-4 text-[#D62828]" />
            <span className="font-bold text-[#222222]">BongPizza POS System</span>
            <span>— Fast, Reliable Restaurant Software</span>
          </div>
          <div>
            © {new Date().getFullYear()} BongPizza. Light theme interface. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
